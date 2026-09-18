"""Merge dry-run DnD Tools candidate shards with exact catalog-ID coverage."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CATALOG=ROOT/"public"/"catalogs"/"dndtools"


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--candidate-root",type=Path,required=True)
    ap.add_argument("--category",choices=["classes","feats","spells","items","equipment"],required=True)
    ap.add_argument("--shard-count",type=int,required=True)
    ap.add_argument("--output-root",type=Path,required=True)
    args=ap.parse_args()

    expected=json.loads((CATALOG/f"{args.category}.json").read_text(encoding="utf-8"))
    expected_ids=[row.get("id") for row in expected]
    expected_set=set(expected_ids)
    rows=[]
    missing_files=[]
    for shard in range(args.shard_count):
        name=f"{args.category}-shard-{shard}.json"
        matches=list(args.candidate_root.rglob(name))
        if len(matches)!=1:
            missing_files.append(f"{name}: expected exactly one extracted shard, found {len(matches)}")
            continue
        path=matches[0]
        payload=json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(payload,list):
            raise SystemExit(f"Candidate shard is not a list: {path}")
        rows.extend(payload)

    ids=[row.get("id") for row in rows]
    id_set=set(ids)
    duplicate_count=len(ids)-len(id_set)
    missing=sorted(expected_set-id_set)
    unexpected=sorted(id_set-expected_set)
    errors=[]
    if missing_files: errors.append(f"missing shard files: {len(missing_files)}")
    if duplicate_count: errors.append(f"duplicate candidate IDs: {duplicate_count}")
    if missing: errors.append(f"missing candidate IDs: {len(missing)}")
    if unexpected: errors.append(f"unexpected candidate IDs: {len(unexpected)}")
    if len(rows)!=len(expected): errors.append(f"candidate count {len(rows)} != catalog count {len(expected)}")

    by_id={row.get("id"):row for row in rows}
    ordered=[by_id[id_] for id_ in expected_ids if id_ in by_id]
    result={
        "category":args.category,
        "shardCount":args.shard_count,
        "catalogRecordCount":len(expected),
        "candidateRecordCount":len(rows),
        "duplicateCount":duplicate_count,
        "missingIds":missing[:25],
        "unexpectedIds":unexpected[:25],
        "errors":errors,
        "passed":not errors,
    }
    print(json.dumps(result,indent=2))
    if errors:
        raise SystemExit(1)

    target=args.output_root/"dndtools"/f"{args.category}.json"
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(ordered,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"PASS merged {len(ordered)} exact candidate records -> {target}")


if __name__=="__main__":
    main()
