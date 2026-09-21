"""Export 3.5 spell effects for temporary summarization review only."""
from __future__ import annotations
import argparse, json, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import enrich_dndtools as d35
CATALOG=ROOT/"public"/"catalogs"/"dndtools"/"spells.json"

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--shard-count",type=int,default=8)
    ap.add_argument("--shard-index",type=int,default=0)
    ap.add_argument("--record-id",action="append",default=[],help="limit export to one or more exact catalog record IDs")
    ap.add_argument("--include-complete",action="store_true",help="include requested records even when their captured effect is already short/self-contained")
    ap.add_argument("--delay",type=float,default=0.08)
    ap.add_argument("--output",type=Path,required=True)
    args=ap.parse_args()
    if args.shard_count<1 or not 0<=args.shard_index<args.shard_count:
        ap.error("invalid shard")
    rows=json.loads(CATALOG.read_text(encoding="utf-8"))
    requested=set(args.record_id)
    if requested:
        known={row.get("id") for row in rows}
        missing=sorted(requested-known)
        if missing:
            raise SystemExit("Unknown record ID(s): "+", ".join(missing))
    entries=[]; failures=[]
    for i,row in enumerate(rows):
        if requested:
            if row.get("id") not in requested:
                continue
        elif i % args.shard_count != args.shard_index:
            continue
        try:
            raw=d35.fetch(row["url"],args.delay)
            parser=d35.DetailParser(); parser.feed(raw); parser.close()
            details=d35.parse_spell(parser,row)
            effect_source=d35.spell_description_text(parser)
            needs_summary=bool(details.get("effectNeedsSummary") and not details.get("effectSummary"))
            if needs_summary or (args.include_complete and requested):
                entries.append({
                    "id":row.get("id"),"name":row.get("name"),"url":row.get("url"),
                    "sourceBook":details.get("sourceBook"),"school":details.get("school"),
                    "header":{
                        "school":details.get("school"),
                        "castingTime":details.get("casting_time"),
                        "components":details.get("components") or [],
                        "range":details.get("range"),
                        "target":details.get("target"),
                        "area":details.get("area"),
                        "duration":details.get("duration"),
                        "savingThrow":details.get("savingThrow"),
                        "spellResistance":details.get("spellResistance"),
                        "descriptors":details.get("descriptors") or [],
                    },
                    "level":details.get("level"),"classLevels":details.get("classLevels"),
                    "domainLevels":details.get("domainLevels"),
                    "needsSummary":needs_summary,
                    "effectReferenceDependent":bool(details.get("effectReferenceDependent")),
                    "sourceIncomplete":bool(details.get("sourceIncomplete")),
                    "sourceIncompleteResolved":bool(details.get("sourceIncompleteResolved")),
                    "sourceIncompleteMarker":details.get("sourceIncompleteMarker"),
                    "supplementVerified":bool(details.get("supplementVerified")),
                    "effectReviewMismatch":bool(details.get("effectReviewMismatch")),
                    "effectReviewTableMismatch":bool(details.get("effectReviewTableMismatch")),
                    "tables":parser.tables,
                    "sourceSha256":d35.spell_effect_digest(effect_source),
                    "tablesSha256":d35.spell_tables_digest(parser.tables) if parser.tables else None,
                    "effectSource":effect_source,
                })
        except Exception as exc:
            failures.append({"id":row.get("id"),"name":row.get("name"),"error":str(exc)})
    payload={
        "reviewOnly":True,
        "includeComplete":bool(args.include_complete),
        "shardCount":args.shard_count,
        "shardIndex":args.shard_index,
        "recordIds":sorted(requested),
        "entries":entries,
        "fetchFailures":failures,
    }
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"reviewEntries":len(entries),"fetchFailures":len(failures)},indent=2))
    if failures: raise SystemExit(1)

if __name__=="__main__":
    main()
