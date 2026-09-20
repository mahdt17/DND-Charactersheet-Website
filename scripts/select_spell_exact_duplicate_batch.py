"""Select whole, exact-duplicate 3.5 spell-effect families for manual review.

Review-only and fail-closed. A family is eligible only when every queued member
has byte-equivalent cleaned effect text, identical source digest, and no current
reference, table, suspicious-source, or external-mechanics dependency.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import classify_spell_review_queue as classifier
import enrich_dndtools as d35

ALLOWED_TAGS = {"exact-duplicate-effect", "same-source-sha-family"}


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def member_reasons(classified: dict, raw: dict) -> list[str]:
    reasons: list[str] = []
    source = raw.get("effectSource") or ""
    if raw.get("id") != classified.get("id"):
        reasons.append("classification-review-id-mismatch")
    if classified.get("primaryBucket") != "exact-duplicate-effect":
        reasons.append("not-exact-duplicate-primary")
    tags = set(classified.get("tags") or [])
    if tags != ALLOWED_TAGS:
        reasons.append("unexpected-classifier-tags")
    if classified.get("suspiciousReasons"):
        reasons.append("classifier-suspicious-reasons")
    if classified.get("externalMechanicsReasons"):
        reasons.append("classifier-external-mechanics")
    if classified.get("referenceNames"):
        reasons.append("classifier-reference-names")
    if raw.get("effectReferenceDependent"):
        reasons.append("parser-reference-dependent")
    if raw.get("sourceIncomplete"):
        reasons.append("source-incomplete")
    if raw.get("effectReviewMismatch"):
        reasons.append("review-digest-mismatch")
    if raw.get("effectReviewTableMismatch"):
        reasons.append("review-table-digest-mismatch")
    if raw.get("tables") or raw.get("tablesSha256"):
        reasons.append("table-driven")
    actual_sha = d35.spell_effect_digest(source)
    if not source.strip():
        reasons.append("empty-effect-source")
    if classified.get("sourceSha256") != actual_sha:
        reasons.append("classification-source-sha-mismatch")
    if raw.get("sourceSha256") != actual_sha:
        reasons.append("review-source-sha-mismatch")
    if classifier.suspicious_reasons(raw):
        reasons.append("current-suspicion-detector-hit")
    if classifier.external_mechanics_reasons(source):
        reasons.append("current-external-mechanics-detector-hit")
    current_refs = [
        name for name in classifier.extract_reference_names(source)
        if d35.clean(name).casefold() != d35.clean(raw.get("name") or "").casefold()
    ]
    if current_refs:
        reasons.append("current-reference-detector-hit")
    return sorted(set(reasons))


def select_families(classification: dict, review: dict, family_count: int) -> dict:
    errors: list[str] = []
    if not classification.get("reviewOnly") or classification.get("catalogMutation") is not False:
        errors.append("classification artifact is not explicitly review-only")
    validation = classification.get("knownCorpusValidation") or {}
    if validation.get("errors"):
        errors.append("classification known-corpus validation contains errors")
    if validation.get("warnings"):
        errors.append("classification known-corpus validation contains warnings")
    if review.get("errors"):
        errors.append("review artifact contains errors")
    if errors:
        raise ValueError("; ".join(errors))

    classified_entries = classification.get("entries") or []
    review_entries = review.get("entries") or []
    classified_by_id = {entry.get("id"): entry for entry in classified_entries}
    review_by_id = {entry.get("id"): entry for entry in review_entries}
    if None in classified_by_id or len(classified_by_id) != len(classified_entries):
        raise ValueError("classification contains missing or duplicate IDs")
    if None in review_by_id or len(review_by_id) != len(review_entries):
        raise ValueError("review contains missing or duplicate IDs")

    queue_ids_by_sha: dict[str, list[str]] = {}
    for entry in classified_entries:
        queue_ids_by_sha.setdefault(entry.get("sourceSha256") or "", []).append(entry["id"])

    eligible: list[dict] = []
    rejected_counts: dict[str, int] = {}
    for family in classification.get("exactDuplicateFamilies") or []:
        sha = family.get("sourceSha256") or ""
        ids = sorted(family.get("recordIds") or [])
        reasons: list[str] = []
        if not sha:
            reasons.append("family-missing-source-sha")
        if family.get("tablesSha256"):
            reasons.append("family-table-driven")
        if len(ids) < 2 or family.get("size") != len(ids):
            reasons.append("invalid-family-size")
        if ids != sorted(queue_ids_by_sha.get(sha) or []):
            reasons.append("family-queue-membership-mismatch")

        members: list[dict] = []
        cleaned_sources: set[str] = set()
        for record_id in ids:
            classified = classified_by_id.get(record_id)
            raw = review_by_id.get(record_id)
            if classified is None or raw is None:
                reasons.append("family-member-missing")
                continue
            member_failures = member_reasons(classified, raw)
            reasons.extend(f"member:{reason}" for reason in member_failures)
            cleaned_sources.add(d35.clean(raw.get("effectSource") or ""))
            members.append(raw)

        if len(cleaned_sources) != 1:
            reasons.append("family-effect-text-not-identical")
        if reasons:
            for reason in sorted(set(reasons)):
                rejected_counts[reason] = rejected_counts.get(reason, 0) + 1
            continue

        representative = min(
            members,
            key=lambda entry: (
                d35.clean(entry.get("name") or "").casefold(),
                entry.get("id") or "",
            ),
        )
        eligible.append({
            "sourceSha256": sha,
            "recordIds": ids,
            "size": len(ids),
            "representativeId": representative["id"],
            "representativeName": representative.get("name"),
            "effectSource": representative.get("effectSource"),
            "members": [
                {
                    "id": member.get("id"),
                    "name": member.get("name"),
                    "sourceBook": member.get("sourceBook"),
                    "sourceSha256": member.get("sourceSha256"),
                }
                for member in sorted(members, key=lambda item: item["id"])
            ],
        })

    eligible.sort(
        key=lambda family: (
            len(d35.clean(family.get("effectSource") or "")),
            d35.clean(family.get("representativeName") or "").casefold(),
            family.get("sourceSha256") or "",
        )
    )
    if family_count < 0:
        raise ValueError("family_count must be non-negative")
    if len(eligible) < family_count:
        raise ValueError(
            f"requested {family_count} families but only {len(eligible)} exact-duplicate families remain"
        )

    selected = eligible[:family_count]
    lines = [
        f"{family['sourceSha256']}:{','.join(family['recordIds'])}"
        for family in selected
    ]
    selected_entries = [
        member
        for family in selected
        for member in family["members"]
    ]
    return {
        "reviewOnly": True,
        "catalogMutation": False,
        "selectionPolicy": "whole-exact-effect-digest-family-clean-v1",
        "requestedFamilyCount": family_count,
        "eligibleFamilyCount": len(eligible),
        "eligibleRecordCount": sum(family["size"] for family in eligible),
        "selectedFamilyCount": len(selected),
        "selectedRecordCount": len(selected_entries),
        "selectionSha256": hashlib.sha256("\n".join(lines).encode("utf-8")).hexdigest(),
        "rejectedReasonCounts": dict(sorted(rejected_counts.items())),
        "families": selected,
        "entries": selected_entries,
    }


def run_self_test() -> None:
    source = "The target takes 1d6 points of cold damage."
    sha = d35.spell_effect_digest(source)
    entries = []
    raw_entries = []
    for suffix in ("a", "b"):
        record_id = f"spells/test-{suffix}"
        entries.append({
            "id": record_id,
            "name": "Test Spell",
            "sourceSha256": sha,
            "primaryBucket": "exact-duplicate-effect",
            "tags": sorted(ALLOWED_TAGS),
            "suspiciousReasons": [],
            "externalMechanicsReasons": [],
            "referenceNames": [],
        })
        raw_entries.append({
            "id": record_id,
            "name": "Test Spell",
            "sourceSha256": sha,
            "tablesSha256": None,
            "tables": [],
            "effectSource": source,
            "effectReferenceDependent": False,
            "sourceIncomplete": False,
            "effectReviewMismatch": False,
            "effectReviewTableMismatch": False,
        })
    classification = {
        "reviewOnly": True,
        "catalogMutation": False,
        "knownCorpusValidation": {"errors": [], "warnings": []},
        "entries": entries,
        "exactDuplicateFamilies": [{
            "sourceSha256": sha,
            "tablesSha256": None,
            "recordIds": [entry["id"] for entry in entries],
            "size": 2,
        }],
    }
    review = {"reviewOnly": True, "entries": raw_entries, "errors": []}
    measured = select_families(classification, review, 0)
    assert measured["eligibleFamilyCount"] == 1
    assert measured["eligibleRecordCount"] == 2
    selected = select_families(classification, review, 1)
    assert selected["selectedFamilyCount"] == 1
    assert selected["selectedRecordCount"] == 2
    bad = json.loads(json.dumps(classification))
    bad["entries"][0]["externalMechanicsReasons"] = ["bad"]
    assert select_families(bad, review, 0)["eligibleFamilyCount"] == 0
    print(json.dumps({"selfTest": "passed"}, indent=2))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--classification", type=Path)
    ap.add_argument("--review", type=Path)
    ap.add_argument("--family-count", type=int, default=0)
    ap.add_argument("--output", type=Path)
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        run_self_test()
        return
    if not args.classification or not args.review or not args.output:
        ap.error("--classification, --review and --output are required unless --self-test is used")
    payload = select_families(
        load_json(args.classification),
        load_json(args.review),
        args.family_count,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "selectedFamilyCount": payload["selectedFamilyCount"],
        "selectedRecordCount": payload["selectedRecordCount"],
        "eligibleFamilyCount": payload["eligibleFamilyCount"],
        "eligibleRecordCount": payload["eligibleRecordCount"],
        "selectionSha256": payload["selectionSha256"],
        "catalogMutation": payload["catalogMutation"],
    }, indent=2))


if __name__ == "__main__":
    main()
