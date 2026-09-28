"""Export D&D 3.5 class feature source blocks for review only.

The output is a temporary CI artifact. Source prose is not committed to the
application; reviewed concise mechanics summaries belong in
src/data/class-feature-summaries-35.json.
"""
from __future__ import annotations
import argparse, hashlib, json, re, sys
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import enrich_dndtools as d35

CATALOG=ROOT/"public"/"catalogs"/"dndtools"/"classes.json"
SUMMARIES=ROOT/"src"/"data"/"class-feature-summaries-35.json"

def clean(value):
    return d35.clean(value)

class FeatureParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_h2=False; self.h2=[]
        self.in_features=False
        self.in_p=False; self.p=[]
        self.in_strong=False; self.strong=[]
        self.paragraphs=[]

    def handle_starttag(self,tag,attrs):
        tag=tag.lower()
        if tag in {"h2","h3","h4","h5","h6"}:
            self.in_h2=True; self.h2=[]
        elif self.in_features and tag=="p":
            self.in_p=True; self.p=[]; self.strong=[]
        elif self.in_p and tag=="strong":
            self.in_strong=True; self._strong_buf=[]

    def handle_endtag(self,tag):
        tag=tag.lower()
        if tag in {"h2","h3","h4","h5","h6"} and self.in_h2:
            heading=clean(" ".join(self.h2))
            self.in_features=heading.casefold()=="class features"
            self.in_h2=False; self.h2=[]
        elif tag=="strong" and self.in_strong:
            value=clean(" ".join(self._strong_buf))
            if value:self.strong.append(value)
            self.in_strong=False
        elif tag=="p" and self.in_p:
            text=clean(" ".join(self.p))
            if text:self.paragraphs.append({"text":text,"strong":self.strong[:]})
            self.in_p=False; self.p=[]; self.strong=[]

    def handle_data(self,data):
        if self.in_h2:self.h2.append(data)
        if self.in_p:
            self.p.append(data)
            if self.in_strong:self._strong_buf.append(data)

def normalize_feature_name(value):
    value=clean(value).rstrip(":")
    return re.sub(r"\s+"," ",value)

def feature_key(value):
    value=normalize_feature_name(value)
    value=re.sub(r"\s*\([^)]*\)"," ",value)
    value=re.sub(r"\s+\d+/(?:day|week|encounter)\b.*$","",value,flags=re.I)
    value=re.sub(r"\s+\+?\d+d\d+\b.*$","",value,flags=re.I)
    value=re.sub(r"\s+\+\d+\b.*$","",value,flags=re.I)
    return clean(value).casefold()

def reviewed_summaries():
    if not SUMMARIES.exists(): return {}
    data=json.loads(SUMMARIES.read_text(encoding="utf-8"))
    if not isinstance(data,dict): raise ValueError("class feature summaries must be an object")
    return data

def validate_reviewed_features(entry,features,reviews,source_features=None):
    reviewed=reviews.get(entry.get("id"),[])
    if not reviewed:return
    for review in reviewed:
        source_url=review.get("sourceUrl") or entry.get("url")
        blocks=features if source_url==entry.get("url") else (source_features or {}).get(source_url)
        if blocks is None:
            raise ValueError(f"Reviewed feature {review.get('name')} requires source {source_url}")
        by_key={}
        for feature in blocks:
            by_key.setdefault(feature_key(feature.get("name","")),[]).append(feature)
        source_name=review.get("sourceFeatureName") or review.get("name","")
        key=feature_key(source_name)
        matches=by_key.get(key,[])
        if len(matches)!=1:
            raise ValueError(f"Reviewed feature {review.get('name')} (source block {source_name}) resolved to {len(matches)} source blocks")
        expected=review.get("sourceSha256")
        if not expected:
            raise ValueError(f"Reviewed feature {review.get('name')} is missing sourceSha256")
        if matches[0].get("sourceSha256")!=expected:
            raise ValueError(f"Reviewed feature {review.get('name')} source digest changed")

def feature_blocks(raw):
    parser=FeatureParser(); parser.feed(raw); parser.close()
    out=[]; current=None
    for p in parser.paragraphs:
        text=p["text"]; strong=p["strong"]
        leader=normalize_feature_name(strong[0]) if strong else ""
        starts=bool(leader and re.match(rf"^{re.escape(leader)}\s*:?",text,re.I))
        if starts:
            if current:out.append(current)
            current={"name":leader,"paragraphs":[text]}
        elif current:
            current["paragraphs"].append(text)
    if current:out.append(current)
    for item in out:
        source="\n\n".join(item.pop("paragraphs"))
        item["sourceText"]=source
        item["sourceSha256"]=hashlib.sha256(clean(source).encode("utf-8")).hexdigest()
    return out

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--shard-count",type=int,default=8)
    ap.add_argument("--shard-index",type=int,required=True)
    ap.add_argument("--delay",type=float,default=0.08)
    ap.add_argument("--class-id",action="append",help="Review only these catalog IDs (repeatable).")
    ap.add_argument("--output",type=Path,required=True)
    args=ap.parse_args()
    if args.shard_count<1 or not 0<=args.shard_index<args.shard_count:
        ap.error("invalid shard")
    rows=json.loads(CATALOG.read_text(encoding="utf-8"))
    if args.class_id:
        requested=set(args.class_id)
        missing=requested-{row.get("id") for row in rows}
        if missing:ap.error("unknown class IDs: "+", ".join(sorted(missing)))
        rows=[row for row in rows if row.get("id") in requested]
    reviews=reviewed_summaries()
    entries=[]; failures=[]; source_features={}
    for i,row in enumerate(rows):
        if i%args.shard_count!=args.shard_index:continue
        try:
            raw=d35.fetch(row["url"],args.delay)
            features=feature_blocks(raw)
            for review in reviews.get(row.get("id"),[]):
                url=review.get("sourceUrl")
                if url and url!=row["url"] and url not in source_features:
                    source_features[url]=feature_blocks(d35.fetch_allowed(url,{"new.dndtools.org","dndtools.net"},args.delay))
            validate_reviewed_features(row,features,reviews,source_features)
            entries.append({"id":row.get("id"),"name":row.get("name"),"url":row.get("url"),
                            "sourceBook":row.get("sourceBook"),"features":features})
        except Exception as exc:
            failures.append({"id":row.get("id"),"name":row.get("name"),"url":row.get("url"),"error":str(exc)})
    payload={"reviewOnly":True,"shardCount":args.shard_count,"shardIndex":args.shard_index,
             "entries":entries,"sourceFeatures":source_features,"fetchFailures":failures}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"classes":len(entries),"features":sum(len(x["features"]) for x in entries),
                      "fetchFailures":len(failures)},indent=2))
    if failures:raise SystemExit(1)

if __name__=="__main__":main()
