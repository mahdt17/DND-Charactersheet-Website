# 3.5 Companion Engine Design

Date: 2026-09-30  
Repository: `mahdt17/DND-Charactersheet-Website`  
Branch: `codex/class-integration-engine`  
PR: #8 (keep draft, open, unmerged)  
Verified baseline: `3663b8c4a9b1f1614dbc32707934f13d691aea75`  
Baseline CI: Validate modernization #1490 — success

## Purpose

Build a permanent, generic D&D 3.5 companion subsystem that supports familiars, animal companions, special mounts, healer-style companions, unusual class familiars, and future class/prestige companion systems without adding class-by-class special-case engines.

The engine architecture should be complete now, while creature coverage and source-specific relationship adapters are populated incrementally as class verification progresses.

## Success Criteria

The first implementation is successful when:

1. Companion state is persisted independently from class feature descriptions.
2. Companion rules are implemented through a reusable engine rather than class-name conditionals.
3. Effective companion/master level, stacking, progression, source ownership, and lifecycle state recalculate deterministically.
4. Companion state survives save/reopen and class level changes.
5. Removing a granting class/source removes only source-owned companion state and preserves unrelated/manual character data.
6. Animal companions, familiars, special mounts, and class-specific companions can all use the same underlying engine.
7. The character sheet exposes a dedicated Companions area with derived statistics, progression, special abilities, status, and lifecycle controls.
8. Source-specific exceptions can be represented as data/configuration or narrow adapters.
9. The implementation is test-driven and existing 3.5 class-integration regressions remain green.
10. No Supabase schema/data/policy changes are required.

## Scope

### In scope for the engine foundation

- Generic persisted companion records.
- Relationship/progression types.
- Base-creature source references and companion-only 3.5 creature records.
- Derived companion statistics.
- Effective master/companion level calculation.
- Multiclass contribution and stacking rules.
- Alternative-companion level adjustments.
- Special ability progression.
- Current HP and status.
- Call/summon state where the source requires it.
- Death, dismissal, release, replacement restriction, and recovery state.
- Automatic recalculation on level-up or class removal.
- Source ownership.
- Dedicated Companions UI.
- Deterministic serialization and save/reopen support.
- Regression coverage for creation, advancement, persistence, lifecycle, and removal.

### Initial representative source cases

The first implementation should prove the architecture against:

- Wolf — standard Druid animal companion.
- Ape — alternative animal companion with level adjustment.
- Raven — standard familiar.
- Imp — Dread Necromancer unusual familiar.
- Heavy Warhorse / Warhorse — Paladin special mount.
- Unicorn — Healer companion.

These cases are intentionally chosen to exercise distinct relationship and progression behaviors.

### Not required before engine foundation is complete

- Full population of every 3.5 monster.
- Full population of every prestige-class companion.
- General-purpose monster/bestiary encounter management.
- NPC initiative/combat automation unrelated to companion rules.
- Supabase persistence changes.
- Merge or deployment.

## Architecture

### 1. Dedicated companion rules module

Introduce a focused module, expected to be `src/lib/companions35.js`, that owns companion behavior.

`classIntegration.js` may discover companion-granting class features, but companion progression, lifecycle, derived state, and stacking must live in the companion module.

Primary responsibilities:

- normalize companion relationship configuration;
- collect eligible class/source contributions;
- calculate effective master/companion level;
- select the proper progression profile;
- combine base creature data with progression adjustments;
- reconcile persisted companion records;
- expose lifecycle transitions;
- remove invalid source-owned records;
- return stable derived state for UI and tests.

### 2. Character state

Add a top-level character field:

```js
companions: [
  {
    id,
    name,
    baseCreatureId,
    relationshipType,
    progressionId,
    sourceClassIds,
    sourceFeatureIds,
    selectedByChoiceId,
    effectiveMasterLevel,
    levelAdjustment,
    effectiveCompanionLevel,
    baseStats,
    derivedStats,
    progression,
    specialAbilities,
    hp: { current, max },
    status,
    lifecycle,
    notes
  }
]
```

The exact shape may be refined during implementation, but these concepts must remain explicit.

Companion state must not be inferred solely from display text in `grantedFeatures`.

### 3. Relationship types

The initial engine must support at least:

- `animal-companion`
- `familiar`
- `special-mount`
- `class-companion`

A relationship type defines generic semantics while a progression profile defines numerical/special-ability growth.

Examples:

- Druid → animal companion, full Druid contribution.
- Ranger → animal companion, floor(Ranger level / 2).
- Wizard/Sorcerer/Adept → familiar, qualifying familiar-granting levels stack.
- Hexblade → familiar contribution based on class level minus 3.
- Dread Necromancer → familiar progression with source-specific exceptions.
- Paladin → special mount progression.
- Healer → class-companion progression.

### 4. Progression profiles

Progression data should be declarative where practical.

Initial profiles:

- Druid animal companion.
- Standard familiar.
- Paladin special mount.
- Healer companion.
- Dread Necromancer familiar adapter/exception layer.

Profiles expose level bands and derived adjustments such as:

- bonus HD;
- natural armor adjustment;
- Strength/Dexterity adjustment;
- Intelligence;
- bonus tricks;
- special abilities;
- spell resistance;
- source-specific call duration/resource rules.

### 5. Effective-level contributions

Each companion relationship must derive contributions from source-owned class levels rather than hard-coding a single class name into the engine.

A contribution record should be able to express rules such as:

- full class level;
- half class level, rounded down;
- class level minus N;
- source-specific fixed/alternate adjustments;
- stacking with other qualifying classes.

