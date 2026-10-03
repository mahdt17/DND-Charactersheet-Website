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

## 2026-09-29 reviewed 17-class source batch

- Validate modernization #1458 passed at `5e2ba0d7c871ce826d837ccba8a799b1f3c64dd1`; the prior 28-class checkpoint remains green.
- Audited all 17 remaining pending classes that already had reviewed feature summaries and verified training profiles.
- Sixteen exact new.dndtools pages passed the Exa -> Tavily objective extraction gate on the first pass; Firecrawl fallback usage remained zero.
- PHB Druid is complete: exact source verification, structured Animal Companion selection/persistence, Wild Shape automation, spontaneous preparation behavior, full 3.5 regressions, build, browser coverage, and the generated class-automation audit all pass.
- Eberron Campaign Setting Bard is `source-conflict`: both exact D&DTools pages are incomplete, while corroborated ECS p.34 evidence adds a bardic-music-for-bonus-feat substitution absent from the current PHB-derived summaries.
- The other fifteen records are `needs-review` with explicit subsystem blockers in the canonical tracker rather than being promoted from source completeness alone.

## 2026-09-29 source-equivalent reprint + training checkpoint

- Validate modernization #1461 passed at `831c5f7ffc0bd92e2c50d1055919c1e432c81833` after adding source-verified starting training for Cloistered Cleric and Complete Warrior Samurai.
- Samurai is complete: all simple/martial weapons, all armor, no shields; Daisho Proficiency remains a source-owned class feat. Existing level 1-20 action/resource/feat/idempotence/removal regressions remain green.
- Cloistered Cleric training is verified as simple weapons + light armor, but the record remains `needs-review` because the shared Cleric domain granted-power/deity restriction subsystem is still incomplete.
- Processed the existing 28-record source-equivalent reprint invariant as one batch. Twelve reprints whose reviewed parent is complete are now complete; sixteen reprints inherit the exact unresolved blocker of their incomplete parent instead of being falsely promoted.
- The existing regression invariant proves each reprint reconciles identically to its linked reviewed parent for features, actions, feats, resources, progression tracks, spell slots, training, descriptions, and structural completeness.
- Firecrawl fallback usage remains zero; Supabase remains unchanged.
- Canonical tracker totals after this checkpoint: **42 complete, 45 needs-review, 1 source-conflict, 2 blocked, 964 pending audit**.

## 2026-09-29 Advanced Learning integration checkpoint

- Validate modernization #1476 passed at `d7bc51975028f8788157c72268472e74d880c7bb` after repairing structured Advanced Learning metadata propagation and wiring the 3.5 spell catalog into the real level-up UI.
- Beguiler is complete: Advanced Learning now enforces Wizard-list, school, level, and native-list exclusions; the level 6 → 7 browser path requires a valid choice and verifies permanent grant persistence after save/reopen.
- Warmage is complete: Advanced Learning now materializes a permanent source-owned spell-access grant with source eligibility and persistence regressions.
- Dread Necromancer remains `needs-review`: Advanced Learning is fixed, leaving only the independent evil-familiar companion-state/lifecycle blocker.
- Firecrawl fallback usage remained zero and Supabase was not changed.
- Canonical tracker totals: **44 complete, 43 needs-review, 1 source-conflict, 2 blocked, 964 pending audit**.

## 2026-09-29 profiled 8-class source audit

- Validate modernization #1477 passed at `b61de4ef934f46c4905a78a68cba2001b92c3b3b`; the Advanced Learning tracker checkpoint is green.
- Audited eight additional pending classes that already had source-verified training profiles: Battle Dancer, Death Master, Drow Paragon, Dwarf Paragon, Elf Paragon, Jester, Noble, and Spellthief.
- Exact source pages were reviewed with Exa and had already passed the earlier Tavily exact-page extraction gate; no Firecrawl fallback or Supabase read was required.
- All eight move from `pending_audit` to explicit `needs-review`. They are intentionally not promoted because each requires structured feature/state work beyond source completeness.
- Canonical tracker totals after this source-audit batch: **44 complete, 51 needs-review, 1 source-conflict, 2 blocked, 956 pending audit**.

