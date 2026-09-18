"""Strict live regression check for known-problematic 3.5/3.x item records."""
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import enrich_dndtools as d35

catalog=json.loads((ROOT/"public/catalogs/dndtools/items.json").read_text(encoding="utf-8"))
case_file=json.loads((ROOT/"scripts/item_regression_cases.json").read_text(encoding="utf-8"))
by_id={row.get("id"):row for row in catalog}
cases=case_file.get("records") or [{"id":x,"mode":"supplement","required":["effectSummary"]} for x in case_file.get("recordIds",[])]

failures=[]
passed=[]
for case in cases:
    record_id=case["id"]
    row=by_id.get(record_id)
    if not row:
        failures.append({"id":record_id,"error":"not present in item catalog"})
        continue
    parser=None
    try:
        parser,details=d35.extract_entry_details(row,"items",0.05)
        d35.validate_details(row,"items",parser,details)
        gaps=d35.enrichment_gaps("items",details)
        if gaps:
            raise ValueError("Critical gameplay fields missing: "+", ".join(gaps))
        mode=case.get("mode")
        if mode=="supplement" and not details.get("supplementVerified"):
            raise ValueError("Expected provenance-backed source-omission supplement was not applied")
        if mode=="sourceFallback" and not details.get("sourceFallbackVerified"):
            raise ValueError("Expected provenance-backed broken-route source fallback was not applied")
        missing=[key for key in case.get("required",[]) if details.get(key) in (None,"",[],{})]
        if missing:
            raise ValueError("Required regression fields missing: "+", ".join(missing))
        passed.append({"name":row.get("name"),"id":record_id,"mode":mode})
    except Exception as exc:
        failure={"name":row.get("name"),"id":record_id,"url":row.get("url"),"error":str(exc)}
        if parser is not None:
            failure["lines"]=parser.lines[:32]
            failure["headings"]=parser.headings[:16]
        failures.append(failure)

report={"sampledRecords":len(passed)+len(failures),"passedRecords":len(passed),"failedRecords":len(failures),"passed":passed,"failures":failures}
print(json.dumps(report,indent=2))
if failures:
    raise SystemExit(1)
print("PASS known 3.5 item enrichment regressions")
