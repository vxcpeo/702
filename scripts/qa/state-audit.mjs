/**
 * State-by-state review of the reskinned Ledgiva site.
 *
 * The pipeline verifies the single static route "/"; this script exercises the
 * state-driven views and overlays that route can show, auditing each for one h1,
 * horizontal overflow, unnamed controls, missing image alt text, WCAG axe
 * violations and console errors, and capturing a full-page screenshot.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '.reskin', 'review');
const BASE = process.env.REVIEW_URL || 'http://127.0.0.1:4320/';
const req = createRequire(path.join(ROOT, 'package.json'));
const { chromium } = req('playwright');
const { AxeBuilder } = req('@axe-core/playwright');

await fs.mkdir(OUT, { recursive: true });

const report = { base: BASE, captures: [], console: [] };
const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--hide-scrollbars'] });

async function audit(page, label) {
  const data = await page.evaluate(() => {
    const visible = (el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const h1 = [...document.querySelectorAll('h1')].filter(visible).map((el) => el.textContent.trim());
    const nameless = [...document.querySelectorAll('button, a[href], input, select, textarea')]
      .filter(visible)
      .filter((el) => {
        const name = (el.getAttribute('aria-label') || el.innerText || el.value || el.getAttribute('title') || '').trim();
        const labelled = el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        return !name && !labelled && !el.getAttribute('aria-labelledby');
      })
      .map((el) => el.tagName.toLowerCase() + '.' + (el.className || '').toString().slice(0, 48));
    const noAlt = [...document.querySelectorAll('img')].filter(visible).filter((img) => !img.hasAttribute('alt')).length;
    return {
      title: document.title,
      h1,
      nameless,
      noAlt,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const violations = axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
  const overflow = data.scrollWidth > data.clientWidth + 2;
  report.captures.push({ label, ...data, axe: violations, overflow });
  console.log(
    `${label}: h1=${data.h1.length} | overflow=${overflow} (${data.scrollWidth}/${data.clientWidth}) | axe=${violations.length} | nameless=${data.nameless.length} | noAlt=${data.noAlt}`,
  );
  await page.screenshot({ path: path.join(OUT, `${label}.png`), fullPage: true });
}

async function watch(page) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') report.console.push(msg.text());
  });
  page.on('pageerror', (err) => report.console.push(`pageerror: ${err.message}`));
}

async function main() {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await desktop.newPage();
  await watch(page);

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await audit(page, '01-index-desktop');

  await page.locator('.route-tile').filter({ hasText: 'Guide' }).click();
  await page.waitForTimeout(350);
  await audit(page, '02-guide-desktop');

  await page.locator('.route-tile').filter({ hasText: 'Saved' }).click();
  await page.waitForTimeout(300);
  await audit(page, '03-saved-desktop');

  await page.locator('.route-tile').filter({ hasText: 'My briefs' }).click();
  await page.waitForTimeout(300);
  await audit(page, '04-activity-desktop');

  await page.locator('.route-tile').filter({ hasText: 'Index' }).click();
  await page.waitForTimeout(300);
  await page.locator('#brief-search').fill('liquidity');
  await page.waitForTimeout(350);
  await audit(page, '05-filtered-desktop');
  await page.locator('.query-bar .press-link').click();
  await page.waitForTimeout(250);

  await page.locator('.card-open').first().click();
  await page.waitForTimeout(400);
  await audit(page, '06-dossier-desktop');

  await page.locator('.print-nav .press-link').click();
  await page.waitForTimeout(300);
  await page.locator('.mast-acts .press-btn').click();
  await page.waitForTimeout(450);
  await audit(page, '07-create-desktop');

  await page.locator('#mission-title').fill('A focused research brief');
  await page.locator('#brief-uri').fill('https://example.org/research');
  await page.locator('#mission-reward').fill('0.05');
  const soon = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16);
  await page.locator('#mission-deadline').fill(soon);
  await page.locator('.sheet-form .press-btn[type="submit"]').click();
  await page.waitForTimeout(350);
  await audit(page, '08-review-desktop');
  await page.locator('.sheet-head .ghost-key').click();
  await page.waitForTimeout(250);

  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const m = await mobile.newPage();
  await watch(m);
  await m.goto(BASE, { waitUntil: 'networkidle' });
  await m.waitForTimeout(400);
  await audit(m, '09-index-mobile');

  await m.locator('.dock-key[aria-label="Toggle navigation"]').click();
  await m.waitForTimeout(300);
  await audit(m, '10-contents-mobile');
  await m.locator('.dock-plate-head .ghost-key').click();
  await m.waitForTimeout(250);

  await m.locator('.card-open').first().click();
  await m.waitForTimeout(400);
  await audit(m, '11-dossier-mobile');
  await m.locator('.print-nav .press-link').click();
  await m.waitForTimeout(300);

  await m.getByRole('button', { name: 'Post a brief', exact: true }).first().click();
  await m.waitForTimeout(450);
  await audit(m, '12-create-mobile');
  await m.locator('.sheet-head .ghost-key').click();
  await mobile.close();

  await browser.close();
  await fs.writeFile(path.join(OUT, 'review.json'), JSON.stringify(report, null, 2), 'utf8');
  const problems = report.captures.filter(
    (c) => c.overflow || c.h1.length !== 1 || c.nameless.length || c.noAlt || c.axe.length,
  );
  console.log('console errors:', report.console.length, report.console.slice(0, 6));
  console.log('states with problems:', problems.map((p) => p.label));
  if (problems.length) process.exitCode = 1;
}

await main();
