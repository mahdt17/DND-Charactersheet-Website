# D&D 3.5 Class Completion Certification

A tracker label such as `complete`, `reviewed`, `integrated`, or `pending_audit` is not proof that a class is finished. A class is excluded from the completion-review queue only when `docs/class-completion-evidence35.json` contains an explicit `certify: true` entry, every required proof axis is populated, and no blocker remains.

Required proof axes are: source identity/book/version, prerequisites, skills and proficiencies, mechanics and conditional effects, source choices/prompts, progression/table/spell behavior, runtime level-up behavior, UI representation, persistence/idempotence, source-removal cleanup, and regression coverage.

`npm run class:certify` generates the machine-readable ledger. `npm run review:completion:queue` produces the fail-closed queue. CI publishes the generated ledger, queue, next research batch, and non-certifying candidate inventory as the `class-completion-certification35` artifact.

Research selection is separate from certification. `scripts/select_class_research_batch.mjs` dynamically scans structured review, verification, finalization, candidate, ordinary, and wave JSON artifacts and avoids re-researching exact class IDs already represented there. This does not certify them; it only preserves prior source-review work.

`scripts/class_certification_candidates35.mjs` similarly inventories exact-record deterministic tests and reviewed artifacts for blocker-free pending records. It is a discovery aid only: `readyForAutomaticCertification` remains false, and a candidate does not become certified until every required axis is explicitly reviewed and mapped in the evidence manifest.

Known gaps, source conflicts, extraction failures, unresolved sources, and validation failures are blockers. Missing evidence always leaves a class `certification-pending`; blockers yield `blocked`; only explicit, complete, blocker-free evidence yields `certified-complete`.

Each evidence entry must bind `sourceId` to its exact tracker record, provide a full 40-character `verifiedCommit`, and name a GitHub Actions run in this repository as `ciRunUrl`. Tracker metadata is displayed for historical context but cannot fill missing certification provenance. An explicit `blocked` tracker status remains a blocker even if its gaps array is empty.

Every axis accepts a repository-relative path string or a nonempty array of such strings. Every reference must be declared in `evidencePaths`. Empty objects, booleans, numbers, whitespace, traversal paths and partially malformed arrays do not count as proof. Invalid metadata is exposed as `evidenceValidationErrors` in both the ledger and review queue.

Generated certification now also validates every declared evidence artifact before it can certify a record. Referenced paths must stay inside the repository evidence root, exist as regular files, be readable as UTF-8, and contain the exact `classes/...` source ID being certified. Missing files, directories, symlinks, unreadable files, traversal attempts, and artifacts that only mention a different same-name class fail closed.

Artifact validation proves repository presence and exact-record identity, not semantic sufficiency. Before setting `certify`, review the referenced artifacts to ensure they actually cover the source/book/version and all required mechanics, verify the referenced commit and successful CI run, and resolve every blocker. The validator does not independently prove that a commit exists, that a CI URL concluded successfully, or that a file mentioning a class proves every axis assigned to it.

CI checks that the queue contains exactly the uncertified ledger IDs, with no duplicates or omissions. A legitimately certified record may leave the queue; uncertified records formerly labeled complete keep their warning.
