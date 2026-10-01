import { chromium } from 'playwright';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4321';
const out = new URL('../../docs/screenshots/', import.meta.url);
const publicationAnnotations = JSON.parse(await readFile(new URL('../../docs/publications-annotations-source-records.json', import.meta.url), 'utf8')).changes;
const labPaperUpdates = [
  ...JSON.parse(await readFile(new URL('../../docs/lab-more-papers2-source-records.json', import.meta.url), 'utf8')).records,
  ...JSON.parse(await readFile(new URL('../../docs/lab-publication-followup-source-records.json', import.meta.url), 'utf8')).records,
];
const internExpansion = JSON.parse(await readFile(new URL('../../docs/lab-interns-expansion-source-records.json', import.meta.url), 'utf8'));
const photoFiles = (await readdir(new URL('../src/assets/lab/',import.meta.url)))
  .filter(filename => /\.(?:jpe?g|png|webp|avif)$/i.test(filename))
  .sort((a,b) => a.localeCompare(b,'en',{numeric:true}));
assert.ok(photoFiles.length>1,'The current Lab gallery has multiple photos for slideshow checks');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const records = [];
async function checkProjectFigure(figure, project) {
  assert.equal(await figure.count(),1,`${project}: one project figure`);
  const alt = await figure.locator('img').getAttribute('alt');
  const caption = (await figure.locator('figcaption').innerText()).trim();
  assert.ok(alt?.trim(),`${project}: descriptive image alt`);
  assert.ok(caption,`${project}: image caption`);
  const source = figure.locator('figcaption a');
  if (project === 'OpenRCA') {
    assert.equal(await source.count(),1,`${project}: one caption source link`);
    assert.match(await source.getAttribute('href'),/^https:\/\//,`${project}: caption links to public source`);
    assert.equal((await source.innerText()).trim(),'Claude Opus 4.6','Only the model name is linked in the OpenRCA caption');
    assert.equal(new URL(await source.getAttribute('href')).hostname,'www.anthropic.com','OpenRCA caption links to Anthropic');
    assert.notEqual(caption,'Claude Opus 4.6','OpenRCA caption retains the surrounding unlinked context');
  }
  if (project === 'CipherChat') {
    assert.equal(await source.count(),0,'CipherChat caption is plain text');
    assert.match(caption,/GPT/i,'CipherChat caption explains communication with GPT');
    assert.match(caption,/cipher|encrypt/i,'CipherChat caption describes encoded text');
    assert.match(caption,/decod/i,'CipherChat caption describes decoding the response');
    assert.doesNotMatch(`${alt} ${caption}`,/bar charts?|11 safety domains|\bresults\b/i,'CipherChat uses the overview illustration rather than the earlier results chart');
  }
}
const carouselSelector = '.lab-photo-carousel';
const activeSlide = page => page.locator(`${carouselSelector} .lab-photo-slide:not([hidden])`);
async function slideIndex(page) {
  assert.equal(await activeSlide(page).count(),1,'Exactly one carousel photo is visible');
  return page.locator(`${carouselSelector} .lab-photo-slide`).evaluateAll(slides => slides.findIndex(slide => !slide.hidden));
}
async function waitForNextSlide(page, previous) {
  await page.waitForFunction(({selector,previous}) => {
    const slides = [...document.querySelectorAll(`${selector} .lab-photo-slide`)];
    return slides.findIndex(slide => !slide.hidden) !== previous;
  },{selector:carouselSelector,previous},{timeout:6500});
  assert.equal(await slideIndex(page),(previous+1)%photoFiles.length,'Automatic playback advances by one photo');
}
async function assertControlsExposed(page, exposed) {
  await page.waitForFunction(({selector,exposed}) => {
    const controls = document.querySelector(`${selector} .lab-photo-controls`);
    const style = getComputedStyle(controls);
    const shown = !controls.hidden && style.display!=='none' && style.visibility==='visible' && Number(style.opacity)>0.99;
    const concealed = controls.hidden || style.display==='none' || style.visibility==='hidden' || Number(style.opacity)<0.01;
    return exposed ? shown : concealed;
  },{selector:carouselSelector,exposed},{timeout:2000});
}
async function assertPhotoDisplay(page) {
  const carousel = page.getByRole('region',{name:'Lab photos',exact:true});
  assert.equal(await carousel.count(),1,'Lab photos have an accessible carousel region');
  assert.equal(await carousel.locator('.lab-photo-slide').count(),photoFiles.length,'All supported photos from the Lab folder are included');
  assert.equal(await carousel.locator('.lab-photo-controls button').count(),2,'Carousel provides only previous and next arrow controls');
  assert.equal(await carousel.locator('[data-photo-toggle]').count(),0,'No play or pause button remains');
  for (const button of await carousel.locator('.lab-photo-controls button').all()) {
    assert.equal((await button.innerText()).trim(),'','Photo arrows have no visible text');
    assert.equal(await button.locator('svg[aria-hidden="true"]').count(),1,'Each arrow has one decorative SVG');
    const style = await button.evaluate(element => {
      const computed = getComputedStyle(element);
      return {background:computed.backgroundColor,border:computed.borderWidth};
    });
    assert.equal(style.background,'rgba(0, 0, 0, 0)','Photo arrows have transparent backgrounds');
    assert.equal(style.border,'0px','Photo arrows have no visible border');
  }
  const dimensions = await carousel.evaluate(element => {
    const frameElement = element.querySelector('.lab-photo-frame');
    const frame = frameElement.getBoundingClientRect();
    const slides = [...element.querySelectorAll('.lab-photo-slide')];
    const image = slides.find(slide => !slide.hidden).querySelector('img');
    const counter = element.querySelector('[data-photo-status]').getBoundingClientRect();
    return {frameWidth:frame.width,frameHeight:frame.height,background:getComputedStyle(frameElement).backgroundColor,fit:getComputedStyle(image).objectFit,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,alt:image.alt,counterWidth:counter.width,counterHeight:counter.height};
  });
  assert.ok(Math.abs(dimensions.frameWidth/dimensions.frameHeight-1.5)<0.02,'Photo frame has a stable 3:2 aspect ratio');
  assert.equal(dimensions.background,'rgba(0, 0, 0, 0)','Photo frame has no grey background');
  assert.equal(dimensions.fit,'contain','Both landscape and portrait photos are shown in full');
  assert.ok(dimensions.naturalWidth>0 && dimensions.naturalHeight>0,'Current photo has decoded successfully');
  assert.ok(dimensions.alt.trim(),'Lab photo has alternative text');
  assert.ok(dimensions.counterWidth<=1 && dimensions.counterHeight<=1,'Photo count is visually hidden');
  const current = await slideIndex(page);
  const status = await carousel.locator('[data-photo-status]').textContent();
  assert.match(status,new RegExp(`^\\s*${current+1}\\s*(?:/|of)\\s*${photoFiles.length}\\s*$`),'Accessible photo counter agrees with the visible slide');
  const source = decodeURIComponent(await activeSlide(page).locator('img').getAttribute('src'));
  const filename = photoFiles[current].replace(/\.[^.]+$/,'');
  assert.ok(source.includes(filename),`Current photo matches folder order: ${photoFiles[current]}`);
}
async function checkCarouselInteractions(page) {
  await page.setViewportSize({width:1016,height:1190});
  await page.goto(base);
  const carousel = page.locator(carouselSelector);
  await carousel.scrollIntoViewIfNeeded();
  await page.mouse.move(0,0);
  await assertControlsExposed(page,false);
  await page.locator('.lab-band').screenshot({path:new URL('home-lab-1016-idle.png',out).pathname});
  const first = await slideIndex(page);
  await waitForNextSlide(page,first);

  await carousel.locator('.lab-photo-frame').hover();
  await assertControlsExposed(page,true);
  const hovered = await slideIndex(page);
  await page.waitForTimeout(3300);
  assert.equal(await slideIndex(page),hovered,'Hovering over the photo pauses playback');
  await page.locator('.lab-band').screenshot({path:new URL('home-lab-1016-hover.png',out).pathname});

  const previous = page.getByRole('button',{name:'Previous photo',exact:true});
  const next = page.getByRole('button',{name:'Next photo',exact:true});
  for (let attempt=0;attempt<photoFiles.length && await slideIndex(page)!==0;attempt++) await next.click();
  assert.equal(await slideIndex(page),0,'Manual navigation can return to the first photo');
  await previous.click();
  assert.equal(await slideIndex(page),photoFiles.length-1,'Previous wraps from the first to the last photo');
  await next.click();
  assert.equal(await slideIndex(page),0,'Next wraps from the last to the first photo');
  for (let index=0;index<photoFiles.length;index++) {
    assert.equal(await slideIndex(page),index,'Manual navigation follows numeric photo filename order');
    await activeSlide(page).locator('img').evaluate(image => image.decode());
    await assertPhotoDisplay(page);
    await carousel.screenshot({path:new URL(`lab-photo-${String(index+1).padStart(2,'0')}-1016.png`,out).pathname});
    await next.click();
  }
  await page.mouse.move(0,0);
  await assertControlsExposed(page,false);
  const afterClick = await slideIndex(page);
  await waitForNextSlide(page,afterClick);

  // Enter through the tab order so :focus-visible reflects real keyboard use.
  await page.locator('.lab-feature .hero-buttons a').last().focus();
  await page.keyboard.press('Tab');
  assert.equal(await previous.evaluate(button => button.matches(':focus-visible')),true,'Previous arrow receives visible keyboard focus');
  await assertControlsExposed(page,true);
  const beforeKeyboard = await slideIndex(page);
  await page.keyboard.press('Enter');
  assert.equal(await slideIndex(page),(beforeKeyboard+photoFiles.length-1)%photoFiles.length,'Previous arrow supports keyboard activation');
  await page.keyboard.press('Tab');
  assert.equal(await next.evaluate(button => button.matches(':focus-visible')),true,'Next arrow receives visible keyboard focus');
  await page.keyboard.press('Enter');
  assert.equal(await slideIndex(page),beforeKeyboard,'Next arrow supports keyboard activation');
  const focused = await slideIndex(page);
  await page.waitForTimeout(3300);
  assert.equal(await slideIndex(page),focused,'Visible keyboard focus within the carousel pauses playback');
  await page.keyboard.press('Tab');
  await carousel.scrollIntoViewIfNeeded();
  await assertControlsExposed(page,false);
  await waitForNextSlide(page,focused);

  await page.locator('.hero').scrollIntoViewIfNeeded();
  const offscreen = await slideIndex(page);
  await page.waitForTimeout(3300);
  assert.equal(await slideIndex(page),offscreen,'Offscreen slideshow does not advance');

  const reduced = await browser.newContext({reducedMotion:'reduce',viewport:{width:1016,height:1190}});
  try {
    const reducedPage = await reduced.newPage();
    reducedPage.on('pageerror',error => errors.push(error.message));
    reducedPage.on('console',message => { if(message.type()==='error') errors.push(message.text()); });
    await reducedPage.goto(base);
    await reducedPage.locator(carouselSelector).scrollIntoViewIfNeeded();
    await reducedPage.mouse.move(0,0);
    assert.equal(await reducedPage.locator('.lab-photo-controls button').count(),2,'Reduced-motion mode only offers manual navigation');
    const still = await slideIndex(reducedPage);
    await reducedPage.waitForTimeout(3300);
    assert.equal(await slideIndex(reducedPage),still,'Reduced-motion preference disables automatic playback');
    await reducedPage.locator('.lab-photo-frame').hover();
    await reducedPage.getByRole('button',{name:'Next photo',exact:true}).click();
    assert.equal(await slideIndex(reducedPage),(still+1)%photoFiles.length,'Reduced-motion mode supports manual next');
    await reducedPage.mouse.move(0,0);
    const manual = await slideIndex(reducedPage);
    await reducedPage.waitForTimeout(3300);
    assert.equal(await slideIndex(reducedPage),manual,'Manual navigation does not enable automatic playback with reduced motion');
  } finally { await reduced.close(); }

  const touch = await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});
  try {
    const touchPage = await touch.newPage();
    touchPage.on('pageerror',error => errors.push(error.message));
    touchPage.on('console',message => { if(message.type()==='error') errors.push(message.text()); });
    await touchPage.goto(base);
    await touchPage.locator(carouselSelector).scrollIntoViewIfNeeded();
    assert.equal(await touchPage.evaluate(() => matchMedia('(hover: none)').matches && matchMedia('(pointer: coarse)').matches),true,'Touch check emulates a coarse pointer without hover');
    await assertControlsExposed(touchPage,true);
    await activeSlide(touchPage).locator('img').evaluate(image => image.decode());
    await assertPhotoDisplay(touchPage);
    await touchPage.locator('.lab-band').screenshot({path:new URL('home-lab-390-touch.png',out).pathname});
    const beforeTap = await slideIndex(touchPage);
    await touchPage.getByRole('button',{name:'Next photo',exact:true}).tap();
    const afterTap = (beforeTap+1)%photoFiles.length;
    assert.equal(await slideIndex(touchPage),afterTap,'Touch next arrow changes the photo');
    await assertControlsExposed(touchPage,true);
    await waitForNextSlide(touchPage,afterTap);
    // Keep the mobile photo review deterministic after verifying normal playback.
    await touchPage.emulateMedia({reducedMotion:'reduce'});
    const touchNext = touchPage.getByRole('button',{name:'Next photo',exact:true});
    for (let attempt=0;attempt<photoFiles.length && await slideIndex(touchPage)!==0;attempt++) await touchNext.tap();
    for (let index=0;index<photoFiles.length;index++) {
      assert.equal(await slideIndex(touchPage),index,'Touch navigation follows numeric photo filename order');
      await activeSlide(touchPage).locator('img').evaluate(image => image.decode());
      await assertPhotoDisplay(touchPage);
      await touchPage.locator(carouselSelector).screenshot({path:new URL(`lab-photo-${String(index+1).padStart(2,'0')}-390-touch.png`,out).pathname});
      await touchNext.tap();
    }
  } finally { await touch.close(); }
}
try {
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {if(m.type() === 'error') errors.push(m.text());});
  const routes = ['/', '/lab/', '/research/', '/publications/', '/notes/', '/research/openrca/', '/research/cipherchat/', '/research/utboost/', '/research/logpai/'];
  const widths = [1440, 981, 846, 768, 390, 360];
  for (const width of widths) {
    await page.setViewportSize({width, height:900});
    for (const route of routes) {
      const response = await page.goto(base + route);
      assert.equal(response.status(),200,`${route}: HTTP status`);
      await page.locator('h1').waitFor();
      await page.evaluate(() => document.fonts.ready);
      // Full-page checks must load off-screen lazy figures before testing them.
      await page.evaluate(async () => {
        const images = [...document.images];
        images.forEach(image => { image.loading = 'eager'; });
        await Promise.all(images.map(image => image.decode().catch(() => {})));
      });
      if (route === '/') {
        await page.locator('.lab-photo-frame').hover();
        await assertPhotoDisplay(page);
      }
      const geometry = await page.evaluate(() => ({viewport:innerWidth,scroll:document.documentElement.scrollWidth, broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)}));
      assert.ok(geometry.scroll<=geometry.viewport,`${route} at ${width}: horizontal overflow ${geometry.scroll}`);
      assert.deepEqual(geometry.broken,[],`${route}: broken images`);
      if (route === '/publications/') {
        for (const annotation of publicationAnnotations) {
          const authors = await page.locator(`#${annotation.id} .authors > span`).evaluateAll(spans => spans.map(span => ({
            name: span.textContent,
            supervised: span.classList.contains('supervised-author'),
            underlined: getComputedStyle(span).textDecorationLine.includes('underline'),
            supervisionTitle: span.getAttribute('title'),
            contribution: span.nextElementSibling?.tagName === 'SUP' ? span.nextElementSibling.textContent : null,
            contributionTitle: span.nextElementSibling?.tagName === 'SUP' ? span.nextElementSibling.getAttribute('title') : null,
          })));
          assert.deepEqual(authors.filter(a => a.supervised).map(a => a.name), annotation.supervised, `${annotation.id}: exact owner-confirmed supervised students`);
          assert.deepEqual(authors.filter(a => a.contribution).map(a => a.name), annotation.coFirst, `${annotation.id}: exact owner-confirmed equal contributors`);
          for (const author of authors) {
            assert.equal(author.underlined, author.supervised, `${annotation.id}/${author.name}: supervision underline`);
            assert.equal(author.supervisionTitle, author.supervised ? 'Supervised student' : null);
            assert.equal(author.contribution, annotation.coFirst.includes(author.name) ? '+' : null);
            assert.equal(author.contributionTitle, annotation.coFirst.includes(author.name) ? 'Equal contribution' : null);
          }
        }
        const yearlyVenues = await page.locator('.year-section').evaluateAll(sections => sections.map(section => ({
          year: section.querySelector('h2').textContent,
          venues: [...section.querySelectorAll('.publication-venue')].map(venue => [...venue.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join('').trim()),
        })));
        for (const {year, venues} of yearlyVenues) {
          const groups = venues.filter((venue, index) => index === 0 || venue !== venues[index - 1]);
          assert.equal(groups.length, new Set(groups).size, `${year}: each venue appears in one continuous group`);
        }
        for (const [id,count] of [['drain-2017','1,528'],['log-anomaly-2016','1,008'],['log-tools-2019','877'],['loghub-2023','878'],['cipherchat-2024','585']]) {
          const citation=page.locator(`#${id} .publication-links .metric-badge[aria-label*="Google Scholar citations"]`);
          assert.equal(await citation.locator('.metric-value').innerText(),count,`${id}: shared citation snapshot`);
          assert.equal(await citation.locator('.metric-label').innerText(),'','Citation label is icon-only');
        }
        assert.equal(await page.locator('#cipherchat-2024 .metric-badge[aria-label*="GitHub stars"] .metric-value').innerText(),'630');
        const use=page.locator('#openrca-2025 .industry-use-badge');
        assert.equal(await use.getByRole('link',{name:'Anthropic',exact:true}).getAttribute('href'),'https://www.anthropic.com/news/claude-opus-4-6');
        assert.equal(await use.getByRole('link',{name:'Microsoft',exact:true}).getAttribute('href'),'https://microsoft.github.io/OpenRCA/');
        assert.equal(await use.locator('.company-logo').count(),2);
      }
      assert.equal(await page.locator('h1').count(),1);
      assert.equal(await page.locator('.site-header a[href^="mailto:"]').count(),0,`${route}: no header email link`);
      assert.equal(await page.locator('.site-footer nav').count(),0,`${route}: no redundant footer navigation`);
      assert.match((await page.locator('.site-footer').innerText()).trim(),/^© \d{4} Pinjia He\s+Back to top$/,`${route}: compact footer`);
      if (['/research/openrca/','/research/cipherchat/'].includes(route)) {
        await checkProjectFigure(page.locator('.project-detail .project-figure'),route.includes('openrca') ? 'OpenRCA' : 'CipherChat');
      }
      if (route === '/') {
        const layout = await page.evaluate(() => {
          const teaching = document.querySelector('#teaching');
          const service = document.querySelector('#service');
          const lab = document.querySelector('.lab-feature');
          const labCopy = lab.firstElementChild;
          const labPhotos = lab.querySelector('.lab-photo-carousel');
          const labStyle = getComputedStyle(lab);
          const description = getComputedStyle(document.querySelector('.lab-composition'));
          const rect = element => { const box=element.getBoundingClientRect(); return {x:box.x,top:box.top,bottom:box.bottom,width:box.width,height:box.height}; };
          return {
            teaching:rect(teaching),service:rect(service),lab:rect(lab),labCopy:rect(labCopy),labPhotos:rect(labPhotos),
            labPadding:parseFloat(labStyle.paddingTop)+parseFloat(labStyle.paddingBottom),
            descriptionFont:description.fontFamily,bodyFont:getComputedStyle(document.body).fontFamily,descriptionSize:description.fontSize,
          };
        });
        assert.ok(layout.service.top>=layout.teaching.bottom,`At ${width}px: Teaching and Service are vertically stacked`);
        assert.ok(Math.abs(layout.teaching.x-layout.service.x)<1 && Math.abs(layout.teaching.width-layout.service.width)<1,`At ${width}px: independent academic sections align`);
        assert.equal(layout.descriptionSize,'15px',`At ${width}px: Lab description has restrained text size`);
        assert.equal(layout.descriptionFont,layout.bodyFont,`At ${width}px: Lab description uses the regular sans-serif font`);
        if (width>=768) {
          assert.ok(layout.labCopy.width<layout.lab.width*0.55,`At ${width}px: Lab copy shares the row with photos`);
          assert.ok(layout.labPhotos.x>=layout.labCopy.x+layout.labCopy.width,`At ${width}px: Lab photos occupy the right column`);
        } else {
          assert.ok(layout.labPhotos.top>=layout.labCopy.bottom,`At ${width}px: Lab photos follow the text on mobile`);
          assert.ok(Math.abs(layout.labPhotos.width-layout.labCopy.width)<2,`At ${width}px: Lab photo frame fills the mobile column`);
          assert.ok(layout.lab.height>=layout.labCopy.height+layout.labPhotos.height+layout.labPadding,`At ${width}px: Lab height includes its photo row`);
        }
      }
      records.push({route,width,status:200,overflow:false});
      await page.addStyleTag({content:'html { scroll-behavior: auto !important; }'});
      if ([1440,390].includes(width) && ['/','/lab/','/notes/'].includes(route)) {
        await page.screenshot({path:new URL(`${route==='/'?'home':route.split('/')[1]}-${width}.png`,out).pathname,fullPage:true});
        if(route==='/lab/') {
          const box = await page.locator('#people').boundingBox();
          await page.setViewportSize({width,height:Math.ceil(box.height+300)});
          await page.locator('#people').screenshot({path:new URL(`lab-members-${width}.png`,out).pathname});
          await page.setViewportSize({width,height:900});
        }
      }
      if([981,846].includes(width) && route==='/') await page.screenshot({path:new URL(`home-${width}.png`,out).pathname,fullPage:true});
      if ([981,846,390].includes(width) && route==='/') {
        for (const [selector,name] of [['#selected-work','research-highlights'],['#teaching','teaching'],['#service','service'],['.lab-band','home-lab']]) {
          const region = page.locator(selector);
          const box = await region.boundingBox();
          await page.setViewportSize({width,height:Math.max(900,Math.ceil(box.height+200))});
          await region.screenshot({path:new URL(`${name}-${width}.png`,out).pathname});
          await page.setViewportSize({width,height:900});
        }
      }
      if(width===1440 && ['/research/','/publications/','/research/openrca/','/research/cipherchat/','/research/utboost/'].includes(route)) await page.screenshot({path:new URL(`${route.split('/').filter(Boolean).join('-')}-${width}.png`,out).pathname,fullPage:true});
    }
  }
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base);
  assert.equal(await page.locator('.hero .portrait figcaption, .hero .hero-buttons, .hero .eyebrow').count(),0,'No redundant portrait caption, hero buttons, or hero eyebrow');
  assert.deepEqual(await page.locator('.hero-links a').allTextContents(),['Email','Google Scholar','GitHub','DBLP','X','LinkedIn']);
  const profileLinks = page.locator('.hero-links a');
  for (let i=0;i<6;i++) {
    const link = profileLinks.nth(i);
    assert.equal(await link.locator('svg[aria-hidden="true"]').count(),1,'Each profile link has one decorative SVG');
    assert.equal(await link.locator('svg').getAttribute('width'),'16','Profile icon width');
    assert.equal(await link.locator('svg').getAttribute('height'),'16','Profile icon height');
  }
  assert.match(await profileLinks.nth(0).getAttribute('href'),/^mailto:[^@]+@[^@]+$/,'Email link');
  for (const [index,host] of [[1,'scholar.google.com'],[2,'github.com'],[3,'dblp.org'],[4,'twitter.com'],[5,'www.linkedin.com']]) {
    assert.equal(new URL(await profileLinks.nth(index).getAttribute('href')).hostname,host,'Profile destination');
  }
  assert.equal(await page.locator('.pillars .pillar').count(),2,'Two research directions');
  assert.ok((await page.locator('.pillars').innerText()).split('\n').every(line => !/^0[12](?:\s|$)/.test(line.trim())),'Research directions have no numbered prefixes');
  assert.equal((await page.locator('.research-section h2').innerText()).trim(),'Research Directions');
  assert.equal((await page.locator('#selected-work h2').innerText()).trim(),'Research Highlights');
  assert.equal((await page.locator('.notes-section h2').innerText()).trim(),'Notes & Resources');
  assert.equal((await page.locator('.notes-section .resource-entry h3').first().innerText()).trim(),'You and Your Research','Hamming is the first homepage recommendation');
  assert.equal(await page.locator('#selected-work .section-heading .eyebrow, .lab-feature .eyebrow, .notes-section .section-heading .eyebrow').count(),0,'Removed three decorative section taglines');
  assert.equal(await page.locator('#selected-work .section-heading').getByRole('link',{name:'Publications',exact:true}).getAttribute('href'),'/publications/');
  assert.equal((await page.locator('#selected-work .project-card h3').nth(1).innerText()).trim(),'CipherChat','Second research highlight');
  assert.deepEqual(await page.locator('#selected-work .project-card h3').allTextContents(),['OpenRCA','CipherChat','LogPAI'],'Three research highlights in the requested order');
  assert.deepEqual(await page.locator('#selected-work .publication-venue').allTextContents(),['ICLR25','ICLR24','ICWS17','ISSRE16','ISSRE23','ICSE-SEIP19'],'Highlights show the requested publication venues and order');
  assert.equal(await page.locator('#selected-work .metric-badge').count(),6,'Five paper citation badges and one GitHub star badge');
  assert.deepEqual(await page.locator('#selected-work .metric-badge[aria-label*="Google Scholar citations"] .metric-label').allTextContents(),['','','','',''],'Citation badges show the Scholar icon without visible Citations text');
  assert.deepEqual(await page.locator('#selected-work .metric-value').allTextContents(),['630','585','1,528','1,008','878','877'],'Metric values have no visible estimated-count asterisk');
  assert.deepEqual(await page.locator('#selected-work .project-card > .text-link').evaluateAll(links => links.map(link => link.href)),['https://microsoft.github.io/OpenRCA/','https://llmcipherchat.github.io/','https://github.com/logpai'],'Explore links use the official project destinations');
  assert.equal(await page.locator('#selected-work .section-note').count(),0,'No research-highlights prototype note');
  for (const card of await page.locator('#selected-work .project-card').all()) {
    await checkProjectFigure(card.locator('.project-figure'),(await card.locator('h3').innerText()).trim());
  }
  const ordered = await page.evaluate(() => {
    const sections = ['#selected-work','#teaching','#service','.lab-band'].map(selector => document.querySelector(selector));
    return sections.every((section,index) => section && (index===0 || Boolean(sections[index-1].compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING)));
  });
  assert.ok(ordered,'Research Highlights, Teaching, Service, Lab appear in the agreed order');
  assert.equal(await page.locator('main > section.academic-section').count(),2,'Teaching and Service are separate top-level sections');
  assert.equal(await page.locator('#teaching .prose > p').count(),2,'Teaching has two concise paragraphs');
  assert.equal(await page.locator('#service .prose > p').count(),3,'Service includes the workshop between existing paragraphs');
  assert.equal(await page.locator('#teaching strong, #service strong').count(),0,'Academic sections do not use bold emphasis');
  assert.deepEqual(await page.locator('#teaching em').allTextContents(),['Introduction to AI Programming','Introduction to Computer Science: Programming Methodology','Software Engineering','Research Topics in Software Engineering','Software Engineering'],'Course names are italicized in the requested order');
  const teachingNow = await page.locator('#teaching .prose > p').first().innerText();
  assert.match(teachingNow,/AIE1001.*CSC1001.*CSC4001.*CSC6041/,'Current teaching follows AI, programming, then software engineering');
  const teachingBefore = await page.locator('#teaching .prose > p').nth(1).innerText();
  assert.match(teachingBefore,/Research Topics in Software Engineering.*ETH Zurich/,'Previous teaching includes ETH course');
  assert.match(teachingBefore,/CUHK.*teaching assistant for Software Engineering.*Excellent Teaching Assistant/,'Previous teaching includes CUHK TA role and award');
  assert.deepEqual(await page.locator('#service em').allTextContents(),['Associate Editor','Schedule Chair','Social Media Co-Chair'],'Service italicizes position names only');
  assert.equal(await page.locator('#service a').count(),4,'Service links TOSEM, two FSE conferences, and EXPRESS');
  assert.match(await page.locator('#service .prose > p').nth(1).innerText(),/EXPRESS 2026/,'Workshop paragraph');
  assert.match(await page.locator('#service .prose > p').nth(2).innerText(),/mainly includes/,'Committee summary uses mainly includes');
  assert.equal(await page.locator('#service .prose > p').nth(2).locator('em, strong').count(),0,'Conference names use regular text');
  assert.equal(await page.locator('.lab-feature .mission, .lab-feature [role="img"]').count(),0,'No repeated Lab mission or placeholder image');
  assert.equal(await page.locator('.lab-feature .lab-photo-slide img').count(),photoFiles.length,'Lab right column contains all photos from the source folder');
  const homepageMission = (await page.locator('.lab-composition').innerText()).trim();
  assert.match(homepageMission,/independent, capable, and dependable researchers\.$/,'Lab mission expresses independent, capable, and dependable researchers');
  await checkCarouselInteractions(page);
  await page.locator('.desktop-nav').getByRole('link',{name:'Research',exact:true}).click();
  assert.equal(new URL(page.url()).pathname,'/research/');
  assert.equal(await page.getByText('Prototype selection.',{exact:false}).count(),0,'Removed research selection footer');
  const utboostCard=page.locator('.project-card').filter({has:page.getByRole('heading',{name:'UTBoost',exact:true})});
  await checkProjectFigure(utboostCard.locator('.project-figure'),'UTBoost');
  assert.equal(await utboostCard.locator('figcaption').innerText(),"UTBoost's test augmentation and patch evaluation workflow.",'UTBoost caption omits the parenthetical reference');
  assert.equal(await utboostCard.locator('.text-link').getAttribute('href'),'https://aclanthology.org/2025.acl-long.189/','UTBoost Explore links directly to the paper');
  await page.locator('.project-card h3 a[href="/research/openrca/"]').click();
  assert.equal(new URL(page.url()).pathname,'/research/openrca/');
  await page.goto(base);
  await page.locator('#selected-work .project-card').nth(1).locator('h3 a').click();
  assert.equal(new URL(page.url()).pathname,'/research/cipherchat/');
  await page.goto(base);
  await page.locator('.desktop-nav').getByRole('link',{name:'Lab',exact:true}).click();
  assert.equal(new URL(page.url()).pathname,'/lab/');
  assert.equal((await page.locator('.lab-hero > p:not(.eyebrow)').innerText()).trim(),homepageMission,'Homepage Lab description reuses the existing mission');
  await page.locator('.anchor-nav a[href="#people"]').click();
  await page.waitForFunction(()=>Math.abs(document.querySelector('#people').getBoundingClientRect().top-215)<5 || document.querySelector('#people').getBoundingClientRect().top>=88);
  assert.equal(await page.locator('#people #aoyang-fang').count(),1);
  assert.equal(await page.locator('#alumni #aoyang-fang--aoyang-fang-mphil').count(),1);
  assert.equal(await page.locator('#people #zhouruixing-zhu').count(),1);
  assert.equal(await page.locator('#alumni #zhouruixing-zhu--zhouruixing-zhu-mphil').count(),1);
  const currentGroups = page.locator('#people .people-group');
  assert.deepEqual(await currentGroups.locator('.group-heading').allTextContents(),['PhD Students','MPhil Students']);
  assert.deepEqual(await currentGroups.nth(0).locator('.person-entry h3').allTextContents(),['Zhiqing Zhong','Aoyang Fang','Zhouruixing Zhu','Jiaming Huang','Changyue Li','Xiaoyuan Liu','Songhan Zhang','Qisheng Lu','Huachao Zhu','Tong Zhu','Mingyu Chen','Haotian Fan','Zequan Fang','Yichen Guo','Linxi Liang','Rongbin Shang','Zhenfeng Su','Haoyu Wang','Zhengyuan Xin','Ruiyang Xu','Qiming Zhu']);
  assert.deepEqual(await currentGroups.nth(1).locator('.person-entry h3').allTextContents(),['Sicheng Li','Tinghan Li','Manyi Wang','Haotong Wu','Xiaochuan Yan','Yu Huang','Zhengxu Jing','Xuyao Wang','Yiyang Wei']);
  const memberIds = await page.locator('.person-entry').evaluateAll(entries => entries.map(entry => entry.id));
  assert.equal(memberIds.length,72,'Lab has 72 displayed membership entries');
  assert.equal(new Set(memberIds).size,72,'Every displayed membership has a unique DOM ID');
  const personIds = await page.locator('.person-entry').evaluateAll(entries => entries.map(entry => entry.dataset.personId));
  assert.equal(new Set(personIds).size,70,'Lab has 70 unique people despite two current members also displaying completed MPhil stages');
  assert.equal(await page.locator('#people .person-entry').count(),30,'Lab has 30 current members');
  assert.equal(await page.locator('#alumni .person-entry').count(),25,'Alumni shows the 15 existing entries plus 10 completed master’s stages');
  for (const [id,role,firstAuthorPapers] of [
    ['mingyu-chen','PhD',['ISSTA26']],['haotian-fan','PhD',['EMNLP26']],['zequan-fang','PhD',[]],
    ['yichen-guo','PhD',[]],['linxi-liang','PhD',['TSE25']],['rongbin-shang','PhD',[]],
    ['zhenfeng-su','PhD',['ICS26','ICML26']],['haoyu-wang','PhD',[]],['zhengyuan-xin','PhD',[]],
    ['ruiyang-xu','PhD',['AAAI23','ACL25','ICSE25']],['qiming-zhu','PhD',['AAAI25','ACL Findings26']],
    ['yu-huang','MPhil',[]],['zhengxu-jing','MPhil',[]],['xuyao-wang','MPhil',[]],['yiyang-wei','MPhil',['ACL26']],
  ]) {
    const entry = page.locator(`#${id}`);
    assert.equal(await entry.locator('.person-role').innerText(),`${role} · 2026-09 – present`,`${id}: supplied role and start month`);
    assert.deepEqual(await entry.locator('.education .first-author-publication').allTextContents(),firstAuthorPapers,`${id}: only explicitly identified first-author publications are underlined`);
    assert.doesNotMatch(await entry.innerText(),/first author/i,`${id}: no extra first-author wording`);
  }
  assert.equal(await page.locator('#yu-huang .education').innerText(),'B.S., Nanjing University of Aeronautics and Astronautics');
  assert.equal(await page.locator('#zhengxu-jing .education').innerText(),"B.S., Xi'an Jiaotong–Liverpool University");
  assert.equal(await page.locator('.content-notice').count(),0,'Lab prototype notice is removed');
  assert.equal(await page.locator('#people > .section-note').innerText(),'First-author publications are underlined.');
  assert.ok((await page.locator('.person-publications .field-label').allTextContents()).every(label => label === 'Publications'),'All Lab member publication fields use Publications');
  assert.equal(await page.locator('#clara-meister .person-publications .field-label').innerText(),'Publications');
  for (const record of labPaperUpdates) {
    const entry = page.locator(`#${record.entryId}`);
    const papers = await entry.locator('.person-publications > span:not(.field-label)').evaluateAll(spans => spans.map(span => ({
      label:span.textContent.trim(), firstAuthor:span.classList.contains('first-author-publication'),
      underlined:getComputedStyle(span).textDecorationLine.includes('underline'),
    })));
    assert.deepEqual(papers.map(({label,firstAuthor}) => ({label,firstAuthor})),record.after.map(({label,firstAuthor}) => ({label:label.replaceAll('ESEC/FSE23','FSE23'),firstAuthor})),`${record.name}: old and added publications retain their author status and order`);
    for (const paper of record.after.filter(paper => paper.url)) {
      assert.equal(await entry.locator('.person-publications').getByRole('link',{name:paper.label.replaceAll('ESEC/FSE23','FSE23'),exact:true}).getAttribute('href'),paper.url,`${record.name}: existing paper link is preserved`);
    }
    for (const paper of papers) assert.equal(paper.underlined,paper.firstAuthor,`${record.name}: only first-author publications are underlined`);
    const years = papers.map(paper => Number(paper.label.match(/\d{2,4}/)[0]));
    assert.deepEqual(years,[...years].sort((a,b) => a-b),`${record.name}: publications are chronological`);
    assert.deepEqual(await entry.locator('.person-detail-values .person-detail-item').allTextContents(),record.awardsAfter,`${record.name}: new and existing awards are preserved`);
    if (record.hiddenHistoricalEntryId) {
      const history = page.locator(`#${record.hiddenHistoricalEntryId}`);
      assert.equal(await history.count(),1,`${record.name}: completed MPhil entry remains`);
      assert.equal(await history.locator('.person-publications,.person-detail-values').count(),0,`${record.name}: current achievements are not repeated in the historical entry`);
    }
  }
  assert.equal(await page.locator('#songhan-zhang .person-role').innerText(),'PhD · 2023-01 – present');
  assert.equal(await page.locator('#songhan-zhang .person-notes').innerText(),'Notes\nTransferred from MPhil to PhD in 2025.01');
  assert.deepEqual(await page.locator('#xiaoyuan-liu .education-details li').allTextContents(),['Rank top 10%','Undergraduate intern in the group']);
  assert.equal(await page.locator('#undergraduate-interns .person-entry').count(),17);
  assert.equal(await page.locator('#undergraduate-interns h2').innerText(),'Undergraduates');
  assert.equal(await page.locator('.anchor-nav a[href="#undergraduate-interns"]').innerText(),'Undergraduates');
  assert.equal(await page.locator('#undergraduate-interns > .intern-publication-grid').count(),1,'All seventeen undergraduates share the four-column grid');
  for (const row of await page.locator('.person-publications').evaluateAll(rows=>rows.map(row=>({text:row.textContent,separators:[...row.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim()).map(node=>node.textContent)})))) {
    assert.doesNotMatch(row.text,/ESEC\/FSE|;/,'Member summaries use the FSE abbreviation and comma separators');
    assert.ok(row.separators.every(text=>text===', '),'Member publication separators are English commas followed by spaces');
  }
  assert.equal(await page.locator('#undergraduate-interns > .people-compact-list .person-entry').count(),0);
  assert.equal(await page.locator('#undergraduate-interns > .people-compact-grid .person-entry').count(),17);
  assert.deepEqual(await page.locator('#undergraduate-interns .person-entry').evaluateAll(entries=>entries.map(entry=>entry.id)),[...internExpansion.pinnedIds,'yuancheng-wang',...internExpansion.records.map(person=>person.id),'yusong-zhao']);
  for (const person of internExpansion.records) {
    const papers = await page.locator(`#${person.id} .person-publications > span:not(.field-label)`).evaluateAll(spans=>spans.map(span=>({label:span.textContent.trim(),firstAuthor:span.classList.contains('first-author-publication'),...(span.querySelector('a') ? {url:span.querySelector('a').getAttribute('href')} : {})})));
    assert.deepEqual(papers,person.papers,`${person.name}: compact labels, co-author status and existing links`);
  }
  const internBoxes = await page.locator('#undergraduate-interns .intern-publication-grid .person-entry').evaluateAll(entries=>entries.map(entry=>{const r=entry.getBoundingClientRect();return {left:r.left,top:r.top};}));
  assert.equal(new Set(internBoxes.slice(0,4).map(box=>Math.round(box.top))).size,1,'Four undergraduate entries share the desktop row');
  assert.equal(new Set(internBoxes.slice(0,4).map(box=>Math.round(box.left))).size,4,'Undergraduate collaborators use four desktop columns');
  assert.equal(await page.locator('#join h2').innerText(),'Join Us');
  assert.equal(await page.locator('#zhiqing-zhong .person-notes').innerText(),'Notes\nCo-supervised by Pinjia He and Boxi Yu');
  assert.deepEqual(await page.locator('#zhiqing-zhong .education-details > li').allTextContents(),['Publications: ISSTA22, ISSTA23','Undergraduate intern in the group']);
  assert.equal(await page.locator('#changyue-li .education > li').nth(1).locator('.education-details').innerText(),'Publications: TDSC23, USENIX Security24');
  assert.deepEqual(await page.locator('#huachao-zhu .education > li').nth(0).locator('.education-details > li').allTextContents(),['Rank top 0.5% (1/173)','National Scholarship (×3)']);
  assert.deepEqual(await page.locator('#huachao-zhu .education .first-author-publication').allTextContents(),['ICCV25','TMM26']);
  assert.deepEqual(await page.locator('#alumni .people-group').filter({has:page.getByRole('heading',{name:'Research Assistants',exact:true})}).locator('.person-entry h3').allTextContents(),['Yuejin Xie','Siyu Yu','Yusheng Huang','Jianbo Yu','Qijing Shen','Clara Meister','Rohan Parag Shah','Shashij Gupta']);
  assert.deepEqual(await page.locator('#alumni .group-heading').allTextContents(),['PhD Students','MPhil & MSc Students','Postdoc & Visiting','Research Assistants']);
  assert.deepEqual(await page.locator('#alumni .people-group').first().locator('.person-entry h3').allTextContents(),['Junjielong Xu','Youliang Yuan','Boxi Yu']);
  assert.equal(await page.locator('#alumni .people-group').nth(2).locator('#zhijing-li').count(),1);
  const mastersAlumni = page.locator('#alumni .people-group').nth(1);
  assert.deepEqual(await mastersAlumni.locator('.person-entry h3').allTextContents(),['Ziwen Cai','Menghan Tian','Jiaying Li','Sihang Zhao','Ruiyu Zhou','Boyin Tan','Yidan Wang','Zhouruixing Zhu','Aoyang Fang','Haowen Yang']);
  assert.equal(await mastersAlumni.locator('[data-person-id="yidan-wang"] .next-step').evaluate(element=>[...element.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent).join('').trim()),'PhD, University of Luxembourg');
  assert.equal(await mastersAlumni.locator('[data-person-id="boyin-tan"] .person-role').innerText(),'MAIR · 2023-09 – 2025-07');
  assert.deepEqual(await page.locator('#junjielong-xu .education-details > li').allTextContents(),['1st Prize in CUMCM','Finalist in MCM (solo)']);
  assert.equal(await page.locator('#junjielong-xu .field-label').filter({hasText:'Awards'}).count(),0);
  assert.equal(await page.locator('#youliang-yuan .education-details').innerText(),'Rank top 4% (1/25)');
  assert.equal(await page.locator('#zhijing-li .education').innerText(),"Ph.D., Xi'an Jiaotong University");
  assert.deepEqual(await page.locator('#alumni .people-group').nth(2).locator('.person-entry h3').allTextContents(),['Zhijing Li','Jialun Cao','Ying Fu','Dinghua Wang']);
  assert.equal(await page.locator('.education-rank').count(),0);
  assert.equal(await page.locator('.person-photo').count(),0);
  await page.setViewportSize({width:390,height:844});
  await page.goto(base);
  const summary = page.locator('.mobile-menu summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.mobile-menu').getAttribute('open'),'');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.mobile-menu').getAttribute('open'),null);
  await summary.click();
  await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Lab',exact:true}).click();
  assert.equal(new URL(page.url()).pathname,'/lab/');
  const noJS = await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const plain = await noJS.newPage();
  for(const route of routes){
    await plain.goto(base+route);
    assert.equal(await plain.locator('h1').count(),1);
    assert.ok((await plain.locator('main').innerText()).length>100);
    if(route==='/') {
      await plain.locator(carouselSelector).scrollIntoViewIfNeeded();
      assert.equal(await slideIndex(plain),0,'Without JavaScript the first Lab photo is visible');
      assert.equal(await plain.locator(`${carouselSelector} .lab-photo-controls`).isVisible(),false,'Without JavaScript inactive photo controls are hidden');
      await activeSlide(plain).locator('img').evaluate(image => image.decode());
      assert.ok(await activeSlide(plain).locator('img').evaluate(image => image.naturalWidth>0),'Without JavaScript the first Lab photo loads');
    }
  }
  await plain.goto(base+'/lab/');
  await plain.locator('.mobile-menu summary').click();
  await plain.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Research',exact:true}).click();
  assert.equal(new URL(plain.url()).pathname,'/research/');
  await noJS.close();
  const draft = await page.request.get(base+'/notes/markdown-layout-test/');
  assert.equal(draft.status(),404,'Draft route must not exist in normal preview');
  assert.deepEqual(errors,[], 'Browser console errors');
  const report = {
    base,checkedAt:new Date().toISOString(),routes:records,labPhotos:photoFiles,
    checks:[
      `All ${routes.length} routes at ${widths.join(', ')}px: no horizontal overflow or broken images, including lazy project figures and Lab photos`,
      'Six homepage profile links with decorative 16px SVGs and correct destinations; no header email, redundant hero caption/buttons, or hero eyebrow',
      'Research Directions, Research Highlights, Notes & Resources headings and Publications link; three decorative section taglines removed',
      'Two unnumbered research directions; OpenRCA, CipherChat, and LogPAI highlights include venue/year links and official project destinations; UTBoost remains accessible',
      'Project images have alt text and captions; only Claude Opus 4.6 is linked in OpenRCA captions; CipherChat overview caption explains ciphered GPT communication and decoding without a link',
      'Teaching and Service are separate vertically stacked sections, with two and three paragraphs respectively, following Research Highlights and preceding Lab',
      'Teaching courses and Service roles are italicized without bold; teaching order, earlier teaching/TA award and mainly includes summary are preserved; Service links TOSEM, two FSE conferences and EXPRESS',
      'Homepage Lab reuses the mission ending independent, capable, and dependable researchers in 15px sans-serif text',
      `${photoFiles.length} real Lab photos follow numeric filename order and use a transparent 3:2 frame with contain sizing, to the right of Lab copy on desktop and below it on mobile`,
      'Lab slideshow advances automatically, supports previous/next with wrapping and keyboard activation, and has an accurate visually hidden photo counter',
      'Only two SVG arrow buttons remain, with no text, border, or background; desktop arrows appear on hover or visible keyboard focus and hide after leaving, including after mouse clicks',
      'Slideshow pauses for mouse hover, visible keyboard focus, or leaving the viewport; reduced-motion preference allows manual navigation without automatic playback',
      'Touch-screen arrows are always visible and tappable; tapping next does not cause sticky hover or prevent subsequent automatic playback',
      `All ${photoFiles.length} slideshow photos have individual 1016px and 390px touch screenshots; homepage and Lab screenshots cover desktop, 1016px hover/idle, 981px, tablet, and mobile layouts`,
      'You and Your Research is the first homepage reading recommendation',
      'Footer contains only copyright and Back to top',
      'Desktop navigation and OpenRCA/CipherChat detail links are clickable',
      'Mobile keyboard menu: Enter, Escape, link navigation',
      'Aoyang and Zhouruixing retain current PhD entries and display separate completed MPhil stages with unique anchors; no absent rank/photo placeholders',
      'Lab has 70 unique people and 72 membership entries, including 30 current members and 17 Undergraduates; all seventeen undergraduates use four desktop columns while retaining their approved order and facts; Lab summaries use FSE23 and comma separators',
      'All primary content and mobile navigation work without JavaScript; the first Lab photo remains visible and inactive slideshow controls are hidden',
      'Normal preview draft route returns 404',
      'No browser console errors',
    ],screenshots:'docs/screenshots',errors,
  };
  await writeFile(new URL('../browser-check-results.json',out),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({pages:records.length,checks:report.checks,screenshots:report.screenshots,errors},null,2));
} finally { await browser.close(); }
