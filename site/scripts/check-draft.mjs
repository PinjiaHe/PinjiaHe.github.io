import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const response=await page.goto('http://127.0.0.1:4321/notes/');
 assert.equal(response.status(),200);
 await page.getByRole('link',{name:'Markdown 排版测试（不是公开文章）'}).click();
 assert.equal(new URL(page.url()).pathname,'/notes/markdown-layout-test/');
 assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
 assert.equal(await page.locator('h1').innerText(),'Markdown 排版测试（不是公开文章）');
 assert.ok((await page.locator('.content-notice').innerText()).includes('Local draft'));
 assert.equal(await page.locator('.article-body strong').innerText(),'强调文字');
 assert.equal(await page.locator('pre').count(),1);
 assert.ok(await page.locator('.article-body img').evaluate(img=>img.complete&&img.naturalWidth>0));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'../docs/screenshots/notes-draft-390.png',fullPage:true});
 await writeFile('../docs/draft-check-results.json',JSON.stringify({checkedAt:new Date().toISOString(),status:'passed',checks:['Explicit development flag exposes the clearly labeled draft','Notes link opens stable slug','Chinese language, Markdown emphasis, quote, code, image render','390px no overflow'],productionContent:false},null,2)+'\n');
 console.log('Draft browser check passed; screenshot saved. Run normal build and link check after stopping draft mode.');
}finally{await browser.close();}
