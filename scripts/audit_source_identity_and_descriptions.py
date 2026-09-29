"""Fail-closed exact-source identity and self-contained-description audit for D&D 3.5."""
from __future__ import annotations
import hashlib, json, re
from collections import defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CLASSES=ROOT/"public/catalogs/dndtools/classes.json"
FEATS=ROOT/"public/catalogs/dndtools/feats.json"
SUMMARIES=ROOT/"src/data/class-feature-summaries-35.json"
OVERRIDES=ROOT/"src/data/source-description-overrides-35.json"
TRACKER=ROOT/"docs/class-completion-tracker.json"
OUTPUT=ROOT/"test-results/source-identity-description-audit.json"
IDENTITY_ONLY={"id","url","category","edition","sourceBook","sourceAbbr","sourcePage","generatedDescription","enrichment","siblingSourceUrl","siblingSourceId"}
PATTERNS=[
 re.compile(r"\b(?:otherwise\s+)?functions?\s+(?:exactly\s+)?(?:the\s+)?same\s+as\b",re.I),
 re.compile(r"\bfunctions?\s+identically\s+to\b",re.I),
 re.compile(r"\botherwise\s+functions?\s+(?:exactly\s+)?as\s+(?:the\s+)?(?:spell|feat|ability|class feature)\b",re.I),
 re.compile(r"\bfunctions?\s+in\s+most\s+respects\s+as\b",re.I),
 re.compile(r"\b(?:effect|field|ability)\s+(?:is|are)\s+identical\s+to\s+(?:that|those)\s+of\b",re.I),
 re.compile(r"^\s*as\s+the\s+[^.;\n]{1,80}\s+feat\b[^\n]*(?:except|but)\b",re.I|re.M),
 re.compile(r"\bduplicate(?:s|d|\s+the)?\s+effects?\s+of\b",re.I),
 re.compile(r"\bas\s+the\s+[A-Z][A-Za-z0-9\'’]*(?:\s+[A-Z][A-Za-z0-9\'’]*){0,5}\s+feat\b"),
]
GENERIC=re.compile(r"\bfunctions?\s+as\s+(?:an?\s+)?(?:spell-like|supernatural|extraordinary|psi-like)\s+abilit(?:y|ies)\b",re.I)

def canon(v):
 if isinstance(v,dict): return {k:canon(v[k]) for k in sorted(v)}
 if isinstance(v,list): return [canon(x) for x in v]
 return v

def fingerprint(row):
 payload={k:v for k,v in row.items() if k not in IDENTITY_ONLY}
 raw=json.dumps(canon(payload),ensure_ascii=False,separators=(",",":"))
 return hashlib.sha256(raw.encode()).hexdigest()

def unresolved(text):
 masked=GENERIC.sub("",str(text or ""))
 return [p.pattern for p in PATTERNS if p.search(masked)]

def feat_text(row,override):
 effective={**row,**{k:v for k,v in (override or {}).items() if k in {"description","effectSummary","effect","benefit"}}}
 for key in ("description","effectSummary","effect","benefit"):
  if isinstance(effective.get(key),str) and effective[key].strip(): return key,effective[key].strip()
 return None,""

def risk(row):
 text=json.dumps([row.get("name"),row.get("progression"),row.get("advancement"),row.get("prerequisites"),row.get("classSkills")],ensure_ascii=False).casefold()
 checks=(("spellcasting",r"spellcasting|spells? per day|spells? known|caster level"),("psionics",r"power points|powers? known|manifester"),("maneuvers",r"maneuvers? known|maneuvers? readied|stances? known|initiator"),("invocations",r"invocations? known|eldritch blast"),("incarnum",r"soulmeld|essentia|chakra"),("binding",r"vestige|soul binding|binder level"),("companions",r"animal companion|special mount|familiar"))
 found=[name for name,pattern in checks if re.search(pattern,text)]
 return found or ["ordinary"]

def feature_cells(row):
 p=row.get("progression") or []
 if not p or not isinstance(p[0],list): return []
 heads=[str(x or "").strip().casefold() for x in p[0]]
 indexes=[i for i,x in enumerate(heads) if x in {"special","specials","feature","features","class features","abilities"}]
 out=[]
 for r in p[1:]:
  if not isinstance(r,list): continue
  for i in indexes:
   if i<len(r) and str(r[i] or "").strip() not in {"","-","—"}: out.append(str(r[i]).strip())
 return out

