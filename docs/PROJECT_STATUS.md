# Project Status

Last consolidated: 2026-09-28

This file is the short authoritative status for the Adventurer's Ledger repository. Detailed historical audit evidence remains in the other documents under `docs/`.

## Live on `main`

Current production foundation includes:

- canonical normalized D&D content/catalog handling from PR #4
- D&D/tabletop presentation and responsive character-sheet work from PR #5
- physics-based 3D dice, compact play layout, optional scenery, and current temporary-HP presentation from PR #7
- GitHub Pages deployment from `main`

The live site does **not** yet include the unfinished broad class-integration work described below.

## Active development: class automation

Authoritative branch: `codex/class-integration-engine`

Authoritative PR: #8

PR #8 now also contains the work formerly developed in PR #9. Keep this branch **open, draft, unmerged, and undeployed** until the class automation is considered complete enough for production.

Combined development includes:

- class grant reconciliation for features, actions, resources, training, progression tracks, and source removal
- edition-aware spell eligibility and ownership across creation, advancement, multiclassing, subclasses, and feats
- legacy 3.5 preparation/casting support, prestige casting advancement, psionics, invocations, domains, and specialist restrictions where structured rules exist
- individual 3.5 class-feature presentation instead of combined `Special` cells
- reviewed per-feature 3.5 summaries, beginning with Archivist and Psion
- Archivist regression coverage for Dark Knowledge and Scribe Scroll
- review-only tooling for validating class-feature source blocks without committing source prose

## Intentionally incomplete

The active class branch is not a claim of complete automation for every legacy class.

Remaining work includes source-specific or unusual mechanics that still require structured review, including portions of:

- companions and mounts
- binding/incarnum and other uncommon subsystems
- domain granted powers
- additional power/invocation catalogs and effects
- unreviewed bonus-slot and preparation exceptions
- additional subclass/combat effects
- additional feat effects and class-specific choices
- remaining 3.5 class-feature summaries and action/resource mapping
- exceptional cross-edition conversions

When structured data is missing, the application should surface that limitation rather than invent mechanics.

## Supabase

Supabase is intentionally not being expanded for this class/catalog work. The rules catalog and automation remain application-side. Do not add schema migrations, Edge Functions, or bulk catalog storage merely to support this development branch.

## Repository hygiene

- PR #9 is superseded by the combined PR #8 branch.
- PR #6 is superseded by the later merged presentation/temporary-HP work.
- Historical audit documents may remain for traceability, but this file should be used first for current project state.
- Merged feature branches may be deleted once they are no longer needed for recovery.
