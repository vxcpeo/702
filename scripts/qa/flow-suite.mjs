/**
 * Functional flow suite for the reskinned Ledgiva site.
 *
 * Every flow uses the new poster shell selectors. It exercises search, filters,
 * sort, keyboard row navigation, keep/saved, the dossier, the guide, the dock,
 * the create sheet and the mobile contents plate. It reports pass/fail per flow
 * and exits non-zero when any flow fails.
 */
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const BASE = process.env.REVIEW_URL || 'http://127.0.0.1:4320/';
const req = createRequire(path.join(ROOT, 'package.json'));
const { chromium } = req('playwright');

let passed = 0;
const failures = [];
function check(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`ok  ${message}`);
  } else {
    failures.push(message);
    console.log(`FAIL ${message}`);
  }
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' });

async function cardCount(page) {
  return page.locator('.record-card').count();
}

async function fresh(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage();
const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

await fresh(page);
check((await cardCount(page)) === 4, 'index renders four brief cards');
check(((await page.locator('h1').first().innerText()) || '').toLowerCase().includes('two paths in.'), 'poster h1 renders');

await page.locator('#brief-search').fill('liquidity');
await page.waitForTimeout(300);
check((await cardCount(page)) === 1, 'search narrows the wall to one card');
await page.locator('.search-clear').click();
await page.waitForTimeout(250);
check((await cardCount(page)) === 4, 'clear search restores the wall');

await page.locator('.sticker').filter({ hasText: 'Ecosystem' }).click();
await page.waitForTimeout(250);
check((await cardCount(page)) === 1, 'topic sticker filters the wall');
await page.locator('.query-bar .press-link').click();
await page.waitForTimeout(250);
check((await cardCount(page)) === 4, 'reset restores every card');

await page.locator('.sticker-group').nth(1).locator('.sticker').filter({ hasText: 'Open' }).click();
await page.waitForTimeout(250);
check((await page.locator('.board-empty').count()) === 1, 'a filter with no match shows the empty plate');
await page.locator('.sticker-group').nth(1).locator('.sticker').filter({ hasText: 'Sample' }).click();
await page.waitForTimeout(250);
check((await cardCount(page)) === 4, 'sample standing restores the samples');
await page.locator('.query-bar .press-link').click();
await page.waitForTimeout(250);

await page.locator('#brief-order').selectOption('reward');
await page.waitForTimeout(300);
check((await page.locator('.card-pool').first().innerText()).includes('0.12'), 'sort by pool puts the largest pool first');
await page.locator('#brief-order').selectOption('newest');
await page.waitForTimeout(250);

await page.locator('.card-open').first().focus();
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(150);
const focusedKey = await page.evaluate(() => document.activeElement?.getAttribute('data-key') || '');
const secondKey = await page.locator('.card-open').nth(1).getAttribute('data-key');
check(focusedKey === secondKey, 'ArrowDown moves focus between cards');

await page.locator('.card-keep').first().click();
await page.waitForTimeout(250);
check((await page.locator('.card-keep.is-kept').count()) === 1, 'keep marks the card');
check((await page.locator('.route-tile').filter({ hasText: 'Saved' }).innerText()).includes('1'), 'saved route count updates');

await page.locator('.route-tile').filter({ hasText: 'Saved' }).click();
await page.waitForTimeout(300);
check((await cardCount(page)) === 1, 'saved view lists the kept card');
await page.locator('.card-keep.is-kept').click();
await page.waitForTimeout(250);
check((await page.locator('.board-empty').count()) === 1, 'removing the last kept card shows the saved empty state');

await page.locator('.route-tile').filter({ hasText: 'Index' }).click();
await page.waitForTimeout(300);
await page.locator('.card-open').first().click();
await page.waitForTimeout(350);
check((await page.locator('.print').count()) === 1, 'opening a card renders the dossier print');
check((await page.locator('h1#print-title, h1#dossier-title').count()) === 1, 'dossier keeps its h1');
check((await page.locator('#scope').count()) === 1, 'dossier renders the scope chapter');
check((await page.locator('#contribute').count()) === 1, 'dossier renders the contribution chapter');
await page.locator('.print-nav .press-link').click();
await page.waitForTimeout(300);
check((await page.locator('.board').count()) === 1, 'back returns to the index');

await page.locator('.route-tile').filter({ hasText: 'Guide' }).click();
await page.waitForTimeout(300);
check((await page.locator('.guide').count()) === 1, 'guide route renders the field guide');
await page.locator('.faq-q').first().click();
await page.waitForTimeout(200);
check(await page.locator('.faq-row').first().evaluate((el) => el.open), 'FAQ disclosure opens');
await page.getByRole('button', { name: 'Open the index', exact: true }).click();
await page.waitForTimeout(300);
check((await page.locator('.board').count()) === 1, 'guide action returns to the index');

await page.locator('.dock-key[aria-label^="Saved"]').click();
await page.waitForTimeout(250);
check((await page.locator('.board').count()) === 1, 'dock key switches views');

await page.locator('.route-tile').filter({ hasText: 'Index' }).click();
await page.waitForTimeout(250);
await page.locator('.mast-acts .press-btn').click();
await page.waitForTimeout(350);
check((await page.locator('dialog.sheet[open]').count()) === 1, 'mast action opens the create sheet');
await page.keyboard.press('Escape');
await page.waitForTimeout(250);
check((await page.locator('dialog.sheet[open]').count()) === 0, 'Escape closes the sheet');

await page.locator('.mast-acts .press-btn').click();
await page.waitForTimeout(300);
await page.locator('#mission-title').click();
await page.locator('.sheet-form .press-btn[type="submit"]').click();
await page.waitForTimeout(300);
check((await page.locator('.sheet-form input:invalid, .sheet-form select:invalid, .sheet-form textarea:invalid').count()) >= 2, 'empty draft is blocked by required fields');

await page.locator('#mission-title').fill('A focused research brief');
await page.locator('#brief-uri').fill('not-a-url');
await page.locator('#mission-reward').fill('0');
const soon = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16);
await page.locator('#mission-deadline').fill(soon);
await page.locator('.sheet-form .press-btn[type="submit"]').click();
await page.waitForTimeout(300);
check((await page.locator('.error-list li').count()) >= 1, 'invalid URL and pool are rejected');

