# Reskin art direction — Cobalt Blueprint

> Selected automatically. Do not ask the user to confirm or choose another direction.

- **Style DNA:** `base-cobalt` (optimistic-modern)
- **Skeleton:** `split-stage` (spatial)
- **Seed:** `b00478b2499231c12406cfa0b512feeeea03ce5f5d11b202d73eb5be3863a474`
- **Source DNA:** [https://www.base.org](https://www.base.org)
- **Live sampled:** yes — https://www.base.org (1461 ms)
- **Original:** document-flow / dark / accent #40b3ff

## Why this direction

The selector sampled 8/10 blockchain references, scored every direction for perceptual distance from the original accent (#40b3ff) and background (#12121e), added a deterministic seed jitter, and chose Cobalt Blueprint because it is 112 ΔE away from the original accent and pairs with Split Stage, a spatial skeleton rather than the original document-flow.

## Live reference sampling

| Style | URL | Result | Accent sampled | Ground sampled |
|---|---|---|---|---|
| solana-spectrum | https://solana.com | failed: HTTP 429 | — | — |
| ethereum-paper | https://ethereum.org | ok (858 ms) | #0c5681 | #ffffff |
| polygon-agora | https://polygon.technology | ok (1318 ms) | #670de5 | #000000 |
| base-cobalt | https://www.base.org | ok (1461 ms) | #0000ff | #dde3e9 |
| arbitrum-signal | https://arbitrum.io | failed: HTTP 403 | — | — |
| aave-abyss | https://aave.com | ok (1511 ms) | #ff0000 | #000000 |
| optimism-poster | https://www.optimism.io | ok (2440 ms) | #ff0421 | #fafaf9 |
| uniswap-bubblegum | https://uniswap.org | ok (2324 ms) | — | #ffffff |
| cosmos-orbit | https://cosmos.network | ok (1711 ms) | #40b3ff | #000000 |
| sui-tidal | https://sui.io | ok (2106 ms) | #298dff | #ffffff |

Live sampling is evidence, not a copy target. Never download or reuse a reference site's logo, imagery, copy, or code. Use only the abstract tokens below.

## Candidate ranking

| Candidate | Score | Accent ΔE from original | Layout | Live |
|---|---:|---:|---|---|
| Cobalt Blueprint | 0.9895 | 112.4 | split-stage | yes |
| Bubblegum Exchange | 0.9654 | 96.1 | split-stage | yes |
| Poster Optimism | 0.898 | 135.8 | gallery-scroll | yes |
| Agora Violet | 0.889 | 85.4 | orbital | yes |
| Abyss Liquidity | 0.8407 | 144.6 | terminal-console | yes |
| Paper Protocol | 0.7518 | 39.1 | split-stage | yes |
| Tidal Sui | 0.6774 | 37.4 | split-stage | yes |
| Spectrum Terminal | 0.6738 | 39.6 | gallery-scroll | no |
| Signal Navy | 0.5218 | 12.8 | command-rail | no |
| Cosmos Orbit | 0.4124 | 0 | gallery-scroll | yes |

## Skeleton brief

**Split Stage** — asymmetric 5/7 or 4/8 split with a sticky narrative column; one side scrolls independently; no top navigation bar; a vertical index sits in the sticky column; headline and primary action share the left stage; data is presented as an annotated ledger, not a card grid.

Navigation: Vertical index in the sticky column; on mobile it becomes a horizontally scrollable index strip above the content.

Structure:
1. sticky 42% narrative column with brand, route index and page thesis
1. scrolling 58% data stage
1. full-width proof band below the split
1. footer set inside the narrative column

Content mapping: The sticky column carries brand, route index, page title and the primary action. The scrolling stage carries the table/list/form. Secondary metrics become annotated rows rather than cards.

Recipe: `.split{display:grid;grid-template-columns:minmax(300px,42fr) minmax(0,58fr);min-height:100vh}.narrative{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;justify-content:space-between;padding:clamp(24px,4vw,64px)}.stage{min-height:100vh;padding:clamp(24px,5vw,80px) clamp(20px,5vw,90px)}`

Risks: sticky column must not hide content on short screens; mobile must not preserve the split

## Design tokens

```css
:root {
  --bg: #dde3e9;
  --surface: #FFFFFF;
  --surface-alt: #EFEFEA;
  --ink: #0A0B0D;
  --muted: #6F6F6F;
  --accent: #0000ff;
  --accent-safe: #0000ff;
  --accent-2: #7575FF;
  --line: #E2E2DC;
  --success: #00875A;
  --danger: #C4320A;
  --warning: #9A6700;

  --font-display: "Inter Tight", "Segoe UI", system-ui, sans-serif;
  --font-body: "Inter", "Segoe UI", system-ui, sans-serif;
  --font-mono: "Geist Mono", "Cascadia Mono", ui-monospace, monospace;
  --display-weight: 620;
  --display-tracking: -0.035em;
  --label-tracking: 0.08em;

  --radius-sm: 10px;
  --radius-md: 18px;
  --radius-lg: 30px;
  --border: 1px solid var(--line);
  --shadow: 0 24px 60px rgba(10, 11, 13, 0.08);

  --motion-duration: 170ms;
  --motion-ease: cubic-bezier(.2,.8,.2,1);
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

- Surface: 1px solid var(--line); radius 18px; shadow 0 24px 60px rgba(10, 11, 13, 0.08).
- Type: display **"Inter Tight", "Segoe UI", system-ui, sans-serif** at weight 620, tracking -0.035em; body **"Inter", "Segoe UI", system-ui, sans-serif**; numerals and micro-labels **"Geist Mono", "Cascadia Mono", ui-monospace, monospace**.
- Texture: blueprint hairlines, cobalt focus rings, monochrome diagrams, large numeric counters.
- Motion: crisp, 170ms, cubic-bezier(.2,.8,.2,1). Always wrap non-essential motion in `@media (prefers-reduced-motion: no-preference)`.
- Density: airy. Keep body text >= 14px and body contrast >= 4.5:1.
- Use `--accent-safe` for text and icons on `--bg`; use `--accent` for fills and large shapes.

## Originality guard

The replacement must satisfy all of these:

1. The source inventory archetype is `document-flow`; the new skeleton is `split-stage`. Do not fall back to the old shell during implementation.
2. Do not reuse any original class name, CSS selector, design token name, or original accent family.
3. Rewrite templates, not only CSS. Every route must visibly use the new skeleton.
4. Keep every token in `.reskin/content-contract.json`; move it, never rewrite it.
5. Run `node scripts/verify.mjs check` and do not stop until content, structure, accessibility and responsive checks pass.

## Commit statement

Use this sentence in the final report: "The UI was rebuilt around Cobalt Blueprint / Split Stage; the original document-flow shell and palette were removed while the content contract stayed byte-for-byte intact."
