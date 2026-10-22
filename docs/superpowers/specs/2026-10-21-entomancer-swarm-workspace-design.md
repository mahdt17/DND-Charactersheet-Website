# Entomancer Swarm workspace

Status: approved by the user on 2026-10-21; implemented and verified on 2026-10-22, awaiting merge.

## Purpose and agreed direction

Make Entomancer easier to play during a session by giving its Population, abilities, ongoing effects, creatures and recovery one coordinated workspace. The user approved taking this subsystem approach after the ability-card redesign in PR #20.

Success means the player can answer four questions without searching through the sheet: What can I use? What did that use do? What is still happening? What can I recover?

This builds on the existing class engine and shared Population reserve. Saved characters, class progression, species rules, HP, spells, conditions and rests must continue to agree.

## Approach

Use a dedicated **Swarm** tab in the character sheet, with four small sections inside it. This fits the current sheet navigation and keeps the character's vitals close to swarm play. A separate full-page application would add navigation and duplicate context; rebuilding a general subsystem engine would expand the scope beyond this class.

Supported Entomancers open on Swarm when entering their sheet. Actions retains weapon attacks and offers an Open Swarm shortcut. There is one full Swarm workspace and one primary Population counter. Characters without supported Entomancer levels keep their current navigation and landing section. Custom characters using the supported 2014 Entomancer receive the same workspace, including multiclass characters.

## Player-facing layout

The top of every Swarm section shows available/maximum Population, unavailable Population, short-/long-rest shortcuts, and counts for ongoing activity and controlled creatures. The latest action result remains easy to reach when moving between sections. Ability costs and automatic refunds update the same counter immediately.

Below the summary, four section buttons provide navigation:

| Section | What the player does there |
| --- | --- |
| Abilities | Choose an ability, read its full rules, enter required facts, resolve the use and see its result. |
| Active | Track ongoing effects, infestations, attached targets, pending saves, next-attack bonuses and elapsed time. |
| Creatures | Command and manage insect swarms and zombies, record HP/damage, attack, return or remove a creature. |
| Recovery | Preview and complete rests, inspect expected returns, adjust Population manually, and review swarm choices/environment/table rulings. |

The initial section is Abilities. Selecting an ability never spends Population. Switching sections never spends uses, advances time or clears input/results. Returning from Spells or Actions retains the current Swarm section and unfinished ability inputs during that character-sheet session; opening a different character resets those temporary controls.

On phones, the summary and four section buttons remain compact and the current section uses the full width. The character shortcuts include Swarm. Section navigation supports keyboard use, visible focus, clear selected state and readable labels. It must not interfere with the sheet's own tab keyboard navigation. Avoid an unlabelled icon-only action or a second independently editable Population meter.

### Abilities

Reuse the current ability cards and complete descriptions. Add ability-name search and an optional Available filter; All is the default so players can discover unavailable abilities and read why they cannot use them.

Every card obtains its cost, daily use, active state and prerequisite explanation from one derived model. Examples include Enter Swarm Form first, Start Harmonize first, Needs a matching environment, and Insufficient Population. An unavailable ability remains selectable for reading its rules. Invalid or incomplete encounter inputs block resolution with a specific explanation beside those inputs.

The selected ability shows activation, range, save ability/current DC, cost and complete play instructions. Only relevant target/save/HP/investment fields appear. Variable-cost abilities preview the entered cost before resolution. Keep the character's entered facts while navigating within Swarm.

Resolve an ability once through the existing validated engine, then show its actual outcome: target, save result, damage/healing/conditions, Population spent or restored, and the updated reserve. Add a direct View active effect or View creature button when the action creates one. The player stays with the result until choosing another action or section.

Bug Swarm remains an immediate damage ability. Its result must not imply a persistent creature or duration. Swarm Summon and Swarm Form retain their distinct controls and rules.

### Active

Show every relevant ongoing item with its name, affected target where applicable, remaining game time, next trigger, and contextual controls. Cover Bug Armor, Swarm Form, invisibility, reflex armor, Invicta, Decomposition, infestations, target conditions, Hemo attachment, Harmonize/concentration checks, Hive Mind advantage, prepared Monstrous Strength and pending Apex attacks.

Offer explicitly labelled global time controls such as Advance 1 round and Advance 1 minute. Their explanation states that they advance all tracked timed effects. Time changes occur only when the player advances game time or completes an existing rest; no real-world countdown runs in the background.

Turn-triggered damage/healing and repeat saves stay with the relevant effect or target, so players can resolve them without returning to an unrelated ability form. Each infestation has its own range input. Pure Terror's additional-target resolution has its own target/save inputs. Hemo's start-/end-turn controls retain their actual-damage and save inputs. Stop/end/clear controls retain the engine's action eligibility and cleanup rules.

Empty state: No ongoing swarm effects, with a link back to Abilities. Expired entries do not appear active; their recent outcomes remain available in activity history.

### Creatures

