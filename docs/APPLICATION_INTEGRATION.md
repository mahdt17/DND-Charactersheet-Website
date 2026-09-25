# Application integration

## Storage and catalog loading

Canonical catalogs remain static JSON under `public/catalogs`; they are not
inserted into Supabase. `src/lib/catalog.js` loads categories on demand, caches
in-flight requests and normalized results, checks counts and unique source IDs,
and freezes canonical records. Failed fetches can be retried. Duplicate names
retain separate catalog identities. Legacy SRD data remains available.

The compendium, creation flow, spell and feat pickers, progression viewer,
inventory and level-up use the shared loader. Lists are paginated. Published
catalogs are not requested at application startup. The ledger and bundled rule engine now load only after entering the app; the
sign-in screen no longer downloads the character catalogs first. Bundled SRD
data still makes the ledger chunk large; further per-category splitting remains
an optimization opportunity. A loading state and reload action cover entry failures.

Site-shell contamination is still rejected defensively and remains covered by
fixtures, but the production Wikidot catalogs have now been source-grounded,
independently audited, and promoted. The repaired production state is **zero
damaged effects** across the 574 spells, 199 feats, and 830 items that were
affected. Duplicate names retain separate source/catalog identities and the spell
picker disambiguates same-name/same-edition choices instead of collapsing them.
See `ENRICHMENT_STATUS.md` for the audit and promotion evidence.

## Character classes and compatibility

`classLevels` contains `{catalogId, name, edition, level, definition, subclass}`
rows. `level` remains total character level; `className` and `classDefinition`
retain the primary class for older consumers. Old single-class saves normalize
without deleting their fields. Individual class models drive progression,
feature lists and spell-selection limits. Untagged legacy spells belong to the
primary class; new choices use `castingClassId`.

Level Up offers continuing an existing class, adding a normal class, and entering
a qualifying prestige class. Normal editions enforce edition boundaries. Custom
permits cross-edition classes but still routes prestige classes through their
requirements. Structured ability/BAB/skill/feat/race/alignment checks are evaluated
where supported; unresolved text requires visible manual confirmation. An unmet
automatic check cannot be overridden by that confirmation. Unknown requirements
are not considered satisfied. Advancement keeps total and individual levels
separate, applies HP gains and known 3.5 BAB/save progression differences.

## Personal edits

Creation includes feat search, source details, prerequisite review, removal and
replacement before finalization. Personal progression tables and HTTPS reference
image links are stored under character `contentOverrides`, keyed by canonical
ID, and can be reverted. Image bytes are not embedded or uploaded. Table edits
are display overrides and do not recalculate rules automatically.

Inventory stores an owned copy with its canonical identity, quantity, equipped
state and notes. Temp HP controls are always visible beside HP, with their own
adjustment amount. They support grant (non-stacking), direct set, reduction and
clear. Damage consumes temp HP first; healing does not replenish it.

These fields use the existing character JSON storage and local/cloud adapter.
No Supabase schema or production-data migration is required or was performed.
Cloud behavior is adapter-tested; authenticated production round trips were not
performed in this integration pass.

## Validation and remaining work

### Multiclass proficiency follow-up

Adding a core class within 2014 or 2024 rules now grants that edition's listed
multiclass armor, weapon and tool training. Bard, Ranger and Rogue require an
untrained skill choice; Bard also requires a musical instrument. These choices
must be complete before continuing. Continuing an existing class grants no
additional entry proficiencies. Saving-throw proficiency and equipment are
preserved.

`src/lib/training.js` contains the reviewed core profiles and class skill lists.
This avoids imported multiclass choice omissions: 2014 Ranger must include
Investigation, 2014 Rogue must include Performance, and 2024 Bard can choose any
skill. Revised Rogue excludes Performance. Guided setup uses the same corrected
class skill lists. The source catalogs are unchanged.
Unsupported, Homebrew, prestige and Custom combinations retain explicit manual
review rather than inheriting a named core class's entry package.

`trainingGrants` stores class attribution and selected proficiencies. New skills
merge into `skillProf`; existing skills, expertise and notes survive. Fixed core
grants can also be derived for older multiclass saves; missing historical skill
or instrument choices are not invented. If all listed choices are already
trained, the player can continue without receiving a duplicate benefit.

Weapon attacks now include multiclass weapon training and edition-specific
starting weapon traits. On the Traits tab, players can inspect multiclass
grants, record training notes, and override or restore proficiency for equipped
weapons. These overrides use `weaponTrainingOverrides` and persist with the
character. Armor-use penalties and general tool-roll automation remain manual.
Supported subclass and Expertise choices are covered below.

