"""Strict live regression check for known-problematic 5e Wikidot item pages."""
from __future__ import annotations
import json,sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import import_wikidot as w5

case_file=json.loads((ROOT/"scripts/wikidot_item_regression_cases.json").read_text(encoding="utf-8"))
index=w5.parse(w5.INDEX_URLS["items"],0.05)
rows=w5.discover_items(index)
by_id={row.get("id"):row for row in rows}
failures=[]; passed=[]
for record_id in case_file["recordIds"]:
    row=by_id.get(record_id)
    if not row:
        failures.append({"id":record_id,"error":"not present in discovered item catalog"})
        continue
    try:
        page,result=w5.parse_detail_with_retry(row,0.05)
        w5.validate_detail(row,page,result)
        gaps=w5.enrichment_gaps(row,result)
        if gaps:
            raise ValueError("Critical gameplay fields missing: "+", ".join(gaps))
        passed.append({"id":record_id,"name":row.get("name"),"itemType":result.get("itemType"),"rarity":result.get("rarity")})
    except Exception as exc:
        failures.append({"id":record_id,"name":row.get("name"),"url":row.get("url"),"error":str(exc)})
report={"sampledRecords":len(passed)+len(failures),"passedRecords":len(passed),"failedRecords":len(failures),"passed":passed,"failures":failures}
print(json.dumps(report,indent=2))
if failures:
    raise SystemExit(1)
print("PASS known 5e Wikidot item parser regressions")
