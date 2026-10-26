# 2014 Variant Human setup

User-approved scope: only add the optional 2014 Human race to 5e setup. The Archivist investigation and progression work are cancelled; no Archivist product changes were made.

Design: a separate Variant Human (2014 optional rule) catalog choice, using the existing race, skill and feat controls. Grant +1 to two distinct abilities, one new skill and exactly one eligible first-level 2014 feat. Keep standard Human and 2024 Human unchanged. Common plus one chosen language, Medium size and 30-foot speed remain Human traits. Preserve unrelated class feats. Persist normal creator data; no character presets.

Plan:
1. Add failing rules and creator tests. Implement source-identified race data, validation and bounded racial feat selection using existing feat controls.
2. Verify real creation, changing race, save/reopen, Standard Human and source isolation. Run the full rules suite and production build.
3. One fresh independent review of the scoped change; address meaningful findings and report the result.

Review focus: distinct abilities/skills, first-level feat prerequisites and required magic choices, retaining class feats, race changes, 2014/2024 boundaries, saved selections. No Archivist or dice changes.

Progress: isolated branch codex/variant-human-5e, base ba2c526. Initial state contained only cancelled planning files; removed them. Implement inline with TDD.

Verification: rules tests first failed for the absent option/validation, then passed. Full npm test and production build passed. Browser created and reopened Variant Human, Standard Human and Custom2014 Magic Initiate. Fresh independent review found two important navigation cases; both reproduced with failing browser assertions, then fixed: validate racial magic choices at Review, and clear incompatible optional Human on base-mechanics changes. No Archivist or dice files changed.

Final checks: full npm test PASS; production build PASS (existing large-chunk warning); browser-variant-human PASS including both reproduced navigation regressions, normal/Custom2014 creation, Magic Initiate completion, Standard Human and saved choices. Review fixes verified; no deferred findings.
