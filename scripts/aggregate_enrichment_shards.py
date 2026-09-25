"""Aggregate deterministic enrichment shard reports into one full-category source audit."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DND_CATALOG=ROOT/"public"/"catalogs"/"dndtools"
DND_FILES={
    "3.5/classes":"classes.json",
    "3.5/feats":"feats.json",
    "3.5/spells":"spells.json",
    "3.5/items":"items.json",
    "3.5/equipment":"equipment.json",
}
SCOPES=set(DND_FILES)|{"5e/classes","5e/spells","5e/feats","5e/items"}


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--reports-dir",type=Path,required=True)
    ap.add_argument("--category",choices=sorted(SCOPES),required=True)
    ap.add_argument("--output",type=Path,required=True)
    args=ap.parse_args()

    reports=[]
    for path in sorted(args.reports_dir.rglob("*.json")):
        try:
            report=json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        if args.category in (report.get("scopeCategories") or []):
            reports.append((path,report))

    errors=[]
    if not reports:
        errors.append("no shard reports found")

    shard_counts={r.get("shardCount") for _,r in reports}
    shard_count=next(iter(shard_counts)) if len(shard_counts)==1 else None
    shard_indexes=[r.get("shardIndex") for _,r in reports]
    if not shard_count or shard_count < 2:
        errors.append("invalid or inconsistent shardCount")
    elif sorted(shard_indexes)!=list(range(shard_count)):
        errors.append(f"incomplete shard indexes: {sorted(shard_indexes)}")

    category_rows=[]
    for path,report in reports:
        if report.get("readOnly") is not True or report.get("strictGameplayCompleteness") is not True:
            errors.append(f"{path.name}: shard safeguards missing")
        cats=[c for c in (report.get("categories") or []) if c.get("category")==args.category]
        if len(cats)!=1:
            errors.append(f"{path.name}: category result missing or duplicated")
            continue
        category_rows.append((path,cats[0]))

    if args.category in DND_FILES:
        catalog_rows=json.loads((DND_CATALOG/DND_FILES[args.category]).read_text(encoding="utf-8"))
        expected_ids=[row.get("id") for row in catalog_rows]
    else:
        discoveries=[]
        for path,cat in category_rows:
            ids=cat.get("discoveredRecordIds")
            if not isinstance(ids,list) or not ids:
                errors.append(f"{path.name}: missing full discovery ID set")
                continue
            discoveries.append(ids)
        expected_ids=discoveries[0] if discoveries else []
        expected_set=set(expected_ids)
        for ids in discoveries[1:]:
            if set(ids)!=expected_set:
                errors.append("Wikidot discovery set changed between shards")
                break

    expected_set=set(expected_ids)
    seen=[]
    failures=[]
    passed=0
    failed=0
    for path,cat in category_rows:
        ids=cat.get("recordIds") or []
        if len(ids)!=cat.get("sampled"):
            errors.append(f"{path.name}: record ID count does not match sampled count")
        seen.extend(ids)
        passed+=int(cat.get("passed") or 0)
        failed+=int(cat.get("failed") or 0)
        failures.extend(cat.get("failures") or [])

    seen_set=set(seen)
    duplicates=len(seen)-len(seen_set)
    missing=sorted(expected_set-seen_set)
    unexpected=sorted(seen_set-expected_set)
    if duplicates:
        errors.append(f"duplicate audited record IDs: {duplicates}")
    if missing:
        errors.append(f"missing audited record IDs: {len(missing)}")
    if unexpected:
        errors.append(f"unexpected audited record IDs: {len(unexpected)}")
    if passed+failed!=len(expected_ids):
        errors.append(f"aggregate result count {passed+failed} != discovered count {len(expected_ids)}")

    coverage_ok=not errors
    rate=0.0 if not expected_ids else passed/len(expected_ids)
    category_result={
        "category":args.category,
        "sampled":len(expected_ids),
        "passed":passed,
        "failed":failed,
        "successRate":round(rate,6),
        "failureNames":[f.get("name") for f in failures],
        "failures":failures,
        "examples":failures[:25],
        "recordIds":expected_ids,
    }
    result={
        "readOnly":True,
        "fullCatalog":False,
        "fullScopeForSelectedCategories":coverage_ok,
        "scopeCategories":[args.category],
        "strictGameplayCompleteness":True,
        "sourceExtractionVerified":coverage_ok,
        "outputCompletenessVerified":False,
        "releaseReady":False,
        "minimumRate":1.0,
        "sharded":True,
        "shardCount":shard_count,
        "catalogRecordCount":len(expected_ids),
        "criticalMissingCount":failed,
        "coverageErrors":errors,
        "categories":[category_result],
        "passed":coverage_ok and failed==0 and rate==1.0,
    }
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result,indent=2))
    if not result["passed"]:
        raise SystemExit(1)
    print("PASS complete sharded source-extraction audit")


if __name__=="__main__":
    main()
