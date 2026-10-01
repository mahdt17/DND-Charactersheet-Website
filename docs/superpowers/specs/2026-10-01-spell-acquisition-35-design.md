# D&D 3.5 Spell Acquisition Engine Design

Date: 2026-10-01  
Repository: `mahdt17/DND-Charactersheet-Website`  
Branch: `codex/class-integration-engine`  
PR: #8 — keep open, draft, and unmerged  
Verified companion checkpoint: `a1016ed6a8a2a679ebce4e79da2bb4d59df12ef7`

## Purpose

Build a reusable D&D 3.5 spell-acquisition subsystem that determines which spells a character actually **owns** or **knows**, separately from:

1. whether a spell appears on the class's legal spell list;
2. whether the spell is currently prepared;
3. whether the character has an available spell slot and can cast it.

The first implementation must fully support Sorcerer, Wizard, and Hexblade acquisition rules and must integrate with the existing verified 3.5 casting, preparation, prohibited-school, spell-access, and multiclass systems rather than replacing them.

The architecture must be reusable for later 3.5 classes that use fixed spells-known tables, spellbooks, all-list-known behavior, or other source-specific acquisition models.

## Why This Exists

The existing 3.5 spell UI and casting engine already handle class spell lists, spell access, slots, casting, preparation, prohibited schools, special slots, multiclass slot ownership, and related rules.

The remaining blocker for several reviewed classes is earlier in the lifecycle: the site currently treats 3.5 spell management too manually. In practice it can expose a class spell list and let the user add spells, but it does not yet robustly distinguish:

- **Available** — legal for the class/source.
- **Acquired / known** — owned by this individual character.
- **Prepared** — currently prepared from the acquired set.
- **Castable now** — preparation/access/slot/resource rules permit use.

This subsystem owns the second layer only and provides clean inputs to the existing preparation/casting layers.

## Success Criteria

The first implementation is complete when:

1. Spell acquisition is persisted independently from display state and preparation state.
2. Sorcerer spells known are enforced by exact class level and spell level.
3. Sorcerer legal spell replacement is represented at the correct levels and cannot violate source restrictions.
4. Hexblade spells known are enforced by exact class level and spell level.
5. Hexblade legal spell replacement is represented only at 12th, 15th, and 18th class level and obeys source restrictions.
6. Wizard starting spellbook contents are generated correctly.
7. Wizard gains exactly two free spellbook additions at each new Wizard class level after 1st.
8. Additional Wizard spellbook acquisitions can be recorded separately as copied/researched/manual campaign acquisitions.
9. Wizard prohibited schools remain excluded from legal acquisition.
10. Preparation remains a separate layer: a Wizard may only prepare spells actually present in the spellbook, except source-defined exceptions such as read magic.
11. Class removal and class-level correction reconcile source-owned acquisition state without deleting unrelated/manual spell records.
12. Multiclass characters retain separate acquisition state per granting class.
13. Save/reopen preserves all valid acquisition provenance.
14. Existing casting/preparation/spell-access regressions remain green.
15. No Supabase changes are required.

## Source Rules

### Sorcerer

Source: `https://www.d20srd.org/srd/classes/sorcererWizard.htm`

Rules to model:

- A 1st-level Sorcerer begins knowing four 0-level spells and two 1st-level spells.
- Spells-known counts are fixed by the Sorcerer Spells Known table and are not increased by Charisma.
- New Sorcerer levels grant only the increase implied by the table.
- At Sorcerer level 4 and every even Sorcerer level thereafter, the character may replace at most one known spell.
- The replacement must be the same spell level as the removed spell.
- The replacement spell level must be at least two spell levels below the highest Sorcerer spell level the character can cast.
- The replacement decision occurs at the same time as new spells-known acquisition for that Sorcerer level.

### Hexblade

Source: `https://new.dndtools.org/classes/hexblade-19`

Rules to model:

- Hexblade has no spells known before class level 4.
- Spells-known counts are fixed by the Hexblade Spells Known table rather than Charisma.
- The source table contains first-use footnotes tied to having sufficient Charisma to cast a spell of that level; acquisition must respect the source's legal spell-level access rather than invent an unconditional known spell.
- At Hexblade levels 12, 15, and 18 the character may replace at most one known spell.
- Replacement must be same spell level.
- Replacement spell level must be at least two levels lower than the highest Hexblade spell level the character can cast.
- The replacement decision is made at the same time as new spells-known acquisition.

### Wizard

Sources:

- `https://www.d20srd.org/srd/classes/sorcererWizard.htm`
- `https://www.d20srd.org/srd/magicOverview/arcaneSpells.htm#addingSpellstoaWizardsSpellbook`

