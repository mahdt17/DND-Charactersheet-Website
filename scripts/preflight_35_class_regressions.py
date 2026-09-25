"""Strict live regression check for known-problematic 3.5 classes."""
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import enrich_dndtools as d35

catalog=json.loads((ROOT/"public/catalogs/dndtools/classes.json").read_text(encoding="utf-8"))
case_file=json.loads((ROOT/"scripts/class_regression_cases.json").read_text(encoding="utf-8"))
by_name={}
for row in catalog:
    by_name.setdefault(row.get("name"),[]).append(row)

failures=[]
passed=[]
for name in case_file["classes"]:
    rows=by_name.get(name,[])
    if not rows:
        failures.append({"name":name,"error":"not present in class catalog"})
        continue
    # A named class passes only when every catalog record for that exact name is either
    # independently complete or can resolve through verified sibling/inheritance fallback.
    for row in rows:
        try:
            raw=d35.fetch(row["url"],0.05)
            parser=d35.DetailParser(); parser.feed(raw); parser.close()
            details=d35.parse_class(parser,row)
            d35.validate_details(row,"classes",parser,details)
            gaps=d35.enrichment_gaps("classes",details)
            if gaps:
                raise ValueError("Critical gameplay fields missing: "+", ".join(gaps))
            passed.append({"name":name,"id":row.get("id")})
        except Exception as exc:
            failures.append({"name":name,"id":row.get("id"),"url":row.get("url"),"error":str(exc)})

report={"sampledRecords":len(passed)+len(failures),"passedRecords":len(passed),"failedRecords":len(failures),"failures":failures}
print(json.dumps(report,indent=2))
if failures:
    raise SystemExit(1)
print("PASS known 3.5 class enrichment regressions")
