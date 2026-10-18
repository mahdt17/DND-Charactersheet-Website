# Independent converted classes

**Goal:** Keep the approved 2014/5e conversions, but let players start at level 1 and choose each class, feat and power. The PDF is an example build, not a product preset.

**Architecture:** Retain saved class IDs and expenditure. Route all advancement through the existing class chooser. Separate class spell access from shared multiclass slots. Migrate already granted preset choices once, without granting future planned feats.

**Tech stack:** React, pure JavaScript rule modules, Vite and Playwright.

- [x] Add regressions for independent feats/powers, mixed slots/features/resources, prestige eligibility, and old-save migration.
- [x] Remove preset creation/advancement from the UI; implement ordinary ASI and class bonus choices.
- [x] Integrate prayerbook selection with other spellbooks; retain shared expenditure and class-specific spell access.
- [x] Reproduce and fix Dark Knowledge controls, including roll feedback, validation, resource spending, rest and persistence.
- [x] Verify normal level-1 creation, multiclass advancement and backwards compatibility in browser and rules tests.
- [ ] Review, publish a correction PR, wait for checks, merge and verify live deployment.

No new campaign race, scores, equipment, feats or advancement order are imposed. Conversion defaults remain adjustable. Legacy preset helpers exist only to reproduce old saved characters in compatibility tests.

Review found and fixed a migration issue that froze PP at the old level-one default. Browser regression also verifies outside acquisitions do not reduce free class-growth spells.

Independent review also caught Pact Magic access and saved bonus-feat migration (including repeated feats); both now have rules and browser coverage.
