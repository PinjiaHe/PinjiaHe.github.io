import test from 'node:test';
import assert from 'node:assert/strict';
import { englishPath, languageSwitchHref, localeFromPath, localizeHref } from '../src/lib/locale.ts';
import { translationSchema } from '../src/lib/schemas.ts';

test('main pages and stable detail slugs switch languages in both directions', () => {
  const routes = ['/', '/research/', '/research/openrca/', '/lab/', '/join/', '/publications/', '/notes/', '/notes/a-future-note/'];
  for (const route of routes) {
    const chinese = `/zh${route}`;
    assert.equal(localizeHref(route, 'en'), route);
    assert.equal(localizeHref(route, 'zh'), chinese);
    assert.equal(localizeHref(chinese, 'zh'), chinese, 'localizing twice must not add a second prefix');
    assert.equal(localizeHref(chinese, 'en'), route);
    assert.equal(languageSwitchHref(route), chinese);
    assert.equal(languageSwitchHref(chinese), route);
  }
});

test('language switches preserve query strings and stable section anchors', () => {
  const routes = [
    '/?from=profile#teaching',
    '/research/?from=home#ai-for-software-engineering',
    '/research/openrca/?from=home&view=full#reasoning-across-evidence',
    '/lab/#jialun-cao',
    '/publications/?year=2025#openrca-2025',
    '/notes/a-future-note/?ref=lab#%E4%B8%AD%E6%96%87',
  ];
  for (const route of routes) {
    const chinese = `/zh${route}`;
    assert.equal(localizeHref(route, 'zh'), chinese);
    assert.equal(localizeHref(chinese, 'en'), route);
    assert.equal(languageSwitchHref(languageSwitchHref(route)), route);
  }
});

test('assets, external destinations, old URLs and unknown routes keep their original addresses', () => {
  const unchanged = [
    '/files/pdf/CV.pdf', '/images/projects/openrca.png?size=large', '/favicon.svg',
    '/_astro/site.css', '/robots.txt', '/team/#people', '/teaching/', '/services/',
    '/cv/', '/resume/', '/about/', '/about.html', '/publication/2025-ICLR/',
    '/404.html', '/missing/', '/research/openrca/data.csv',
    'https://pinjiahe.github.io/research/openrca/', 'https://example.org/paper.pdf',
    '//example.org/resource', 'mailto:researcher@example.org', '#people', '../notes/',
  ];
  for (const href of unchanged) {
    assert.equal(localizeHref(href, 'zh'), href);
    assert.equal(localizeHref(href, 'en'), href);
  }
});

test('locale detection only recognizes the complete leading zh path segment', () => {
  for (const route of ['/zh', '/zh/', '/zh/research/openrca/']) assert.equal(localeFromPath(route), 'zh');
  for (const route of ['/', '/research/', '/zhish/', '/zh-CN/', '/research/zh/']) assert.equal(localeFromPath(route), 'en');
  assert.equal(englishPath('/zh/'), '/');
  assert.equal(englishPath('/zh'), '/');
  assert.equal(englishPath('/zh/research/openrca/'), '/research/openrca/');
  assert.equal(englishPath('/zhish/'), '/zhish/');
});

test('public prose overlays permit translated text without duplicating the original facts', () => {
  const record = {
    id: 'openrca', visibility: 'public',
    text: { summary: '根据系统遥测数据定位软件故障的根因。', evidence: [{ label: '公开评测', text: '使用原基准及其评分方法。' }] },
  };
  assert.deepEqual(translationSchema.parse(record), record);
  const page = { id: 'home', visibility: 'public', text: { pillars: [{ title: '研究方向', description: '方法与工具。' }] } };
  assert.deepEqual(translationSchema.parse(page), page);
});

test('translation overlays cannot replace identity, references, links or quantitative facts', () => {
  const facts = {
    id: 'different-project', slug: 'different-project', visibility: 'draft',
    publicationIds: ['different-paper'], links: { paper: 'https://example.org/paper' },
    sources: ['https://example.org/source'], sourceSnapshotDate: '2026-10-03',
    themes: ['different-theme'], githubStars: { count: 999 }, citations: { count: 999 },
    cover: '/images/different.png', coverSourceUrl: 'https://example.org/chart',
    memberships: [], order: 1,
  };
  for (const [field, value] of Object.entries(facts)) {
    assert.equal(translationSchema.safeParse({ id: 'openrca', visibility: 'public', text: { [field]: value } }).success, false, field);
  }
  assert.equal(translationSchema.safeParse({ id: 'openrca', visibility: 'public', text: {}, links: facts.links }).success, false);
});

test('translated lists cannot override stable anchors or evidence provenance', () => {
  assert.equal(translationSchema.safeParse({
    id: 'home', visibility: 'public', text: { pillars: [{ id: 'changed-anchor', title: '方向', description: '说明' }] },
  }).success, false);
  for (const [field, value] of Object.entries({
    sourceUrl: 'https://example.org/source', asOf: '2026-10-03', value: '999',
    kind: 'industry-use', organizations: [{ name: 'Different organization' }],
  })) {
    assert.equal(translationSchema.safeParse({
      id: 'openrca', visibility: 'public', text: { evidence: [{ label: '证据', [field]: value }] },
    }).success, false, field);
  }
});

test('translations require explicit public status and nonempty translated fields', () => {
  assert.equal(translationSchema.safeParse({ id: 'home', text: { title: '首页' } }).success, false);
  assert.equal(translationSchema.safeParse({ id: 'home', visibility: 'draft', text: { title: '首页' } }).success, false);
  assert.equal(translationSchema.safeParse({ id: 'home', visibility: 'public', text: { title: ' ' } }).success, false);
});
