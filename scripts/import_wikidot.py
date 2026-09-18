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


def shard_rows(rows, shard_count, shard_index):
    return [row for i,row in enumerate(rows) if i % shard_count == shard_index]


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
    target=clean(label)
    pattern=re.compile(rf"^{re.escape(target)}\s*:?[ \t]*(.*)$",re.I)
    for i,line in enumerate(lines):
        normalized=clean(line)
        match=pattern.match(normalized)
        if not match:
            continue
        remainder=clean(match.group(1))
        if remainder:
            return remainder
        for candidate in lines[i+1:]:
            candidate=clean(candidate)
            if candidate:
                return candidate
    return ""

def source_line(lines):
    # Site navigation precedes page content, so source metadata may appear well after line 25.
    for line in lines:
        m=re.match(r"^Sou(?:r)?ce\s*:\s*(.+)$",clean(line),re.I)
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


def has_rule_prose(page, entry_name=""):
    """Check that substantive gameplay text exists without persisting that text."""
    start=0
    expected=identity_key(entry_name)
    for i,line in enumerate(page.lines):
        candidate=identity_key(line)
        if expected and (candidate==expected or candidate.startswith(expected)):
            start=i+1
            break
    ignored_prefixes=(
        "create account", "toggle navigation", "about", "membership", "help docs",
        "user guide", "first time user", "quick reference", "creating pages",
        "editing pages", "navigation bars", "using modules", "templates",
        "css themes", "site manager", "edit top bar", "edit side bar",
        "css manager", "recent changes", "list all pages", "click here",
        "append content", "view and manage", "a few useful tools",
        "general wikidot", "wikidot.com"
    )
    labels={
        "casting time","range","components","duration","source","prerequisite","prerequisites",
        "hit dice","hit points at 1st level","hit points at higher levels","armor","weapons",
        "tools","saving throws","skills"
    }
    for line in page.lines[start:]:
        value=clean(line)
        folded=value.casefold()
        if not value or folded in labels or folded.startswith(ignored_prefixes):
            continue
        if len(value)>=55:
            return True
    return False


def heading_present(page, heading):
    target=clean(heading).casefold()
    return any(clean(h).casefold()==target for h in page.headings)


def concise_rule_effect(page, entry_name="", skip_values=()):
    """Retain only a short mechanics line; long rule prose stays source-only."""
    expected=identity_key(entry_name)
    start=0
    for i,line in enumerate(page.lines):
        candidate=identity_key(line)
        if expected and (candidate==expected or candidate.startswith(expected)):
            start=i+1
            break
    skip={clean(v).casefold() for v in skip_values if v}
    ignored_prefixes=(
        "source:", "souce:", "create account", "toggle navigation", "about",
        "membership", "help docs", "user guide", "first time user",
        "quick reference", "creating pages", "editing pages", "navigation bars",
        "using modules", "templates", "css themes", "site manager",
        "edit top bar", "edit side bar", "css manager", "recent changes",
        "list all pages", "menu", "tags", "page revision", "edit this page",
        "edit", "append content", "view and manage", "wikidot.com",
    )
    metadata_prefixes=(
        "casting time", "range", "components", "duration", "spell lists",
        "prerequisite", "prerequisites", "hit dice", "saving throws",
        "armor", "weapons", "tools", "skills",
    )
    saw_long=False
    for line in page.lines[start:]:
        value=clean(line)
        low=value.casefold()
        if not value or low in skip or low==clean(entry_name).casefold():
            continue
        if low.startswith(ignored_prefixes) or low.startswith(metadata_prefixes):
            continue
        if re.fullmatch(r"[a-z0-9-]+(?:\s+[a-z0-9-]+){0,12}",low) and len(value)<70:
            continue
        if len(value) < 35:
            continue
        if len(value) <= 280:
            return value,False
        saw_long=True
    return "",saw_long or has_rule_prose(page,entry_name)


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
        m=re.match(r"^Spell Lists?\s*[:.]\s*(.+)$",line,re.I)
        if m:
            result["classes"]=[clean(x) for x in m.group(1).split(",") if clean(x)]
            break
    result["concentration"]="concentration" in result.get("duration","").casefold()
    result["ritual"]=any(re.search(r"\britual\b",line,re.I) for line in lines)
    effect,needs_summary=concise_rule_effect(
        page,row.get("name",""),
        skip_values=(level_school,result.get("sourceBook",""),result.get("casting_time",""),result.get("range",""),result.get("duration","")),
    )
    if effect:
        result["effect"]=effect
    elif needs_summary:
        result["effectNeedsSummary"]=True
    result["mechanicsPresence"]={"ruleProse":has_rule_prose(page,row.get("name",""))}
    return result


