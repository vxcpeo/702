# Reskin inventory — colopha

Generated: 2026-10-22T15:07:19.598Z

## Project

| Field | Value |
|---|---|
| Root | `E:/workspace/chuangye/solana/702/website` |
| Vue | latest |
| Package manager | npm |
| Nuxt | no |
| CSS frameworks | none detected |
| Files scanned | 11 (5 SFCs) |

## Original skeleton

- Archetype: **gallery-scroll** (spatial)
- Traits: cards, grid, tabs, modal, sticky, gallery
- Max template depth: 9
- Top-level tags: div, article, article, section, svg

The replacement skeleton must not be `gallery-scroll` and must not be in the same family (`spatial`).

## Routes

- `/`

## Palette (most used first)

`#fafaf9` (14) · `#ffeceb` (4) · `#161616` (3) · `#12100f` (1) · `#1e6b47` (1) · `#2e2a27` (1) · `#6e625c` (1) · `#8f4b00` (1) · `#a80008` (1) · `#b00016` (1)

## Content lock

- Static visible text tokens: **188**
- Binding expressions: **167**
- Event handlers: **69**
- Contract hash: `566ff31764277bc1af0a446617b4e6ea8689368280c26badc0a636058a615f6a`

Everything in `.reskin/content-contract.json` is immutable: visible copy, placeholders, labels, routes, link targets, asset sources, bindings, handlers, API endpoints and i18n values. A reskin may move these tokens to new markup but may not rewrite, remove or hide them.

## Next

```bash
node scripts/choose-style.mjs --project "E:/workspace/chuangye/solana/702/website" --out .reskin
node scripts/verify.mjs baseline --project "E:/workspace/chuangye/solana/702/website" --out .reskin
```

Then rewrite the UI and run `verify.mjs check`.
