"""Strict live regression check for known-problematic 3.5 spell records."""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import enrich_dndtools as d35


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--ids-file",
        type=Path,
        help=(
            "Optional newline-delimited record IDs. When supplied, run the same "
            "strict live checks only for those IDs; every ID must already be in "
            "the permanent regression corpus."
        ),
    )
    return parser.parse_args()


args = parse_args()
catalog = json.loads((ROOT / "public/catalogs/dndtools/spells.json").read_text(encoding="utf-8"))
case_file = json.loads((ROOT / "scripts/spell_regression_cases.json").read_text(encoding="utf-8"))
by_id = {row.get("id"): row for row in catalog}
permanent_ids = case_file["recordIds"]

if args.ids_file:
    requested_ids = [
        line.strip()
        for line in args.ids_file.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    if len(requested_ids) != len(set(requested_ids)):
        raise SystemExit("Targeted regression ID file contains duplicates")
    unknown = sorted(set(requested_ids) - set(permanent_ids))
    if unknown:
        raise SystemExit(
            "Targeted regression IDs are not permanently locked: " + ", ".join(unknown)
        )
    record_ids = requested_ids
    mode = "targeted"
else:
    record_ids = permanent_ids
    mode = "full"


def check_record(record_id: str):
    row = by_id.get(record_id)
    if not row:
        return False, {"id": record_id, "error": "not present in spell catalog"}
    try:
        # Keep this a live-source regression check. A small bounded pool improves
        # throughput without changing the parser/validation path or bypassing
        # d35.fetch retry and host-safety behavior.
        raw = d35.fetch(row["url"], 0.15)
        parser = d35.DetailParser()
        parser.feed(raw)
        parser.close()
        details = d35.parse_spell(parser, row)
        d35.validate_details(row, "spells", parser, details)
        gaps = d35.enrichment_gaps("spells", details)
        if gaps:
            raise ValueError("Critical gameplay fields missing: " + ", ".join(gaps))
        return True, {"name": row.get("name"), "id": record_id}
    except Exception as exc:
        return False, {
            "name": row.get("name"),
            "id": record_id,
            "url": row.get("url"),
            "error": str(exc),
        }


workers = max(1, min(4, int(os.environ.get("DND_SPELL_REGRESSION_WORKERS", "4"))))
with ThreadPoolExecutor(max_workers=workers) as executor:
    results = list(executor.map(check_record, record_ids))

passed = [payload for ok, payload in results if ok]
failures = [payload for ok, payload in results if not ok]
report = {
    "mode": mode,
    "sampledRecords": len(results),
    "passedRecords": len(passed),
    "failedRecords": len(failures),
    "failures": failures,
}
print(json.dumps(report, indent=2))
if failures:
    raise SystemExit(1)
print(f"PASS {mode} 3.5 spell enrichment regressions")
