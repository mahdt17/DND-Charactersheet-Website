# Application integration

## Storage and catalog loading

Canonical catalogs remain static JSON under `public/catalogs`; they are not
inserted into Supabase. `src/lib/catalog.js` loads categories on demand, caches
in-flight requests and normalized results, checks counts and unique source IDs,
and freezes canonical records. Failed fetches can be retried. Duplicate names
retain separate catalog identities. Legacy SRD data remains available.

The compendium, creation flow, spell and feat pickers, progression viewer,
inventory and level-up use the shared loader. Lists are paginated. Published
catalogs are not requested at application startup. Existing bundled SRD data
still makes the initial JavaScript bundle large; this work does not claim to
have completed bundle optimization.

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
state and notes. Temp HP supports grant (non-stacking), direct set, reduction and
clear. Damage consumes temp HP first; healing does not replenish it.

These fields use the existing character JSON storage and local/cloud adapter.
No Supabase schema or production-data migration is required or was performed.
Cloud behavior is adapter-tested; authenticated production round trips were not
performed in this integration pass.

## Validation and remaining work

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
- Class-specific multiclass proficiencies/resources and choice-dependent feat
  benefits require source review and sheet edits. Full mechanical automation is
  not complete.
- Mixed hit-die spending, subclass-specific automation and initial bundle-size
  improvements still need work before final application acceptance.
- Retain manual review for unsupported complex prestige prerequisites.

PR #4 remains open and unmerged by project instruction. The repair workflow did
not deploy automatically and did not modify Supabase.
