# Research and verification pipeline

GitHub/repository data remains authoritative. Web providers retrieve evidence; they do not become a second verification database. Supabase remains runtime-only for this work.

## Routing

1. Exa discovers likely exact and authoritative source pages plus alternates.
2. Tavily performs default page extraction and crawling.
3. `scripts/validate_extraction.mjs` applies deterministic completeness gates.
4. If validation fails, retry Tavily intelligently or use an alternate Exa-discovered source.
5. Firecrawl is a last-resort fallback only when required mechanics remain unresolved.
6. Deep AI/manual review is reserved for exceptions. Passing records move to project normalization, automation tests, and regression checks.

A prettier extraction is not a reason to fall back. Fallback requires an objective failure such as missing content, damaged tables, identity/edition ambiguity, contamination, source conflict, or unsafe mechanics reconstruction.

## Batch selection

Generate candidate classes from the existing canonical tracker:

    node scripts/select_class_research_batch.mjs docs/class-completion-tracker.json --limit=25 > test-results/class-research-batch.json

Research orchestration should add retrieval provider, extracted content, detected edition, identity confirmation, required-field completeness, mechanics-safety, conflict flags, and record-specific expectations. Then validate:

    node scripts/validate_extraction.mjs test-results/class-extractions.json

Only failed records should enter alternate-source or fallback review.

## Progress reporting

Generate repository-derived reporting data:

    node scripts/generate_progress_report.mjs docs/class-completion-tracker.json --output=test-results/project-progress.json

The Excel dashboard consumes generated repository report data. It is reporting only and must not require manual per-record synchronization.

## Cost boundary

Firecrawl capacity is deliberately reserved for difficult cases. Ordinary source discovery and extraction belong on Exa and Tavily.
