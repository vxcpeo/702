# Trovane website

Two paths in. One record out.

Vue 3 + Vite Solana bounty market for open builder work, public evidence and
creator-led review. The site targets Solana testnet and shows sample briefs in
testnet SOL. The Anchor escrow client stays gated until a reward mint and
deployment parameters are verified.

From PowerShell:

    npm install
    npm run dev -- --host 127.0.0.1 --port 42713 --strictPort
    npm run build:all
    npm run check:logic
    npm run check:site
    npm run check:ui -- http://127.0.0.1:42713/
    npm run check:experience -- http://127.0.0.1:42713/

build:all builds the main site, synchronizes public source to a702/, then builds
that mirror. Edit parent source only. Environment files are independent and
never copied. check:site additionally guards the workspace brand records
(key.txt.branding and list.txt) against the shipped identity and fails if key
material reaches any public output.

## Interface

The interface is a **documentary ledger** on a dark Cosmos field: an issue line
and masthead lockup, a mono route index inside the document, a nine-column lede
with a three-column editor's note, a seven/three registry with a marginal
summary, ruled ledger rows, numbered chapters and a colophon. Its direction,
skeleton, content contract and validation are recorded in
[`../RESKIN-VALIDATION.md`](../RESKIN-VALIDATION.md). The component tree is small
and the presentation layer is a single stylesheet:

- `src/App.vue` — the shell: masthead, route index, lede and marginalia,
  colophon, floating sheet and contents plate;
- `src/components/BriefIndex.vue` — the registry, query row, index-line filters,
  sort and the marginal summary figures;
- `src/components/BriefDossier.vue` — a selected brief's fact register, pool
  band, numbered chapters, entry forms, evidence ledger and review panel;
- `src/components/BriefGuide.vue` — the field guide, rules and FAQ ledger;
- `src/components/UiIcon.vue` — the inline icon family;
- `src/styles/meridian-ledger.css` — every token, layout, rule and motion curve.

The application logic (composables, Solana client, formatting, sample data and
the write gates) is separate from the presentation and is not part of the
reskin surface.

## Identity

The canonical identity is Trovane (trovane.xyz, @trovane). The mark is the T and
its full stop: a bold T with a 64-unit crossbar, a 40-unit stem and a square
period on the baseline. It ships as `public/trovane-mark.svg` (white on black)
and is also the masthead mark. The site serves `public/trovane-favicon.svg`
(white on black), `public/trovane-seal.svg` (the fieldless in-page masthead mark,
inverted by the stylesheet) and `public/trovane-edition-social.png` for Open
Graph.

Regenerate the X kit with `twitter/generate_assets.py --sync-public`, which
writes `twitter/` and mirrors only the site mark into `website/public/`, then run
`npm run sync:mirror` so `a702/` matches. The favicon, seal, mark and edition
social card come from `twitter/generate_edition_assets.py`, which imports the
same mark geometry, so no asset is drawn twice.

Saved briefs migrate older project keys, including settiva-saved, yovinx-saved,
tallyvein-saved, quilsted-saved, buidlspur-saved, citevra-saved and
attestora-saved, into trovane-saved. Search, filters, sorting, mobile
navigation, modal focus handling and the sample-only preview remain available.

The deployed program id is preserved as a Solana technical identifier:
5ibhioLv21ShH9EXjRDkhygREtXqHHTZ6vtEC3DGgwDu (testnet). The legacy
Hardhat/EVM project under contracts/archive/legacy-evm/ is historical and is
not imported, deployed or used by the website.
