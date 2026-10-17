# Shared PP Reserve Implementation Plan

**Goal:** Keep table-derived manifesting profiles while making all PP consumers use the existing `powerPointsUsed` expenditure.

**Architecture:** One reserve calculation supplies the spellbook and a derived Resource Tracker counter. Class tables contribute base PP; the existing reviewed Psion, Psychic Warrior and Wilder ability rules contribute bonus PP. Prestige advancement affects the target class once. No new ability or power-access rules are inferred for unreviewed classes.

**Tech stack:** JavaScript, React, Node assertions, Playwright.

**Spec:** User's continuation request: shared reserve, table profiles, multiclass pooling, prestige advancement and saved expenditure must agree.

**Constraints:** Continue PR #8 branch; no merge, deployment or Supabase changes. Preserve unrelated local work. Existing canonical expenditure wins over stale resource copies; saves without canonical expenditure migrate legacy per-class usage once. Preserve expenditure above a reduced maximum until explicitly restored or rested.

## Tasks
- [x] Add failing lifecycle coverage: shared totals, ability bonuses, both spending entry points, legacy migration, removal/downgrade, rest and edition boundaries.
- [x] Centralize PP calculations in manifesting35.js; reuse them in legacySpecialCasting.js. Keep per-class profiles, replace independent counters with one derived reserve.
- [x] Route resource adjustments/rest to canonical expenditure; prevent editing the automatic PP reserve into another independent pool.
- [x] Update browser regression to prove tracker/spellbook agreement, manifestation, save/reopen and rest. Expand workflow paths.
- [ ] Run focused tests, npm test, build and certification; review changes and push the existing branch.

## Review focus
Stale serialized counter usage must never override canonical expenditure. Repeated migration must not charge twice. Downgrade/removal must not refund spending. Unreviewed classes retain only supported table contributions. Non-3.5 classes and custom counters retain their behavior.

## Verification and review
- Shared reserve regression: RED (two pools instead of one), then GREEN.
- Independent review found resource-operation migration loss before normalization. New assertions reproduced it; adjustment/rest patches now retain migrated expenditure. RED to GREEN.
- Review also found a bonus-only saved value could expose a 3.5 counter in another edition. Treated as an edition-boundary regression, reproduced and fixed. No review findings deferred.
- Existing certification failure reproduced: metadata families omitted complete source IDs. Restored IDs without weakening assertions; coverage regression is GREEN.
- Full `npm test`, all certification test steps, catalog lifecycle (2,063 cases across 1,054 classes), class integration, multiclass casting, focused casting/resources tests and three affected browser suites passed locally. Ledger/queue validation passed, with no newly certified records.
