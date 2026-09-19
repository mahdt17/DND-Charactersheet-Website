"""Select a deterministic, fail-closed batch of 3.5 spell effects for manual review.

This tool never mutates catalogs and never approves summaries. It consumes a raw
review export plus classifier output, revalidates source/table digests and the
current detector code, and emits the shortest strict-clean records as candidates.
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


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def strict_candidate(classified: dict, raw: dict) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    source = raw.get("effectSource") or ""
    tables = raw.get("tables") or []

    if classified.get("primaryBucket") != "clean-standalone-long-effect":
        reasons.append("not-clean-standalone")
    if classified.get("tags"):
        reasons.append("classifier-tags-present")
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
    if tables or raw.get("tablesSha256"):
        reasons.append("table-driven")
    if not source.strip():
        reasons.append("empty-effect-source")

    actual_source_sha = d35.spell_effect_digest(source)
    if classified.get("sourceSha256") != actual_source_sha:
        reasons.append("classification-source-sha-mismatch")
    if raw.get("sourceSha256") != actual_source_sha:
        reasons.append("raw-source-sha-mismatch")

    actual_table_sha = d35.spell_tables_digest(tables) if tables else None
    if (classified.get("tablesSha256") or None) != actual_table_sha:
        reasons.append("classification-table-sha-mismatch")
    if (raw.get("tablesSha256") or None) != actual_table_sha:
        reasons.append("raw-table-sha-mismatch")

    # Re-run current detectors so a stale classification artifact fails closed.
    if classifier.suspicious_reasons(raw):
        reasons.append("current-suspicion-detector-hit")
    if classifier.external_mechanics_reasons(source):
        reasons.append("current-external-mechanics-detector-hit")
    if classifier.extract_reference_names(source):
        reasons.append("current-reference-detector-hit")

    return (not reasons), sorted(set(reasons))


def select_batch(classification: dict, review: dict, count: int) -> dict:
    errors: list[str] = []
    if not classification.get("reviewOnly") or classification.get("catalogMutation") is not False:
        errors.append("classification artifact is not explicitly review-only")
    if not review.get("reviewOnly"):
        errors.append("raw review artifact is not explicitly review-only")
    if review.get("catalogMutation") not in (None, False):
        errors.append("raw review artifact allows catalog mutation")
    validation = classification.get("knownCorpusValidation") or {}
    if validation.get("errors"):
        errors.append("classification known-corpus validation contains errors")
    if validation.get("warnings"):
        errors.append("classification known-corpus validation contains warnings")
    if errors:
        raise ValueError("; ".join(errors))

    raw_entries = review.get("entries") or []
    raw_by_id = {entry.get("id"): entry for entry in raw_entries}
    if len(raw_by_id) != len(raw_entries):
        raise ValueError("raw review artifact contains duplicate record IDs")

    eligible: list[dict] = []
    rejected_counts: dict[str, int] = {}
    missing_raw: list[str] = []
    for classified in classification.get("entries") or []:
        record_id = classified.get("id")
        raw = raw_by_id.get(record_id)
        if raw is None:
            missing_raw.append(record_id or "<missing-id>")
            continue
        ok, reasons = strict_candidate(classified, raw)
        if not ok:
            for reason in reasons:
                rejected_counts[reason] = rejected_counts.get(reason, 0) + 1
            continue
        eligible.append(raw)

    if missing_raw:
        raise ValueError(
            f"{len(missing_raw)} classified records are missing from the raw review artifact"
        )

    eligible.sort(
        key=lambda entry: (
            len(d35.clean(entry.get("effectSource") or "")),
            d35.clean(entry.get("name") or "").casefold(),
            entry.get("id") or "",
        )
    )
    if len(eligible) < count:
        raise ValueError(
            f"requested {count} records but only {len(eligible)} strict-clean candidates remain"
        )

    selected = eligible[:count]
    fingerprint = "\n".join(
        f"{entry.get('id')}:{entry.get('sourceSha256')}:{entry.get('tablesSha256') or '-'}"
        for entry in selected
    )
    return {
        "reviewOnly": True,
        "catalogMutation": False,
        "selectionPolicy": "strict-clean-shortest-first-v1",
        "requestedCount": count,
        "eligibleCount": len(eligible),
        "selectedCount": len(selected),
        "selectionSha256": hashlib.sha256(fingerprint.encode("utf-8")).hexdigest(),
        "rejectedReasonCounts": dict(sorted(rejected_counts.items())),
        "entries": selected,
    }


def run_self_test() -> None:
    source = "The target gains a +2 bonus on saving throws for 1 minute."
    digest = d35.spell_effect_digest(source)
    classified = {
        "id": "spell/test",
        "name": "Test",
        "sourceSha256": digest,
        "tablesSha256": None,
        "primaryBucket": "clean-standalone-long-effect",
        "tags": [],
        "suspiciousReasons": [],
        "externalMechanicsReasons": [],
        "referenceNames": [],
    }
    raw = {
        "id": "spell/test",
        "name": "Test",
        "sourceSha256": digest,
        "tablesSha256": None,
        "tables": [],
        "effectSource": source,
        "effectReferenceDependent": False,
        "sourceIncomplete": False,
        "effectReviewMismatch": False,
        "effectReviewTableMismatch": False,
    }
    ok, reasons = strict_candidate(classified, raw)
    assert ok and reasons == []

    tagged = dict(classified)
    tagged["tags"] = ["existing-regression"]
    assert not strict_candidate(tagged, raw)[0]

    drifted = dict(raw)
    drifted["effectSource"] = source + " Changed."
    assert "raw-source-sha-mismatch" in strict_candidate(classified, drifted)[1]

    inherited_source = "The armor sheds light equivalent to a daylight spell."
    inherited_digest = d35.spell_effect_digest(inherited_source)
    inherited_classified = dict(classified, sourceSha256=inherited_digest)
    inherited_raw = dict(raw, sourceSha256=inherited_digest, effectSource=inherited_source)
    assert "current-external-mechanics-detector-hit" in strict_candidate(
        inherited_classified, inherited_raw
    )[1]

    report = {
        "reviewOnly": True,
        "catalogMutation": False,
        "knownCorpusValidation": {"errors": [], "warnings": []},
        "entries": [classified],
    }
    review = {"reviewOnly": True, "catalogMutation": False, "entries": [raw]}
    selected = select_batch(report, review, 1)
    assert selected["selectedCount"] == 1
    assert selected["entries"][0]["id"] == "spell/test"

    bad_report = dict(report)
    bad_report["knownCorpusValidation"] = {"errors": ["bad"], "warnings": []}
    try:
        select_batch(bad_report, review, 1)
    except ValueError:
        pass
    else:
        raise AssertionError("selector must fail closed on corpus validation errors")
    print(json.dumps({"selfTest": "passed"}, indent=2))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--classification", type=Path)
    ap.add_argument("--review", type=Path)
    ap.add_argument("--count", type=int, default=100)
    ap.add_argument("--output", type=Path)
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        run_self_test()
        return
    if not args.classification or not args.review or not args.output:
        ap.error("--classification, --review and --output are required unless --self-test is used")
    if args.count < 1:
        ap.error("--count must be positive")

    payload = select_batch(
        load_json(args.classification),
        load_json(args.review),
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
