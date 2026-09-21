"""Build a review-only manifest for the remaining 3.5 spell repair lane.

This selector does not approve repairs and never mutates catalog content. It groups
repair-queue records by review complexity so independently verified repairs can be
handled in safe micro-batches instead of one record at a time.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

LANE_PRIORITY = {
    "source-marker-standalone": 0,
    "structural-standalone": 1,
    "reference-plus-repair": 2,
    "table-repair": 3,
}

def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))

def compact_source(text: str, limit: int = 720) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    if len(text) <= limit:
        return text
    half = (limit - 5) // 2
    return text[:half].rstrip() + " ... " + text[-half:].lstrip()

def choose_lane(item: dict, row: dict) -> str:
    if row.get("tables"):
        return "table-repair"
    if item.get("referenceNames") or item.get("externalMechanicsReasons"):
        return "reference-plus-repair"
    if row.get("sourceIncomplete") and row.get("sourceIncompleteMarker"):
        return "source-marker-standalone"
    return "structural-standalone"

def build_manifest(classification: dict, review: dict, count: int) -> dict:
    if classification.get("reviewOnly") is not True or classification.get("catalogMutation") is not False:
        raise ValueError("classification must be review-only and catalogMutation=false")
    validation = classification.get("knownCorpusValidation") or {}
    if validation.get("errors") or validation.get("warnings"):
        raise ValueError("classification has corpus validation errors/warnings")
    if review.get("reviewOnly") is not True or review.get("errors"):
        raise ValueError("review input is not a clean review-only artifact")

    review_by_id = {row.get("id"): row for row in review.get("entries") or []}
    repair_items = [
        item for item in classification.get("entries") or []
        if item.get("primaryBucket") == "repair-queue"
    ]

    marker_counts = Counter()
    reason_counts = Counter()
    lane_counts = Counter()
    candidates = []

    for item in repair_items:
        record_id = item.get("id")
        row = review_by_id.get(record_id)
        if not row:
            raise ValueError(f"repair classification missing review row: {record_id}")

        marker = row.get("sourceIncompleteMarker")
        reasons = list(item.get("suspiciousReasons") or [])
        if marker:
            marker_counts[marker] += 1
        reason_counts.update(reasons)

        lane = choose_lane(item, row)
        lane_counts[lane] += 1
        tags = set(item.get("tags") or [])
        candidates.append({
            "id": record_id,
            "name": item.get("name"),
            "url": item.get("url"),
            "sourceBook": item.get("sourceBook"),
            "sourceSha256": item.get("sourceSha256"),
            "lane": lane,
            "sourceIncomplete": bool(row.get("sourceIncomplete")),
            "sourceIncompleteMarker": marker,
            "sourceIncompleteResolved": bool(row.get("sourceIncompleteResolved")),
            "supplementVerified": bool(row.get("supplementVerified")),
            "existingSupplement": "existing-supplement" in tags,
            "existingRegression": "existing-regression" in tags,
            "tablePresent": bool(row.get("tables")),
            "tablesSha256": item.get("tablesSha256"),
            "referenceNames": list(item.get("referenceNames") or []),
            "externalMechanicsReasons": list(item.get("externalMechanicsReasons") or []),
            "suspiciousReasons": reasons,
            "sourceExcerpt": compact_source(row.get("effectSource") or ""),
        })

    for candidate in candidates:
        marker = candidate.get("sourceIncompleteMarker")
        candidate["sourceIncompleteMarkerQueueImpactCount"] = marker_counts.get(marker, 0) if marker else 0
        candidate["suspiciousReasonQueueImpactCounts"] = {
            reason: reason_counts[reason]
            for reason in candidate.get("suspiciousReasons") or []
        }

    # Prefer isolated standalone repairs with explicit source markers. Records that
    # already have supplements/regressions are retained but sorted later so fresh,
    # independently reviewable source gaps are surfaced first.
    candidates.sort(key=lambda item: (
        LANE_PRIORITY[item["lane"]],
        item["existingSupplement"],
        item["existingRegression"],
        len(item["externalMechanicsReasons"]),
        len(item["referenceNames"]),
        item["sourceIncompleteMarkerQueueImpactCount"] or 10**9,
        (item.get("name") or "").casefold(),
        item.get("id") or "",
    ))

    selected = candidates[:max(0, count)]
    selection_digest = hashlib.sha256(
        "\n".join(item["id"] for item in selected).encode("utf-8")
    ).hexdigest()

    return {
        "schemaVersion": 1,
        "reviewOnly": True,
        "catalogMutation": False,
        "purpose": "Repair-lane discovery manifest; every selected record still requires independent source review before any repair is approved.",
        "selectionPolicy": {
            "primaryBucket": "repair-queue",
            "priorityOrder": [
                "source-marker-standalone",
                "structural-standalone",
                "reference-plus-repair",
                "table-repair",
            ],
            "existingSupplementAndRegressionRecordsSortedLater": True,
        },
        "repairQueueCount": len(candidates),
        "laneCounts": dict(sorted(lane_counts.items())),
        "sourceIncompleteMarkerCounts": dict(sorted(marker_counts.items())),
        "suspiciousReasonCounts": dict(sorted(reason_counts.items())),
        "selectedCount": len(selected),
        "selectionSha256": selection_digest,
        "candidates": selected,
    }

def self_test() -> None:
    review = {
        "reviewOnly": True,
        "errors": [],
        "entries": [
            {
                "id": "spells/a",
                "effectSource": "Broken standalone source text.",
                "sourceIncomplete": True,
                "sourceIncompleteMarker": "broken-a",
                "sourceIncompleteResolved": False,
                "supplementVerified": False,
                "tables": [],
            },
            {
                "id": "spells/b",
                "effectSource": "Broken table source.",
                "sourceIncomplete": True,
                "sourceIncompleteMarker": "broken-table",
                "sourceIncompleteResolved": False,
                "supplementVerified": False,
                "tables": [[["d6", "Effect"]]],
            },
            {
                "id": "spells/c",
                "effectSource": "Broken source that also refers to another spell.",
                "sourceIncomplete": True,
                "sourceIncompleteMarker": "broken-ref",
                "sourceIncompleteResolved": False,
                "supplementVerified": False,
                "tables": [],
            },
            {
                "id": "spells/d",
                "effectSource": "Structurally suspicious standalone source.",
                "sourceIncomplete": False,
                "sourceIncompleteMarker": None,
                "sourceIncompleteResolved": False,
                "supplementVerified": False,
                "tables": [],
            },
        ],
    }
    classification = {
        "reviewOnly": True,
        "catalogMutation": False,
        "knownCorpusValidation": {"errors": [], "warnings": []},
        "entries": [
            {
                "id": "spells/a", "name": "A", "url": "u/a", "sourceBook": "X",
                "sourceSha256": "a"*64, "tablesSha256": None,
                "primaryBucket": "repair-queue", "tags": ["suspected-damaged-source"],
                "suspiciousReasons": ["broken-a"], "referenceNames": [],
                "externalMechanicsReasons": [],
            },
            {
                "id": "spells/b", "name": "B", "url": "u/b", "sourceBook": "X",
                "sourceSha256": "b"*64, "tablesSha256": "f"*64,
                "primaryBucket": "repair-queue", "tags": ["suspected-damaged-source", "table-driven"],
                "suspiciousReasons": ["broken-table"], "referenceNames": [],
                "externalMechanicsReasons": [],
            },
            {
                "id": "spells/c", "name": "C", "url": "u/c", "sourceBook": "X",
                "sourceSha256": "c"*64, "tablesSha256": None,
                "primaryBucket": "repair-queue", "tags": ["suspected-damaged-source", "reference-dependent"],
                "suspiciousReasons": ["broken-ref"], "referenceNames": ["example spell"],
                "externalMechanicsReasons": [],
            },
            {
                "id": "spells/d", "name": "D", "url": "u/d", "sourceBook": "X",
                "sourceSha256": "d"*64, "tablesSha256": None,
                "primaryBucket": "repair-queue", "tags": ["suspected-damaged-source"],
                "suspiciousReasons": ["odd-structure"], "referenceNames": [],
                "externalMechanicsReasons": [],
            },
        ],
    }
    out = build_manifest(classification, review, 4)
    assert out["repairQueueCount"] == 4
    assert [x["id"] for x in out["candidates"]] == [
        "spells/a", "spells/d", "spells/c", "spells/b"
    ]
    assert out["laneCounts"]["source-marker-standalone"] == 1
    assert out["laneCounts"]["table-repair"] == 1
    assert out["catalogMutation"] is False
    print(json.dumps({"selfTest": "passed"}, indent=2))

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--classification", type=Path)
    ap.add_argument("--review", type=Path)
    ap.add_argument("--count", type=int, default=25)
    ap.add_argument("--output", type=Path)
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()

    if args.self_test:
        self_test()
        return
    if not args.classification or not args.review or not args.output:
        ap.error("--classification, --review and --output are required unless --self-test is used")

    out = build_manifest(load(args.classification), load(args.review), args.count)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "repairQueueCount": out["repairQueueCount"],
        "laneCounts": out["laneCounts"],
        "selectedCount": out["selectedCount"],
        "selectionSha256": out["selectionSha256"],
        "catalogMutation": out["catalogMutation"],
    }, indent=2))

if __name__ == "__main__":
    main()
