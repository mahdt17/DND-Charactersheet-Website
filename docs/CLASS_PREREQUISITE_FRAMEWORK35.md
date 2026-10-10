# Shared prerequisite and audit framework

This batch continues PR #8 from `464d58d2bef708a6a62550b0aebe082e60ac18ca`.
It does not change source class records, tracker statuses, certification evidence,
Supabase, or deployment configuration.

## Runtime contract

`requirements(record, character, confirmations, options)` remains the entry point
used by class entry, feat eligibility, and the Requirements UI. New predicates use
`kind` (or the existing `type` alias):

| Predicate | Fields | Meaning |
| --- | --- | --- |
| `all` | `requirements` | Every child must be met. |
| `any` | `requirements` | At least one child must be met. |
| `count` | `requirements`, positive integer `minimum` | At least that many children must be met. |
| `feat_count` | `featType` or `featTypes`, `minimum` | Count distinct owned feats of the specified types. |
| `skill_count` | `ranks`, `minimum` | Count distinct skills meeting the rank threshold. |
| `feat` | `name` and/or `featId`, optional `subject` | Check exact identity and subject when supplied. |
| `proficiency` | `proficiencyKind`, `name` and/or `index` | Check recorded training, excluding source-only prose. |

Groups use three values internally: true, false, unresolved. A false child is
decisive for AND; a true child is decisive for OR. Count groups remain unresolved
when unknown children could change the outcome. Empty or malformed groups stay
manual. Existing narrative requirements and confirmation IDs remain supported;
structured groups have separate identities, including when they use `type`.

`subject: '$subject'` refers to `options.subject`, defaulting to
`record.featSubject`. A proficiency may similarly use `name: '$subject'`.
`options.equipment` supplies the existing equipment catalog for weapon category
membership. The evaluator reuses the training engine for category grants and
starting proficiencies. Without enough category/range metadata, it leaves the
requirement manual instead of denying proficiency. Owning training does not
imply owning the corresponding named feat.

Only fully matched source grammar is lowered: typed feat counts, ranked skill
counts, unambiguous named alternatives, and scoped Knowledge alternatives.
Mixed or narrative clauses remain manual. The Two-Weapon Fighting name is no
longer mistaken for a quantity instruction. No class-name branches are added.

Source feat choices start from reconciled feats, then include valid earlier
choices in the same transaction. Fixed class feats can unlock later choices;
retired automatic feats cannot. Template choices share the same subject across
feat and proficiency predicates. Existing ownership, reload repair, milestone
identity, and removal handling are reused.

## Measured scope

`node scripts/audit_prerequisite_coverage35.mjs test-results/prerequisite-coverage35.json`
generates exact source IDs and the recognized source clauses. At the checkpoint:

- 23 class records have recognized typed feat counts.
- 5 have ranked skill counts.
- 2 have named feat alternatives.
- 1 has a scoped ranked skill alternative.
- 3 gain the Two-Weapon name correction.
- The union is **33** class records; Fortune's Friend overlaps two groups.

This measures newly computable clauses, not complete entry eligibility or
complete class automation. Structured subject/training support and transaction
repairs are additionally covered by runtime fixtures; no catalog-wide unblock
count is inferred for those mechanisms.

## Certification audit

The queue now checks reviewed grants and training reviews in the exact layered
runtime catalog, as well as the legacy supplements. It retains provenance and
explicitly marks feature evidence as partial. This corrects 37 missing-feature
and 53 missing-training diagnostics across **54** exact records. Every original
tracker blocker and missing certification axis is retained.

Both ledger and queue include deterministic clusters for evidence axes, stored
cohorts, diagnostic codes, and original blocker text. Counts deduplicate exact
source IDs within each group; groups overlap. Cohorts and text labels are
planning estimates, not verified implementation deficits. Unmatched blockers
remain in `unmapped`.

Before and after: **1,054 total; 0 certified; 927 blocked; 127 pending**.
The explicit certification manifest is still empty. No generic test or profile
presence is substituted for exact-record evidence across all eleven axes.

## Verification

New runtime/audit tests run in `npm test`; focused workflows run them too.
The certification workflow publishes prerequisite coverage with its ledger.
`tests/browser-source-prerequisites35.mjs` exercises the actual React choice and
requirements components, save/reload, and source removal. Existing full-app
browser suites remain in the modernization workflow. Windows runs omit the
Linux process flags that crashed Chromium; Linux launch behavior is preserved.

RED/GREEN regressions cover nested groups, confirmation collisions, named
alternatives, same-transaction feats, restored/retired grants, weapon categories,
reviewed-profile false diagnostics, and blocker preservation. Full CI remains
the authoritative branch checkpoint; inspect the run for the exact tested SHA.

Next useful work: apply the structured prerequisite vocabulary to reviewed
casting-level/known-spell requirements using the existing per-class casting
profiles, then establish exact-record evidence for candidates whose remaining
mechanics and lifecycle already have deterministic tests. Do not clear compound
tracker gaps merely because a shared entry predicate is now supported.
