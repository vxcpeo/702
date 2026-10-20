import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '.reskin', 'review');
const BASE = process.env.REVIEW_URL || 'http://127.0.0.1:4944/';
const EXEC = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1247/chrome-win64/chrome.exe';
const req = createRequire(path.join(ROOT, 'package.json'));
const { chromium } = req('playwright');
const axePath = createRequire(path.join(ROOT, '.reskin', 'tools', 'package.json')).resolve('axe-core/axe.min.js');

await fs.mkdir(OUT, { recursive: true });

const report = { base: BASE, captures: [], violations: [], console: [] };
const browser = await chromium.launch({ headless: true, executablePath: EXEC, args: ['--no-sandbox', '--hide-scrollbars'] });

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
      .map((el) => el.tagName.toLowerCase() + '.' + (el.className || '').toString().slice(0, 40));
    const noAlt = [...document.querySelectorAll('img')].filter(visible).filter((img) => !img.hasAttribute('alt')).length;
    const bigHeadings = [...document.querySelectorAll('h1,h2,h3')].filter(visible).map((el) => el.tagName + ':' + el.textContent.trim().slice(0, 60));
    return {
      title: document.title,
      h1,
      nameless,
      noAlt,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      height: document.documentElement.scrollHeight,
      headings: bigHeadings,
    };
  });
  const axe = await (async () => {
    await page.addScriptTag({ path: axePath });
    return page.evaluate(async () => {
      const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations'] });
      return result.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }));
    });
  })();
  if (axe.length) report.violations.push({ label, axe });
  const overflow = data.scrollWidth > data.clientWidth + 2;
  report.captures.push({ label, ...data, axe: axe.length, overflow });
  console.log(`${label}: h1=${data.h1.length} | overflow=${overflow} (${data.scrollWidth}/${data.clientWidth}) | axe=${axe.length} | nameless=${data.nameless.length} | noAlt=${data.noAlt}`);
}

async function shot(page, label) {
  await page.screenshot({ path: path.join(OUT, `${label}.png`), fullPage: true });
  await audit(page, label);
}

async function main() {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await desktop.newPage();
  page.on('console', (msg) => { if (msg.type() === 'error') report.console.push(msg.text()); });
  page.on('pageerror', (err) => report.console.push('pageerror: ' + err.message));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await shot(page, '01-index-desktop');

  await page.locator('.ticker-chan').filter({ hasText: 'Guide' }).click();
  await page.waitForTimeout(300);
  await shot(page, '02-guide-desktop');

  await page.locator('.brand-key').click();
  await page.waitForTimeout(300);
  await page.locator('.ticker-chan').filter({ hasText: 'Saved' }).click();
  await page.waitForTimeout(300);
  await shot(page, '03-saved-desktop');

  await page.locator('.ticker-chan').filter({ hasText: 'My briefs' }).click();
  await page.waitForTimeout(300);
  await shot(page, '04-activity-desktop');

  await page.locator('.ticker-chan').filter({ hasText: 'Index' }).click();
  await page.waitForTimeout(300);
  await page.locator('.row-open').first().click();
  await page.waitForTimeout(400);
  await shot(page, '05-dossier-desktop');

  await page.locator('.back-key').click();
  await page.waitForTimeout(300);
  await page.locator('.deck-tools .key-action').click();
  await page.waitForTimeout(400);
  await shot(page, '06-create-desktop');
  await page.locator('.sheet-head .glyph-key').click();
  await page.waitForTimeout(300);

  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const m = await mobile.newPage();
  m.on('console', (msg) => { if (msg.type() === 'error') report.console.push(msg.text()); });
  m.on('pageerror', (err) => report.console.push('pageerror: ' + err.message));
  await m.goto(BASE, { waitUntil: 'networkidle' });
  await m.waitForTimeout(400);
  await shot(m, '07-index-mobile');

  await m.locator('.deck-menu').click();
  await m.waitForTimeout(300);
  await shot(m, '08-menu-mobile');
  await m.locator('.channel-head .glyph-key').click();
  await m.waitForTimeout(200);

  await m.locator('.row-open').first().click();
  await m.waitForTimeout(400);
  await shot(m, '09-dossier-mobile');
  await m.locator('.back-key').click();
  await m.waitForTimeout(300);

  await m.getByRole('button', { name: 'Post a brief', exact: true }).first().click();
  await m.waitForTimeout(400);
  await shot(m, '10-create-mobile');
  await m.locator('.sheet-head .glyph-key').click();

  await mobile.close();
  await browser.close();

  await fs.writeFile(path.join(OUT, 'review.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log('console errors:', report.console.length, report.console.slice(0, 8));
  console.log('axe violation states:', report.violations.length);
  const overflows = report.captures.filter((c) => c.overflow);
  console.log('overflow states:', overflows.map((c) => c.label));
}

await main();