Rules to model:

- A 1st-level Wizard's spellbook contains all legal 0-level Wizard spells except prohibited-school spells.
- The starting spellbook also contains three selected 1st-level spells.
- It contains one additional selected 1st-level spell for each point of Intelligence bonus.
- At each new Wizard class level, the Wizard receives exactly two free spellbook additions.
- Those two free spells may be of any spell level the Wizard can cast at the new Wizard level.
- The free additions are not copied-spell acquisitions and do not require campaign cost/time/checks.
- Additional spells may be added from another spellbook or scroll during play.
- Copy/learn acquisition is campaign state. It requires a deciphered source, one day of study, a Spellcraft check of DC 15 + spell level, and cannot learn a prohibited-school spell.
- Failure prevents another attempt to learn/copy that same spell until the Wizard gains another rank in Spellcraft.
- Writing the understood spell into a spellbook takes 24 hours; campaign costs/space may be recorded but should not be silently deducted by the application unless the user explicitly confirms that action.
- Independent research is a distinct manual acquisition source.
- Wizard preparation operates only over spellbook-owned spells, except explicit source exceptions already handled by the casting/preparation layer.

## Architecture

### 1. New acquisition rules module

Create a dedicated module, expected at:

`src/lib/spellAcquisition35.js`

This module owns:

- acquisition profiles;
- class-level acquisition deltas;
- exact per-spell-level known limits;
- Wizard starting-spellbook requirements;
- legal replacement windows and validation;
- acquisition provenance;
- reconciliation of persisted acquisition state;
- conversion of validated acquisition state into the existing `char.spells` representation consumed by the casting UI.

It must not own spell slots, preparation slots, casting, spell effects, restricted slots, or class spell-list membership.

### 2. Acquisition profile types

Initial profile kinds:

- `known-table`
- `spellbook`

The architecture should allow later profiles such as:

- `all-list-known`
- `fixed-list-known`
- `prepared-from-list`
- `source-adapter`

without changing the persisted data model.

### 3. Class acquisition configuration

Reviewed class/source metadata should define acquisition behavior instead of adding class-name branches.

Examples:

```js
{
  acquisitionProfile: 'known-table',
  acquisitionTableId: 'sorcerer-35',
  replacementRuleId: 'sorcerer-even-level-replacement'
}
```

```js
{
  acquisitionProfile: 'spellbook',
  acquisitionTableId: 'wizard-35',
  initialSpellbookRuleId: 'wizard-starting-spellbook',
  levelUpGrantRuleId: 'wizard-two-free-spells'
}
```

```js
{
  acquisitionProfile: 'known-table',
  acquisitionTableId: 'hexblade-35',
  replacementRuleId: 'hexblade-12-15-18-replacement'
}
```

Source-equivalent Sorcerer/Wizard records may inherit reviewed profile metadata only where the repository already records/proves source inheritance. Same-name classes must not be merged merely by name.

### 4. Persisted character state

Add source-owned acquisition state under a top-level character field, expected to resemble:

```js
spellAcquisition35: {
  [classId]: {
    profileId,
    classLevel,
    acquisitions: [
      {
        id,
        spellKey,
        spellName,
        spellLevel,
        acquiredAtClassLevel,
        origin,
        sourceEventId,
        active,
        metadata
      }
    ],
    replacements: [
      {
        level,
        removedSpellKey,
        addedSpellKey,
        spellLevel,
        eventId
      }
    ],
    campaignEntries: [...]
  }
}
```

Exact field names may be refined, but the following concepts must remain explicit:

- granting/source class ID;
- spell identity;
- spell level;
- class level at acquisition;
- acquisition origin/provenance;
- replacement history;
- campaign-added Wizard entries;
- stable IDs for idempotent reconciliation.

### 5. Provenance

Initial acquisition origins:

- `starting`
- `level-up`
- `replacement`
- `wizard-free-level-up`
- `copied-spellbook`
- `copied-scroll`
- `independent-research`
- `feat`
- `manual-source`

Feat-granted magic must remain source-distinct from ordinary class acquisition.

The existing feat-spell subsystem remains authoritative for feats that directly grant their own spell casting/use, including feat-specific uses, ritual-only casting, or permission to spend normal spell slots.

The existing spell-access grant subsystem remains authoritative when a feat or feature merely adds a spell to a legal class list or otherwise permits access; this does **not** automatically make that spell known, place it in a spellbook, or consume a normal class acquisition quota.