def parse_feat_detail(row,page):
    result={**row}
    result["featType"]="Feat"
    source=source_line(page.lines)
    if source:
        result["sourceBook"]=source
    # Keep prerequisites only when explicitly labeled.
    prereq=next_value(page.lines,"Prerequisite") or next_value(page.lines,"Prerequisites")
    if prereq:
        result["prerequisites"]=[{"kind":"text","label":"Prerequisite","text":prereq}]
    labeled=any(clean(line).casefold() in ("prerequisite","prerequisites") or clean(line).casefold().startswith(("prerequisite:","prerequisites:")) for line in page.lines)
    effect,needs_summary=concise_rule_effect(page,row.get("name",""),skip_values=(result.get("sourceBook",""),prereq))
    if effect:
        result["effect"]=effect
    elif needs_summary:
        result["effectNeedsSummary"]=True
    result["mechanicsPresence"]={
        "ruleProse":has_rule_prose(page,row.get("name","")),
        "prerequisiteLabeled":labeled
    }
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
    if not saves:
        # Some Wikidot renders flatten the proficiency label/value differently.
        # Recover an explicitly visible saving-throw line without inventing data.
        for line in lines:
            m=re.search(r"\bSaving Throws?\b\s*[:\-]?\s*(.+)$",clean(line),re.I)
            if m and clean(m.group(1)):
                saves=clean(m.group(1))
                break
    if saves:
        result["saving_throws"]=[clean(x).lstrip(":;- ").strip() for x in saves.split(",") if clean(x).lstrip(":;- ").strip()]
    armor=next_value(lines,"Armor")
    weapons=next_value(lines,"Weapons")
    tools=next_value(lines,"Tools")
    skills=next_value(lines,"Skills")
    result["proficiencies"]=[x for x in [armor,weapons,tools] if x and x.casefold()!="none"]
    if skills:
        result["skills"]=skills
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
    result["mechanicsPresence"]={
        "ruleProse":has_rule_prose(page,row.get("name","")),
        "classFeatures":heading_present(page,"Class Features"),
        "startingEquipment":heading_present(page,"Equipment")
    }
    return result


