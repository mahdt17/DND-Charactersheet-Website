"""Merge sharded strict enrichment audit reports into one release-gate report."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

REQUIRED = {
    "3.5/classes","3.5/feats","3.5/spells","3.5/items","3.5/equipment",
    "5e/classes","5e/spells","5e/feats","5e/items"
}


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("inputs", nargs="+", type=Path)
    ap.add_argument("--output", type=Path, required=True)
    args=ap.parse_args()

    categories=[]
    source_reports=[]
    errors=[]
    for path in args.inputs:
        if not path.exists() or path.name == args.output.name:
            continue
        try:
            report=json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"{path}: {exc}")
            continue
        source_reports.append(str(path))
        if report.get("readOnly") is not True or report.get("strictGameplayCompleteness") is not True:
            errors.append(f"{path}: not a strict read-only audit")
        if report.get("fullScopeForSelectedCategories") is not True:
            errors.append(f"{path}: not a full-category shard")
        categories.extend(report.get("categories",[]))

    by_name={}
    for row in categories:
        name=row.get("category")
        if not name:
            errors.append("category row missing category name")
            continue
        if name in by_name:
            errors.append(f"duplicate category report: {name}")
        by_name[name]=row

    missing=sorted(REQUIRED-set(by_name))
    unexpected=sorted(set(by_name)-REQUIRED)
    if missing:
        errors.append("missing category reports: "+", ".join(missing))
    if unexpected:
        errors.append("unexpected category reports: "+", ".join(unexpected))

    critical=sum(int(row.get("failed",0)) for row in by_name.values())
    bad=[
        name for name,row in by_name.items()
        if float(row.get("successRate",0)) < 1.0 or int(row.get("failed",0)) != 0
    ]
    if bad:
        errors.append("categories below 100%: "+", ".join(sorted(bad)))

    final={
        "readOnly":True,
        "fullCatalog":True,
        "fullScopeForSelectedCategories":True,
        "strictGameplayCompleteness":True,
        "minimumRate":1.0,
        "criticalMissingCount":critical,
        "passed":not errors and set(by_name)==REQUIRED and critical==0,
        "categories":[by_name[name] for name in sorted(by_name)],
        "sourceReports":source_reports,
        "errors":errors,
    }
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(final,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(final,indent=2))
    if not final["passed"]:
        raise SystemExit(1)


if __name__=="__main__":
    main()
