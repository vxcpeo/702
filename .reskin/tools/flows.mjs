import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const BASE = process.env.REVIEW_URL || 'http://127.0.0.1:4944/';
const EXEC = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1247/chrome-win64/chrome.exe';
const { chromium } = createRequire(path.join(ROOT, 'package.json'))('playwright');

const results = [];
const errors = [];
const check = (name, condition, detail = '') => {
  results.push({ name, passed: Boolean(condition), detail });
  if (!condition) console.log(`FAIL ${name} ${detail}`);
};

const browser = await chromium.launch({ headless: true, executablePath: EXEC, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await context.newPage();
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);

// search
await page.locator('.lookup-slot input').fill('liquidity');
await page.waitForTimeout(250);
check('search narrows the ledger', (await page.locator('.row-open').count()) === 1, String(await page.locator('.row-open').count()));
await page.locator('.lookup-clear').click();
await page.waitForTimeout(250);
check('clear search restores four rows', (await page.locator('.row-open').count()) === 4);

// topic filter
await page.locator('.chan-chip').filter({ hasText: 'Risk research' }).click();
await page.waitForTimeout(250);
check('topic filter narrows to one row', (await page.locator('.row-open').count()) === 1);
await page.locator('.reset-key').click();
await page.waitForTimeout(300);
check('reset returns the full index', (await page.locator('.row-open').count()) === 4);

// sort
await page.locator('.order-slot select').selectOption('reward');
await page.waitForTimeout(300);
check('highest pool sorts first', (await page.locator('.row-pool strong').first().innerText()).trim() === '0.12');
await page.locator('.order-slot select').selectOption('newest');
await page.waitForTimeout(300);

// keyboard row navigation
await page.locator('.row-open').first().focus();
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(150);
const secondKey = await page.evaluate(() => document.activeElement?.getAttribute('data-key'));
check('ArrowDown moves to the next row', secondKey === 'sample-2', String(secondKey));
await page.keyboard.press('Home');
await page.waitForTimeout(150);
const firstKey = await page.evaluate(() => document.activeElement?.getAttribute('data-key'));
check('Home returns to the first row', firstKey === 'sample-1', String(firstKey));

// dossier and focus return
const firstTitle = (await page.locator('.row-title').first().innerText()).trim();
await page.locator('.row-open').first().click();
await page.waitForTimeout(300);
check('dossier opens with the brief title', (await page.locator('.dossier-title').innerText()).trim() === firstTitle);
check('dossier replaces the index', (await page.locator('.index-deck').count()) === 0);
await page.locator('.back-key').click();
await page.waitForTimeout(300);
const returnedKey = await page.evaluate(() => document.activeElement?.getAttribute('data-key'));
check('closing the dossier returns focus to its row', returnedKey === 'sample-1', String(returnedKey));

// keep and saved list
await page.locator('.row-keep').first().click();
await page.waitForTimeout(250);
check('keep marks the row saved', (await page.locator('.row-keep').first().getAttribute('aria-pressed')) === 'true');
await page.locator('.ticker-chan').filter({ hasText: 'Saved' }).click();
await page.waitForTimeout(300);
check('saved view lists the kept brief', (await page.locator('.row-open').count()) === 1);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.locator('.ticker-chan').filter({ hasText: 'Saved' }).click();
await page.waitForTimeout(300);
check('saved list survives a reload', (await page.locator('.row-open').count()) === 1);
await page.locator('.row-keep').first().click();
await page.waitForTimeout(300);
check('removing the last brief shows the empty state', (await page.locator('.empty-slot').innerText()).includes('Nothing saved yet.'));

// guide
await page.locator('.ticker-chan').filter({ hasText: 'Guide' }).click();
await page.waitForTimeout(300);
check('guide replaces the index', (await page.locator('.guide-deck').count()) === 1);
check('guide drops the index controls', (await page.locator('.lookup').count()) === 0);
const faq = page.locator('.faq-deck details').first();
await faq.locator('summary').click();
await page.waitForTimeout(200);
check('faq opens', (await faq.getAttribute('open')) !== null);

// create sheet validation and review step
await page.locator('.deck-tools .key-action').click();
await page.waitForTimeout(300);
check('create sheet opens', (await page.locator('dialog.sheet[open]').count()) === 1);
await page.locator('#mission-title').fill('An interface rebuild smoke brief');
await page.locator('#mission-draft').fill('Scope, sources and acceptance criteria for the rebuild.');
await page.locator('#brief-uri').fill('https://example.org/brief');
await page.locator('#mission-reward').fill('0.05');
await page.locator('#mission-deadline').fill('2027-01-01T12:00');
await page.locator('.sheet form button[type="submit"]').click();
await page.waitForTimeout(300);
check('review step lists the draft', (await page.locator('.review-brief').count()) === 1);
check('review shows the typed title', (await page.locator('.review-brief h3').innerText()).includes('smoke brief'));
await page.locator('.sheet-actions .ghost-action').click();
await page.waitForTimeout(250);
check('edit returns to step one', (await page.locator('#mission-title').count()) === 1);
const download = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
await page.getByRole('button', { name: /Download your brief/ }).click();
const file = await download;
check('brief downloads as markdown', file?.suggestedFilename() === 'settiva-bounty-brief.md', file?.suggestedFilename() || 'no download');
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
check('Escape closes the sheet', (await page.locator('dialog.sheet[open]').count()) === 0);

// mobile menu
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
await page.locator('.deck-menu').click();
await page.waitForTimeout(250);
check('mobile contents opens', (await page.locator('.channel-deck').count()) === 1);
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
check('Escape closes the contents', (await page.locator('.channel-deck').count()) === 0);
await page.locator('.deck-menu').click();
await page.waitForTimeout(250);
await page.locator('.channel-chan').filter({ hasText: 'Guide' }).click();
await page.waitForTimeout(300);
check('contents navigation changes page', (await page.locator('.guide-deck').count()) === 1);
check('contents closes after navigation', (await page.locator('.channel-deck').count()) === 0);

check('no console or page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
const failed = results.filter((r) => !r.passed);
console.log(`flows: ${results.length - failed.length}/${results.length} pass`);
for (const r of results) console.log(`${r.passed ? 'ok  ' : 'FAIL'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
process.exitCode = failed.length ? 1 : 0;
