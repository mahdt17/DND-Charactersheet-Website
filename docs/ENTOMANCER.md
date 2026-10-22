# Entomancer implementation

## Swarm resource dashboard

Population has one primary control inside the Swarm panel, with an available/maximum count, accessible meter, visible short/long-rest recovery rules, and a direct rest shortcut. Manual spending/restoring stays in a collapsed section and uses the same source-owned reserve as abilities and refunds. Other counters remain under a separate collapsed section; editing or removing those counters preserves Population expenditure.

The ability picker shows Population costs, including variable costs and level-dependent Corpse Jacker costs. Limited-use abilities display their saved availability and reset requirements. Active effects use readable names and show remaining rounds; controlled creatures, target conditions, setup/rulings and elapsed-time/history controls remain available. On narrow screens, ability selection and target fields stack vertically.

The cleanup preserves class calculations, source rulings, saved values and action execution. Browser regression `tests/browser-entomancer-resources.mjs` checks spending, armor refunds, manual adjustments, fed recovery, once-per-rest states, zero-cost actions, editing other counters, persistence and mobile layout. It runs with the full Entomancer browser suite or `npm run test:browser:entomancer-resources`.

Source: [Dandwiki Entomancer](https://www.dandwiki.com/wiki/Entomancer_(5e_Class)), reviewed 2026-10-15. This is an explicitly identified **2014 homebrew** class, separate from official classes and the 1,054-record D&D 3.5 audit.

## Supported play

- Levels 1–20, creation and advancement choices, d8 hit dice, starting equipment, proficiencies, ASIs and multiclass prerequisites.
- Constitution spellcasting, Druid spell access, half-caster multiclass slots, proficiency-based cantrips, Population-based preparation capacity, and saved one-hour spell exchanges.
- One source-owned Population reserve shared by the tracker and abilities. Spending survives reload, level changes and imported resource IDs. Fed rests, short-rest recovery, one-shot refunds and Hungry Mouths recovery use the same reserve.
- Base-class attacks, infestation, detection, temporary armor, adaptations, psychic defenses, foraging, Swarm Form and Apex Predator. Effects have explicit game-time controls and saved target records.
- **Decomposers:** extra necrotic spell dice, resistance, controlled zombies, decomposition and recovery, death prevention, Corpse Eater healing and improved Corpse Jacker.
- **Endo-Gotas:** grapple bonuses, latch state, Hemo damage/healing, Neuro Toxin saves and paralysis, repeat turn triggers, and one-cost multi-target Pure Terror.
- **Exo-Gotas:** size/movement benefits, Athletics, conditional roll advantage, next melee weapon bonuses, unarmed bonuses, reactive AC, armor proficiency and resistance effects.
- **Orthoptera:** instrument checks, Harmonize save bonuses/concentration, action/movement interruption before level 14, Sonic Sonnet, expanded song range and Soothing Serenade.
- Insect swarm and zombie combat controls use the existing SRD monster statistics, including injured swarm damage, damage resistance/immunity and Undead Fortitude. Zombie AC, attacks and damage can be adjusted by the DM.
- Typed incoming damage applies class reductions and resistances. Swarm Form death blocks ordinary healing/rest; explicit table-confirmed revival clears the form.

## Source decisions and table input

The user approved following detailed feature text where the source table conflicts: Adaptation improvement at level 11 and species abilities at level 6. Unspecified save DCs, short-rest recovery/feeding, reactive AC duration and the Dead Man Walking/Swarm Form interaction are visible saved rulings. Summon and Invicta activation timing remains a table ruling; their Population costs are explicit source rules.

Hungry Mouths requires one matching adaptation axis; the combined environment determines Adaptation's Survival and exhaustion benefits. Hungry Mouths recharges only after a fed long rest. Short-rest Population recovery defaults to half maximum, rounded down.

Players confirm target saves, hits, visibility, range, grapples, hearing and actual Hemo damage. The sheet records effects and resolves the associated arithmetic; it does not infer encounter outcomes or change other players' sheets. Advance game time explicitly to expire effects. Size, height/weight, jumping and carrying multipliers are shown as derived benefits; there is no encounter map or universal carrying-capacity engine.

## Verification

Focused rules/action/preparation/companion tests cover the class table, all four species, spending and refunds, class identity, rest behavior and saved state. Browser coverage includes creation, advancement, spell acquisition/exchange, all four species, imported AC, Population, temporary armor, summon return, fed/unfed rests, death/revival, reload and mobile layout.

Commands: `npm run test:entomancer`, `npm run test:browser:entomancer`. Both are included in modernization CI. Existing resource, casting, edition, training and feature-choice regressions, `npm test` and the production build are also part of verification.

## Creation and full-class audit — 2026-10-20

Entomancer also uses its automatic 2014 rules in Custom mode when the base mechanics are 2014. Creation requires the species, starting tool, three skills and two cantrips; level-up collects adaptations, ASIs and legal spell additions. Spell management enforces capacity, including imported saves. The same Population reserve powers actions and the tracker.

The audit checked all four species and levels 1–20 against the retained source snapshot and the approved rulings above. Corrections include shared effective ability scores for feats/racial bonuses, Crawling Sensation interrupting Harmonize before level 14, and starting tool training applying only when Entomancer is the first class. Orthoptera's instrument remains available when multiclassing.

Creation cards omit source labels while retaining edition and hit die/speed; background skills appear below their titles. Supported racial/class language grants also work in Custom mode with matching base mechanics. Additional choices use searchable dropdowns and reject duplicates or incomplete names. Unstructured or cross-edition race rules retain the explicit manual fallback.

Additional regression: `node tests/browser-creation-choices.mjs` checks Custom creation through level 4, ASIs, spell limits, languages, saved state and mobile layout. No database changes are required.

## Concentration and action eligibility repair — 2026-10-21

Harmonize records one pending Constitution concentration check per damaging hit, in order. Each successful check resolves only that hit; a failed check ends the song and clears the remaining checks. Pending checks survive saving/reopening, including migration from older `songSaveDC` saves. Starting an already active song cannot erase pending checks. The song ends on unconsciousness, incapacitation or death and does not restart when the character recovers. Stopping the song, taking an interrupting action before level 14, and completing a long rest clear pending checks.

Supported Entomancers cannot activate personal swarm abilities, attack/grapple, perform with their instrument, or cast class/feat spells while dead, unconscious, stunned, paralyzed, petrified or explicitly incapacitated. Both controls and execution checks enforce restrictions. Damage recording, elapsed time, target cleanup, companion bookkeeping and table-confirmed revival remain available. Dead Man Walking still works at its valid 0-HP trigger; recording additional damage cannot use it to revive a character who was already dead. Ordinary saving throws and manual resource/slot counters remain table bookkeeping.

Regression coverage: `tests/entomancer-playability.mjs` and `tests/browser-entomancer-playability.mjs`, included in the existing Entomancer test commands. Coverage includes sequential hits, legacy saves, failure and recovery, incapacity, slot/feat-use protection, separate grapple/Hemo/infestation controls, and one-use Hive Mind advantage during song concentration.
