# Reskin wireframe — Poster Optimism / Gallery Scroll

Project: `E:/workspace/chuangye/solana/702/website` · route `/` (one SPA route, state-driven views)
Baseline: `.reskin/baseline/` (documentary ledger, dark #000000 / #40b3ff)

## 1. New shell

| Layer | Old (documentary ledger) | New (poster gallery) |
|---|---|---|
| Page root | `div.observatory` — issue line + masthead + route line + document + colophon | `div.press` — mast flag band, scene stack, colophon plate, floating dock |
| Navigation | `nav.route-line` inside `main`, uppercase mono index line; mobile full-height `contents-plate` | `nav.route-wall` — four oversized poster tiles with printed numbers in the opening scene; plus a floating **dock** (icon keys, `aria-label` each) and a mobile `dock-sheet` under the "Contents" key |
| Landmarks | header → main → nav → div[complementary] → header → div[complementary] → footer | header → main → nav(route-wall) → aside(note-plate) → footer → nav(dock) |
| Main composition | 9-column lede + 3-column marginalia; 7/3 registry | full-bleed **scenes**: opening poster, board scene, closing plate |
| Records | ruled ledger rows in a seven-column registry | poster **card wall** (2-column asymmetric), summary as an ink `fact-strip` band |
| Dossier | file with four-fact register, numbered chapters | single print with a giant pool figure, sticker row, chapter blocks, margin notes |
| Guide | field-guide file, numbered step register | three step plates in a snap rail, rules band, FAQ stack |
| Overlays | floating sheet, contents plate | poster `dialog.sheet`, mobile `dock-sheet` |
| Motion | 420 ms drift | 110 ms steps() snap, disabled under `prefers-reduced-motion` |

## 2. Route compositions

- `/` — `scene--open` (h1, lede, acts, route wall, editor's note) → `scene--board`
  (search/sort, topic stickers, fact strip, card wall). `saved` and `activity`
  reuse `scene--board` with the same cards (empty state keeps its copy).
- dossier — `scene--print`: nav row, title block, sticker row, fact row, pool
  figure + split bar, three chapters, margin notes. `id="dossier-title"` stays.
- guide — `scene--guide`: title block, three step plates, rules band, FAQ stack.
- dialog — `dialog.sheet` with poster head, progress strip and questionnaire.

## 3. Components kept as content children

`BriefIndex.vue`, `BriefDossier.vue`, `BriefGuide.vue` and `UiIcon.vue` keep their
props, emits and script. Only their templates and classes change.

## 4. Tokens and breakpoints

New stylesheet `src/styles/poster-press.css`; `meridian-ledger.css` is removed
from the tree and the render path. Tokens follow `.reskin/STYLE.md` (cream field,
ink, red accent, orange secondary, zero radius, 2 px rules, 8 px hard shadow,
Arial Black display, Courier New mono). Breakpoints: 1100 px (dock inset), 820 px
(scenes stack, card wall single column), 520 px (mobile dock bar, type scale).

## 5. Content contract

Every visible string, binding, handler, attribute, form field and route stays
byte-for-byte. The dock is icon-only at desktop (`aria-label` only); visible
route labels render once in the route wall, so the desktop word multiset is
unchanged.
