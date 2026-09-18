"""Build a structured 5e reference index from dnd5e.wikidot.com.

Only factual metadata and concise generated summaries are persisted. Long page prose
is not copied into the repository.

The importer is intentionally separate from the 3.5 DnD Tools importer because the
two sites expose different navigation/table structures, but both normalize into the
same frontend content model.

Usage:
  python scripts/import_wikidot.py --categories spells classes feats items
  python scripts/import_wikidot.py --limit 20
  python scripts/import_wikidot.py --self-test
"""
from __future__ import annotations

import argparse
import html
import json
import re
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

BASE = "https://dnd5e.wikidot.com"
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "catalogs" / "wikidot5e"
AGENT = "AdventurersLedger-5eReferenceIndexer/1.0 (+https://github.com/mahdt17/DND-Charactersheet-Website)"

INDEX_URLS = {
    "spells": BASE + "/spells",
    # Wikidot lists published/racial/UA feats on the front page; /feats is not a real index.
    "feats": BASE + "/",
    "items": BASE + "/wondrous-items",
}

CLASS_URLS = [
    "artificer","barbarian","bard","cleric","druid","fighter","monk","paladin",
    "ranger","rogue","sorcerer","warlock","wizard"
]

SOURCE_ABBR = {
    "PHB":"Player's Handbook","DMG":"Dungeon Master's Guide","XGE":"Xanathar's Guide to Everything",
    "TCE":"Tasha's Cauldron of Everything","SCAG":"Sword Coast Adventurer's Guide",
    "VGM":"Volo's Guide to Monsters","MTF":"Mordenkainen's Tome of Foes",
    "MPMM":"Mordenkainen Presents: Monsters of the Multiverse","FTD":"Fizban's Treasury of Dragons",
    "BGG":"Bigby Presents: Glory of the Giants","EGW":"Explorer's Guide to Wildemount",
    "ERLW":"Eberron: Rising from the Last War","VRGR":"Van Richten's Guide to Ravenloft",
    "MOT":"Mythic Odysseys of Theros","AI":"Acquisitions Incorporated"
}

BLOCK = {"p","div","section","article","dt","dd","li","h1","h2","h3","h4","h5","h6","br"}
SKIP = {"script","style","noscript","svg"}
HEADINGS = {"h1","h2","h3","h4","h5","h6"}


def clean(value: str) -> str:
    return " ".join(html.unescape(value or "").replace("\xa0"," ").split()).strip()


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.lines = []
        self.headings = []
        self.links = []
        self.tables = []
        self._buf = []
        self._heading = None
        self._skip = 0
        self._table_depth = 0
        self._table = None
        self._row = None
        self._cell = None
        self._href = None
        self._link_text = []

    def flush(self):
        value = clean(" ".join(self._buf))
        self._buf = []
        if value and (not self.lines or self.lines[-1] != value):
            self.lines.append(value)
            if self._heading and value not in self.headings:
                self.headings.append(value)

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag in SKIP:
            self._skip += 1
            return
        if self._skip:
            return
        if tag in BLOCK:
            self.flush()
        if tag in HEADINGS:
            self._heading = tag
        if tag == "a":
            self._href = dict(attrs).get("href","")
            self._link_text = []
        if tag == "table":
            self.flush()
            self._table_depth += 1
            if self._table_depth == 1:
                self._table = []
        elif tag == "tr" and self._table_depth:
            self._row = []
        elif tag in ("td","th") and self._table_depth:
            self._cell = []

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in SKIP:
            self._skip = max(0,self._skip-1)
            return
        if self._skip:
            return
        if tag == "a" and self._href is not None:
            name = clean(" ".join(self._link_text))
            if name:
                self.links.append((urljoin(BASE,self._href),name))
            self._href = None
            self._link_text = []
        if tag in ("td","th") and self._table_depth and self._cell is not None:
            value = clean(" ".join(self._cell))
            if self._row is not None:
                self._row.append(value)
            self._cell = None
        elif tag == "tr" and self._table_depth and self._row is not None:
            if any(self._row):
                self._table.append(self._row)
            self._row = None
        elif tag == "table" and self._table_depth:
            self._table_depth -= 1
            if self._table_depth == 0 and self._table:
                self.tables.append(self._table)
                self._table = None
        if tag in BLOCK:
            self.flush()
        if tag in HEADINGS:
            self._heading = None

    def handle_data(self, data):
        if self._skip:
            return
        if self._cell is not None:
            self._cell.append(data)
        else:
            self._buf.append(data)
        if self._href is not None:
            self._link_text.append(data)

    def close(self):
        super().close()
        self.flush()


