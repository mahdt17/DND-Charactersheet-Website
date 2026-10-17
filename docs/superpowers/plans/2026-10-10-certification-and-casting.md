# Certification integrity and casting eligibility plan

Goal: prevent false completion evidence and reuse reviewed casting progression
for class-entry checks, without broad class-specific patches.

Use Superpowers test-driven development and verification before completion.
The user's standing authorization is autonomous continuation on the existing
branch and PR, without merging, deployment, main or Supabase changes.

## Design and boundaries

Certification must reject truthy placeholders, cross-record evidence, missing
commit/CI provenance and explicitly blocked tracker records. Axis references
must be nonempty repository-relative paths declared in evidencePaths. Structural
validation is not a claim that an artifact proves mechanics; review remains
mandatory before setting certify. Preserve all eleven axes and every blocker.
Queue CI must verify the exact uncertified set, allowing genuine certifications
to leave the queue. Do not promote any records in this batch.

Casting eligibility will reuse spellSlotProgression and exact reviewed casting
metadata. It must distinguish spell level from caster level, arcane from divine,
printed zero from a dash, actual ability from save DC ability, and source-owned
advancement from stale saved totals. Unmodeled abilities, casting variants,
staged entry requirements and cross-clause alternatives remain manual. No
personal slot overrides, spell-like abilities or same-name source substitution
may imply qualification. Existing spell ownership/preparation remains intact.

## Tasks

- [x] Observe malformed evidence regression fail, implement strict structural
  validation in class_completion_certification35.mjs, and test valid proof plus
  missing/cross-record/malformed provenance and explicit blockers.
- [x] Replace the workflow's all-records queue assumption with an exact-set
  ledger/queue validator; test missing, duplicate and certified queue entries.
- [x] Add casting capability tests through requirements, then implement an
  exact-source capability adapter and conservative full-clause parser. Keep
  unknown source scope manual. Quantify exact source IDs from the catalog.
- [x] Exercise real UI choices and advancement, save/reload, source removal,
  ordinary casting regressions, certification, build and browser suites.
- [ ] Review diff, publish on the existing branch, and verify all CI checks.

Review focus: malformed evidence mixed with valid refs; metadata inherited from
the tracker; orphaned/duplicate advancements; low casting ability and printed
zero slots; multiclass tradition separation and same-name unreviewed sources.

Local checkpoint: full npm and additional Node/Python suites, production build,
and all browser suites passed. The new browser fixture initially selected the
wrong control and included an unrelated Wizard bonus-feat choice; both fixture
issues were corrected and its standalone regression passed. Fresh review
findings for nonfinite scores, coerced metadata, and conflicting source/target
identities were reproduced and fixed with regression tests. Exact casting
clause coverage is 151 records; certification remains 0/127/927.
