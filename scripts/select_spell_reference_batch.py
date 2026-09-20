"""Select a deterministic, fail-closed batch of resolved 3.5 spell references.

This tool is review-only. It selects only reference-dependent records whose single
spell dependency resolves to a permanently regression-locked, self-contained
primary-source record. It never mutates catalogs or approves summaries.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import classify_spell_review_queue as classifier
import enrich_dndtools as d35


ALLOWED_TAGS = {
    "reference-dependent",
    "external-mechanics-reference",
    "manual-verification-required",
}

LEGACY_REFERENCE_SOURCE_BOOKS = {
    "Ghostwalk",
    "Savage Species",
}


ALLOWED_EXTERNAL_REASONS = {
    "leading-inherited-spell",
    "similar-to-named-spell-comparison",
    "as-with-named-spell",
    "receives-named-spell-inheritance",
    "named-effect-shorthand",
    "parenthetical-as-the-spell",
    "named-spell-benefit",
    "generic-identical-with",
}


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def candidate_reasons(
    classified: dict,
    packet: dict,
    queue_ids: set[str],
    regression_ids: set[str],
) -> list[str]:
    reasons: list[str] = []
    record_id = classified.get("id")
    source = packet.get("effectSource") or ""

    # Phrases like "except as noted above" delegate mechanics to header fields
    # (target/range/area/duration/save) that are not present in this review packet.
    # They cannot be flattened safely in this reference-only phase.
    if re.search(r"\bexcept\s+as\s+noted\s+above\b", source, re.I):
        reasons.append("header-dependent-exception")

    if packet.get("id") != record_id:
        reasons.append("classification-packet-id-mismatch")
    if classified.get("primaryBucket") != "reference-dependent":
        reasons.append("not-reference-dependent-primary")
    if classified.get("sourceBook") in LEGACY_REFERENCE_SOURCE_BOOKS:
        reasons.append("legacy-source-edition-needs-manual-reference-review")
    if classified.get("suspiciousReasons"):
        reasons.append("classifier-suspicious-reasons")

    tags = set(classified.get("tags") or [])
    if not tags.issubset(ALLOWED_TAGS):
        reasons.append("disallowed-classifier-tags")

    external_reasons = set(classified.get("externalMechanicsReasons") or [])
    if not external_reasons.issubset(ALLOWED_EXTERNAL_REASONS):
        reasons.append("disallowed-external-mechanics")

    packet_sha = packet.get("sourceSha256")
    actual_source_sha = d35.spell_effect_digest(source)
    if not source.strip():
        reasons.append("empty-effect-source")
    if classified.get("sourceSha256") != actual_source_sha:
        reasons.append("classification-source-sha-mismatch")
    if packet_sha != actual_source_sha:
        reasons.append("packet-source-sha-mismatch")

    # Re-run current detectors so stale artifacts fail closed.
    if classifier.suspicious_reasons(packet):
        reasons.append("current-suspicion-detector-hit")
    current_external = set(classifier.external_mechanics_reasons(source))
    if not current_external.issubset(ALLOWED_EXTERNAL_REASONS):
        reasons.append("current-disallowed-external-mechanics")

    references = packet.get("references") or []
    if len(references) != 1:
        reasons.append("requires-exactly-one-reference")
        return sorted(set(reasons))

    reference = references[0]
    if reference.get("status") != "resolved":
        reasons.append("reference-not-resolved")
        return sorted(set(reasons))

    target = reference.get("record")
    if not target:
        reasons.append("resolved-reference-missing-record")
        return sorted(set(reasons))

    source_book = d35.clean(classified.get("sourceBook") or packet.get("sourceBook") or "")
    target_source_book = d35.clean(target.get("sourceBook") or "")
    if not source_book or not target_source_book:
        reasons.append("reference-sourcebook-missing")
    elif source_book.casefold() != target_source_book.casefold():
        reasons.append("reference-target-sourcebook-mismatch")

    target_id = target.get("id")
    candidate_ids = reference.get("candidateIds") or []
    if len(candidate_ids) != 1 or candidate_ids[0] != target_id:
        reasons.append("reference-candidate-identity-not-unique")

    if target_id == record_id:
        reasons.append("self-reference")
    if target_id in queue_ids:
        reasons.append("reference-target-still-in-review-queue")
    if target_id not in regression_ids:
        reasons.append("reference-target-not-regression-locked")

    if target.get("effectReferenceDependent"):
        reasons.append("reference-target-reference-dependent")
    if target.get("sourceIncomplete"):
        reasons.append("reference-target-source-incomplete")
    if target.get("effectReviewMismatch"):
        reasons.append("reference-target-review-digest-mismatch")
    if target.get("effectReviewTableMismatch"):
        reasons.append("reference-target-table-digest-mismatch")
    if target.get("tables") or target.get("tablesSha256"):
        reasons.append("reference-target-table-driven")

    target_source = target.get("effectSource") or ""
    target_sha = d35.spell_effect_digest(target_source)
    if not target_source.strip():
        reasons.append("reference-target-empty-source")
    if target.get("sourceSha256") != target_sha:
        reasons.append("reference-target-source-sha-mismatch")

    if classifier.suspicious_reasons(target):
        reasons.append("reference-target-current-suspicion-hit")
    if classifier.external_mechanics_reasons(target_source):
        reasons.append("reference-target-current-external-mechanics-hit")
    if classifier.extract_reference_names(target_source):
        reasons.append("reference-target-current-reference-hit")

    counts = packet.get("resolutionStatusCounts") or {}
    if counts != {"resolved": 1}:
        reasons.append("reference-resolution-count-not-exact")

    return sorted(set(reasons))


def select_batch(
    classification: dict,
    packets: dict,
    regressions: dict,
    count: int,
) -> dict:
    errors: list[str] = []
    if not classification.get("reviewOnly") or classification.get("catalogMutation") is not False:
        errors.append("classification artifact is not explicitly review-only")
    if not packets.get("reviewOnly") or packets.get("catalogMutation") is not False:
        errors.append("reference packet artifact is not explicitly review-only")
    validation = classification.get("knownCorpusValidation") or {}
    if validation.get("errors"):
        errors.append("classification known-corpus validation contains errors")
    if validation.get("warnings"):
        errors.append("classification known-corpus validation contains warnings")
    if errors:
        raise ValueError("; ".join(errors))

    regression_ids = set(regressions.get("recordIds") or [])
    queue_entries = classification.get("entries") or []
    queue_ids = {entry.get("id") for entry in queue_entries}
    if None in queue_ids or len(queue_ids) != len(queue_entries):
        raise ValueError("classification contains missing or duplicate record IDs")

    classified_by_id = {entry["id"]: entry for entry in queue_entries}
    packet_entries = packets.get("entries") or []
    packet_ids = [entry.get("id") for entry in packet_entries]
    if None in packet_ids or len(set(packet_ids)) != len(packet_ids):
        raise ValueError("reference packet artifact contains missing or duplicate record IDs")

    eligible: list[dict] = []
    rejected_counts: dict[str, int] = {}
    for packet in packet_entries:
        classified = classified_by_id.get(packet["id"])
        if classified is None:
            rejected_counts["packet-record-not-in-review-queue"] = (
                rejected_counts.get("packet-record-not-in-review-queue", 0) + 1
            )
            continue
        reasons = candidate_reasons(classified, packet, queue_ids, regression_ids)
        if reasons:
            for reason in reasons:
                rejected_counts[reason] = rejected_counts.get(reason, 0) + 1
            continue
        eligible.append(packet)

    eligible.sort(
        key=lambda entry: (
            len(d35.clean(entry.get("effectSource") or "")),
            d35.clean(entry.get("name") or "").casefold(),
            entry.get("id") or "",
        )
    )
    if len(eligible) < count:
        raise ValueError(
            f"requested {count} records but only {len(eligible)} resolved-reference candidates remain"
        )

    selected = eligible[:count]
    fingerprint_lines: list[str] = []
    for entry in selected:
        ref = entry["references"][0]
        target = ref["record"]
        fingerprint_lines.append(
            f"{entry.get('id')}:{entry.get('sourceSha256')}:"
            f"{target.get('id')}:{target.get('sourceSha256')}"
        )
    fingerprint = "\n".join(fingerprint_lines)

    return {
        "reviewOnly": True,
        "catalogMutation": False,
        "selectionPolicy": "resolved-single-reference-same-sourcebook-regression-locked-shortest-first-v2",
        "requestedCount": count,
        "eligibleCount": len(eligible),
        "selectedCount": len(selected),
        "selectionSha256": hashlib.sha256(fingerprint.encode("utf-8")).hexdigest(),
        "rejectedReasonCounts": dict(sorted(rejected_counts.items())),
        "entries": selected,
    }


def run_self_test() -> None:
    base_source = "The subject gains resistance 10 to one energy type."
    base_sha = d35.spell_effect_digest(base_source)
    target = {
        "id": "spells/resist-energy-test",
        "name": "Resist Energy Test",
        "sourceBook": "Player's Handbook v.3.5",
        "sourceSha256": base_sha,
        "tablesSha256": None,
        "tables": [],
        "effectSource": base_source,
        "effectReferenceDependent": False,
        "sourceIncomplete": False,
        "effectReviewMismatch": False,
        "effectReviewTableMismatch": False,
    }

    source = "As resist energy, except that it affects multiple creatures."
    source_sha = d35.spell_effect_digest(source)
    classified = {
        "id": "spells/resist-energy-mass-test",
        "name": "Resist Energy Mass Test",
        "sourceBook": "Player's Handbook v.3.5",
        "sourceSha256": source_sha,
        "primaryBucket": "reference-dependent",
        "tags": ["reference-dependent"],
        "suspiciousReasons": [],
        "externalMechanicsReasons": [],
    }
    packet = {
        "id": classified["id"],
        "name": classified["name"],
        "sourceSha256": source_sha,
        "effectSource": source,
        "references": [{
            "referenceName": "resist energy",
            "normalizedReferenceName": "resist energy",
            "candidateIds": [target["id"]],
            "status": "resolved",
            "record": target,
        }],
        "resolutionStatusCounts": {"resolved": 1},
    }
    report = {
        "reviewOnly": True,
        "catalogMutation": False,
        "knownCorpusValidation": {"errors": [], "warnings": []},
        "entries": [classified],
    }
    packets = {"reviewOnly": True, "catalogMutation": False, "entries": [packet]}
    regressions = {"recordIds": [target["id"]]}

    selected = select_batch(report, packets, regressions, 1)
    assert selected["selectedCount"] == 1
    assert selected["entries"][0]["id"] == classified["id"]

    zero = select_batch(report, packets, regressions, 0)
    assert zero["selectedCount"] == 0
    assert zero["eligibleCount"] == 1

    unresolved = json.loads(json.dumps(packet))
    unresolved["references"][0]["status"] = "ambiguous"
    unresolved["references"][0].pop("record")
    unresolved["resolutionStatusCounts"] = {"ambiguous": 1}
    assert "reference-not-resolved" in candidate_reasons(
        classified, unresolved, {classified["id"]}, {target["id"]}
    )

    assert "reference-target-still-in-review-queue" in candidate_reasons(
        classified, packet, {classified["id"], target["id"]}, {target["id"]}
    )
    assert "reference-target-not-regression-locked" in candidate_reasons(
        classified, packet, {classified["id"]}, set()
    )
    header_dependent = json.loads(json.dumps(packet))
    header_dependent["effectSource"] = "As keen edge, except as noted above."
    header_dependent["sourceSha256"] = d35.spell_effect_digest(header_dependent["effectSource"])
    header_classified = json.loads(json.dumps(classified))
    header_classified["sourceSha256"] = header_dependent["sourceSha256"]
    assert "header-dependent-exception" in candidate_reasons(
        header_classified, header_dependent, {classified["id"]}, {target["id"]}
    )

    legacy_classified = json.loads(json.dumps(classified))
    legacy_classified["sourceBook"] = "Ghostwalk"
    assert "legacy-source-edition-needs-manual-reference-review" in candidate_reasons(
        legacy_classified, packet, {classified["id"]}, {target["id"]}
    )

    cross_book_classified = json.loads(json.dumps(classified))
    cross_book_classified["sourceBook"] = "Complete Arcane"
    assert "reference-target-sourcebook-mismatch" in candidate_reasons(
        cross_book_classified, packet, {classified["id"]}, {target["id"]}
    )

    missing_book_target = json.loads(json.dumps(target))
    missing_book_target.pop("sourceBook")
    missing_book_packet = json.loads(json.dumps(packet))
    missing_book_packet["references"][0]["record"] = missing_book_target
    assert "reference-sourcebook-missing" in candidate_reasons(
        classified, missing_book_packet, {classified["id"]}, {target["id"]}
    )

    print(json.dumps({"selfTest": "passed"}, indent=2))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--classification", type=Path)
    ap.add_argument("--references", type=Path)
    ap.add_argument(
        "--regressions",
        type=Path,
        default=ROOT / "scripts" / "spell_regression_cases.json",
    )
    ap.add_argument("--count", type=int, default=25)
    ap.add_argument("--output", type=Path)
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()

    if args.self_test:
        run_self_test()
        return
    if not args.classification or not args.references or not args.output:
        ap.error("--classification, --references and --output are required unless --self-test is used")
    if args.count < 0:
        ap.error("--count must be non-negative")

    payload = select_batch(
        load_json(args.classification),
        load_json(args.references),
        load_json(args.regressions),
        args.count,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "selectedCount": payload["selectedCount"],
        "eligibleCount": payload["eligibleCount"],
        "selectionSha256": payload["selectionSha256"],
        "catalogMutation": payload["catalogMutation"],
    }, indent=2))


if __name__ == "__main__":
    main()
