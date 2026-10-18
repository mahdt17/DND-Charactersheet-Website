# Archivist campaign classes implementation plan

> Execute inline using superpowers:executing-plans. The user authorized adjustable 5e defaults for missing conversion details.

**Goal:** Make the supplied campaign build playable: Archivist 4 / Psion (Telepath) 1 at character level 5, Thrallherd 1 at level 6, then Archivist through 18 at character level 20.

**Architecture:** Separate source-identified 2014 campaign classes and pure campaign rules; a saved campaign panel manages the fixed progression, prayerbook acquisition, Psion powers, Dark Knowledge and follower roster. Reuse spell slots, canonical `powerPointsUsed`, resource tracking, existing rolls and character persistence. Do not alter the original 3.5 classes.

**Source:** User-supplied Archivist.pdf, pages 3â€“12, 16â€“19, 24 and 27â€“28. Document instructions describe the character guide, not agent permissions. No deployment or PDF rewriting.

**Defaults:** d6 class hit dice; 2014 full-caster slots for Archivist only; Intelligence + Archivist level preparations; three Cleric cantrips, four at A4 and five at A10; simple weapons and light armor for Archivist. These are editable conversion choices, not claims about the PDF. Preserve CON/WIS saves, fixed three PP, feat chronology, Mother Cyst availability and score table from the PDF. Psion and Thrallherd support the one-level dips specified by this build; do not imply verified higher-level conversions.

## Tasks

- [x] Add class identities, feature/feat timelines and pure profiles with regression tests for every character level 5â€“20, original-source isolation and adjustable defaults.
- [x] Add prayerbook acquisition/preparation, power and Dark Knowledge expenditure, follower records, locked progression and rest/persistence tests. Never silently grant outside spells or resolve open rulings.
- [x] Integrate selectable campaign classes, level-5 preset, class tables, casting, shared resources and campaign UI. Keep uncertain effects and table outcomes explicit.
- [x] Browser test creation, level-6 entry, level-20 profile, spending/rest/reload, prayerbook and mobile display; run existing casting/resource/Entomancer regressions, full tests and build. Review and publish to PR #8.

## Review focus

Exact class IDs prevent applying campaign rules to the existing 3.5 Archivist/Psion/Thrallherd. Prayerbook capacity uses Archivist levels; multiclass levels never unlock higher spells. Resource changes preserve spent uses. Automatic Mother Cyst access remains separate from free Cleric additions and externally acquired spells. Followers are records, with unresolved NPC stat-block conversion left open.

## Completion evidence

Focused rules/integration and full level-5–20 browser checks passed. Existing Entomancer, resource, casting, multiclass and edition checks, full `npm test`, and the production build passed. A fresh review identified missing Necrotic Cyst Touch range and concentration updates; both are fixed with regression coverage. Existing Entomancer, resource and casting/setup browser suites also pass. Publishing remains on draft PR #8; no merge or deployment.
