# Reskin inventory — ledgiva

Generated: 2026-10-21T13:12:11.591Z

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

- Archetype: **document-flow** (editorial)
- Traits: cards, grid, tabs, modal, sticky
- Max template depth: 10
- Top-level tags: div, article, article, section, svg

The replacement skeleton must not be `document-flow` and must not be in the same family (`editorial`).

## Routes

- `/`

## Palette (most used first)

`#000000` (7) · `#f5f4fa` (4) · `#40b3ff` (3) · `#00131f` (1) · `#08080e` (1) · `#0e6fae` (1) · `#10283b` (1) · `#12121e` (1) · `#191927` (1) · `#262536` (1)

## Content lock

- Static visible text tokens: **188**
- Binding expressions: **163**
- Event handlers: **67**
- Contract hash: `53a0606f352ef4f5ad768993c7abefdce4dbe04213f52ec9b010897d0b4a23b4`

Everything in `.reskin/content-contract.json` is immutable: visible copy, placeholders, labels, routes, link targets, asset sources, bindings, handlers, API endpoints and i18n values. A reskin may move these tokens to new markup but may not rewrite, remove or hide them.

## Next

```bash
node scripts/choose-style.mjs --project "E:/workspace/chuangye/solana/702/website" --out .reskin
node scripts/verify.mjs baseline --project "E:/workspace/chuangye/solana/702/website" --out .reskin
```

Then rewrite the UI and run `verify.mjs check`.