The familiar engine must support the 3.5 rule that qualifying familiar-granting class levels can stack while still enforcing one familiar at a time unless an explicit source overrides that rule.

### 6. Base creature catalog

Do not reuse the existing non-3.5 `src/data/monsters.json` as a source of 3.5 companion statistics.

Add a small source-locked 3.5 companion creature catalog populated only as needed. Each record should identify its exact 3.5 source/reference and include enough base statistics to derive the companion sheet.

Initial records should cover the representative cases above.

The catalog can grow incrementally as additional reviewed classes require new creatures.

### 7. Reconciliation

Add a companion reconciliation step to the existing character progression reconciliation path.

It must:

1. inspect class levels and reviewed class features;
2. identify companion-granting relationships;
3. preserve valid persisted selections/state;
4. recalculate effective levels and progression;
5. update derived stats without overwriting player-owned mutable state such as current HP/notes;
6. remove source-owned companions if their granting source disappears;
7. preserve unrelated companions and manual character data;
8. fail closed when an exact required choice/source rule is unresolved.

### 8. Lifecycle state

Lifecycle restrictions are game-state rules, not real-world timers.

The engine should represent statuses such as:

- active;
- dismissed/released;
- dead/lost;
- unavailable pending source-defined recovery;
- callable/not currently called.

A lifecycle record may include:

- reason;
- source rule text/reference;
- replacement condition type;
- replacement duration text;
- qualifying level-up reset where applicable;
- manual DM/player confirmation where an in-game duration has elapsed.

The application must not use wall-clock timers for “30 days,” “24 hours,” “year and a day,” or similar campaign-time requirements.

### 9. Companion UI

Add a dedicated `Companions` area to the character sheet.

Each companion card/detail view should be capable of showing:

- name and relationship type;
- granting class/source;
- effective master/companion level;
- current/max HP;
- AC;
- movement;
- ability scores;
- attacks;
- saves;
- relevant skills/feats where available;
- progression adjustments;
- special abilities;
- status and call state;
- lifecycle restrictions;
- notes;
- source information.

Controls should be limited to state the player is allowed to manage. Derived rules values should not become arbitrary editable fields.

### 10. Class integration strategy

Class-specific source blocks should describe how they connect to the engine rather than implementing a parallel subsystem.

For example:

```js
{
  relationshipType: 'animal-companion',
  progressionId: 'druid-animal-companion',
  contribution: { type: 'fraction', numerator: 1, denominator: 2 }
}
```

Source-specific exceptions should be narrow adapters/configuration.

Do not infer equivalence between same-name classes from different books unless the reviewed source explicitly supports inheritance/equivalence already represented by the repository.

## Initial Completion Targets

The companion engine should immediately target the mechanically mature `needs-review` records whose remaining blocker is companion state/lifecycle.

Primary expected direct-completion candidates:

- Adept.
- Dread Necromancer.
- Healer.
- Paladin — PHB 3.5.
- Paladin — Eberron Campaign Setting.
- Paladin — Forgotten Realms Campaign Setting.
- Paladin — Sandstorm.
- Ranger — PHB 3.5.
- Ranger — Eberron Campaign Setting.
- Ranger — Forgotten Realms Campaign Setting.
- Ranger — Sandstorm.

The engine should also materially narrow blockers for:

- Hexblade.
- Sorcerer source records.
- Wizard source records.

Those records must not be marked complete until their independent known-spell/spellbook blockers are also resolved.

## Research Strategy

Use exact source evidence already reviewed in the tracker where sufficient.

For missing companion details:

1. Exa for source discovery/corroboration.
2. Tavily exact-page extraction in batches.
3. Deterministic validation against expected class/monster identity.
4. Firecrawl only when Exa/Tavily cannot reliably retrieve the required page.

Do not use Context7 for D&D rules. Context7 is reserved for software/framework/library API uncertainty.

## Testing Strategy

Use test-driven development.

### Unit/integration coverage

Write failing tests before production changes for:

- companion record creation;
- Druid full-level animal companion progression;
- alternative companion level adjustment;
- Ranger half-level progression;
- standard familiar stacking;
- Hexblade reduced familiar contribution;
- Dread Necromancer familiar exceptions;
- Paladin special mount level bands;
- Healer companion level bands;
- HP preservation during recalculation;
- save/reopen;
- lifecycle transitions;
- source removal cleanup;
- multiclass source contribution changes;
- no cross-edition creature contamination.

### Browser coverage

Add focused browser regressions for:

- creation and companion selection;
- Companions UI visibility;
- level-up recalculation;
- save/reopen persistence;
- lifecycle/status controls;
- source removal.

### Checkpoint verification

During development, run focused companion/class-integration tests.

At the subsystem checkpoint, run the complete existing modernization validation/CI suite before updating tracker records to `complete`.

## Tracker Policy

Do not expand the `needs-review` queue merely to record source review.

For each class touched by this subsystem:

- promote to `complete` only when all known blockers are resolved and regressions pass;
- if independent blockers remain, replace generic companion notes with the narrower remaining blocker;
- record exact implementation evidence and CI run;
- preserve source-specific records independently.

## Constraints

- Keep PR #8 open, draft, and unmerged.
- Do not deploy.
- Do not modify Supabase.
- Preserve existing verified class behavior.
- Do not use 5e monster statistics for 3.5 companions.
- Do not silently invent missing source mechanics.
- Prefer reusable rule/configuration changes over one-off class checks.
