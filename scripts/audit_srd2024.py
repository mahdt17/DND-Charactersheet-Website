"""Offline gameplay-completeness audit for the bundled 2024 / 5.5e SRD data."""
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PATH=ROOT/"src"/"data"/"srd2024.json"


def present(value):
    return value not in (None,"",[],{})


def main():
    data=json.loads(PATH.read_text(encoding="utf-8"))
    failures=[]

    for collection,rows in data.items():
        if not isinstance(rows,list):
            failures.append({"collection":collection,"error":"collection is not a list"})
            continue
        indexes=[row.get("index") for row in rows]
        duplicates=sorted({x for x in indexes if x and indexes.count(x)>1})
        if duplicates:
            failures.append({"collection":collection,"error":"duplicate indexes","examples":duplicates[:10]})

    for row in data.get("spells",[]):
        missing=[k for k in ("index","name","level","school","classes","casting_time","range","components","duration","description") if not present(row.get(k))]
        if missing:
            failures.append({"collection":"spells","name":row.get("name"),"missing":missing})
        if "component:" in str(row.get("range","")).casefold():
            failures.append({"collection":"spells","name":row.get("name"),"error":"components embedded in range"})
        if not isinstance(row.get("level"),int) or not 0 <= row["level"] <= 9:
            failures.append({"collection":"spells","name":row.get("name"),"error":"invalid level"})

    for row in data.get("classes",[]):
        missing=[k for k in ("index","name","primary_ability","hit_die","proficiencies","saving_throws","starting_equipment_options","multi_classing","subclasses") if not present(row.get(k))]
        if missing:
            failures.append({"collection":"classes","name":row.get("name"),"missing":missing})

    for row in data.get("species",[]):
        missing=[k for k in ("index","name","type","speed","traits") if not present(row.get(k))]
        if not (present(row.get("size")) or present(row.get("size_options"))):
            missing.append("size-or-size_options")
        if missing:
            failures.append({"collection":"species","name":row.get("name"),"missing":missing})

    for row in data.get("backgrounds",[]):
        missing=[k for k in ("index","name","ability_scores","feat","proficiencies","equipment_options") if not present(row.get(k))]
        if missing:
            failures.append({"collection":"backgrounds","name":row.get("name"),"missing":missing})

    for row in data.get("feats",[]):
        missing=[k for k in ("index","name","description","type") if not present(row.get(k))]
        if missing:
            failures.append({"collection":"feats","name":row.get("name"),"missing":missing})

    for collection in ("traits","features"):
        for row in data.get(collection,[]):
            missing=[k for k in ("index","name","description") if not present(row.get(k))]
            if missing:
                failures.append({"collection":collection,"name":row.get("name"),"missing":missing})

    for row in data.get("subclasses",[]):
        missing=[k for k in ("index","name","class","features") if not present(row.get(k))]
        if missing:
            failures.append({"collection":"subclasses","name":row.get("name"),"missing":missing})

    counts={k:len(v) for k,v in data.items() if isinstance(v,list)}
    report={"edition":"2024","counts":counts,"criticalMissingCount":len(failures),"failures":failures[:50],"passed":not failures}
    print(json.dumps(report,indent=2))
    if failures:
        raise SystemExit(1)
    print("PASS 2024 SRD offline gameplay-completeness audit")


if __name__=="__main__":
    main()
