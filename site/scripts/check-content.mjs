import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { schemas, siteSchema, homeSchema } from '../src/lib/schemas.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const contentRoot = path.join(root, 'src/content');
const publicRoot = path.join(root, 'public');
const errors = [];
const collections = {};
const fixtureMarker = /synthetic-test-fixture|TEST ONLY|TEST FIXTURE|example-researcher|example-paper|example-project|example-note/i;
const report = (file, field, message) => errors.push(`${path.relative(root, file)}${field ? ` → ${field}` : ''}: ${message}`);

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory() ? filesIn(path.join(directory, entry.name)) : [path.join(directory, entry.name)]));
  return nested.flat().sort();
}

async function readRecord(file, schema) {
  try {
    const source = await readFile(file, 'utf8');
    const frontmatter = file.endsWith('.md') ? source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] : source;
    if (frontmatter === undefined) throw new Error('Markdown needs YAML frontmatter');
    const result = schema.safeParse(parse(frontmatter));
    if (!result.success) {
      for (const issue of result.error.issues) report(file, issue.path.join('.'), issue.message);
      return null;
    }
    return { file, source, data: result.data };
  } catch (error) {
    report(file, '', error.message);
    return null;
  }
}

async function checkAsset(file, field, target) {
  if (/^https?:\/\//.test(target)) return;
  if (!target.startsWith('/') || target.startsWith('//')) {
    report(file, field, 'Use an http(s) URL or a path starting at public root, such as /images/photo.jpg');
    return;
  }
  let local;
  try { local = decodeURIComponent(target.split(/[?#]/)[0]); }
  catch { report(file, field, `Invalid path encoding: ${target}`); return; }
  const filename = path.resolve(publicRoot, `.${local}`);
  if (!filename.startsWith(`${publicRoot}${path.sep}`) || !(await stat(filename).catch(() => null))?.isFile()) {
    report(file, field, `Missing public asset: ${target}`);
  }
}

function checkUrls(file, value, field = '') {
  if (typeof value === 'string') {
    if (/^(?:javascript|data|vbscript|file|ftp):/i.test(value.trim()) || value.startsWith('//')) {
      report(file, field, 'Unsafe or unsupported URL protocol');
    }
  } else if (Array.isArray(value)) value.forEach((item, i) => checkUrls(file, item, `${field}.${i}`));
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) checkUrls(file, item, field ? `${field}.${key}` : key);
}

for (const [name, schema] of Object.entries(schemas)) {
  const records = [];
  const ids = new Set();
  const slugs = new Set();
  for (const file of await filesIn(path.join(contentRoot, name))) {
    if (!/\.(?:md|ya?ml)$/.test(file)) continue;
    const record = await readRecord(file, schema);
    if (!record) continue;
    records.push(record);
    const { data, source } = record;
    if (ids.has(data.id)) report(file, 'id', `Duplicate ID: ${data.id}`);
    ids.add(data.id);
    if (path.basename(file).replace(/\.(?:md|ya?ml)$/, '') !== data.id) report(file, 'id', 'Filename must match the stable ID');
    if (data.slug && slugs.has(data.slug)) report(file, 'slug', `Duplicate slug: ${data.slug}`);
    if (data.slug) slugs.add(data.slug);
    if (fixtureMarker.test(source)) report(file, '', 'Synthetic fixtures belong in tests/, outside production content collections');
    checkUrls(file, data);
    if (data.photo) await checkAsset(file, 'photo', data.photo);
    if (data.cover) await checkAsset(file, 'cover', data.cover);
    const memberIds = data.memberships?.map(item => item.id) ?? [];
    if (memberIds.length !== new Set(memberIds).size) report(file, 'memberships', 'Membership IDs must be unique within a person');
    for (const match of source.matchAll(/(?:!?\[[^\]]*\]\(\s*<?([^\s)>]+)|(?:href|src)\s*=\s*["']([^"']+)["'])/g)) {
      const target = match[1] ?? match[2];
      checkUrls(file, target, 'body link');
      if (target.startsWith('/') && !target.startsWith('//') && /\.[a-z0-9]{2,8}(?:[?#]|$)/i.test(target)) await checkAsset(file, 'body asset', target);
    }
  }
  collections[name] = records;
}

function checkReference(record, field, targetCollection, id, requirePublic = record.data.visibility === 'public') {
  const target = collections[targetCollection].find(item => item.data.id === id);
  if (!target) report(record.file, field, `Unknown ${targetCollection} ID: ${id}`);
  else if (requirePublic && target.data.visibility !== 'public') report(record.file, field, `Public content cannot reference draft ${targetCollection} record: ${id}`);
}

for (const record of collections.projects) {
  record.data.publicationIds.forEach((id, index) => checkReference(record, `publicationIds.${index}`, 'publications', id));
}
for (const record of collections.publications) {
  record.data.authors.forEach((author, index) => {
    if (author.personId) checkReference(record, `authors.${index}.personId`, 'people', author.personId);
  });
}
for (const id of ['home', 'lab', 'teaching', 'service', 'join']) {
  const page = collections.pages.find(record => record.data.id === id);
  if (!page || page.data.visibility !== 'public') report(path.join(contentRoot, 'pages', `${id}.md`), 'visibility', 'Required page must exist and be explicitly public');
}

for (const record of collections.translations) {
  const originals = [...collections.pages, ...collections.projects].filter(item => item.data.id === record.data.id);
  if (originals.length !== 1 || originals[0].data.visibility !== 'public') {
    report(record.file, 'id', 'A translation needs one matching public page or project');
    continue;
  }
  const original = originals[0].data;
  for (const key of Object.keys(record.data.text)) {
    if (!(key in original)) report(record.file, `text.${key}`, 'Translated field does not exist on the original');
  }
  for (const field of ['pillars', 'evidence']) {
    const translated = record.data.text[field];
    if (translated && translated.length !== original[field]?.length) report(record.file, `text.${field}`, 'Translation must preserve the original item count and order');
  }
  const merged = {...original, ...record.data.text};
  if (merged.coverLinkText && !merged.coverCaption?.includes(merged.coverLinkText)) report(record.file, 'text.coverCaption', 'Caption must contain its link text');
}
for (const original of [...collections.pages, ...collections.projects].filter(item => item.data.visibility === 'public')) {
  if (!collections.translations.some(item => item.data.id === original.data.id)) report(original.file, 'id', 'Missing Chinese translation');
}

const site = await readRecord(path.join(root, 'src/data/site.yaml'), siteSchema);
if (site) {
  checkUrls(site.file, site.data);
  await checkAsset(site.file, 'photo', site.data.photo);
}
const homepage = await readRecord(path.join(root, 'src/data/homepage.yaml'), homeSchema);
if (homepage) {
  for (const [field, collection] of [['featuredProjectIds', 'projects'], ['featuredNoteIds', 'notes'], ['featuredResourceIds', 'resources']]) {
    homepage.data[field].forEach((id, index) => checkReference(homepage, `${field}.${index}`, collection, id, true));
  }
}

if (errors.length) {
  console.error(`Content validation failed (${errors.length}):\n${errors.map(error => `  ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Content validation passed: ${Object.entries(collections).map(([name, records]) => `${records.length} ${name}`).join(', ')}; site and homepage configuration.`);
}