## 2026-09-29/30 profiled 22-class source audit

- Validate modernization #1479 passed at `538c6832cc5aa6b3d664f6d4a16f6ae2e29d4747`, including the existing full 3.5 regressions, build, and browser suites.
- Audited all 22 remaining `pending_audit` base-class records that already had independently verified starting-training profiles but no reviewed feature-summary block.
- Exa source discovery was grouped into five subsystem workstreams; Tavily advanced extraction passed all 22 exact new.dndtools pages without a Firecrawl fallback.
- Miniatures Handbook Warmage is now complete: the source identifies Complete Arcane as another published appearance, the training profile already points to `classes/warmage-5`, and the source-equivalence regression now proves identical reconciled mechanics.
- The other 21 records are now explicit `needs-review` entries with class-specific subsystem blockers (psionics/mantles, incarnum, Tome of Battle maneuvers, spellbook/spells-known models, domains/companions, ghost/monster progression, or configurable-class state).
- Supabase remains unchanged.
- Canonical tracker totals after this batch: **45 complete, 72 needs-review, 1 source-conflict, 2 blocked, 934 pending audit**.

## 2026-09-29/30 prestige 20-class source audit

- Green validation baseline before audit: #1480 at `9325426767c8e9e39724883243815a9b9faef238`.
- Source-audited 20 previously pending prestige-class records using Exa discovery plus Tavily exact-page extraction; 0 Firecrawl fallbacks and 0 Supabase writes.
- No class was promoted from source completeness alone. All 20 move to explicit `needs-review` because prestige prerequisites and/or class-specific structured mechanics are not yet fully automated.
- Same-name source records (Acolyte of the Skin, Alienist, Animal Lord) remain independent because their source requirements/progression differ materially; no name-based inheritance was used.
- Alternate source-faithful references were used for older pages whose parsed D&DTools record omitted a labeled requirements block, including Agent Retriever, Akodo Champion, and Anointed Knight.
- Canonical tracker totals after this audit: **45 complete, 92 needs-review, 1 source-conflict, 2 blocked, 914 pending audit**.

## 2026-09-29/30 prestige second 20-class source audit

- Validation baseline #1481 passed at `f636202f739ca0d316697ea2854f7138947e75a9`.
- Source-audited the next 20 pending prestige-class records with Exa + Tavily; 0 Firecrawl fallbacks and 0 Supabase writes.
- All 20 move to explicit `needs-review`; none were promoted from successful extraction alone because reviewed summaries/training and structured prestige mechanics are absent.
- Duplicate names remain source-independent: both Arachnomancers, both Arcane Devotees, both Arcane Tricksters, and both Archmages preserve their source/version differences.
- Exact prestige requirements were recovered with alternate source-faithful references where the parsed page omitted fields, including Arcane Archer, Arcane Hierophant, Arcanopath Monk, Arch Psion, Ardent Dilettante, Argent Fist, Ashworm Dragoon, Astral Dancer and Atavist.
- Canonical tracker totals: **45 complete, 112 needs-review, 1 source-conflict, 2 blocked, 894 pending audit**.


## 2026-09-30 prestige third 20-class source audit

- Green validation baseline #1482 at `e137c6d5295b38e6b69f5f233cd5768e708c3f2b`.
- Source-audited the next 20 pending prestige-class records with Exa discovery plus Tavily advanced extraction of all 20 exact new.dndtools pages. Grouped Firecrawl fallback searches were attempted where old entry blocks were partial but returned no usable additional source pages; Supabase remained unchanged.
- All 20 move to explicit `needs-review`; none were promoted from successful source extraction alone because reviewed summaries, structured prerequisites and/or class-specific automation are still missing.
- Same-name records remain independent: Complete Warrior and Oriental Adventures Bear Warrior have different timing/proficiency/resource rules, while Lords of Madness and Monsters of Faerûn Beholder Mage use materially different casting/special progressions.
- Alternate source-faithful references recovered omitted entry criteria for the partial parsed records, while Battle Scion remains weapon-defined rather than receiving a fabricated universal prerequisite set.
- Canonical tracker totals: **45 complete, 132 needs-review, 1 source-conflict, 2 blocked, 874 pending audit**.

