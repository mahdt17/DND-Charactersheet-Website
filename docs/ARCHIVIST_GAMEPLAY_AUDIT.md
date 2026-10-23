# Archivist / Telepath / Thrallherd gameplay audit

Date: 2026-10-22. Baseline: main at `5795619` (Class tools release, PR #23).

## Scope and rules baseline

This audit covers the user's converted 2014/5e classes, the private Archivist character guide, and the adjustable conversion rules documented in [ARCHIVIST_CAMPAIGN.md](ARCHIVIST_CAMPAIGN.md). It does not substitute original 3.5 class rules for the approved conversion. The guide's level-5 start is Archivist 4 / Telepath 1; Thrallherd arrives at character level 6, followed by Archivist through the level-20 build Archivist 18 / Telepath 1 / Thrallherd 1. Tests also exercise earlier levels and independent class progressions.

## Repeatable coverage

| Area | Evidence |
| --- | --- |
| Every guide character level 1–20 | Browser imports hand-checked level fixtures, exercises every unlocked Dark Knowledge description, spends resources and a prepared spell, checks every slot tier, Lore choices, thrall cap, and long-rest recovery. |
| Independent advancement | Archivist and Telepath 1–20, Thrallherd 1–10; actual advancement helpers, prestige prerequisites, ASI and bonus-feat milestones, knowledge thresholds and limits, known powers, PP, spell tiers, and retained expenditure. |
| Converted spell effects | 134 eligible spell/class-level combinations across all ten Mother Cyst spells plus Awaken Magical Beast and Monstrous Thrall; assertions include resource spending and resulting damage, cysts, control, detection, empowerment, awakening, death and soul destruction. |
| Prayerbook and casting | Growth versus outside acquisitions, cantrips, preparation, slot exhaustion, ownership, rituals, Reach/Chain cost and effect levels, optional ninth-level cap, cooperative spending and DCs, helper upcasting, and ordinary/Pact pool integration. |
| Thrallherd | 3,150 legal character-level/Thrallherd-level/Charisma combinations; both thrall caps, every believer tier, over-cap rejection, arrival/replacement, loss history, and independent member availability. |
| Psicrystal | Actual Psion level gates through 20, distance, HP, destruction, save/reload and level-up preservation, movement/sight timers, sharing, held touch delivery, channeling, and explicit replacement. |
| Feats and controls | Guide feat milestones, actionable converted effects, required new feat choices, preserved past choices, class-owned bonus-feat removal/re-entry, feat spell incapacity guards, Still Mind modifiers and visible progression milestones. |
| NPC play and projects | Independent attacks/saves/slots/conditions/concentration, saving-throw proficiency and spell editors, temporary HP, loss/replacement, paid copying/scrolls/grafts, one-time completion, failure, cancellation, materials and currency. |
| Saved state and mobile | Reopening saved characters, partial loss and replacement persistence, legacy crystal state, retained drafts, source isolation, and a 390px layout check. |

The progression expectations use the documented class tables. The browser slot/guide fixtures and roster matrix contain literal expected rows instead of deriving expected results from the function being tested.

## Confirmed issues repaired

- Dead, unconscious, incapacitated, paralyzed, stunned, petrified or exhaustion-6 converted characters cannot initiate class actions, powers, spell casts, other-class spellbook casts, feat spells or personal attacks. Resource reducers enforce availability before expenditure. Administrative bookkeeping and passive recovery remain available.
- Graft crafting cannot start, progress or perform its final surgery check while the crafter is unavailable.
- A destroyed Psicrystal stays destroyed when its owner's maximum HP changes, including older damage-only saves and the full level-up wizard. Its Sage bonus stays off. Replacement requires an explicit table confirmation and preserves already-spent daily sight use.
- Converted class bonus feats have source ownership and leave with their class. Old bonus-slot records remain supported. Newly selected or edited bonus feats must complete their choices and prerequisites; unchanged previously earned choices remain saved.
- Unsupported augmentation and prestige discounts on the three base powers are rejected without spending PP, rather than being silently ignored.
- Cooperative Chain displays the correct secondary DC after cooperation. Helpers can choose an available higher-level spell slot.
- One-minute effects expire after exactly ten rounds, without floating-point residue. Blocked Awareness and Empowerment do not apply effects.
- Follower groups support individual and bulk recorded losses. Losses free only the corresponding roster capacity; other members remain usable. New replacements keep their 24-hour arrival delay.
- NPC incapacitating conditions disable actions and casting. Damage to zero HP, death and incapacitating conditions clear concentration. NPC rolls use their own modifiers independently of the owner's conditions and exhaustion.
- NPC saving-throw proficiencies and prepared/concentration spell flags can be entered through the sheet.
- Failed graft damage consumes temporary HP first. Scroll scribing can spend pooled standard slots. Valid copper-precision costs such as 0.29 gp work.
- Still Mind includes an active Necrotic Empowerment CON-save bonus. Telepath and Thrallherd reference tables display their existing ASI milestones. Telepath spellbook guidance points to Class tools.

## Explicit table inputs and boundaries

- The table supplies target eligibility, range, line of sight, immunities, attack/save outcomes, rolled damage, cooperative formation and narrative commands. The app records and applies those outcomes; it does not enforce every combat turn or run creature AI.
- The seven guide feats and configured converted spells/powers have the controls described above. Arbitrary published bonus feats and custom powers do not acquire bespoke automation merely by entering their names. Custom powers retain their approved descriptions and configured save/damage/duration behavior.
- Costs, durations, NPC templates, graft effects and other saved conversion rulings remain adjustable. These tests validate the documented defaults and edited-value handling, not the balance of every possible house rule.
- Record a follower's loss explicitly to free a roster place; a creature sheet can remain as history. Marking HP zero denotes incapacity, not an automatic declaration of death or departure.
- NPC Rest records a rest already resolved at the table. It restores the sheet without advancing the campaign clock; advance game time separately. Ritual extra time and other narrative downtime likewise remain explicit time controls.
- No Supabase account data or character level was changed by this audit. New regression browsers use disposable demo characters.

## Verification commands

`npm run test:archivist` includes the new `test:campaign-audit` rules matrices. `npm run test:browser:archivist` includes both new gameplay browser audits alongside existing creation, advancement, prayerbook, project and Class tools checks. These existing commands are already part of GitHub validation.

Final release verification also runs the full `npm test`, shared casting/resource/integration and usability checks, Entomancer regressions, and `npm run build`. The existing build chunk-size warning is unrelated to these repairs.

All listed verification commands passed on the completed audit branch. Independent reviews found additional mixed-class, exhaustion and graft-completion guard gaps; those received failing regressions and were repaired before the final run.
