# Reskin verification — PASS

Generated: 2026-10-22T15:38:54.880Z

- Project: **colopha**
- URL: http://127.0.0.1:4317/
- Original skeleton: `gallery-scroll` (spatial)
- New skeleton: `document-flow` (editorial)
- Accent: #8f4b00 -> #40b3ff (105.32 ΔE; min 30)
- Source contract: intact (`caf5eb3855b2`)

| Route | Result | DOM similarity | Landmark similarity | Axe serious | Screenshot |
|---|---|---:|---:|---:|---|
| `/` | PASS | 0.391 | 0.6 | 0 | [desktop](current/home-desktop.png) |

## Blocking issues

- None.

## Warnings

- attributes: "name=plus" count increased 10 -> 11
- events: "click:startCreate" count increased 4 -> 5
- /: aria attribute added: aria-label=Edition notes
- /: aria attribute added: aria-label=Post a brief

## Thresholds

- DOM fingerprint similarity <= 0.5
- Landmark sequence similarity <= 0.68
- CSS class overlap <= 0.1
- Accent distance >= 30 ΔE
- Contrast failures <= 0
- Axe serious/critical <= 0

All content is compared as a multiset of visible words plus rendered attribute values. Reordering is allowed, rewriting/removing/adding visible copy is not. Dynamic numeric values are reported as warnings, never silently accepted.
