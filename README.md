# Colopha website

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

The interface is a **night sheet** chart desk: a void field with a signal glow and
a faint chart grid, a three-column dateline, a ruled index line, a wide reading
plate with a complementary margin, hairline ledger rows with tabular figures, a
dossier sheet, a guide stair, a ledger dialog for the draft and the rewards, and a
colophon. Its direction, skeleton, content contract and validation are recorded in
[`../RESKIN-VALIDATION.md`](../RESKIN-VALIDATION.md). The component tree is small
and the presentation layer is a single stylesheet:

- `src/App.vue` — the shell: dateline, index line, plate + margin, compass,
  contents sheet, ledger dialog, dispatch strips and colophon;
- `src/components/BriefIndex.vue` — the query rail, facet pills, tally line, sort
  and the hairline ledger rows;
- `src/components/BriefDossier.vue` — a selected brief's case ledger, vault plate,
  split rail, chapters, entry forms, evidence cards and marginalia;
- `src/components/BriefGuide.vue` — the field guide, numbered stair, creed
  sections and FAQ stack;
- `src/components/UiIcon.vue` — the inline icon family;
- `src/styles/nightsheet.css` — every token, layout, rule and motion curve.

The application logic (composables, Solana client, formatting, sample data and
the write gates) is separate from the presentation and is not part of the
reskin surface. The only selector references in `App.vue` are the presentational
hooks it needs for focus management (`#site-contents`, `.entry-open`,
`.compass-key[aria-controls="site-contents"]`, `.dialog-body`, `.preview-slip`).

## Identity

The canonical identity is Colopha (colopha.xyz, @colopha). The mark is the C and
its fleuron: a bold open ring with a forty degree aperture and one printer's
diamond set in the opening. It ships as `public/colopha-mark.svg` (ink and
accent on paper) and is also the masthead mark. The site serves
`public/colopha-favicon.svg` (ink C and accent fleuron on paper),
`public/colopha-seal.svg` (the fieldless in-page masthead mark) and
`public/colopha-edition-social.png` for Open Graph.

Regenerate the X kit with `twitter/generate_assets.py`, which writes the kit in
`twitter/`, then run `npm run sync:mirror` so `a702/` matches. The favicon, seal,
mark and edition social card come from `twitter/generate_edition_assets.py`,
which imports the same mark geometry, so no asset is drawn twice. Do not use the
kit generator's `--sync-public` flag in this project: the site's own assets come
from the edition generator, and that flag is retained for compatibility only.

Saved briefs migrate older project keys, including settiva-saved, yovinx-saved,
tallyvein-saved, quilsted-saved, buidlspur-saved, citevra-saved,
attestora-saved, trovane-saved and ledgiva-saved, into colopha-saved. Search,
filters, sorting, mobile navigation, modal focus handling and the sample-only
preview remain available.

The deployed program id is preserved as a Solana technical identifier:
5ibhioLv21ShH9EXjRDkhygREtXqHHTZ6vtEC3DGgwDu (testnet). The legacy
Hardhat/EVM project under contracts/archive/legacy-evm/ is historical and is
not imported, deployed or used by the website.