def parse_item_detail(row,page):
    result={**row}
    source=source_line(page.lines)
    if source:
        result["sourceBook"]=source

    # The first short rules descriptor after the title/source is authoritative.
    # It can contain a normal rarity, multiple rarities, "unique", "unknown",
    # or a family rule such as "rarity by figurine".
    title_key=identity_key(row.get("name",""))
    title_text=clean(row.get("name","")).casefold()
    start=0
    exact=[i for i,line in enumerate(page.lines) if clean(line).casefold()==title_text]
    if exact:
        start=exact[-1]+1
    else:
        matches=[i for i,line in enumerate(page.lines) if identity_key(line)==title_key]
        if matches:
            start=matches[-1]+1

    descriptor=""
    type_words=("wondrous item","weapon","armor","potion","ring","rod","staff","wand","scroll","ammunition")
    for line in page.lines[start:]:
        value=clean(line)
        low=value.casefold()
        if not value or re.match(r"^sou(?:r)?ce\s*:",value,re.I):
            continue
        if len(value)<=240 and any(low.startswith(word) for word in type_words):
            descriptor=value
            break

    if descriptor:
        result["itemHeader"]=descriptor
        head=clean(descriptor.split(",",1)[0])
        if head:
            result["itemType"]=head

        rarity_matches=[]
        for match in re.finditer(r"\b(common|uncommon|rare|very rare|legendary|artifact)\b",descriptor,re.I):
            value=match.group(1).title()
            if value not in rarity_matches:
                rarity_matches.append(value)

        low=descriptor.casefold()
        explicit_varies=bool(re.search(r"\b(?:rarity\s+)?varies\b",low))
        if explicit_varies or "rarity by" in low or len(rarity_matches)>1:
            result["rarity"]="Varies"
            if rarity_matches:
                result["rarityOptions"]=rarity_matches
            m=re.search(r"rarity by\s+([^,(]+)",descriptor,re.I)
            if m:
                result["rarityRule"]=clean(m.group(1))
        elif rarity_matches:
            result["rarity"]=rarity_matches[0]
        elif "unknown rarity" in low or re.search(r",\s*\?{2,}",descriptor):
            result["rarity"]="Unknown"
        elif re.search(r"\bunique\b",descriptor,re.I):
            result["rarity"]="Unique"

        if "requires attunement" in low:
            result["attunement"]=True

    # Wikidot also exposes canonical rarity tags near the page footer. Use them
    # only as a fallback/consistency signal when the descriptor is ambiguous.
    tag_map={
        "very-rare":"Very Rare","uncommon":"Uncommon","rare":"Rare",
        "legendary":"Legendary","artifact":"Artifact","common":"Common",
    }
    tag_rarities=[]
    for line in page.lines[-45:]:
        folded=clean(line).casefold()
        for token in re.findall(r"\b(?:very-rare|uncommon|legendary|artifact|common|rare)\b",folded):
            value=tag_map[token]
            if value not in tag_rarities:
                tag_rarities.append(value)
    if not result.get("rarity"):
        if len(tag_rarities)==1:
            result["rarity"]=tag_rarities[0]
        elif len(tag_rarities)>1:
            result["rarity"]="Varies"
            result["rarityOptions"]=tag_rarities
    elif result.get("rarity")=="Varies" and tag_rarities:
        result.setdefault("rarityOptions",tag_rarities)

    result.setdefault("attunement",False)
    effect,needs_summary=concise_rule_effect(
        page,row.get("name",""),
        skip_values=(result.get("sourceBook",""),descriptor),
    )
    if effect:
        result["effect"]=effect
    elif needs_summary:
        result["effectNeedsSummary"]=True
    result["mechanicsPresence"]={"ruleProse":has_rule_prose(page,row.get("name",""))}
    return result


def identity_key(value):
    value=clean(value)
    value=re.sub(r"\(revised\s+ua\)","(revised)",value,flags=re.I)
    value=re.sub(r"\(ua\)","",value,flags=re.I)
    value=re.sub(r"\s+-\s+DND\s+5th\s+Edition.*$","",value,flags=re.I)
    value=value.replace("’","'").casefold()
    return re.sub(r"[^a-z0-9]+","",value)


def enrichment_gaps(row,result):
    """Gameplay-critical completeness contract. Any gap blocks enrichment release."""
    category=row["category"]
    presence=result.get("mechanicsPresence") or {}
    gaps=[]
    if category=="spell":
        for key in ("level","school","casting_time","components","range","duration","classes"):
            if result.get(key) in (None,"",[]):
                gaps.append(key)
        if not presence.get("ruleProse"):
            gaps.append("spellEffect")
    elif category=="class":
        for key in ("hit_die","saving_throws","progression","multiclassRequirement","proficiencies","skills"):
            if result.get(key) in (None,"",[]):
                gaps.append(key)
        if not presence.get("classFeatures"):
            gaps.append("classFeatures")
        if not presence.get("startingEquipment"):
            gaps.append("startingEquipment")
        if not presence.get("ruleProse"):
            gaps.append("classRuleText")
    elif category=="feat":
        if presence.get("prerequisiteLabeled") and not result.get("prerequisites"):
            gaps.append("prerequisites")
        if not presence.get("ruleProse"):
            gaps.append("featEffect")
    elif category=="item":
        for key in ("itemType","rarity"):
            if result.get(key) in (None,""):
                gaps.append(key)
        if "attunement" not in result:
            gaps.append("attunement")
        if not presence.get("ruleProse"):
            gaps.append("itemEffect")
    return sorted(set(gaps))


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