await page.locator('#brief-uri').fill('https://example.org/research');
await page.locator('#mission-reward').fill('0.05');
await page.locator('.sheet-form .press-btn[type="submit"]').click();
await page.waitForTimeout(350);
check((await page.locator('.review-brief').count()) === 1, 'valid draft reaches the review step');
await page.getByRole('button', { name: 'Edit brief', exact: true }).click();
await page.waitForTimeout(300);
check((await page.locator('#mission-title').count()) === 1, 'edit returns to the draft step');
await page.locator('.sheet-head .ghost-key').click();
await page.waitForTimeout(250);

await page.locator('.wallet-tag').click();
await page.waitForTimeout(400);
check((await page.locator('.press-chit').count()) === 1, 'connect without a wallet shows the fault toast');
await page.locator('.press-chit .ghost-key').last().click().catch(() => {});
await page.waitForTimeout(200);

await page.locator('.foot-base .press-link').click();
await page.waitForTimeout(700);
check(await page.evaluate(() => window.scrollY < 40), 'back to top returns to the top');

await desktop.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
const m = await mobile.newPage();
m.on('console', (msg) => msg.type() === 'error' && consoleErrors.push(msg.text()));
await m.goto(BASE, { waitUntil: 'networkidle' });
await m.waitForTimeout(300);
check((await m.locator('.dock').count()) === 1, 'mobile keeps the floating dock');
await m.locator('.dock-key[aria-label="Toggle navigation"]').click();
await m.waitForTimeout(300);
check((await m.locator('#site-contents').count()) === 1, 'dock contents key opens the plate');
await m.locator('.dock-row').filter({ hasText: 'My briefs' }).click();
await m.waitForTimeout(300);
check((await m.locator('.board-empty').count()) === 1, 'contents plate navigates to the activity view');
check((await m.locator('#site-contents').count()) === 0, 'contents plate closes after navigation');

await m.locator('.dock-key[aria-label="Toggle navigation"]').click();
await m.waitForTimeout(250);
await m.keyboard.press('Escape');
await m.waitForTimeout(250);
check((await m.locator('#site-contents').count()) === 0, 'Escape dismisses the mobile contents plate');
await m.locator('.dock-key[aria-label="Toggle navigation"]').click();
await m.waitForTimeout(250);
await m.locator('.dock-plate-head .ghost-key').click();
await m.waitForTimeout(250);
check((await m.locator('#site-contents').count()) === 0, 'close key dismisses the plate');
await mobile.close();

await browser.close();
console.log(`\n${passed} passed, ${failures.length} failed`);
console.log('console errors:', consoleErrors.length);
if (consoleErrors.length) console.log(consoleErrors.slice(0, 5));
if (failures.length) process.exitCode = 1;