Reuse the current companion rules and statistics. Each creature shows its kind, name, current/maximum HP, AC, attack and damage, and control duration if applicable. Keep advanced statistics and zombie overrides in a disclosure.

A living insect swarm's Return control previews its current refund (1 below half HP, otherwise 2). Dead swarms cannot return. Removing a creature is labelled as removal without a refund. Once a creature returns, it cannot produce a second refund. Preserve zombie limits, source restrictions and Undead Fortitude.

### Recovery

Use the existing shared RestDialog for both the sheet's Rest button and Swarm shortcuts. Keep the visible feeding choice, exact recovery preview, edition-appropriate HP/slots/hit dice handling, saved short-rest rulings and fed/unfed behavior.

Show expected conditional returns beside their originating effect or creature. For example: Bug Armor can return 0/1/3 when its duration ends; a living swarm currently returns 1/2; Decomposition returns the committed amount plus completed feeding turns when it finishes. These are estimates based on current state, capped by the existing reserve rules at resolution, not extra spendable Population.

Use Committed only when the engine explicitly records an allocation, such as Decomposition. Explain the amount and return trigger beside that activity. Summoning costs and potential refunds must not create a second pool or an additive partition of the reserve: a fed long rest can refill Population while a summoned creature still exists. Older saves and manual adjustments can also make activity allocations differ from current expenditure. The canonical available/maximum counter remains authoritative.

Manual adjustment, choices, adaptations/environment, saved table rulings and detailed history live in labelled disclosures. An ability missing an environment/setup prerequisite links directly to the relevant controls here. Recovery and manual adjustments provide before/after feedback. Dead characters retain the existing explicit revival requirement.

## State and component boundaries

Keep the persisted character shape: `resources` owns Population expenditure; `entomancer` owns effects, targets, creatures, daily flags, last result and log. Do not persist a second calculated Population balance or duplicate effect/creature collections. No database migration is needed.

Add a pure `src/lib/entomancerSubsystem.js` model that derives summary values, action availability/costs, ongoing activity, creature refund previews and recovery explanations from the current character and existing rules. Derivation must not mutate the character, create identifiers, roll dice, spend uses or advance time. Use the same derived availability in cards and resolution controls, while retaining engine validation as the final authority.

Separate the UI into a workspace shell and focused ability, active, creature and recovery sections under `src/entomancer/`. Move the current choice controls into a reusable component; creation/level-up imports must keep working. Preserve the public `Entomancer` component and named choice exports as compatibility entry points where existing callers depend on them.

The workspace shell owns navigation, unfinished input and current-character callbacks. All writes apply to the latest character through the existing functional `patch` boundary. Action controls delegate to `applyEntomancerAction`; manual changes delegate to `adjustResource`; recovery delegates to the shared rest flow. Existing HP, armor, spells and conditions continue to consume the same rule modules and saved state. Extract shared result presentation rather than copying it into multiple sections.

Sheet integration adds the supported-only Swarm tab, its landing behavior and mobile shortcut, removes the embedded full Swarm panel from ordinary Actions, and provides the Open Swarm shortcut. Moving away from the tab must retain unfinished local inputs for the current character without mounting a duplicate workspace or duplicate element IDs.

## Verification and acceptance

- Derived-model tests cover all four species and levels 1–20, costs/readiness, daily/active states, conditional returns and purity. Include imported reserve IDs and Custom/multiclass characters.
- Integration tests confirm actions, manual adjustments, time advancement, HP changes and rests update the same saved reserve and preserve other resources. Returning/expiring effects cannot refund twice.
- Browser tests follow a complete session: open Swarm, use Bug Swarm, read the result, summon/return a creature, resolve an ongoing trigger, inspect recovery, rest, save and reopen.
- Test default landing, Actions/Spells cross-navigation, retained unfinished inputs, keyboard navigation, current-character isolation, no duplicate counters/workspaces and a 390-pixel phone viewport.
- Verify every species' specialized controls, including multiple infestations/targets, feeding, concentration, death/revival and conditional AC/attack benefits.
- Run the existing Entomancer rules/browser suites, usability and shared resource checks, full `npm test`, production build and whitespace checks. Inspect desktop/mobile views and request independent implementation review.
- Record unrelated existing failures separately. The known Archivist description and Psion source-label browser assertions must not be presented as newly passing.

## Scope and release

This change creates the coordinated Entomancer workspace. Class balance, spell catalog/progression, other pending PRs, automatic encounter outcomes, real-time timers and general-purpose systems for other classes are outside its scope.

Prepare and verify the implementation on a branch from current main, then push a reviewable PR. Merge and deployment remain separate actions requested by the user. The implementation plan follows approval of this design.

## Design review

Checked against the current action, resource, rest, companion, sheet and browser-test code. The design keeps one authoritative reserve, distinguishes conditional returns from available Population, preserves cross-tab inputs, and specifies all current species controls. No unresolved design placeholders remain.
