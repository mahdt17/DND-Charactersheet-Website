# Class and feat tools

The 2014/5e sheet's **Class tools** workspace follows the character's actual classes and selected feats. Classes have their own tabs and class levels; each feat has a separate tab. A future build schedule never grants a feat or its tools automatically.

| Source | Tools |
| --- | --- |
| Archivist | Dark Knowledge, Still Mind, Lore Mastery, prayerbook, copying and scroll projects |
| Psion (Telepath) | Known powers, shared Power Points and manifesting progression |
| Thrallherd | Thralls, believers, arrival/replacement limits and follower combat sheets |
| Mother Cyst | Automatic necrotic spell grants, casting class/slot choice and effect resolution |
| Psicrystal Affinity | Crystal health, movement, sight and power delivery; abilities follow actual Psion level |
| Graft Flesh: Silthilar | Paid graft projects, recipient rules and Medicine outcomes |
| Reach Spell / Chain Spell / Cooperative Spell | Casting tools for eligible spells from the selected class or Mother Cyst, using existing slots |
| Draconic Archivist | Rules and access to the owned Archivist's Dark Knowledge |
| Other classes and feats | Existing class features/resources/spellbooks and per-feat magic choices/casting, where implemented |

Encounter targets and explicit game time are shared. Project history remains available after a source is removed, including cancellation of paid pending work. Installed grafts and recorded effects/creatures are retained. Source-dependent project work and completion require the source again.

## Mother Cyst's requested conversion

Mother Cyst is independent of Archivist levels. Its spell tiers follow **total character level**:

| Character level | Newly unlocked spells |
| --- | --- |
| 1 | Necrotic Awareness |
| 3 | Necrotic Cyst, Necrotic Scrying |
| 5 | Necrotic Bloat |
| 7 | Necrotic Domination |
| 9 | Necrotic Burst |
| 11 | Necrotic Eruption |
| 13 | Necrotic Tumor |
| 15 | Necrotic Empowerment |
| 17 | Necrotic Termination |

These are derived feat grants, not additions consuming class spell choices or prayerbook preparation. Cyst damage and Empowerment duration use total level. This is the user's requested homebrew 5e progression, not an assertion about original 3.5 rules.

Select an available spellcasting class to determine the feat's casting ability. The primary casting-ability override and per-class overrides are honored. Casting requires an existing appropriate standard/Pact slot, sufficient metamagic adjustment and the existing effect confirmation. A Cleric 1/Fighter 16 can unlock the entire chain but cannot cast its ninth-level spell without a valid ninth-level slot. No free use or new slot is granted. Unsupported homebrew sources require explicitly configured source slots; a class named Wizard does not acquire the published Wizard table merely by taking the feat.

Changing class or feat ownership updates the tabs and grants. Retained saves keep expenditure, followers, crystal destruction, projects, rulings and installed grafts. Switching tabs preserves drafts. Repeated feat instances use their own identities and magic uses. Removing one feat does not remount unrelated feat tabs.

## Limits and verification

Original 3.5 and 2024 records retain their existing rules and UI. This change adds no Entomancer redesign. Normal creation/level-up prerequisite checks remain in place; taking a feat does not grant a missing prerequisite class or its features. Existing unreviewed/rules-only catalog mechanics remain explicit rules, not newly invented automation. Range, eligibility, saves, immunity and cooperative formation remain table inputs.

Regression commands:

- `npm run test:class-feat-tools`: independent level 1–20 Cyst grants, nine caster families, selected casting abilities, real slot spending, source policy, feat removal, installed grafts, project gates, generic metamagic and stable tool identity.
- `npm run test:browser:archivist`: normal creation/advancement, all 20 guide levels, class/feat navigation, retained drafts, target/follower actions, rests, cooperative casting, crystal replacement, feat-only Cleric/Pact casting, saved round-trips, source-removal project history and mobile layout.
- Shared rules, Entomancer browser regressions, integration/resource/usability checks and production build.
