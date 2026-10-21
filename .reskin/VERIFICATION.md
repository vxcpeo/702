# Reskin verification — PASS

Generated: 2026-10-21T13:59:34.470Z

- Project: **ledgiva**
- URL: http://127.0.0.1:4317/
- Original skeleton: `document-flow` (editorial)
- New skeleton: `gallery-scroll` (spatial)
- Accent: #40b3ff -> #8f4b00 (105.32 ΔE; min 30)
- Source contract: intact (`5ff8d84d0492`)

| Route | Result | DOM similarity | Landmark similarity | Axe serious | Screenshot |
|---|---|---:|---:|---:|---|
| `/` | PASS | 0.38 | 0.571 | 0 | [desktop](current/home-desktop.png) |

## Blocking issues

- None.

## Warnings

- attributes: "name=plus" count increased 9 -> 10
- bindings: added "attr:'#' + item.id"
- bindings: added "attr:item.id === 'index' ? 'ledger' : item.id === 'saved' ? 'bookmark' : item.id === 'activity' ? 'wallet' : 'book'"
- bindings: added "form:item.id === 'index' ? 'ledger' : item.id === 'saved' ? 'bookmark' : item.id === 'activity' ? 'wallet' : 'book'"
- bindings: added "link:'#' + item.id"
- events: "click:goPage(item.id)" count increased 2 -> 3
- events: "click:startCreate" count increased 3 -> 4
- /: aria attribute changed/removed: aria-label=This edition at a glance
- /: aria attribute added: aria-label=Guide
- /: aria attribute added: aria-label=Index, 4 records
- /: aria attribute added: aria-label=My briefs, 0 records
- /: aria attribute added: aria-label=Post a brief
- /: aria attribute added: aria-label=Quick access
- /: aria attribute added: aria-label=Saved, 0 records
- /: link target added: #activity
- /: link target added: #guide
- /: link target added: #index
- /: link target added: #saved

## Thresholds

- DOM fingerprint similarity <= 0.5
- Landmark sequence similarity <= 0.68
- CSS class overlap <= 0.1
- Accent distance >= 30 ΔE
- Contrast failures <= 0
- Axe serious/critical <= 0

All content is compared as a multiset of visible words plus rendered attribute values. Reordering is allowed, rewriting/removing/adding visible copy is not. Dynamic numeric values are reported as warnings, never silently accepted.