def fetch(url: str, delay: float = 0.25) -> str:
    if urlparse(url).netloc != urlparse(BASE).netloc:
        raise ValueError("Refusing external URL: " + url)
    for attempt in range(4):
        try:
            if delay:
                time.sleep(delay)
            with urlopen(Request(url,headers={"User-Agent":AGENT,"Cache-Control":"no-cache"}),timeout=45) as response:
                final=response.geturl()
                if urlparse(final).netloc != urlparse(BASE).netloc:
                    raise ValueError("Unexpected redirect: " + final)
                return response.read().decode("utf-8","replace")
        except HTTPError as error:
            if error.code not in (429,500,502,503,504) or attempt==3:
                raise
            time.sleep(min(45,3*(attempt+1)))
        except (URLError,TimeoutError):
            if attempt==3:
                raise
            time.sleep(3*(attempt+1))


def parse(url: str, delay: float) -> Page:
    p=Page()
    p.feed(fetch(url,delay))
    p.close()
    return p


def next_value(lines, label):
    for i,line in enumerate(lines):
        normalized=clean(line)
        if normalized.casefold()==label.casefold():
            for candidate in lines[i+1:]:
                if clean(candidate):
                    return clean(candidate)
        m=re.match(rf"^{re.escape(label)}\s*:?[ \t]+(.+)$",normalized,re.I)
        if m:
            return clean(m.group(1))
    return ""


def source_line(lines):
    # Site navigation precedes page content, so source metadata may appear well after line 25.
    for line in lines:
        m=re.match(r"^Source\s*:\s*(.+)$",clean(line),re.I)
        if m:
            return clean(m.group(1))
    return ""


def slug(url):
    path=urlparse(url).path.strip("/")
    return path or "index"


def source_record(name,url,category,extra=None):
    return {
        "id":f"wikidot5e:{slug(url)}",
        "name":clean(name),
        "url":url,
        "category":category,
        "edition":"2014",
        "source":"D&D 5e Wikidot",
        "sourceUrl":url,
        "referenceOnly":True,
        **(extra or {}),
    }


def discover_spells(page: Page):
    rows=[]
    level=-1
    for line in page.lines:
        m=re.fullmatch(r"(Cantrip|[1-9](?:st|nd|rd|th) Level)",line,re.I)
        if m:
            level=0 if m.group(1).casefold()=="cantrip" else int(m.group(1)[0])
    # The page contains one table per spell level in order.
    levels=list(range(10))
    for table_index,table in enumerate(page.tables[:10]):
        if not table:
            continue
        header=[clean(x) for x in table[0]]
        if "Spell Name" not in header:
            continue
        level=levels[min(table_index,len(levels)-1)]
        for row in table[1:]:
            if not row:
                continue
            cells=row+[""]*(len(header)-len(row))
            data={header[i]:clean(cells[i]) for i in range(len(header))}
            name=data.get("Spell Name","")
            if not name:
                continue
            # Prefer an exact individual-page link by visible name.
            candidates=[u for u,n in page.links if n==name and "/spell:" in urlparse(u).path]
            url=candidates[0] if candidates else BASE+"/spell:"+re.sub(r"[^a-z0-9]+","-",name.casefold()).strip("-")
            rows.append(source_record(name,url,"spell",{
                "level":level,
                "school":re.sub(r"\s*\^.*$","",data.get("School","")).strip(),
                "casting_time":re.sub(r"\s*\^.*$","",data.get("Casting Time","")).strip(),
                "range":data.get("Range",""),
                "duration":data.get("Duration",""),
                "components":[clean(x) for x in data.get("Components","").split(",") if clean(x)],
            }))
    # Same-name UA/published variants must remain distinct.
    unique={}
    for row in rows:
        key=(row["url"],row["name"],row["level"])
        unique[key]=row
    return list(unique.values())