When a feat explicitly says the character **learns an additional spell**, **knows an additional spell**, or **adds a spell to a spellbook**, the acquisition engine may create a source-owned acquisition with `origin: 'feat'`. That acquisition must also record whether the source says it counts against the class's normal spells-known/spellbook quota.

A feat-created acquisition should therefore carry semantics equivalent to:

```js
{
  origin: 'feat',
  sourceFeatId,
  sourceFeatName,
  affectsQuota: false,
  acquisitionEffect: 'known-spell' // or 'spellbook-entry'
}
```

If the feat is removed, only acquisition records owned by that feat are removed unless the same spell remains owned through another independent acquisition source.

### Immediate feat-resolution workflow

Feat-driven spell acquisition must resolve **during the same workflow that grants the feat**.

The application must inspect the feat's reviewed spell-grant semantics immediately after the feat is selected:

- If the feat says **learn / know an additional spell of the user's choice**, immediately open a filtered spell picker containing only legal choices from that feat. The feat-selection workflow is incomplete until all mandatory spell choices are resolved.
- If the feat says **add a specific named spell to your spellbook / spells known**, no picker is needed. The acquisition engine automatically creates the feat-owned acquisition and the spell appears in the normal Spells section immediately.
- If the feat says **add one spell of your choice to your spellbook**, immediately prompt for the legal choice, then create the feat-owned spellbook entry automatically.
- If the feat merely says **add a spell to your class spell list / gain access to a spell**, update spell access only. Do not automatically mark it known or place it in a spellbook.
- If the feat grants **one or more casts of a spell**, keep the spell in the existing feat-spell subsystem; do not create a class acquisition unless the source separately says the spell is learned/known/added to a spellbook.
- If the feat grants a **spell-like ability**, continue to represent that as an action/resource rather than an ordinary spell acquisition.

This behavior applies consistently during:
- initial character creation;
- level-up feat selection;
- later feat acquisition/editing workflows;
- any other UI that attaches a reviewed feat to the character.

A feat with unresolved mandatory spell-acquisition choices must expose an incomplete state and must not silently count as fully configured.

Feat spell-like abilities remain actions/resources and are not ordinary spell acquisitions.

Class feature grants that already use the existing spell-access subsystem must remain separate unless the source explicitly says they become ordinary known/spellbook spells.

### 6. Reconciliation

Provide a function such as:

`reconcileSpellAcquisition35(character)`

It must:

1. inspect the character's class levels and acquisition metadata;
2. determine required acquisition events from class level;
3. preserve valid historical selections;
4. identify missing required acquisition choices;
5. reject excess or illegal source-owned acquisitions;
6. preserve campaign/manual Wizard spellbook entries when Wizard level changes;
7. preserve unrelated spells belonging to other classes;
8. update the existing `char.spells` entries for valid acquired spells without duplicating them;
9. remove source-owned spell entries when their source acquisition no longer exists;
10. expose precise incomplete reasons to class integration/tracker validation;
11. never silently choose a spell on the player's behalf.

### 7. Acquisition events

The engine should expose events rather than raw numeric gaps.

Examples:

```js
{
  kind: 'choose-known-spells',
  classId,
  classLevel: 3,
  spellLevel: 1,
  count: 1
}
```

```js
{
  kind: 'optional-replacement',
  classId,
  classLevel: 6,
  eligibleSpellLevels: [0, 1],
  count: 1
}
```

```js
{
  kind: 'wizard-free-spellbook-additions',
  classId,
  classLevel: 5,
  count: 2,
  maxSpellLevel: 3
}
```

This event model is the primary interface for setup and level-up UI.

## Integration

### Guided character creation

For relevant 3.5 classes:

- Sorcerer creation must require the exact level-1 known spells.
- Wizard creation must automatically materialize legal 0-level spellbook entries and require the correct number of selected 1st-level spells based on Intelligence bonus.
- Hexblade creation at level 1 requires no spell choice.
- If a selected feat creates a mandatory learned/known/spellbook acquisition, the spell picker or automatic named-spell insertion must resolve before character creation can finish.

The creation flow must not expose arbitrary unlimited 3.5 spell selection for these classes once an acquisition profile is available.

### Level-up

Replace the current 3.5 `manual = Infinity` behavior for acquisition-profile classes.

On class level gain:

1. reconcile the pre-level state;
2. compute acquisition events at the target class level;
3. require all mandatory class new-spell events;
4. resolve any mandatory feat-created spell-acquisition choices produced by a feat selected during the same level-up flow;
5. offer but do not require a legal replacement event when the source permits one;
6. preserve unrelated spellbook/known state;
7. apply class, feat, and acquisition state atomically with the level-up result.

