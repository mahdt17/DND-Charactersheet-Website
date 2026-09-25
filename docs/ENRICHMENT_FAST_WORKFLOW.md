# Accelerated enrichment review workflow

This workflow increases review throughput without changing the release gates or
allowing catalog writes.

## Per review batch

Every selection and lock commit still runs:

- content/model tests and the enrichment write-lock gate;
- importer, classifier, and every selector self-test;
- exact source-digest and review-corpus validation;
- targeted live-source regressions for every newly locked regression ID; and
- the spell review classifier and deterministic selection fingerprints.

The spell review workflow caches each export shard only while every input that
can affect that shard is byte-for-byte unchanged. A lock commit changes the
review summaries or regression corpus, invalidates the cache, and performs a
fresh 16-shard export. A request-only selection commit may reuse the
immediately preceding measurement shards. Its selected records are fetched
again by the targeted live regression on the lock commit.

## Dependency waves

The prerequisite-wave selector may return a target only when a dependent was
rejected for exactly one reason:

reference-target-not-regression-locked

Any other source, parser, queue, table, ambiguity, sourcebook, suspicious-text,
or incomplete-source blocker excludes the target. Targets shared by multiple
dependents are grouped so one independently reviewed prerequisite lock can
unlock the entire safe wave.

## Automatic full validation

The complete regression/build/browser suite runs when:

- any parser, classifier, supplement, application, test, workflow, or other
  non-review path changes;
- an existing review batch is modified instead of a new immutable batch being
  added;
- the permanent regression corpus removes or reorders an existing ID (the
  scope check fails immediately); or
- the corpus crosses a 50-record boundary.

The full 5,035-record source and candidate/output audit remains a separate
milestone audit. Run it after each 100 newly reviewed summaries, after any
parser or supplement repair, and before claiming category completion.

## Unchanged release rules

- No live/catalog enrichment.
- Never use --write.
- Supabase remains unchanged.
- Reviewed summaries must remain digest-locked to exact primary effect text
  (and table digests where applicable).
- Damaged, contradictory, truncated, or externally delegated primary material
  must use a provenance-backed repair path instead of an ordinary review lock.
- Live writes remain mechanically locked until the independent full source and
  final-output gates both reach 100% with zero critical gaps.
