# Adventurer’s Ledger

A React + Vite D&D workspace, hosted on GitHub Pages with Supabase email/password authentication and per-user cloud storage.

## Features

- Responsive character roster and sheets with light/dark themes.
- Guided level-1 creation: species/subrace, class, background, standard array/point buy/custom scores, class skills, Half-Elf choices, starting class equipment, initial subclasses, and spells.
- Guided single-class advancement through level 20: subclass choices, ASIs or recorded custom feats, new spell choices, and Constitution HP adjustments.
- 319 SRD spells, 334 monsters, 237 equipment entries, 15 conditions, and 33 rule sections.
- Class spell preparation, known-spell limits, level-appropriate spell access, regular and Pact Magic slots, rituals, and concentration tracking.
- Dice roller, advantage/disadvantage, ability/skill/save rolls, weapon attacks from equipped gear, armor calculation, HP/temp HP, conditions, inspiration, death-save counters, hit dice, rests, and custom resource counters.
- Inventory, currency, custom actions, feature references, character notes, JSON import/export, and printable sheets.
- Private campaign notebooks and party rosters; saved encounters with creature references, initiative, turn order, and separate combatant HP.
- Disposable in-memory demo, independent from authenticated character storage.

## Rules scope

Automated rules use **2014 5e / SRD 5.1**. Existing characters labeled 2024 are preserved and visibly marked as using 2014 calculations. New creation only offers the implemented ruleset.

This is not complete D&D Beyond parity: multiclassing, realtime collaboration, campaign invitations, maps/VTT, purchased-book content, and full 2024 automation are not implemented. Campaigns are private notebooks. Custom feats/subclasses, conditional or magical bonuses, race-specific spell uses, certain subrace choices (such as High Elf cantrips), and class-specific recovery abilities require manual tracking. Casting spends resources but does not resolve targets, damage, saving throws, or other effects automatically. Prepared cleric/druid/paladin spells use base class lists; domain and other expanded lists can be recorded in custom features. Choosing skill expertise manually does not validate feature eligibility. Armor uses the first equipped armor and one shield; review multiple armor selections and magic bonuses with the DM.

Existing saved fields are preserved when loading and editing. Legacy characters with incomplete choices can use Edit, Manage spells, inventory, skills, resources, and the level-up flow to fill gaps. Gear selection adds inventory and equips starting weapons/armor; background currency is moved into the purse for newly created characters. Editing AC directly opts out of automatic armor calculation until equipment is toggled again.

## Development

Copy `.env.example` to `.env` and provide:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Never put a Supabase secret/service-role key in frontend code. Without Supabase configuration, the demo remains usable.

```sh
npm ci
npm run dev
npm test
npx playwright install chromium
npm run test:browser
npm run build
```

Browser tests support `BROWSER_EXECUTABLE_PATH` for an existing Chromium installation. They exercise the demo and simulated storage failure/recovery. The adapter tests verify query construction, owner filtering, workspace exclusion, round trips, and error propagation against a fake Supabase client; they do not replace live authentication/RLS integration testing.

The existing GitHub Actions deployment publishes `main` using the repository’s Supabase public environment secrets. The configured Pages base path remains `/DND-Charactersheet-Website/`.

## Storage and reliability

The existing `characters` JSONB schema and RLS policies remain unchanged. A reserved per-user row, `id = ledger-workspace`, stores private campaigns and encounters and is excluded from the character index. The `user_id,id` composite conflict target is explicit. No new database migration is needed.

Character and workspace edits are debounced per record, with serialized writes per record. Failed writes remain pending and can be retried. The app warns before leaving with unsaved changes and flushes before sign-out or wizard completion. Loading failures are reported instead of replacing the character list with an empty list. Multiple browser tabs are not conflict-merged; avoid editing the same record in two tabs simultaneously.

## Data and attribution

SRD JSON is vendored from [5e-bits/5e-database](https://github.com/5e-bits/5e-database), `src/2014/en`, so the app works without runtime calls to a third-party rules API. The license and attribution are in `src/data/LICENSE.md` and linked in the app footer.

This work includes material taken from the System Reference Document 5.1 by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document, licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).