def discover_feats(page: Page):
    out={}
    for url,name in page.links:
        path=urlparse(url).path
        if "/feat:" not in path:
            continue
        out[url]=source_record(name,url,"feat")
    return list(out.values())


def discover_items(page: Page):
    out={}
    for table in page.tables:
        if not table:
            continue
        header=[clean(x) for x in table[0]]
        if not {"Item Name","Type","Source"}.issubset(set(header)):
            continue
        for row in table[1:]:
            cells=row+[""]*(len(header)-len(row))
            data={header[i]:clean(cells[i]) for i in range(len(header))}
            name=data.get("Item Name","")
            if not name:
                continue
            urls=[u for u,n in page.links if n==name and urlparse(u).netloc==urlparse(BASE).netloc]
            url=urls[0] if urls else BASE+"/wondrous-items:"+re.sub(r"[^a-z0-9]+","-",name.casefold()).strip("-")
            out[(url,name)]=source_record(name,url,"item",{
                "itemType":data.get("Type",""),
                "attunement":data.get("Attuned","") not in ("","-","No"),
                "sourceBook":SOURCE_ABBR.get(data.get("Source",""),data.get("Source","")),
                "sourceAbbr":data.get("Source",""),
            })
    return list(out.values())


def parse_spell_detail(row,page):
    lines=page.lines
    source=source_line(lines)
    level_school=""
    for line in lines:
        if re.search(r"\b(cantrip|\d(?:st|nd|rd|th)-level)\b",line,re.I):
            level_school=line
            break
    result={**row}
    if source:
        result["sourceBook"]=source
    if level_school:
        level_match=re.search(r"\b(cantrip|(\d)(?:st|nd|rd|th)-level)\b",level_school,re.I)
        if level_match:
            result["level"]=0 if level_match.group(1).casefold()=="cantrip" else int(level_match.group(2))
            result["_detailLevelParsed"]=True
        school=re.sub(r"^.*?(?:cantrip|\d(?:st|nd|rd|th)-level)\s+","",level_school,flags=re.I)
        if school:
            result["school"]=clean(school)
    for label,key in [("Casting Time","casting_time"),("Range","range"),("Duration","duration")]:
        value=next_value(lines,label)
        if value:
            result[key]=value
    comps=next_value(lines,"Components")
    if comps:
        result["components"]=[clean(x) for x in re.split(r",\s*(?=[VSM](?:\s|\(|$))",comps) if clean(x)]
    for line in lines:
        m=re.match(r"^Spell Lists?\.\s*(.+)$",line,re.I)
        if m:
            result["classes"]=[clean(x) for x in m.group(1).split(",") if clean(x)]
            break
    result["concentration"]="concentration" in result.get("duration","").casefold()
    result["ritual"]=any(re.search(r"\britual\b",line,re.I) for line in lines[:25])
    return result


def parse_feat_detail(row,page):
    result={**row}
    source=source_line(page.lines)
    if source:
        result["sourceBook"]=source
    # Keep prerequisites only when explicitly labeled.
    prereq=next_value(page.lines,"Prerequisite") or next_value(page.lines,"Prerequisites")
    if prereq:
        result["prerequisites"]=[{"kind":"text","label":"Prerequisite","text":prereq}]
    return result


