import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

const output = fileURLToPath(new URL('../output/playwright/', import.meta.url));
const defaultOrigin = 'http://127.0.0.1:42705';
const briefFile = 'trovane-bounty-brief.md';

/**
 * Independent experience checks for the Trovane paper edition.
 *
 * Covers touch behaviour, reduced motion, forced colours, long-content
 * resilience, the draft download and the two system voices (Georgia for
 * display, Segoe UI for reading). No web font is loaded: the edition sets type
 * from the operating system stacks and every assertion is measured on real
 * elements, never by grepping CSS.
 *
 * Long content is injected into the test DOM only and removed by reloading.
 * No wallet, signing, RPC fixture or transaction is involved.
 */
export async function runExperienceQa(browser, url = `${defaultOrigin}/`) {
  const allowedOrigin = new URL(url).origin;
  assert(['127.0.0.1', 'localhost'].includes(new URL(url).hostname), 'Experience QA only visits a local preview');
  await mkdir(output, { recursive: true });
  const report = {
    date: new Date().toISOString(), url, flows: [], performance: {}, resources: {},
    preferences: {}, typography: {}, syntheticContent: [], screenshots: [], clearance: [],
    errors: [], failedRequests: [], blockedExternalRequests: [],
    scope: 'Local Chromium emulation; cold browser context, no CPU or network throttling; no real-device or field-performance claim. Synthetic DOM content is not production data.',
  };
  const contexts = [];
  const responseRecords = [];
  async function context(options = {}) {
    const current = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block', ...options });
    contexts.push(current);
    await current.route('**/*', route => {
      const requestUrl = route.request().url();
      if (new URL(requestUrl).origin === allowedOrigin || requestUrl.startsWith('blob:') || requestUrl.startsWith('data:')) return route.continue();
      report.blockedExternalRequests.push(requestUrl);
      return route.abort();
    });
    current.on('page', page => {
      page.setDefaultTimeout(20000);
      page.on('pageerror', error => report.errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') report.errors.push(`console: ${message.text()}`); });
      page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), failure: request.failure()?.errorText }));
    });
    return current;
  }
  async function ready(page) {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.locator('.entry-open').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    const footerText = await page.locator('.colophon').innerText();
    assert.match(footerText, /NO WRITES/, 'The no-writes notice must be present');
    assert.match(footerText, /SAMPLE TESTNET DATA/, 'The notice must name the sample feed');
  }
  async function capture(page, filename, fullPage = false) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: path.join(output, filename), fullPage, scale: 'css' });
    report.screenshots.push(filename);
  }
  async function fit(page, name, selectors) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const result = await page.evaluate(({ name, selectors }) => {
      const root = document.documentElement;
      const boxes = selectors.flatMap(selector => Array.from(document.querySelectorAll(selector), el => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const range = document.createRange();
        range.selectNodeContents(el);
        const textRects = Array.from(range.getClientRects());
        return {
          selector, clientWidth: el.clientWidth, scrollWidth: el.scrollWidth,
          left: rect.left, right: rect.right, width: rect.width,
          scrollOverflow: el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1,
          contentOutsideBox: textRects.some(r => r.width > 0 && (r.left < rect.left - 1 || r.right > rect.right + 1)),
          overflowX: style.overflowX, overflowWrap: style.overflowWrap,
        };
      }));
      return { name, viewport: innerWidth, scrollWidth: root.scrollWidth, boxes };
    }, { name, selectors });
    report.syntheticContent.push(result);
    assert(result.scrollWidth <= result.viewport + 1, `${name}: document overflows`);
    for (const box of result.boxes) {
      assert(!box.contentOutsideBox, `${name}: content exceeds ${box.selector}`);
    }
    return result;
  }
  async function openPage(page, name, mobile) {
    if (mobile) {
      await page.getByRole('button', { name: 'Toggle navigation' }).tap();
      await page.locator('.nav-overlay').getByRole('button', { name, exact: false }).first().tap();
    } else {
      await page.locator('.masthead-nav').getByRole('button', { name, exact: false }).filter({ hasText: name }).first().click();
    }
    await page.waitForTimeout(300);
  }

  try {
    // -- Desktop: paint metrics, resources and the system type pairing ------
    const desktopContext = await context();
    await desktopContext.addInitScript(() => {
      window.__experienceMetrics = { lcp: null, cls: 0, shifts: [] };
      let sessionValue = 0, sessionStart = 0, previousShift = 0;
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) window.__experienceMetrics.lcp = {
          startTime: entry.startTime, size: entry.size,
          element: entry.element?.tagName || null, text: entry.element?.textContent?.trim().slice(0, 160) || null,
        };
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue;
          if (entry.startTime - previousShift < 1000 && entry.startTime - sessionStart < 5000) sessionValue += entry.value;
          else { sessionValue = entry.value; sessionStart = entry.startTime; }
          previousShift = entry.startTime;
          window.__experienceMetrics.cls = Math.max(window.__experienceMetrics.cls, sessionValue);
          window.__experienceMetrics.shifts.push({ time: entry.startTime, value: entry.value });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    const desktop = await desktopContext.newPage();
    desktop.on('response', response => {
      const requestUrl = response.url();
      if (new URL(requestUrl).origin === allowedOrigin) responseRecords.push((async () => {
        const status = response.status();
        if (status >= 300 && status < 400) return { path: new URL(requestUrl).pathname, status, contentType: response.headers()['content-type'] || '', decodedBytes: 0, redirected: true };
        const body = await response.body();
        return { path: new URL(requestUrl).pathname, status, contentType: response.headers()['content-type'], decodedBytes: body.length, redirected: false };
      })());
    });
    await ready(desktop);
    await desktop.waitForTimeout(600);
    report.performance = await desktop.evaluate(() => ({
      viewport: { width: innerWidth, height: innerHeight },
      fcpMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,
      lcpMs: window.__experienceMetrics.lcp?.startTime ?? null,
      lcpElement: window.__experienceMetrics.lcp,
      cls: window.__experienceMetrics.cls,
      layoutShifts: window.__experienceMetrics.shifts,
      measuredAfterLoadMs: performance.now(),
      navigation: performance.getEntriesByType('navigation')[0]?.toJSON(),
    }));
    assert(report.performance.fcpMs !== null && report.performance.lcpMs !== null, 'Cold initial paint metrics must be available');

    report.resources = await desktop.evaluate(() => ({
      fontFaces: Array.from(document.fonts, face => ({ family: face.family, status: face.status })),
      remoteFontRequests: performance.getEntriesByType('resource')
        .map(entry => entry.name)
        .filter(name => /fonts\.(googleapis|gstatic)\.com|use\.typekit|fonts\.cdn/i.test(name)),
      logos: Array.from(document.querySelectorAll('.wordmark .seal'), img => ({ src: img.currentSrc, complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight })),
      timing: performance.getEntriesByType('resource').map(entry => ({ path: new URL(entry.name).pathname, initiatorType: entry.initiatorType, transferSize: entry.transferSize, encodedBodySize: entry.encodedBodySize, decodedBodySize: entry.decodedBodySize, durationMs: entry.duration })),
      stylesheets: Array.from(document.styleSheets, sheet => sheet.href).filter(Boolean),
    }));
    report.resources.responses = await Promise.all(responseRecords);
    report.resources.totalDecodedBytes = report.resources.responses.reduce((sum, response) => sum + response.decodedBytes, 0);
    report.resources.totalResourceTransferBytes = report.resources.timing.reduce((sum, entry) => sum + entry.transferSize, 0);
    assert.equal(report.resources.remoteFontRequests.length, 0, 'No remote font may be requested');
    assert.equal(report.resources.fontFaces.filter(face => /JetBrains Mono|Space Grotesk|Fraunces|DM Sans/i.test(face.family)).length, 0, 'No retired web font may load');
    assert(report.resources.logos.length >= 1 && report.resources.logos.every(logo => logo.complete && logo.naturalWidth > 0), 'The seal must render');
    assert(report.resources.responses.every(response => (response.status === 200) || response.redirected));

    const pickType = (selectors) => selectors.map(selector => {
      const el = document.querySelector(selector);
      if (!el) return { selector, missing: true };
      const style = getComputedStyle(el);
      return {
        selector,
        family: style.fontFamily,
        resolved: style.fontFamily.split(',')[0].replace(/["']/g, '').trim(),
        size: style.fontSize,
        weight: style.fontWeight,
        letterSpacing: style.letterSpacing,
        transform: style.textTransform,
      };
    });
    report.typography.index = await desktop.evaluate((pickSource) => {
      const pick = eval(`(${pickSource})`);
      return {
        display: pick(['.hero-title', '.entry-title', '.index-title', '.colophon-word']),
        reading: pick(['.hero-lede > p', '.entry-desc']),
        labels: pick(['.eyebrow', '.filter-label', '.entry-topic', '.colophon-grid dt']),
        bodyFont: getComputedStyle(document.body).fontFamily,
        displayAvailable: document.fonts.check('16px Georgia'),
        readingAvailable: document.fonts.check('16px "Segoe UI"'),
        noMonoChrome: ['.nav-link', '.filter-link', '.entry-pool strong', '.ledger-figures dd'].every(selector => {
          const el = document.querySelector(selector);
          return el && !/mono|consolas|cascadia|courier/i.test(getComputedStyle(el).fontFamily);
        }),
      };
    }, pickType.toString());
    await desktop.locator('.entry-open').first().click();
    await desktop.waitForTimeout(250);
    report.typography.dossier = await desktop.evaluate((pickSource) => {
      const pick = eval(`(${pickSource})`);
      return {
        display: pick(['.dossier-title']),
        reading: pick(['.dossier-copy', '.form-intro']),
        labels: pick(['.fact-row dt', '.form-kicker']),
      };
    }, pickType.toString());
    await desktop.locator('.back-link').click();
    await openPage(desktop, 'Guide', false);
    report.typography.guide = await desktop.evaluate((pickSource) => {
      const pick = eval(`(${pickSource})`);
      return {
        display: pick(['.guide-hero h1', '.guide-notes-head h2', '.rule h3']),
        reading: pick(['.guide-standfirst', '.step-copy p']),
        labels: pick(['.guide-byline']),
      };
    }, pickType.toString());
    report.typography.display = [...report.typography.index.display, ...report.typography.dossier.display, ...report.typography.guide.display];
    report.typography.reading = [...report.typography.index.reading, ...report.typography.dossier.reading, ...report.typography.guide.reading];
    report.typography.labels = [...report.typography.index.labels, ...report.typography.dossier.labels, ...report.typography.guide.labels];
    report.typography.displayAvailable = report.typography.index.displayAvailable;
    report.typography.readingAvailable = report.typography.index.readingAvailable;
    report.typography.noMonoChrome = report.typography.index.noMonoChrome;
    report.typography.bodyFont = report.typography.index.bodyFont;
    assert(report.typography.displayAvailable, 'Georgia must be available to the display voice');
    assert(report.typography.readingAvailable, 'Segoe UI must be available to the reading voice');
    assert(report.typography.display.every(entry => !entry.missing && /Georgia/.test(entry.family)), 'Every display heading resolves to Georgia');
    assert(report.typography.reading.every(entry => !entry.missing && /Segoe UI/.test(entry.family)), 'Every reading paragraph resolves to Segoe UI');
    assert(report.typography.labels.every(entry => !entry.missing && /Segoe UI/.test(entry.family)), 'Every label resolves to Segoe UI');
    assert(report.typography.noMonoChrome, 'No interface chrome may resolve to a monospace face');
    await capture(desktop, 'trovane-edition-guide.png', true);
    await openPage(desktop, 'Index', false);
    await capture(desktop, 'trovane-edition-desktop.png', true);
    await desktop.locator('.entry-open').first().click();
    await desktop.waitForTimeout(300);
    await capture(desktop, 'trovane-edition-dossier.png', true);
    report.flows.push('Desktop: Georgia carries display headings, Segoe UI carries reading copy and labels, no web font loads and no chrome is monospace');

    // Return to the index for preference and forced-colour checks.
    await desktop.locator('.back-link').click();
    await desktop.waitForTimeout(200);

    // -- Reduced motion and forced colours ----------------------------------
    await desktop.emulateMedia({ reducedMotion: 'reduce' });
    report.preferences.reducedMotion = await desktop.evaluate(() => {
      const probe = document.createElement('span');
      probe.className = 'skeleton-entry';
      document.body.append(probe);
      const animatedSkeleton = parseFloat(getComputedStyle(probe).animationDuration) > 0.001;
      probe.remove();
      const selectors = ['.entry', '.entry-open', '.entry-save', '.nav-link', '.ink-button', '.dossier', '.nav-overlay', '.edition-card', '.paper-form', '.filter-link'];
      const transitions = selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)))
        .filter(el => getComputedStyle(el).transitionDuration.split(',').some(value => parseFloat(value) > 0.001));
      return {
        matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
        scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
        animatedSkeletons: animatedSkeleton ? 1 : 0,
        transitionsOverOneMillisecond: transitions.length,
      };
    });
    assert(report.preferences.reducedMotion.matches);
    assert.equal(report.preferences.reducedMotion.scrollBehavior, 'auto');
    assert.equal(report.preferences.reducedMotion.animatedSkeletons, 0, 'The loading sweep stops under reduced motion');
    assert.equal(report.preferences.reducedMotion.transitionsOverOneMillisecond, 0, 'Edition motion collapses under reduced motion');

    await desktop.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
    report.preferences.forcedColors = await desktop.evaluate(() => {
      const entry = document.querySelector('.entry');
      const section = document.querySelector('.ledger-summary');
      const button = document.querySelector('.ink-button');
      const edition = document.querySelector('.edition-card') || document.querySelector('.empty-note');
      const style = (el) => { const cs = getComputedStyle(el); return { color: cs.color, background: cs.backgroundColor, borderColor: cs.borderTopColor, borderStyle: cs.borderTopStyle, borderWidth: cs.borderTopWidth, borderBottomStyle: cs.borderBottomStyle, borderBottomWidth: cs.borderBottomWidth, boxShadow: cs.boxShadow }; };
      return {
        matches: matchMedia('(forced-colors: active)').matches,
        textureDropped: getComputedStyle(document.body, '::before').backgroundImage === 'none',
        entry: style(entry),
        section: style(section),
        button: style(button),
        edition: edition ? style(edition) : null,
      };
    });
    assert(report.preferences.forcedColors.matches);
    assert(report.preferences.forcedColors.textureDropped, 'The ruled-paper texture is dropped under forced colours');
    assert.notEqual(report.preferences.forcedColors.entry.borderBottomStyle, 'none', 'Entries keep a visible rule under forced colours');
    assert.notEqual(report.preferences.forcedColors.section.borderStyle, 'none', 'The ledger rule survives forced colours');
    assert.equal(report.preferences.forcedColors.edition?.boxShadow, 'none', 'Paper shadows are dropped under forced colours');
    assert(!/rgb\(30, 26, 21\)|rgb\(173, 58, 36\)/.test(report.preferences.forcedColors.button.background), 'Controls hand their background to the system palette');
    await capture(desktop, 'trovane-edition-forced-colors.png', true);
    await desktop.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });

    // -- Touch mobile -------------------------------------------------------
    const mobileContext = await context({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, reducedMotion: 'reduce' });
    const mobile = await mobileContext.newPage();
    await ready(mobile);
    report.mobile = await mobile.evaluate(() => ({
      width: innerWidth, height: innerHeight, maxTouchPoints: navigator.maxTouchPoints,
      coarsePointer: matchMedia('(pointer: coarse)').matches, hover: matchMedia('(hover: hover)').matches,
    }));
    assert(report.mobile.maxTouchPoints > 0 && report.mobile.coarsePointer && !report.mobile.hover);
    const allCount = await mobile.locator('.entry-open').count();
    await mobile.locator('[aria-label="Filter by topic"]').getByRole('button', { name: /^Tokenized assets/ }).tap();
    assert.equal(await mobile.locator('.entry-open').count(), 1);
    await mobile.getByRole('searchbox', { name: 'Search briefs' }).fill('no matching mobile research 946');
    assert.match(await mobile.locator('.empty-note').innerText(), /No brief matches this view/);
    await mobile.getByRole('button', { name: 'Clear search', exact: true }).tap();
    assert.equal(await mobile.getByRole('searchbox', { name: 'Search briefs' }).inputValue(), '');
    assert.equal(await mobile.locator('.entry-open').count(), 1, 'Clearing search preserves the topic filter');
    await mobile.locator('[aria-label="Filter by topic"]').getByRole('button', { name: /^All topics/ }).tap();
    assert.equal(await mobile.locator('.entry-open').count(), allCount);
    report.flows.push('Touch mobile: topic tap, empty search, tap Clear search and All topics restore the full index');

    const savedTitle = await mobile.locator('.entry-title').first().innerText();
    await mobile.locator('.entry-save').first().tap();
    await mobile.locator('.toast').getByRole('button', { name: 'Dismiss notification', exact: true }).tap();
    await openPage(mobile, 'Saved', true);
    assert.equal(await mobile.locator('.entry-open').count(), 1);
    await mobile.locator('.entry-open').first().tap();
    await mobile.locator('.dossier').waitFor();
    assert.equal(await mobile.locator('.dossier-title').innerText(), savedTitle);
    await capture(mobile, 'trovane-edition-touch-dossier.png');
    await mobile.locator('.back-link').tap();
    assert.equal(await mobile.locator('.entry-title').innerText(), savedTitle);
    assert.match(await mobile.locator('.index-title').innerText(), /Saved briefs/, 'The Saved page stays selected');
    report.flows.push('Touch mobile: keep a brief, open its dossier, return to the index and land back on the same saved entry');

    // -- Mobile draft sheet, validation and the downloaded brief -----------
    await mobile.getByRole('button', { name: 'Toggle navigation' }).tap();
    await mobile.locator('.nav-overlay').getByRole('button', { name: 'Index', exact: false }).first().tap();
    await mobile.locator('.index-lead-actions .ink-button').tap();
    await mobile.locator('#mission-title').fill('Which primary sources explain settlement risk?');
    await mobile.locator('#mission-draft').fill('Compare primary sources and explain their limitations.');
    await mobile.locator('#brief-uri').fill('javascript:alert(1)');
    await mobile.locator('#mission-reward').fill('0.000000001');
    const deadline = new Date(Date.now() + 86400000 * 7);
    await mobile.locator('#mission-deadline').fill(new Date(deadline.getTime() - deadline.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    await mobile.getByRole('button', { name: 'Review brief', exact: true }).tap();
    assert.equal(await mobile.locator('#brief-uri').getAttribute('aria-invalid'), 'true');
    const validation = await mobile.locator('.field-error').first().innerText();
    assert(validation.length > 0);
    assert(Number.parseFloat(await mobile.locator('#mission-title').evaluate(el => getComputedStyle(el).fontSize)) >= 16, 'Form inputs stay at 16 px on touch screens');
    await mobile.locator('#brief-uri').fill('https://example.com/research');
    await mobile.getByRole('button', { name: 'Review brief', exact: true }).tap();
    await mobile.locator('.review-mission').waitFor();
    assert.match(await mobile.locator('.review-mission').innerText(), /0\.000000001 testnet SOL/);
    assert.match(await mobile.locator('.create-progress .is-on').innerText(), /02.*REVIEW & FUND/i);
    await capture(mobile, 'trovane-edition-touch-review.png');
    const downloadPromise = mobile.waitForEvent('download');
    await mobile.getByRole('button', { name: 'Download brief', exact: true }).tap();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), briefFile);
    const downloadedBrief = await readFile(await download.path(), 'utf8');
    assert.match(downloadedBrief, /Trovane/);
    assert.match(downloadedBrief, /0\.000000001 testnet SOL/);
    assert.match(downloadedBrief, /no intended monetary value/);
    report.download = { suggestedFilename: download.suggestedFilename(), bytes: Buffer.byteLength(downloadedBrief), exactOneLamport: true, validation };
    report.flows.push('Touch mobile: draft, recover from an invalid URL, review the exact one-lamport pool, and download a Trovane markdown draft');
    await mobile.getByRole('button', { name: 'Close dialog', exact: true }).tap();

    // -- Synthetic long content ---------------------------------------------
    await mobile.reload({ waitUntil: 'networkidle' });
    await mobile.locator('.entry-open').first().waitFor();
    await mobile.locator('.entry-stack > li:nth-child(2)').evaluate(row => {
      row.dataset.qaSyntheticContent = 'true';
      row.querySelector('.entry-title').textContent = 'SettlementResearch'.repeat(14);
      row.querySelector('.entry-topic').textContent = 'TokenizedAssets'.repeat(6);
      row.querySelector('.entry-pool strong').textContent = '18446744073.709551615';
    });
    await fit(mobile, 'Synthetic long unbroken entry title, topic and uint64-scale pool', [
      '.entry-stack > li:nth-child(2) .entry',
      '.entry-stack > li:nth-child(2) .entry-title',
      '.entry-stack > li:nth-child(2) .entry-pool',
      '.entry-stack > li:nth-child(2) .entry-topic',
    ]);
    await mobile.locator('.entry-stack > li:nth-child(2) .entry-open').scrollIntoViewIfNeeded();
    await capture(mobile, 'trovane-edition-synthetic-entry.png');
    await mobile.locator('.entry-stack > li:nth-child(2) .entry-open').tap();
    await mobile.locator('.dossier').waitFor();
    await mobile.locator('.dossier-title').evaluate(el => { el.dataset.qaSyntheticContent = 'true'; el.textContent = 'MultilingualResearchResearch'.repeat(18); });
    await fit(mobile, 'Synthetic long multilingual dossier title', ['.dossier', '.dossier-title']);
    await capture(mobile, 'trovane-edition-synthetic-dossier.png');
    await mobile.locator('.back-link').tap();

    // Synthetic long filter label. The filter row scrolls inside the index by
    // design; the document must never widen and the row must stay in view.
    await mobile.getByRole('searchbox', { name: 'Search briefs' }).fill('synthetic-filter');
    await mobile.locator('[aria-label="Filter by topic"] .filter-link').first().evaluate(el => {
      el.dataset.qaSyntheticContent = 'true';
      el.childNodes[0].textContent = 'EvidenceFilter'.repeat(28);
    });
    const filterFit = await mobile.evaluate(() => {
      const row = document.querySelector('[aria-label="Filter by topic"]');
      const bar = document.querySelector('.index-tools');
      const rowRect = row.getBoundingClientRect();
      return {
        name: 'Synthetic long unbroken topic filter',
        viewport: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        rowLeft: Math.round(rowRect.left),
        rowRight: Math.round(rowRect.right),
        rowScrolls: row.scrollWidth > row.clientWidth,
        rowOverflowX: getComputedStyle(row).overflowX,
        barWidth: Math.round(bar.getBoundingClientRect().width),
      };
    });
    report.syntheticContent.push(filterFit);
    assert(filterFit.documentWidth <= filterFit.viewport + 1, 'A long filter label must not widen the document');
    assert(filterFit.rowLeft >= 0 && filterFit.rowRight <= filterFit.viewport, 'The filter row stays inside the viewport');
    assert(filterFit.rowScrolls && filterFit.rowOverflowX === 'auto', 'The filter row contains long labels by scrolling in place');
    await mobile.locator('[aria-label="Filter by topic"]').scrollIntoViewIfNeeded();
    await capture(mobile, 'trovane-edition-synthetic-filter.png');
    await mobile.reload({ waitUntil: 'networkidle' });
    await mobile.locator('.entry-open').first().waitFor();

    // -- Colophon and full-page clearance at every viewport ------------------
    for (const [width, height] of [[320, 720], [390, 844], [768, 1024], [1440, 1000], [1920, 1080]]) {
      await mobile.setViewportSize({ width, height });
      await mobile.waitForTimeout(250);
      const mobileLayout = await mobile.evaluate(() => matchMedia('(max-width: 900px)').matches);
      await openPage(mobile, 'Guide', mobileLayout);
      await mobile.evaluate(() => window.scrollTo({ top: 10_000_000, behavior: 'instant' }));
      await mobile.waitForTimeout(300);
      const clearance = await mobile.evaluate(() => {
        const footer = document.querySelector('.colophon');
        const guide = document.querySelector('#guide');
        const footerRect = footer.getBoundingClientRect();
        return {
          width: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          footerTop: Math.round(footerRect.top),
          footerBottom: Math.round(footerRect.bottom),
          guideBottom: Math.round(guide.getBoundingClientRect().bottom),
          scrollY: Math.round(scrollY),
          scrollHeight: document.documentElement.scrollHeight,
          viewportHeight: innerHeight,
        };
      });
      report.clearance.push(clearance);
      assert(clearance.documentWidth <= width, `Guide view overflows at ${width}`);
      assert(clearance.footerTop >= clearance.guideBottom - 1, `The colophon follows the field guide at ${width}`);
      assert(clearance.footerBottom <= clearance.scrollHeight, `The colophon stays inside the page at ${width}`);
      assert(clearance.scrollY > 0, `The page scrolls at ${width}`);
      await openPage(mobile, 'Index', mobileLayout);
      await mobile.locator('.entry-open').first().waitFor();
      const indexWidth = await mobile.evaluate(() => document.documentElement.scrollWidth);
      assert(indexWidth <= width, `Index overflows at ${width}`);
    }
    report.flows.push('At five viewports the colophon follows the field guide, the page scrolls without sideways overflow and the index fits');

    assert.equal(await mobile.evaluate(() => localStorage.getItem('quilsted-saved')), null, 'No legacy key is written by the current build');
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.failedRequests.filter(entry => !/favicon/.test(entry.url)), []);
    assert.deepEqual(report.blockedExternalRequests, []);
    report.result = 'passed';
    return report;
  } catch (error) {
    report.result = 'failed';
    report.failure = error.stack;
    throw error;
  } finally {
    await writeFile(path.join(output, 'trovane-edition-experience.json'), JSON.stringify(report, null, 2) + '\n');
    for (const current of contexts) await current.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const browser = await chromium.launch({ headless: true });
  try {
    const report = await runExperienceQa(browser, process.argv[2]);
    console.log(JSON.stringify({
      result: report.result,
      flows: report.flows,
      typography: {
        display: report.typography.display?.map(entry => entry.resolved),
        reading: report.typography.reading?.map(entry => entry.resolved),
        noMonoChrome: report.typography.noMonoChrome,
        displayAvailable: report.typography.displayAvailable,
        readingAvailable: report.typography.readingAvailable,
      },
      fonts: report.resources.fontFaces,
      remoteFontRequests: report.resources.remoteFontRequests,
      performance: { fcpMs: report.performance.fcpMs, lcpMs: report.performance.lcpMs, cls: report.performance.cls },
      preferences: report.preferences,
      clearance: report.clearance,
      download: report.download,
      screenshots: report.screenshots,
    }, null, 2));
  } finally { await browser.close(); }
}
