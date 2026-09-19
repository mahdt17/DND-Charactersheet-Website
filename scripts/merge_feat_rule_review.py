"""Merge temporary feat-rule review shards."""
from __future__ import annotations
import argparse, json
from pathlib import Path

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--input-dir",type=Path,required=True)
    ap.add_argument("--output",type=Path,required=True)
    ap.add_argument("--shard-count",type=int,default=8)
    args=ap.parse_args()
    entries=[]
    failures=[]
    seen_shards=[]
    for path in sorted(args.input_dir.rglob("*.json")):
        data=json.loads(path.read_text(encoding="utf-8"))
        if data.get("reviewOnly") is not True:
            continue
        seen_shards.append(data.get("shardIndex"))
        entries.extend(data.get("entries") or [])
        failures.extend(data.get("fetchFailures") or [])
    errors=[]
    if sorted(seen_shards)!=list(range(args.shard_count)):
        errors.append(f"incomplete shards: {sorted(seen_shards)}")
    ids=[x.get("id") for x in entries]
    if len(ids)!=len(set(ids)):
        errors.append("duplicate review IDs")
    if failures:
        errors.append(f"fetch failures: {len(failures)}")
    result={"reviewOnly":True,"entryCount":len(entries),"entries":sorted(entries,key=lambda x:(x["name"].casefold(),x["id"])),"errors":errors}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"entryCount":len(entries),"errors":errors},indent=2))
    if errors:
        raise SystemExit(1)

if __name__=="__main__":
    main()
