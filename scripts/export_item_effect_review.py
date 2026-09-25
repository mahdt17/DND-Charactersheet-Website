"""Export long D&D 3.5 item effects for temporary summarization review only."""
from __future__ import annotations
import argparse, json, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import enrich_dndtools as d35
CATALOG=ROOT/"public"/"catalogs"/"dndtools"/"items.json"

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--shard-count",type=int,default=16)
    ap.add_argument("--shard-index",type=int,required=True)
    ap.add_argument("--delay",type=float,default=0.08)
    ap.add_argument("--output",type=Path,required=True)
    args=ap.parse_args()
    if args.shard_count<1 or not 0<=args.shard_index<args.shard_count:
        ap.error("invalid shard")
    rows=json.loads(CATALOG.read_text(encoding="utf-8"))
    entries=[]; failures=[]
    for i,row in enumerate(rows):
        if i % args.shard_count != args.shard_index:
            continue
        try:
            parser,details=d35.extract_entry_details(row,"items",args.delay)
            effect_source=d35.item_effect_text(parser,row.get("name",""))
            if details.get("itemEffectReviewMismatch"):
                raise ValueError("reviewed item effect digest mismatch")
            needs_summary=bool(details.get("effectNeedsSummary") and not details.get("effectSummary"))
            if needs_summary:
                entries.append({
                    "id":row.get("id"),"name":row.get("name"),"url":row.get("url"),
                    "sourceBook":details.get("sourceBook"),"sourceEdition":details.get("sourceEdition"),
                    "itemType":details.get("itemType"),"bodySlot":details.get("bodySlot"),
                    "price":details.get("price"),"cost":details.get("cost"),
                    "casterLevel":details.get("casterLevel"),"aura":details.get("aura"),
                    "activation":details.get("activation"),"prerequisites":details.get("prerequisites") or [],
                    "tables":parser.tables,
                    "sourceSha256":d35.item_effect_digest(effect_source),
                    "effectSource":effect_source,
                    "effectSourceLength":len(d35.clean(effect_source)),
                })
        except Exception as exc:
            failures.append({"id":row.get("id"),"name":row.get("name"),"error":str(exc)})
    payload={
        "reviewOnly":True,"shardCount":args.shard_count,"shardIndex":args.shard_index,
        "entries":entries,"fetchFailures":failures,
    }
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"reviewEntries":len(entries),"fetchFailures":len(failures)},indent=2))
    if failures: raise SystemExit(1)

if __name__=="__main__": main()
