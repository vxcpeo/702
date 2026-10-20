# Settiva website

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

The UI is a paper broadsheet: a warm masthead, a typographic hero, a numbered
brief index, an in-flow dossier, a field guide and a colophon at the foot of the
page. The terminal deck is gone rather than restyled: there is no chain header,
tab rail, inline filter strip, registry table, sticky inspector pane or fixed
bottom status bar.

| Region | Role |
| --- | --- |
| Masthead | Ink seal and serif wordmark, four text navigation links with live counts, the draft-sheet action, the wallet gate and the mobile contents toggle |
| Hero | The edition's two-line statement, the market lede and the editor's note with sample figures |
| Index | Search line, topic and standing filters, order control, numbered entries with pool, deadline, state and a keep action |
| Dossier | A selected brief replaces the index in the flow: scope, contribution forms, evidence review, pool split and draft actions |
| Field guide | The three-step loop, settlement rules, FAQ and page actions |
| Colophon | Cluster, abbreviated program id, edition, the no-writes and sample-data notice, and the back-to-top action |

A selected brief is an in-flow page, not a dialog and not a side pane. Below
900 px the dossier stays in the reading flow and navigation becomes a full-screen
contents menu; below 760 px the filter rows scroll in place and the entries stack
into full-width rows.

Styling lives in one file, `src/styles/settiva-ledger.css`. Its `:root` tokens
hold every colour, rule, radius and easing curve. The edition uses warm cream
stock, 1–3 px ink rules, an asymmetric card radius, a cinnabar accent and no
shadows on the reading surface; motion is minimal and is dropped under
`prefers-reduced-motion`, the ruled-paper texture and paper shadows are dropped
under `forced-colors`, and print hides the controls.

Type uses the operating-system stacks: Georgia for the display voice and Segoe
UI for reading copy and labels. No web font is shipped, preloaded or requested.
The previous JetBrains Mono and Space Grotesk faces are retired from the site and
kept only under `twitter/fonts/` for reproducible social-kit generation.

## Identity

The canonical identity is Settiva (settiva.xyz, @settiva). The mark is the seal:
one solid block cut by two openings that enter from opposite edges and end on a
45° bias, so two paths cut in and one record stays continuous between them. It
ships as public/settiva-mark.svg and is served as the social-kit mark. The paper
edition serves public/settiva-favicon.svg (ink on paper), public/settiva-seal.svg
(the in-page masthead seal) and public/settiva-edition-social.png for Open Graph.
Regenerate the mark and the X kit with twitter/generate_assets.py
--sync-public, which writes twitter/ and mirrors only the site mark into
website/public/, then run npm run sync:mirror so a702/ matches. The paper
favicon, seal and edition social card come from
twitter/generate_edition_assets.py, which imports the same seal geometry, so no
asset is drawn twice.

Saved briefs migrate older project keys, including yovinx-saved, tallyvein-saved,
quilsted-saved, buidlspur-saved, citevra-saved and attestora-saved, into
settiva-saved. Search, filters, sorting, mobile navigation, modal focus handling
and the sample-only preview remain available.

The superseded terminal deck and the duplicate snapshot of the previous paper
edition were removed in the Settiva rebrand; their files are preserved in the
rebrand backup and are not built or served.

The deployed program id is preserved as a Solana technical identifier:
5ibhioLv21ShH9EXjRDkhygREtXqHHTZ6vtEC3DGgwDu (testnet). The legacy
Hardhat/EVM project under contracts/archive/legacy-evm/ is historical and is
not imported, deployed or used by the website.
