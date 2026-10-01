import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, mkdir, open, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const siteRoot = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const assetFolders = ['files', 'images', 'assets', 'data'];
const requiredAssets = ['files/pdf/CV.pdf', 'files/pdf/research/ISSRE16.pdf'];
const sensitiveName = /(?:^|[._-])(?:credentials?|secrets?|tokens?|auth|authentication|oauth|passwords?|service[._-]account|client[._-]secret|id[._-](?:rsa|dsa|ecdsa|ed25519)|authorized[._-]keys|known[._-]hosts)(?:[._-]|$)|\.(?:pem|key|p12|pfx|jks|keystore|kdbx)$/i;
const info = filename => lstat(filename).catch(error => {
  if (error.code === 'ENOENT') return null;
  throw error;
});

async function checkPath(root, relative) {
  let current = root;
  const parts = relative.split('/');
  for (let index = 0; index < parts.length; index++) {
    current = path.join(current, parts[index]);
    const entry = await info(current);
    if (entry?.isSymbolicLink()) throw new Error(`Symbolic link is not permitted: ${current}`);
    if (entry && index < parts.length - 1 && !entry.isDirectory()) throw new Error(`Expected directory: ${current}`);
  }
  return info(current);
}

async function readRegular(filename) {
  const handle = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    if (!(await handle.stat()).isFile()) throw new Error(`Expected regular file: ${filename}`);
    return await handle.readFile();
  } finally { await handle.close(); }
}

export async function prepareLegacyAssets(sourceDirectory, outputDirectory = path.join(siteRoot, 'dist')) {
  if (!sourceDirectory) throw new Error('Pass the old repository root explicitly: node scripts/prepare-legacy-assets.mjs ..');
  for (const directory of [sourceDirectory, outputDirectory]) {
    const entry = await info(path.resolve(directory));
    if (!entry?.isDirectory() || entry.isSymbolicLink()) throw new Error(`Expected an existing, non-symlink directory: ${directory}`);
  }
  const source = await realpath(sourceDirectory);
  const output = await realpath(outputDirectory);
  if (source === siteRoot || source.startsWith(`${siteRoot}${path.sep}`) || source === output || source.startsWith(`${output}${path.sep}`)) {
    throw new Error('The legacy source must be the old repository, outside the new site and its build output');
  }
  const index = await checkPath(output, 'index.html');
  if (!index?.isFile()) throw new Error('Build the production site before preparing legacy assets');
  const git = async args => (await exec('git', ['-C', source, ...args], { maxBuffer: 8 * 1024 * 1024 })).stdout.trim();
  if (await realpath(await git(['rev-parse', '--show-toplevel'])) !== source) throw new Error('Pass the repository root, not a subdirectory');
  const hashAlgorithm = await git(['rev-parse', '--show-object-format']);
  const { stdout: tree } = await exec('git', ['-C', source, 'ls-tree', '-rz', 'HEAD', '--', ...assetFolders], { maxBuffer: 8 * 1024 * 1024 });
  const plan = [];
  const counts = Object.fromEntries(assetFolders.map(folder => [folder, 0]));
  let skipped = 0;
  let unchanged = 0;
  for (const record of tree.split('\0').filter(Boolean)) {
    const match = record.match(/^(\d+) blob ([\da-f]+)\t([\s\S]+)$/);
    if (!match) { skipped++; continue; }
    const [, mode, objectId, relative] = match;
    const parts = relative.split('/');
    if (!['100644', '100755'].includes(mode) || !assetFolders.includes(parts[0]) || parts.some(part => part.startsWith('.') || sensitiveName.test(part))) {
      skipped++;
      continue;
    }
    const sourceEntry = await checkPath(source, relative);
    if (!sourceEntry?.isFile()) throw new Error(`Missing tracked legacy asset: ${relative}`);
    const content = await readRegular(path.join(source, relative));
    const hash = createHash(hashAlgorithm).update(`blob ${content.length}\0`).update(content).digest('hex');
    if (hash !== objectId) throw new Error(`Legacy asset differs from committed HEAD: ${relative}`);
    const destination = path.join(output, relative);
    const existing = await checkPath(output, relative);
    if (existing) {
      if (!existing.isFile() || !(await readRegular(destination)).equals(content)) throw new Error(`Refusing to overwrite different build content: ${relative}`);
      unchanged++;
    }
    plan.push({ relative, destination, content, existing: Boolean(existing) });
  }
  for (const required of requiredAssets) {
    if (!plan.some(item => item.relative === required)) throw new Error(`Required legacy asset is missing: ${required}`);
  }
  const marker = path.join(output, '.nojekyll');
  const existingMarker = await checkPath(output, '.nojekyll');
  if (existingMarker && (!existingMarker.isFile() || (await readRegular(marker)).length)) throw new Error('Refusing to overwrite different build content: .nojekyll');
  // No output changes occur until the full source and every destination are checked.
  for (const item of plan.filter(item => !item.existing)) {
    await checkPath(output, item.relative);
    await mkdir(path.dirname(item.destination), { recursive: true });
    await writeFile(item.destination, item.content, { flag: 'wx' });
    counts[item.relative.split('/')[0]]++;
  }
  if (!existingMarker) await writeFile(marker, '', { flag: 'wx' });
  return { copied: Object.values(counts).reduce((sum, count) => sum + count, 0), byFolder: counts, unchanged, skipped, requiredAssets };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await prepareLegacyAssets(process.argv[2]);
    console.log(`Legacy assets prepared: ${JSON.stringify(result)}; .nojekyll present.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
