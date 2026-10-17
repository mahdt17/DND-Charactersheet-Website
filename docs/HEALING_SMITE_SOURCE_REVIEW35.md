# Healing and smite source review — 2026-10-12

The next shared feature work must distinguish damage progression, additional uses, target restrictions and independent pools. A generic additive class level would overstate the reviewed rules below. These are source-review notes, not activated progression declarations or class certifications.

| Source | Reviewed boundary |
| --- | --- |
| [Paladin (95)](https://www.d20srd.org/srd/classes/paladin.htm) | Lay on Hands starts at level two and uses level times positive Charisma modifier. This batch supplies its daily counter. |
| [Divine Champion (661)](https://new.dndtools.org/classes/divine-champion-661) | Champion healing is restricted to self or same-patron worshipers; healing from another class remains separate. Smite Infidel has its own target rule and can alternatively provide another use of a different smite. |
| [Shadowbane Inquisitor (193)](https://new.dndtools.org/classes/shadowbane-inquisitor-193) | Smite Corrupt has its own damage and uses. Paladin stacking text concerns fallen-paladin Blackguard benefits, not ordinary smite progression. |
| [Shadowbane Stalker (194)](https://new.dndtools.org/classes/shadowbane-stalker-194) | Reviewed features concern sneak attack and spell tradeoffs, not a generic smite contribution. |
| [Argent Fist (468)](https://new.dndtools.org/classes/argent-fist-468) | Paladin, Monk and Argent Fist levels stack for smite damage. Extra uses occur at separate milestones (four and nine). |
| [Triadic Knight (922)](https://new.dndtools.org/classes/triadic-knight-922) | Its smite unlock and example disagree about the attained level. Resolve against the publication before activating metadata. |
| [Topaz Guardian (563)](https://new.dndtools.org/classes/topaz-guardian-563) | Aberration-only smite uses twice class level for damage and separate use milestones. |
| [Holy Liberator (242)](https://new.dndtools.org/classes/holy-liberator-242) | Ex-paladin rules depend on the lost-class-feature state and affect specified smite/casting benefits. |
| [Templar (369)](https://new.dndtools.org/classes/templar-369) | Own smite or additional existing smite uses, combined damage levels and a domain-cleric branch require distinct rules. |
| [Golden Cup Paladin (933)](https://new.dndtools.org/classes/golden-cup-paladin-933) | Substitution level ten adds three effective Lay on Hands levels while replacing a smite use; level four replaces turning. Needs explicit replacement modeling. |
| [Sacred Warder of Bahamut (409)](https://new.dndtools.org/classes/sacred-warder-of-bahamut-409) | Independent evil-dragon-only smite. |
| [Beloved of Valarian (160)](https://new.dndtools.org/classes/beloved-of-valarian-160) | Holy Smite is a spell-like ability, not a smite attack. |

First implemented cohort (2026-10-13): exact PHB Paladin + Argent Fist reuse the native Paladin daily-use counter, with separate attack/damage guidance and preserved expenditure. Exact PHB Monk contributes to Ascetic Knight damage only. This does not activate generic feature-level progression declarations.

Next implementation boundary: extend source-reviewed smite rules while keeping target eligibility, attack bonus, damage contribution and daily-use ownership separate. Treat substitution, ex-class state and alternative-use selection as explicit dependencies rather than inferring them from a matching feature name.
