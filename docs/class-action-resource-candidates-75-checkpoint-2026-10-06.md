# Action/resource candidate batch of 75

PR #8 remains draft on `codex/class-integration-engine`. This is an implementation checkpoint, not a class-completion certification.

- Candidate manifest: `docs/class-action-resource-candidates-75-2026-10-06.json`.
- Candidates: 75 exact IDs; 74 reuse existing source packets. The missing Storm Sentry packet was recovered using Exa and Tavily, with the Pathfinder conversion explicitly excluded.
- Newly completed: 0. Tracker needs-review remains 914. Full conditional effects and subsystem gaps remain open.
- The executable preflight checks every candidate's exact source identity and packet association, then records live grants, actions, resources, choices, and empty feature sets in the CI artifact. No completion flags are inferred from prose or empty feature lists.

## Shared fixes discovered while preparing the batch

Multiple bonus-feat selections previously retained only the last selected feat. The new regression failed in GitHub run [37568377194](https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/37568377194). The shared choice helper now adds each missing source-owned feat without deleting its siblings; reopening also repairs partial materialization. The regression and 75-record preflight passed at `31f0572`; its full CI was superseded by the next parser regression.

The initial preflight found seven empty feature sets. Three candidates have legitimate named class-level headers that generic consumers did not recognize: Elven High Mage, Guardian Paramount, and Legendary Dreadnought. The parser regression failed as expected in [37568646813](https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/37568646813). The shared parser now recognizes a header matching the record's own name when the table has feature columns and contiguous individual levels. Companion stat headers, level ranges, and other class names are excluded. Canonical source data is not mutated. These remain pending full epic-system automation; parsing their tables does not complete them.

Black Dog's imported primary table contains poison recipes; Elemental Archon's contains companion progression. Their actual class tables were recovered from the exact pages, cross-checked against source-faithful alternatives, and added as narrowly scoped data repairs. Repairs require exact ID, name, book, and the full known damaged table to match; auxiliary data is retained separately and custom table edits are preserved. The regression failed as expected in [run 37568872583](https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/37568872583). Faith Scion and Mystic Theurge have casting-only tables; a zero generic feature count alone is not evidence of corrupted source data.

## Verification

The preceding Wave 2 integration checkpoint passed full modernization run [37562964555](https://github.com/mahdt17/DND-Charactersheet-Website/actions/runs/37562964555) at `2ed8ed9ce8f97813e040908881b48c8da3765a06`. This batch requires fresh full modernization CI after the parser and table-repair implementations. Neither green generic lifecycle tests nor recovered source packets satisfy the full per-class completion standard.
