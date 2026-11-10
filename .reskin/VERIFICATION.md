# Reskin verification — PASS

Generated: 2026-11-09T18:30:49.794Z

- Project: **navrel**
- URL: http://127.0.0.1:4317/
- Original skeleton: `document-flow` (editorial)
- New skeleton: `sidebar-workspace` (shell)
- Accent: #40b3ff -> #0000ff (112.45 ΔE; min 30)
- Source contract: intact (`d2be4022d8c3`)

| Route | Result | DOM similarity | Landmark similarity | Axe serious | Screenshot |
|---|---|---:|---:|---:|---|
| `/` | PASS | 0.297 | 0.6 | 0 | [desktop](current/home-desktop.png) |

## Blocking issues

- None.

## Warnings

- /: aria attribute changed/removed: aria-label=Edition notes
- /: aria attribute added: aria-label=Narrative rail

## Thresholds

- DOM fingerprint similarity <= 0.5
- Landmark sequence similarity <= 0.68
- CSS class overlap <= 0.1
- Accent distance >= 30 ΔE
- Contrast failures <= 0
- Axe serious/critical <= 0

All content is compared as a multiset of visible words plus rendered attribute values. Reordering is allowed, rewriting/removing/adding visible copy is not. Dynamic numeric values are reported as warnings, never silently accepted.