Rules references:
- [2014 multiclass proficiency table](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/customization-options#Proficiencies)
- [2014 class skill lists](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes)
- [2024 class traits and multiclass grants](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes)

`tests/multiclass-training.mjs` covers all 24 core entry profiles, choice bounds,
class-specific lists, repeat prevention, preservation of existing training,
weapon eligibility and manual combinations. Browser integration tests cover
required choices, saved skill/tool grants, weapon attack bonuses, overrides and
canceling a partially completed Bard choice.

### Multiclass hit-die follow-up

The rest dialog tracks hit dice by class, using each class's die size and level.
Players can roll one die at a time, spend a selected batch, or rest without
spending any. Constitution applies to each successful die roll, with a minimum
of zero healing; a failed roll never consumes a die. The total is mirrored in
`hitDiceUsed` for older consumers, while `hitDiceUsedByClass` preserves the pool
allocation across saves and level advancement.

2014 long rests let players choose which spent dice to recover, up to half their
total dice rounded down (minimum one). Revised 2024 long rests recover all spent
dice. Ordinary/Pact slot recovery is unchanged. The 3.5 rest path still uses its
existing natural-healing rules.

Old single-class saves migrate automatically. Older mixed-die saves recorded
only a total, so the rest dialog shows a provisional assignment in class order
and requires review before spending or recovering dice. Players can correct the
spent counts directly. Missing source die sizes never inherit the primary
class's die and cannot be rolled automatically.

Rules references:
- [2014 Basic Rules: Resting](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/adventuring#Resting)
- [2014 Basic Rules: Multiclass Hit Dice](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/customization-options#HitPointsandHitDice)
- [2024 Basic Rules: Long Rest](https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#LongRest)

`tests/hit-dice.mjs` covers mixed pools, expenditure bounds, healing, recovery
choices, failed rolls, old saves and advancement. Browser tests exercise both
editions, sequential rolls, saves, recovery limits and the older-save review.

### Multiclass casting follow-up

Core 2014/2024 multiclass characters now calculate shared Spellcasting slots from
individual class levels. A character with only one Spellcasting class retains
that class's normal slot progression. Paladin/Ranger contributions use the
edition's rounding rule; higher shared slots do not grant higher-level spells
to an individual class. See `src/lib/multiclassCasting.js`.

Pact Magic remains a separate pool, tracked by `pactSlotsUsed`. The cast dialog
can spend either an ordinary or Pact slot of sufficient level. Short rests reset
Pact expenditure while retaining ordinary expenditure; long rests reset both.
Adding a second class to an old single-class Warlock moves existing expenditure
to the Pact pool rather than granting unused slots. Each class may store its own
casting-ability override without affecting other classes.

Existing `slotOverride` arrays keep their meaning as a manually managed combined
pool. Users may revert to calculated slots without clearing expenditure. Custom,
prestige, Artificer and unsupported spellcasting subclass combinations continue
to require explicit source-based configuration.

Rules references:
- [2014 Basic Rules: Multiclassing](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/customization-options)
- [2024 Basic Rules: Creating a Character / Multiclassing](https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character)

`tests/multiclass-casting.mjs` checks slot progression, per-class selection limits,
Pact spending/recovery, legacy migration, ability overrides and alternative ability
prerequisites. The integration browser suite exercises both editions, including
Fighter-to-Rogue advancement, independent casting abilities, both slot pools,
rest recovery and personal slot overrides.

`tests/integration-foundation.mjs` covers all 12,891 promoted records, caching,
counts, identities, immutability, contamination, legacy migration, class branching,
prerequisites, overrides, owned items and temp HP. `tests/browser-integration.mjs`
covers visible HP controls, Archivist-to-Fighter branching, blocked/qualified
prestige entry, Custom branching, progression editing/reverting and inventory.
Both run in modernization CI alongside the existing suites. The data gate remains
strict even while application tests pass.

The Wikidot integrity-repair release gate is complete. Remaining broader
application limitations are separate from that repaired data release:

- Prestige caster advancement, Artificer, unsupported spellcasting subclasses
  and cross-edition conversions still need explicit manual slot configuration.
- Unsupported class resources, subclass training and choice-dependent
  feat benefits require source review and sheet edits. Unsupported multiclass
  proficiency packages remain manual. Full mechanical automation is not complete.
- Broader subclass/feat automation remains source-specific. The deferred ledger
  chunk can be split further to improve loading after sign-in.
- Retain manual review for unsupported complex prestige prerequisites.

PR #4 remains open and unmerged by project instruction. The repair workflow did
not deploy automatically and did not modify Supabase.


## Class resources and recovery

Supported 2014/2024 core counters derive capacity from each class's level:
Rage, Bardic Inspiration (effective Charisma), Wild Shape, Second Wind,
Action Surge, Indomitable, Ki/Focus Points, Lay on Hands, Sorcery Points,
Channel Divinity, and 2024 Ranger free Hunter's Mark casts. The 2014 Cleric/
Paladin Channel Divinity pool is shared; the 2024 class pools are separate.
Level-20 2014 Rage/Wild Shape display unlimited uses.

Counters retain expenditure through progression, ability changes, import and
reopening. Existing named manual counters retain their values and recovery rules
until explicitly adopted. Editing an automatic counter makes a personal override;
reverting restores class progression without refunding spent uses. Removal persists
and removed class counters can be restored. Custom counters support full, partial,
or manual recovery and spending/restoring several points at once.

Rest recovery respects the edition, including partial short-rest recovery in 2024.
2014 Ki requires the meditation checkbox on either rest. 2024 Sorcerous Restoration
is optional and tracked once per long rest; 2014 Sorcerer 20 recovers four points per
short rest. Long rests re-enable the optional restoration. Unsupported classes receive no inferred counters. Homebrew, Custom and
cross-edition class combinations receive no inferred new counters.

This automates counters, not feature effects. Subclass counters, Arcane Recovery,
initiative triggers, spell-slot conversions and other unlisted features remain
manual. Ranger free-cast counters do not automatically cast or prepare the spell.

Rules references:
- [2014 Basic Rules: Classes](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes)
- [2014 Basic Rules: Multiclassing](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/customization-options)
- [2024 Basic Rules: Character Classes](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes)

`tests/resources.mjs` checks progression levels, shared/separate pools, unlimited
uses, recovery, legacy manual counters, overrides and expenditure preservation.
`tests/browser-resources.mjs` checks both editions through visible controls, saved
state, adoption, custom counters, rest dialogs and mobile layout. Both run in CI.


## Guided class feature choices

Creation review and level-up now collect supported feature choices before saving:
2014/2024 Rogue and Bard Expertise, 2024 Ranger Expertise/Deft Explorer, and 2024
Wizard Scholar. Only eligible proficiencies appear; already expert selections and
duplicates are excluded. 2014 Rogue can choose thieves' tools. Existing skills,
expertise and manual adjustments survive, and past choices are never invented for
older saves. Only newly reached class milestones are prompted during advancement.

College of Lore grants three chosen skills in both editions, available before
same-level Expertise selection. 2014 Life Domain grants heavy-armor training.
Multiclass Rogue/Druid languages, the 2024 Rogue language choice, Ranger Deft
Explorer languages, and 2014 Draconic Bloodline's language are also recorded.
Other subclass features still use their source descriptions and manual controls.
Selections retain class/level attribution in `featureChoices`, visible on Traits;
thieves' tools Expertise is stored separately in `toolExpertise`.

Level-up remains uncommitted until its final feature review is accepted. Returning
to the level review retains its earlier choices. Creation blocks incomplete or
invalid feature selections and allows correction before the character is saved.

The desktop navigation can now be collapsed using the same visible menu button
that opens mobile navigation. Temporary HP is directly editable on desktop and
mobile; its independent adjustment does not change the damage/healing amount.

Validation: `tests/feature-choices.mjs`, `tests/browser-feature-choices.mjs`, and
updated integration/edition browser suites cover milestones, invalid/duplicate
choices, grants, saving, skill bonuses, desktop navigation and temp HP persistence.
Rules sources: the 2014 and 2024 Basic Rules class pages linked above.


`tests/browser-loading.mjs` validates the built production site, keeps the entry
script below 500 kB, confirms deferred ledger/catalog requests, checks demo
exit/re-entry, and simulates a failed ledger chunk to verify visible recovery.
The measured entry script is approximately 381 kB (109 kB compressed), down from
5.5 MB (1.06 MB compressed). The deferred ledger chunk is still about 5.1 MB.


## Level-up feat selection

Both 2014 and revised level-up wizards use the edition-filtered feat catalog,
including source descriptions, prerequisites and explicit review of unresolved
requirements. A feat choice holds one new selection; it can be removed or replaced
before final review while existing feats remain untouched. Source identity,
prerequisites, confirmations and total character level are retained on the saved
feat. Returning from review preserves the selection; cancelling saves nothing.
3.5 and Custom advancement retain optional, table-reviewed feat selection.

Revised structured minimum levels and alternative ability requirements are now
checked directly. Known unmet requirements cannot be overridden by confirmation;
named features and other unsupported requirements remain explicit source review.
Final saving revalidates eligibility against the character without the new feat.
Custom free-text feats require an eligibility review in level-up. Ability increases
and other choice-dependent feat benefits still require manual sheet adjustments.

`tests/feat-selection.mjs` covers eligibility and prerequisite immutability.
`tests/browser-feat-selection.mjs` checks both 5e editions, rejection, replacement,
review/back navigation, preserved existing feats, source metadata, total acquired
level, saved/reopened characters and mobile layout. The production loading test
reuses its browser context to support CI Chromium's single-process mode while
retaining the failed-chunk recovery assertion.