## 2026-09-30 prestige 75-class source audit

- Green validation baseline #1483 at `e10f7f700083079952fd14dbac8629b36399da19` (https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36669954450).
- Source-audited **75** pending prestige-class records in one checkpoint using Exa discovery plus Tavily advanced extraction of the exact source/version records. Firecrawl fallback searches were attempted for ambiguous same-name pairs; they produced no additional usable pages. Supabase remained unchanged.
- All 75 move from `pending_audit` to source-verified `needs-review`; none were promoted solely because source research succeeded. Structured prerequisites, reviewed summaries, automation and regression evidence remain required for completion.
- Same-name records remain source-independent, including Black Flame Zealot, Bladesinger, Blighter, Blood Magus, Bloodhound, Cavalier, Church Inquisitor, Consecrated Harrier, Constructor, Contemplative and Crystal Master.
- Bloodscaled Fury preserves the verified **BAB +22** entry requirement despite a truncated "+2" summary on the exact new.dndtools page.
- Canonical tracker totals: **45 complete, 207 needs-review, 1 source-conflict, 2 blocked, 799 pending audit**.

## 2026-09-30 second prestige 75-class source audit

- Green validation baseline #1484 at `e52020e104b8342cf59f29b838529ef5e447e129` (https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36671735034).
- Source-audited **75** additional pending prestige-class records, **Cyre Scout through Dragonslayer**, in one atomic checkpoint using exact-page Tavily extraction plus Exa source-faithful prerequisite recovery. Firecrawl fallback searches on ambiguous duplicate/source pairs yielded no additional usable pages. Supabase remained unchanged.
- All 75 move from `pending_audit` to source-verified `needs-review`; none were promoted merely because source research succeeded.
- Same-name/source variants remain independent, including Divine Champion, Divine Disciple, Divine Oracle and Divine Seeker. Dragon Rider (Dragonlance) and Dragonrider (Draconomicon) are also kept fully separate.
- Demonwrecker Arcane keeps its parsed prerequisite discrepancy explicit for implementation-time resolution rather than silently normalizing the record.
- Canonical tracker totals: **45 complete, 282 needs-review, 1 source-conflict, 2 blocked, 724 pending audit**.

## 2026-09-30 third prestige 75-class source audit

- Green validation baseline #1485 at `dc7e9498b62745afa44954208c7bcfe8b404ac2e` (https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36673595321).
- Source-audited **75** additional pending records, **Dragonsong Lyrist through Epic Ranger**, in one atomic checkpoint.
- Tavily bulk exact-page extraction returned empty result sets for this batch, so it was explicitly rejected as evidence. Exa discovery plus source-faithful SRD/D&DTools/RealmsHelps and archived source references were used instead. Supabase remained unchanged.
- Epic Level Handbook **3.0** progressions remain independent from Dungeon Master's Guide v3.5 epic progressions; duplicate-name source variants were not collapsed.
- All 75 move from `pending_audit` to source-verified `needs-review`; none were promoted on source research alone.
- Canonical tracker totals: **45 complete, 357 needs-review, 1 source-conflict, 2 blocked, 649 pending audit**.

## 2026-09-30 fourth prestige 75-class source audit

- Green validation baseline #1486 at `e4e3023e84f731af7b2132ca165ba8fc437fba3b` (https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36674888539).
- Source-audited **75** additional pending records, **Epic Ranger (Epic Level Handbook) through Guardian Paramount**, in one atomic checkpoint using Exa plus source-faithful SRD/D&DTools/RealmsHelps and archived source references. Supabase remained unchanged.
- Epic Level Handbook **3.0** continuations remain independent from Dungeon Master's Guide v3.5 epic records; all duplicate-name source variants were kept separate.
- All 75 move from `pending_audit` to source-verified `needs-review`; none were promoted on source research alone.
- Canonical tracker totals: **45 complete, 432 needs-review, 1 source-conflict, 2 blocked, 574 pending audit**.

