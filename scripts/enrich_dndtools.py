"""Incrementally enrich the bundled DnD Tools index with structured factual metadata.

This intentionally does NOT copy long source-book prose. It extracts short factual
fields, prerequisite labels, source metadata, spell/class associations, and tables.
Generated descriptions are handled by the app's canonical content layer.

Usage:
  python scripts/enrich_dndtools.py --categories classes feats spells items equipment
  python scripts/enrich_dndtools.py --categories classes --limit 25
  python scripts/enrich_dndtools.py --self-test
"""
from __future__ import annotations

import argparse
import html
import hashlib
import json
import re
import time
from html.parser import HTMLParser
from http.client import RemoteDisconnected
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

BASE = "https://new.dndtools.org"
LEGACY_CLASS_BASE = "https://dndtools.net/classes"
ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "public" / "catalogs" / "dndtools"
AGENT = "AdventurersLedger-StructuredEnricher/1.0 (+https://github.com/mahdt17/DND-Charactersheet-Website)"
DEFAULT_CATEGORIES = ["classes", "feats", "spells", "items", "equipment"]
BLOCK_TAGS = {"p","div","section","article","header","footer","dt","dd","li","h1","h2","h3","h4","h5","h6","br"}
SKIP_TAGS = {"script","style","noscript","svg"}
HEADING_TAGS = {"h1","h2","h3","h4","h5","h6"}


def clean(value: str) -> str:
    return " ".join(html.unescape(value or "").replace("\xa0", " ").split()).strip()


