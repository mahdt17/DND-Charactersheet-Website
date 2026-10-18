# Independent 5e class conversions

The Archivist PDF is a multiclass example, not a campaign preset. Use normal **Create character** to start as Archivist or Psion (Telepath) at level 1. **Level up** offers continuing a class, adding another class, or entering Thrallherd when level 5, Arcana/Religion proficiency, Mindlink and the converted Intelligence requirement are met.

- The approved adjustable 2014/5e conversion defaults remain in use. These are not original 3.5 class records.
- Choose powers, class bonus feats, Lore Mastery and ordinary ASI/feat choices. No race, ability scores, equipment, Mother Cyst or future PDF feats are imposed.
- Archivist free growth additions and outside prayerbook acquisitions are counted separately. Spell access follows Archivist level; supported multiclass spell slots are pooled. Other spellbooks remain selectable, and Archivist spells can spend Pact Magic slots with separate short-rest recovery.
- Psion power points include the Intelligence bonus; Thrallherd levels 2–9 advance manifesting. Actual Psion levels control its bonus feats and selected Psicrystal Affinity abilities.
- Feat-dependent features require the selected feat. Mother Cyst, Reach, Chain, cooperative casting and graft crafting remain available through their converted feat choices.
- Existing saved builds keep their already granted feats, known powers, expenditure, companions and rulings. Migration preserves recorded Psion bonus feats, including repeatable selections in separate bonus slots; it does not grant later planned feats. The old implicit level-one PP default does not freeze later PP growth.
- Dark Knowledge validates missing target/check beside the button, focuses the missing field, and reports the outcome. Both success and a failed check spend a use; invalid input does not. Short rests retain expenditure; long rests recover it.

The internal `archivistCampaign` state and `homebrew:darkdonte:*` identifiers remain stable for saved-character compatibility. Legacy preset construction/advancement helpers are compatibility fixtures only; no product control invokes them.

Checks: `npm run test:archivist`, `npm run test:browser:archivist`, plus the ordinary rules/edition/Entomancer/presentation suites. The browser progression creates an Archivist at 1, copies an outside spell, freely selects Psion and Thrallherd, takes a chosen feat at an ASI, switches spellbooks, checks persistence and independently creates a Psion at 1.

## Historical implementation notes

The following describes the superseded preset release and its original research, retained for provenance. The independent-class behavior above takes precedence.

# Archivist campaign conversion

Source: the user's `Archivist.pdf` campaign guide, reviewed October 16, 2026, especially pages 3–12, 16–19, 24 and 27–28. The user authorized adjustable 5e defaults where the guide omits conversion details. The private source document is not distributed with the application.

## Supported build

Choose **Archivist campaign preset** in Characters. It starts a level-5 Variant Human with Archivist 4 / Psion (Telepath) 1, the guide's ability scores, CON/WIS saving throws and three power points. Level up adds Thrallherd 1 at character level 6, then Archivist through character level 20: Archivist 18 / Psion 1 / Thrallherd 1.

These are separate, source-identified 2014 homebrew classes. The original 3.5 Archivist, Psion and Thrallherd records are unchanged. The campaign Archivist and Telepath are also available in guided creation; Thrallherd is marked as a prestige class and cannot be selected as a starting class. The preset preserves the guide's path. The campaign level-up selector also supports Archivist 1–20, Telepath 1–20 and Thrallherd 1–10 within the normal character-level-20 limit. Thrallherd entry checks campaign level, psionic capability and Arcana/Religion; its levels 2–9 advance Telepath manifesting, not Archivist slots.

## Integrated behavior

- Prayerbook acquisition distinguishes two free Cleric-list spells per Archivist level, limited Cleric cantrips, and table-approved outside copies. Outside acquisition needs a recorded source and confirmation that copying is complete. Mother Cyst access never consumes the free allowance.
- Preparation, available spell tiers and slots follow Archivist levels only. The other two classes do not advance casting. Casting spends saved slots, tracks concentration and offers existing catalog attack, damage and healing rolls. Metamagic's slot surcharge does not also increase those rolls' spell level. Rituals can be cast from the book without preparation or slot expenditure.
- Reach adds two slot levels and requires Touch; Chain adds three and requires confirmed single-target eligibility. Necrotic Cyst supports the guide's Reach + Chain combination. The high-end ninth-level cap requires an explicit saved ruling, disabled by default.
- All ten Mother Cyst spells become available at their spell tiers. Their adjustable 5e conversions now resolve cyst implantation, sensing/scrying, necrotic damage, control, death and empowerment against recorded targets. Casting requires confirmation of table eligibility. Saves, rolled damage and blocked access are explicit inputs; duplicate resolution is rejected. Chain uses the appropriate secondary DC or DEX save and damage reduction.
- Mindlink, Inertial Armor and Attraction spend the same canonical `powerPointsUsed` value shown by the Resource Tracker. Short rests preserve spent points; long rests recover them. Inertial Armor affects unarmored AC and expires with explicit game time.
- Dark Knowledge has level-gated effects, check thresholds, saved target/result/duration and a shared tracker counter of `3 + floor(Archivist level / 3)` uses. Lore Mastery choices and nearby Sage Psicrystal bonuses affect sheet skill rolls. Still Mind has an explicit enchantment-save roll including its conditional bonus.
- The planned feats appear in Features, Feats and the campaign timeline when their class-level milestones are met. They do not invoke the original 3.5 feat prerequisites or silently grant unplanned ASIs.
- Thrallherd score, thrall caps and believer allowances use the guide's table, extended with the SRD's lower scores and 25+ row. Twofold Master allows a second thrall capped at Thrallherd level minus two. Independent combat sheets track every follower's HP, attacks, saves, spells, slots, conditions, control and grafts; lost or unarrived followers cannot cast.
- Expenditure, spell ownership/preparation, conversion rulings, effect timers and follower records survive saving and reopening the character. Leveling never restores spent uses.

