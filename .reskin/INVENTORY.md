# Reskin inventory — trovane

Generated: 2026-10-20T16:26:12.384Z

## Project

| Field | Value |
|---|---|
| Root | `E:/workspace/chuangye/solana/702/website` |
| Vue | latest |
| Package manager | npm |
| Nuxt | no |
| CSS frameworks | none detected |
| Files scanned | 31 (16 SFCs) |

## Original skeleton

- Archetype: **document-flow** (editorial)
- Traits: cards, grid, tabs, modal, sticky
- Max template depth: 10
- Top-level tags: div, article, article, section, svg, div, div, div, div, div, svg, div, article, article, section, svg

The replacement skeleton must not be `document-flow` and must not be in the same family (`editorial`).

## Routes

- `/`

## Palette (most used first)

`#151c25` (15) · `#000000` (14) · `#10161e` (9) · `#11161e` (9) · `#130d24` (9) · `#18231a` (9) · `#f5f4fa` (8) · `#40b3ff` (6) · `#172319` (5) · `#ffffff` (5)

## Content lock

- Static visible text tokens: **568**
- Binding expressions: **493**
- Event handlers: **203**
- Contract hash: `4d886e810c0a0928c6019839dcbfda5f5ee16f039c1346303fb31849a4c82bda`

Everything in `.reskin/content-contract.json` is immutable: visible copy, placeholders, labels, routes, link targets, asset sources, bindings, handlers, API endpoints and i18n values. A reskin may move these tokens to new markup but may not rewrite, remove or hide them.

## Next

```bash
node scripts/choose-style.mjs --project "E:/workspace/chuangye/solana/702/website" --out .reskin
node scripts/verify.mjs baseline --project "E:/workspace/chuangye/solana/702/website" --out .reskin
```

Then rewrite the UI and run `verify.mjs check`.
