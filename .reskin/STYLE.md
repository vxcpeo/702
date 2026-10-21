# Reskin art direction — Cosmos Orbit

> Selected automatically. Do not ask the user to confirm or choose another direction.

- **Style DNA:** `cosmos-orbit` (spatial-futurist)
- **Skeleton:** `documentary` (editorial)
- **Seed:** `6c5d3f5a3d1dbc5938a93066b331abfa88767f748e8e574f8a825e71a6ab741f`
- **Source DNA:** [https://cosmos.network](https://cosmos.network)
- **Live sampled:** yes — https://cosmos.network (3415 ms)
- **Original:** ticker-stage / dark / accent #9945ff

## Why this direction

The selector sampled 4/10 blockchain references, scored every direction for perceptual distance from the original accent (#9945ff) and background (#000000), added a deterministic seed jitter, and chose Cosmos Orbit because it is 85 ΔE away from the original accent and pairs with Documentary Ledger, a editorial skeleton rather than the original ticker-stage.

## Live reference sampling

| Style | URL | Result | Accent sampled | Ground sampled |
|---|---|---|---|---|
| polygon-agora | https://polygon.technology | ok (2558 ms) | #670de5 | #000000 |
| base-cobalt | https://www.base.org | ok (3089 ms) | #0000ff | #dde3e9 |
| solana-spectrum | https://solana.com | failed: timeout | — | — |
| ethereum-paper | https://ethereum.org | failed: timeout | — | — |
| aave-abyss | https://aave.com | failed: fetch failed | — | — |
| arbitrum-signal | https://arbitrum.io | failed: HTTP 403 | — | — |
| optimism-poster | https://www.optimism.io | failed: timeout | — | — |
| uniswap-bubblegum | https://uniswap.org | failed: timeout | — | — |
| cosmos-orbit | https://cosmos.network | ok (3415 ms) | #40b3ff | #000000 |
| sui-tidal | https://sui.io | ok (3440 ms) | #298dff | #ffffff |

Live sampling is evidence, not a copy target. Never download or reuse a reference site's logo, imagery, copy, or code. Use only the abstract tokens below.

## Candidate ranking

| Candidate | Score | Accent ΔE from original | Layout | Live |
|---|---:|---:|---|---|
| Cosmos Orbit | 0.8968 | 85.1 | documentary | yes |
| Bubblegum Exchange | 0.8896 | 84 | bento-canvas | no |
| Poster Optimism | 0.8412 | 120.4 | documentary | no |
| Signal Navy | 0.8366 | 90.8 | bento-canvas | no |
| Paper Protocol | 0.8198 | 49.1 | documentary | no |
| Spectrum Terminal | 0.7769 | 56.4 | gallery-scroll | no |
| Abyss Liquidity | 0.774 | 76.4 | orbital | no |
| Tidal Sui | 0.7448 | 53 | split-stage | yes |
| Cobalt Blueprint | 0.6346 | 35.6 | split-stage | yes |
| Agora Violet | 0.3654 | 1.7 | documentary | yes |

## Skeleton brief

**Documentary Ledger** — masthead instead of app bar; serif or high-contrast display voice with running-text rhythm; numbered sections and marginalia; tables styled as ledger rules, not cards; navigation is an index line under the masthead.

Navigation: Masthead with the brand as a wordmark, route names as an index line, and a thin rule. No pills, no filled app bar, no sidebar.

Structure:
1. masthead with issue/date line
1. index line of routes
1. hero statement spanning 9 columns
1. two-column body: 7-column ledger + 3-column marginalia
1. footnotes and colophon

Content mapping: Turn dashboard metrics into a lede paragraph with displayed figures. Tables become ledger rows with rules and tabular numerals. Forms become a typeset questionnaire. Keep every label and value; restyle hierarchy only.

Recipe: `.masthead{display:grid;grid-template-columns:1fr auto;align-items:end;border-bottom:2px solid var(--ink);padding-bottom:12px}.index{display:flex;gap:28px;border-bottom:1px solid var(--line);padding:12px 0;font:500 12px/1 var(--font-mono);letter-spacing:.12em;text-transform:uppercase}.body{display:grid;grid-template-columns:minmax(0,7fr) minmax(220px,3fr);gap:clamp(24px,5vw,72px)}.lede{font-size:clamp(2rem,4vw,4.6rem);line-height:.98}`

Risks: serif font alone is not a skeleton change; dense dashboards need tabular numerals and generous line-height

## Design tokens

```css
:root {
  --bg: #000000;
  --surface: #12121E;
  --surface-alt: #191927;
  --ink: #F5F4FA;
  --muted: #9A98AD;
  --accent: #40b3ff;
  --accent-safe: #40b3ff;
  --accent-2: #A78BFA;
  --line: #262536;
  --success: #5CE1A0;
  --danger: #FF8A8A;
  --warning: #F2C94C;

  --font-display: "Century Gothic", "Futura", "Segoe UI", sans-serif;
  --font-body: "Segoe UI", "Helvetica Neue", sans-serif;
  --font-mono: "Cascadia Mono", ui-monospace, monospace;
  --display-weight: 400;
  --display-tracking: 0.02em;
  --label-tracking: 0.24em;

  --radius-sm: 999px;
  --radius-md: 999px;
  --radius-lg: 28px;
  --border: 1px solid var(--line);
  --shadow: 0 0 60px rgba(110, 123, 255, 0.16);

  --motion-duration: 420ms;
  --motion-ease: cubic-bezier(.16,1,.3,1);
  --space-1: clamp(4px, .35vw, 6px);
  --space-2: clamp(8px, .7vw, 12px);
  --space-3: clamp(14px, 1.2vw, 20px);
  --space-4: clamp(22px, 2vw, 32px);
  --space-5: clamp(36px, 3.4vw, 56px);
  --space-6: clamp(56px, 5vw, 88px);
  --page-pad: clamp(18px, 4vw, 64px);
  --max-width: 1440px;
}
```

## Component grammar

- Surface: 1px solid var(--line); radius 999px; shadow 0 0 60px rgba(110, 123, 255, 0.16).
- Type: display **"Century Gothic", "Futura", "Segoe UI", sans-serif** at weight 400, tracking 0.02em; body **"Segoe UI", "Helvetica Neue", sans-serif**; numerals and micro-labels **"Cascadia Mono", ui-monospace, monospace**.
- Texture: orbital rings, star fields, thin constellation lines, radial glows.
- Motion: slow-orbit, 420ms, cubic-bezier(.16,1,.3,1). Always wrap non-essential motion in `@media (prefers-reduced-motion: no-preference)`.
- Density: airy. Keep body text >= 14px and body contrast >= 4.5:1.
- Use `--accent-safe` for text and icons on `--bg`; use `--accent` for fills and large shapes.

## Originality guard

The replacement must satisfy all of these:

1. The source inventory archetype is `ticker-stage`; the new skeleton is `documentary`. Do not fall back to the old shell during implementation.
2. Do not reuse any original class name, CSS selector, design token name, or original accent family.
3. Rewrite templates, not only CSS. Every route must visibly use the new skeleton.
4. Keep every token in `.reskin/content-contract.json`; move it, never rewrite it.
5. Run `node scripts/verify.mjs check` and do not stop until content, structure, accessibility and responsive checks pass.

## Commit statement

Use this sentence in the final report: "The UI was rebuilt around Cosmos Orbit / Documentary Ledger; the original ticker-stage shell and palette were removed while the content contract stayed byte-for-byte intact."
