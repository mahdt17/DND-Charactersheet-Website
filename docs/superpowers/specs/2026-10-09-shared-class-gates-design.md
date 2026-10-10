# Shared class gates and audit accuracy

Continue `codex/class-integration-engine` and draft PR #8 from verified head
`464d58d2bef708a6a62550b0aebe082e60ac18ca`. Do not merge, deploy, edit main,
or modify Supabase. The user explicitly requests autonomous implementation
and independent parallel audits; further design approvals are not required.

The baseline ledger has 1,054 classes: 0 certified, 927 blocked, 127 pending.
Every evidence axis is missing because the explicit evidence manifest is empty.
Existing source-owned choice, companion, spell acquisition, and progression
engines must be reused. This batch addresses shared prerequisites and audit
accuracy rather than rebuilding those engines or clearing class-specific gaps.

## Runtime design

Extend the existing requirements entry point with three-valued structured
AND, OR, and count predicates. Unknown clauses stay unresolved; a known false
AND or known true OR remains decisive. Empty, malformed, and unknown nodes
must never silently qualify a character. Preserve manual confirmation for
unresolved source conditions and stable identity for existing textual checks.

Use exact feat subjects and source identities when specified. Count unique
typed feats and distinct ranked skills. Lower only fully matched, closed
source-text grammars, including typed feat counts, skill counts, and named
alternatives. Do not infer ambiguous narrative or malformed source text.
Ordinary Two-Weapon Fighting must not be mistaken for a quantity expression.

Source-defined later feat choices must see feats already chosen in the same
transaction. Parameterized template prerequisites must use the selected
subject; existing ownership, persistence, multiclass coexistence, and removal
must remain intact. Do not invent catalog-wide certification from these tests.

## Audit design

Resolve reviewed feature and training coverage from the same layered catalog
used at runtime. Exact reviewed grant provenance and verified training reviews
can remove missing-profile diagnostics. Raw grants or generic verification
flags cannot prove coverage. Coverage is not completion certification.

Generate deterministic blocker/evidence/cohort clusters with exact source IDs,
original blockers, counts of unique records, and explicit overlap semantics.
Preserve unmapped blockers. Certification continues to require all 11 axes and
no unresolved blockers. Existing tracker claims remain insufficient.

## Alternatives and verification

Per-class patches repeat work and were rejected by the user. Broad prose
parsing risks false qualification; use a narrow grammar and structured data.
A new engine would duplicate established lifecycle handling. Extend the
existing functions and add independent focused modules only where useful.

Tests must demonstrate RED then GREEN for new behavior, exact-source catalog
coverage, malformed/unknown predicates, duplicate subjects/skills, source
cleanup, persistence, and UI consumption. Run npm test, relevant Node and
Python checks, production build, browser suites, and existing full CI.
Report diagnostic reductions separately from fully certified classes.