def parse_class_detail(row,page):
    lines=page.lines
    result={**row}
    # Multiclass requirement is a short factual rule useful to the prerequisite engine.
    for line in lines:
        m=re.search(r"You must have (.+?) in order to multiclass in or out of this class",line,re.I)
        if m:
            result["multiclassRequirement"]=clean(m.group(1))
            result["prerequisites"]=[{"kind":"multiclass","label":"Multiclass","text":clean(m.group(1))}]
            break
    hit=next_value(lines,"Hit Dice")
    m=re.search(r"1d(\d+)",hit,re.I)
    if m:
        result["hit_die"]=int(m.group(1))
    saves=next_value(lines,"Saving Throws")
    if saves:
        result["saving_throws"]=[clean(x) for x in saves.split(",") if clean(x)]
    armor=next_value(lines,"Armor")
    weapons=next_value(lines,"Weapons")
    tools=next_value(lines,"Tools")
    result["proficiencies"]=[x for x in [armor,weapons,tools] if x and x.casefold()!="none"]
    source=source_line(lines)
    if source:
        result["sourceBook"]=source
    for table in page.tables:
        if not table:
            continue
        header_index=None
        header=None
        for idx,candidate in enumerate(table[:5]):
            normalized=[clean(x) for x in candidate]
            if "Level" in normalized and "Proficiency Bonus" in normalized and "Features" in normalized:
                header_index=idx
                header=normalized
                break
        if header is not None:
            data_rows=table[header_index+1:]
            result["progression"]=[header]+data_rows
            result["advancement"]=[
                {header[i]:clean((r+[""]*len(header))[i]) for i in range(len(header))}
                for r in data_rows if r
            ]
            break
    return result


def parse_item_detail(row,page):
    result={**row}
    source=source_line(page.lines)
    if source:
        result["sourceBook"]=source
    # Individual item pages commonly lead with "Wondrous item, rare (requires attunement)".
    for line in page.lines[:20]:
        low=line.casefold()
        if any(t in low for t in ("wondrous item","weapon","armor","potion","ring","rod","staff","wand")) and len(line)<180:
            result["itemHeader"]=line
            rarity=re.search(r"\b(common|uncommon|rare|very rare|legendary|artifact)\b",line,re.I)
            if rarity:
                result["rarity"]=rarity.group(1).title()
            if "requires attunement" in low:
                result["attunement"]=True
            break
    return result


def identity_key(value):
    value=clean(value)
    value=re.sub(r"\((?:revised\s+)?ua\)","",value,flags=re.I)
    value=re.sub(r"\s+-\s+DND\s+5th\s+Edition.*$","",value,flags=re.I)
    value=value.replace("’","'").casefold()
    return re.sub(r"[^a-z0-9]+","",value)


def validate_detail(row,page,result):
    expected=identity_key(row.get("name",""))
    visible=[identity_key(line) for line in page.lines[:100]]
    if expected and not any(v==expected or v.startswith(expected) for v in visible if v):
        raise ValueError(f"Page identity check failed for {row.get('name')}")
    category=row["category"]
    if category=="spell":
        required=("level","school","casting_time","range","duration")
        missing=[key for key in required if result.get(key) in (None,"")]
        if missing:
            raise ValueError("Spell parse missing required fields: "+", ".join(missing))
        if not result.get("_detailLevelParsed"):
            raise ValueError("Spell level was not verified from the detail page")
    elif category=="class":
        required=("hit_die","saving_throws","progression")
        missing=[key for key in required if not result.get(key)]
        if missing:
            raise ValueError("Class parse missing required fields: "+", ".join(missing))
        if not result.get("multiclassRequirement"):
            raise ValueError("Class parse missing multiclass requirement")
    elif category=="feat":
        if not result.get("sourceBook"):
            raise ValueError("Feat parse missing source book")
    elif category=="item":
        if not result.get("sourceBook"):
            raise ValueError("Item parse missing source book")
        if not any(result.get(key) not in (None,"",False,[]) for key in ("itemType","rarity","attunement","itemHeader")):
            raise ValueError("Item parse produced no structured mechanics")


DETAIL_PARSERS={"spell":parse_spell_detail,"feat":parse_feat_detail,"class":parse_class_detail,"item":parse_item_detail}


def enrich(rows,limit,delay):
    out=[]
    attempted=0
    for row in rows:
        if limit is not None and attempted>=limit:
            out.extend(rows[len(out):])
            break
        attempted+=1
        try:
            page=parse(row["url"],delay)
            result=DETAIL_PARSERS[row["category"]](row,page)
            validate_detail(row,page,result)
            result.pop("_detailLevelParsed",None)
            result["enrichment"]={
                "version":1,"validated":True,"structuredOnly":True,
                "source":"D&D 5e Wikidot",
                "fetchedAt":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
            }
            out.append(result)
            print(f"[{row['category']}] {attempted}: {row['name']}",flush=True)
        except Exception as error:
            print(f"[{row['category']}] FAILED {row['name']}: {error}",flush=True)
            out.append(row)
    return out


