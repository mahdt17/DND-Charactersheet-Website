"""Strict live regression check for known-problematic 3.5 feat records."""
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import enrich_dndtools as d35

catalog=json.loads((ROOT/"public/catalogs/dndtools/feats.json").read_text(encoding="utf-8"))
case_file=json.loads((ROOT/"scripts/feat_regression_cases.json").read_text(encoding="utf-8"))
by_id={row.get("id"):row for row in catalog}

failures=[]
passed=[]
for record_id in case_file["recordIds"]:
    row=by_id.get(record_id)
    if not row:
        failures.append({"id":record_id,"error":"not present in feat catalog"})
        continue
    try:
        raw=d35.fetch(row["url"],0.05)
        parser=d35.DetailParser(); parser.feed(raw); parser.close()
        details=d35.parse_feat(parser,row)
        d35.validate_details(row,"feats",parser,details)
        gaps=d35.enrichment_gaps("feats",details)
        if gaps:
            raise ValueError("Critical gameplay fields missing: "+", ".join(gaps))
        passed.append({"name":row.get("name"),"id":record_id})
    except Exception as exc:
        failures.append({"name":row.get("name"),"id":record_id,"url":row.get("url"),"error":str(exc)})

report={"sampledRecords":len(passed)+len(failures),"passedRecords":len(passed),"failedRecords":len(failures),"failures":failures}
print(json.dumps(report,indent=2))
if failures:
    raise SystemExit(1)
print("PASS known 3.5 feat enrichment regressions")