## 2026-09-30 fifth prestige 75-class source audit

- Green validation baseline #1487 at `bb1105c69ef8a06dd0c77c529df3b4c20fae9368` (https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36675880980).
- Source-audited **75** additional pending records, **Guild Thief through Kineticist**, in one atomic checkpoint using Tavily exact-page extraction plus Exa source-faithful recovery. Supabase remained unchanged.
- Same-name 3.0/3.5 and alternate-source variants remain independent; no class-name inheritance was used.
- All 75 move from `pending_audit` to source-verified `needs-review`; none were promoted on source research alone.
- Canonical tracker totals: **45 complete, 507 needs-review, 1 source-conflict, 2 blocked, 499 pending audit**.

## 2026-09-30 sixth prestige 75-class source audit

- Green validation baseline #1488 at `7bb335f3dcc27aa4d91e4db8384ba162e67a2755` (https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36676951770).
- Source-audited **75** additional pending records, **King/queen of the Wild through Menacing Brute**, in one atomic checkpoint using Tavily exact-page extraction plus Exa source-faithful recovery. Supabase remained unchanged.
- Same-name/source variants remain independent, especially Knight of the Chalice, Master of Shrouds and Meditant.
- All 75 move from `pending_audit` to source-verified `needs-review`; none were promoted on source research alone.
- Canonical tracker totals: **45 complete, 582 needs-review, 1 source-conflict, 2 blocked, 424 pending audit**.

## 2026-09-30 seventh prestige 75-class source audit

- Green validation baseline #1489 at `7e55323587f2dda045ff0e3a81919444fafd42b0` (https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36677934529).
- Source-audited **75** additional pending records, **Merchant Prince through Purifier of the Hallowed Doctrine**, in one atomic checkpoint using Tavily exact-page extraction plus Exa source-faithful recovery. Supabase remained unchanged.
- Duplicate/source variants remain independent, including Nightcloak and Order of the Bow Initiate.
- All 75 move from `pending_audit` to source-verified `needs-review`; none were promoted on source research alone.
- Canonical tracker totals: **45 complete, 657 needs-review, 1 source-conflict, 2 blocked, 349 pending audit**.


## 2026-10-01 3.5 Companion Engine checkpoint

- Verified code head: `324603885c0cbe9a4731e1a79fe7eafd6b4f9801`.
- Companion engine checks #18 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36821790956.
- Validate modernization #1518 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36821790949. The run included the complete
  3.5 class/feat/spell/item regressions, production build, general browser tests,
  edition-browser coverage, casting/setup, catalog/advancement, class spell access,
  and the specialized feature/resource/presentation/loading browser suites.
- Added a permanent source-locked 3.5 Companion Engine with persisted source
  ownership, effective-level contribution rules, progression, multiclass familiar
  stacking, deterministic derived statistics, lifecycle state, familiar master
  benefits, and a dedicated Companions character-sheet tab.
- Standard familiars, all four reviewed Dread Necromancer familiar choices,
  Paladin Heavy Warhorse/Warpony defaults, Unicorn, Wolf and Ape are backed by
  exact 3.5 records. Missing creature records fail closed rather than falling
  back to 5e data.
- Promoted six records whose remaining companion blocker is now resolved:
  Adept, Dread Necromancer, PHB v.3.5 Paladin, Eberron Paladin, Forgotten Realms
  Paladin, and Sandstorm Paladin.
- Healer remains needs-review only for its optional level-12+ alternative companion
  replacement flow. Ranger source records remain needs-review for complete
  source-locked legal-animal data and grouped-choice expansion. Hexblade/Sorcerer/
  Wizard records retain only their independent spells-known/spellbook blockers
  from this companion cluster.
- Exact reference pages were matched and researched for the full legal core
  animal-companion list and Healer alternatives, but incomplete parsed movement
  data is intentionally not bulk-imported.
- Canonical tracker totals: **51 complete, 651 needs-review, 1 source-conflict,
  2 blocked, 349 pending audit**.
- PR #8 remains draft/open/unmerged. No deployment or Supabase changes were made.


## 2026-10-01 3.5 Spell Acquisition Engine checkpoint

