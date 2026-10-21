# Reskin QA suites

The state audit and the functional flow suite live in the project as
`website/scripts/qa/state-audit.mjs` and `website/scripts/qa/flow-suite.mjs`,
wired to `npm run check:ui` and `npm run check:experience` through
`scripts/qa/run.mjs`. They were developed here during the reskin and moved into
the shipped project so the checks survive a later regeneration of `.reskin`.

The captured evidence of the run remains in `review/` (12 states), and the
pipeline artefacts are in `baseline/` and `current/`.
