"""Select whole near-duplicate 3.5 spell-effect families for manual review.

Review-only and fail-closed. Selection only creates a review packet; it never
implies that family members can share a summary. Every member must remain free
of current reference, table, suspicious-source, and external-mechanics flags.
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

ALLOWED_TAGS = {"near-duplicate-family"}


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def member_reasons(classified: dict, raw: dict, family_ids: list[str], family_key: str) -> list[str]:
    reasons: list[str] = []
    source = raw.get("effectSource") or ""
    if raw.get("id") != classified.get("id"):
        reasons.append("classification-review-id-mismatch")
    if classified.get("primaryBucket") != "near-duplicate-family":
        reasons.append("not-near-duplicate-primary")
    tags = set(classified.get("tags") or [])
    if tags != ALLOWED_TAGS:
        reasons.append("unexpected-classifier-tags")
    if classified.get("suspiciousReasons"):
        reasons.append("classifier-suspicious-reasons")
    if classified.get("externalMechanicsReasons"):
        reasons.append("classifier-external-mechanics")
    if classified.get("referenceNames"):
        reasons.append("classifier-reference-names")
    if sorted(classified.get("nearDuplicateIds") or []) != family_ids:
        reasons.append("classifier-family-membership-mismatch")
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
    if not raw.get("sourceBook"):
        reasons.append("missing-source-book")
    actual_sha = d35.spell_effect_digest(source)
    if not source.strip():
        reasons.append("empty-effect-source")
    if classified.get("sourceSha256") != actual_sha:
        reasons.append("classification-source-sha-mismatch")
    if raw.get("sourceSha256") != actual_sha:
        reasons.append("review-source-sha-mismatch")
    if classifier.near_family_key(source) != family_key:
        reasons.append("current-near-family-key-mismatch")
    if classifier.suspicious_reasons(raw):
        reasons.append("current-suspicion-detector-hit")
    if classifier.external_mechanics_reasons(source):
        reasons.append("current-external-mechanics-detector-hit")
    self_aliases = classifier.name_aliases(raw.get("name") or "")
    current_refs = [
        name
        for name in classifier.extract_reference_names(source)
        if not (classifier.name_aliases(classifier.clean_reference_name(name)) & self_aliases)
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

    queue_ids_by_family: dict[str, list[str]] = {}
    for raw in review_entries:
        key = classifier.near_family_key(raw.get("effectSource") or "")
        if key:
            queue_ids_by_family.setdefault(key, []).append(raw["id"])

    eligible: list[dict] = []
    rejected_counts: dict[str, int] = {}
    for family in classification.get("nearDuplicateFamilies") or []:
        family_key = family.get("familySha256") or ""
        ids = sorted(family.get("recordIds") or [])
        reasons: list[str] = []
        if not family_key:
            reasons.append("family-missing-key")
        if len(ids) < 2 or family.get("size") != len(ids):
            reasons.append("invalid-family-size")
        if ids != sorted(queue_ids_by_family.get(family_key) or []):
            reasons.append("family-queue-membership-mismatch")

        members: list[dict] = []
        source_shas: set[str] = set()
        normalized_names: set[str] = set()
        for record_id in ids:
            classified = classified_by_id.get(record_id)
            raw = review_by_id.get(record_id)
            if classified is None or raw is None:
                reasons.append("family-member-missing")
                continue
            member_failures = member_reasons(classified, raw, ids, family_key)
            reasons.extend(f"member:{reason}" for reason in member_failures)
            source_shas.add(raw.get("sourceSha256") or "")
            normalized_names.add(classifier.normalize_name(raw.get("name") or ""))
            members.append(raw)

        if len(source_shas) != len(ids):
            reasons.append("family-has-exact-duplicate-members")
        if "" in source_shas:
            reasons.append("family-missing-source-sha")
        if len(normalized_names) != 1 or "" in normalized_names:
            reasons.append("family-name-mismatch")
        if reasons:
            for reason in sorted(set(reasons)):
                rejected_counts[reason] = rejected_counts.get(reason, 0) + 1
            continue

        ordered_members = sorted(members, key=lambda item: item["id"])
        eligible.append({
            "familySha256": family_key,
            "recordIds": ids,
            "size": len(ids),
            "representativeName": ordered_members[0].get("name"),
            "members": [
                {
                    "id": member.get("id"),
                    "name": member.get("name"),
                    "url": member.get("url"),
                    "sourceBook": member.get("sourceBook"),
                    "school": member.get("school"),
                    "level": member.get("level"),
                    "classLevels": member.get("classLevels"),
                    "domainLevels": member.get("domainLevels"),
                    "sourceSha256": member.get("sourceSha256"),
                    "effectSource": member.get("effectSource"),
                }
                for member in ordered_members
            ],
        })

    eligible.sort(
        key=lambda family: (
            family["size"],
            d35.clean(family.get("representativeName") or "").casefold(),
            family.get("familySha256") or "",
        )
    )
    if family_count < 0:
        raise ValueError("family_count must be non-negative")
    if len(eligible) < family_count:
        raise ValueError(
            f"requested {family_count} families but only {len(eligible)} near-duplicate families remain"
        )

    selected = eligible[:family_count]
    fingerprint_lines = [
        family["familySha256"] + ":" + ",".join(
            f"{member['id']}:{member['sourceSha256']}" for member in family["members"]
        )
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
        "selectionPolicy": "whole-near-effect-family-clean-v1",
        "requestedFamilyCount": family_count,
        "eligibleFamilyCount": len(eligible),
        "eligibleRecordCount": sum(family["size"] for family in eligible),
        "selectedFamilyCount": len(selected),
        "selectedRecordCount": len(selected_entries),
        "selectionSha256": hashlib.sha256(
            "\n".join(fingerprint_lines).encode("utf-8")
        ).hexdigest(),
        "rejectedReasonCounts": dict(sorted(rejected_counts.items())),
        "families": selected,
        "entries": selected_entries,
    }


def run_self_test() -> None:
    source_a = (
        "By reciting a sacred passage, you bless all allies in the area. "
        "Allies gain a +2 luck bonus on attack rolls and saving throws, while "
        "enemies suffer a -2 luck penalty on attack rolls and saving throws. "
        "The effect lasts for 10 rounds and requires a sacred text."
    )
    source_b = (
        "By reciting a sacred passage, you bless all allies in the area. "
        "Allies gain a +3 luck bonus on attack rolls and saving throws, while "
        "enemies suffer a -3 luck penalty on attack rolls and saving throws. "
        "The effect lasts for 20 rounds and requires a sacred text."
    )
    family_key = classifier.near_family_key(source_a)
    assert family_key and family_key == classifier.near_family_key(source_b)
    assert d35.spell_effect_digest(source_a) != d35.spell_effect_digest(source_b)

    ids = ["spells/test-a", "spells/test-b"]
    entries = []
    raw_entries = []
    for record_id, source, book in zip(ids, (source_a, source_b), ("Book A", "Book B")):
        sha = d35.spell_effect_digest(source)
        entries.append({
            "id": record_id,
            "name": "Test Recitation",
            "sourceSha256": sha,
            "primaryBucket": "near-duplicate-family",
            "tags": sorted(ALLOWED_TAGS),
            "suspiciousReasons": [],
            "externalMechanicsReasons": [],
            "referenceNames": [],
            "nearDuplicateIds": ids,
        })
        raw_entries.append({
            "id": record_id,
            "name": "Test Recitation",
            "url": f"https://example.invalid/{record_id}",
            "sourceBook": book,
            "school": "Conjuration (Creation)",
            "level": 4,
            "classLevels": {"Cleric": 4},
            "domainLevels": None,
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
        "nearDuplicateFamilies": [{
            "familySha256": family_key,
            "recordIds": ids,
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

    bad_name_review = json.loads(json.dumps(review))
    bad_name_review["entries"][1]["name"] = "Different Spell"
    assert select_families(classification, bad_name_review, 0)["eligibleFamilyCount"] == 0
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
