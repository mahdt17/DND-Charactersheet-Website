"""Select review-only candidates for batched parser false-positive analysis.

This does NOT approve or change any spell classification. It finds records that are
currently reference-dependent only because the upstream parser fired while the
classifier found no parsed spell name, no external-mechanics marker, no table, and
no damaged-source marker. It then records the exact parser-trigger snippet and its
impact across the remaining queue so a human can approve a narrow micro-batch.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

RULES = [
    ("functions-like", re.compile(r"\b(?:functions?|works?|operates?)\s+like\b", re.I)),
    ("identically-to", re.compile(r"\b(?:functions?|works?|operates?)\s+identically\s+to\b", re.I)),
    ("functions-as", re.compile(r"\b(?:functions?|works?|operates?)\s+as\s+(?!if\b|long\s+as\s+at\s+least\b|a\b|an\b)", re.I)),
    ("leading-as-except-but", re.compile(r"^As\s+[^.!?]{1,120}?,\s*(?:except|but)\b", re.I)),
    ("fog-cloud-does", re.compile(r"\bas\s+(?:a|the)\s+fog cloud\s+does\b", re.I)),
    ("with-fog-cloud", re.compile(r"\bas\s+with\s+fog cloud\b", re.I)),
]

def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))

def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()

def sentence_snippet(source: str, match: re.Match) -> str:
    start=max(source.rfind(".",0,match.start()), source.rfind("!",0,match.start()), source.rfind("?",0,match.start()))
    start=0 if start < 0 else start+1
    ends=[p for p in (source.find(".",match.end()),source.find("!",match.end()),source.find("?",match.end())) if p >= 0]
    end=min(ends)+1 if ends else min(len(source), match.end()+160)
    return normalize(source[start:end])[:360]

def parser_matches(source: str) -> list[dict]:
    found=[]
    for label, pattern in RULES:
        for m in pattern.finditer(source or ""):
            found.append({
                "rule": label,
                "matchedText": normalize(m.group(0)),
                "context": sentence_snippet(source,m),
            })
    return found

def build_manifest(classification: dict, review: dict, count: int) -> dict:
    if classification.get("reviewOnly") is not True or classification.get("catalogMutation") is not False:
        raise ValueError("classification must be review-only and catalogMutation=false")
    validation=classification.get("knownCorpusValidation") or {}
    if validation.get("errors") or validation.get("warnings"):
        raise ValueError("classification has corpus validation errors/warnings")
    if review.get("reviewOnly") is not True or review.get("errors"):
        raise ValueError("review input is not a clean review-only artifact")

    review_by_id={e.get("id"):e for e in review.get("entries") or []}
    prelim=[]
    all_rule_counts=Counter()
    all_exact_counts=Counter()

    # Measure parser-pattern impact across the full remaining queue first.
    for row in review.get("entries") or []:
        for hit in parser_matches(row.get("effectSource") or ""):
            all_rule_counts[hit["rule"]]+=1
            all_exact_counts[(hit["rule"],hit["matchedText"].casefold())]+=1

    for item in classification.get("entries") or []:
        tags=set(item.get("tags") or [])
        if item.get("primaryBucket") != "reference-dependent":
            continue
        if item.get("referenceNames"):
            continue
        if item.get("externalMechanicsReasons"):
            continue
        if item.get("suspiciousReasons"):
            continue
        if {"suspected-damaged-source","historical-source-repair","table-driven","external-mechanics-reference"} & tags:
            continue
        row=review_by_id.get(item.get("id")) or {}
        if not row.get("effectReferenceDependent"):
            continue
        if row.get("sourceIncomplete") or row.get("tables"):
            continue
        hits=parser_matches(row.get("effectSource") or "")
        if not hits:
            continue
        prelim.append((item,row,hits))

    candidates=[]
    for item,row,hits in prelim:
        impact=[]
        for hit in hits:
            impact.append({
                **hit,
                "ruleQueueImpactCount": all_rule_counts[hit["rule"]],
                "exactMatchedTextQueueImpactCount": all_exact_counts[(hit["rule"],hit["matchedText"].casefold())],
            })
        candidates.append({
            "id": item.get("id"),
            "name": item.get("name"),
            "url": item.get("url"),
            "sourceBook": item.get("sourceBook"),
            "sourceSha256": item.get("sourceSha256"),
            "upstreamParserReferenceDependent": True,
            "classifierParsedReferenceNames": [],
            "sourceDamageStatus": "none-detected",
            "tableStatus": "none",
            "externalMechanicsStatus": "none-detected",
            "parserTriggers": impact,
        })

    candidates.sort(key=lambda x:(
        min(h["exactMatchedTextQueueImpactCount"] for h in x["parserTriggers"]),
        min(h["ruleQueueImpactCount"] for h in x["parserTriggers"]),
        (x.get("name") or "").casefold(),
        x.get("id") or "",
    ))
    selected=candidates[:max(0,count)]
    digest=hashlib.sha256("\n".join(x["id"] for x in selected).encode()).hexdigest()
    return {
        "schemaVersion":1,
        "reviewOnly":True,
        "catalogMutation":False,
        "purpose":"Parser false-positive discovery manifest; candidates require independent human/source review before approval.",
        "selectionPolicy":{
            "primaryBucket":"reference-dependent",
            "requiresUnparsedReference":True,
            "rejectsParsedReferenceNames":True,
            "rejectsExternalMechanics":True,
            "rejectsSourceDamage":True,
            "rejectsTables":True,
            "requiresUpstreamParserReferenceDependent":True,
        },
        "eligibleCandidateCount":len(candidates),
        "selectedCount":len(selected),
        "selectionSha256":digest,
        "candidates":selected,
    }

def self_test() -> None:
    review={"reviewOnly":True,"errors":[],"entries":[
        {"id":"spells/a","effectSource":"The ward functions as selected by you and then fades.","effectReferenceDependent":True,"sourceIncomplete":False,"tables":[]},
        {"id":"spells/b","effectSource":"This spell functions like fireball, except it is cold.","effectReferenceDependent":True,"sourceIncomplete":False,"tables":[]},
    ]}
    classification={"reviewOnly":True,"catalogMutation":False,"knownCorpusValidation":{"errors":[],"warnings":[]},"entries":[
        {"id":"spells/a","name":"A","url":"u","sourceBook":"B","sourceSha256":"a"*64,"primaryBucket":"reference-dependent","tags":["reference-dependent","manual-verification-required"],"suspiciousReasons":[],"externalMechanicsReasons":[],"referenceNames":[]},
        {"id":"spells/b","name":"B","url":"u","sourceBook":"B","sourceSha256":"b"*64,"primaryBucket":"reference-dependent","tags":["reference-dependent"],"suspiciousReasons":[],"externalMechanicsReasons":[],"referenceNames":["fireball"]},
    ]}
    out=build_manifest(classification,review,25)
    assert out["eligibleCandidateCount"]==1
    assert out["candidates"][0]["id"]=="spells/a"
    assert out["candidates"][0]["parserTriggers"][0]["rule"]=="functions-as"
    print(json.dumps({"selfTest":"passed"},indent=2))

def main() -> None:
    ap=argparse.ArgumentParser()
    ap.add_argument("--classification",type=Path)
    ap.add_argument("--review",type=Path)
    ap.add_argument("--count",type=int,default=25)
    ap.add_argument("--output",type=Path)
    ap.add_argument("--self-test",action="store_true")
    args=ap.parse_args()
    if args.self_test:
        self_test(); return
    if not args.classification or not args.review or not args.output:
        ap.error("--classification, --review and --output are required unless --self-test is used")
    out=build_manifest(load(args.classification),load(args.review),args.count)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({k:out[k] for k in ("eligibleCandidateCount","selectedCount","selectionSha256","catalogMutation")},indent=2))

if __name__=="__main__":
    main()
