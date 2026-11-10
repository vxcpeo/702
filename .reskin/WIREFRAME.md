# Wiring plan — Cobalt Blueprint / Split Stage

Selected by `choose-style.mjs` (seed `b00478b2…`). Original: `document-flow` / dark night sheet.
New: **Cobalt Blueprint** (`base-cobalt`, optimistic-modern) × **Split Stage** (`split-stage`, spatial).

## Shell

- New shell: `.bp-shell` → `.bp-split` = sticky narrative rail (`.bp-rail`) + scrolling data stage (`.bp-stage`, one white sheet).
- Below the split: a full-width `.bp-band` (edition notice + figures + foot) and the `.bp-colophon` footer.
- Brand, route index, page thesis and the primary actions live in the rail; the rail is `position: sticky` and becomes a static top block below 1080 px.
- Landmarks: `header[role=banner]` (rail brand), `nav` (rail route index), `main` (stage), `footer` (colophon); no complementary landmark — the edition margin moved into the full-width band.
- Old shell elements removed from the render path: dateline masthead, index line, plate + margin grid, floating compass keys, ruled dialog.
- Mobile: rail collapses above the stage; the route index becomes a horizontally scrollable strip; no drawer mirroring the old sidebar.

## Route mapping

| View | Sticky rail (narrative) | Stage (data) |
|---|---|---|
| `/` index | brand + route index + thesis h1 (`statement-title`) + actions + wallet | `BriefIndex`: stage head, control strip, topic/standing chips, tally band, register rows |
| saved / my briefs | brand + route index + page thesis (`page-title`, `pageTitle`, `pageNote`) + actions | `BriefIndex` in saved/activity mode |
| guide | brand + route index + actions (sparse rail, motif only) | `BriefGuide`: guide head, numbered stair, creed rows, FAQ disclosures |
| dossier (selected) | brand + route index + actions | `BriefDossier`: case bar, case head h1 (`dossier-title`), facts strip, vault band, three chapters, evidence rows, marginalia band |

## Components

| Old | New |
|---|---|
| `App.vue` shell (chart desk) | `.bp-shell` split stage + edition band + colophon, same script hooks renamed (`bp-entry-open`, `bp-dialog-body`, `bp-draft-preview`, `bp-contents`, `bp-menu`) |
| `BriefIndex.vue` ledger rows | stage head + control strip + chips + tally band + stacked register entries |
| `BriefDossier.vue` dossier sheet | case file: case bar, facts strip, vault band with split rail, numbered chapters, two-up entry forms, evidence rows, marginalia band |
| `BriefGuide.vue` stair/creed | numbered stair rows, creed rule rows, FAQ disclosures |
| `UiIcon.vue` 1.4 round caps | 1.5 square-ish caps, same glyph names and counts |
| `nightsheet.css` | **deleted from the tree**, replaced by `src/styles/blueprint.css` |

## Tokens and breakpoints

- Token file: `src/styles/blueprint.css` (`--bp-*`), ground `#dde3e9`, sheet `#ffffff`, ink `#0a0b0d`, cobalt `#0000ff`, periwinkle `#7575ff`.
- Type: Segoe UI display at 640 weight with −0.03em tracking, Segoe UI body, Cascadia Mono/Consolas labels.
- Breakpoints: ≥1081 px split; 1080 px rail static + strip index; 760 px single column, stacked register; 520 px compact type and full-height dialog.
- Texture: blueprint grid on the ground, cobalt hairlines, registration ticks; motion 170 ms, removed under `prefers-reduced-motion`.

## Content contract guardrails

- Every static token moves, none is rewritten; one CSS `content: "\2014"` rule is kept (baseline token).
- Bindings, handlers, icon names and form fields keep their exact counts; duplicated content is not introduced.
- `#brief-index`, `#guide`, `#dossier-title`, `#contribute`, `#evidence-uri` stay (skip link and script targets).