def candidate_summary(row,result):
    name=clean(row.get("name",""))
    source=clean(result.get("sourceBook","") or row.get("source","D&D 5e Wikidot"))
    category=row.get("category")
    if category=="class":
        bits=[]
        if result.get("hit_die"): bits.append(f"d{result['hit_die']} hit die")
        if result.get("multiclassRequirement"): bits.append("multiclass requirement recorded")
        return f"{name} is a D&D 5e class{(' with '+', '.join(bits)) if bits else ''}. Source: {source}."
    if category=="spell":
        level=result.get("level")
        school=clean(result.get("school",""))
        label="cantrip" if level==0 else (f"level {level} spell" if level is not None else "spell")
        return f"{name} is a D&D 5e {label}{(' in '+school) if school else ''}. Source: {source}."
    if category=="feat":
        return f"{name} is a D&D 5e feat. Source: {source}."
    if category=="item":
        item_type=clean(result.get("itemType") or "magic item")
        rarity=clean(result.get("rarity") or "")
        return f"{name} is a D&D 5e {rarity+' ' if rarity else ''}{item_type}. Source: {source}."
    return f"{name} is a D&D 5e reference entry. Source: {source}."


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
            gaps=enrichment_gaps(row,result)
            result["generatedDescription"]=candidate_summary(row,result)
            result.pop("_detailLevelParsed",None)
            result["enrichment"]={
                "version":1,"validated":True,"partial":bool(gaps),"missingExpected":gaps,
                "structuredOnly":True,"source":"D&D 5e Wikidot",
                "fetchedAt":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
            }
            out.append(result)
            print(f"[{row['category']}] {attempted}: {row['name']}",flush=True)
        except Exception as error:
            print(f"[{row['category']}] FAILED {row['name']}: {error}",flush=True)
            out.append(row)
    return out


def classes(delay, source_rows=None):
    rows=[]
    source_rows=source_rows or [source_record(name.title(),BASE+"/"+name,"class") for name in CLASS_URLS]
    for row in source_rows:
        url=row["url"]
        page=parse(url,delay)
        result=parse_class_detail(row,page)
        validate_detail(row,page,result)
        gaps=enrichment_gaps(row,result)
        result["generatedDescription"]=candidate_summary(row,result)
        result["enrichment"]={"version":1,"validated":True,"partial":bool(gaps),"missingExpected":gaps,"structuredOnly":True,"source":"D&D 5e Wikidot","fetchedAt":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())}
        rows.append(result)
    return rows


