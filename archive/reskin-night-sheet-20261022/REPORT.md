# Reskin report — Colopha, night-sheet edition

Generated 2026-10-22 (Asia/Shanghai) · Project: `E:/workspace/chuangye/solana/702/website`
Pipeline: `reskin` inventory → style selector → baseline → rebuild → verification.

## Selected direction

| Field | Value |
|---|---|
| Style | **Cosmos Orbit** (`cosmos-orbit`, spatial-futurist) |
| Source DNA | [https://cosmos.network](https://cosmos.network) — live sample; 9/10 references reachable, no fallback catalog used |
| Seed | `8f5bf33b1d1c4b06c5a8c5b8085caa23cd5f02817aa87e20ab5b3c5ddd54fb36` |
| Skeleton | **Documentary Ledger** (`document-flow`, editorial) |
| Original skeleton | `gallery-scroll` (spatial) |
| Accent | `#8f4b00` → `#40b3ff` (**105.32 ΔE**; minimum 30) |
| Ground | `#050509` void, `#12121e` shell, `#191927` shell lift, `#262536` / `#3b3a55` hairlines |
| Type | Bahnschrift Light (display, weight 400, +0.01em), Segoe UI body, Consolas / Cascadia Mono labels |

The selector sampled public blockchain sites; only abstract palette, type mood,
shape language, density and motion DNA were used — no logo, image, copy or code
from a reference was downloaded or reused.

## Skeleton and composition

The rebuilt UI is a chart desk: a void field with signal glow and a faint chart
grid, a three-column dateline, a ruled index line, one wide reading plate with a
sticky margin, hairline ledger rows with tabular figures, and a colophon. There
is no cream paper field, no route wall of poster tiles, no floating dock, no
sticker chips, no hard offset shadows and no two-column card wall.

| Layer | Original (poster press) | Rebuilt (night sheet) |
|---|---|---|
| Shell | Mast flag (brand, edition stamp, actions) → route wall of 4 poster tiles → scenes → black colophon → floating dock | Dateline (imprint, edition facts, actions) → ruled index line → plate + complementary margin → colophon; compass keys live in the margin |
| Navigation | Poster tiles with ink active state + floating dock of icon keys | Ruled index line with counts + a vertical compass rail in the margin; mobile contents sheet |
| Discovery | Ink facts band + two-column poster cards with stamped numbers, sticker topic chips | Tally line of four ruled cells + hairline ledger rows: number, topic, title, copy, pool/deadline/standing, keep key |
| Detail | Single print: oversized title, sticker row, four-fact row, peach pool plate with split bar, three chapter blocks, margin notes | Dossier sheet: back line, title head, tags, ruled case ledger, vault plate with split rail, three numbered chapters, typeset questionnaire, marginalia |
| Guide | Three step plates, rules band, FAQ stack | Numbered stair, two creed sections (rules grid, FAQ stack) |
| Summary | Four-cell ink facts band with note line | Tally line cells + note row |
| Overlays | Poster sheet with stepped progress strip; bottom contents plate | Ledger dialog with progress rule and ruled questionnaire; bottom-right contents sheet |
| Motion | 110 ms `steps()` snap | 420 ms `cubic-bezier(.16,1,.3,1)` eased moves, dropped under `prefers-reduced-motion` |

## Content contract

- Pre-rebuild contract hash: `566ff31764277bc1af0a446617b4e6ea8689368280c26badc0a636058a615f6a`
  (188 text tokens, 167 bindings, 69 handlers, 5 form fields).
- Post-rebuild hash: `caf5eb3855b2a491f67fef146fe6a63b889673c75ec9a05af9d2d1acc7e51731`.
  The comparator reports **0 issues** and 2 additive warnings (`name=plus` 10 → 11,
  `click:startCreate` 4 → 5) plus two accessibility-only `aria-label` additions.
- Rendered parity on `/`: **212 words, 0 missing, 0 added**; numeric tokens
  14 / 29 total on both sides; zero removed attributes, forms, handlers or links.
- Meta title, description, document language, routes, link targets, form fields,
  handler expressions, env names and API endpoints are unchanged.

## Verification

`node scripts/verify.mjs check --project … --out .reskin` → **PASS**

| Gate | Result |
|---|---|
| Source content contract | intact — 0 issues, 2 additive warnings |
| Rendered content parity `/` | 0 missing, 0 added (212 words) |
| DOM fingerprint similarity | **0.391** ≤ 0.50 |
| Landmark sequence similarity | **0.600** ≤ 0.68 |
| CSS class overlap | **0.000** ≤ 0.10 |
| Accent distance | **105.32 ΔE** ≥ 30 |
| Archetype | `gallery-scroll` (spatial) → `document-flow` (editorial) |
| Route / console / page errors | `200`, 0, 0 |
| Contrast failures | **0 / 119** checked (1440 and 390) |
| Axe serious/critical | **0** (no moderate violations either) |
| Horizontal overflow | none at 1440×900 or 390×844 |
| Keyboard focus visibility | passed |
| Mobile navigation reachable | passed |
| Build | passed (`vite build`, 38.6 kB CSS / 421.2 kB JS) |

## Beyond the single capture route

The Vue app is one static route with state-driven views, so the pipeline captures
`/`. Every other view is exercised by the project suites in
`website/scripts/qa/` (wired to `npm run check:ui` and `npm run check:experience`):

- **12 captured states** at 1440 and 390 px: index, guide, saved, my briefs,
  filtered index, dossier, create dialog, review step, mobile index, contents
  sheet, mobile dossier, mobile create dialog. Every state reported one `h1`, no
  horizontal overflow, no unnamed control, no missing image alt, **0 axe
  violations** and **0 console errors** (`website/.reskin/review/review.json`).
- **37/37 interaction flows** (`website/scripts/qa/flow-suite.mjs`): search,
  clear, topic facet, reset, no-match empty plate, sort by pool, ArrowDown row
  navigation, keep toggle and saved count, saved view, saved empty state,
  dossier open/back, guide + FAQ, compass switching, dialog open/Escape,
  required-field blocking, invalid URL/pool rejection, review step, edit step,
  wallet-less connect strip, back to top, mobile compass, contents navigation,
  Escape and close key.
- `check:logic`: **16/16 pass**.
- `check:site`: **679 checks pass** (identity, night-sheet shell, assets, guard,
  mirror).

The pipeline screenshots, inspected side by side, share no layout signature: the
baseline is a cream poster press with a black route wall, ink tiles and sticker
chips; the rebuild is a void chart desk with a ruled index line, hairline ledger
rows, a complementary margin and a colophon.

**Baseline**

![Baseline desktop](baseline/home-desktop.png)

![Baseline mobile](baseline/home-mobile.png)

**Current**

![Current desktop](current/home-desktop.png)

![Current mobile](current/home-mobile.png)

More states: [guide](review/02-guide-desktop.png) ·
[saved](review/03-saved-desktop.png) ·
[dossier](review/06-dossier-desktop.png) ·
[create dialog](review/07-create-desktop.png) ·
[review step](review/08-review-desktop.png) ·
[contents sheet](review/10-contents-mobile.png) ·
[mobile dossier](review/11-dossier-mobile.png).

## Files changed

| File | Change |
|---|---|
| `src/App.vue` | New shell template (dateline, index line, plate + margin, compass, contents sheet, ledger dialog, dispatch strips); script unchanged except three presentational selector hooks (`.entry-open`, `.compass-key`, `.dialog-body`) |
| `src/components/BriefIndex.vue` | Query rail, facet pills, tally line, hairline ledger rows, ledger foot; `stateClass` renamed `phaseClass` (presentational) |
| `src/components/BriefDossier.vue` | Dossier head, case ledger, vault plate and split rail, numbered chapters, typeset entry forms, evidence cards, marginalia |
| `src/components/BriefGuide.vue` | Guide head, numbered stair, creed sections, FAQ stack, actions |
| `src/components/UiIcon.vue` | Comment and stroke weight only (1.7 → 1.4); glyph geometry unchanged |
| `src/styles/nightsheet.css` | **New** presentation layer (tokens, shell, ledger, dossier, guide, dialog, sheet, responsive, reduced-motion and forced-colours guards) |
| `src/styles/poster-press.css` | **Removed** from the tree and the render path (archived under `.rebrand/previous/ledgiva-reskin-20261021/src-styles/`) |
| `src/main.js` | Imports the new stylesheet |
| `index.html` | `color-scheme` dark and `theme-color` `#050509` |
| `scripts/check-site.mjs` | Guard rewritten for the night-sheet shell and the new assets |
| `scripts/qa/*` | State audit and flow suite repointed to the new selectors |
| `a702/**` | Distribution mirror resynchronised |

The application logic (`src/composables/useMissions.js`, `src/utils/*.js`,
`src/config.js`), sample data, routes, localStorage keys and wallet/transaction
gates were not modified apart from adding `ledgiva-saved` to the legacy bookmark
key list during the rebrand so existing saved lists migrate to `colopha-saved`.

## Accessibility and responsive behaviour

- One `h1` per view; landmarks are header → nav → main → complementary → footer;
  the index line is the visible route index and the compass is a labelled group.
- 2 px `#40b3ff` focus ring with 3 px offset on every interactive element; the
  skip link is the first focusable item and is revealed on focus.
- All body text ≥ 4.5:1 on the void (0 contrast failures across 119 checks); the
  faint token was raised to `#87859f` so counters and pin numbers clear 4.5:1.
- Mobile is a genuinely linear composition: dateline, wrapped index line,
  statement, ledger, edition note, compass row, colophon. No horizontal overflow
  at 390 px.
- `prefers-reduced-motion` removes the meter sweep, the beat dot and hover
  translations; `forced-colours` hands borders and fills to the system palette.

## Known limitations

- `verify.mjs` captures only the single static route `/`; the state-driven views
  are covered by the 12-state audit and 37-flow suite rather than by the
  pipeline's screenshot pair.
- No wallet is available in this environment, so the connected-wallet branches
  (creator approval, refund, claim, live submission) were not exercised
  visually; their code and copy are unchanged.
- The `a702/` distribution mirror and `archive/` were held outside the scan root
  while the contract was frozen, so the contract is measured on the app source
  once; both are restored in the shipped tree and `check:site` verifies the
  mirror.
- The selected style is Cosmos Orbit and the skeleton is Documentary Ledger; the
  shipped surface classifies as `document-flow` (editorial).

> The UI was rebuilt around **Cosmos Orbit** / **Documentary Ledger**; the original **gallery-scroll** shell and palette were removed while the content contract stayed byte-for-byte intact.