class DetailParser(HTMLParser):
    """Small dependency-free visible-text + table parser.

    DnD Tools pages have changed markup over time, so extraction intentionally keys
    off rendered labels/headings rather than CSS classes.
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.lines: list[str] = []
        self.headings: list[str] = []
        self._buf: list[str] = []
        self._skip = 0
        self._heading = None
        self._table_depth = 0
        self._row: list[str] | None = None
        self._cell: list[str] | None = None
        self.tables: list[list[list[str]]] = []
        self._table: list[list[str]] | None = None

    def flush(self):
        text = clean(" ".join(self._buf))
        self._buf = []
        if text and (not self.lines or self.lines[-1] != text):
            self.lines.append(text)
            if self._heading and text not in self.headings:
                self.headings.append(text)

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag in SKIP_TAGS:
            self._skip += 1
            return
        if self._skip:
            return
        if tag in BLOCK_TAGS:
            self.flush()
        if tag in HEADING_TAGS:
            self._heading = tag
        if tag == "table":
            self.flush()
            self._table_depth += 1
            if self._table_depth == 1:
                self._table = []
        elif tag == "tr" and self._table_depth:
            self._row = []
        elif tag in {"td","th"} and self._table_depth:
            self._cell = []

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in SKIP_TAGS:
            self._skip = max(0, self._skip - 1)
            return
        if self._skip:
            return
        if tag in {"td","th"} and self._table_depth and self._cell is not None:
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
        if tag in BLOCK_TAGS:
            self.flush()
        if tag in HEADING_TAGS:
            self._heading = None

    def handle_data(self, data):
        if self._skip:
            return
        if self._cell is not None:
            self._cell.append(data)
        else:
            self._buf.append(data)

    def close(self):
        super().close()
        self.flush()


def fetch_allowed(url: str, allowed_hosts: set[str], delay: float = 0.35) -> str:
    if urlparse(url).netloc not in allowed_hosts:
        raise ValueError(f"Refusing URL host: {url}")
    last = None
    for attempt in range(4):
        try:
            if delay:
                time.sleep(delay)
            req = Request(url, headers={"User-Agent": AGENT, "Cache-Control": "no-cache"})
            with urlopen(req, timeout=45) as response:
                final = response.geturl()
                if urlparse(final).netloc not in allowed_hosts:
                    raise ValueError(f"Unexpected redirect: {final}")
                return response.read().decode("utf-8", "replace")
        except HTTPError as error:
            last = error
            if error.code not in (429,500,502,503,504) or attempt == 3:
                raise
            time.sleep(min(45, 3 * (attempt + 1)))
        except (URLError, TimeoutError, RemoteDisconnected, ConnectionResetError) as error:
            last = error
            if attempt == 3:
                raise
            time.sleep(3 * (attempt + 1))
    raise last


def fetch(url: str, delay: float = 0.35) -> str:
    return fetch_allowed(url,{urlparse(BASE).netloc},delay)


def next_value(lines: list[str], label: str) -> str:
    key = clean(label).casefold()
    for i, line in enumerate(lines):
        normalized = clean(line)
        if normalized.casefold() == key:
            for value in lines[i+1:]:
                value = clean(value)
                if value:
                    return value
        match = re.match(rf"^{re.escape(label)}\s*:\s*(.+)$", normalized, re.I)
        if match:
            return clean(match.group(1))
    return ""


def section(lines: list[str], headings: list[str], name: str) -> list[str]:
    target = clean(name).casefold()
    start = None
    heading_set = {clean(h).casefold() for h in headings}
    for i, line in enumerate(lines):
        if clean(line).casefold() == target:
            start = i + 1
            break
    if start is None:
        return []
    out = []
    for line in lines[start:]:
        normalized = clean(line)
        if normalized.casefold() in heading_set and normalized.casefold() != target:
            break
        if normalized:
            out.append(normalized)
    return out


def source_meta(lines: list[str]) -> dict:
    # Typical examples:
    # "Prestige Class Complete Warrior (CW), p. 79"
    # "Player's Handbook v.3.5 (PH), p. 251"
    joined = " | ".join(lines[:30])
    match = re.search(r"(?:(?:Prestige|Base|NPC|Psionic) Class\s+)?([^|]{2,120}?)\s*\(([A-Za-z0-9 .&':-]{1,20})\)\s*(?:,\s*p\.\s*(\d+))?", joined)
    if not match:
        for line in lines:
            fallback = re.match(r"^Source\s*:\s*(.+)$", clean(line), re.I)
            if fallback:
                return {"sourceBook": clean(fallback.group(1))}
        return {}
    book = clean(match.group(1))
    book = re.sub(r"^(Save|General feat|Epic feat|Item Creation feat|Metamagic feat|Psionic feat|Fighter Bonus Feat feat)\s+", "", book, flags=re.I)
    result = {"sourceBook": book, "sourceAbbr": clean(match.group(2))}
    if match.group(3):
        result["sourcePage"] = int(match.group(3))
    return result


def has_rule_prose(lines: list[str], entry_name: str = "") -> bool:
    """Confirm the page contains substantive gameplay prose without storing it."""
    start = 0
    target = clean(entry_name).casefold()
    if target:
        for i,line in enumerate(lines):
            if clean(line).casefold() == target:
                start = i + 1
                break
    ignored_prefixes = (
        "dnd tools", "favorites ", "characters spells ", "open menu", "back to ",
        "privacy ", "d&d 3.5 reference data", "source:"
    )
    metadata_labels = {
        "save","hit die","skill points","min. bab req.","min bab req.","requirements",
        "class features","advancement","class skills","school","casting time","components",
        "range","target","targets","area","effect","duration","saving throw","spell resistance",
        "classes","domains","descriptors","price","cost","weight","body slot","caster level",
        "aura","activation","rarity","type","kind","category","ac bonus","max dex",
        "armor check penalty","arcane spell failure","speed 30","speed 20","damage (s)",
        "damage (m)","critical","range increment","prerequisite","prerequisites","benefit",
        "normal","special","description"
    }
    for line in lines[start:]:
        value = clean(line)
        folded = value.casefold()
        if not value or folded in metadata_labels or folded.startswith(ignored_prefixes):
            continue
        if re.match(r"^(?:prestige|base|npc|psionic) class\b", folded):
            continue
        if re.search(r"\([A-Za-z0-9 .&'-]{1,16}\)\s*(?:,\s*p\.\s*\d+)?$", value):
            continue
        if len(value) >= 25:
            return True
    return False


def parse_requirement_lines(lines: list[str]) -> list[dict]:
    out = []
    for line in lines:
        match = re.match(r"^([^:]{2,40}):\s*(.+)$", line)
        if match:
            label, value = clean(match.group(1)), clean(match.group(2))
            out.append({"kind": label.casefold().replace(" ", "_"), "label": label, "text": value})
        elif line and not re.match(r"^(Requirements?|Save)$", line, re.I):
            out.append({"kind":"text","label":"","text":line})
    return out


def legacy_class_url(entry: dict) -> str:
    slug=urlparse(entry.get("url","")).path.rstrip("/").split("/")[-1]
    slug=re.sub(r"-\d+$","",slug)
    return f"{LEGACY_CLASS_BASE}/{slug}/"


CLASS_SKILL_NAMES = [
    "Appraise","Balance","Bluff","Climb","Concentration","Craft","Decipher Script",
    "Diplomacy","Disable Device","Disguise","Escape Artist","Forgery","Gather Information",
    "Handle Animal","Heal","Hide","Intimidate","Jump","Knowledge","Listen","Move Silently",
    "Open Lock","Perform","Profession","Ride","Search","Sense Motive","Sleight of Hand",
    "Speak Language","Spellcraft","Spot","Survival","Swim","Tumble","Use Magic Device",
    "Use Rope","Animal Empathy","Innuendo","Intuit Direction","Pick Pocket","Read Lips",
    "Scry","Wilderness Lore","Alchemy"
]

def tokenize_known_skills(value: str) -> list[str]:
    compact=re.sub(r"[^a-z]","",clean(value).casefold())
    hits=[]
    for skill in CLASS_SKILL_NAMES:
        needle=re.sub(r"[^a-z]","",skill.casefold())
        start=0
        while needle and (idx:=compact.find(needle,start))>=0:
            hits.append((idx,-len(needle),skill))
            start=idx+len(needle)
    hits.sort()
    result=[]
    occupied=[]
    for idx,neglen,skill in hits:
        end=idx-neglen
        if any(not (end<=a or idx>=b) for a,b in occupied):
            continue
        occupied.append((idx,end))
        result.append((idx,skill))
    return [skill for _,skill in sorted(result)]


CLASS_SKILL_RULE_NUMBER_WORDS = {
    "one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,"eight":8,"nine":9,"ten":10,
    "eleven":11,"twelve":12,"thirteen":13,"fourteen":14,"fifteen":15,"sixteen":16,"seventeen":17,
    "eighteen":18,"nineteen":19,"twenty":20,
}

def parse_class_skill_rule(parser: DetailParser):
    """Capture class-skill mechanics that cannot truthfully be flattened to a fixed list."""
    for line in parser.lines:
        value=clean(line)
        body=re.sub(r"^Class Skills?\s*:?\s*","",value,flags=re.I)
        choose=re.search(
            r"\bchoose any\s+([A-Za-z0-9-]+)\s+skills?\s+as class skills?\s*,?\s*plus\s+(.+?)(?:\.|$)",
            body,re.I
        )
        if choose:
            raw_count=choose.group(1).casefold()
            count=int(raw_count) if raw_count.isdigit() else CLASS_SKILL_RULE_NUMBER_WORDS.get(raw_count)
            extras=tokenize_known_skills(choose.group(2))
            if count and extras:
                return {"mode":"choose_any","count":count,"additional":extras}
        if re.search(
            r"any skill that is a class skill for one of .+ other classes\s+is a class skill for .+ class as well",
            body,re.I
        ):
            return {"mode":"inherit_from_other_classes"}
        if re.search(
            r"can spend (?:his|her|their) skill points to purchase any skills? that any of .+ previous classes(?:\s*\([^)]*\))?\s+have made available as a class skill",
            body,re.I
        ):
            return {"mode":"inherit_from_previous_classes_or_race"}
    return None


def parse_class_skills(parser: DetailParser) -> list[str]:
    skills = section(parser.lines, parser.headings, "Class Skills")
    names=[]

    def add_from_sentence(line: str):
        value=clean(line)
        # Common source shape: "The X's class skills ... are Balance (Dex), Craft (Int), ..."
        match=re.search(r"class skills(?:\s*\([^)]*\))?\s+(?:are|include)\s+(.+?)(?:\.\s*(?:Skill Points|See |$)|$)",value,re.I)
        if not match:
            return
        body=match.group(1)
        body=re.sub(r"\([^)]*\)","",body)
        body=body.replace(" and ",", ")
        for part in body.split(","):
            skill=clean(part)
            if skill:
                names.append(skill)

    for line in skills[:12]:
        add_from_sentence(line)
        if len(line) < 500 and not re.search(r"\b(class skills|skill points|key ability|trained only|armor check penalty)\b",line,re.I):
            names += tokenize_known_skills(line)

    for line in parser.lines:
        if re.search(r"class skills",line,re.I):
            add_from_sentence(line)
        # Some HTML renders all linked skill names without separators.
        if len(line) < 500:
            tokenized=tokenize_known_skills(line)
            if len(tokenized)>=2 and ("Class Skills" in parser.headings or line in skills):
                names += tokenized

    for table in parser.tables:
        if not table:
            continue
        header=[clean(x).casefold() for x in table[0]]
        if "skill name" in header:
            for row in table[1:]:
                if row and clean(row[0]):
                    names.append(clean(row[0]))

    cleaned=[]
    blocked={"skill name","key ability","trained only","armor check penalty","class skills","spells"}
    for name in names:
        value=clean(name).strip(" .;:")
        if not value or value.casefold() in blocked:
            continue
        if re.fullmatch(r"(?:Int|Wis|Dex|Str|Con|Cha)",value,re.I):
            continue
        if value not in cleaned:
            cleaned.append(value)
    return cleaned


def parse_progression_table(parser: DetailParser):
    for table in parser.tables:
        if not table:
            continue
        for idx,candidate in enumerate(table[:5]):
            header=[clean(c) for c in candidate]
            folded=[h.casefold() for h in header]
            has_level=any(h=="level" or h.endswith(" level") or h=="racial level" for h in folded)
            has_progress=any(h in folded for h in ("bab","base attack bonus","fort","fortitude","ref","reflex","will","special","spellcasting","class level"))
            if has_level and has_progress:
                data_rows=table[idx+1:]
                rows=[]
                for row in data_rows:
                    values=row+[""]*max(0,len(header)-len(row))
                    rows.append({header[i] or f"column_{i+1}":clean(values[i]) for i in range(len(header))})
                return [header]+data_rows,rows
    return None,None


def class_source_kind(lines: list[str]) -> str:
    """Read class type only from an actual source header, never incidental prose."""
    for line in lines[:30]:
        match=re.match(r"^(Prestige|Base|NPC|Psionic|Racial|Monster)\s+Class\b",clean(line),re.I)
        if match:
            return match.group(1).casefold()
    return ""


def explicit_variant_parent(lines: list[str], entry_name: str) -> str:
    joined=" ".join(lines)
    patterns=[
        r"same hit dice,.*?advancement as (?:a |the )?standard ([A-Za-z ]+?)(?:\s*\(|\s+except|\s+as|\.)",
        r"retained from base class,?\s*(?:the\s+)?([A-Za-z]+)",
        r"has all the standard ([A-Za-z ]+?) class features",
        r"standard ([A-Za-z]+) class feature",
        r"adapt(?:ing)? (?:the )?([A-Za-z' -]+?) prestige class",
        r"adapt(?:ing)? (?:the )?([A-Za-z' -]+?) class",
    ]
    for pattern in patterns:
        match=re.search(pattern,joined,re.I)
        if match:
            parent=clean(match.group(1)).title()
            parent=re.sub(r"\s+From\s+.*$","",parent,flags=re.I)
            return parent

    # Racial/organization substitution levels retain their named base class unless
    # the page explicitly supplies a replacement mechanic. This fills only absent fields.
    if re.search(r"\bsubstitution levels?\b",joined,re.I):
        standard_classes=(
            "Barbarian","Bard","Cleric","Druid","Fighter","Monk","Paladin",
            "Ranger","Rogue","Sorcerer","Wizard"
        )
        for base in standard_classes:
            if re.search(rf"\b{re.escape(base)}\b",entry_name or "",re.I):
                return base

    # Unearthed Arcana "[base class] Variant" records inherit the named base class.
    variant=re.fullmatch(r"(.+?)\s+Variant",clean(entry_name or ""),re.I)
    if variant:
        base=clean(variant.group(1))
        wizard_schools={"Abjurer","Conjurer","Diviner","Enchanter","Evoker","Illusionist","Necromancer","Transmuter"}
        if base.title() in wizard_schools:
            return "Wizard"
        if base in {"Fighter","Ranger","Rogue","Wizard","Barbarian","Bard","Cleric","Druid","Monk","Paladin"}:
            return base.title()

    if clean(entry_name).casefold().startswith("epic "):
        base=clean(entry_name)[5:]
        if base:
            return base.title()

    parenthetical=re.search(r"\(([^)]+)\)\s*$",entry_name or "")
    if parenthetical and len(parenthetical.group(1).split())<=2:
        return clean(parenthetical.group(1)).title()
    return ""


_CLASS_SUPPLEMENT_CACHE=None

def class_supplements():
    global _CLASS_SUPPLEMENT_CACHE
    if _CLASS_SUPPLEMENT_CACHE is None:
        path=ROOT/"scripts"/"class_supplements_35.json"
        payload=json.loads(path.read_text(encoding="utf-8")) if path.exists() else {"entries":{}}
        _CLASS_SUPPLEMENT_CACHE=payload.get("entries",{})
    return _CLASS_SUPPLEMENT_CACHE


def normalized_compare(value):
    if isinstance(value,str):
        return re.sub(r"\s+"," ",value.replace("’","'").strip()).casefold()
    if isinstance(value,list):
        if all(isinstance(x,str) for x in value):
            return sorted(normalized_compare(x) for x in value)
        return [normalized_compare(x) for x in value]
    if isinstance(value,dict):
        return {k:normalized_compare(v) for k,v in sorted(value.items()) if k not in {"provenance"}}
    return value


def apply_class_supplement(entry: dict, details: dict) -> dict:
    supplement=class_supplements().get(entry.get("id"))
    if not supplement:
        return details
    if clean(supplement.get("name","")).casefold()!=clean(entry.get("name","")).casefold():
        raise ValueError(f"Supplement identity mismatch for {entry.get('name')}")
    result={**details}
    conflicts=[]
    merge_keys=("inheritsFrom","sourceEdition","notes","prestige","hit_die","skillPoints","classSkills","classSkillRule","prerequisites","progression","featureNames")
    for key in merge_keys:
        supplied=supplement.get(key)
        if supplied in (None,"",[],{}):
            continue
        existing=result.get(key)
        if existing in (None,"",[],{}):
            result[key]=supplied
        elif normalized_compare(existing)!=normalized_compare(supplied):
            conflicts.append(key)
    if result.get("progression") and not result.get("advancement"):
        header=result["progression"][0] if result["progression"] else []
        result["advancement"]=[
            {header[i] or f"column_{i+1}":clean((row+[""]*len(header))[i]) for i in range(len(header))}
            for row in result["progression"][1:] if row
        ]
    result["supplementProvenance"]=supplement.get("provenance",[])
    result["supplementVerified"]=True
    if conflicts:
        result["supplementConflicts"]=conflicts
    presence=result.get("mechanicsPresence") or {}
    if supplement.get("featureNames"):
        presence["classFeatures"]=True
        presence["ruleProse"]=True
    result["mechanicsPresence"]=presence
    return result


_CLASS_CATALOG_CACHE=None

def class_catalog_rows():
    global _CLASS_CATALOG_CACHE
    if _CLASS_CATALOG_CACHE is None:
        _CLASS_CATALOG_CACHE=json.loads((CATALOG/"classes.json").read_text(encoding="utf-8"))
    return _CLASS_CATALOG_CACHE


def parse_class_core(parser: DetailParser, entry: dict) -> dict:
    lines=parser.lines
    result={
        **source_meta(lines),
        "hit_die": int(m.group(1)) if (m := re.search(r"d\s*(\d+)", next_value(lines, "Hit Die"), re.I)) else None,
        "skillPoints": next_value(lines, "Skill Points"),
        "minBab": next_value(lines, "Min. BAB Req.") or next_value(lines, "Min BAB Req."),
        "prerequisites": parse_requirement_lines(section(lines, parser.headings, "Requirements")),
    }
    source_kind=class_source_kind(lines)
    if source_kind=="prestige":
        result["prestige"]=True
    if source_kind in {"racial","monster"}:
        result["racialClass"]=True
    progression,advancement=parse_progression_table(parser)
    if progression:
        result["progression"]=progression
        result["advancement"]=advancement
    skills=parse_class_skills(parser)
    if skills:
        result["classSkills"]=skills
    else:
        skill_rule=parse_class_skill_rule(parser)
        if skill_rule:
            result["classSkillRule"]=skill_rule
    if progression:
        progression_headers={clean(x).casefold() for x in progression[0]}
        if "skill points" in progression_headers and progression_headers.intersection({"cr","challenge rating","hit dice"}):
            result["racialClass"]=True
    parent=explicit_variant_parent(lines,entry.get("name",""))
    if parent:
        result["inheritsFrom"]=parent
    has_special_progression=any(
        isinstance(row,dict) and any(str(key).casefold()=="special" for key in row)
        for row in result.get("advancement",[])
    )
    result["mechanicsPresence"]={
        "classFeatures":bool(section(lines,parser.headings,"Class Features")) or (has_special_progression and has_rule_prose(lines,entry.get("name",""))),
        "ruleProse":has_rule_prose(lines,entry.get("name",""))
    }
    return {k:v for k,v in result.items() if v not in (None,"",[],{})}


def sibling_class_fallback(entry: dict) -> dict:
    candidates=[
        row for row in class_catalog_rows()
        if row.get("name")==entry.get("name") and row.get("id")!=entry.get("id")
    ]
    best={}
    best_score=-1
    for row in candidates:
        try:
            raw=fetch(row["url"],0.05)
            parser=DetailParser(); parser.feed(raw); parser.close()
            parsed=parse_class_core(parser,row)
            score=sum(bool(parsed.get(k)) for k in ("hit_die","skillPoints","progression","classSkills","classSkillRule","prerequisites","inheritsFrom"))
            score+=2 if (parsed.get("mechanicsPresence") or {}).get("classFeatures") else 0
            if score>best_score:
                best_score=score
                best={**parsed,"siblingSourceUrl":row["url"],"siblingSourceId":row.get("id")}
        except Exception:
            continue
    return best


def legacy_class_fallback(entry: dict) -> dict:
    url=legacy_class_url(entry)
    raw=fetch_allowed(url,{urlparse(LEGACY_CLASS_BASE).netloc},0.05)
    parser=DetailParser(); parser.feed(raw); parser.close()
    expected=clean(entry.get("name","")).replace("’","'").casefold()
    visible={clean(line).replace("’","'").casefold() for line in parser.lines[:60]}
    if expected and expected not in visible:
        raise ValueError(f"Historical mirror identity mismatch for {entry.get('name')}")
    result={"fallbackSourceUrl":url}
    req=parse_requirement_lines(section(parser.lines,parser.headings,"Requirements"))
    if req: result["prerequisites"]=req
    hit=next_value(parser.lines,"Hit die") or next_value(parser.lines,"Hit Die")
    if m:=re.search(r"d\s*(\d+)",hit,re.I): result["hit_die"]=int(m.group(1))
    skill_points=next_value(parser.lines,"Skill points") or next_value(parser.lines,"Skill Points")
    if skill_points: result["skillPoints"]=skill_points
    skills=parse_class_skills(parser)
    if skills:
        result["classSkills"]=skills
    else:
        skill_rule=parse_class_skill_rule(parser)
        if skill_rule: result["classSkillRule"]=skill_rule
    progression,advancement=parse_progression_table(parser)
    if progression:
        result["progression"]=progression
        result["advancement"]=advancement
    parent=explicit_variant_parent(parser.lines,entry.get("name",""))
    if parent: result["inheritsFrom"]=parent
    result["fallbackMechanicsPresence"]={
        "classFeatures":bool(section(parser.lines,parser.headings,"Class Features")),
        "ruleProse":has_rule_prose(parser.lines,entry.get("name",""))
    }
    return result


def parse_class(parser: DetailParser, entry: dict) -> dict:
    lines = parser.lines
    enriched=parse_class_core(parser,entry)

    # If this source-book record is only a pointer, another record with the same
    # class name may contain the canonical mechanics (for example PHB vs setting books).
    sibling=sibling_class_fallback(entry)
    if sibling:
        for key in ("prerequisites","hit_die","skillPoints","minBab","classSkills","classSkillRule","progression","advancement","inheritsFrom"):
            if not enriched.get(key) and sibling.get(key):
                enriched[key]=sibling[key]
        enriched["siblingSourceUrl"]=sibling.get("siblingSourceUrl")
        enriched["siblingSourceId"]=sibling.get("siblingSourceId")
        sib_presence=sibling.get("mechanicsPresence") or {}
        own_presence=enriched.get("mechanicsPresence") or {}
        enriched["mechanicsPresence"]={
            "classFeatures":bool(own_presence.get("classFeatures") or sib_presence.get("classFeatures")),
            "ruleProse":bool(own_presence.get("ruleProse") or sib_presence.get("ruleProse")),
        }

    # The rebuilt site omits some requirements/variant inheritance that the older
    # D&D Tools mirror still exposes. Use the mirror only to fill structured gaps.
    needs_fallback=(
        (enriched.get("prestige") and not enriched.get("prerequisites"))
        or not enriched.get("progression")
        or not enriched.get("classSkills")
        or not enriched.get("hit_die")
        or not enriched.get("skillPoints")
    )
    if needs_fallback:
        try:
            fallback=legacy_class_fallback(entry)
            for key in ("prerequisites","hit_die","skillPoints","classSkills","classSkillRule","progression","advancement","inheritsFrom"):
                if not enriched.get(key) and fallback.get(key):
                    enriched[key]=fallback[key]
            enriched["fallbackSourceUrl"]=fallback.get("fallbackSourceUrl")
            enriched["fallbackMechanicsPresence"]=fallback.get("fallbackMechanicsPresence")
        except Exception as error:
            enriched["fallbackError"]=str(error)

    if "racial class" in (entry.get("name","").casefold()):
        enriched["racialClass"]=True
    if not enriched.get("inheritsFrom"):
        parent=explicit_variant_parent(lines,entry.get("name",""))
        if parent:
            enriched["inheritsFrom"]=parent
    fallback_presence=enriched.get("fallbackMechanicsPresence") or {}
    current_presence=enriched.get("mechanicsPresence") or {}
    enriched["mechanicsPresence"] = {
        "classFeatures": bool(current_presence.get("classFeatures")) or bool(section(lines, parser.headings, "Class Features")) or bool(fallback_presence.get("classFeatures")),
        "ruleProse": bool(current_presence.get("ruleProse")) or has_rule_prose(lines, entry.get("name","")) or bool(fallback_presence.get("ruleProse"))
    }
    enriched={k:v for k,v in enriched.items() if v not in (None,"",[],{})}
    return apply_class_supplement(entry,enriched)


_FEAT_SUPPLEMENT_CACHE=None

def feat_supplements():
    global _FEAT_SUPPLEMENT_CACHE
    if _FEAT_SUPPLEMENT_CACHE is None:
        path=ROOT/"scripts"/"feat_supplements_35.json"
        payload=json.loads(path.read_text(encoding="utf-8")) if path.exists() else {"entries":{}}
        _FEAT_SUPPLEMENT_CACHE=payload.get("entries",{})
    return _FEAT_SUPPLEMENT_CACHE


def apply_feat_supplement(entry: dict, details: dict) -> dict:
    supplement=feat_supplements().get(entry.get("id"))
    if not supplement:
        return details
    if clean(supplement.get("name","")).casefold()!=clean(entry.get("name","")).casefold():
        raise ValueError(f"Feat supplement identity mismatch for {entry.get('name')}")
    result={**details}
    conflicts=[]
    for key in ("sourceBook","sourceAbbr","sourcePage","sourceEdition","notes","featType","prerequisites","effectSummary","normalSummary","specialSummary","inheritsFromFeat","ruleStats","variantOptions"):
        supplied=supplement.get(key)
        if supplied in (None,"",[],{}):
            continue
        existing=result.get(key)
        if existing in (None,"",[],{}):
            result[key]=supplied
        elif normalized_compare(existing)!=normalized_compare(supplied):
            conflicts.append(key)

    fallback_prerequisites=supplement.get("prerequisiteFallback") or []
    if fallback_prerequisites and not result.get("prerequisites"):
        result["prerequisites"]=fallback_prerequisites

    additions=supplement.get("prerequisiteAdditions") or []
    if additions:
        current=list(result.get("prerequisites") or [])
        seen={json.dumps(normalized_compare(x),sort_keys=True) for x in current}
        for addition in additions:
            marker=json.dumps(normalized_compare(addition),sort_keys=True)
            if marker not in seen:
                current.append(addition)
                seen.add(marker)
        result["prerequisites"]=current

    result["supplementProvenance"]=supplement.get("provenance",[])
    result["supplementVerified"]=True
    if conflicts:
        result["supplementConflicts"]=conflicts
    presence=result.get("mechanicsPresence") or {}
    if supplement.get("effectSummary"):
        presence["benefit"]=True
        presence["ruleProse"]=True
        result.pop("effectNeedsSummary",None)
        result.pop("effectSourceLength",None)
    if supplement.get("normalSummary"):
        presence["normal"]=True
        result.pop("normalNeedsSummary",None)
        result.pop("normalSourceLength",None)
    if supplement.get("specialSummary"):
        presence["special"]=True
        result.pop("specialNeedsSummary",None)
        result.pop("specialSourceLength",None)
    result["mechanicsPresence"]=presence
    return result


def parse_inline_familiar_options(text: str) -> list[dict]:
    if not text:
        return []
    normalized=text.replace("—","-").replace("–","-")
    alignment=r"(?:lawful|neutral|chaotic)\s+(?:good|evil)|neutral"
    pattern=rf"([A-Za-z][A-Za-z,'’ .-]*?)(?:\([^)]*\))?\s*-\s*({alignment})\s*-\s*(\d+)(?:st|nd|rd|th)"
    options=[]
    for name,align,level in re.findall(pattern,normalized,re.I):
        name=clean(name)
        if "." in name:
            name=clean(name.rsplit(".",1)[-1])
        if not name or name.casefold() in {"familiar","alignment","level"}:
            continue
        options.append({
            "name":name,
            "alignment":clean(align).capitalize(),
            "minimumArcaneCasterLevel":int(level),
        })
    return options


def parse_feat(parser: DetailParser, entry: dict) -> dict:
    lines = parser.lines
    meta = source_meta(lines)
    category = ""
    for line in lines[:24]:
        folded = clean(line).casefold()
        if len(line) < 100 and re.search(r"\bfeat\b", folded) and not folded.startswith(("back to ","characters ")):
            category = clean(line)
            break

    prereq_labeled = any(
        re.match(r"^Prerequisites?\b", clean(line), re.I)
        for line in lines
    ) or any(re.match(r"^Prerequisites?$", clean(h), re.I) for h in parser.headings)
    prereq = next_value(lines, "Prerequisite") or next_value(lines, "Prerequisites")
    benefit_heading = any(clean(h).casefold()=="benefit" for h in parser.headings)
    # A few damaged source pages collapse Benefit prose into the Prerequisite field.
    # Do not preserve that corruption as a prerequisite. A fill-only supplement can
    # then restore the verified prerequisite/effect without overriding parsed facts.
    def malformed_prerequisite(value: str) -> bool:
        return bool(
            value
            and not benefit_heading
            and len(value) > 220
            and re.search(r"\b(?:as a swift action|automatically hits?|save DC|when using)\b", value, re.I)
        )
    if malformed_prerequisite(prereq):
        prereq = ""
    if not prereq:
        req = section(lines, parser.headings, "Prerequisite") or section(lines, parser.headings, "Prerequisites")
        prereq = " ".join(req[:4])
        if malformed_prerequisite(prereq):
            prereq = ""
    if re.search(r"do not touch this field|corresponding twig file",prereq,re.I):
        prereq = ""

    benefit = next_value(lines, "Benefit")
    description = next_value(lines, "Description")
    normal = next_value(lines, "Normal")
    special = next_value(lines, "Special")

    result = {**meta}
    if category:
        result["featType"] = category
    if prereq:
        result["prerequisites"] = [{"kind":"text","label":"Prerequisite","text":prereq}]

    # Preserve concise gameplay mechanics, but never promote long sourcebook prose
    # into the candidate catalog. Long benefits must be replaced by a short,
    # provenance-backed effectSummary before the final-output gate can pass.
    concise_benefit = clean(benefit)
    if concise_benefit and len(concise_benefit) <= 700:
        result["effect"] = concise_benefit
    elif concise_benefit:
        result["effectNeedsSummary"] = True
        result["effectSourceLength"] = len(concise_benefit)

    concise_normal=clean(normal)
    if concise_normal and len(concise_normal) <= 400:
        result["normalRule"]=concise_normal
    elif concise_normal:
        result["normalNeedsSummary"]=True
        result["normalSourceLength"]=len(concise_normal)

    concise_special=clean(special)
    if concise_special and len(concise_special) <= 400:
        result["specialRule"]=concise_special
    elif concise_special:
        result["specialNeedsSummary"]=True
        result["specialSourceLength"]=len(concise_special)

    if (not benefit and description
        and re.search(r"\b(?:refer to|see (?:the )?discussion of)\b.*\bImproved Familiar\b",description,re.I)):
        options=parse_inline_familiar_options(description)
        if options:
            result["inheritsFromFeat"]="feats/improved-familiar-1481"
            result["variantOptions"]=options
            result["ruleStats"]={"sourcePointer":True,"sourceAddsOptions":True}
    result["mechanicsPresence"] = {
        "benefit": bool(benefit),
        "description": bool(description),
        "normal": bool(normal),
        "special": bool(special),
        "normalLabeled": any(re.match(r"^Normal\b",clean(line),re.I) for line in lines),
        "specialLabeled": any(re.match(r"^Special\b",clean(line),re.I) for line in lines),
        "prerequisiteLabeled": prereq_labeled,
        "ruleProse": has_rule_prose(lines, entry.get("name",""))
    }
    return apply_feat_supplement(entry,result)


def split_class_levels(value: str) -> dict:
    # Adjacent class links can render either collapsed ("Sorcerer 1Wizard 1")
    # or space-separated ("Sorcerer 1 Wizard 1"). Accept both forms.
    normalized=clean(value)
    pairs = re.findall(r"([A-Z][A-Za-z'’ /-]*?)\s+(\d)(?=\s*[A-Z]|$)", normalized)
    return {clean(name): int(level) for name, level in pairs}


def split_domain_levels(value: str) -> list[dict]:
    # Domain/access lists can be collapsed, e.g. "Spell 3 Initiate of Mystra (Feat) 3".
    pairs=re.findall(r"(.+?)\s+(\d)(?=\s*[A-Z]|$)",clean(value))
    out=[]
    for raw_name,raw_level in pairs:
        raw_name=clean(raw_name)
        source=""
        match=re.match(r"^(.*?)\s*\(([^()]*)\)\s*$",raw_name)
        if match:
            raw_name=clean(match.group(1))
            source=clean(match.group(2))
        if raw_name:
            row={"name":raw_name,"level":int(raw_level)}
            if source:
                row["source"]=source
            out.append(row)
    return out


def spell_description_text(parser: DetailParser) -> str:
    lines=section(parser.lines,parser.headings,"Description")
    if not lines:
        return ""
    kept=[]
    for line in lines:
        folded=clean(line).casefold()
        if folded.startswith(("origin:","d&d 3.5 reference data","privacy ","terms ")):
            break
        kept.append(clean(line))
    return clean(" ".join(kept))


_SPELL_EFFECT_SUMMARY_CACHE=None

def spell_effect_summaries():
    global _SPELL_EFFECT_SUMMARY_CACHE
    if _SPELL_EFFECT_SUMMARY_CACHE is None:
        path=ROOT/"scripts"/"spell_effect_summaries_35.json"
        payload=json.loads(path.read_text(encoding="utf-8")) if path.exists() else {"entries":{}}
        _SPELL_EFFECT_SUMMARY_CACHE=payload.get("entries",{})
    return _SPELL_EFFECT_SUMMARY_CACHE


def spell_effect_digest(text: str) -> str:
    normalized=clean(text)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def spell_tables_digest(tables) -> str:
    normalized=json.dumps(tables or [],ensure_ascii=False,separators=(",",":"),sort_keys=True)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def apply_reviewed_spell_effect_summary(entry: dict, details: dict, effect_source: str) -> dict:
    review=spell_effect_summaries().get(entry.get("id"))
    if not review:
        return details
    if clean(review.get("name","")).casefold()!=clean(entry.get("name","")).casefold():
        raise ValueError(f"Spell effect review identity mismatch for {entry.get('name')}")
    expected=clean(review.get("sourceSha256",""))
    actual=spell_effect_digest(effect_source)
    if not expected or expected!=actual:
        result={**details}
        result["effectReviewMismatch"]=True
        return result
    expected_tables=clean(review.get("tablesSha256",""))
    if expected_tables:
        actual_tables=spell_tables_digest(details.get("tables") or [])
        if expected_tables!=actual_tables:
            result={**details}
            result["effectReviewTableMismatch"]=True
            return result
    summary=clean(review.get("effectSummary",""))
    if not summary:
        return details
    result={**details}
    if not result.get("effectSummary") and result.get("effectNeedsSummary"):
        result["effectSummary"]=summary
        result["effectReviewVerified"]=True
        result["effectReviewProvenance"]=review.get("provenance",[])
        result.pop("effectNeedsSummary",None)
        result.pop("effectSourceLength",None)
    return result


_SPELL_SUPPLEMENT_CACHE=None

def spell_supplements():
    global _SPELL_SUPPLEMENT_CACHE
    if _SPELL_SUPPLEMENT_CACHE is None:
        path=ROOT/"scripts"/"spell_supplements_35.json"
        payload=json.loads(path.read_text(encoding="utf-8")) if path.exists() else {"entries":{}}
        _SPELL_SUPPLEMENT_CACHE=payload.get("entries",{})
    return _SPELL_SUPPLEMENT_CACHE


def apply_spell_supplement(entry: dict, details: dict) -> dict:
    supplement=spell_supplements().get(entry.get("id"))
    if not supplement:
        return details
    if clean(supplement.get("name","")).casefold()!=clean(entry.get("name","")).casefold():
        raise ValueError(f"Spell supplement identity mismatch for {entry.get('name')}")
    result={**details}
    conflicts=[]
    for key in ("components","classLevels","domainLevels","sourceEdition","effectSummary","notes"):
        supplied=supplement.get(key)
        if supplied in (None,"",[],{}):
            continue
        existing=result.get(key)
        if existing in (None,"",[],{}):
            result[key]=supplied
        elif normalized_compare(existing)!=normalized_compare(supplied):
            conflicts.append(key)
    result["supplementProvenance"]=supplement.get("provenance",[])
    result["supplementVerified"]=True
    if conflicts:
        result["supplementConflicts"]=conflicts
    if result.get("classLevels"):
        result["classes"]=list(result["classLevels"])
        result["level"]=min(result["classLevels"].values())
    elif result.get("domainLevels") and result.get("level") is None:
        result["level"]=min(row["level"] for row in result["domainLevels"])
    if supplement.get("effectSummary"):
        result.pop("effectNeedsSummary",None)
        result.pop("effectSourceLength",None)
    if supplement.get("resolvesSourceIncomplete") and result.get("sourceIncomplete"):
        result["sourceIncompleteResolved"]=True
    return result


def parse_spell(parser: DetailParser, entry: dict) -> dict:
    lines = parser.lines
    result = {
        **source_meta(lines),
        "school": next_value(lines, "School"),
        "casting_time": next_value(lines, "Casting Time"),
        "components": [clean(x) for x in next_value(lines, "Components").split(",") if clean(x)],
        "range": next_value(lines, "Range"),
        "target": next_value(lines, "Target"),
        "area": next_value(lines, "Area"),
        "duration": next_value(lines, "Duration"),
        "savingThrow": next_value(lines, "Saving Throw"),
        "spellResistance": next_value(lines, "Spell Resistance"),
    }
    school_value=result.get("school","")
    source_value=result.get("sourceBook","")
    maneuver_disciplines=("Desert Wind","Devoted Spirit","Diamond Mind","Iron Heart","Setting Sun","Shadow Hand","Stone Dragon","Tiger Claw","White Raven")
    psionic_disciplines=("Clairsentience","Metacreativity","Psychokinesis","Psychometabolism","Psychoportation","Telepathy")
    if ("Tome of Battle" in source_value
        or any(x.casefold() in school_value.casefold() for x in maneuver_disciplines)
        or re.search(r"\((?:Strike|Boost|Counter|Stance)\)", school_value, re.I)):
        result["isManeuver"]=True
    if ("Psionics" in source_value
        or any(x.casefold() in school_value.casefold() for x in psionic_disciplines)):
        result["isPsionicPower"]=True
    classes_raw = next_value(lines, "Classes")
    class_levels = split_class_levels(classes_raw)
    class_level_tokens=re.findall(r"(?<!\d)\d(?!\d)",clean(classes_raw))
    if classes_raw and class_level_tokens and len(class_levels) != len(class_level_tokens):
        result["classLevelParseIncomplete"]=True
        result["classLevelParseExpectedCount"]=len(class_level_tokens)
        result["classLevelParseActualCount"]=len(class_levels)
    if class_levels:
        result["classLevels"] = class_levels
        result["classes"] = list(class_levels)
        result["level"] = min(class_levels.values())
    domains_raw = next_value(lines, "Domains")
    if domains_raw:
        result["domains"] = domains_raw
        domain_levels=split_domain_levels(domains_raw)
        if domain_levels:
            result["domainLevels"]=domain_levels
            if result.get("level") is None:
                result["level"]=min(row["level"] for row in domain_levels)
    descriptors_raw = next_value(lines, "Descriptors")
    if descriptors_raw:
        result["descriptors"] = [clean(x) for x in re.split(r"[,;]", descriptors_raw) if clean(x)]
    if parser.tables:
        result["tables"] = parser.tables

    effect_source=spell_description_text(parser)
    if effect_source:
        # These rebuilt primary pages flatten their complete table rows into the
        # surrounding prose, so a table reference without parser.tables is not
        # an omission for these exact records.
        inline_table_spell_ids={
            "spells/channel-the-dragon-1076",
            "spells/random-action-5023",
        }
        missing_table_reference=re.search(
            r"table below|following table|table above|accompanying table|\\bsee the table\\b|\\bas shown on the table\\b|length aura lingers",
            effect_source,
            re.I,
        )
        if (missing_table_reference
            and not parser.tables
            and entry.get("id") not in inline_table_spell_ids):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="missing-referenced-table"
        if entry.get("id")=="spells/citys-might-3051" and re.search(r"based on the size of the community",effect_source,re.I):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="omitted-citys-might-scaling"
        if entry.get("id")=="spells/detect-ship-3339" and not parser.tables and re.search(r"check gives you information about the ship or ships:",effect_source,re.I):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="omitted-detect-ship-check-table"
        if entry.get("id")=="spells/sandform-3176" and not parser.tables and re.search(r"deals bludgeoning damage according to your size",effect_source,re.I):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="omitted-sandform-slam-table"
        if entry.get("id")=="spells/standing-wave-1936" and not parser.tables and re.search(r"what the wave can lift depends on your caster level",effect_source,re.I):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="omitted-standing-wave-size-table"
        if entry.get("id")=="spells/word-of-balance-3496" and not parser.tables and re.search(r"suffers ill effects according to its Hit Dice, as given below",effect_source,re.I):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="omitted-word-of-balance-hd-table"
        if entry.get("id")=="spells/know-greatest-enemy-1637" and not parser.tables and re.search(r"creatures are evaluated as follows",effect_source,re.I):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="omitted-know-greatest-enemy-cr-table"
        if entry.get("id")=="spells/summon-undead-i-1460" and not parser.tables and re.search(r"1st-level list on the Summon Undead table",effect_source,re.I):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="omitted-libris-mortis-summon-undead-table"
        if entry.get("id")=="spells/weapon-of-the-deity-1397" and not parser.tables and re.search(r"additional special ability \(see the list below\)",effect_source,re.I):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="omitted-ghostwalk-weapon-deity-table"
        if entry.get("id")=="spells/doom-of-the-seas-3332" and re.search(r"statistics block for this creature appears below",effect_source,re.I):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="omitted-doom-of-the-seas-stat-block"
        if entry.get("id")=="spells/dragonblood-beast-4864" and re.search(
            r"Progression 1:.*\\b1d,\\s*2d6\\b.*\\b8d,\\s*12d6\\b",
            effect_source,
            re.I,
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="corrupt-dragonblood-beast-bite-progression"
        if entry.get("id")=="spells/dragon-ally-lesser-4417" and re.search(
            r"payment of 250 fp per HD",
            effect_source,
            re.I,
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="corrupt-lesser-dragon-ally-payment-unit"
        if entry.get("id")=="spells/elemental-burst-2066" and re.search(
            r"five elements \\(wood, fire, water, stone, or air\\)",
            effect_source,
            re.I,
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="contradictory-oriental-adventures-elemental-burst-target"
        if entry.get("id")=="spells/drown-5004" and re.search(
            r"or begin to drown \(see The Concentration check to cast a spell",
            effect_source,
            re.I,
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-dragonlance-drown-source"
        if (
            entry.get("id")=="spells/dragonshape-3011"
            and re.search(r"see below for your new statistics",effect_source,re.I)
            and not re.search(r"mature adult red dragon\s+init\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="omitted-dragonshape-stat-block"
        if (
            entry.get("id")=="spells/dragonshape-lesser-1078"
            and re.search(r"young red dragon \(see below\)",effect_source,re.I)
            and not re.search(r"young red dragon\s+cr\s*7",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="omitted-lesser-dragonshape-stat-block"
        if (
            entry.get("id")=="spells/dreaded-form-of-the-eye-tyrant-873"
            and re.search(r"take the form of a beholder",effect_source,re.I)
            and not re.search(r"30 temporary hit points",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-dreaded-eye-tyrant-effect"
        if entry.get("id")=="spells/cloak-dark-power-4987" and re.search(r"a darkness spells or effects",effect_source,re.I):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-cloak-dark-power-source"
        if entry.get("id")=="spells/crumble-1748" and not parser.tables and re.search(r"maximum size of the object affected depends on your level",effect_source,re.I):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="omitted-crumble-size-table"
        source_corruption_patterns=(
            (r"\[missing content in source\]|missing content in source","missing-content-in-source"),
            (r"turn or command atonement spell upon the subject","truncated-anathema-source"),
            (r"liveoak spell \(\s*slowed","truncated-arboreal-source"),
            (r"see Appendix 3 of the clerics undergo","truncated-greater-deity-aspect-source"),
            (r"target gains the clerics would never consider casting this spell","truncated-snake-mother-source"),
            (r"concentrating on a spell\\s*\\(\\s*detect thoughts\\s*\\)\\s*congeal into a solid shard of crystal","truncated-crystalline-memories-source"),
            (r"dispel magic\\s*</td></tr>\\s*creatures sent to another plane","truncated-prismatic-wall-table-source"),
        )
        for pattern,marker in source_corruption_patterns:
            if re.search(pattern,effect_source,re.I):
                result["sourceIncomplete"]=True
                result["sourceIncompleteMarker"]=marker
                break
        reference_dependent=bool(
            re.search(r"\\b(?:functions?|works?|operates?)\\s+(?:like|as)\\b",effect_source,re.I)
            or re.search(r"^As\\s+[^.!?]{1,120}?,\\s*(?:except|but)\\b",effect_source,re.I)
        )
        if reference_dependent:
            result["effectReferenceDependent"]=True
        if len(effect_source) <= 240 and not reference_dependent:
            result["effect"]=effect_source
        else:
            result["effectNeedsSummary"]=True
            result["effectSourceLength"]=len(effect_source)

    result["mechanicsPresence"] = {
        "ruleProse": has_rule_prose(lines, entry.get("name","")),
        "descriptionCaptured": bool(effect_source),
    }
    result={k:v for k,v in result.items() if v not in (None,"",[],{})}
    result=apply_spell_supplement(entry,result)
    if result.get("effectNeedsSummary"):
        result=apply_reviewed_spell_effect_summary(entry,result,effect_source)
    return result


_ITEM_SOURCE_FALLBACK_CACHE=None

def item_source_fallbacks():
    """Verified structured fallback sources for catalog records whose source route is broken.

    These are not omission supplements: they are used only when the catalog detail URL
    itself returns 404, and they retain independent provenance to the archival source.
    """
    global _ITEM_SOURCE_FALLBACK_CACHE
    if _ITEM_SOURCE_FALLBACK_CACHE is None:
        path=ROOT/"scripts"/"item_source_fallbacks_35.json"
        payload=json.loads(path.read_text(encoding="utf-8")) if path.exists() else {"entries":{}}
        _ITEM_SOURCE_FALLBACK_CACHE=payload.get("entries",{})
    return _ITEM_SOURCE_FALLBACK_CACHE


def item_source_fallback_details(entry: dict) -> dict | None:
    fallback=item_source_fallbacks().get(entry.get("id"))
    if not fallback:
        return None
    if clean(fallback.get("name","")).casefold()!=clean(entry.get("name","")).casefold():
        raise ValueError(f"Item source fallback identity mismatch for {entry.get('name')}")
    result={k:v for k,v in fallback.items() if k not in ("name","provenance")}
    result["sourceFallbackProvenance"]=fallback.get("provenance",[])
    result["sourceFallbackVerified"]=True
    result["mechanicsPresence"]={
        "ruleProse":bool(result.get("effectSummary") or result.get("ruleFamily")),
        "descriptionCaptured":bool(result.get("effectSummary")),
    }
    return result


_ITEM_SUPPLEMENT_CACHE=None

def item_supplements():
    global _ITEM_SUPPLEMENT_CACHE
    if _ITEM_SUPPLEMENT_CACHE is None:
        path=ROOT/"scripts"/"item_supplements_35.json"
        payload=json.loads(path.read_text(encoding="utf-8")) if path.exists() else {"entries":{}}
        _ITEM_SUPPLEMENT_CACHE=payload.get("entries",{})
    return _ITEM_SUPPLEMENT_CACHE


def apply_item_supplement(entry: dict, details: dict) -> dict:
    supplement=item_supplements().get(entry.get("id"))
    if not supplement:
        return details
    if clean(supplement.get("name","")).casefold()!=clean(entry.get("name","")).casefold():
        raise ValueError(f"Item supplement identity mismatch for {entry.get('name')}")
    result={**details}
    conflicts=[]
    for key in ("sourceBook","sourceAbbr","sourcePage","sourceEdition","itemType","bodySlot","effectSummary","ruleFamily","ruleStats","notes"):
        supplied=supplement.get(key)
        if supplied in (None,"",[],{}):
            continue
        existing=result.get(key)
        if existing in (None,"",[],{}):
            result[key]=supplied
        elif normalized_compare(existing)!=normalized_compare(supplied):
            conflicts.append(key)
    result["supplementProvenance"]=supplement.get("provenance",[])
    result["supplementVerified"]=True
    if conflicts:
        result["supplementConflicts"]=conflicts
    presence=result.get("mechanicsPresence") or {}
    if supplement.get("effectSummary"):
        presence["ruleProse"]=True
        result.pop("effectNeedsSummary",None)
        result.pop("effectSourceLength",None)
    result["mechanicsPresence"]=presence
    return result


def item_effect_text(parser: DetailParser, entry_name: str="") -> str:
    """Capture item rules without metadata/chrome; long prose stays review-only."""
    metadata={
        "save","price","cost","weight","body slot","caster level","aura","activation",
        "rarity","type","kind","category","ac bonus","max dex","armor check penalty",
        "arcane spell failure","speed 30","speed 20","damage (s)","damage (m)",
        "critical","range increment","prerequisite","prerequisites"
    }
    start=0
    target=clean(entry_name).casefold()
    if target:
        for i,line in enumerate(parser.lines):
            if clean(line).casefold()==target:
                start=i+1
                break
    kept=[]
    skip_next=False
    for line in parser.lines[start:]:
        value=clean(line)
        folded=value.casefold()
        if folded.startswith(("d&d 3.5 reference data","privacy ","terms ")):
            break
        if not value:
            continue
        if skip_next:
            skip_next=False
            continue
        if folded in metadata:
            skip_next=True
            continue
        if folded.startswith(("back to ","source:","origin:")):
            continue
        if re.search(r"\([A-Za-z0-9 .&'-]{1,16}\)\s*(?:,\s*p\.\s*\d+)?$",value):
            continue
        if "·" in value and len(value)<100:
            continue
        kept.append(value)
    return clean(" ".join(kept))


def parse_item(parser: DetailParser, entry: dict) -> dict:
    lines = parser.lines
    result = {**source_meta(lines)}
    placeholder_text=" ".join(clean(x) for x in lines).casefold()
    if "generic entry is for varied references" in placeholder_text:
        result["nonGameplayReference"]=True
        result["referenceKind"]="generic-varied-entry"
    labels = {
        "Price":"price", "Cost":"cost", "Weight":"weight", "Body Slot":"bodySlot",
        "Caster Level":"casterLevel", "Aura":"aura", "Activation":"activation",
        "Rarity":"rarity", "Type":"itemType", "Kind":"kind", "Category":"itemCategory",
        "AC Bonus":"armorClassBonus", "Max Dex":"maxDex", "Armor Check Penalty":"armorCheckPenalty",
        "Arcane Spell Failure":"arcaneSpellFailure", "Speed 30":"speed30", "Speed 20":"speed20",
        "Damage (S)":"damageSmall", "Damage (M)":"damageMedium", "Critical":"critical",
        "Range Increment":"rangeIncrement"
    }
    for label, key in labels.items():
        value = next_value(lines, label)
        if value:
            result[key] = value
    for line in lines:
        compact=clean(line)
        if "·" in compact and len(compact)<100:
            left,right=[clean(x) for x in compact.split("·",1)]
            if left.casefold() in ("wondrous item","psi","psionic item","weapon","armor","potion","ring","rod","staff","wand"):
                result.setdefault("itemType",left)
                if right:
                    result.setdefault("bodySlot",right)
                break
    if parser.tables:
        result["tables"]=parser.tables
    prereq = next_value(lines, "Prerequisites") or next_value(lines, "Prerequisite")
    if prereq:
        result["prerequisites"] = [{"kind":"text","label":"Prerequisite","text":prereq}]
    name_fold=(entry.get("name","") or "").casefold()
    if re.match(r"power stones?\s+\d+(?:st|nd|rd|th)?\s+level power",name_fold):
        result["ruleFamily"]="power-stone"
        result["genericRuleSource"]="SRD psionic power-stone rules"

    effect_source=item_effect_text(parser,entry.get("name",""))
    if effect_source:
        if len(effect_source)<=240:
            result["effect"]=effect_source
        else:
            result["effectNeedsSummary"]=True
            result["effectSourceLength"]=len(effect_source)
    result["mechanicsPresence"] = {
        "ruleProse": has_rule_prose(lines, entry.get("name","")),
        "descriptionCaptured": bool(effect_source),
    }
    result={k:v for k,v in result.items() if v not in (None,"",[],{})}
    return apply_item_supplement(entry,result)


PARSERS = {
    "classes": parse_class,
    "feats": parse_feat,
    "spells": parse_spell,
    "items": parse_item,
    "equipment": parse_item,
}


def validate_details(entry: dict, category: str, parser: DetailParser, details: dict):
    """Reject wrong pages, block pages, and suspiciously empty parses.

    A validation failure must never stamp enrichment.version on the record.
    """
    name = clean(entry.get("name", "")).casefold()
    visible = {clean(line).casefold() for line in parser.lines[:80]}
    if name and name not in visible:
        raise ValueError(f"Page identity check failed for {entry.get('name')}")

    if category == "classes":
        if details.get("supplementConflicts"):
            raise ValueError("Supplement conflicts with parsed source fields: " + ", ".join(details["supplementConflicts"]))
        if not details.get("sourceBook"):
            raise ValueError("Class parse missing source book")
        useful = ("hit_die","skillPoints","minBab","prerequisites","progression","advancement","classSkills","classSkillRule","inheritsFrom")
        if not any(details.get(key) for key in useful):
            # Some catalog records are source pointers (for example variant base
            # classes) with no mechanics on that exact page. They are safe to retain
            # as partial references, but they must not be stamped as enriched.
            raise ValueError("Class page contains no structured mechanics to enrich")
    elif category == "spells":
        if details.get("supplementConflicts"):
            raise ValueError("Spell supplement conflicts with parsed source fields: " + ", ".join(details["supplementConflicts"]))
        if details.get("effectReviewMismatch"):
            raise ValueError("Reviewed spell effect summary no longer matches the current source text")
        if details.get("effectReviewTableMismatch"):
            raise ValueError("Reviewed spell effect summary no longer matches the current source table")
        if details.get("classLevelParseIncomplete"):
            raise ValueError(
                "Spell class-level parsing is incomplete: "
                f"{details.get('classLevelParseActualCount',0)} parsed of "
                f"{details.get('classLevelParseExpectedCount',0)} source class levels"
            )
        if details.get("sourceIncomplete") and not details.get("sourceIncompleteResolved"):
            raise ValueError("Spell source contains an explicit missing-content marker without a verified repair")
        required = ["sourceBook", "school", "casting_time", "range", "duration"]
        missing = [key for key in required if not details.get(key)]
        if missing:
            raise ValueError("Spell parse missing required fields: " + ", ".join(missing))
    elif category == "feats":
        if details.get("supplementConflicts"):
            raise ValueError("Feat supplement conflicts with parsed source fields: " + ", ".join(details["supplementConflicts"]))
        if not details.get("sourceBook"):
            raise ValueError("Feat parse missing source book")
    elif category == "items":
        if details.get("supplementConflicts"):
            raise ValueError("Item supplement conflicts with parsed source fields: " + ", ".join(details["supplementConflicts"]))
        if details.get("nonGameplayReference"):
            if details.get("referenceKind") != "generic-varied-entry":
                raise ValueError("Unrecognized non-gameplay item reference kind")
        else:
            if not details.get("sourceBook"):
                raise ValueError("Item parse missing source book")
            useful = ("price","cost","weight","bodySlot","casterLevel","aura","activation","rarity","itemType","tables")
            if not any(details.get(key) for key in useful):
                raise ValueError("Item parse produced no structured mechanics")
    elif category == "equipment":
        useful = ("cost","weight","kind","itemCategory","armorClassBonus","maxDex","armorCheckPenalty",
                  "arcaneSpellFailure","damageSmall","damageMedium","critical","rangeIncrement")
        if not any(details.get(key) for key in useful):
            raise ValueError("Equipment parse produced no structured mechanics")


def enrichment_gaps(category: str, details: dict) -> list[str]:
    """Fields that must be present before a record can be considered game-complete."""
    presence = details.get("mechanicsPresence") or {}
    expected = {
        "classes": ("sourceBook","hit_die","skillPoints","progression","classSkills"),
        "spells": ("sourceBook","school","casting_time","range","duration"),
        "feats": ("sourceBook","featType"),
        "items": (() if details.get("nonGameplayReference") else ("sourceBook",)),
        "equipment": ("kind","itemCategory"),
    }.get(category, ())
    gaps = [key for key in expected if not details.get(key)]

    if category == "classes":
        if details.get("prestige") and not details.get("prerequisites"):
            gaps.append("prerequisites")
        if details.get("classSkillRule") and "classSkills" in gaps:
            gaps.remove("classSkills")
        if details.get("racialClass"):
            for key in ("hit_die","skillPoints","classSkills"):
                if key in gaps:
                    gaps.remove(key)
        if details.get("inheritsFrom"):
            for key in ("progression","classSkills","hit_die","skillPoints"):
                if key in gaps:
                    gaps.remove(key)
        if not presence.get("classFeatures"):
            gaps.append("classFeatures")
        if not presence.get("ruleProse"):
            gaps.append("classRuleText")
    elif category == "feats":
        # Description text is often flavor; a feat cannot pass the source gate
        # unless the source exposes an actual Benefit mechanic.
        pointer_complete=bool(details.get("inheritsFromFeat") and details.get("variantOptions"))
        if not (presence.get("benefit") or details.get("effectSummary") or pointer_complete):
            gaps.append("featEffect")
        if presence.get("prerequisiteLabeled") and not details.get("prerequisites"):
            gaps.append("prerequisites")
        if presence.get("normalLabeled") and not (details.get("normalRule") or details.get("normalSummary")):
            gaps.append("normalRule")
        if presence.get("specialLabeled") and not (details.get("specialRule") or details.get("specialSummary")):
            gaps.append("specialRule")
    elif category == "spells":
        psionic=bool(details.get("isPsionicPower") or re.search(r"\b(psychometabolism|psychokinesis|metacreativity|clairsentience|telepathy|psychoportation)\b",details.get("school",""),re.I))
        if psionic:
            details["isPsionicPower"]=True
        maneuver=bool(details.get("isManeuver"))
        if not maneuver and not psionic and not details.get("components"):
            gaps.append("components")
        if not (details.get("classLevels") or details.get("domainLevels")) and not maneuver and not psionic:
            gaps.append("spellAccessLevels")
        if details.get("level") is None and not maneuver and not psionic:
            gaps.append("level")
        if not presence.get("ruleProse"):
            gaps.append("spellEffect")
        if not (details.get("effect") or details.get("effectSummary") or details.get("effectNeedsSummary")):
            gaps.append("spellEffectCapture")
    elif category == "items":
        if not details.get("nonGameplayReference"):
            useful = ("price","cost","weight","bodySlot","casterLevel","aura","activation","rarity","itemType","tables")
            if not any(details.get(key) for key in useful):
                gaps.append("itemStats")
            if not (presence.get("ruleProse") or details.get("effectSummary")) and not details.get("ruleFamily"):
                gaps.append("itemEffect")
            if details.get("ruleFamily")=="power-stone" and not details.get("genericRuleSource"):
                gaps.append("itemEffect")
    elif category == "equipment":
        if not any(details.get(key) for key in (
            "cost","weight","armorClassBonus","maxDex","armorCheckPenalty",
            "arcaneSpellFailure","damageSmall","damageMedium","critical","rangeIncrement"
        )):
            gaps.append("equipmentStats")
    return sorted(set(gaps))


def candidate_summary(entry: dict, category: str, details: dict) -> str:
    name=clean(entry.get("name",""))
    source=clean(details.get("sourceBook","") or entry.get("source","DnD Tools"))
    if category=="classes":
        kind="prestige class" if details.get("prestige") else ("racial class" if details.get("racialClass") else "class")
        bits=[]
        if details.get("hit_die") is not None: bits.append(f"d{details['hit_die']} hit die")
        if details.get("skillPoints"): bits.append(f"{details['skillPoints']} skill points per level")
        if details.get("inheritsFrom"): bits.append(f"inherits baseline progression from {details['inheritsFrom']}")
        tail=(" with "+", ".join(bits)) if bits else ""
        return f"{name} is a D&D 3.5 {kind}{tail}. Source: {source}."
    if category=="feats":
        kind=clean(details.get("featType","feat"))
        return f"{name} is a D&D 3.5 {kind}. Source: {source}."
    if category=="spells":
        school=clean(details.get("school",""))
        level=details.get("level")
        if details.get("isManeuver"): kind="martial maneuver"
        elif details.get("isPsionicPower"): kind="psionic power"
        else: kind="spell"
        level_text=f" level {level}" if level is not None else ""
        return f"{name} is a D&D 3.5 {kind}{level_text}{(' in '+school) if school else ''}. Source: {source}."
    if category in ("items","equipment"):
        kind=clean(details.get("itemType") or details.get("kind") or details.get("itemCategory") or ("equipment" if category=="equipment" else "item"))
        return f"{name} is D&D 3.5 {kind}. Source: {source}."
    return f"{name} is a D&D 3.5 reference entry. Source: {source}."


def extract_entry_details(entry: dict, category: str, delay: float):
    """Fetch and parse one record, with explicit archival fallback for broken item routes."""
    try:
        html_text=fetch(entry["url"],delay)
        parser=DetailParser()
        parser.feed(html_text)
        parser.close()
        details=PARSERS[category](parser,entry)
        return parser,details
    except HTTPError as error:
        if category=="items" and error.code in {404,410,429,500,502,503,504}:
            fallback=item_source_fallback_details(entry)
            if fallback:
                fallback={**fallback,"sourceFallbackHttpStatus":error.code}
                parser=DetailParser()
                parser.feed(f"<h1>{html.escape(clean(entry.get('name','')))}</h1>")
                parser.close()
                return parser,fallback
        raise


def enrich_entry(entry: dict, category: str, delay: float) -> dict:
    parser,details = extract_entry_details(entry,category,delay)
    validate_details(entry, category, parser, details)
    gaps = enrichment_gaps(category, details)
    details["generatedDescription"]=candidate_summary(entry,category,details)
    return {
        **entry,
        **details,
        "edition": "3.5-reference",
        "enrichment": {
            "version": 1,
            "validated": True,
            "partial": bool(gaps),
            "missingExpected": gaps,
            "structuredOnly": True,
            "source": "DnD Tools",
            "fields": sorted(details),
            "fetchedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        },
    }


def run_category(
    category: str,
    limit: int | None,
    delay: float,
    force: bool,
    write: bool,
    candidate_dir: Path | None = None,
    shard_count: int = 1,
    shard_index: int = 0,
):
    path = CATALOG / f"{category}.json"
    rows = json.loads(path.read_text(encoding="utf-8"))
    changed = 0
    attempted = 0
    selected_indexes=[]
    for i, entry in enumerate(rows):
        if shard_count > 1 and i % shard_count != shard_index:
            continue
        selected_indexes.append(i)
        if limit is not None and attempted >= limit:
            break
        if entry.get("enrichment", {}).get("version") == 1 and not force:
            continue
        attempted += 1
        try:
            rows[i] = enrich_entry(entry, category, delay)
            changed += 1
            print(f"[{category}] {attempted}: {entry['name']}", flush=True)
        except Exception as error:
            print(f"[{category}] FAILED {entry.get('name')}: {error}", flush=True)
        # Checkpoint after every 25 successful records. Sharded runs are candidate-only.
        if write and changed and changed % 25 == 0:
            path.write_text(json.dumps(rows, ensure_ascii=False) + "\n", encoding="utf-8")
    if write and changed:
        path.write_text(json.dumps(rows, ensure_ascii=False) + "\n", encoding="utf-8")
    if candidate_dir is not None:
        target_dir=candidate_dir/"dndtools"
        target_dir.mkdir(parents=True,exist_ok=True)
        if shard_count > 1:
            target=target_dir/f"{category}-shard-{shard_index}.json"
            candidate_rows=[rows[i] for i in selected_indexes]
        else:
            target=target_dir/f"{category}.json"
            candidate_rows=rows
        target.write_text(json.dumps(candidate_rows,ensure_ascii=False)+"\n",encoding="utf-8")
    return {
        "category":category,
        "attempted":attempted,
        "changed":changed,
        "selected":len(selected_indexes),
        "total":len(rows),
        "write":write,
        "candidate":str(candidate_dir) if candidate_dir else None,
        "shardCount":shard_count,
        "shardIndex":shard_index,
    }


def self_test():
    class_html = """
    <h1>Spellsword</h1><p>Prestige Class Complete Warrior (CW), p. 79</p>
    <div>Hit Die</div><div>d8</div><div>Skill Points</div><div>2 + Int</div>
    <div>Min. BAB Req.</div><div>+4</div>
    <h2>Requirements</h2><p>Spells: Able to cast 2nd-level arcane spells.</p>
    <p>Feats: Proficiency with all martial weapons.</p>
    <h2>Advancement</h2><table><tr><th>Level</th><th>BAB</th><th>Fort</th><th>Ref</th><th>Will</th></tr>
    <tr><td>1st</td><td>+1</td><td>+2</td><td>+0</td><td>+2</td></tr></table>
    """
    p=DetailParser();p.feed(class_html);p.close()
    c=parse_class(p,{"name":"Spellsword"})
    assert c["hit_die"] == 8 and c["skillPoints"] == "2 + Int" and c["prestige"]
    assert c["sourceBook"].endswith("Complete Warrior") and c["sourcePage"] == 79
    assert c["prerequisites"][0]["kind"] == "spells" and c["advancement"][0]["BAB"] == "+1"

    base_with_prestige_prose = """
    <h1>Binder</h1><p>Base Class Tome of Magic (ToM), p. 9</p>
    <div>Hit Die</div><div>d8</div><div>Skill Points</div><div>2 + Int</div>
    <p>Binders may later qualify for prestige classes.</p>
    <h2>Class Skills</h2><p>Bluff, Concentration, Diplomacy</p>
    <h2>Advancement</h2><table><tr><th>Level</th><th>BAB</th><th>Special</th></tr>
    <tr><td>1st</td><td>+0</td><td>Soul binding</td></tr></table>
    <h2>Class Features</h2><p>Soul binding grants pact-related class features.</p>
    """
    p=DetailParser();p.feed(base_with_prestige_prose);p.close()
    binder=parse_class_core(p,{"name":"Binder"})
    assert not binder.get("prestige"), "incidental prose must not classify a base class as prestige"

    expert_html = """
    <h1>Expert</h1><p>NPC Class Unearthed Arcana (UA), p. 77</p>
    <div>Hit Die</div><div>d6</div><div>Skill Points</div><div>6 + Int</div>
    <p>Class Skills: Choose any twelve skills as class skills, plus Craft and Profession.</p>
    <h2>Advancement</h2><table><tr><th>Level</th><th>BAB</th><th>Special</th></tr>
    <tr><td>1st</td><td>+0</td><td>Flexible training</td></tr></table>
    <h2>Class Features</h2><p>An expert has a configurable skill list.</p>
    """
    p=DetailParser();p.feed(expert_html);p.close()
    expert=parse_class_core(p,{"name":"Expert"})
    assert expert["classSkillRule"] == {"mode":"choose_any","count":12,"additional":["Craft","Profession"]}

    heir_skills_html = """
    <h1>Heir of Siberys</h1><h2>CLASS SKILLS</h2>
    <p>Any skill that is a class skill for one of an heir of Siberys's other classes is a class skill for his heir of Siberys class as well.</p>
    """
    p=DetailParser();p.feed(heir_skills_html);p.close()
    assert parse_class_skill_rule(p) == {"mode":"inherit_from_other_classes"}

    survivor_skills_html = """
    <h1>Survivor</h1><h2>CLASS SKILLS</h2>
    <p>The survivor can spend his skill points to purchase any skills that any of his previous classes (or his base monster race) have made available as a class skill (though not exclusive skills).</p>
    """
    p=DetailParser();p.feed(survivor_skills_html);p.close()
    assert parse_class_skill_rule(p) == {"mode":"inherit_from_previous_classes_or_race"}

    substitution_html = """
    <h1>Fangshields Druid</h1><p>Base Class Champions of Valor (CoV), p. 40</p>
    <p>These druid substitution levels replace selected levels of the standard druid class.</p>
    """
    p=DetailParser();p.feed(substitution_html);p.close()
    assert explicit_variant_parent(p.lines,"Fangshields Druid") == "Druid"

    racial_html = """
    <h1>Pixie</h1><p>Base Class Savage Species (SS), p. 190</p>
    <h2>Advancement</h2><table><tr><th>Level</th><th>BAB</th><th>Hit Dice</th><th>CR</th><th>Skill Points</th></tr>
    <tr><td>1st</td><td>+0</td><td>1</td><td>1</td><td>(6 + Int mod) × 4</td></tr></table>
    """
    p=DetailParser();p.feed(racial_html);p.close()
    racial=parse_class_core(p,{"name":"Pixie"})
    assert racial.get("racialClass") is True

    colon_source=source_meta(["Racial feat","Shadowdale: The Scouring of the Land (S:TSotL), p. 150"])
    assert colon_source["sourceBook"] == "Shadowdale: The Scouring of the Land"
    assert colon_source["sourceAbbr"] == "S:TSotL" and colon_source["sourcePage"] == 150

    spell_html = """
    <h1>Magic Missile</h1><p>Player's Handbook v.3.5 (PH), p. 251</p>
    <div>School</div><div>Evocation</div><div>Casting Time</div><div>1 standard action</div>
    <div>Components</div><div>V, S</div><div>Range</div><div>Medium</div>
    <div>Duration</div><div>Instantaneous</div><div>Classes</div><div>Sorcerer 1Wizard 1Warmage 1</div>
    """
    p=DetailParser();p.feed(spell_html);p.close()
    s=parse_spell(p,{"name":"Magic Missile"})
    assert s["school"] == "Evocation" and s["classLevels"] == {"Sorcerer":1,"Wizard":1,"Warmage":1} and s["level"] == 1
    assert not s.get("classLevelParseIncomplete")

    spaced_spell_html = """
    <h1>Spaced Classes</h1><p>Example Book (EX), p. 1</p>
    <div>School</div><div>Abjuration</div><div>Casting Time</div><div>1 standard action</div>
    <div>Components</div><div>V, S</div><div>Range</div><div>Close</div>
    <div>Duration</div><div>1 round/level</div>
    <div>Classes</div><div><a>Sorcerer</a> 2 <a>Wizard</a> 2 <a>Wu Jen</a> 2</div>
    """
    p=DetailParser();p.feed(spaced_spell_html);p.close()
    spaced=parse_spell(p,{"name":"Spaced Classes"})
    assert spaced["classLevels"] == {"Sorcerer":2,"Wizard":2,"Wu Jen":2}
    assert not spaced.get("classLevelParseIncomplete")
    assert split_class_levels("Sorcerer 2 Wizard 2 Wu Jen 2") == {"Sorcerer":2,"Wizard":2,"Wu Jen":2}
    assert split_class_levels("Sorcerer 2Wizard 2Wu Jen 2") == {"Sorcerer":2,"Wizard":2,"Wu Jen":2}

    domain_html = """
    <h1>Domain Test</h1><p>Example Book (EX), p. 1</p>
    <div>School</div><div>Abjuration</div><div>Casting Time</div><div>1 action</div>
    <div>Components</div><div>V, S</div><div>Range</div><div>Touch</div>
    <div>Duration</div><div>1 minute</div><div>Domains</div><div>Spell 3 Initiate of Mystra (Feat) 3</div>
    <h2>Description</h2><p>Grants a brief +1 bonus.</p>
    """
    p=DetailParser();p.feed(domain_html);p.close()
    s=parse_spell(p,{"name":"Domain Test"})
    assert s["domainLevels"][0]["name"]=="Spell" and s["domainLevels"][0]["level"]==3
    assert s["level"]==3 and s["effect"]=="Grants a brief +1 bonus."

    long_effect_html = """
    <h1>Long Effect</h1><p>Example Book (EX), p. 2</p>
    <div>School</div><div>Evocation</div><div>Casting Time</div><div>1 action</div>
    <div>Components</div><div>V, S</div><div>Range</div><div>Close</div>
    <div>Duration</div><div>Instantaneous</div><div>Classes</div><div>Wizard 1</div>
    <h2>Description</h2><p>""" + ("mechanical rule text " * 20) + """</p>
    """
    p=DetailParser();p.feed(long_effect_html);p.close()
    s=parse_spell(p,{"name":"Long Effect"})
    assert s.get("effectNeedsSummary") and not s.get("effect")

    reference_effect_html = """
    <h1>Reference Effect</h1><p>Example Book (EX), p. 3</p>
    <div>School</div><div>Abjuration</div><div>Casting Time</div><div>1 action</div>
    <div>Components</div><div>V, S</div><div>Range</div><div>Touch</div>
    <div>Duration</div><div>1 minute</div><div>Classes</div><div>Wizard 2</div>
    <h2>Description</h2><p>This spell functions like lesser example ward, except that the resistance is 10.</p>
    """
    p=DetailParser();p.feed(reference_effect_html);p.close()
    s=parse_spell(p,{"name":"Reference Effect"})
    assert s.get("effectReferenceDependent")
    assert s.get("effectNeedsSummary") and not s.get("effect")

    feat_html = """
    <h1>Monkey Grip</h1><p>General feat</p><p>Complete Warrior (CW), p. 103</p>
    <div>Prerequisite</div><div>BAB +1.</div>
    <div>Benefit</div><div>You can use a larger melee weapon with an attack penalty.</div>
    <div>Description</div><div>You are trained to wield oversized weapons.</div>
    """
    p=DetailParser();p.feed(feat_html);p.close()
    f=parse_feat(p,{"name":"Monkey Grip"})
    assert f["featType"] == "General feat" and f["prerequisites"][0]["text"] == "BAB +1."
    assert f["effect"] == "You can use a larger melee weapon with an attack penalty."
    assert f["mechanicsPresence"]["benefit"] and f["mechanicsPresence"]["prerequisiteLabeled"]
    assert enrichment_gaps("feats",f) == []

    malformed_feat = """
    <h1>Kuo-Toan Monasticism</h1><p>General feat</p><p>Monster Manual V (MM5), p. 97</p>
    <div>Prerequisite</div><div>a kuo-toa can smear a strange sticky substance on its hands. When using flurry of blows, Flurry of blows. As a swift action, Kuo-Toa, rather than its character level to determine its stunning fist save DC, the kuo-toa automatically hits with one of its extra attacks if its first attack hits. A kuo-toa that has this feat uses its Hit Dice.</div>
    """
    p=DetailParser();p.feed(malformed_feat);p.close()
    f=parse_feat(p,{"name":"Kuo-Toan Monasticism","id":"self-test-malformed"})
    assert not f.get("prerequisites"), "merged Benefit prose must not be retained as a prerequisite"

    placeholder_feat = """
    <h1>Spirit Sense</h1><p>General feat</p><p>Heroes of Horror (HH), p. 124</p>
    <div>Prerequisite</div><div>Do not touch this field. Everything is handled from the corresponding twig file (the path is in the help text).</div>
    <div>Benefit</div><div>Source mechanic.</div>
    """
    p=DetailParser();p.feed(placeholder_feat);p.close()
    f=parse_feat(p,{"name":"Spirit Sense","id":"self-test-placeholder"})
    assert not f.get("prerequisites"), "template placeholder must not count as a prerequisite"

    familiar_pointer = """
    <h1>Improved Familiar</h1><p>General feat</p><p>Serpent Kingdoms (SK), p. 146</p>
    <div>Prerequisite</div><div>Ability to acquire a new familiar.</div>
    <div>Description</div><div>Refer to the Improved Familiar feat on page 200 of the Dungeon Master's Guide. Familiar - Alignment - Level. Jaculi(SK) - Chaotic evil - 5th. Muckdweller(SK) - Lawful evil - 5th.</div>
    """
    p=DetailParser();p.feed(familiar_pointer);p.close()
    f=parse_feat(p,{"name":"Improved Familiar","id":"self-test-familiar"})
    assert f["inheritsFromFeat"] == "feats/improved-familiar-1481" and len(f["variantOptions"]) == 2
    assert "featEffect" not in enrichment_gaps("feats",f)

    flavor_only_feat = """
    <h1>Flavor Only</h1><p>General feat</p><p>Example Source (EX), p. 1</p>
    <div>Description</div><div>You are known for an unusual talent.</div>
    """
    p=DetailParser();p.feed(flavor_only_feat);p.close()
    f=parse_feat(p,{"name":"Flavor Only"})
    assert "featEffect" in enrichment_gaps("feats",f), "flavor text alone must not satisfy the feat-effect contract"

    item_missing_effect_html = """
    <h1>Saddle of Speed 2</h1><p>PSI · Body</p><p>The Mind's Eye [Web 3.0] (TME30)</p>
    <div>Price</div><div>8,500 gp</div><div>Caster Level</div><div>6</div>
    <div>Aura</div><div>Moderate Psychoportation</div><div>Activation</div><div>— (see text)</div>
    """
    p=DetailParser();p.feed(item_missing_effect_html);p.close()
    item=parse_item(p,{"id":"items/saddle-of-speed-2-792","name":"Saddle of Speed 2"})
    assert item["effectSummary"].startswith("Enhances the wearer's speed")
    assert item["supplementVerified"] and item["mechanicsPresence"]["ruleProse"]
    assert enrichment_gaps("items",item)==[]

    fallback=item_source_fallback_details({"id":"items/key-of-opening/closing-758","name":"Key of Opening/Closing"})
    assert fallback and fallback["sourceFallbackVerified"] and fallback["sourceBook"]=="The Mind's Eye [Web 3.0]"
    assert fallback["ruleStats"]["marketPriceGp"]==400 and fallback["effectSummary"]

    placeholder_html = """
    <h1>Varie</h1><p>OTH · None</p><div>Activation</div><div>—</div>
    <p>This generic entry is for varied references. Do no touch it.</p>
    """
    p=DetailParser();p.feed(placeholder_html);p.close()
    item=parse_item(p,{"id":"items/varie-99999","name":"Varie"})
    assert item["nonGameplayReference"] is True and item["referenceKind"]=="generic-varied-entry"
    validate_details({"id":"items/varie-99999","name":"Varie"},"items",p,item)
    assert enrichment_gaps("items",item)==[]

    print("PASS DnD Tools structured enrichment parser")


REQUIRED_AUDIT_CATEGORIES = {
    "3.5/classes","3.5/feats","3.5/spells","3.5/items","3.5/equipment",
    "5e/classes","5e/spells","5e/feats","5e/items"
}


def audit_report_allows_write(path: str | None) -> bool:
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
        and float(report.get("minimumRate", 0)) >= 1.0
        and {row.get("category") for row in report.get("categories",[])} == REQUIRED_AUDIT_CATEGORIES
        and all(float(row.get("successRate",0)) >= 1.0 and row.get("failed",1) == 0 for row in report.get("categories",[]))
    )


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--categories", nargs="+", choices=sorted(PARSERS), default=DEFAULT_CATEGORIES)
    ap.add_argument("--limit", type=int)
    ap.add_argument("--delay", type=float, default=0.35)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--write", action="store_true", help="Persist changes. Blocked without a passing full-catalog audit.")
    ap.add_argument("--audit-report", help="Path to a strict full-catalog preflight report required for --write.")
    ap.add_argument("--candidate-dir",type=Path,help="Write dry-run candidate JSON here; never modifies the bundled catalog.")
    ap.add_argument("--shard-count",type=int,default=1,help="Split candidate generation into deterministic catalog-index shards.")
    ap.add_argument("--shard-index",type=int,default=0,help="Zero-based shard index used with --shard-count.")
    ap.add_argument("--self-test", action="store_true")
    args=ap.parse_args()
    if args.self_test:
        self_test()
        return
    if args.shard_count < 1 or not 0 <= args.shard_index < args.shard_count:
        ap.error("--shard-index must be within 0..--shard-count-1")
    if args.shard_count > 1 and args.candidate_dir is None:
        ap.error("Sharded enrichment is candidate-only and requires --candidate-dir")
    if args.shard_count > 1 and args.write:
        raise SystemExit("--write is never allowed for sharded candidate generation.")
    if args.write and not audit_report_allows_write(args.audit_report):
        raise SystemExit("--write is locked until a strict full-catalog audit report passes with zero critical gaps.")
    results=[
        run_category(
            c,args.limit,args.delay,args.force,args.write,args.candidate_dir,
            shard_count=args.shard_count,shard_index=args.shard_index
        )
        for c in args.categories
    ]
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
