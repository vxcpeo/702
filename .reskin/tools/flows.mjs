/**
 * Interaction flow checks for the reskinned Trovane site.
 *
 * Covers the behaviours the template rewrite could regress: search, topic and
 * standing filters, sorting, keyboard row navigation, dossier open/close, keep
 * and saved list, guide FAQ, the create sheet's validation/review/edit/escape
 * path, and the mobile contents sheet.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '.reskin', 'review');
const BASE = process.env.REVIEW_URL || 'http://127.0.0.1:4318/';
const req = createRequire(path.join(ROOT, 'package.json'));
const { chromium } = req('playwright');

const log = [];
const failures = [];
function check(condition, label) {
  log.push(`${condition ? 'PASS' : 'FAIL'}  ${label}`);
  if (!condition) failures.push(label);
}

const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--hide-scrollbars'] });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });

  const rows = () => page.locator('.register-row').count();
  check((await rows()) === 4, 'index renders four briefs');

  await page.locator('.query-field input').fill('liquidity');
  await page.waitForTimeout(200);
  check((await rows()) === 1, 'search narrows the ledger to one row');
  await page.locator('.query-clear').click();
  await page.waitForTimeout(200);
  check((await rows()) === 4, 'clear search restores four rows');

  const topic = page.locator('.topic-rail').first().locator('.topic-chip', { hasText: 'Ecosystem' });
  await topic.click();
  await page.waitForTimeout(200);
  check((await rows()) === 1, 'topic filter narrows to one row');
  await page.locator('.query-row .quiet-link').click();
  await page.waitForTimeout(200);
  check((await rows()) === 4, 'reset restores the full ledger');

  const standing = page.locator('.topic-rail').nth(1).locator('.topic-chip', { hasText: 'Open' });
  await standing.click();
  await page.waitForTimeout(200);
  check((await page.locator('.blank-slate').count()) === 1, 'standing filter with no match shows the empty state');
  await page.locator('.blank-slate .text-link').click();
  await page.waitForTimeout(200);

  await page.locator('#brief-order').selectOption('reward');
  await page.waitForTimeout(200);
  const firstPool = await page.locator('.register-pool strong').first().innerText();
  check(firstPool.trim() === '0.12', 'sorting by pool puts the largest pool first');

  await page.locator('.register-open').first().focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(120);
  const focusedKey = await page.evaluate(() => document.activeElement?.getAttribute('data-key'));
  check(Boolean(focusedKey), 'arrow-key navigation moves focus to another row');

  await page.locator('.register-row', { hasText: 'liquidity' }).locator('.register-open').click();
  await page.waitForTimeout(300);
  check((await page.locator('#dossier-title').innerText()).includes('liquidity'), 'opening a row shows its dossier');
  await page.locator('.dossier-nav .text-link').click();
  await page.waitForTimeout(250);
  check((await page.locator('.register-row').count()) === 4, 'back returns to the ledger');

  const keep = page.locator('.register-keep').first();
  await keep.click();
  await page.waitForTimeout(200);
  check((await keep.getAttribute('aria-pressed')) === 'true', 'keep toggles the saved state');
  const savedNav = page.locator('.route-item', { hasText: 'Saved' });
  check((await savedNav.innerText()).includes('1'), 'saved route count increments');
  await savedNav.click();
  await page.waitForTimeout(250);
  check((await page.locator('.register-row').count()) === 1, 'saved view lists the kept brief');
  await page.locator('.register-keep').first().click();
  await page.waitForTimeout(250);
  check((await page.locator('.blank-slate').count()) === 1, 'removing the last keep shows the saved empty state');
  await page.locator('.route-item', { hasText: 'Index' }).click();
  await page.waitForTimeout(200);

  await page.locator('.route-item', { hasText: 'Guide' }).click();
  await page.waitForTimeout(250);
  check((await page.locator('#guide-title').count()) === 1, 'guide renders its title');
  await page.locator('.faq-item').first().locator('summary').click();
  await page.waitForTimeout(150);
  check(await page.locator('.faq-item').first().getAttribute('open') !== null, 'FAQ item opens');

  await page.locator('.mast-tools .action-core').click();
  await page.waitForTimeout(300);
  check((await page.locator('#dialog-title').count()) === 1, 'create sheet opens');
  await page.locator('#mission-title').fill('A focused research brief');
  await page.locator('#brief-uri').fill('not-a-url');
  await page.locator('#mission-reward').fill('0');
  const early = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  await page.locator('#mission-deadline').fill(early);
  await page.locator('.action-core.stretch[type="submit"]').click();
  await page.waitForTimeout(250);
  check((await page.locator('.field-error li').count()) >= 2, 'invalid draft shows validation errors');
  await page.locator('#brief-uri').fill('https://example.org/research');
  await page.locator('#mission-reward').fill('0.05');
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  await page.locator('#mission-deadline').fill(tomorrow);
  await page.locator('.action-core.stretch[type="submit"]').click();
  await page.waitForTimeout(250);
  check((await page.locator('.review-brief').count()) === 1, 'valid draft advances to the review step');
  await page.locator('.review-brief .action-halo').click();
  await page.waitForTimeout(200);
  check((await page.locator('#mission-title').count()) === 1, 'edit returns to the form');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  check(!(await page.locator('#dialog-title').isVisible()), 'Escape closes the sheet');

  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const m = await mobile.newPage();
  await m.goto(BASE, { waitUntil: 'networkidle' });
  await m.locator('.menu-glyph').click();
  await m.waitForTimeout(200);
  check(await m.locator('.contents-plate').isVisible(), 'mobile contents sheet opens');
  await m.locator('.contents-item', { hasText: 'Guide' }).click();
  await m.waitForTimeout(250);
  check((await m.locator('#guide-title').count()) === 1, 'mobile contents navigates to the guide');
  check(!(await m.locator('.contents-plate').isVisible()), 'mobile contents sheet closes after navigation');
  await mobile.close();
} finally {
  await browser.close();
}

await fs.mkdir(OUT, { recursive: true });
await fs.writeFile(path.join(OUT, 'flows.log'), `${log.join('\n')}\n`, 'utf8');
console.log(log.join('\n'));
console.log(`\n${log.length - failures.length}/${log.length} flows passed`);
if (failures.length) {
  console.log('failures:', failures);
  process.exitCode = 1;
}
