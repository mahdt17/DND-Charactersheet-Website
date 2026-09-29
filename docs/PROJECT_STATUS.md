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

## 2026-09-29 research / verification pipeline checkpoint

- Added Exa -> Tavily -> deterministic validation -> alternate-source/retry -> Firecrawl-last-resort routing documentation and helper scripts.
- CI now syntax-checks the research helpers and generates repository-derived class batch, progress, and exception-queue JSON.
- Archivist source extraction was independently rechecked: Tavily initially returned a clipped query-reranked table, an intelligent Tavily retry produced the full level-20 page, and no Firecrawl fallback was needed.
- Five-class structural source batch uses exact records: PHB Barbarian (classes/barbarian-89), PHB Wizard (classes/wizard-99), PHB Rogue (classes/rogue-97), Complete Arcane Warlock (classes/warlock-4), and Tome of Magic Binder (classes/binder-112). All five source pages passed objective extraction completeness gates.
- Barbarian, Wizard, Rogue, and Warlock already have reviewed feature summaries and verified training data. Binder exposed a real subsystem gap: vestige state plus repeatable Pact Augmentation choices are not faithfully modeled by the generic choice UI.
- Binder now has source-verified starting proficiencies and class skills, but remains needs-review until a reusable binding/vestige subsystem is implemented.
- Firecrawl fallback count for this new workflow remains zero. Supabase was not modified.
- Excel reporting is generated as a checkpoint layer from repository progress data; GitHub remains canonical.

## 2026-09-29 larger class batch

- Selected a 9-class safe promotion batch after filtering pending records for reviewed feature summaries, verified training data, exact-source identity, existing mechanic-specific regressions, and absence of known incomplete spell/aura/binding/manifesting subsystems.
- Batch: PHB Barbarian, PHB Fighter, PHB Monk, PHB Rogue, PHB II Knight, Complete Adventurer Ninja, Complete Adventurer Scout, XPH Soulknife, and Complete Warrior Swashbuckler.
- Exa discovery produced corroborating 3.5 references for the batch; Tavily advanced extraction passed all nine exact source pages on the first pass for level-20 progression, class skills, table integrity, key mechanics, and contamination checks.
- Firecrawl fallback usage remains zero.
- Added one batch regression gate for progression completeness, reviewed descriptions, verified training, idempotent reconciliation, and source-removal cleanup.
- Unearthed Arcana generic Expert and generic Warrior were deliberately peeled into `needs-review`: both require selectable good/poor base-save progressions, and that choice is not yet represented as structured persisted class state.
- Full CI remains the promotion gate; the nine classes stay `reviewed_partial` until it passes.

## 2026-09-29 green larger-batch checkpoint

- Validate modernization #1457 passed at `bc0f0f36371ce15f89ba491a2afa45cc4faa1114`.
- Promoted the nine-class larger safe batch to complete: Barbarian, Fighter, Knight, Monk, Ninja, Rogue, Scout, Soulknife, and Swashbuckler.
- Abjurer Variant also passed its full pending validation on the same run and is complete.
- The Scout repair is systemic: feature matching now normalizes numeric distance suffixes such as `+10ft` rather than depending on one-off class aliases.
- A read-only 10-class follow-up source batch passed Exa discovery + Tavily extraction without any Firecrawl fallback: Adept, Beguiler, Cleric, Dragon Shaman, Dread Necromancer, Duskblade, Marshal, Paladin, Ranger, and Warmage.
- All ten are now explicitly classified `needs-review` because their remaining blockers are structured automation gaps rather than source-retrieval problems. The tracker records the exact blocker and next action per class.

