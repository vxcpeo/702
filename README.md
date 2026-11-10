# Navrel website

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
never copied. check:site guards the workspace brand registry (`brand.txt`) against
the shipped identity and fails if key material reaches any public output.
check:ui and check:experience start a local preview of the build (or use `-- <url>`
when one is already running), then run the state audit and the functional flow
suite against it.

## Interface

The interface is a **cobalt blueprint**: a cool-paper ground with a faint
blueprint grid, a sticky narrative rail that carries the brand, the route index,
the page thesis and the primary actions, one white data sheet on the right, a
full-width edition band and a colophon. The index is a stacked register with
tabular figures and a tally band, the dossier is a case file with a facts strip,
a vault band and three numbered chapters, and the field guide is a numbered stair
with rule-row creeds and FAQ disclosures. Its direction, skeleton and content
contract are described in `.reskin/REPORT.md` and enforced by the QA suites in
`scripts/qa/`. The component tree is small and the presentation layer is a
single stylesheet:

- `src/App.vue` — the shell: rail (brand, route index, thesis, actions, route
  keys), the stage, the edition band, the colophon, the contents sheet, the draft
  dialog and the toast strips;
- `src/components/BriefIndex.vue` — the stage head, control strip, topic and
  standing chips, tally band and the register entries;
- `src/components/BriefDossier.vue` — a selected brief's case bar, facts strip,
  vault band with the split rail, three chapters, two-up entry forms, evidence
  rows and the marginalia band;
- `src/components/BriefGuide.vue` — the field guide, numbered stair, creed
  sections and FAQ disclosures;
- `src/components/UiIcon.vue` — the inline icon family;
- `src/styles/blueprint.css` — every token, layout, rule and motion curve.

The application logic (composables, Solana client, formatting, sample data and
the write gates) is separate from the presentation. The only selector references
in `App.vue` are the presentational hooks it needs for focus management
(`#bp-contents`, `.bp-entry-open`, `.bp-key[aria-controls="bp-contents"]`,
`.bp-dialog-body`, `.bp-preview h3`).

## Identity

The canonical identity is Navrel (navrel.site, @Navrel_site). The page head
declares https://navrel.site as the canonical and Open Graph URL and links
https://x.com/Navrel_site with `rel="me"`; the colophon carries the visible
profile link. The mark is the N and its relay: two ink stems, chamfered at the
outer corners, joined by one cobalt diagonal. It ships as
`public/navrel-mark.svg` (ink and cobalt on cool paper) and is also the masthead
mark. The site serves `public/navrel-favicon.svg` (ink N and cobalt diagonal on
paper), `public/navrel-seal.svg` (the fieldless in-page masthead mark) and
`public/navrel-edition-social.png` for Open Graph.

Regenerate the X kit with `twitter/generate_assets.py`, which writes the kit in
`twitter/`, then run `npm run sync:mirror` so `a702/` matches. The favicon, seal,
mark and edition social card come from `twitter/generate_edition_assets.py`,
which imports the same mark geometry, so no asset is drawn twice. Do not use the
kit generator's `--sync-public` flag in this project: the site's own assets come
from the edition generator, and that flag is retained for compatibility only.

Saved briefs migrate older project keys, including settiva-saved, yovinx-saved,
tallyvein-saved, quilsted-saved, buidlspur-saved, citevra-saved,
attestora-saved, trovane-saved and ledgiva-saved, into navrel-saved. Search,
filters, sorting, mobile navigation, modal focus handling and the sample-only
preview remain available.

The deployed program id is preserved as a Solana technical identifier:
5ibhioLv21ShH9EXjRDkhygREtXqHHTZ6vtEC3DGgwDu (testnet). The legacy
Hardhat/EVM project under contracts/archive/legacy-evm/ is historical and is
not imported, deployed or used by the website.