- Verified implementation head: `b0d613a22aaf56efe83f8f31696ce08f88bbc8c4`.
- Spell acquisition checks #58 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36921977364.
- Companion engine checks #83 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36921977553.
- Validate modernization #1583 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36921977372.
- Added source-owned 3.5 acquisition history and reconciliation for PHB/source-equivalent Sorcerers and Wizards plus Complete Warrior Hexblade, with exact class-level acquisition deltas, legal replacements, multiclass isolation, and preparation-preserving runtime synchronization.
- Wizard creation/level-up/campaign spellbook acquisition is structured separately from preparation. Campaign additions record source/provenance and explicit confirmation without simulating source-defined time, cost, checks, or scroll consumption.
- Reviewed feat learned-spell/spellbook grants resolve immediately, remain separate from access-only and feat-casting subsystems, preserve feat provenance, and clean up independently. Class-feature-selected feats now retain canonical acquisition metadata and block final save until required choices are resolved.
- Promoted exactly nine records whose final blocker was spell acquisition: Hexblade; four source-verified Sorcerer records; four source-verified Wizard records.
- Canonical tracker totals: **60 complete, 642 needs-review, 1 source-conflict, 2 blocked, 349 pending audit**.
- PR #8 remains draft/open/unmerged. No deployment or Supabase changes were made.

## 2026-10-01 3.5 Companion source-lock completion checkpoint

- Verified implementation head: `8d08de8c763b6c5559e605bf26626090db49e199`.
- Companion engine checks #89 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36930570641.
- Spell acquisition checks #64 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36930570489.
- Validate modernization #1589 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36930570642. It passed the full 3.5 class/feat/spell/item regressions, production build, general/edition/casting/catalog browser suites, class spell access, subclass/feat magic, domain/power/invocation/ritual, resource tracker, guided feature choice, level-up feat, fantasy presentation/dice, and production-loading checks.
- Source-locked companion coverage now includes every legal core Druid/Ranger animal-companion option plus all five Healer alternatives. The previous grouped light/heavy horse and Small/Medium viper entries are expanded into atomic choices, and every legal option points to an exact local 3.5 creature record.
- Ranger now uses a distinct source-faithful profile so the PHB aquatic-starting-list Crocodile exception is available at Ranger 4 while Druid retains Crocodile as its stronger alternative. All four source-equivalent Ranger records use that same verified behavior.
- Healer level 12+ now exposes Unicorn, Lammasu, Gynosphinx, Water Naga, Androsphinx, and Couatl with the source-defined effective-level adjustments. Later source-legal replacement is supported from the Companions tab after the campaign-time replacement condition is confirmed.
- Companion replacement changes the underlying persisted source choice instead of adding a conflicting duplicate; a new creature starts from its own source-derived HP/state and does not inherit the prior creature's HP or notes.
- Promoted exactly five records whose final companion blocker is now closed: Healer and Ranger from Player's Handbook v.3.5, Eberron Campaign Setting, Forgotten Realms Campaign Setting, and Sandstorm.
- Canonical tracker totals: **65 complete, 637 needs-review, 1 source-conflict, 2 blocked, 349 pending audit**.
- PR #8 remains draft/open/unmerged. No deployment or Supabase changes were made.

## 2026-10-01 Duskblade flexible spell-acquisition checkpoint

