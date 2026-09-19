"""Export long 3.5 feat rule text for temporary human/LLM review only.

The output is a CI review artifact, never a bundled catalog file. It exists solely so
long Benefit/Normal/Special prose can be converted into concise factual structured
summaries before the final output gate is allowed to pass.
"""
from __future__ import annotations
import argparse, json, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import enrich_dndtools as d35

CATALOG=ROOT/"public"/"catalogs"/"dndtools"/"feats.json"


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--shard-count",type=int,default=8)
    ap.add_argument("--shard-index",type=int,required=True)
    ap.add_argument("--delay",type=float,default=0.08)
    ap.add_argument("--output",type=Path,required=True)
    args=ap.parse_args()
    if args.shard_count < 1 or not 0 <= args.shard_index < args.shard_count:
        ap.error("invalid shard")

    rows=json.loads(CATALOG.read_text(encoding="utf-8"))
    out=[]
    failures=[]
    for i,row in enumerate(rows):
        if i % args.shard_count != args.shard_index:
            continue
        try:
            raw=d35.fetch(row["url"],args.delay)
            parser=d35.DetailParser(); parser.feed(raw); parser.close()
            details=d35.parse_feat(parser,row)
            benefit=d35.next_value(parser.lines,"Benefit")
            normal=d35.next_value(parser.lines,"Normal")
            special=d35.next_value(parser.lines,"Special")
            review={}
            if details.get("effectNeedsSummary") and not details.get("effectSummary"):
                review["benefit"]=benefit
                review["benefitSha256"]=d35.feat_rule_digest(benefit)
            if details.get("normalNeedsSummary") and not details.get("normalSummary"):
                review["normal"]=normal
                review["normalSha256"]=d35.feat_rule_digest(normal)
            if details.get("specialNeedsSummary") and not details.get("specialSummary"):
                review["special"]=special
                review["specialSha256"]=d35.feat_rule_digest(special)
            if review:
                out.append({
                    "id":row.get("id"),"name":row.get("name"),"url":row.get("url"),
                    "sourceBook":details.get("sourceBook"),"featType":details.get("featType"),
                    "prerequisites":details.get("prerequisites",[]),
                    "review":review,
                })
        except Exception as exc:
            failures.append({"id":row.get("id"),"name":row.get("name"),"error":str(exc)})

    payload={
        "reviewOnly":True,
        "shardCount":args.shard_count,
        "shardIndex":args.shard_index,
        "entries":out,
        "fetchFailures":failures,
    }
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"reviewEntries":len(out),"fetchFailures":len(failures)},indent=2))
    if failures:
        raise SystemExit(1)


if __name__=="__main__":
    main()
