import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

const output = fileURLToPath(new URL('../output/playwright/', import.meta.url));
const socialHost = /(^|\.)(twitter\.com|x\.com|t\.co)\.*$/i;
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
const briefFile = 'settiva-bounty-brief.md';
const savedKey = 'settiva-saved';
const legacyKeys = ['yovinx-saved', 'tallyvein-saved', 'quilsted-saved', 'buidlspur-saved', 'citevra-saved', 'attestora-saved'];

/**
 * User-flow, viewport and accessibility checks for the Settiva paper edition.
 *
 * The edition is a single editorial column: masthead, index spread, dossier
 * article, field guide and colophon. A selected brief replaces the index in the
 * flow; it does not open a side pane or a dialog. Below 900 px the primary
 * navigation becomes a full-screen contents menu.
 *
 * Every flow runs against the local sample feed. No wallet is installed, no
 * transaction signs, and every write path must remain disabled.
 */
export async function runUiQa(browser, url = 'http://127.0.0.1:42705/') {
  assert(['127.0.0.1', 'localhost'].includes(new URL(url).hostname), 'QA requires a local preview');
  await mkdir(output, { recursive: true });
  const report = {
    date: new Date().toISOString(),
    url,
    identity: {},
    flows: [],
    viewports: [],
    accessibility: [],
    gates: [],
    errors: [],
  };
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  let sampleCount = 0;
  page.on('pageerror', error => report.errors.push(`pageerror: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(`console: ${message.text()}`); });
  page.on('requestfailed', request => report.errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', response => { if (response.status() >= 400) report.errors.push(`http ${response.status()}: ${response.url()}`); });

  const isMenuLayout = () => page.evaluate(() => matchMedia('(max-width: 900px)').matches);
  const entryCount = () => page.locator('.entry-open').count();
  const dossierTitle = () => page.locator('.dossier-title').innerText();
  async function clearOverlays() {
    for (let attempt = 0; attempt < 4; attempt++) {
      const dialogOpen = await page.locator('dialog.modal[open]').count();
      const menuOpen = await page.locator('.nav-overlay').count();
      if (!dialogOpen && !menuOpen) return;
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
    }
  }
  async function openPage(name) {
    await clearOverlays();
    if (await isMenuLayout()) {
      await page.getByRole('button', { name: 'Toggle navigation' }).click();
      await page.locator('.nav-overlay').getByRole('button', { name, exact: false }).first().click();
    } else {
      await page.locator('.masthead-nav').getByRole('button', { name, exact: false }).filter({ hasText: name }).first().click();
    }
    await page.waitForTimeout(300);
  }
  async function audit(name) {
    const results = await new AxeBuilder({ page }).withTags(tags).analyze();
    report.accessibility.push({
      name,
      viewport: await page.evaluate(() => innerWidth),
      violations: results.violations.map(violation => ({
        id: violation.id,
        impact: violation.impact,
        targets: violation.nodes.map(node => node.target.join(' ')),
      })),
    });
    return results.violations;
  }
  async function capture(name, fullPage = false) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: path.join(output, `settiva-edition-${name}.png`), fullPage, scale: 'css' });
  }
  async function auditWriteGates(label) {
    const gates = await page.evaluate(() => {
      const labels = ['Submit proof', 'Fund brief', 'Approve', 'Return unallocated funds', 'Publish & fund', 'Claim rewards'];
      return [...document.querySelectorAll('button')]
        .filter(button => labels.some(label => button.textContent.trim().startsWith(label)))
        .map(button => ({ label: button.textContent.replace(/\s+/g, ' ').trim(), disabled: button.disabled }));
    });
    report.gates.push({ label, gates });
    assert(gates.every(gate => gate.disabled), `${label}: every write control must be disabled in the preview`);
    return gates;
  }

  try {
    // -- Flow 1: legacy bookmark keys migrate without clearing the list ------
    for (const legacyKey of legacyKeys) {
      const migrationContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const migrationPage = await migrationContext.newPage();
      await migrationPage.addInitScript(key => localStorage.setItem(key, JSON.stringify(['sample-3'])), legacyKey);
      await migrationPage.goto(url, { waitUntil: 'networkidle' });
      await migrationPage.locator('.entry-open').first().waitFor();
      assert.equal(await migrationPage.evaluate(key => localStorage.getItem(key), savedKey), JSON.stringify(['sample-3']), `${legacyKey} must migrate into ${savedKey}`);
      assert.equal(await migrationPage.locator('.entry-save[aria-pressed="true"]').count(), 1, `${legacyKey}: the migrated bookmark must reach its row`);
      assert.equal(await migrationPage.evaluate(key => localStorage.getItem(key), legacyKey), JSON.stringify(['sample-3']), `${legacyKey}: the legacy record is not wiped`);
      await migrationContext.close();
    }
    report.flows.push(`Legacy bookmark keys (${legacyKeys.join(', ')}) migrate into ${savedKey}, keep their row state and leave the legacy record in place`);

    // -- Flow 2: identity, edition notice and the retired terminal surface ---
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.locator('.entry-open').first().waitFor();
    report.identity = await page.evaluate(() => ({
      title: document.title,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      themeColor: document.querySelector('meta[name="theme-color"]')?.content,
      favicon: document.querySelector('link[rel="icon"]')?.getAttribute('href'),
      ogSiteName: document.querySelector('meta[property="og:site_name"]')?.content,
      twitterMeta: document.querySelectorAll('meta[name^="twitter:"]').length,
      wordmark: document.querySelector('.wordmark-text')?.textContent?.trim(),
      tagline: document.querySelector('.masthead-tagline')?.textContent?.trim(),
      footer: document.querySelector('.colophon')?.textContent?.replace(/\s+/g, ' ').trim(),
      retired: document.querySelectorAll('.chain-header, .tab-rail, .filter-bar, .reg-row, .inspector, .status-strip, .pane-head, .deck-body, .nav-sheet').length,
      editorial: ['.masthead', '.hero', '.index-sheet', '.entry', '.ledger-summary', '.colophon'].filter(selector => document.querySelector(selector)).length,
    }));
    assert.match(report.identity.title, /^Settiva/);
    assert.match(report.identity.canonical, /^https:\/\/settiva\.xyz\/$/);
    assert.equal(report.identity.themeColor, '#f3ede1');
    assert.match(report.identity.favicon, /settiva-favicon\.svg$/);
    assert.equal(report.identity.ogSiteName, 'Settiva');
    assert.equal(report.identity.twitterMeta, 0, 'No twitter: metadata may ship');
    assert.equal(report.identity.wordmark, 'Settiva.');
    assert.equal(report.identity.tagline, 'Two paths in. One record out.');
    assert.match(report.identity.footer, /NO WRITES/);
    assert.match(report.identity.footer, /SAMPLE TESTNET DATA/);
    assert.equal(report.identity.retired, 0, 'The terminal header, tab rail, registry table, inspector and status strip must be gone');
    assert.equal(report.identity.editorial, 6, 'The masthead, hero, index, entry, ledger and colophon must all render');    const links = await page.locator('a[href]').evaluateAll(els => els.map(el => el.href));
    assert(!links.some(href => socialHost.test(new URL(href).hostname)), 'No social destinations may be linked');
    sampleCount = await entryCount();
    assert(sampleCount >= 4, 'The sample feed must populate the index');
    report.flows.push('Identity, canonical URL, paper theme colour, mark, wordmark, tagline and no-writes notice ship; the terminal skeleton is absent');

    // -- Flow 3: an entry replaces the index with a dossier in the flow ------
    const firstTitle = await page.locator('.entry-title').first().innerText();
    await page.locator('.entry-open').first().click();
    await page.waitForTimeout(250);
    assert.equal(await page.locator('dialog[open]').count(), 0, 'A brief detail must not open a dialog');
    assert.equal(await page.locator('.dossier').count(), 1);
    assert.equal(await page.locator('.index-sheet').count(), 0, 'The dossier replaces the index instead of sitting beside it');
    assert.equal(await dossierTitle(), firstTitle);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'dossier-title', 'The dossier heading takes focus');
    await page.locator('.back-link').click();
    await page.waitForTimeout(250);
    assert.equal(await page.locator('.index-sheet').count(), 1, 'Back returns to the index');
    assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('entry-open')), true, 'Back returns focus to an entry');
    report.flows.push('Selecting an entry replaces the index with an in-flow dossier, focuses its heading and returns focus to the index');
    await page.locator('.entry-open').first().click();
    await page.waitForTimeout(200);

    // -- Flow 4: dossier sections and gated write surfaces -------------------
    const dossierText = await page.locator('.dossier').innerText();
    assert.match(dossierText, /BRIEF SCOPE/i);
    assert.match(dossierText, /SUBMIT EVIDENCE & FUND THE POOL/i);
    assert.match(dossierText, /EVIDENCE AND CREATOR REVIEW/i);
    assert.match(await page.locator('#contribute').innerText(), /Writes stay gated/);
    assert(await page.locator('#evidence-uri').isVisible());
    assert(await page.locator('#fund-amount').isVisible());
    await auditWriteGates('sample-dossier');
    assert.match(await page.locator('#review').innerText(), /No evidence submitted yet/i);
    await page.getByRole('button', { name: 'Open contribution options', exact: true }).click();
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'evidence-uri', 'The contribution action focuses the evidence field');
    report.flows.push('Dossier scope, contribution, review and gate copy all render; sample writes are disabled and the section action focuses the evidence field');

    // -- Flow 5: search, topic and standing filters, sort and reset ----------
    await page.locator('.back-link').click();
    await page.waitForTimeout(250);
    const searchbox = page.getByRole('searchbox', { name: 'Search briefs' });
    await searchbox.fill('liquidity');
    await page.waitForTimeout(200);
    assert.equal(await entryCount(), 1, 'Search narrows the index');
    await page.getByRole('button', { name: 'Clear search', exact: true }).click();
    assert.equal(await searchbox.inputValue(), '');
    assert.equal(await entryCount(), sampleCount);
    const topics = page.locator('[aria-label="Filter by topic"]');
    for (const topic of ['Market structure', 'Tokenized assets', 'Ecosystem', 'Risk research']) {
      await topics.getByRole('button', { name: new RegExp(`^${topic}`) }).click();
      assert.equal(await entryCount(), 1, `${topic} must select exactly one sample brief`);
      assert.equal((await page.locator('.entry-topic').innerText()).trim(), topic.toUpperCase());
      assert.equal(await topics.getByRole('button', { name: 'All topics', exact: false }).getAttribute('aria-pressed'), 'false');
    }
    const standings = page.locator('[aria-label="Filter by state"]');
    await standings.getByRole('button', { name: /^Open/ }).click();
    assert.equal(await entryCount(), 0, 'A topic and an impossible standing compose to an empty index');
    assert.match(await page.locator('.empty-note').innerText(), /No brief matches this view/);
    await standings.getByRole('button', { name: /^Sample/ }).click();
    assert.equal(await entryCount(), 1);
    for (const sort of ['newest', 'recommended', 'reward', 'deadline']) {
      await page.getByLabel('Sort briefs', { exact: true }).selectOption(sort);
      assert.equal(await entryCount(), 1, `Sorting by ${sort} keeps the filtered set`);
    }
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.waitForTimeout(400);
    assert.equal(await entryCount(), sampleCount, 'Reset restores the full index');
    assert.equal(await searchbox.inputValue(), '');
    assert.equal(await topics.getByRole('button', { name: 'All topics', exact: false }).getAttribute('aria-pressed'), 'true');
    await page.getByLabel('Sort briefs', { exact: true }).selectOption('reward');
    await page.waitForTimeout(200);
    assert.equal((await page.locator('.entry-pool strong').first().innerText()).trim(), '0.12', 'Highest pool sorts first');
    await page.getByLabel('Sort briefs', { exact: true }).selectOption('newest');
    report.flows.push('Search, four topic filters, four standing filters, four sort choices and Reset drive the index and recover from an empty result');

    // -- Flow 6: saved entries, toast undo, reload and the Saved page --------
    await page.locator('.entry-save').first().click();
    await page.waitForTimeout(250);
    assert.match(await page.locator('.toast').innerText(), /Saved to your list/);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), savedKey), JSON.stringify(['sample-1']));
    await page.locator('.toast').getByRole('button', { name: 'Undo', exact: true }).click();
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), savedKey), '[]', 'Undo reverses the saved-list change');
    assert.match(await page.locator('.toast').innerText(), /Saved-list change undone/);
    assert.equal(await page.locator('.toast').getByRole('button', { name: 'Undo', exact: true }).count(), 0, 'A completed Undo does not expose the obsolete action');
    await page.locator('.toast').getByRole('button', { name: 'Dismiss notification', exact: true }).click();
    await page.locator('.entry-save').nth(1).click();
    await page.waitForTimeout(250);
    await page.locator('.toast').getByRole('button', { name: 'Dismiss notification', exact: true }).click();
    const savedTitle = await page.locator('.entry-title').nth(1).innerText();
    await openPage('Saved');
    assert.equal(await entryCount(), 1, 'The Saved page lists the kept brief');
    assert.match(await page.locator('.index-title').innerText(), /Saved briefs/);
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.entry-open').first().waitFor();
    await openPage('Saved');
    assert.equal(await page.locator('.entry-title').innerText(), savedTitle, 'The saved list survives a reload');
    await page.locator('.entry-save').click();
    await page.waitForTimeout(250);
    assert.match(await page.locator('.empty-note').innerText(), /Nothing saved yet/);
    await openPage('Index');
    assert.equal(await entryCount(), sampleCount);
    report.flows.push('Keep, toast Undo, dismiss, reload persistence, the Saved page and its empty state all behave');

    // -- Flow 7: the four pages and the field guide --------------------------
    await openPage('My briefs');
    assert.equal(await page.locator('.index-sheet').count(), 1);
    assert.match(await page.locator('.empty-note').innerText(), /No briefs from this wallet yet/);
    assert(await page.locator('.empty-note').getByRole('button', { name: 'Connect wallet', exact: true }).isVisible());
    await openPage('Guide');
    assert.equal(await page.locator('#guide').count(), 1, 'The Guide page renders the field guide');
    assert.equal(await page.locator('.index-sheet').count(), 0, 'The field guide replaces the index');
    assert.equal(await page.locator('.search-line').count(), 0, 'The field guide drops the index controls');
    assert.equal(await page.locator('.masthead-nav').count(), 1, 'The masthead stays available for navigation');
    assert.equal(await page.locator('dialog[open]').count(), 0, 'The field guide is not a modal');
    assert.match(await page.locator('.colophon').innerText(), /Settiva/);
    assert((await page.locator('.guide-faq details').count()) >= 4, 'The guide carries the FAQ');
    for (const summary of await page.locator('.guide-faq summary').all()) {
      await summary.click();
      await summary.click();
    }
    for (const summary of await page.locator('.guide-faq summary').all()) {
      assert.equal(await summary.locator('svg').count(), 1, 'Each FAQ row exposes exactly one marker glyph');
      assert.equal(await summary.evaluate(el => getComputedStyle(el, '::after').content), 'none', 'No generated marker duplicates the FAQ affordance');
    }
    await openPage('Index');
    report.flows.push('Index, Saved, My briefs and Guide are full pages; Guide replaces the index, keeps the masthead, carries the FAQ and has one marker per row');

    // -- Flow 8: draft sheet, validation, review, download and retained draft -
    await page.locator('.index-lead-actions .ink-button').click();
    await page.locator('dialog[open]').waitFor();
    assert.equal(await page.locator('#dialog-title').innerText(), 'Post a brief');
    await page.getByLabel('What should this brief answer?', { exact: true }).fill('Which primary sources explain settlement risk?');
    await page.locator('#mission-draft').fill('Compare primary sources and explain their limitations.');
    await page.getByLabel('Public brief URL', { exact: true }).fill('javascript:alert(1)');
    await page.locator('#mission-reward').fill('0.000000001');
    const deadline = new Date(Date.now() + 86400000 * 7);
    await page.locator('#mission-deadline').fill(new Date(deadline.getTime() - deadline.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    await page.getByRole('button', { name: 'Review brief', exact: true }).click();
    assert.equal(await page.locator('#brief-uri').getAttribute('aria-invalid'), 'true', 'An unsafe URL is rejected inline');
    assert.equal(await page.locator('#brief-uri').evaluate(el => el === document.activeElement), true, 'The first invalid field takes focus');
    assert.match(await page.locator('.field-error').first().innerText(), /public https/i);
    await page.locator('#mission-reward').fill('0');
    await page.locator('#brief-uri').fill('https://example.com/research');
    await page.getByRole('button', { name: 'Review brief', exact: true }).click();
    assert.equal(await page.locator('#mission-reward').getAttribute('aria-invalid'), 'true', 'A zero reward is rejected');
    await page.locator('#mission-reward').fill('0.000000001');
    await page.getByRole('button', { name: 'Review brief', exact: true }).click();
    await page.locator('.review-mission').waitFor();
    assert.match(await page.locator('.review-mission').innerText(), /0\.000000001/);
    assert.equal(await page.locator('.review-mission h3').evaluate(el => el === document.activeElement), true);
    assert(await page.getByRole('button', { name: 'Download brief', exact: true }).isVisible());
    await auditWriteGates('create-review');
    await capture('create-review');
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download brief', exact: true }).click();
    const download = await downloaded;
    assert.equal(download.suggestedFilename(), briefFile);
    const draft = await readFile(await download.path(), 'utf8');
    assert.match(draft, /^# Which primary sources explain settlement risk\?/m);
    assert.match(draft, /Settiva \/ Market structure/);
    assert.match(draft, /0\.000000001 testnet SOL/);
    assert.match(draft, /no intended monetary value/);
    report.download = { suggestedFilename: download.suggestedFilename(), bytes: Buffer.byteLength(draft) };
    await page.getByRole('button', { name: 'Edit brief', exact: true }).click();
    assert.equal(await page.locator('#mission-reward').inputValue(), '0.000000001', 'Editing returns to the retained draft');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    assert.equal(await page.locator('dialog[open]').count(), 0, 'Escape closes the draft sheet');
    assert.equal(await page.evaluate(() => document.body.style.overflow), '', 'Escape releases the scroll lock');
    await page.locator('.index-lead-actions .ink-button').click();
    assert.equal(await page.locator('#mission-title').inputValue(), 'Which primary sources explain settlement risk?', 'The draft survives a reopen');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    report.flows.push('Draft sheet: invalid URL and zero reward are rejected with focus management, review echoes the exact amount, the draft downloads as a Settiva markdown file, and the draft survives close and reopen');

    // -- Flow 9: the wallet gate stays gated -------------------------------
    await clearOverlays();
    await page.locator('.wallet-link').click();
    await page.getByText(/No Solana wallet found/i).first().waitFor();
    await auditWriteGates('wallet-gate-toast');
    await page.getByRole('button', { name: 'Dismiss wallet error', exact: true }).click();
    await page.waitForTimeout(200);
    await openPage('My briefs');
    await page.locator('.empty-note').getByRole('button', { name: 'Connect wallet', exact: true }).click();
    await page.getByText(/No Solana wallet found/i).first().waitFor();
    await page.getByRole('button', { name: 'Dismiss wallet error', exact: true }).click();
    await page.waitForTimeout(200);
    await openPage('Index');
    report.flows.push('The wallet gate stays gated at every entry point and exposes no enabled write');

    // -- Flow 10: skip link and entry keyboard navigation -------------------
    await clearOverlays();
    await page.evaluate(() => {
      document.activeElement?.blur?.();
      document.body.setAttribute('tabindex', '-1');
      document.body.focus();
      document.body.removeAttribute('tabindex');
    });
    await page.keyboard.press('Tab');
    const skip = await page.evaluate(() => ({
      className: document.activeElement?.className,
      targetExists: !!document.querySelector(document.activeElement?.getAttribute('href') || '#none'),
    }));
    assert.equal(skip.className, 'skip-link', 'The skip link is first in the tab order');
    assert.equal(skip.targetExists, true, 'The skip link target exists');
    await page.locator('.entry-open').first().focus();
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-key')), 'sample-2', 'ArrowDown moves to the next entry');
    await page.keyboard.press('End');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-key')), `sample-${sampleCount}`, 'End moves to the last entry');
    const lastEntryTitle = await page.locator('.entry-title').last().innerText();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(250);
    assert.equal(await dossierTitle(), lastEntryTitle, 'Enter opens the focused entry in the dossier');
    await page.locator('.back-link').click();
    report.flows.push('Skip link leads the tab order to an existing target; ArrowDown/End and Enter drive the entry index');

    // -- Flow 11: narrow layout, in-flow dossier and contents menu ----------
    await page.setViewportSize({ width: 420, height: 900 });
    await page.waitForTimeout(300);
    await openPage('Index');
    const sheetTitle = await page.locator('.entry-title').nth(2).innerText();
    await page.locator('.entry-open').nth(2).click();
    await page.waitForTimeout(350);
    assert.equal(await dossierTitle(), sheetTitle);
    assert.equal(await page.locator('.dossier').evaluate(el => getComputedStyle(el).position), 'static', 'The dossier stays in the reading flow on mobile');
    await capture('mobile-dossier');
    await page.locator('.back-link').click();
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => document.activeElement?.className), 'entry-open', 'Back returns focus to the entry');
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await page.waitForTimeout(250);
    const menu = page.locator('.nav-overlay');
    await menu.waitFor();
    assert.equal(await page.locator('.nav-scrim').count(), 1);
    for (const name of ['Index', 'Saved', 'My briefs', 'Guide']) {
      assert.equal(await menu.getByRole('button', { name, exact: false }).count(), 1, `The contents menu lists ${name}`);
    }
    await capture('mobile-menu');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.nav-overlay').count(), 0, 'Escape closes the contents menu');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForTimeout(300);
    report.flows.push('Below 900 px the dossier stays in flow with focus return, and navigation is a full-screen contents menu that Escape closes');

    // -- Flow 12: six viewports, numeric fit and accessibility -------------
    await page.reload({ waitUntil: 'networkidle' });
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      const height = width < 768 ? 844 : 1000;
      await page.setViewportSize({ width, height });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.locator('.entry-open').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const fit = await page.evaluate(() => {
        const row = document.querySelector('.entry-open').getBoundingClientRect();
        const titleStyle = getComputedStyle(document.querySelector('.entry-title'));
        return {
          width: innerWidth,
          height: innerHeight,
          scrollWidth: document.documentElement.scrollWidth,
          rowInsideViewport: row.left >= 0 && row.right <= innerWidth,
          rowRect: { left: Math.round(row.left), right: Math.round(row.right), width: Math.round(row.width) },
          displayFont: titleStyle.fontFamily,
          bodyFont: getComputedStyle(document.body).fontFamily,
          footerText: document.querySelector('.colophon').textContent.replace(/\s+/g, ' ').trim(),
        };
      });
      report.viewports.push(fit);
      assert(fit.scrollWidth <= width, `Horizontal overflow at ${width}: document width ${fit.scrollWidth}`);
      assert(fit.rowInsideViewport, `Entries must fit the viewport at ${width}: ${JSON.stringify(fit)}`);
      assert.match(fit.displayFont, /Georgia/, 'The display voice stays Georgia');
      assert.match(fit.bodyFont, /Segoe UI/, 'The reading voice stays Segoe UI');
      assert.match(fit.footerText, /NO WRITES/, 'The no-writes notice must survive every viewport');
      assert.match(fit.footerText, /SAMPLE TESTNET DATA/, 'The sample notice must survive every viewport');
      await capture(String(width));
      if ([320, 420, 768, 1440].includes(width)) await audit(`page-${width}`);
    }

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('.entry-open').first().click();
    await page.waitForTimeout(300);
    await audit('desktop-dossier');
    await page.setViewportSize({ width: 420, height: 900 });
    await page.waitForTimeout(350);
    await audit('mobile-dossier');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForTimeout(350);
    await openPage('Guide');
    await audit('desktop-guide');
    await openPage('Index');
    await page.locator('.index-lead-actions .ink-button').click();
    await page.locator('dialog[open]').waitFor();
    await audit('draft-sheet');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    report.flows.push('Six viewports fit without sideways scroll, keep the Georgia reading voice and carry the sample gate into the colophon');

    assert.deepEqual(report.errors, [], `Console, page and network errors: ${report.errors.join(' | ')}`);
    const failures = report.accessibility.filter(entry => entry.violations.length);
    assert.equal(failures.length, 0, `Accessibility violations: ${failures.map(entry => `${entry.name}@${entry.viewport}: ${entry.violations.map(v => `${v.id} ${v.targets.join(',')}`).join('; ')}`).join(' | ')}`);
    report.result = 'passed';
    return report;
  } catch (error) {
    report.result = 'failed';
    report.failure = error.stack;
    await capture('ui-failure').catch(() => {});
    throw error;
  } finally {
    await writeFile(path.join(output, 'settiva-edition-ui-results.json'), JSON.stringify(report, null, 2) + '\n');
    await context.close();
  }
}

if (typeof process !== 'undefined' && process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const browser = await chromium.launch({ headless: true });
  try {
    const report = await runUiQa(browser, process.argv[2]);
    console.log(JSON.stringify({
      result: report.result,
      identity: report.identity,
      flows: report.flows,
      viewports: report.viewports.map(v => ({ width: v.width, scrollWidth: v.scrollWidth })),
      accessibility: report.accessibility.map(a => `${a.name}@${a.viewport}: ${a.violations.length}`),
      gates: report.gates.map(g => `${g.label}: ${g.gates.length} disabled`),
      download: report.download,
    }, null, 2));
  } finally { await browser.close(); }
}