def main():
 classes=json.loads(CLASSES.read_text(encoding="utf-8"))
 feats=json.loads(FEATS.read_text(encoding="utf-8"))
 summaries=json.loads(SUMMARIES.read_text(encoding="utf-8"))
 overrides=json.loads(OVERRIDES.read_text(encoding="utf-8")).get("entries",{})
 tracker=json.loads(TRACKER.read_text(encoding="utf-8"))
 if len(classes)!=1054: raise SystemExit(f"Expected 1054 class source IDs; found {len(classes)}")
 feat_ids={x.get("id") for x in feats}
 unknown=sorted(set(overrides)-feat_ids)
 if unknown: raise SystemExit("Description overrides reference unknown exact source IDs: "+", ".join(unknown))
 for source_id,row in overrides.items():
  if not row.get("provenance") or not row.get("effectSummary"):
   raise SystemExit(f"Description override lacks summary/provenance: {source_id}")
 tracked={x["sourceId"]:x for x in tracker.get("entries",[])}
 groups=defaultdict(list)
 for row in classes: groups[str(row.get("name","")).casefold()].append(row)
 rows=[]; divergent=[]; identical=[]
 for records in groups.values():
  variants=defaultdict(list)
  for row in records: variants[fingerprint(row)].append(row["id"])
  if len(records)>1:
   item={"name":records[0].get("name"),"recordCount":len(records),"distinctMechanicsFingerprints":len(variants),"sourceIds":[x["id"] for x in records]}
   (identical if len(variants)==1 else divergent).append(item)
  for row in records:
   families=risk(row); features=feature_cells(row)
   low=not row.get("prestige") and not row.get("prerequisites") and not features and families==["ordinary"]
   rows.append({"sourceId":row["id"],"name":row.get("name"),"sourceBook":row.get("sourceBook"),"sourcePage":row.get("sourcePage"),"trackerStatus":tracked.get(row["id"],{}).get("status","untracked"),"mechanicsFingerprint":fingerprint(row),"sameNameRecordCount":len(records),"sameNameDistinctMechanics":len(variants),"equivalenceStatus":"unique-source-record" if len(records)==1 else "catalog-identical-candidate-source-verification-required" if len(variants)==1 else "same-name-mechanics-diverge-do-not-inherit","riskFamilies":families,"featureCellCount":len(features),"batchTier":"low-risk-fixed-progression" if low else "source-specific-review"})
 queue=[]; reviewed_fail=[]
 for row in feats:
  field,text=feat_text(row,overrides.get(row.get("id")))
  matched=unresolved(text)
  if matched:
   item={"sourceId":row.get("id"),"name":row.get("name"),"sourceBook":row.get("sourceBook"),"sourcePage":row.get("sourcePage"),"displayField":field,"reviewed":bool(row.get("featRuleReviewVerified")),"matchedPatterns":matched}
   queue.append(item)
   if item["reviewed"]: reviewed_fail.append(item)
 class_fail=[]
 for source_id,items in summaries.items():
  if not isinstance(items,list): continue
  for item in items:
   matched=unresolved(item.get("description"))
   if matched: class_fail.append({"sourceId":source_id,"feature":item.get("name"),"matchedPatterns":matched})
 report={"scope":{"classRecords":len(classes),"featRecords":len(feats),"rule":"Same-name records remain independent; identical catalog fingerprints are candidates only and still require source verification."},"sameNameClassGroups":{"total":sum(1 for x in groups.values() if len(x)>1),"divergent":len(divergent),"catalogIdenticalCandidates":len(identical),"divergentGroups":divergent,"catalogIdenticalCandidateGroups":identical},"classBatchManifest":sorted(rows,key=lambda x:(x["batchTier"],x["name"].casefold(),x["sourceId"])),"descriptionAudit":{"unresolvedFeatRecords":len(queue),"unresolvedFeatQueue":queue,"reviewedFeatViolations":reviewed_fail,"reviewedClassFeatureViolations":class_fail}}
 OUTPUT.parent.mkdir(parents=True,exist_ok=True);OUTPUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(f"SOURCE IDENTITY AUDIT: {len(classes)} exact classes; {len(divergent)} divergent same-name groups; {len(identical)} catalog-identical candidate groups (not auto-equivalent).")
 print(f"DESCRIPTION AUDIT: {len(queue)} feat records queued; {len(reviewed_fail)} reviewed feat violations; {len(class_fail)} reviewed class-feature violations.")
 if reviewed_fail or class_fail: raise SystemExit("Reviewed summaries must be self-contained; see test-results/source-identity-description-audit.json")
if __name__=="__main__": main()
