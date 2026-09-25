"""Merge dry-run candidate shards with exact source-audit ID coverage."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

SCOPES={
    "3.5/classes":("dndtools","classes"),
    "3.5/feats":("dndtools","feats"),
    "3.5/spells":("dndtools","spells"),
    "3.5/items":("dndtools","items"),
    "3.5/equipment":("dndtools","equipment"),
    "5e/classes":("wikidot5e","classes"),
    "5e/spells":("wikidot5e","spells"),
    "5e/feats":("wikidot5e","feats"),
    "5e/items":("wikidot5e","items"),
}


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--candidate-root",type=Path,required=True)
    ap.add_argument("--scope",choices=sorted(SCOPES),required=True)
    ap.add_argument("--shard-count",type=int,required=True)
    ap.add_argument("--source-audit",type=Path,required=True)
    ap.add_argument("--output-root",type=Path,required=True)
    args=ap.parse_args()

    source_dir,category=SCOPES[args.scope]
    source_report=json.loads(args.source_audit.read_text(encoding="utf-8"))
    cats=[c for c in source_report.get("categories",[]) if c.get("category")==args.scope]
    if len(cats)!=1 or source_report.get("sourceExtractionVerified") is not True:
        raise SystemExit("Source audit is missing or not verified for requested scope")
    expected_ids=cats[0].get("recordIds") or []
    if not expected_ids:
        raise SystemExit("Source audit does not contain exact recordIds")
    expected_set=set(expected_ids)

    rows=[]
    missing_files=[]
    for shard in range(args.shard_count):
        name=f"{category}-shard-{shard}.json"
        matches=list(args.candidate_root.rglob(name))
        if len(matches)!=1:
            missing_files.append(f"{name}: expected exactly one extracted shard, found {len(matches)}")
            continue
        payload=json.loads(matches[0].read_text(encoding="utf-8"))
        if not isinstance(payload,list):
            raise SystemExit(f"Candidate shard is not a list: {matches[0]}")
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
    if len(rows)!=len(expected_ids): errors.append(f"candidate count {len(rows)} != source-audit count {len(expected_ids)}")

    by_id={row.get("id"):row for row in rows}
    ordered=[by_id[id_] for id_ in expected_ids if id_ in by_id]
    result={
        "scope":args.scope,
        "shardCount":args.shard_count,
        "sourceAuditRecordCount":len(expected_ids),
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

    target=args.output_root/source_dir/f"{category}.json"
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(ordered,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"PASS merged {len(ordered)} exact candidate records -> {target}")


if __name__=="__main__":
    main()