def save(category,rows,write,candidate_dir=None,shard_count=1,shard_index=0):
    rows.sort(key=lambda r:(r["name"].casefold(),r["id"]))
    if write:
        OUTPUT.mkdir(parents=True,exist_ok=True)
        path=OUTPUT/f"{category}.json"
        path.write_text(json.dumps(rows,ensure_ascii=False)+"\n",encoding="utf-8")
    if candidate_dir is not None:
        target_dir=candidate_dir/"wikidot5e"
        target_dir.mkdir(parents=True,exist_ok=True)
        target=target_dir/(f"{category}-shard-{shard_index}.json" if shard_count>1 else f"{category}.json")
        target.write_text(json.dumps(rows,ensure_ascii=False)+"\n",encoding="utf-8")
    return {"id":category,"count":len(rows),"write":write,"candidate":str(candidate_dir) if candidate_dir else None}


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

    item_html="""
    <title>Armor Of Fungal Spores - DND 5th Edition</title>
    <h1>DND 5th Edition</h1><h2>community wiki</h2>
    <p>Armor Of Fungal Spores</p><p>Source: The Book of Many Things</p>
    <p>Armor (medium), uncommon</p>
    <p>While wearing this armor, its property has a gameplay effect described here.</p>
    """
    p=Page();p.feed(item_html);p.close()
    item=parse_item_detail(source_record("Armor Of Fungal Spores",BASE+"/wondrous-items:armor-of-fungal-spores","item"),p)
    assert item["itemType"]=="Armor (medium)" and item["rarity"]=="Uncommon"
    assert item["effect"].startswith("While wearing this armor")

    family_html="""
    <title>Instrument of the Bards - DND 5th Edition</title>
    <p>Instrument of the Bards</p><p>Source: Dungeon Master's Guide</p>
    <p>Wondrous item, rarity varies (requires attunement by a bard)</p>
    <p>This family has several variants with different rarities.</p>
    <p>legendary rare uncommon very-rare wondrous-item</p>
    """
    p=Page();p.feed(family_html);p.close()
    item=parse_item_detail(source_record("Instrument of the Bards",BASE+"/wondrous-items:instrument-of-the-bards","item"),p)
    assert item["itemType"]=="Wondrous item" and item["rarity"]=="Varies"
    assert set(item["rarityOptions"])=={"Legendary","Rare","Uncommon","Very Rare"}

    tag_fallback_html="""
    <title>Deck Of Wild Cards - DND 5th Edition</title>
    <p>Deck Of Wild Cards</p><p>Source: The Book of Many Things</p>
    <p>Wondrous Item, mysterious</p><p>Game mechanics text.</p>
    <p>bomt very-rare wondrous-item</p>
    """
    p=Page();p.feed(tag_fallback_html);p.close()
    item=parse_item_detail(source_record("Deck Of Wild Cards",BASE+"/wondrous-items:deck-of-wild-cards","item"),p)
    assert item["rarity"]=="Very Rare"

    fighter="""
    <h1>Fighter</h1><p>You must have a Dexterity or Strength score of 13 or higher in order to multiclass in or out of this class.</p>
    <p>Hit Dice: 1d10 per fighter level</p><p>Saving Throws: Strength, Constitution</p>
    <table><tr><th>Level</th><th>Proficiency Bonus</th><th>Features</th></tr><tr><td>1st</td><td>+2</td><td>Fighting Style, Second Wind</td></tr></table>
    """
    p=Page();p.feed(fighter);p.close()
    c=parse_class_detail(source_record("Fighter",BASE+"/fighter","class"),p)
    assert c["hit_die"]==10 and c["saving_throws"]==["Strength","Constitution"]

    sorcerer_inline="""
    <p>Sorcerer</p><p>You must have a Charisma score of 13 or higher in order to multiclass in or out of this class.</p>
    <p>Hit Dice: 1d6 per sorcerer level</p><p>Saving Throws : Constitution, Charisma</p>
    <p>Armor: None</p><p>Weapons: Daggers</p><p>Skills: Choose two</p>
    <h2>Class Features</h2><h3>Equipment</h3>
    <table><tr><th>Level</th><th>Proficiency Bonus</th><th>Features</th></tr><tr><td>1st</td><td>+2</td><td>Spellcasting</td></tr></table>
    """
    p2=Page();p2.feed(sorcerer_inline);p2.close()
    sc=parse_class_detail(source_record("Sorcerer",BASE+"/sorcerer","class"),p2)
    assert sc["saving_throws"]==["Constitution","Charisma"]
    assert "13 or higher" in c["multiclassRequirement"] and c["advancement"][0]["Features"].startswith("Fighting Style")
    validate_detail(source_record("Fighter",BASE+"/fighter","class"),p,c)
    assert [r["id"] for r in shard_rows([
        {"id":"a"},{"id":"b"},{"id":"c"},{"id":"d"}
    ],2,1)]==["b","d"]
    print("PASS 5e Wikidot structured importer")


