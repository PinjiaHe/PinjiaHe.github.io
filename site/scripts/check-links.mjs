import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const production = process.argv.includes('--production');
const origin = production ? 'https://pinjiahe.github.io' : 'http://prototype.local';
const errors = [];
const report = (file, message) => errors.push(`${path.relative(dist, file)}: ${message}`);

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? filesIn(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat();
}
const decode = text => text.replace(/&(?:amp|quot|apos|lt|gt|#(\d+)|#x([\da-f]+));/gi, (entity, decimal, hex) => {
  if (decimal || hex) return String.fromCodePoint(parseInt(decimal ?? hex, decimal ? 10 : 16));
  return ({ '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' })[entity.toLowerCase()] ?? entity;
});
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(match => [match[1].toLowerCase(), decode(match[2] ?? match[3] ?? match[4])]));
}

const files = await filesIn(dist);
// Preserved legacy assets are checked as link targets, not as new page templates.
const htmlFiles = files.filter(file => file.endsWith('.html') && !/^(?:files|images|assets|data)\//.test(path.relative(dist, file).split(path.sep).join('/')));
if (!htmlFiles.length) {
  console.error('No generated HTML found in dist/. Run npm run build first.');
  process.exit(1);
}
const html = new Map(await Promise.all(htmlFiles.map(async file => [file, await readFile(file, 'utf8')])));
const robotsFile = path.join(dist, 'robots.txt');
const robots = await readFile(robotsFile, 'utf8').catch(() => '');
const expectedRobots = `User-agent: *\nDisallow: ${production ? '' : '/'}\n`;
if (robots !== expectedRobots) report(robotsFile, `Expected ${production ? 'production crawl access' : 'preview crawl blocking'}`);
const ids = new Map([...html].map(([file, source]) => [file, new Set([...source.matchAll(/<[a-z][^>]*>/gi)].flatMap(match => {
  const attrs = attributes(match[0]);
  return [attrs.id, /^<a\b/i.test(match[0]) ? attrs.name : null].filter(Boolean);
}))]));

// Draft identities are read from source, never imported into the application bundle.
const drafts = [];
for (const folder of ['src/content', 'tests/fixtures']) {
  for (const file of await filesIn(path.join(root, folder))) {
    if (!/\.(?:md|ya?ml)$/.test(file)) continue;
    const source = await readFile(file, 'utf8');
    const data = parse(file.endsWith('.md') ? source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] ?? '' : source);
    if (data && data.visibility !== 'public') drafts.push(...[data.id, data.slug, data.title].filter(Boolean));
  }
}

