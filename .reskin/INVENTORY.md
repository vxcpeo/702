# Reskin inventory — settiva

Generated: 2026-10-19T18:47:06.251Z

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

- Archetype: **orbital** (spatial)
- Traits: sidebar, cards, hero, grid, tabs, modal, sticky, orbital, terminal
- Max template depth: 9
- Top-level tags: div, article, article, section, svg, div, div, aside, div, div, svg, div, article, article, section, svg

The replacement skeleton must not be `orbital` and must not be in the same family (`spatial`).

## Routes

- `/`

## Palette (most used first)

`#151c25` (15) · `#10161e` (9) · `#11161e` (9) · `#130d24` (9) · `#18231a` (9) · `#172319` (5) · `#ffffff` (5) · `#0b131d` (4) · `#171027` (4) · `#1e1a15` (4)

## Content lock

- Static visible text tokens: **568**
- Binding expressions: **493**
- Event handlers: **203**
- Contract hash: `1ace2a9a98344cef700cbc5fd5b92afa11cb08850d05343181c906b18f6cdb25`

Everything in `.reskin/content-contract.json` is immutable: visible copy, placeholders, labels, routes, link targets, asset sources, bindings, handlers, API endpoints and i18n values. A reskin may move these tokens to new markup but may not rewrite, remove or hide them.

## Next

```bash
node scripts/choose-style.mjs --project "E:/workspace/chuangye/solana/702/website" --out .reskin
node scripts/verify.mjs baseline --project "E:/workspace/chuangye/solana/702/website" --out .reskin
```

Then rewrite the UI and run `verify.mjs check`.
