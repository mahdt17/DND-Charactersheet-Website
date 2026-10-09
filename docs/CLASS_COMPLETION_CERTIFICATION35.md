# D&D 3.5 Class Completion Certification

A tracker label such as `complete`, `reviewed`, `integrated`, or `pending_audit` is not proof that a class is finished. A class is excluded from the completion-review queue only when `docs/class-completion-evidence35.json` contains an explicit `certify: true` entry, every required proof axis is populated, and no blocker remains.

Required proof axes are: source identity/book/version, prerequisites, skills and proficiencies, mechanics and conditional effects, source choices/prompts, progression/table/spell behavior, runtime level-up behavior, UI representation, persistence/idempotence, source-removal cleanup, and regression coverage.

`npm run class:certify` generates the machine-readable ledger. `npm run review:completion:queue` produces the fail-closed queue. CI publishes the generated ledger, queue, and next research batch as the `class-completion-certification35` artifact.

Research selection is separate from certification. `scripts/select_class_research_batch.mjs` dynamically scans structured review, verification, finalization, candidate, ordinary, and wave JSON artifacts and avoids re-researching exact class IDs already represented there. This does not certify them; it only preserves prior source-review work.

Known gaps, source conflicts, extraction failures, unresolved sources, and validation failures are blockers. Missing evidence always leaves a class `certification-pending`; blockers yield `blocked`; only explicit, complete, blocker-free evidence yields `certified-complete`.