Multiclass level-up must use the class being advanced, not total character level, for acquisition rules.

### Spellbook / Manage Spells UI

The normal spell-management page should distinguish:

- known spells / spellbook-owned spells;
- prepared state;
- available-but-not-owned spells.

For Sorcerer/Hexblade:

- ordinary manual add/remove of class-acquired spells should be disabled except through legal correction/replacement flows;
- feat-origin acquisitions that explicitly teach an additional spell remain visible as separately sourced known spells and do not consume the ordinary known-spell quota unless their source says otherwise;
- feat casting that does not teach a spell remains in the existing Feat Spellbook and is not copied into class acquisition state.

For Wizard:

- preparation continues to operate on spellbook-owned spells;
- campaign acquisition gets a dedicated action such as "Add spell to spellbook";
- the user chooses provenance (other spellbook, scroll, research/manual);
- the UI records source/process metadata;
- prohibited-school spells cannot be added;
- time/cost/check requirements are surfaced clearly;
- the application does not claim that a check, cost, or campaign-time requirement occurred unless the user confirms it.

### Existing spell representation

The existing `char.spells` collection remains the runtime spell list consumed by casting/preparation UI.

Acquisition state becomes the authoritative provenance/ownership source for acquisition-profile classes, while `char.spells` remains a derived/runtime representation.

Synchronization must be deterministic and idempotent:
- every active acquisition produces at most one runtime spell entry for its source class;
- runtime spell removal must not erase acquisition history unless the corresponding acquisition event is explicitly removed/corrected;
- preparation flags live on the runtime spell entry and must survive reconciliation when the acquisition remains valid;
- reconciliation must never duplicate a spell because it is both present in `char.spells` and represented in acquisition state.

Avoid a wholesale migration of unrelated modern-edition spell data.

## Wizard Details

### Starting spellbook

At Wizard 1:

- automatically acquire all legal Wizard 0-level spells;
- exclude prohibited schools;
- require 3 + Intelligence modifier selected 1st-level spells;
- minimum extra from Intelligence bonus is zero;
- the chosen spells must be legal Wizard spells and not prohibited;
- each record is marked `starting`.

### Level-up grants

For each Wizard class level gained after 1:

- create one acquisition event requiring exactly two new spellbook additions;
- choices may span any legal spell levels currently castable by that Wizard level;
- prohibited schools remain excluded;
- each record is marked `wizard-free-level-up`.

### Campaign acquisition

A campaign-added spellbook entry must capture enough state to distinguish:

- copied from another spellbook;
- copied from a scroll;
- independently researched/manual;
- whether the acquisition process was confirmed complete.

The engine should support recording source notes without forcing the app to simulate the campaign's economy or passage of time.

## Sorcerer Details

Store exact per-spell-level known limits rather than only a total known-spell count.

At each Sorcerer class level:

- compare the current and previous source table row;
- generate mandatory acquisition events only for positive per-level deltas;
- no event is generated where a count remains unchanged.

Optional replacement events occur at Sorcerer level 4 and every even Sorcerer level after that.

Replacement validator:

- exactly one removal and one addition;
- same spell level;
- new spell is legal for Sorcerer;
- new spell is not already known;
- replacement spell level is at least two below the highest Sorcerer spell level castable at the new class level.

## Hexblade Details

Store exact per-spell-level known limits from the reviewed Hexblade source table.

At each Hexblade class level:

- generate only positive per-level acquisition deltas;
- do not create known-spell events before level 4;
- apply source ability/spell-level availability restrictions where the table footnote requires sufficient Charisma.

Optional replacement events occur only at 12, 15, and 18.

Replacement validator matches the source rule:

- one spell maximum;
- same spell level;
- new spell legal for Hexblade;
- new spell not already known;
- exchanged level at least two levels below highest Hexblade spell level castable at that level.

## Editing and Corrections

A character editor still needs a correction path.

Corrections must be explicit:

- "Correct acquisition history" or similar mode;
- warnings that this bypasses ordinary level-up provenance;
- no silent mutation of historical spell ownership;
- result remains source-owned and reconcilable.

This is different from campaign Wizard acquisition.

## Class Removal and Multiclassing

- Acquisition state is keyed by exact class/source ID.
- Removing a class removes only source-owned acquisition records for that class.
- Wizard copied/researched spellbook entries remain attached to that exact Wizard acquisition profile while the class exists.
- If that Wizard class is removed, its acquisition record remains persisted with `active: false` and `orphaned: true`; its source-owned runtime `char.spells` entries are removed from active casting/preparation views, but the acquisition history is preserved for correction/re-adding the class.
- Re-adding the same exact Wizard source record may reactivate compatible preserved acquisition history after normal legality reconciliation; it must not silently reactivate illegal or prohibited-school entries.
- Spells granted by feats, domains, subclasses, other classes, or custom spell-access grants must remain intact.
- Two spellcasting classes that can legally access the same spell may each own their own acquisition record; runtime spell display may coalesce only if provenance remains recoverable.