def classes(delay):
    rows=[]
    for name in CLASS_URLS:
        url=BASE+"/"+name
        row=source_record(name.title(),url,"class")
        page=parse(url,delay)
        result=parse_class_detail(row,page)
        validate_detail(row,page,result)
        result["enrichment"]={"version":1,"validated":True,"structuredOnly":True,"source":"D&D 5e Wikidot","fetchedAt":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())}
        rows.append(result)
    return rows


def save(category,rows,write):
    rows.sort(key=lambda r:(r["name"].casefold(),r["id"]))
    if write:
        OUTPUT.mkdir(parents=True,exist_ok=True)
        path=OUTPUT/f"{category}.json"
        path.write_text(json.dumps(rows,ensure_ascii=False)+"\n",encoding="utf-8")
    return {"id":category,"count":len(rows),"write":write}


def self_test():
    html_text="""
    <h1>Fireball</h1><p>Source: Player's Handbook</p><p>3rd-level evocation</p>
    <p>Casting Time: 1 action</p><p>Range: 150 feet</p><p>Components: V, S, M (sample)</p>
    <p>Duration: Instantaneous</p><p>Spell Lists. Sorcerer, Wizard</p>
    """
    p=Page();p.feed(html_text);p.close()
    s=parse_spell_detail(source_record("Fireball",BASE+"/spell:fireball","spell",{"level":3}),p)
    assert s["sourceBook"]=="Player's Handbook" and s["school"]=="evocation"
    assert s["casting_time"]=="1 action" and s["classes"]==["Sorcerer","Wizard"]
    assert s["level"]==3
    validate_detail(source_record("Fireball",BASE+"/spell:fireball","spell",{"level":3}),p,s)

    fighter="""
    <h1>Fighter</h1><p>You must have a Dexterity or Strength score of 13 or higher in order to multiclass in or out of this class.</p>
    <p>Hit Dice: 1d10 per fighter level</p><p>Saving Throws: Strength, Constitution</p>
    <table><tr><th>Level</th><th>Proficiency Bonus</th><th>Features</th></tr><tr><td>1st</td><td>+2</td><td>Fighting Style, Second Wind</td></tr></table>
    """
    p=Page();p.feed(fighter);p.close()
    c=parse_class_detail(source_record("Fighter",BASE+"/fighter","class"),p)
    assert c["hit_die"]==10 and c["saving_throws"]==["Strength","Constitution"]
    assert "13 or higher" in c["multiclassRequirement"] and c["advancement"][0]["Features"].startswith("Fighting Style")
    validate_detail(source_record("Fighter",BASE+"/fighter","class"),p,c)
    print("PASS 5e Wikidot structured importer")


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--categories",nargs="+",choices=["spells","feats","items","classes"],default=["spells","classes","feats","items"])
    ap.add_argument("--limit",type=int)
    ap.add_argument("--delay",type=float,default=0.25)
    ap.add_argument("--write",action="store_true",help="Persist catalog files. Default is dry-run.")
    ap.add_argument("--self-test",action="store_true")
    args=ap.parse_args()
    if args.self_test:
        self_test();return
    manifest={"source":BASE,"kind":"structured-reference-index","complete":args.limit is None,"categories":[],"generatedAt":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),"write":args.write}
    for category in args.categories:
        if category=="classes":
            rows=classes(args.delay)
            if args.limit is not None:
                rows=rows[:args.limit]
        else:
            index=parse(INDEX_URLS[category],args.delay)
            rows={"spells":discover_spells,"feats":discover_feats,"items":discover_items}[category](index)
            rows=enrich(rows,args.limit,args.delay)
        manifest["categories"].append(save(category,rows,args.write))
    if args.write:
        OUTPUT.mkdir(parents=True,exist_ok=True)
        (OUTPUT/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(manifest,indent=2))


if __name__=="__main__":
    main()