- Verified implementation head: `e5bdc37d14a5801195268017a5f2fecb45e9fcdb`.
- Spell acquisition checks #70 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36937080860.
- Companion engine checks #95 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36937080985.
- Validate modernization #1595 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36937080868. It passed the full 3.5 class/feat/spell/item regressions, production build, general/edition/casting/catalog browser suites, class spell access, subclass/feat magic, domain/power/invocation/ritual, resource tracker, guided feature choice, level-up feat, fantasy presentation/dice, and production-loading checks.
- Added a reusable `flex-known` acquisition profile for source classes whose spells known are gained as one spell of any currently castable level rather than from a fixed per-spell-level table.
- Duskblade level 1 now requires two 0-level spells, additional 0-level spells equal to the Intelligence bonus at acquisition time, and two 1st-level spells. Every later Duskblade class level requires one additional legal spell up to the current source-defined maximum spell level.
- Beginning at Duskblade 5 and at every later odd class level, the engine exposes one optional same-level replacement. The replaced spell level must be at least two levels below the highest spell level the Duskblade can cast at that class level.
- Acquisition events persist by exact class source and are not re-awarded after completion. Duskblade known spells materialize in the normal Spells section as spontaneous castable spells, retain multiclass ownership, and their acquisition history is archived/restored if the exact source class is removed and later re-added.
- Added engine regressions for start counts, flexible-level legality, replacement timing/limits, persistence, removal/restoration and a browser regression covering real Duskblade creation plus level-2 acquisition UI.
- Promoted exactly `classes/duskblade-102`; its documented final blocker was the persisted source-specific Spells Known/replacement workflow.
- Canonical tracker totals: **66 complete, 636 needs-review, 1 source-conflict, 2 blocked, 349 pending audit**.
- PR #8 remains draft/open/unmerged. No deployment or Supabase changes were made.

## 2026-10-01 Magewright mastered-repertoire and preparation checkpoint

- Verified implementation head: `faaa79b8150a361f397957ffb0f1746756acdd91`.
- Spell acquisition checks #75 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36941670234.
- Companion engine checks #100 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36941670267.
- Validate modernization #1600 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36941670249. It passed the full 3.5 class/feat/spell/item regressions, 5e item regressions, production build, every general/specialized browser suite, guided feature-choice coverage, level-up feat coverage, fantasy presentation/dice, and production-loading checks.
- Added a reusable `mastered-repertoire` acquisition profile for Magewright. At 1st level it records a number of mastered spells equal to the current Intelligence modifier; class levels 4, 8, 12, 16, and 20 create the source-defined mastery event using the current Intelligence modifier, with one additional 0-level spell on each post-1st event.
- Mastery selections are persisted by exact class source, enforce current maximum spell level and ability-score legality, prevent duplicate selections, and archive/restore with the exact source class. Guided creation and level-up both persist the structured `mastered` plus `bonusCantrips` payload.
- Magewright now uses the existing 3.5 per-slot preparation engine without being treated as a Wizard spellbook caster. Its mastered repertoire is the preparation pool, acquired runtime spells remain unprepared until placed into daily slots, and casting expends the prepared copy normally.
- The Spells management UI keeps Magewright repertoire ownership acquisition-controlled, so users cannot bypass Spell Mastery by freely adding class spells.
- Added engine, preparation, and end-to-end browser regressions covering trigger levels, Intelligence-scaled counts, illegal selections, persistence, source removal/restoration, creation, manual-add lockout, daily preparation, and casting.
- Promoted exactly `classes/magewright-1029`; its tracker-recorded Spell Mastery blocker and the independently audited preparation-mode gap are both closed.
- Canonical tracker totals: **67 complete, 635 needs-review, 1 source-conflict, 2 blocked, 349 pending audit**.
- PR #8 remains draft/open/unmerged. No deployment or Supabase changes were made.


## 2026-10-01 Favored Soul spell-acquisition and deity-weapon checkpoint

