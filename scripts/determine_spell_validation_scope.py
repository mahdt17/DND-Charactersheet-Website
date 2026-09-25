"""Choose targeted or full validation for an enrichment-only commit range.

Targeted mode is deliberately narrow. It is allowed only when every changed path
is a review request, the append-only spell regression corpus, or a newly added
spell-summary batch. Existing batch edits, regression removals/reordering, and
all parser, supplement, application, test, or workflow changes force the full
suite. Crossing a 50-record permanent-regression boundary also forces full
validation.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
from pathlib import Path


LIGHT_EXACT = {
    ".github/spell-effect-review.request",
    "scripts/spell_regression_cases.json",
}
LIGHT_BATCH_PREFIX = "scripts/spell_effect_summaries_35_batches/"


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], text=True).strip()


def load_regressions_at(revision: str) -> list[str]:
    raw = git("show", f"{revision}:scripts/spell_regression_cases.json")
    payload = json.loads(raw)
    record_ids = payload.get("recordIds")
    if not isinstance(record_ids, list) or not all(isinstance(item, str) for item in record_ids):
        raise ValueError("spell regression corpus is malformed")
    if len(record_ids) != len(set(record_ids)):
        raise ValueError("spell regression corpus contains duplicates")
    return record_ids


def classify_changes(before: str, after: str, milestone_size: int) -> dict:
    status_lines = git("diff", "--name-status", before, after).splitlines()
    changes = []
    full_reasons = []
    for line in status_lines:
        if not line:
            continue
        parts = line.split("\t")
        status = parts[0]
        path = parts[-1]
        changes.append({"status": status, "path": path})
        if path in LIGHT_EXACT:
            continue
        if path.startswith(LIGHT_BATCH_PREFIX) and status == "A":
            continue
        if path.startswith(LIGHT_BATCH_PREFIX):
            full_reasons.append(f"existing review batch changed: {path} ({status})")
        else:
            full_reasons.append(f"non-review path changed: {path} ({status})")

    old_ids = load_regressions_at(before)
    new_ids = load_regressions_at(after)
    old_set = set(old_ids)
    new_set = set(new_ids)
    removed = sorted(old_set - new_set)
    added = [record_id for record_id in new_ids if record_id not in old_set]
    retained_order = [record_id for record_id in new_ids if record_id in old_set]
    if removed:
        raise ValueError("permanent spell regressions cannot be removed: " + ", ".join(removed))
    if retained_order != old_ids:
        raise ValueError("existing permanent spell regressions cannot be reordered")

    if old_ids and new_ids and len(old_ids) // milestone_size != len(new_ids) // milestone_size:
        full_reasons.append(
            f"crossed {milestone_size}-record regression milestone "
            f"({len(old_ids)} -> {len(new_ids)})"
        )

    mode = "full" if full_reasons else "targeted"
    return {
        "mode": mode,
        "before": before,
        "after": after,
        "milestoneSize": milestone_size,
        "oldRegressionCount": len(old_ids),
        "newRegressionCount": len(new_ids),
        "addedRegressionIds": added,
        "changes": changes,
        "fullReasons": full_reasons,
    }


def write_github_output(report: dict, path: Path) -> None:
    with path.open("a", encoding="utf-8") as handle:
        handle.write(f"mode={report['mode']}\n")
        handle.write(
            "added_count=" + str(len(report["addedRegressionIds"])) + "\n"
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--before", required=True)
    parser.add_argument("--after", default="HEAD")
    parser.add_argument("--milestone-size", type=int, default=50)
    parser.add_argument("--report", type=Path, required=True)
    parser.add_argument("--ids-file", type=Path, required=True)
    args = parser.parse_args()
    if args.milestone_size < 1:
        raise SystemExit("--milestone-size must be positive")

    try:
        git("cat-file", "-e", f"{args.before}^{{commit}}")
        before = args.before
    except subprocess.CalledProcessError:
        before = git("rev-parse", f"{args.after}^")

    report = classify_changes(before, args.after, args.milestone_size)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    args.ids_file.write_text(
        "".join(f"{record_id}\n" for record_id in report["addedRegressionIds"]),
        encoding="utf-8",
    )
    output_path = os.environ.get("GITHUB_OUTPUT")
    if output_path:
        write_github_output(report, Path(output_path))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