let checkedLinks = 0;
for (const [file, source] of html) {
  const relative = path.relative(dist, file).split(path.sep).join('/');
  const route = relative === 'index.html' ? '/' : `/${relative.replace(/index\.html$/, '')}`;
  if ((source.match(/<h1(?:\s|>)/gi) ?? []).length !== 1) report(file, 'Expected exactly one main h1');
  const tags = [...source.matchAll(/<[a-z][^>]*>/gi)].map(match => match[0]);
  const robotsTags = tags.filter(tag => /^<meta\b/i.test(tag) && attributes(tag).name === 'robots').map(attributes);
  const canonicalTags = tags.filter(tag => /^<link\b/i.test(tag) && attributes(tag).rel === 'canonical').map(attributes);
  const refreshTags = tags.filter(tag => /^<meta\b/i.test(tag) && attributes(tag)['http-equiv']?.toLowerCase() === 'refresh').map(attributes);
  const redirectTarget = refreshTags[0]?.content?.match(/^0;url=(\/[^\s]*)$/)?.[1];
  if (refreshTags.length && (refreshTags.length !== 1 || !redirectTarget || redirectTarget.startsWith('//'))) report(file, 'Expected one static redirect to an internal URL');
  if (redirectTarget && !tags.some(tag => /^<a\b/i.test(tag) && attributes(tag).href === redirectTarget)) report(file, 'Static redirect must include a clickable target link');
  const canIndex = production && relative !== '404.html';
  const expectedDirectives = canIndex ? 'index, follow' : 'noindex, nofollow';
  if (robotsTags.length !== 1 || robotsTags[0].content !== expectedDirectives) report(file, `Expected robots ${expectedDirectives}`);
  if (canIndex) {
    const destination = new URL(redirectTarget ?? route, origin);
    destination.hash = '';
    const expectedCanonical = destination.href;
    if (canonicalTags.length !== 1 || canonicalTags[0].href !== expectedCanonical) report(file, `Expected canonical ${expectedCanonical}`);
  } else if (canonicalTags.length) report(file, 'Preview and 404 pages must not advertise a canonical URL');
  if (/TEST ONLY|TEST FIXTURE|synthetic-test-fixture|example-researcher|class rank:\s*3\/120|data-draft|DRAFT PREVIEW/i.test(source)) report(file, 'Test identity, synthetic rank, or draft marker reached the build');
  for (const marker of new Set(drafts)) if (source.includes(marker)) report(file, `Draft content reached the build: ${marker}`);
  for (const tag of tags) {
    const attrs = attributes(tag);
    for (const key of ['href', 'src']) {
      if (!(key in attrs)) continue;
      const target = attrs[key].trim();
      if (!target || target === '#') { report(file, `Empty ${key} or placeholder link`); continue; }
      if (/^https?:\/\//i.test(target)) {
        try { if (!production || new URL(target).origin !== origin) continue; }
        catch { report(file, `Malformed link: ${target}`); continue; }
      }
      if (/^mailto:/i.test(target) && key === 'href') {
        if (!/^mailto:[^\s@?]+@[^\s@?]+(?:\?.*)?$/.test(target)) report(file, `Invalid mail link: ${target}`);
        continue;
      }
      if ((/^[a-z][a-z\d+.-]*:/i.test(target) && !/^https?:\/\//i.test(target)) || target.startsWith('//')) { report(file, `Unsupported link protocol: ${target}`); continue; }
      checkedLinks++;
      let url;
      let pathname;
      try { url = new URL(target, `${origin}${route}`); pathname = decodeURIComponent(url.pathname); }
      catch { report(file, `Malformed link: ${target}`); continue; }
      const base = path.resolve(dist, `.${pathname}`);
      if (!base.startsWith(`${dist}${path.sep}`) && base !== dist) { report(file, `Link escapes build: ${target}`); continue; }
      const candidates = [base, path.join(base, 'index.html'), `${base}.html`];
      let found;
      for (const candidate of candidates) if ((await stat(candidate).catch(() => null))?.isFile()) { found = candidate; break; }
      if (!found) { report(file, `Missing internal ${key}: ${target}`); continue; }
      if (url.hash && ids.has(found)) {
        let fragment;
        try { fragment = decodeURIComponent(url.hash.slice(1)); } catch { report(file, `Malformed fragment: ${target}`); continue; }
        if (!ids.get(found).has(fragment)) report(file, `Missing anchor: ${target}`);
      }
    }
  }
}
// Ensure draft routes/text are absent from generated manifests and scripts too.
for (const file of files.filter(file => /\.(?:xml|json|js)$/.test(file))) {
  const source = await readFile(file, 'utf8');
  for (const marker of new Set(drafts)) if (source.includes(marker)) report(file, `Draft content reached a generated asset: ${marker}`);
}
if (errors.length) {
  console.error(`Build link validation failed (${errors.length}):\n${errors.map(error => `  ${error}`).join('\n')}`);
  process.exitCode = 1;
} else console.log(`Build link validation passed (${production ? 'production' : 'preview'}): ${htmlFiles.length} HTML pages and ${checkedLinks} internal links/assets; one h1, expected robots/canonical, and no draft/test leakage. External URL availability was not checked.`);
