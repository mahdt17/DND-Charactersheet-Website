"""Fail-closed verifier for batched spell-classifier changes.

Compares two classification artifacts and permits changes only for record IDs
explicitly approved in a manifest. This is review infrastructure only: it never
mutates catalogs, summaries, regressions, or Supabase.

Manifest schema:
{
  "schemaVersion": 1,
  "purpose": "...",
  "approvedRecordIds": ["spells/example-1"],
  "approvedFields": {
    "spells/example-1": ["primaryBucket", "tags", "externalMechanicsReasons"]
  }
}

If approvedFields is omitted for an approved ID, any classification-field change
for that ID is allowed, but additions/removals still require explicit approval.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

IGNORED_TOP_LEVEL_FIELDS = {
    "generatedAt",
    "selectionSha256",
}

def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))

def index_entries(payload: dict) -> dict[str, dict]:
    entries = payload.get("entries") or []
    indexed: dict[str, dict] = {}
    for entry in entries:
        record_id = entry.get("id")
        if not record_id:
            raise ValueError("classification entry missing id")
        if record_id in indexed:
            raise ValueError(f"duplicate classification id: {record_id}")
        indexed[record_id] = entry
    return indexed

def changed_fields(before: dict, after: dict) -> list[str]:
    fields = sorted((set(before) | set(after)) - {"id"})
    return [field for field in fields if before.get(field) != after.get(field)]

def verify_delta(before_payload: dict, after_payload: dict, manifest: dict) -> dict:
    if not before_payload.get("reviewOnly") or before_payload.get("catalogMutation") is not False:
        raise ValueError("before classification is not explicitly review-only")
    if not after_payload.get("reviewOnly") or after_payload.get("catalogMutation") is not False:
        raise ValueError("after classification is not explicitly review-only")

    before_validation = before_payload.get("knownCorpusValidation") or {}
    after_validation = after_payload.get("knownCorpusValidation") or {}
    if before_validation.get("errors") or before_validation.get("warnings"):
        raise ValueError("before classification has corpus validation errors/warnings")
    if after_validation.get("errors") or after_validation.get("warnings"):
        raise ValueError("after classification has corpus validation errors/warnings")

    if manifest.get("schemaVersion") != 1:
        raise ValueError("manifest schemaVersion must be 1")
    approved_ids = manifest.get("approvedRecordIds") or []
    if len(approved_ids) != len(set(approved_ids)):
        raise ValueError("manifest approvedRecordIds contains duplicates")
    approved = set(approved_ids)
    approved_fields = manifest.get("approvedFields") or {}
    unknown_field_ids = sorted(set(approved_fields) - approved)
    if unknown_field_ids:
        raise ValueError("approvedFields contains IDs absent from approvedRecordIds: " + ", ".join(unknown_field_ids))

    before = index_entries(before_payload)
    after = index_entries(after_payload)
    all_ids = sorted(set(before) | set(after))
    changes: list[dict] = []
    violations: list[dict] = []

    for record_id in all_ids:
        if record_id not in before:
            change = {"id": record_id, "kind": "added", "fields": sorted(k for k in after[record_id] if k != "id")}
        elif record_id not in after:
            change = {"id": record_id, "kind": "removed", "fields": sorted(k for k in before[record_id] if k != "id")}
        else:
            fields = changed_fields(before[record_id], after[record_id])
            if not fields:
                continue
            change = {"id": record_id, "kind": "modified", "fields": fields}
        changes.append(change)

        if record_id not in approved:
            violations.append({**change, "reason": "record-not-approved"})
            continue
        allowed = approved_fields.get(record_id)
        if allowed is not None:
            unexpected = sorted(set(change["fields"]) - set(allowed))
            if unexpected:
                violations.append({**change, "reason": "unapproved-fields", "unexpectedFields": unexpected})

    approved_without_change = sorted(approved - {change["id"] for change in changes})
    report = {
        "reviewOnly": True,
        "catalogMutation": False,
        "passed": not violations,
        "approvedRecordCount": len(approved),
        "changedRecordCount": len(changes),
        "approvedChangedRecordCount": len({c["id"] for c in changes if c["id"] in approved}),
        "approvedWithoutChange": approved_without_change,
        "changes": changes,
        "violations": violations,
    }
    if violations:
        raise ValueError(json.dumps(report, ensure_ascii=False, sort_keys=True))
    return report

def run_self_test() -> None:
    base_entry = {
        "id": "spells/a",
        "name": "A",
        "primaryBucket": "reference-dependent",
        "tags": ["reference-dependent"],
        "externalMechanicsReasons": ["leading-inherited-spell"],
    }
    before = {
        "reviewOnly": True,
        "catalogMutation": False,
        "knownCorpusValidation": {"errors": [], "warnings": []},
        "entries": [base_entry, {**base_entry, "id": "spells/b", "name": "B"}],
    }
    after = json.loads(json.dumps(before))
    after["entries"][0]["primaryBucket"] = "clean-standalone-long-effect"
    after["entries"][0]["tags"] = []
    after["entries"][0]["externalMechanicsReasons"] = []

    manifest = {
        "schemaVersion": 1,
        "approvedRecordIds": ["spells/a"],
        "approvedFields": {
            "spells/a": ["primaryBucket", "tags", "externalMechanicsReasons"]
        },
    }
    report = verify_delta(before, after, manifest)
    assert report["passed"] and report["changedRecordCount"] == 1

    bad = json.loads(json.dumps(after))
    bad["entries"][1]["tags"] = []
    try:
        verify_delta(before, bad, manifest)
    except ValueError as exc:
        assert "record-not-approved" in str(exc)
    else:
        raise AssertionError("unapproved record change must fail")

    too_narrow = json.loads(json.dumps(manifest))
    too_narrow["approvedFields"]["spells/a"] = ["tags"]
    try:
        verify_delta(before, after, too_narrow)
    except ValueError as exc:
        assert "unapproved-fields" in str(exc)
    else:
        raise AssertionError("unapproved field change must fail")
    print(json.dumps({"selfTest": "passed"}, indent=2))

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--before", type=Path)
    ap.add_argument("--after", type=Path)
    ap.add_argument("--manifest", type=Path)
    ap.add_argument("--output", type=Path)
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        run_self_test()
        return
    if not args.before or not args.after or not args.manifest or not args.output:
        ap.error("--before, --after, --manifest and --output are required unless --self-test is used")
    report = verify_delta(load_json(args.before), load_json(args.after), load_json(args.manifest))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "passed": report["passed"],
        "approvedRecordCount": report["approvedRecordCount"],
        "changedRecordCount": report["changedRecordCount"],
        "approvedChangedRecordCount": report["approvedChangedRecordCount"],
    }, indent=2))

if __name__ == "__main__":
    main()