## Error Handling

Fail closed when:

- source progression row is missing;
- spell level cannot be determined;
- class spell membership cannot be verified;
- a replacement violates level rules;
- a Wizard choice is from a prohibited school;
- source-equivalence metadata is absent.

Do not silently repair acquisition history by inventing a legal spell.

Expose precise incomplete reasons through class integration.

## Out of Scope for First Implementation

- Simulating gold payment automatically.
- Automatically consuming scrolls when a Wizard copies from one.
- Simulating 24 hours / one day of campaign time.
- Automatic Spellcraft rolling and pass/fail persistence unless the user deliberately uses such a control.
- Independent custom-spell design.
- Every 3.5 caster acquisition model.
- Prestige-class "+1 existing spellcasting class" advancement; that remains a separate casting-advancement subsystem unless already resolved elsewhere.
- Supabase changes.
- Deployment or merge.

## Testing Strategy

Use TDD.

### Unit tests

Cover:

- Sorcerer exact spells-known table at representative levels;
- Sorcerer per-level delta calculation;
- Sorcerer replacement availability at 4/even levels and rejection at odd levels;
- same-level/two-level-below restriction;
- Hexblade zero acquisition before 4;
- Hexblade exact known counts and deltas;
- Hexblade replacement only at 12/15/18;
- Wizard starting cantrip population and prohibited-school exclusion;
- Wizard starting 1st-level choice count from Intelligence bonus;
- Wizard two-free-spells-per-Wizard-level events;
- Wizard campaign acquisition provenance;
- save/reopen reconciliation;
- source class removal;
- multiclass isolation;
- duplicate spell identity handling;
- feat spells that grant their own casting remain in the feat-spell subsystem;
- feat access-only grants do not become acquired spells;
- feat-origin learned/known/spellbook spells can be recorded separately without consuming normal class quota unless the feat says they do;
- removing a feat removes only the acquisition records it owns;
- feature/domain/other spell grants remain untouched.

### Browser tests

Cover:

- level-1 Sorcerer creation with exact mandatory choices;
- Sorcerer level-up with new known spell;
- Sorcerer optional replacement;
- Wizard creation with specialization/prohibited schools and correct starting book;
- Wizard level-up with exactly two free book additions;
- Wizard prepare/unprepare only among spellbook-owned spells;
- Wizard campaign "add to spellbook" flow;
- Hexblade reaching 4 and selecting its first known spells;
- Hexblade level 12 optional replacement;
- feat selection that says "learn an additional spell" immediately prompts for the required spell and blocks completion until resolved;
- feat selection that says "add this spell to your spellbook" automatically inserts the named spell without a second manual spell-management step;
- access-only feat grants do not become acquired spells;
- removing a feat removes only the feat-owned acquisition when no other independent source owns that spell;
- save/reopen;
- multiclass class switching;
- class removal/correction.

### Regression gate

At subsystem checkpoint:

- acquisition-focused tests;
- existing casting/preparation tests;
- class integration;
- spell access;
- multiclass casting;
- full 3.5 spell regressions;
- production build;
- all existing browser workflows;
- Validate modernization CI.

No affected class is promoted until full validation succeeds.

## Tracker Impact

Primary completion targets:

- `classes/hexblade-19`
- `classes/sorcerer-98`
- `classes/sorcerer-46`
- `classes/sorcerer-70`
- `classes/sorcerer-109`
- `classes/wizard-99`
- `classes/wizard-47`
- `classes/wizard-71`
- `classes/wizard-110`

Promotion is conditional on each source record having no independent blockers after acquisition is implemented.

Do not reopen the already-resolved companion blocker for these records.

## Constraints

- Keep PR #8 open, draft, and unmerged.
- Do not deploy.
- Do not modify Supabase.
- Preserve modern-edition behavior.
- Preserve the verified 3.5 casting/preparation/companion systems.
- Keep source-specific same-name classes distinct unless existing verified inheritance proves equivalence.
- Do not fabricate source progression values.
- Do not treat legal spell-list membership as proof of acquisition.
- Do not treat acquisition as preparation.
- Do not treat preparation as current castability.
- Do not collapse feat spell casting, feat spell access, and feat spell acquisition into one behavior; preserve their separate existing subsystems and source ownership.
