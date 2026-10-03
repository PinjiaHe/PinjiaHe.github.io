import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4321';
const out = new URL('../../docs/screenshots/', import.meta.url);
const widths = [1440, 981, 846, 768, 390, 360];
const errors = [];
const records = [];
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });

async function checkPage(page, route, width) {
  const response = await page.goto(new URL(route, base).href);
  assert.equal(response?.status(), 200, `${route}: HTTP status`);
  await page.locator('h1').waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    const images = [...document.images];
    images.forEach(image => { image.loading = 'eager'; });
    await Promise.all(images.map(image => image.decode().catch(() => {})));
  });
  assert.equal(await page.locator('h1').count(), 1, `${route}: one page heading`);
  assert.ok((await page.title()).trim(), `${route}: page title`);
  assert.ok((await page.locator('html').getAttribute('lang'))?.trim(), `${route}: document language`);
  assert.ok((await page.locator('main').innerText()).trim(), `${route}: primary content`);
  const state = await page.evaluate(() => ({
    viewport: innerWidth,
    scroll: document.documentElement.scrollWidth,
    brokenImages: [...document.images].filter(image => !image.complete || !image.naturalWidth).length,
    missingAlt: [...document.images].filter(image => !image.hasAttribute('alt')).length,
    ids: [...document.querySelectorAll('[id]')].map(element => element.id),
  }));
  assert.ok(state.scroll <= state.viewport, `${route} at ${width}px: no horizontal overflow`);
  assert.equal(state.brokenImages, 0, `${route}: images load`);
  assert.equal(state.missingAlt, 0, `${route}: image alternative text attributes`);
  assert.equal(new Set(state.ids).size, state.ids.length, `${route}: unique element IDs`);
}

try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(new URL('/research/', base).href);
  const projectRoutes = await page.locator('.project-card h3 a[href^="/research/"]')
    .evaluateAll(links => links.map(link => new URL(link.href).pathname));
  const routes = [...new Set(['/', '/lab/', '/join/', '/research/', '/publications/', '/notes/', ...projectRoutes])];

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await checkPage(page, route, width);
      records.push({ route, width, status: 200, overflow: false });
      if (route === '/' && [1440, 390].includes(width)) {
        await page.screenshot({ path: new URL(`home-${width}.png`, out).pathname, fullPage: true });
      }
    }
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base);
  const navigationHrefs = await page.locator('.desktop-nav a:not([data-language-switch])').evaluateAll(links => links.map(link => link.getAttribute('href')));
  assert.ok(navigationHrefs.length > 0, 'Desktop navigation contains links');
  for (const [index, href] of navigationHrefs.entries()) {
    await page.locator('.desktop-nav a:not([data-language-switch])').nth(index).click();
    assert.equal(new URL(page.url()).pathname, new URL(href, base).pathname, 'Desktop navigation opens its destination');
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  const menu = page.locator('.mobile-menu');
  const summary = menu.locator('summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  assert.equal(await menu.getAttribute('open'), '', 'Keyboard opens the mobile menu');
  await page.keyboard.press('Escape');
  assert.equal(await menu.getAttribute('open'), null, 'Escape closes the mobile menu');
  assert.equal(await summary.evaluate(element => element === document.activeElement), true, 'Escape returns focus to the menu');
  await summary.click();
  const mobileLink = menu.locator('nav a').first();
  const mobileDestination = new URL(await mobileLink.getAttribute('href'), base).pathname;
  await mobileLink.click();
  assert.equal(new URL(page.url()).pathname, mobileDestination, 'Mobile navigation opens its destination');

  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const plain = await noJS.newPage();
    plain.on('pageerror', error => errors.push(error.message));
    plain.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    for (const route of routes) await checkPage(plain, route, 390);
    await plain.goto(base);
    const plainMenu = plain.locator('.mobile-menu');
    await plainMenu.locator('summary').click();
    const plainLink = plainMenu.locator('nav a').first();
    const plainDestination = new URL(await plainLink.getAttribute('href'), base).pathname;
    await plainLink.click();
    assert.equal(new URL(plain.url()).pathname, plainDestination, 'Mobile navigation works without JavaScript');
  } finally {
    await noJS.close();
  }

  const draft = await page.request.get(new URL('/notes/markdown-layout-test/', base).href);
  assert.equal(draft.status(), 404, 'Test drafts are absent from a normal preview');
  assert.deepEqual(errors, [], 'No browser console or page errors');
  const report = {
    checkedAt: new Date().toISOString(),
    routes: records,
    checks: [
      'Responsive pages return HTTP 200 and have a title, language, one main heading and primary content',
      'Images load, alternative text attributes exist, element IDs are unique and pages have no horizontal overflow',
      'Desktop and mobile navigation open their destinations',
      'The mobile menu supports Enter, Escape and focus restoration',
      'Primary content, images and mobile navigation work without JavaScript',
      'Normal previews exclude test drafts and have no browser console or page errors',
    ],
    screenshots: 'docs/screenshots',
    errors,
  };
  await writeFile(new URL('../browser-check-results.json', out), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ pages: records.length, checks: report.checks, screenshots: report.screenshots, errors }, null, 2));
} finally {
  await browser.close();
}
