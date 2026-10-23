# Class and feat tools

The user wants an Archivist character's tools to follow the classes and feats actually selected, across eligible multiclass combinations, rather than a fixed build. They approved class tabs and clarified that a selected feat such as Mother Cyst must have its own tab and automatically grant its level-appropriate spells. Entomancer is outside this change.

## Design

Keep the existing Class tools entry and put independently selectable class and feat tabs inside it. Show every owned class and feat; use the existing implemented controls for supported mechanics and the saved rules/progression for other records. Tabs derive from current ownership, never a future build schedule. A feat's own tools do not require an unrelated class. Existing selection requirements and explicit table confirmations remain authoritative.

Archivist owns Dark Knowledge, Lore Mastery, Still Mind, the prayerbook, copying and Scribe Scroll. Psion (Telepath) owns manifesting, powers and its progression. Thrallherd owns follower capacity, arrival, losses and combat sheets. Mother Cyst owns its ten-spell chain, effects and targets. Psicrystal Affinity owns crystal controls. Graft Flesh owns graft projects. Reach, Chain, Cooperative Spell and Draconic Archivist each have their own rules/controls or links to the affected supported action. Other feat magic uses existing per-feat casting/choice controls. Rules-only records display their rules rather than invented effects.

Mother Cyst is independent of Archivist. Its spell access ceiling is min(9, ceil(total character level / 2)): spell tiers 1–9 unlock at character levels 1,3,5,7,9,11,13,15,17. This is the user's requested 5e conversion, not a claim about original 3.5 rules. Spell grants are derived, do not consume class spell choices or preparation places, and cannot duplicate on reload/level-up. Casting requires an available standard/Pact slot of sufficient level, the selected casting class/ability and existing effect confirmation. No free cast, slot, psion power or automatic future feat is added. Cyst damage/duration scaling uses total level; class-based features keep class-based progression. Select a valid spellcasting class for feat casting when needed.

Feat tabs and fresh grants disappear when their source is removed; spent resources and recorded effects/creatures/projects stay saved. Pending historical jobs remain visible and may be cancelled, but completing source-dependent work requires its source. Level-up, save/reopen, multiclassing, rest and tab switching preserve canonical spending and drafts. Shared Power Points and spell slots remain one pool with existing recovery.

## Implementation choices

Use React and the current rules libraries. Derive a small tool directory from class/feat identity, route existing panels by owner, and extract feat access/casting helpers instead of duplicating the character engine. Prefer stable catalog identity; retain a narrow migration path for older saved conversion feat names. Keep original 3.5 and 2024 rules separate. Do not modify the account, deploy or merge as part of implementation.

## Verification

Check Mother Cyst at every level 1–20 with no Archivist, mixed caster/noncaster and Pact builds; invalid feats/editions, removal/re-add, slot exhaustion, casting abilities, effect scaling, and save/reopen. Check each converted class/feat alone and together, absence of unowned controls, class progression and prerequisite enforcement. Browser checks cover feat selection, automatic tabs/spells, independent casting, follower/crystal/graft routing, retained drafts, keyboard navigation and phone layout. Run existing Archivist, shared spell/feat, and Entomancer regressions plus a production build.
