"""Audit dry-run candidate enrichment records for gameplay completeness.

This is the second release gate. Source extraction can be perfect while the generated
record is still incomplete, so a passing source audit is never enough to unlock writes.

Expected candidate layout:
  <candidate-root>/dndtools/{classes,feats,spells,items,equipment}.json
  <candidate-root>/wikidot5e/{classes,feats,spells,items}.json
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

REQUIRED_FILES={
    "3.5/classes":("dndtools/classes.json","class"),
    "3.5/feats":("dndtools/feats.json","feat"),
    "3.5/spells":("dndtools/spells.json","spell"),
    "3.5/items":("dndtools/items.json","item"),
    "3.5/equipment":("dndtools/equipment.json","equipment"),
    "5e/classes":("wikidot5e/classes.json","class"),
    "5e/spells":("wikidot5e/spells.json","spell"),
    "5e/feats":("wikidot5e/feats.json","feat"),
    "5e/items":("wikidot5e/items.json","item"),
}


def has_text(value):
    return isinstance(value,str) and bool(value.strip())


def presence(record,*keys):
    return any(record.get(k) not in (None,"",[],{}) for k in keys)


def description_ok(record):
    # Candidate records may use an original generated summary instead of source prose.
    return any(has_text(record.get(k)) for k in ("description","generatedDescription","summary","effectSummary"))


def class_gaps(r):
    gaps=[]
    inherited=bool(r.get("inheritsFrom"))
    racial=bool(r.get("racialClass"))
    if not has_text(r.get("name")): gaps.append("name")
    if not presence(r,"sourceBook","source","sourceUrl"): gaps.append("source")
    if not description_ok(r): gaps.append("description")
    if not presence(r,"hit_die","hitDie") and not racial and not inherited: gaps.append("hitDie")
    if not presence(r,"skillPoints") and not racial and not inherited: gaps.append("skillPoints")
    if not presence(r,"progression","advancement") and not inherited: gaps.append("progression")
    if not presence(r,"classSkills","skills","classSkillRule") and not racial and not inherited: gaps.append("classSkills")
    if r.get("prestige") and not presence(r,"prerequisites"): gaps.append("prerequisites")
    mechanics=r.get("mechanicsPresence") or {}
    if not presence(r,"classFeatures","features","featureSummaries","featureNames") and not (
        mechanics.get("classFeatures") or mechanics.get("ruleProse")
    ):
        gaps.append("classFeatures")
    if presence(r,"supplementConflicts"):
        gaps.append("supplementConflict")
    return gaps


def feat_gaps(r):
    gaps=[]
    if not has_text(r.get("name")): gaps.append("name")
    if not presence(r,"sourceBook","source","sourceUrl"): gaps.append("source")
    if not description_ok(r): gaps.append("description")
    if not presence(r,"benefit","effect","effectSummary"):
        gaps.append("effect")
    if (r.get("mechanicsPresence") or {}).get("prerequisiteLabeled") and not presence(r,"prerequisites"):
        gaps.append("prerequisites")
    return gaps


def spell_gaps(r):
    gaps=[]
    if not has_text(r.get("name")): gaps.append("name")
    if not presence(r,"sourceBook","source","sourceUrl"): gaps.append("source")
    if not description_ok(r): gaps.append("description")
    for key in ("school","casting_time","range","duration"):
        if not presence(r,key): gaps.append(key)
    psionic=bool(r.get("isPsionicPower"))
    maneuver=bool(r.get("isManeuver"))
    if not psionic and not maneuver and not presence(r,"components"): gaps.append("components")
    if not presence(r,"classes","classLevels") and not psionic and not maneuver: gaps.append("classes")
    if not presence(r,"effect","effectSummary","damage","healAtSlotLevel"):
        gaps.append("effect")
    return gaps


def item_gaps(r,equipment=False):
    gaps=[]
    if not has_text(r.get("name")): gaps.append("name")
    if not presence(r,"sourceBook","source","sourceUrl") and not equipment: gaps.append("source")
    if not description_ok(r): gaps.append("description")
    if equipment:
        if not presence(r,"cost","weight","armorClassBonus","damageSmall","damageMedium","critical","rangeIncrement"):
            gaps.append("stats")
    else:
        if not presence(r,"price","cost","weight","bodySlot","casterLevel","aura","activation","rarity","itemType"):
            gaps.append("stats")
        if not presence(r,"effect","effectSummary") and not (
            r.get("ruleFamily") and presence(r,"ruleSummary","ruleStats")
        ):
            gaps.append("effect")
    return gaps


AUDITORS={
    "class":class_gaps,
    "feat":feat_gaps,
    "spell":spell_gaps,
    "item":lambda r:item_gaps(r,False),
    "equipment":lambda r:item_gaps(r,True),
}


def audit_file(path,kind):
    rows=json.loads(path.read_text(encoding="utf-8"))
    failures=[]
    for row in rows:
        gaps=AUDITORS[kind](row)
        enrichment=row.get("enrichment") or {}
        if enrichment.get("partial"):
            gaps=sorted(set(gaps+list(enrichment.get("missingExpected") or [])))
        if not enrichment.get("validated") and row.get("referenceOnly"):
            gaps=sorted(set(gaps+["notValidated"]))
        if gaps:
            failures.append({"id":row.get("id"),"name":row.get("name"),"missing":sorted(set(gaps))})
    return {
        "total":len(rows),
        "passed":len(rows)-len(failures),
        "failed":len(failures),
        "successRate":1.0 if not rows else round((len(rows)-len(failures))/len(rows),6),
        "examples":failures[:25],
    }


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("candidate_root",type=Path)
    ap.add_argument("--source-audit",type=Path,required=True)
    ap.add_argument("--output",type=Path,required=True)
    ap.add_argument(
        "--only",
        nargs="+",
        choices=sorted(REQUIRED_FILES),
        help="Audit only these complete category outputs. Scoped reports can pass but can never unlock writes."
    )
    args=ap.parse_args()

    source=json.loads(args.source_audit.read_text(encoding="utf-8"))
    selected=list(dict.fromkeys(args.only or REQUIRED_FILES.keys()))
    selected_set=set(selected)
    all_set=set(REQUIRED_FILES)
    full_catalog=selected_set==all_set
    categories=[]
    errors=[]
    for name in selected:
        rel,kind=REQUIRED_FILES[name]
        path=args.candidate_root/rel
        if not path.exists():
            categories.append({"category":name,"total":0,"passed":0,"failed":1,"successRate":0.0,"examples":[{"missing":["candidateFile"]}]})
            errors.append(f"missing candidate file: {rel}")
            continue
        result=audit_file(path,kind)
        result["category"]=name
        categories.append(result)

    missing=sum(r["failed"] for r in categories)
    source_scope=set(source.get("scopeCategories") or [])
    source_scope_ok=(
        source.get("readOnly") is True
        and source.get("sourceExtractionVerified") is True
        and source.get("passed") is True
        and source.get("criticalMissingCount")==0
        and (
            source.get("fullCatalog") is True
            or (
                source.get("fullScopeForSelectedCategories") is True
                and selected_set.issubset(source_scope)
            )
        )
    )
    complete=all(r["failed"]==0 and r["successRate"]==1.0 for r in categories)
    scoped_pass=source_scope_ok and complete and not errors
    report={
        "readOnly":True,
        "fullCatalog":full_catalog,
        "fullScopeForSelectedCategories":True,
        "scopeCategories":selected,
        "strictGameplayCompleteness":True,
        "sourceExtractionVerified":source_scope_ok,
        "outputCompletenessVerified":complete,
        "releaseReady":full_catalog and scoped_pass,
        "minimumRate":1.0,
        "criticalMissingCount":missing,
        "passed":scoped_pass,
        "categories":categories,
        "errors":errors,
    }
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report,indent=2))
    if not report["passed"]:
        raise SystemExit(1)


if __name__=="__main__":
    main()
