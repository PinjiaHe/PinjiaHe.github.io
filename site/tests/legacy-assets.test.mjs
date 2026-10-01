import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prepareLegacyAssets } from '../scripts/prepare-legacy-assets.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'homepage-legacy-assets-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'old');
  const output = path.join(root, 'new/dist');
  await mkdir(source);
  await mkdir(output, { recursive: true });
  const put = async (relative, content = relative, base = source) => {
    const filename = path.join(base, relative);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, content);
  };
  await put('index.html', '<h1>New site</h1>', output);
  await put('files/pdf/CV.pdf');
  await put('files/pdf/research/ISSRE16.pdf');
  const git = (...args) => execFileSync('git', ['-C', source, ...args], { stdio: 'ignore' });
  git('init', '-q');
  const commit = () => {
    git('add', '.');
    git('-c', 'user.name=Asset test', '-c', 'user.email=asset-test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Test public assets');
  };
  return { source, output, put, commit };
}

test('copies committed public assets, preserves historical HTML, skips hidden/auth/untracked files and symlinks', async t => {
  const { source, output, put, commit } = await fixture(t);
  await put('files/history.html', '<p>Old content</p>');
  await put('images/photo.jpg');
  await put('assets/site.css');
  await put('data/papers.json', '[]');
  for (const file of ['files/.env', 'assets/.private/key.txt', 'data/credentials.json', 'files/private.key', 'data/service-account.json', 'src/not-an-asset.txt']) await put(file);
  await symlink('pdf/CV.pdf', path.join(source, 'files/link.pdf'));
  await symlink('../images', path.join(source, 'assets/link-directory'));
  commit();
  await put('files/untracked.txt');
  const result = await prepareLegacyAssets(source, output);
  assert.deepEqual(result.byFolder, { files: 3, images: 1, assets: 1, data: 1 });
  assert.equal(result.copied, 6);
  assert.equal(await readFile(path.join(output, 'files/history.html'), 'utf8'), '<p>Old content</p>');
  for (const file of ['files/.env', 'assets/.private/key.txt', 'data/credentials.json', 'files/private.key', 'data/service-account.json', 'src/not-an-asset.txt', 'files/link.pdf', 'assets/link-directory', 'files/untracked.txt']) {
    await assert.rejects(access(path.join(output, file)), { code: 'ENOENT' });
  }
  assert.equal(await readFile(path.join(output, '.nojekyll'), 'utf8'), '');
  const repeated = await prepareLegacyAssets(source, output);
  assert.equal(repeated.copied, 0);
  assert.equal(repeated.unchanged, 6);
});

test('conflicting new assets abort before any copies and never overwrite the new content', async t => {
  const { source, output, put, commit } = await fixture(t);
  await put('images/photo.jpg', 'old image');
  await put('images/photo.jpg', 'new image', output);
  commit();
  await assert.rejects(prepareLegacyAssets(source, output), /Refusing to overwrite/);
  assert.equal(await readFile(path.join(output, 'images/photo.jpg'), 'utf8'), 'new image');
  await assert.rejects(access(path.join(output, 'files/pdf/CV.pdf')), { code: 'ENOENT' });
  await assert.rejects(access(path.join(output, '.nojekyll')), { code: 'ENOENT' });
});

test('rejects a symlink destination instead of writing outside dist', async t => {
  const { source, output, put, commit } = await fixture(t);
  await put('images/photo.jpg');
  commit();
  await symlink(path.join(source, 'images'), path.join(output, 'images'));
  await assert.rejects(prepareLegacyAssets(source, output), /Symbolic link/);
  await assert.rejects(access(path.join(output, 'files/pdf/CV.pdf')), { code: 'ENOENT' });
});

test('requires both published PDFs and rejects modified working files', async t => {
  const { source, output, put, commit } = await fixture(t);
  await rm(path.join(source, 'files/pdf/CV.pdf'));
  commit();
  await assert.rejects(prepareLegacyAssets(source, output), /Required legacy asset is missing: files\/pdf\/CV.pdf/);
  await put('files/pdf/CV.pdf');
  commit();
  await put('files/pdf/CV.pdf', 'uncommitted replacement');
  await assert.rejects(prepareLegacyAssets(source, output), /differs from committed HEAD/);
  await assert.rejects(access(path.join(output, '.nojekyll')), { code: 'ENOENT' });
});
