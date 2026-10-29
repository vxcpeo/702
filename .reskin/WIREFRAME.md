# Wireframe — Cosmos Orbit / Documentary Ledger

Committed before implementation; recorded here as the shipped map. The selected
direction is the one `choose-style.mjs` produced; nothing was substituted.

## Shell

`NightSheet` is the only shell. It is one component tree in `App.vue`:

```
.chart                                   root, void field + signal glows + chart grid
├─ a.chart-skip                          first focusable, revealed on focus
├─ header.dateline                       3-column masthead
│  ├─ button.imprint                     mark + wordmark + motto (goes home)
│  ├─ div.dateline-facts                 edition stamp + cluster line
│  └─ div.dateline-acts                  Post a brief + wallet key
├─ nav.indexline                         4 route links + inline create key
├─ div.chart-body                        grid 7fr / 3fr
│  ├─ main.plate                         the scene (index | saved | activity | guide | dossier)
│  └─ div.margin[role=complementary]     edition note + compass keys (sticky)
├─ footer.colophon                       brand, four facts, fine print, back to top
├─ template[v-if=mobileNav]              shade + nav#site-contents (contents sheet)
├─ dialog.ledger-dialog                  draft sheet / rewards ledger
└─ div.dispatch (0–2)                    wallet fault and notice strips
```

Navigation is the ruled index line under the masthead; the compass keys in the
margin are a secondary rail and the mobile contents trigger. There is no dock,
no route wall, no poster tile and no card wall.

## Route → composition

| Scene | Composition |
| --- | --- |
| index (`/`) | `section.statement` (kicker, h1, lede, three actions) → `section.ledger-plate` → `BriefIndex` |
| saved / activity | `section.statement--slim` (page kicker, h1, note) → the same `BriefIndex` in its view state |
| guide | `section#guide` → `BriefGuide`: `div.guide-head`, `ol.stair` (three plates), two `section.creed` bands (rules grid, FAQ stack), `div.guide-acts` |
| dossier | `section#scope` → `BriefDossier`: back line, head, tags, `dl.case-ledger`, `section.vault-plate`, `div.dossier-body` (three chapters + marginalia), actions, tx strip |
| draft sheet | `dialog.ledger-dialog` → `div.dialog-head`, `div.progress-line`, `form.brief-form` (ruled questionnaire) or `div.preview-slip` |
| rewards ledger | the same dialog with `div.reward-plate`, `code.account-line`, state strips |

## Ledger composition (BriefIndex)

```
section#brief-index.ledger
├─ div.ledger-head                       kicker / h2 / note + reload + create
├─ div.query-rail[role=search]           search field, order select, reset
├─ div.facet-line                        topic facets + standing facets (pills)
├─ section.tally-line                    four cells (Records / Open / Pool / Cluster) + note
├─ div.loadline | div.void | ol.ledger-rows + div.ledger-foot
```

Rows are `.entry-row` articles inside an ordered list: number, topic, title
button, copy, figures (pool, deadline, standing), keep key. No cards, no grid of
tiles, no sticker chips.

## Old components and CSS

| Original | Fate |
| --- | --- |
| `src/styles/poster-press.css` | removed from the render path; archived under `.rebrand/previous/ledgiva-reskin-20261021/src-styles/` |
| `App.vue` poster shell (`.press`, `.mast`, `.route-wall`, `.dock`) | replaced by `.chart`, `.dateline`, `.indexline`, `.margin`, `.compass`, `.colophon` |
| `BriefIndex` board (`.board`, `.card-wall`, `.record-card`, `.facts-band`, `.sticker`) | replaced by `.ledger`, `.ledger-rows`, `.entry-row`, `.tally-line`, `.facet` |
| `BriefDossier` print (`.print`, `.spread`, `.margin-rail`) | replaced by `.dossier`, `.chapter`, `.dossier-margin` |
| `BriefGuide` guide (`.step-wall`, `.rules-band`, `.faq-stack`) | replaced by `.stair`, `.creed`, `.faq-stack` |
| `UiIcon` | kept (presentational, decorative, `aria-hidden`); stroke weight 1.4 and comment only |

Only three script hooks changed, all presentational: `.card-open` → `.entry-open`,
`.dock-key[aria-controls]` → `.compass-key[aria-controls]`, `.sheet-body` →
`.dialog-body`. Application logic, composables, Solana client, routes, ids,
bindings, handlers and copy are untouched.

## Tokens and breakpoints

`src/styles/nightsheet.css` carries the tokens: `--void #050509`,
`--abyss #0a0a12`, `--shell #12121e`, `--shell-lift #191927`,
`--star #f5f4fa`, `--star-dim #9a98ad`, `--star-faint #87859f`,
`--pulse #40b3ff`, `--violet #a78bfa`, `--filament #262536`,
`--filament-lit #3b3a55`, `--good #5ce1a0`, `--bad #ff8a8a`.

Breakpoints: 1080 px (plate and margin stack, marginalia moves below), 860 px
(masthead two rows, stair and creed grids become single column, tally 2×2),
620 px (single column masthead, row figures wrap under the title). Reduced-motion
and forced-colours guards are included.
