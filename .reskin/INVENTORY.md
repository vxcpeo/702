# Reskin inventory — navrel

Generated: 2026-11-09T16:47:26.795Z

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
- Traits: cards, grid, tabs, modal, charts, sticky
- Max template depth: 9
- Top-level tags: div, article, article, section, svg

The replacement skeleton must not be `document-flow` and must not be in the same family (`editorial`).

## Routes

- `/`

## Palette (most used first)

`#12121e` (9) · `#40b3ff` (8) · `#0a0a12` (5) · `#050509` (4) · `#000000` (3) · `#5ce1a0` (3) · `#ff8a8a` (3) · `#02121d` (2) · `#08080e` (1) · `#0b6e9e` (1)

## Content lock

- Static visible text tokens: **188**
- Binding expressions: **167**
- Event handlers: **70**
- Contract hash: `d2be4022d8c3f0893d496500270b84ca06471abcf1c3754e1faea6cbd5a193cb`

Everything in `.reskin/content-contract.json` is immutable: visible copy, placeholders, labels, routes, link targets, asset sources, bindings, handlers, API endpoints and i18n values. A reskin may move these tokens to new markup but may not rewrite, remove or hide them.

## Next

```bash
node scripts/choose-style.mjs --project "E:/workspace/chuangye/solana/702/website" --out .reskin
node scripts/verify.mjs baseline --project "E:/workspace/chuangye/solana/702/website" --out .reskin
```

Then rewrite the UI and run `verify.mjs check`.
