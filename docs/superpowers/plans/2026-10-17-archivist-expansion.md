# Complete the campaign systems

User instruction: build the remaining systems, retaining the already authorized adjustable 5e defaults. Execute inline; one fresh review after integration. The October 17 user instruction authorizes merge and live deployment after verification, including previous QoL changes and the dice flash fix.

Design: extend the existing campaign state and UI with small pure modules for creatures, spell resolution, downtime and higher-level psionics. Reuse canonical spell slots, PP, currency, inventory, ability scores and saved state. Defaults are visibly homebrew; PDF rules take priority over original 3.5 rules. Never change original 3.5 source records.

- [x] Creatures: editable individual follower/target sheets, HP/temp HP, saves, attacks, spells, rest, conditions and derived graft effects. Group members have independent state; roster links persist.
- [x] Spell effects: all ten Mother Cyst spells, awakening, permanent thrall control, cyst dependency, saves and damage, duration/expiry, no duplicate resolution, secondary Chain targets, cooperative DC and participant expenditure. Outside spells require acquisition. Empowerment modifies sheet stats and blocks other cyst spells while active.
- [x] Downtime: prayerbook copying, scroll scribing/use, graft recipes/projects, gp/material/time validation, medicine outcomes, recipient limits and installed effects. Expose conversion prices/durations/failure rules; no free projects or duplicate rewards.
- [x] Progression: Telepath 1–20, Thrallherd 1–10; optional departure from fixed preset, prestige manifesting advancement, PP/known/tier/augmentation, bonus feat records, charm/dominate discounts and daily recovery, twofold master. Preserve fixed-build PP3 at effective Psion1.
- [x] UI and regression: browser exercise each new flow, reload/mobile, pure negative tests, prior campaign/Entomancer/resource suites and production build; review, document defaults and publish to PR #8.

Rulings: creature templates and graft economy are adjustable 5e homebrew, not official sidekick rules. Necrotic spell effects retain existing verified local source mechanics where compatible, with CON/WIS/DEX save mapping and necrotic damage replacing vile damage. No fabricated divine damage type. Awakening sets INT to 3d6 and adds 1d3 CHA and two hit dice. Disputed source details remain labeled defaults with controls. Full higher-class progression does not imply every published psionic power has a bespoke combat engine: player-defined powers use the same cost/save/damage controls.

Sources: user PDF; existing reviewed local dndtools necrotic spell summaries; https://www.d20srd.org/srd/psionic/classes/psion.htm ; https://www.d20srd.org/srd/psionic/prestigeClasses/thrallherd.htm ; https://www.realmshelps.net/magic/items/grafts.shtml (graft names/effect reference, conversion economy is homebrew).

Release verification: full npm test, campaign/Entomancer/resource/casting/edition/training/dice suites, campaign and Entomancer browser flows, all-style dice presentation and production build passed locally. Final publication and live smoke test follow CI.