- Verified implementation head: `1ccbc5ad3d9a14b32ec66cf1c50c52838e06072e`.
- Spell acquisition checks #86 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36946352369.
- Companion engine checks #111 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36946352373.
- Validate modernization #1611 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36946352401. It passed the full 3.5 class/feat/spell/item regressions, 5e item regressions, production build, every general/specialized browser suite, guided feature-choice coverage, level-up feat coverage, fantasy presentation/dice, and production-loading checks.
- Added a shared `favored-soul-35` known-table acquisition profile for the reviewed Complete Divine record and its source-equivalent Miniatures Handbook appearance. It enforces the exact spells-known table, class-level deltas, spontaneous Cleric-list ownership, and the source's optional one-spell replacement at 4th level and every even Favored Soul level thereafter.
- Favored Soul acquisition validation now uses the class's reviewed Cleric-list relationship rather than requiring runtime spell rows to be labeled directly with Favored Soul. Wizard-only/non-Cleric choices fail closed.
- Favored Soul acquisition history is persisted by exact source class, materializes into the normal Spells section as spontaneous castable spells, archives on source removal, and restores compatible history when the same source class returns.
- The existing persisted Deity's favored weapon proficiency choice now drives Deity's Weapon Focus at 3rd level and Deity's Weapon Specialization at 12th level. If the exact linked feat is already owned, the source-defined alternative-feat exception falls back to the existing class feat-choice path.
- Added engine and browser regressions covering both source mappings, representative spells-known rows, starting 4/3 spell choices, Cleric-list legality, level-up deltas/replacement timing, removal/restoration, real character creation, persisted favored weapon, and the level-3 linked Weapon Focus flow.
- Promoted exactly `classes/favored-soul-7` and `classes/favored-soul-76`; their tracker-recorded spells-known/replacement and deity-favored-weapon blockers are closed.
- Canonical tracker totals: **69 complete, 633 needs-review, 1 source-conflict, 2 blocked, 349 pending audit**.
- PR #8 remains draft/open/unmerged. No deployment or Supabase changes were made.

## 2026-10-01 Unearthed Arcana generic Expert / Warrior base-save checkpoint

- Verified implementation head: `38932019ada42fe61c38647ae2a77c0b4040ab31`.
- Companion engine checks #128 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36956703851.
- Spell acquisition checks #103 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36956703874.
- Validate modernization #1628 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36956703858.
- Added one reusable generic-class save progression path. Unearthed Arcana Expert chooses two good saves and Warrior chooses one from Fortitude, Reflex, and Will. The exact source-owned choice persists in `featureChoices`.
- Generic `Good Save(s)` / `Poor Save(s)` progression columns now resolve through that persisted choice during creation, later levels, and multiclass recomputation. Classes with explicit Fortitude/Reflex/Will tables are unchanged.
- Regression coverage verifies level-1 and level-6 Expert/Warrior save math, exact-source multiclass accumulation, no repeated save prompt, persistence, and save/reopen behavior.
- The reviewed Class Skills prose no longer creates a redundant manual feature-choice prompt for these generic classes; their existing dynamic `classSkillRule` remains authoritative.
- Promoted exactly `classes/expert2-124` and `classes/warrior2-135`.
- Canonical tracker totals: **71 complete, 631 needs-review, 1 source-conflict, 2 blocked, 349 pending audit**.
- PR #8 remains draft/open/unmerged. No deployment or Supabase changes were made.

## 2026-10-02 shared Cleric deity / domain automation checkpoint

- Verified implementation head: `c39e0a6212d40b84a270a64c770e23fb45bf4485`.
- Companion engine checks #134 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36963537928.
- Spell acquisition checks #109 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36963537917.
- Validate modernization #1634 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36963537916.
- Added one shared 3.5 Cleric deity/domain engine rather than source-specific patches. The engine now owns all 22 SRD domain granted powers as structured data and materializes selected powers into source-owned features, actions, resources, class skills, training grants, and feats as appropriate.
- Added reviewed core-deity alignment/domain/favored-weapon metadata and optional deityless spiritual-focus support. Known deity selections constrain available domains and enforce the one-step alignment rule; deityless Clerics still use alignment-compatible domains.
- War domain now grants deity-favored-weapon proficiency and Weapon Focus against the selected deity's favored weapon. Knowledge and Trickery domain skills are represented as class skills; active/limited domain powers create the corresponding action/resource state.
- Cloistered Cleric automatically receives Knowledge in addition to two selected domains and receives its granted power/class-skill effects through the same shared engine.
- Class removal now also removes the source-owned `legacyCastingChoices` entry, preventing orphaned deity/domain state after multiclass removal.
- Direct browser coverage verifies a Player's Handbook Cleric selecting Pelor, deity-based domain filtering, Healing/Sun power descriptions, structured Greater Turning state, persisted deity/domain selections, and save/reopen behavior.
- Promoted exactly `classes/cleric-105`, `classes/cleric-39`, `classes/cleric-63`, `classes/cleric-91`, and `classes/cloistered-cleric-120`.
- Canonical tracker totals: **76 complete, 626 needs-review, 1 source-conflict, 2 blocked, 349 pending audit**.
- PR #8 remains draft/open/unmerged. No deployment or Supabase changes were made.


