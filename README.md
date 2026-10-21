# Ledgiva website

Two paths in. One record out.

Vue 3 + Vite Solana bounty market for open builder work, public evidence and
creator-led review. The site targets Solana testnet and shows sample briefs in
testnet SOL. The Anchor escrow client stays gated until a reward mint and
deployment parameters are verified.

From PowerShell:

    npm install
    npm run dev
    npm run build:all
    npm run check:logic
    npm run check:site
    npm run check:ui
    npm run check:experience

build:all builds the main site, synchronizes public source to a702/, then builds
that mirror. Edit parent source only. Environment files are independent and
never copied. check:site additionally guards the workspace brand records
(key.txt.branding and list.txt) against the shipped identity and fails if key
material reaches any public output. check:ui and check:experience start a local
preview of the build (or use `-- <url>` when one is already running), then run the
state audit and the functional flow suite against it.

## Interface

The interface is a **poster press**: a cream printed field with an ink mast flag,
a route wall of four poster tiles, full-bleed scenes, a large statement lede with
an editor's note plate, a facts band, a two-column poster card wall for the
briefs, a single-print dossier, a field-guide poster stack, a floating dock of
icon keys, a poster sheet for the draft, and a black colophon. Its direction,
skeleton, content contract and validation are recorded in
[`../RESKIN-VALIDATION.md`](../RESKIN-VALIDATION.md). The component tree is small
and the presentation layer is a single stylesheet:

- `src/App.vue` — the shell: mast flag, route wall, opening scene, dock, poster
  sheet, contents plate and colophon;
- `src/components/BriefIndex.vue` — the query bar, sticker filters, facts band,
  sort and the poster card wall;
- `src/components/BriefDossier.vue` — a selected brief's fact row, pool plate,
  split bar, chapters, entry forms, evidence cards and review panel;
- `src/components/BriefGuide.vue` — the field guide, step plates, rules and FAQ
  stack;
- `src/components/UiIcon.vue` — the inline icon family;
- `src/styles/poster-press.css` — every token, layout, rule and motion curve.

The application logic (composables, Solana client, formatting, sample data and
the write gates) is separate from the presentation and is not part of the
reskin surface. The only selector references in `App.vue` are the presentational
hooks it needs for focus management (`#site-contents`, `.card-open`,
`.dock-key[aria-controls="site-contents"]`, `.sheet-body`, `.review-brief`).

## Identity

The canonical identity is Ledgiva (ledgiva.xyz, @ledgiva). The mark is the L and
its ledger rule: a bold L whose foot runs on as a long baseline, with one
detached rule above it. It ships as `public/ledgiva-mark.svg` (ink and red on
paper) and is also the masthead mark. The site serves
`public/ledgiva-favicon.svg` (ink L and red rule on cream),
`public/ledgiva-seal.svg` (the fieldless in-page masthead mark) and
`public/ledgiva-edition-social.png` for Open Graph.

Regenerate the X kit with `twitter/generate_assets.py`, which writes the kit in
`twitter/`, then run `npm run sync:mirror` so `a702/` matches. The favicon, seal,
mark and edition social card come from `twitter/generate_edition_assets.py`,
which imports the same mark geometry, so no asset is drawn twice. Do not use the
kit generator's `--sync-public` flag in this project: the site's own assets come
from the edition generator, and that flag is retained for compatibility only.

Saved briefs migrate older project keys, including settiva-saved, yovinx-saved,
tallyvein-saved, quilsted-saved, buidlspur-saved, citevra-saved,
attestora-saved and trovane-saved, into ledgiva-saved. Search, filters, sorting,
mobile navigation, modal focus handling and the sample-only preview remain
available.

The deployed program id is preserved as a Solana technical identifier:
5ibhioLv21ShH9EXjRDkhygREtXqHHTZ6vtEC3DGgwDu (testnet). The legacy
Hardhat/EVM project under contracts/archive/legacy-evm/ is historical and is
not imported, deployed or used by the website.
