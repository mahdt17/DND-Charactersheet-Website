# Archivist campaign conversion

Source: the user's `Archivist.pdf` campaign guide, reviewed October 16, 2026, especially pages 3–12, 16–19, 24 and 27–28. The user authorized adjustable 5e defaults where the guide omits conversion details. The private source document is not distributed with the application.

## Supported build

Choose **Archivist campaign preset** in Characters. It starts a level-5 Variant Human with Archivist 4 / Psion (Telepath) 1, the guide's ability scores, CON/WIS saving throws and three power points. Level up adds Thrallherd 1 at character level 6, then Archivist through character level 20: Archivist 18 / Psion 1 / Thrallherd 1.

These are separate, source-identified 2014 homebrew classes. The original 3.5 Archivist, Psion and Thrallherd records are unchanged. The campaign Archivist and Telepath are also available in guided creation; Thrallherd is marked as a prestige class and cannot be selected as a starting class. This implementation supports the guide's one-level Telepath and Thrallherd dips, not general higher-level conversions or arbitrary multiclass combinations.

## Integrated behavior

- Prayerbook acquisition distinguishes two free Cleric-list spells per Archivist level, limited Cleric cantrips, and table-approved outside copies. Outside acquisition needs a recorded source and confirmation that copying is complete. Mother Cyst access never consumes the free allowance.
- Preparation, available spell tiers and slots follow Archivist levels only. The other two classes do not advance casting. Casting spends saved slots, tracks concentration and offers existing catalog attack, damage and healing rolls. Metamagic's slot surcharge does not also increase those rolls' spell level. Rituals can be cast from the book without preparation or slot expenditure.
- Reach adds two slot levels and requires Touch; Chain adds three and requires confirmed single-target eligibility. Necrotic Cyst supports the guide's Reach + Chain combination. The high-end ninth-level cap requires an explicit saved ruling, disabled by default.
- All ten Mother Cyst spells become available at their spell tiers. They are access records with the guide's known constraints, not invented full 5e spell conversions. Casting requires confirmation of the table-approved effects.
- Mindlink, Inertial Armor and Attraction spend the same canonical `powerPointsUsed` value shown by the Resource Tracker. Short rests preserve spent points; long rests recover them. Inertial Armor affects unarmored AC and expires with explicit game time.
- Dark Knowledge has level-gated effects, check thresholds, saved target/result/duration and a shared tracker counter of `3 + floor(Archivist level / 3)` uses. Lore Mastery choices and nearby Sage Psicrystal bonuses affect sheet skill rolls. Still Mind has an explicit enchantment-save roll including its conditional bonus.
- The planned feats appear in Features, Feats and the campaign timeline when their class-level milestones are met. They do not invoke the original 3.5 feat prerequisites or silently grant unplanned ASIs.
- Thrallherd score, thrall level cap and level 1–6 believer allowances follow the guide's score 10–24 table. Named follower records enforce roster limits, track loss/replacement and a 24-hour arrival clock. Other scores require a table ruling.
- Expenditure, spell ownership/preparation, conversion rulings, effect timers and follower records survive saving and reopening the character. Leveling never restores spent uses.

## Adjustable defaults and table decisions

Defaults are d6 hit dice, average HP gains, full-caster Archivist slots, Intelligence modifier + Archivist level preparations, three cantrips (four at A4, five at A10), simple weapons and light armor for Archivist. The Campaign rules panel provides saved overrides. Skill/save proficiencies remain editable beside sheet rolls. Changes to hit dice affect future gains/rest dice; existing maximum HP can be edited separately.

Power durations, Inertial Armor's base AC, the PP maximum, Dark Knowledge DC and metamagic cap are adjustable. The guide's feat schedule and three-PP baseline remain the preset defaults. Dark Knowledge condition mappings, its range/action/duration, power ranges and Attraction's save are explicitly labeled conversion defaults. The party still confirms creature eligibility, range, saves, hits and effects on other creatures.

The guide leaves full Mother Cyst spell conversions, prayerbook copying economy, scroll crafting, Silthilar graft costs/materials/time/limits, believer stat blocks, Monstrous Thrall range/cost, Awaken Magical Beast mapping/cost and Cooperative Spell timing unresolved. These remain descriptive guidance and saved ruling notes. Planned equipment targets are not owned equipment and are not automatically granted. This feature does not create NPC stat blocks, resolve other creatures' turns, or supply those missing spell conversions.

## Verification

`npm run test:archivist` covers every level 5–20, source isolation, acquisition/preparation, canonical spending, rests, concentration, Reach + Chain, follower limits, class removal and editable training/hit dice. `npm run test:browser:archivist` exercises the preset through level 20, powers/AC, resources/rests, ordinary casting/healing controls, concentration, feat visibility, followers, persistence and a 390px mobile layout. Both are included in modernization CI.

The change also passes the full `npm test` suite, existing resource/casting/multiclass/edition and Entomancer tests, and the production build. It belongs to draft PR #8; it does not deploy the website, change Supabase, or certify the 1,054 legacy classes.
