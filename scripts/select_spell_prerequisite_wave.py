"""Select safe prerequisite regression locks for 3.5 spell references.

This tool never approves summaries or mutates catalogs. It consumes the
fail-closed reference selector diagnostics and exposes only reference targets
whose dependents were rejected for exactly one reason:
reference-target-not-regression-locked. All other source, parser, reference,
table, queue, and review checks have therefore already passed.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


ONLY_BLOCKER = ["reference-target-not-regression-locked"]


def select_wave(reference_batch: dict, count: int) -> dict:
    if count < 0:
        raise ValueError("count must be non-negative")
    if not reference_batch.get("reviewOnly"):
        raise ValueError("reference batch is not explicitly review-only")
    if reference_batch.get("catalogMutation") is not False:
        raise ValueError("reference batch does not explicitly forbid catalog mutation")

    by_target: dict[str, dict] = {}
    for rejected in reference_batch.get("rejectedEntries") or []:
        if rejected.get("reasons") != ONLY_BLOCKER:
            continue
        references = rejected.get("references") or []
        if len(references) != 1:
            raise ValueError(
                f"{rejected.get('id')} has the sole prerequisite blocker but "
                "does not contain exactly one reference diagnostic"
            )
        reference = references[0]
        target_id = reference.get("targetId")
        candidate_ids = reference.get("candidateIds") or []
        if (
            reference.get("status") != "resolved"
            or not target_id
            or candidate_ids != [target_id]
        ):
            raise ValueError(
                f"{rejected.get('id')} has a non-unique prerequisite target"
            )
        target = by_target.setdefault(
            target_id,
            {
                "targetId": target_id,
                "targetName": reference.get("targetName"),
                "targetSourceBook": reference.get("targetSourceBook"),
                "dependents": [],
            },
        )
        current_identity = (
            target.get("targetName"),
            target.get("targetSourceBook"),
        )
        incoming_identity = (
            reference.get("targetName"),
            reference.get("targetSourceBook"),
        )
        if current_identity != incoming_identity:
            raise ValueError(f"conflicting prerequisite identity for {target_id}")
        target["dependents"].append(
            {
                "id": rejected.get("id"),
                "name": rejected.get("name"),
                "sourceBook": rejected.get("sourceBook"),
                "headerDifferences": reference.get("headerDifferences") or [],
            }
        )

    eligible = list(by_target.values())
    for entry in eligible:
        entry["dependents"].sort(
            key=lambda row: (row.get("id") or "", row.get("name") or "")
        )
    eligible.sort(
        key=lambda entry: (
            -len(entry["dependents"]),
            entry.get("targetId") or "",
        )
    )
    if count > len(eligible):
        raise ValueError(
            f"requested {count} prerequisite targets but only {len(eligible)} are eligible"
        )
    selected = eligible[:count]
    fingerprint = "\n".join(
        f"{entry['targetId']}:{','.join(row['id'] for row in entry['dependents'])}"
        for entry in selected
    )
    return {
        "reviewOnly": True,
        "catalogMutation": False,
        "selectionPolicy": "sole-missing-regression-lock-prerequisite-wave-v1",
        "requestedCount": count,
        "eligibleCount": len(eligible),
        "selectedCount": len(selected),
        "selectionSha256": hashlib.sha256(fingerprint.encode("utf-8")).hexdigest(),
        "entries": selected,
    }


def run_self_test() -> None:
    payload = {
        "reviewOnly": True,
        "catalogMutation": False,
        "rejectedEntries": [
            {
                "id": "spells/mass-a",
                "name": "Mass A",
                "sourceBook": "Book",
                "reasons": ONLY_BLOCKER,
                "references": [{
                    "status": "resolved",
                    "candidateIds": ["spells/base"],
                    "targetId": "spells/base",
                    "targetName": "Base",
                    "targetSourceBook": "Book",
                    "headerDifferences": [{"field": "target"}],
                }],
            },
            {
                "id": "spells/mass-b",
                "name": "Mass B",
                "sourceBook": "Book",
                "reasons": ONLY_BLOCKER,
                "references": [{
                    "status": "resolved",
                    "candidateIds": ["spells/base"],
                    "targetId": "spells/base",
                    "targetName": "Base",
                    "targetSourceBook": "Book",
                    "headerDifferences": [{"field": "duration"}],
                }],
            },
            {
                "id": "spells/unsafe",
                "name": "Unsafe",
                "sourceBook": "Book",
                "reasons": [
                    "reference-target-not-regression-locked",
                    "reference-target-source-incomplete",
                ],
                "references": [{
                    "status": "resolved",
                    "candidateIds": ["spells/unsafe-base"],
                    "targetId": "spells/unsafe-base",
                    "targetName": "Unsafe Base",
                    "targetSourceBook": "Book",
                }],
            },
        ],
    }
    measured = select_wave(payload, 0)
    assert measured["eligibleCount"] == 1
    assert measured["selectedCount"] == 0
    selected = select_wave(payload, 1)
    assert selected["entries"][0]["targetId"] == "spells/base"
    assert [row["id"] for row in selected["entries"][0]["dependents"]] == [
        "spells/mass-a",
        "spells/mass-b",
    ]
    try:
        select_wave(payload, 2)
    except ValueError:
        pass
    else:
        raise AssertionError("oversized prerequisite wave did not fail closed")
    print("PASS prerequisite wave selector self-test")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reference-batch", type=Path)
    parser.add_argument("--count", type=int, default=0)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        run_self_test()
        return
    if not args.reference_batch or not args.output:
        parser.error("--reference-batch and --output are required")
    payload = json.loads(args.reference_batch.read_text(encoding="utf-8"))
    result = select_wave(payload, args.count)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "requestedCount": result["requestedCount"],
                "eligibleCount": result["eligibleCount"],
                "selectedCount": result["selectedCount"],
                "selectionSha256": result["selectionSha256"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
