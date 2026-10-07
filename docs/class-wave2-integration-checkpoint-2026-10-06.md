# Action/resource wave 2 integration checkpoint

Development branch: `codex/class-integration-engine`; PR #8 remains draft and unmerged.

## Accounting

- Candidate manifest: all 63 exact IDs in `tests/class-actions-resources35-wave2.mjs`.
- Current upstream split (already present at `9c5d971`): 18 integration targets, 45 individually documented subsystem deferrals.
- This checkpoint wires and tests source metadata, progression, actions, resource formulas, fixed feats, choices, reconciliation, and removal for the 18 targets. **It does not certify those classes fully automated. No wave-2 tracker record is promoted.**
- Tracker reconciliation patch: 918 → 914 needs-review, applied by the narrowly scoped GitHub Actions job; confirm its successful run before treating this delta as published. Only four of the nine handoff IDs exist: Arcane Archer `378`, Dervish `309`, Frenzied Berserker `313`, Great Rift Deep Defender `792`. Their original successful CI is [37389875845](https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/37389875845), commit `dc748a6ae8557ecd357dccab661757d951a3d932`.
- Handoff IDs `ordained-champion-766`, `dragon-samurai-152`, `shadow-sun-ninja-537`, `bloodclaw-master-105`, and `fist-of-raziel-477` do not exist in this tracker. Same-name records were not substituted or promoted.
- Action/resource primary cohort after reconciliation: 207 tracked, 201 actionable after six protected exclusions.

## Evidence and implementation

Existing source-review packets and wave-2 feature metadata were reused. Targeted Exa discovery recovered missing requirement references; Tavily extracted the 18 exact source pages and their same-numeric-ID Mordaedil alternatives. Each override records those URLs. No Firecrawl call was needed.

The alternate requirements and class-skill tables restored omitted skills/feats/races/alignments and removed skills incorrectly harvested from armor-penalty prose. The source numeric IDs, books, and edition remain distinct. Patron-dependent Weapon Focus is visibly manual rather than incorrectly rejecting a weapon-specific feat. Cloud Anchorite's parenthetical unarmed-strike alias is normalized to the actual feat.

Generic progression parsing now consumes reviewed feature metadata and explicit aliases. Escalation modes share one resource. Explicitly reviewed qualified names are preserved. Prose-only grants require an explicit reviewed level. Source proficiency packages and proficiency choices reach the catalog. Zero-valued structured resources cannot acquire uses from descriptive prose. Feat choices use one choice per milestone, enforce exclusions including specialized variants, and cannot accept arbitrary values when a constrained list is empty. Wave-2 explicit feat lists require resolved references and prerequisite checks.

## Remaining completion gates for the 18 targets

These are implementation gaps, not newly completed classes. The original 45 deferrals remain in the authoritative regression manifest.

| Exact source ID | Remaining gate |
| --- | --- |
| classes/arcane-devotee-657 | Sacred Defense conditional saves, deity/caster-dependent Divine Synergy, and Divine Shroud spell-resistance scaling/effect application. |
| classes/argent-savant-224 | Force-spell attack/damage, armor, duration, dispel DC, reduction, and Unbind Force check/damage effects. |
| classes/cipher-adept-688 | Combat Instinct AC/initiative, hardness and critical-trigger effects, and weapon-specialized feat selection. |
| classes/cloud-anchorite-499 | Monk damage/AC stacking, terrain/armor/load-dependent movement/skills, breath/resistance effects, and Skill Focus constrained to a class skill. |
| classes/crimson-scourge-262 | Conditional Special Dispensation feat benefit, unarmed-target/nonlethal damage, pain immunities, and timed demoralize effects. |
| classes/divine-champion-661 | Patron restrictions, conditional Sacred Defense and smite, Divine Wrath timed modifiers, and specialized bonus feat choices. |
| classes/dread-fang-of-lolth-428 | Conditional save/precision/poison bonuses, shared ally bonus transfers, and multiclass Uncanny Dodge replacement. |
| classes/escalation-mage-467 | Mode-specific caster checks and failure costs, spell effects, Shade Within HP, and separate Soul of Shadow mode uses. |
| classes/eye-of-lolth-429 | Target study, ally transfer, precision damage, aura save DC, stealth conditions, and Vanish's one-minute reuse restriction. |
| classes/fatespinner-211 | Spending the shared spin pool on spell DC or rolls, triggered rerolls/stabilization, and Seal Fate's target/HD/save modifiers. |
| classes/fist-of-raziel-145 | Smite scaling/qualifiers and multiclass interaction, magic-circle effects, holy damage and nonstacking rules. |
| classes/forest-reeve-227 | Temporary weapon enhancement, selected rejuvenation spell effects, and inherited Woodland Stride/Swift Tracker alternate benefits. |
| classes/gnome-giant-slayer-314 | Giant-specific favored-enemy stacking, size/armor/flat-footed AC conditions, and movement/defensive-roll effects. |
| classes/nightcloak-971 | Darkness caster bonus, Intelligence saves, sight immunities, and spell/summon effect DCs and durations. |
| classes/stormtalon-746 | Flight/armor/load and natural-attack state, talon damage/attack sequencing, and aerial feat effects. |
| classes/sword-of-righteousness-155 | Full exalted-feat eligibility/effect coverage and paladin/monk multiclass-return behavior. |
| classes/thayan-knight-337 | Red-Wizard/visible-tattoo conditional saves and attacks, Final Stand target counts/duration/temp HP, and source feat effects. |
| classes/blade-bravo-726 | Armor/size/movement-dependent combat modifiers, precision/critical/riposte triggers, and specialized feat choices. |

## Verification boundary

Fresh local wave-2, metadata, core/martial, class integration, all-1054-class lifecycle, feature-choice and resource tests pass. The automation audit and tracker classifier pass. `npm test` was attempted; Windows sandbox process creation denied Vite/esbuild with `spawn EPERM`. Full modernization CI is required before declaring this checkpoint verified. A passing lifecycle test is not evidence that every class mechanic is automated.

Dragonstalker and Fist of the Forest remain needs-review. The qualified-name improvement is not, by itself, completion evidence for either class. No main/Pages deployment or Supabase change is included.
