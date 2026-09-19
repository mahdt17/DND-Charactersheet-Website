"""Strict live regression check for known-problematic 3.5 spell records."""
from __future__ import annotations
from concurrent.futures import ThreadPoolExecutor
import json, os, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import enrich_dndtools as d35

catalog=json.loads((ROOT/"public/catalogs/dndtools/spells.json").read_text(encoding="utf-8"))
case_file=json.loads((ROOT/"scripts/spell_regression_cases.json").read_text(encoding="utf-8"))
by_id={row.get("id"):row for row in catalog}

def check_record(record_id: str):
    row=by_id.get(record_id)
    if not row:
        return False,{"id":record_id,"error":"not present in spell catalog"}
    try:
        # Keep this a live-source regression check. A small bounded pool improves
        # throughput without changing the parser/validation path or bypassing
        # d35.fetch retry and host-safety behavior.
        raw=d35.fetch(row["url"],0.15)
        parser=d35.DetailParser(); parser.feed(raw); parser.close()
        details=d35.parse_spell(parser,row)
        d35.validate_details(row,"spells",parser,details)
        gaps=d35.enrichment_gaps("spells",details)
        if gaps:
            raise ValueError("Critical gameplay fields missing: "+", ".join(gaps))
        return True,{"name":row.get("name"),"id":record_id}
    except Exception as exc:
        return False,{"name":row.get("name"),"id":record_id,"url":row.get("url"),"error":str(exc)}

record_ids=case_file["recordIds"]
workers=max(1,min(4,int(os.environ.get("DND_SPELL_REGRESSION_WORKERS","4"))))
with ThreadPoolExecutor(max_workers=workers) as executor:
    results=list(executor.map(check_record,record_ids))

passed=[payload for ok,payload in results if ok]
failures=[payload for ok,payload in results if not ok]
report={"sampledRecords":len(results),"passedRecords":len(passed),"failedRecords":len(failures),"failures":failures}
print(json.dumps(report,indent=2))
if failures:
    raise SystemExit(1)
print("PASS known 3.5 spell enrichment regressions")