## 2026-10-02 shared source-selected option-mechanics checkpoint

- Verified implementation head: `4bb5627b0ffe44ac6518c1e3733be20caa42ff9f`.
- Companion engine checks #138 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36981723606.
- Spell acquisition checks #113 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36981723657.
- Validate modernization #1638 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/36981723586. It passed the full 3.5 class/feat/spell/item regressions, 5e item regressions, production build, and the complete browser suite.
- Added one reusable selected-option mechanics path rather than Dragon Shaman/Marshal-specific reconciliation branches. Persisted class choices can now materialize option-owned class skills, level-gated dependent features, actions/resources, and later-choice legal-option sets.
- Dragon Shaman now materializes all seven reviewed draconic-aura effects and all ten totem profiles. Totem selection drives the source class skills, breath shape/energy, 3rd-level adaptation, 9th-level immunity, and the legal Skill Focus choices at 2nd/8th/16th level. The final source recheck preserves the PHB II aura bonuses as untyped rather than borrowing Marshal's circumstance typing.
- Marshal now materializes all fifteen reviewed minor-aura effects and seven major-aura effects. Grant Move Action has structured daily-use scaling from 1/day at level 4 through 5/day at level 20 while remaining a standard action.
- Regression coverage verifies creation/level-up choice behavior, selected-effect materialization, class-skill integration, dependent Skill Focus eligibility, resource scaling, idempotence, exact-source removal cleanup, and Dragon Shaman/Marshal coexistence.
- Promoted exactly `classes/dragon-shaman-101` and `classes/marshal-78`.
- Canonical tracker totals: **78 complete, 624 needs-review, 1 source-conflict, 2 blocked, 349 pending audit**.
- PR #8 remains draft/open/unmerged. No deployment or Supabase changes were made.
## 2026-10-03 shared Spirit Shaman / Wu Jen casting checkpoint; Shugenja Void hold

- Verified implementation head: `4760b21fac6acac9e1e6b4ca3844de531ae3a84f`.
- Companion engine checks #167 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/37088797608.
- Spell acquisition checks #142 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/37088797618.
- Validate modernization #1667 passed: https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/37088797619. The full validation gate, production build, class/feat/spell/item regressions, and browser suites are green at the implementation head.
- Spirit Shaman now uses reusable daily-retrieval state over the reviewed Druid list. Creation records the exact retrieved repertoire, long-rest recovery retires the prior day's repertoire and reopens retrieval, and the Spells surface supports the next day's selection. Spirit Guide persists its source choice and grants Alertness; the reviewed source explicitly says the guide's chosen animal form grants no form-specific benefit.
- Wu Jen now reuses the shared spellbook engine for its complete starting spellbook, two free spells per new class level, preparation, and campaign copying. Spell Secret is a linked known-spell/permanent-metamagic choice, Elemental Mastery materializes reviewed element-specific caster-level/save mechanics, and Taboos materialize their daily spellcasting restriction.
- Shugenja's ordinary Air/Earth/Fire/Water paths are now fully structured and green: Order-driven Element Focus, fixed Order spells, favored/unrestricted known-spell quotas, prohibited elements, replacements, persistence, reconciliation, and browser coverage. It is intentionally **not** promoted because the exact source also permits an Ineffable Mystery Shugenja to specialize in Void, while the available source text does not define enough of that Void acquisition/quota mapping to implement without guessing. The remaining tracker blocker is narrowed to that exact source path.
- Promoted exactly `classes/spirit-shaman-9` and `classes/wu-jen-6`. `classes/shugenja-8` remains `needs-review` for the Void specialization only.
- Canonical tracker totals: **80 complete, 622 needs-review, 1 source-conflict, 2 blocked, 349 pending audit**.
- PR #8 remains draft/open/unmerged. No deployment or Supabase changes were made. The Void recheck used Exa and Tavily; no Firecrawl fallback was used.

