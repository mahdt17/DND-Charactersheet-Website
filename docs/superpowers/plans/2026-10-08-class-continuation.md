# Source-exact feat template continuation

This is the implementation ledger for the user's October 8 continuation request, executed through the GitHub connector on codex/class-integration-engine / draft PR #8. No merge, deployment, or Supabase changes.

## Design and boundaries

Extend the existing source-owned feat-choice flow. Reviewed choiceFeatTemplates metadata pairs an exact feat catalog ID with a finite list of legal subjects. Expand this into the existing picker options, preserve the canonical record plus featTemplateId / featSubject on the granted feat, and save a canonical snapshot with the persistent choice for offline repair. No class-ID logic or new choice UI is needed. Unknown templates and subjects fail closed.

Finite reviewed subject lists are supported by this increment. "Any weapon" still needs a source-complete weapon option provider; do not constrain Bayushi to an arbitrary short list merely to call it complete.

## Work

- [x] Inspect live HEAD 1687e3f; preserve existing PR and branch.
- [x] Confirm Ordinary9 registration RED in run 37726841095.
- [x] Register Ordinary9 (816ee345).
- [x] Diagnose name-only Remain Conscious test selecting 2420, while requested metadata explicitly uses 2421.
- [x] Pin requested ID and add all-level resource, reopen, level-up and removal tests (15cfa23).
- [x] Confirm resource period RED in run 37864869518; preserve period in all three generic derived-resource paths (493b713).
- [ ] Complete full modernization verification for this checkpoint.
- [x] Build live conservative exclusion union including later slices, summary data, source-review packets, candidate manifests and handoff blockers. Select 75 untouched records.
- [x] Add failing parameterized feat regression (477b43f), wired through existing npm test.
- [ ] Observe intended RED, implement exact template resolution and snapshots, then run full CI.
- [ ] Make subsequent candidate selection dynamically exclude all review/finalization files.
- [ ] Persist screening evidence and precise remaining blockers; do not promote unsupported classes.

## Rulings and source findings

- User explicitly requested feat ID dndtools:feats/remain-conscious-2421. Live catalog identifies it as Sword and Fist, p. 9; Masters of the Wild reprint is 2420, p. 25. Keep 2421 per the explicit instruction and make that distinction visible in the test. Do not claim it is the same-book feat.
- Ordinary9 conditionalMechanics are descriptive data. Existing derivation creates actions/resources/features but does not apply frenzy Strength/AC, damage triggers, fatigue, attack restrictions, or encounter limits to live combat state. Passing lifecycle CI alone must not mark this class complete.
- Bayushi source confirms Improved Critical with a weapon choice, Intelligence to initiative, conditional feint bonuses, and once-per-round Opportunist. Feat-template support alone does not complete those effects.
- Guild Thief source confirms Skill Focus in any class skill, Weapon Focus/Finesse, and hand-crossbow proficiency among mixed feat choices. It also needs actual skill/Leadership/uncanny-dodge behavior. Old dndtools.org class page is a placeholder; the new exact-ID page has mechanics.
- Justiciar of Taiia's existing source-choice planner already accepts reviewed proficiencyChoices for 3.5 prestige classes. The modern multiclassTrainingPlan manual fallback is not proof of a missing 3.5 choice path. Source has target-specific combat sense and loss-of-faith casting state; preserve these as blockers.
- Source references: https://dndtools.org/classes/masters-of-the-wild-a-guidebook-to-barbarians-druids-and-rangers--44/frenzied-berserker/ ; https://dndtools.org/classes/oriental-adventures--96/bayushi-deceiver/ ; https://new.dndtools.org/classes/guild-thief-514 ; https://new.dndtools.org/classes/justiciar-of-taiia-355 .