## Adjustable defaults and table decisions

Defaults are d6 hit dice, average HP gains, full-caster Archivist slots, Intelligence modifier + Archivist level preparations, three cantrips (four at A4, five at A10), simple weapons and light armor for Archivist. The Campaign rules panel provides saved overrides. Skill/save proficiencies remain editable beside sheet rolls. Changes to hit dice affect future gains/rest dice; existing maximum HP can be edited separately.

Power durations, Inertial Armor's base AC, the PP maximum, Dark Knowledge DC and metamagic cap are adjustable. The guide's feat schedule and three-PP baseline remain the preset defaults. Dark Knowledge condition mappings, its range/action/duration, power ranges and Attraction's save are explicitly labeled conversion defaults. The party still confirms creature eligibility, range, saves, hits and effects on other creatures.

The guide omits complete spell conversions and crafting/NPC economy. These now have labeled, editable homebrew defaults:

- Copying costs 50 gp and two hours per spell level. Scroll scribing costs 25 gp × spell level squared, two hours per level and a spell slot; activation consumes the scroll without spending another slot. Existing recorded acquisitions are retained.
- Nine graft recipes have paid work projects, a Medicine check, recipient limits and installed effects. Materials/workspace eligibility requires confirmation. Cancellation and failed work do not refund materials. The optional heart must be enabled and never reverses death.
- Monstrous Thrall and Awaken Magical Beast are outside prayerbook acquisitions. Control keeps order-specific refusal history; awakening changes ability scores, hit dice, HP and language without granting control.
- Cooperative casting checks the same prepared spell and available reactions/slots, spends each participant's resources atomically, and uses the highest DC plus the cooperation bonus. The player confirms adjacency and Ready timing.
- Higher Telepath levels use the power-point, known-power and tier tables; daily prestige discounts and type-augmentation waivers still enforce the undiscounted manifester-level limit. Additional powers use saved, table-approved descriptions, costs, save and damage controls. This does not supply bespoke automation for every published power or optional bonus feat.
- The Sage Psicrystal has HP, distance, evasion, movement timers, level-gated flight/resistance/sight, daily recovery, shared powers, held touch delivery and remote channeling. Prestige levels do not advance these abilities. Base AC, HP, Alertness mapping and sight duration are adjustable conversion defaults.

Targets, distances, immunities, actual rolls, cooperative formation and narrative commands remain player/table inputs. The application applies recorded outcomes and expenditure; it does not run autonomous creature AI. Planned equipment is not granted automatically. Original 3.5 source records are unaffected.

Progression references: [Psion and Psicrystal SRD](https://www.d20srd.org/srd/psionic/classes/psion.htm), [Thrallherd SRD](https://www.d20srd.org/srd/psionic/prestigeClasses/thrallherd.htm). Graft names/effect references: [grafts](https://www.realmshelps.net/magic/items/grafts.shtml); prices, work times and limits are homebrew defaults.

## Verification

`npm run test:archivist` covers every level 5–20, source isolation, acquisition/preparation, canonical spending, rests, concentration, Reach + Chain, follower limits, class removal and editable training/hit dice. `npm run test:browser:archivist` exercises the preset through level 20, powers/AC, resources/rests, ordinary casting/healing controls, concentration, feat visibility, followers, persistence and a 390px mobile layout. Both are included in modernization CI. The expanded suites also check every class level, all twelve campaign spell effects, paid copying/scroll/graft workflows, individual NPC sheets, cooperation, death guards, augmentation limits and Psicrystal features. Browser coverage includes extended Psion actions and saved conditions.

The change also passes the full `npm test` suite, existing resource/casting/multiclass/edition and Entomancer tests, and the production build. The user authorized release through PR #8 on October 17. The release also preserves Entomancer and earlier quality-of-life changes and prevents the dice canvas being shown before its first rendered frame. No Supabase changes or blanket certification of the 1,054 legacy classes are implied.