REQUIRED_AUDIT_CATEGORIES = {
    "3.5/classes","3.5/feats","3.5/spells","3.5/items","3.5/equipment",
    "5e/classes","5e/spells","5e/feats","5e/items"
}


def audit_report_allows_write(path):
    if not path:
        return False
    report_path=Path(path)
    if not report_path.exists():
        return False
    try:
        report=json.loads(report_path.read_text(encoding="utf-8"))
    except Exception:
        return False
    return (
        report.get("readOnly") is True
        and report.get("fullCatalog") is True
        and report.get("strictGameplayCompleteness") is True
        and report.get("passed") is True
        and report.get("sourceExtractionVerified") is True
        and report.get("outputCompletenessVerified") is True
        and report.get("releaseReady") is True
        and report.get("criticalMissingCount") == 0
        and float(report.get("minimumRate",0)) >= 1.0
        and {row.get("category") for row in report.get("categories",[])} == REQUIRED_AUDIT_CATEGORIES
        and all(float(row.get("successRate",0)) >= 1.0 and row.get("failed",1) == 0 for row in report.get("categories",[]))
    )


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--categories",nargs="+",choices=["spells","feats","items","classes"],default=["spells","classes","feats","items"])
    ap.add_argument("--limit",type=int)
    ap.add_argument("--delay",type=float,default=0.25)
    ap.add_argument("--write",action="store_true",help="Persist catalog files. Blocked without a passing full-catalog audit.")
    ap.add_argument("--audit-report",help="Path to a strict full-catalog preflight report required for --write.")
    ap.add_argument("--candidate-dir",type=Path,help="Write dry-run candidate JSON here; never modifies the bundled catalog.")
    ap.add_argument("--shard-count",type=int,default=1)
    ap.add_argument("--shard-index",type=int,default=0)
    ap.add_argument("--self-test",action="store_true")
    args=ap.parse_args()
    if args.self_test:
        self_test();return
    if args.shard_count < 1 or not 0 <= args.shard_index < args.shard_count:
        ap.error("--shard-index must be within 0..--shard-count-1")
    if args.shard_count > 1 and args.write:
        ap.error("Sharded imports are candidate-only and cannot use --write")
    if args.write and not audit_report_allows_write(args.audit_report):
        raise SystemExit("--write is locked until a strict full-catalog audit report passes with zero critical gaps.")
    manifest={"source":BASE,"kind":"structured-reference-index","complete":args.limit is None and args.shard_count==1,"categories":[],"generatedAt":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),"write":args.write}
    for category in args.categories:
        if category=="classes":
            source_rows=[source_record(name.title(),BASE+"/"+name,"class") for name in CLASS_URLS]
            if args.shard_count>1:
                source_rows=shard_rows(source_rows,args.shard_count,args.shard_index)
            rows=classes(args.delay,source_rows)
            if args.limit is not None:
                rows=rows[:args.limit]
        else:
            index=parse(INDEX_URLS[category],args.delay)
            source_rows={"spells":discover_spells,"feats":discover_feats,"items":discover_items}[category](index)
            if args.shard_count>1:
                source_rows=shard_rows(source_rows,args.shard_count,args.shard_index)
            rows=enrich(source_rows,args.limit,args.delay)
        manifest["categories"].append(save(
            category,rows,args.write,args.candidate_dir,
            shard_count=args.shard_count,shard_index=args.shard_index
        ))
    if args.write:
        OUTPUT.mkdir(parents=True,exist_ok=True)
        (OUTPUT/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(manifest,indent=2))


if __name__=="__main__":
    main()
