# Entomancer Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans, completing each test cycle inline.

**Goal:** Implement the Dandwiki Entomancer as an explicitly identified 2014 homebrew class with saved, playable automation for all four species.

**Architecture:** A source-specific class record, pure derived-rules module, and validated action reducer share one Population resource with the existing tracker. A dedicated panel handles target outcomes and timed effects; existing creation, casting, training, armor, damage, and rest flows consume those rules.

**Tech Stack:** React, JavaScript, Node assertions, Playwright.

**Spec:** https://www.dandwiki.com/wiki/Entomancer_(5e_Class), retrieved 2026-10-15. Source snapshot is retained outside the repository in outputs/entomancer/source-2026-10-15.md. User approved detailed feature timing (Adaptation 11, species 6) and adjustable unspecified DC/recovery rules.

## Constraints and review focus

- Keep PR #8 branch; no deployment or database changes.
- Explicit source identity; no automatic support for unrelated homebrew or other editions.
- Preserve expenditure across reload/level changes. No duplicate pool or repeat refunds.
- Choices and effects stop applying when class/species/level no longer qualifies.
- Derive spell access from class level, while slots and cantrip proficiency use correct multiclass rules.
- Target saves, damage actually dealt, range, and environmental facts require player input; no invented encounter outcomes.
- Unspecified rulings must be visible and adjustable, never presented as source rules.

## Tasks

- [x] Source record and rules: add `src/data/entomancer.js`, `src/lib/entomancer.js`, `tests/entomancer.mjs`; test all levels, identity, species gates, AC, skill ranks, resistances, slots and counts before implementation.
- [x] Saved actions: add `src/lib/entomancerActions.js`; test spending, refunds, timers, summons, daily use, target immunities and rest behavior before implementation.
- [x] Integration: connect creation, multiclass training/casting, resources, spells, armor and damage. Add integration assertions and keep core behavior intact.
- [x] UI: add `src/Entomancer.jsx`; expose species/adaptation choices, adjustable rulings, legal actions, summons and target state. Exercise through browser creation, play and reload.
- [x] Verification: focused tests, existing resources/casting/training checks, full npm test, build and browser tests. Record any pre-existing failures separately. Review and publish to existing PR when verified.

## Completion evidence — 2026-10-16

Focused Node suites, full `npm test`, production build, resource/casting/setup browser regressions and the expanded Entomancer browser suite passed. One implementation review was completed and its findings corrected. Final checks additionally covered imported reserve identity, missing adaptation choices, imported AC, fed Hungry Mouths recharge and Swarm Form revival. The two remote Tainted Warrior test fixes were fast-forwarded into this branch before publishing. See `docs/ENTOMANCER.md` for supported play and table-input boundaries.
