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
import gzip
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



_CLASS_WEAPON_CACHE=None

def class_weapon_catalog():
    global _CLASS_WEAPON_CACHE
    if _CLASS_WEAPON_CACHE is None:
        path=CATALOG/"equipment.json"
        rows=json.loads(path.read_text(encoding="utf-8")) if path.exists() else []
        values=[]
        for row in rows:
            if row.get("kind")!="weapon":
                continue
            name=clean(row.get("name",""))
            aliases={name.casefold()}
            if "," in name:
                left,right=[clean(part) for part in name.split(",",1)]
                aliases.add(f"{right} {left}".casefold())
            values.append({"index":str(row.get("id","")).split("/")[-1],"name":name,"aliases":aliases})
        _CLASS_WEAPON_CACHE=values
    return _CLASS_WEAPON_CACHE


def parse_class_proficiencies(parser: DetailParser) -> dict:
    """Extract only explicit, source-stated class weapon/armor proficiency grants.

    Broad categories are normalized for automation. The original source sentence is
    retained so unusual named-weapon clauses remain visible instead of being guessed.
    """
    features=section(parser.lines,parser.headings,"Class Features")
    candidates=[]
    for line in features:
        value=clean(line)
        if re.search(r"\b(?:weapon and armor proficiency|weapon proficiency|armor proficiency)\b",value,re.I):
            candidates.append(value)
    if not candidates:
        return {}
    text=" ".join(candidates)
    folded=text.casefold().replace("’","'")
    grants=[]

    def positive(term: str) -> bool:
        for match in re.finditer(re.escape(term),folded):
            prefix=folded[max(0,match.start()-42):match.start()]
            if re.search(r"(?:\bnot\b|\bno\b|\bwithout\b|\bexcept\b)[^.;,:]{0,30}$",prefix):
                continue
            return True
        return False

    def add(index: str, name: str, kind: str):
        if not any(item["index"]==index for item in grants):
            grants.append({"index":index,"name":name,"kind":kind})

    if re.search(r"\b(?:all|any type of)\s+armor\b",folded) and positive("armor"):
        add("light-armor","Light armor","armor")
        add("medium-armor","Medium armor","armor")
        add("heavy-armor","Heavy armor","armor")
    else:
        armor_pattern=r"\b((?:light|medium|heavy)(?:\s*,\s*(?:light|medium|heavy))*(?:\s*,?\s*(?:and|or)\s*(?:light|medium|heavy))?)\s+armor\b"
        for match in re.finditer(armor_pattern,folded):
            phrase=match.group(0)
            if not positive(phrase):
                continue
            levels=set(re.findall(r"\b(light|medium|heavy)\b",match.group(1)))
            for level in ("light","medium","heavy"):
                if level in levels:
                    add(f"{level}-armor",f"{level.title()} armor","armor")
    if "light shield" in folded and positive("light shield"):
        add("light-shields","Light shields","armor")
    if "heavy shield" in folded and positive("heavy shield"):
        add("heavy-shields","Heavy shields","armor")
    if "tower shield" in folded and positive("tower shield"):
        add("tower-shields","Tower shields","armor")
    broad_shields=bool(re.search(r"\bshields?\b",folded)) and not re.search(r"\b(?:light|heavy|tower) shields?\b",folded)
    if broad_shields and positive("shield"):
        if re.search(r"shields?[^.;]{0,30}except[^.;]{0,20}tower",folded):
            add("shields-except-tower","Shields (except tower shields)","armor")
        else:
            add("shields","Shields","armor")
    if "simple weapon" in folded and positive("simple weapon"):
        add("simple-weapons","Simple weapons","weapons")
    if "martial weapon" in folded and positive("martial weapon"):
        add("martial-weapons","Martial weapons","weapons")

    for weapon in class_weapon_catalog():
        for alias in weapon["aliases"]:
            if alias and re.search(r"(?<![a-z])"+re.escape(alias)+r"(?![a-z])",folded) and positive(alias):
                add(weapon["index"],weapon["name"],"weapons")
                break

    positive=bool(re.search(r"\bproficient\b",folded))
    return {
        "proficiencies":grants,
        "proficiencyText":text,
        "proficiencyParseIncomplete":bool(positive and not grants),
    }

def parse_progression_table(parser: DetailParser):
    """Choose the strongest class-level progression table, not merely the first table with 'Class Level'.

    Many 3.5 pages contain secondary tables (spell slots, poison scaling, mysteries, etc.)
    before the actual BAB/save/Special advancement table.  Prefer a table exposing class
    features and core progression, then fall back to named casting/manifesting tracks.
    """
    candidates=[]
    feature_headers={"special","specials","feature","features","class feature","class features","abilities"}
    core_headers={"bab","base attack bonus","attack bonus","fort","fortitude","fort save","ref","reflex","ref save","will","will save"}
    track_pattern=re.compile(
        r"(?:spellcasting|spells? per day|spells? known|manifesting|power points|powers? known|"
        r"powers? discovered|maneuvers? known|maneuvers? readied|stances? known|invocations? known|"
        r"soulmelds?|essentia|chakra binds?|mysteries?|vestiges?)",re.I
    )
    for table_index,table in enumerate(parser.tables):
        if not table:
            continue
        for idx,candidate in enumerate(table[:5]):
            header=[clean(c) for c in candidate]
            folded=[h.casefold() for h in header]
            has_level=any(h=="level" or h.endswith(" level") or h=="racial level" for h in folded)
            if not has_level:
                continue
            feature_count=sum(h in feature_headers for h in folded)
            core_count=sum(h in core_headers for h in folded)
            track_count=sum(bool(track_pattern.search(h)) for h in header)
            if not (feature_count or core_count or track_count):
                continue
            score=feature_count*100+core_count*12+track_count*5+min(len(header),20)
            candidates.append((score,-table_index,-idx,header,table[idx+1:]))
    if not candidates:
        return None,None
    _,_,_,header,data_rows=max(candidates,key=lambda item:item[:3])
    rows=[]
    for row in data_rows:
        values=row+[""]*max(0,len(header)-len(row))
        rows.append({header[i] or f"column_{i+1}":clean(values[i]) for i in range(len(header))})
    return [header]+data_rows,rows


def class_source_kind(lines: list[str]) -> str:
    """Read class type only from an actual source header, never incidental prose."""
    for line in lines[:30]:
        match=re.match(r"^(Prestige|Base|NPC|Psionic|Racial|Monster)\s+Class\b",clean(line),re.I)
        if match:
            return match.group(1).casefold()
    return ""


def explicit_variant_parents(lines: list[str], entry_name: str) -> list[str]:
    """Return multiple valid base-class parents for a compound variant.

    Some Unearthed Arcana variants apply to either of two base classes.  Preserve
    that choice instead of collapsing it to an arbitrary parent.
    """
    known=(
        "Barbarian","Bard","Cleric","Druid","Fighter","Monk","Paladin","Ranger",
        "Rogue","Sorcerer","Wizard"
    )
    match=re.fullmatch(r"(.+?)\s+Variant",clean(entry_name or ""),re.I)
    if match and "/" in match.group(1):
        names=[clean(part).title() for part in match.group(1).split("/") if clean(part)]
        if len(names)>1 and all(name in known for name in names):
            return names
    joined=" ".join(lines)
    match=re.search(r"retained from base classes?[,]?\s*(?:the\s+)?([A-Za-z]+)\s+or\s+(?:the\s+)?([A-Za-z]+)",joined,re.I)
    if match:
        names=[clean(match.group(1)).title(),clean(match.group(2)).title()]
        if all(name in known for name in names):
            return names
    return []


def explicit_variant_parent(lines: list[str], entry_name: str) -> str:
    joined=" ".join(lines)
    patterns=[
        r"same hit dice,.*?advancement as (?:a |the )?standard ([A-Za-z ]+?)(?:\s*\(|\s+except|\s+as|\.)",
        r"retained from base class\b,?\s*(?:the\s+)?([A-Za-z]+)",
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
    merge_keys=("inheritsFrom","inheritsFromOptions","sourceEdition","notes","prestige","hit_die","skillPoints","classSkills","classSkillRule","proficiencies","proficiencyText","prerequisites","progression","featureNames")
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
    proficiency=parse_class_proficiencies(parser)
    if proficiency:
        result.update(proficiency)
    if progression:
        progression_headers={clean(x).casefold() for x in progression[0]}
        if "skill points" in progression_headers and progression_headers.intersection({"cr","challenge rating","hit dice"}):
            result["racialClass"]=True
    parents=explicit_variant_parents(lines,entry.get("name",""))
    if parents:
        result["inheritsFromOptions"]=parents
    else:
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
            score=sum(bool(parsed.get(k)) for k in ("hit_die","skillPoints","progression","classSkills","classSkillRule","proficiencies","prerequisites","inheritsFrom"))
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
    proficiency=parse_class_proficiencies(parser)
    if proficiency: result.update(proficiency)
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
        for key in ("prerequisites","hit_die","skillPoints","minBab","classSkills","classSkillRule","proficiencies","proficiencyText","proficiencyParseIncomplete","progression","advancement","inheritsFrom"):
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


_FEAT_RULE_SUMMARY_CACHE=None

def feat_rule_summaries():
    global _FEAT_RULE_SUMMARY_CACHE
    if _FEAT_RULE_SUMMARY_CACHE is None:
        entries={}
        batch_dir=ROOT/"scripts"/"feat_rule_summaries_35_batches"
        if batch_dir.exists():
            batch_paths=sorted(list(batch_dir.glob("*.json"))+list(batch_dir.glob("*.json.gz")))
            for batch_path in batch_paths:
                if batch_path.name.endswith(".json.gz"):
                    with gzip.open(batch_path,"rt",encoding="utf-8") as fh:
                        batch_payload=json.load(fh)
                else:
                    batch_payload=json.loads(batch_path.read_text(encoding="utf-8"))
                batch_entries=batch_payload.get("entries",{})
                if not isinstance(batch_entries,dict):
                    raise ValueError(f"Feat rule review batch must contain an entries object: {batch_path.name}")
                overlap=sorted(set(entries)&set(batch_entries))
                if overlap:
                    raise ValueError(
                        f"Duplicate feat rule review IDs in {batch_path.name}: "
                        +", ".join(overlap[:10])
                    )
                entries.update(batch_entries)
        _FEAT_RULE_SUMMARY_CACHE=entries
    return _FEAT_RULE_SUMMARY_CACHE


def feat_rule_digest(text: str) -> str:
    normalized=clean(text)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def apply_reviewed_feat_rules(
    entry: dict,
    details: dict,
    benefit_source: str,
    normal_source: str,
    special_source: str,
) -> dict:
    review=feat_rule_summaries().get(entry.get("id"))
    if not review:
        return details
    if clean(review.get("name","")).casefold()!=clean(entry.get("name","")).casefold():
        raise ValueError(f"Feat rule review identity mismatch for {entry.get('name')}")
    result={**details}
    mismatches=[]
    mapping=(
        ("benefit",benefit_source,"benefitSha256","effectSummary","effectNeedsSummary","effectSourceLength"),
        ("normal",normal_source,"normalSha256","normalSummary","normalNeedsSummary","normalSourceLength"),
        ("special",special_source,"specialSha256","specialSummary","specialNeedsSummary","specialSourceLength"),
    )
    applied=[]
    for label,source,digest_key,summary_key,needs_key,length_key in mapping:
        summary=clean(review.get(summary_key,""))
        if not summary:
            continue
        expected=clean(review.get(digest_key,""))
        actual=feat_rule_digest(source)
        if not expected or expected!=actual:
            mismatches.append(label)
            continue
        if result.get(needs_key) and not result.get(summary_key):
            result[summary_key]=summary
            result.pop(needs_key,None)
            result.pop(length_key,None)
            applied.append(label)
    if mismatches:
        result["featRuleReviewMismatchFields"]=mismatches
    if applied:
        result["featRuleReviewVerified"]=True
        result["featRuleReviewFields"]=applied
        result["featRuleReviewProvenance"]=review.get("provenance",[])
    return result


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
        "normalLabeled": any(re.match(r"^Normal(?:\s*:|$)",clean(line),re.I) for line in lines),
        "specialLabeled": any(re.match(r"^Special(?:\s*:|$)",clean(line),re.I) for line in lines),
        "prerequisiteLabeled": prereq_labeled,
        "ruleProse": has_rule_prose(lines, entry.get("name",""))
    }
    result=apply_reviewed_feat_rules(entry,result,benefit,normal,special)
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
        entries=dict(payload.get("entries",{}))
        batch_dir=ROOT/"scripts"/"spell_effect_summaries_35_batches"
        if batch_dir.exists():
            batch_paths=sorted(list(batch_dir.glob("*.json"))+list(batch_dir.glob("*.json.gz")))
            for batch_path in batch_paths:
                if batch_path.name.endswith(".json.gz"):
                    with gzip.open(batch_path,"rt",encoding="utf-8") as fh:
                        batch_payload=json.load(fh)
                else:
                    batch_payload=json.loads(batch_path.read_text(encoding="utf-8"))
                batch_entries=batch_payload.get("entries",{})
                if not isinstance(batch_entries,dict):
                    raise ValueError(f"Spell effect review batch must contain an entries object: {batch_path.name}")
                overlap=sorted(set(entries)&set(batch_entries))
                if overlap:
                    raise ValueError(
                        f"Duplicate spell effect review IDs in {batch_path.name}: "
                        +", ".join(overlap[:10])
                    )
                entries.update(batch_entries)
        _SPELL_EFFECT_SUMMARY_CACHE=entries
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
    replacement_tables=supplement.get("tables")
    if replacement_tables not in (None,"",[],{}):
        if supplement.get("resolvesSourceIncomplete") and result.get("sourceIncomplete"):
            result["tables"]=replacement_tables
            result["supplementTableReplacement"]=True
        elif result.get("tables") in (None,"",[],{}):
            result["tables"]=replacement_tables
        elif normalized_compare(result.get("tables"))!=normalized_compare(replacement_tables):
            conflicts.append("tables")
            result["supplementConflicts"]=conflicts
    if supplement.get("resolvesSourceIncomplete") and result.get("sourceIncomplete"):
        result["sourceIncompleteResolved"]=True
    return result


def spell_effect_geometry(lines: list[str]) -> str:
    """Read the Effect header without confusing it with reviewed effect prose."""
    headers = {"school", "casting time", "components", "range", "target", "area",
               "duration", "saving throw", "spell resistance", "classes", "domains",
               "descriptors", "description"}
    for index, line in enumerate(lines):
        label = clean(line)
        if label.casefold() == "description":
            break
        if label.casefold().startswith("effect:"):
            return clean(label.split(":", 1)[1])
        if label.casefold() == "effect":
            for value in lines[index + 1:]:
                value = clean(value)
                if not value:
                    continue
                return "" if value.casefold().split(":", 1)[0] in headers else value
    return ""


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
    geometry = spell_effect_geometry(lines)
    if geometry:
        result["effectGeometry"] = geometry
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

    # Savage Species is a 3.0 source. Its Improved Enlarge/Reduce entries say
    # "As enlarge/reduce, except as noted above" (range Touch; duration
    # 10 minutes/level). The rebuilt catalog incorrectly expands those
    # references with the later 3.5 enlarge person/reduce person headers.
    # Restore only the inherited 3.0 header fields here; the long-form effect
    # is separately digest-locked in the reviewed spell summaries.
    savage_species_size_repairs={
        "spells/improved-enlarge-3231":{
            "casting_time":"1 action",
            "components":["V","S","M"],
            "range":"Touch",
            "target":"One creature, or one object of up to 10 cu. ft. per level in volume",
            "duration":"10 minutes/level",
            "savingThrow":"Fortitude negates",
            "spellResistance":"Yes",
            "sourceEdition":"3.0",
            "sourcePage":67,
        },
        "spells/improved-reduce-3232":{
            "casting_time":"1 action",
            "components":["V","S","M"],
            "range":"Touch",
            "target":"One creature or object of up to 10 cu. ft./caster level",
            "duration":"10 minutes/level",
            "savingThrow":"Fortitude negates (object)",
            "spellResistance":"Yes (object)",
            "sourceEdition":"3.0",
            "sourcePage":67,
        },
    }
    savage_species_repair=savage_species_size_repairs.get(entry.get("id"))
    if savage_species_repair:
        result.update(savage_species_repair)
        result["sourceRepairApplied"]=True
        result["sourceRepairMarker"]="verified-savage-species-3e-size-spell-inheritance"

    effect_source=spell_description_text(parser)
    if effect_source:
        # Verified Miniatures Handbook repair: the rebuilt pages report an
        # extra Focus component, but the sourcebook gives Repair Light Damage
        # components V, S and the derived spells declare no component exception.
        if (
            entry.get("id") in {
                "spells/repair-moderate-damage-1996",
                "spells/repair-serious-damage-1997",
            }
            and result.get("components") == ["V", "S", "F"]
        ):
            result["components"] = ["V", "S"]
            result["sourceRepairApplied"] = True
            result["sourceRepairMarker"] = "verified-miniatures-handbook-repair-components"

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
        if entry.get("id")=="spells/enlarge-person-2805" and re.search(
            r"see Table 2-2 in the permanency spell",
            effect_source,
            re.I,
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-enlarge-person-equipment-rules"
        if entry.get("id")=="spells/evil-weather-139" and re.search(
            r"functions as described in Chapter 2 of this book",
            effect_source,
            re.I,
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="external-evil-weather-rules-not-inline"
        if entry.get("id")=="spells/extract-drug-140" and any(
            re.search(r"Wood takes on powder a permanent foul odor",clean(cell),re.I)
            for table in parser.tables for row in table for cell in row
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="corrupt-extract-drug-table"
        if (
            entry.get("id")=="spells/genius-loci-782"
            and re.search(r"choose air\s*,\s*earth\s*,\s*fire\s*,\s*or true seeing reveals",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-genius-loci-elemental-rules"
        if (
            entry.get("id")=="spells/favorable-sacrifice-1942"
            and re.search(r"By expending 250 gp",effect_source,re.I)
            and re.search(r"Gems worth a total of 1,000 gp, 5,000 gp, or 25,000 gp",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="mixed-printing-favorable-sacrifice-tiers"
        if (
            entry.get("id")=="spells/fiery-eyes-2067"
            and re.search(r"see Catching on Fire",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="delegated-fiery-eyes-catching-fire-rules"
        if (
            entry.get("id")=="spells/fist-of-stone-546"
            and re.search(r"if you have the Monster Manual",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="corrupt-fist-of-stone-multiattack-reference"
        if (
            entry.get("id")=="spells/fires-of-purity-2070"
            and re.search(r"see Catching on Fire",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="delegated-fires-of-purity-catching-fire-rules"
        if (
            entry.get("id")=="spells/flame-dagger-4508"
            and re.search(r"deals ad4 points of fire damage",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="corrupt-flame-dagger-damage-die"
        if (
            entry.get("id")=="spells/flaying-tendrils-874"
            and re.search(r"treated as though you have the undead",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-flaying-tendrils-grapple-rules"
        if (
            entry.get("id")=="spells/quench-2857"
            and re.search(r"Each fireball or a flaming burst sword",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-quench-fire-elemental-rule"
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
        if (
            entry.get("id")=="spells/storm-of-elemental-fury-663"
            and re.search(r"pages\s*94-95\s+of\s+the\s+Concentration check",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-storm-elemental-fury-windstorm-source"
        if (
            entry.get("id") in {"spells/golden-barding-4555","spells/golden-barding-646"}
            and re.search(r"scale mail barding\s*\(\s*4 armor bonus\)",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="corrupt-golden-barding-bonus-sign"
        if (
            entry.get("id")=="spells/jade-strike-2073"
            and re.search(r"suffers a 4 penalty on most Strength and Dexterity-based skills",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="corrupt-jade-strike-penalty-sign"
        if (
            entry.get("id")=="spells/scatterspray-3806"
            and re.search(r"\btake ld8 points of damage\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="corrupt-scatterspray-dice-notation"
        if (
            entry.get("id")=="spells/talons-5021"
            and (
                re.search(r"\byout other hand\b",effect_source,re.I)
                or re.search(r"\bYou are considered arms\.",effect_source,re.I)
            )
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="corrupt-talons-source"
        if (
            entry.get("id")=="spells/hidden-ward-4759"
            and (
                re.search(r"\bprevent subicion by the players\b",effect_source,re.I)
                or re.search(r"\bone-half you caster level\b",effect_source,re.I)
            )
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="garbled-hidden-ward-source"
        if (
            entry.get("id")=="spells/last-judgment-90"
            and re.search(r"\bmonstrous humanoids\s*,\s*and resurrection is cast\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-last-judgment-source"
        if (
            entry.get("id")=="spells/nether-trail-142"
            and re.search(r"\bEvil outsider must make its saving throw first\b",effect_source,re.I)
            and not re.search(r"\bcome within 10 feet\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-nether-trail-source"
        if (
            entry.get("id")=="spells/nightstalkers-transformation-428"
            and re.search(r"\bYou also gain the cat[’']s grace\b",effect_source,re.I)
            and not re.search(r"\bWeapon Finesse\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-nightstalkers-transformation-source"
        if (
            entry.get("id")=="spells/nystuls-magic-aura-2688"
            and re.search(r"\bmake a \+2 identify cast on it\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="garbled-nystuls-magic-aura-source"
        if (
            entry.get("id")=="spells/invoke-the-cerulean-sign-1539"
            and re.search(r"\bmoves up one level on the table\b",effect_source,re.I)
            and not parser.tables
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="omitted-cerulean-sign-effect-table"
        if (
            entry.get("id")=="spells/phantasmal-thief-1006"
            and re.search(r"\bEven objects in a Improved Disarm feat and a \+20 Strength modifier\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-draconomicon-phantasmal-thief-source"
        if (
            entry.get("id") in {"spells/reality-maelstrom-1861","spells/reality-maelstrom-4072"}
            and re.search(r"\brandom plane\s*\(see sidebar\)",effect_source,re.I)
            and not parser.tables
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="omitted-reality-maelstrom-random-plane-sidebar"
        if (
            entry.get("id")=="spells/spell-matrix-lesser-4207"
            and re.search(r"\bOnly a spell that can be altered by the antimagic field\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-lesser-spell-matrix-source"
        if (
            entry.get("id")=="spells/shadow-well-4996"
            and (
                re.search(r"\bflee cove\.",effect_source,re.I)
                or re.search(r"\bupo leaving\b",effect_source,re.I)
            )
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="garbled-shadow-well-source"
        if (
            entry.get("id")=="spells/share-animals-mind-5015"
            and re.search(r"\bcheck Animal\s*\)",effect_source,re.I)
            and not re.search(r"\bMonster Manual\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-share-animals-mind-animal-definition"
        if (
            entry.get("id")=="spells/skull-eyes-2292"
            and re.search(r"\beither of two effects, as follows\b",effect_source,re.I)
            and not parser.tables
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="missing-skull-eyes-effects"
        if (
            entry.get("id")=="spells/spiritual-weapon-2651"
            and re.search(r"\bYour feats\s*\(such as disintegrate\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-spiritual-weapon-direction-rules"
        if (
            entry.get("id")=="spells/spore-field-918"
            and re.search(r"\bsuch squares\s*\(\s*Move Silently checks by 2\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-spore-field-terrain-rules"
        if (
            entry.get("id")=="spells/threesteel-1118"
            and re.search(r"\bsneak attack\s*,\s*sorcerer so he could use it as an unexpected advantage\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-threesteel-source"
        if (
            entry.get("id")=="spells/unfailing-endurance-978"
            and re.search(r"\bstacks with the bonus from the Dungeon Master[’']S Guide\s*\)\s*\.?",effect_source,re.I)
            and not re.search(r"\bExtended Activity\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-unfailing-endurance-source"
        if (
            entry.get("id")=="spells/words-of-the-kami-2081"
            and (
                re.search(r"\bsuffers a 4 penalty on most Strength and Dexterity-based skill checks\b",effect_source,re.I)
                or (re.search(r"\bsuffer the following ill effects\b",effect_source,re.I) and not parser.tables)
            )
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="corrupt-words-of-the-kami-effects"
        if (
            entry.get("id")=="spells/locate-creature-2505"
            and re.search(r"\bcreature of a specific kind\s*\(such as a polymorph spells\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-locate-creature-source"
        if (
            entry.get("id")=="spells/investiture-of-the-malebranche-1183"
            and re.search(r"\bextra damage whenever it successfully hits with a charge attack, depending on its size\b",effect_source,re.I)
            and not parser.tables
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="omitted-malebranche-size-damage-table"
        if (
            entry.get("id")=="spells/mudslide-3335"
            and re.search(r"\bsee Avalanches on page 90 of the transmute mud to rock spell hardens\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-stormwrack-mudslide-source"
        if (
            entry.get("id")=="spells/node-genesis-3489"
            and re.search(r"\bsee Table 4-1\b",effect_source,re.I)
            and not parser.tables
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="external-node-genesis-class-table"
        if (
            entry.get("id")=="spells/otyugh-swarm-5011"
            and re.search(r"\bat least 6,000 ounds of sewage\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="corrupt-dragonlance-otyugh-swarm-pounds"
        if (
            entry.get("id")=="spells/form-of-the-threefold-beast-875"
            and re.search(r"\bform of a chimera\s*\(\s*Polymorph Subschool sidebar\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-threefold-beast-chimera-source"
        if (
            entry.get("id")=="spells/shape-of-the-hellspawned-stalker-883"
            and re.search(r"\bform of a hell hound\s*\(\s*Polymorph Subschool sidebar\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-hellspawned-stalker-source"
        if (
            entry.get("id")=="spells/prismatic-deluge-831"
            and re.search(r"\bprismatic spray spell\s*\(\s*prismatic spray table\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-prismatic-deluge-source"
        if (
            entry.get("id")=="spells/seed-of-undeath-860"
            and re.search(r"\bmaximum number of HD worth of animate dead\s*\)",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-seed-of-undeath-control-cap"
        if (
            entry.get("id")=="spells/halasters-light-step-351"
            and re.search(r"\bbonus provided by fly\s*\.\s*$",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-halasters-light-step-source"
        if (
            entry.get("id")=="spells/plague-rats-937"
            and re.search(r"\bfilth fever\s*\(see page 74 of the stinking cloud spell\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-defenders-plague-of-rats-source"
        if (
            entry.get("id")=="spells/wake-trailing-3342"
            and re.search(r"\bfollowing modifiers are used in place of those given\b",effect_source,re.I)
            and not parser.tables
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="omitted-wake-trailing-survival-table"
        if (
            entry.get("id")=="spells/hound-of-doom-924"
            and re.search(r"\bstatistics of a dire wolf\s*\(see page 65 of the Handle Animal skill\b",effect_source,re.I)
        ):
            result["sourceIncomplete"]=True
            result["sourceIncompleteMarker"]="truncated-hound-of-doom-adjustments"
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
            re.search(r"\b(?:functions?|works?|operates?)\s+like\b",effect_source,re.I)
            or re.search(r"\b(?:functions?|works?|operates?)\s+identically\s+to\b",effect_source,re.I)
            or re.search(r"\b(?:functions?|works?|operates?)\s+as\s+(?!if\b|long\s+as\s+at\s+least\b|a\b|an\b)",effect_source,re.I)
            or re.search(r"^As\s+[^.!?]{1,120}?,\s*(?:except|but)\b",effect_source,re.I)
            or re.search(r"\bas\s+(?:a|the)\s+fog cloud\s+does\b",effect_source,re.I)
            or re.search(r"\bas\s+with\s+fog cloud\b",effect_source,re.I)
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


_ITEM_EFFECT_SUMMARY_CACHE=None

def item_effect_summaries():
    global _ITEM_EFFECT_SUMMARY_CACHE
    if _ITEM_EFFECT_SUMMARY_CACHE is None:
        entries={}
        batch_dir=ROOT/"scripts"/"item_effect_summaries_35_batches"
        if batch_dir.exists():
            batch_paths=sorted(list(batch_dir.glob("*.json"))+list(batch_dir.glob("*.json.gz")))
            for batch_path in batch_paths:
                if batch_path.name.endswith(".json.gz"):
                    with gzip.open(batch_path,"rt",encoding="utf-8") as fh:
                        payload=json.load(fh)
                else:
                    payload=json.loads(batch_path.read_text(encoding="utf-8"))
                batch_entries=payload.get("entries",{})
                if not isinstance(batch_entries,dict):
                    raise ValueError(f"Item effect review batch must contain an entries object: {batch_path.name}")
                overlap=sorted(set(entries)&set(batch_entries))
                if overlap:
                    raise ValueError(
                        f"Duplicate item effect review IDs in {batch_path.name}: "
                        +", ".join(overlap[:10])
                    )
                entries.update(batch_entries)
        _ITEM_EFFECT_SUMMARY_CACHE=entries
    return _ITEM_EFFECT_SUMMARY_CACHE


def item_effect_digest(text: str) -> str:
    return hashlib.sha256(clean(text).encode("utf-8")).hexdigest()


def apply_reviewed_item_effect_summary(entry: dict, details: dict, effect_source: str) -> dict:
    review=item_effect_summaries().get(entry.get("id"))
    if not review:
        return details
    if clean(review.get("name","")).casefold()!=clean(entry.get("name","")).casefold():
        raise ValueError(f"Item effect review identity mismatch for {entry.get('name')}")
    result={**details}
    expected=clean(review.get("sourceSha256",""))
    actual=item_effect_digest(effect_source)
    summary=clean(review.get("effectSummary",""))
    if not expected or expected!=actual:
        result["itemEffectReviewMismatch"]=True
        return result
    if result.get("effectNeedsSummary") and not result.get("effectSummary") and summary:
        result["effectSummary"]=summary
        result.pop("effectNeedsSummary",None)
        result.pop("effectSourceLength",None)
        result["itemEffectReviewVerified"]=True
        result["itemEffectReviewProvenance"]=review.get("provenance",[])
        presence=result.get("mechanicsPresence") or {}
        presence["ruleProse"]=True
        result["mechanicsPresence"]=presence
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
        result["genericRuleProvenance"]=[{
            "url":"https://www.d20srd.org/srd/psionic/items/powerStones.htm",
            "role":"generic power-stone activation, addressing, manifester-level, and brainburn rules",
        }]
        result["ruleSummary"]=(
            "A power stone stores one or more psionic powers for single use. "
            "Before use it must be addressed with a Psicraft check (DC 15 + power level). "
            "After addressing, manifesting a stored power is a standard action subject to disruption; "
            "the user must have the power on their class list and the required key ability score. "
            "If the user's manifester level is below the stone's manifester level, they must make a "
            "manifester-level check against DC stone manifester level + 1. On failure, a DC 5 Wisdom "
            "check avoids brainburn, with a natural 1 always failing. Brainburn lasts 1d4 rounds and "
            "deals 1d6 damage per stored power each round to the user and one random nearby ally until "
            "the stone is destroyed or moved more than 100 feet away. A standard stone uses the minimum "
            "manifester level needed for its stored power, and a successfully used power is flushed."
        )

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
    result=apply_item_supplement(entry,result)
    if result.get("effectNeedsSummary"):
        result=apply_reviewed_item_effect_summary(entry,result,effect_source)
    return result


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
        useful = ("hit_die","skillPoints","minBab","prerequisites","progression","advancement","classSkills","classSkillRule","inheritsFrom","inheritsFromOptions")
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
        if details.get("itemEffectReviewMismatch"):
            raise ValueError("Reviewed item effect summary no longer matches the current source text")
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
        if details.get("inheritsFrom") or details.get("inheritsFromOptions"):
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
        if presence.get("normalLabeled") and not (
            details.get("normalRule")
            or details.get("normalSummary")
            or details.get("normalNeedsSummary")
        ):
            gaps.append("normalRule")
        if presence.get("specialLabeled") and not (
            details.get("specialRule")
            or details.get("specialSummary")
            or details.get("specialNeedsSummary")
        ):
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
        if details.get("inheritsFromOptions"): bits.append("inherits baseline progression from choice of " + " or ".join(details["inheritsFromOptions"]))
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

    # A secondary class-level casting table must not displace the real feature table.
    multi_table_html = """
    <h1>Shadow Test</h1><p>Base Class Example Book (EX), p. 1</p>
    <table><tr><th>Class Level</th><th>1st</th><th>2nd</th></tr>
    <tr><td>1st</td><td>1</td><td>—</td></tr></table>
    <table><tr><th>Level</th><th>BAB</th><th>Fort</th><th>Ref</th><th>Will</th><th>Special</th></tr>
    <tr><td>1st</td><td>+0</td><td>+0</td><td>+0</td><td>+2</td><td>Fundamentals, apprentice mysteries</td></tr></table>
    """
    p=DetailParser();p.feed(multi_table_html);p.close()
    progression,advancement=parse_progression_table(p)
    assert progression[0][-1]=="Special" and advancement[0]["Special"]=="Fundamentals, apprentice mysteries"

    plural_special_html = """
    <table><tr><th>Level</th><th>BAB</th><th>Fort</th><th>Ref</th><th>Will</th><th>Specials</th></tr>
    <tr><td>1st</td><td>+0</td><td>+0</td><td>+0</td><td>+2</td><td>Focused talent</td></tr></table>
    """
    p=DetailParser();p.feed(plural_special_html);p.close()
    progression,_=parse_progression_table(p)
    assert progression[0][-1]=="Specials"

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

    proficiency_html = """
    <h1>Archivist</h1><p>Base Class Heroes of Horror (HH), p. 82</p>
    <h2>Class Features</h2>
    <p>Weapon and Armor Proficiency: Archivists are proficient with all simple weapons and with light and medium armor, but not with shields.</p>
    <p>Dark Knowledge: Three times per day, an archivist can draw upon his expansive knowledge.</p>
    <h2>Advancement</h2>
    """
    p=DetailParser();p.feed(proficiency_html);p.close()
    prof=parse_class_proficiencies(p)
    assert {item["index"] for item in prof["proficiencies"]}=={"light-armor","medium-armor","simple-weapons"}, prof
    assert "shields" not in [item["index"] for item in prof["proficiencies"]]
    assert not prof["proficiencyParseIncomplete"]

    limited_shield_html = """
    <h1>Warmage</h1><h2>Class Features</h2>
    <p>Weapon and Armor Proficiency: Warmages are proficient with all simple weapons, light armor, and light shields.</p>
    <h2>Advancement</h2>
    """
    p=DetailParser();p.feed(limited_shield_html);p.close()
    prof=parse_class_proficiencies(p)
    indexes={item["index"] for item in prof["proficiencies"]}
    assert "light-shields" in indexes and "shields" not in indexes

    named_weapon_html = """
    <h1>Wizard</h1><h2>Class Features</h2>
    <p>Weapon and Armor Proficiency: Wizards are proficient with the club, dagger, heavy crossbow, light crossbow, and quarterstaff, but not with any type of armor or shield.</p>
    <h2>Advancement</h2>
    """
    p=DetailParser();p.feed(named_weapon_html);p.close()
    prof=parse_class_proficiencies(p)
    indexes={item["index"] for item in prof["proficiencies"]}
    assert {"club","dagger","crossbow-heavy","crossbow-light","quarterstaff"}.issubset(indexes)
    assert "light-armor" not in indexes and "shields" not in indexes

    all_armor_html = """
    <h1>Test Knight</h1><h2>Class Features</h2>
    <p>Weapon and Armor Proficiency: A test knight is proficient with all martial weapons, all armor, and shields.</p>
    <h2>Advancement</h2>
    """
    p=DetailParser();p.feed(all_armor_html);p.close()
    prof=parse_class_proficiencies(p)
    assert {item["index"] for item in prof["proficiencies"]}=={"martial-weapons","light-armor","medium-armor","heavy-armor","shields"}

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

    compound_variant_html = """
    <h1>Sorcerer/Wizard Variant</h1><p>Base Class Unearthed Arcana (UA), p. 58</p>
    <h2>Class Features</h2>
    <p>All starting gold, skill points, class skills, hit dice, and class features all retained from base classes, sorcerer or Wizard, unless noted.</p>
    """
    p=DetailParser();p.feed(compound_variant_html);p.close()
    compound=parse_class_core(p,{"name":"Sorcerer/Wizard Variant"})
    assert compound.get("inheritsFromOptions")==["Sorcerer","Wizard"]
    assert not compound.get("inheritsFrom"), "plural base classes must not be truncated to a bogus parent"

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

    # An Effect header is geometry/quantity, never a substitute for rules prose.
    geometry_html = long_effect_html.replace(
        "<div>Duration</div>",
        "<div>Effect</div><div>2 ft./level sphere around objects</div><div>Duration</div>",
    )
    p=DetailParser();p.feed(geometry_html);p.close()
    s=parse_spell(p,{"name":"Long Effect"})
    assert s["effectGeometry"] == "2 ft./level sphere around objects"
    assert s.get("effectNeedsSummary") and not s.get("effect")
    assert spell_effect_geometry(["Effect: One sphere", "Description", "Rules."]) == "One sphere"
    assert spell_effect_geometry(["Effect", "", "Duration", "1 round", "Description"]) == ""
    assert spell_effect_geometry(["Description", "Effect", "A prose subheading."]) == ""
    assert spell_effect_geometry(["Area", "20-ft. radius", "Description", "Rules."]) == ""

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

    savage_enlarge_rebuilt_html = """
    <h1>Improved Enlarge</h1><p>Savage Species (SS), p. 67</p>
    <div>School</div><div>Transmutation</div><div>Casting Time</div><div>1 full round</div>
    <div>Components</div><div>V, S, M</div><div>Range</div><div>Touch</div>
    <div>Target</div><div>One humanoid creature</div><div>Duration</div><div>10 minutes/level</div>
    <div>Saving Throw</div><div>Fortitude negates</div><div>Spell Resistance</div><div>Yes</div>
    <div>Classes</div><div>Sorcerer 5 Wizard 5</div>
    <h2>Description</h2><p>This rebuilt rendering incorrectly expands the later enlarge person mechanics.</p>
    """
    p=DetailParser();p.feed(savage_enlarge_rebuilt_html);p.close()
    legacy_size=parse_spell(p,{"name":"Improved Enlarge","id":"spells/improved-enlarge-3231"})
    assert legacy_size["casting_time"]=="1 action"
    assert legacy_size["target"]=="One creature, or one object of up to 10 cu. ft. per level in volume"
    assert legacy_size["sourceEdition"]=="3.0" and legacy_size["sourcePage"]==67
    assert legacy_size["sourceRepairMarker"]=="verified-savage-species-3e-size-spell-inheritance"

    savage_reduce_rebuilt_html = savage_enlarge_rebuilt_html.replace(
        "Improved Enlarge","Improved Reduce"
    ).replace(
        "This rebuilt rendering incorrectly expands the later enlarge person mechanics.",
        "This rebuilt rendering incorrectly expands the later reduce person mechanics.",
    )
    p=DetailParser();p.feed(savage_reduce_rebuilt_html);p.close()
    legacy_size=parse_spell(p,{"name":"Improved Reduce","id":"spells/improved-reduce-3232"})
    assert legacy_size["casting_time"]=="1 action"
    assert legacy_size["target"]=="One creature or object of up to 10 cu. ft./caster level"
    assert legacy_size["savingThrow"]=="Fortitude negates (object)"
    assert legacy_size["spellResistance"]=="Yes (object)"
    assert legacy_size["sourceEdition"]=="3.0" and legacy_size["sourcePage"]==67

    storm_elemental_fury_damaged_html = """
    <h1>Storm of Elemental Fury</h1><p>Complete Divine (CDiv), p. 182</p>
    <div>School</div><div>Conjuration (Summoning)</div><div>Casting Time</div><div>1 full round</div>
    <div>Components</div><div>V, S</div><div>Range</div><div>Long (400 ft. + 40 ft./level)</div>
    <div>Effect</div><div>40-ft.-radius storm cloud, 200 feet above the ground</div>
    <div>Duration</div><div>Concentration (maximum 4 rounds) (D)</div>
    <div>Saving Throw</div><div>See text</div><div>Spell Resistance</div><div>Yes</div>
    <div>Classes</div><div>Druid 8</div>
    <h2>Description</h2><p>When created, the storm of elemental fury buffets the area immediately below it with a whirling windstorm that functions as described on pages 94-95 of the Concentration check against a DC equal to the storm of elemental fury's save DC + the level of the spell the caster is trying to cast.</p>
    """
    p=DetailParser();p.feed(storm_elemental_fury_damaged_html);p.close()
    storm_fixed=parse_spell(p,{"name":"Storm of Elemental Fury","id":"spells/storm-of-elemental-fury-663"})
    assert storm_fixed.get("sourceIncomplete")
    assert storm_fixed.get("sourceIncompleteMarker")=="truncated-storm-elemental-fury-windstorm-source"
    assert storm_fixed.get("sourceIncompleteResolved")
    assert storm_fixed.get("supplementVerified")
    assert "siege-weapon attacks take a -4 penalty" in storm_fixed.get("effectSummary","").casefold()
    assert "15d6" not in storm_fixed.get("effectSummary",""), "do not import the later Spell Compendium damage cap"

    repair_batch_cases = [
        (
            "spells/golden-barding-4555",
            "Golden Barding",
            "Spell Compendium (SpC), p. 106",
            "A spectral suit of armor appears around your special mount. 2nd—3rd: Scale mail barding ( 4 armor bonus). 4th—5th: Chainmail barding (+5 armor bonus).",
            "corrupt-golden-barding-bonus-sign",
            ("scale mail (+4 armor", "magic vestment"),
        ),
        (
            "spells/golden-barding-646",
            "Golden Barding",
            "Complete Divine (CDiv), p. 167",
            "A suit of shining golden armor appears. 2nd-3rd: Scale mail barding ( 4 armor bonus). 4th-5th: Chainmail barding (+5 armor bonus).",
            "corrupt-golden-barding-bonus-sign",
            ("scale mail (+4 armor", "incorporeal"),
        ),
        (
            "spells/jade-strike-2073",
            "Jade Strike",
            "Oriental Adventures (OA), p. 109",
            "A blinded creature moves at half speed, and suffers a 4 penalty on most Strength and Dexterity-based skills.",
            "corrupt-jade-strike-penalty-sign",
            ("-4 penalty", "1d8"),
        ),
        (
            "spells/scatterspray-3806",
            "Scatterspray",
            "Dragon Compendium, p. 116",
            "Hard or sharp objects scatter outward; creatures in the burst take ld8 points of damage.",
            "corrupt-scatterspray-dice-notation",
            ("1d8", "reflex"),
        ),
        (
            "spells/talons-5021",
            "Talons",
            "Dragonlance Campaign Setting, p. 108",
            "You can make a claw attack with yout other hand as a secondary attack. You are considered arms.",
            "corrupt-talons-source",
            ("considered armed", "-5"),
        ),
    ]
    for record_id, spell_name, source_line, damaged_text, marker, expected_fragments in repair_batch_cases:
        damaged_html = f"""
        <h1>{spell_name}</h1><p>{source_line}</p>
        <div>School</div><div>Transmutation</div><div>Casting Time</div><div>1 standard action</div>
        <div>Components</div><div>V, S</div><div>Range</div><div>Close</div>
        <div>Duration</div><div>1 round/level</div><div>Saving Throw</div><div>See text</div>
        <div>Spell Resistance</div><div>Yes</div><div>Classes</div><div>Wizard 4</div>
        <h2>Description</h2><p>{damaged_text}</p>
        """
        p=DetailParser();p.feed(damaged_html);p.close()
        repaired=parse_spell(p,{"name":spell_name,"id":record_id})
        assert repaired.get("sourceIncomplete"), record_id
        assert repaired.get("sourceIncompleteMarker")==marker, record_id
        assert repaired.get("sourceIncompleteResolved"), record_id
        assert repaired.get("supplementVerified"), record_id
        summary=repaired.get("effectSummary","").casefold()
        for fragment in expected_fragments:
            assert fragment.casefold() in summary, (record_id, fragment, summary)

    repair_batch_cases_2 = [
        (
            "spells/hidden-ward-4759",
            "Hidden Ward",
            "Magic of Eberron (MoE), p. 96",
            "The DM should make this roll in secret to prevent subicion by the players. Casting this spell on a magic trap increases the Search DC by one-half you caster level (maximum +5).",
            "garbled-hidden-ward-source",
            ("dc 10 + your caster level", "maximum +5", "one day per level"),
        ),
        (
            "spells/last-judgment-90",
            "Last Judgment",
            "Book of Exalted Deeds (BE), p. 102",
            "Creatures that succeed nevertheless take 3d6 points of temporary Wisdom damage. This spell affects only humanoids, monstrous humanoids, and resurrection is cast.",
            "truncated-last-judgment-source",
            ("giants of evil alignment", "true resurrection", "lower planes"),
        ),
        (
            "spells/nether-trail-142",
            "Nether Trail",
            "Book of Vile Darkness (BV), p. 100",
            "The caster creates a handful of invisible, nigh-intangible powder. The caster can sprinkle this powder in a trail on the ground. Evil outsider must make its saving throw first.",
            "truncated-nether-trail-source",
            ("within 10 feet", "another saving throw", "standard action"),
        ),
        (
            "spells/nightstalkers-transformation-428",
            "Nightstalker's Transformation",
            "Complete Adventurer (CAd), p. 158",
            "You gain a +4 enhancement bonus to Dexterity, a +3 luck bonus to Armor Class, a +5 luck bonus on Reflex saving throws, and weapon proficiencies. You also gain the cat’s grace, which you drink.",
            "truncated-nightstalkers-transformation-source",
            ("weapon finesse", "extra 3d6", "spell activation"),
        ),
        (
            "spells/nystuls-magic-aura-2688",
            "Nystul's Magic Aura",
            "Player's Handbook v.3.5 (PH), p. 257",
            "You could make an ordinary sword register as a +2 vorpal sword or make a +2 identify cast on it or is similarly examined, the examiner recognizes that the aura is false.",
            "garbled-nystuls-magic-aura-source",
            ("+2 vorpal sword", "+1 sword", "will save"),
        ),
    ]
    for record_id, spell_name, source_line, damaged_text, marker, expected_fragments in repair_batch_cases_2:
        damaged_html = f"""
        <h1>{spell_name}</h1><p>{source_line}</p>
        <div>School</div><div>Illusion</div><div>Casting Time</div><div>1 standard action</div>
        <div>Components</div><div>V, S</div><div>Range</div><div>Touch</div>
        <div>Duration</div><div>1 round/level</div><div>Saving Throw</div><div>See text</div>
        <div>Spell Resistance</div><div>Yes</div><div>Classes</div><div>Wizard 5</div>
        <h2>Description</h2><p>{damaged_text}</p>
        """
        p=DetailParser();p.feed(damaged_html);p.close()
        repaired=parse_spell(p,{"name":spell_name,"id":record_id})
        assert repaired.get("sourceIncomplete"), record_id
        assert repaired.get("sourceIncompleteMarker")==marker, record_id
        assert repaired.get("sourceIncompleteResolved"), record_id
        assert repaired.get("supplementVerified"), record_id
        summary=repaired.get("effectSummary","").casefold()
        for fragment in expected_fragments:
            assert fragment.casefold() in summary, (record_id, fragment, summary)

    repair_batch_cases_3 = [
        (
            "spells/invoke-the-cerulean-sign-1539",
            "Invoke the Cerulean Sign",
            "Lords of Madness (LoM), p. 212",
            "Any aberration within the area must make a Fortitude saving throw or suffer the following ill effects. Closer aberrations are affected first. Each effect lasts for 1 round. Once a creature recovers from an effect, it moves up one level on the table.",
            "omitted-cerulean-sign-effect-table",
            ("combined total hit dice", "stunned", "fully recovered"),
            ("aberration hit dice", "caster level +10", "caster level -10", "stunned"),
        ),
        (
            "spells/phantasmal-thief-1006",
            "Phantasmal Thief",
            "Draconomicon (Dr), p. 114",
            "A phantasmal thief has a Hide modifier of +20 and a Move Silently modifier of +20. Even objects in a Improved Disarm feat and a +20 Strength modifier. If a phantasmal thief is used in this way, it disappears after it brings the stolen object to the caster.",
            "truncated-draconomicon-phantasmal-thief-source",
            ("cannot break into locked chests", "bag of holding", "improved disarm"),
            (),
        ),
        (
            "spells/reality-maelstrom-1861",
            "Reality Maelstrom",
            "Manual of the Planes (MP), p. 38",
            "You tear a temporary hole in reality itself that sends creatures to a random plane (see sidebar). The primary area has a 5-foot radius per caster level and the secondary area extends to a 10-foot radius per caster level. A reality maelstrom is a one-way portal.",
            "omitted-reality-maelstrom-random-plane-sidebar",
            ("5-foot radius per caster level", "additional saves each round", "one-way planar tear"),
            ("01-05", "heroic domains of ysgard", "00", "demiplane of the dm's choice"),
        ),
        (
            "spells/reality-maelstrom-4072",
            "Reality Maelstrom",
            "Spell Compendium (SpC), p. 168",
            "You tear a temporary hole in reality itself that sends creatures to a random plane (see sidebar). The primary area is a 20-foot-radius sphere and the secondary area extends from 20 feet to 40 feet. A reality maelstrom is a one-way portal.",
            "omitted-reality-maelstrom-random-plane-sidebar",
            ("20-foot-radius sphere", "50 pounds or less", "one-way planar tear"),
            ("01-05", "heroic domains of ysgard", "100", "demiplane of dm"),
        ),
        (
            "spells/spell-matrix-lesser-4207",
            "Spell Matrix, Lesser",
            "Spell Compendium (SpC), p. 199",
            "You prepare a magical matrix that allows you to store one of your spells. Only a spell that can be altered by the antimagic field, the duration of the matrix is interrupted, but the spell does not activate.",
            "truncated-lesser-spell-matrix-source",
            ("up to 3rd level", "quicken spell", "swift action", "1d6"),
            (),
        ),
    ]
    for record_id, spell_name, source_line, damaged_text, marker, expected_fragments, expected_table_fragments in repair_batch_cases_3:
        damaged_html = f"""
        <h1>{spell_name}</h1><p>{source_line}</p>
        <div>School</div><div>Evocation</div><div>Casting Time</div><div>1 standard action</div>
        <div>Components</div><div>V, S</div><div>Range</div><div>Medium</div>
        <div>Duration</div><div>1 round</div><div>Saving Throw</div><div>See text</div>
        <div>Spell Resistance</div><div>Yes</div><div>Classes</div><div>Wizard 9</div>
        <h2>Description</h2><p>{damaged_text}</p>
        """
        p=DetailParser();p.feed(damaged_html);p.close()
        repaired=parse_spell(p,{"name":spell_name,"id":record_id})
        assert repaired.get("sourceIncomplete"), record_id
        assert repaired.get("sourceIncompleteMarker")==marker, record_id
        assert repaired.get("sourceIncompleteResolved"), record_id
        assert repaired.get("supplementVerified"), record_id
        summary=repaired.get("effectSummary","").casefold()
        for fragment in expected_fragments:
            assert fragment.casefold() in summary, (record_id, fragment, summary)
        flattened_tables=clean(" ".join(
            str(cell)
            for table in (repaired.get("tables") or [])
            for row in table
            for cell in row
        )).casefold()
        for fragment in expected_table_fragments:
            assert fragment.casefold() in flattened_tables, (record_id, fragment, flattened_tables)

    repair_batch_cases_4 = [
        (
            "spells/shadow-well-4996",
            "Shadow Well",
            "Into the Dragon's Lair (DL), p. 95",
            "The victim flees in a random direction for that time. Beings unable to flee cove. Spells and abilities that move a creature within a plane do not help a creature escape, although plane shift can (but the target is still afraid upo leaving).",
            "garbled-shadow-well-source",
            ("cowers", "plane shift", "afraid upon leaving"),
            (),
        ),
        (
            "spells/share-animals-mind-5015",
            "Share Animal's Mind",
            "Dragonlance Campaign Setting (DLCS), p. 111",
            "While you control the animal, you are limited to a single move action every round in your own body. When in doubt whether something is an animal as defined by the spell, check Animal ). Focus: A piece of clay molded to approximate the chosen animal's form.",
            "truncated-share-animals-mind-animal-definition",
            ("monster manual", "creature type must be animal", "one move action each round"),
            (),
        ),
        (
            "spells/skull-eyes-2292",
            "Skull Eyes",
            "Player's Guide to Faerûn (PG), p. 111",
            "You gain a gaze attack out to close range. Depending on the foe's Hit Dice, the gaze attack may have either of two effects, as follows. While this spell is in effect, your eyes are black and have skull-shaped irises.",
            "missing-skull-eyes-effects",
            ("beginning of each of its turns", "actively gaze", "charmed", "confused"),
            ("equal to or greater than caster level", "less than caster level", "charmed", "confused"),
        ),
        (
            "spells/spiritual-weapon-2651",
            "Spiritual Weapon",
            "Player's Handbook v.3.5 (PH), p. 283",
            "The weapon always strikes from your direction. It does not get a flanking bonus or help a combatant get one. Your feats (such as disintegrate, a sphere of annihilation, or a rod of cancellation affects it. A spiritual weapon's AC against touch attacks is 12.",
            "truncated-spiritual-weapon-direction-rules",
            ("move action", "returns to you and hovers", "physical attacks cannot harm it", "touch ac is 12"),
            (),
        ),
        (
            "spells/spore-field-918",
            "Spore Field",
            "Complete Scoundrel (CS), p. 104",
            "The area affected by this spell becomes difficult terrain. Entering a square of difficult terrain costs 2 squares of movement, and creatures cannot charge or run through such squares ( Move Silently checks by 2. In addition, any creature that enters a square affected by this spell bursts several mushrooms.",
            "truncated-spore-field-terrain-rules",
            ("balance and tumble", "move silently", "sickened for 1 round", "inhaled poison"),
            (),
        ),
    ]
    for record_id, spell_name, source_line, damaged_text, marker, expected_fragments, expected_table_fragments in repair_batch_cases_4:
        damaged_html = f"""
        <h1>{spell_name}</h1><p>{source_line}</p>
        <div>School</div><div>Transmutation</div><div>Casting Time</div><div>1 standard action</div>
        <div>Components</div><div>V, S</div><div>Range</div><div>Medium</div>
        <div>Duration</div><div>1 round/level</div><div>Saving Throw</div><div>See text</div>
        <div>Spell Resistance</div><div>Yes</div><div>Classes</div><div>Wizard 4</div>
        <h2>Description</h2><p>{damaged_text}</p>
        """
        p=DetailParser();p.feed(damaged_html);p.close()
        repaired=parse_spell(p,{"name":spell_name,"id":record_id})
        assert repaired.get("sourceIncomplete"), record_id
        assert repaired.get("sourceIncompleteMarker")==marker, record_id
        assert repaired.get("sourceIncompleteResolved"), record_id
        assert repaired.get("supplementVerified"), record_id
        summary=repaired.get("effectSummary","").casefold()
        for fragment in expected_fragments:
            assert fragment.casefold() in summary, (record_id, fragment, summary)
        flattened_tables=clean(" ".join(
            str(cell)
            for table in (repaired.get("tables") or [])
            for row in table
            for cell in row
        )).casefold()
        for fragment in expected_table_fragments:
            assert fragment.casefold() in flattened_tables, (record_id, fragment, flattened_tables)

    repair_batch_cases_5 = [
        (
            "spells/threesteel-1118",
            "Threesteel",
            "Dragons of Faerûn (DoF), p. 119",
            "You touch a weapon, causing it to coalesce into three exact duplicates. Make a ranged attack roll for each weapon using your ranged attack bonus or the ranged attack bonus of a fighter of your caster level, whichever is higher. Each duplicate that hits deals damage as if you had struck the target with the weapon in melee (including any special effects such as bane, smite evil, critical hits, sneak attack, sorcerer so he could use it as an unexpected advantage during the frequent assassination attempts launched by his estranged kinfolk.",
            "truncated-threesteel-source",
            ("fighter of your caster level", "weapon focus", "strength bonus does not apply", "destroys the original weapon"),
            (),
        ),
        (
            "spells/unfailing-endurance-978",
            "Unfailing Endurance",
            "Defenders of the Faith: A Guidebook to Clerics and Paladins (DF), p. 86",
            "You can render living creatures virtually immune to fatigue or exhaustion. You must touch each creature to be affected as you cast the spell. The benefits include: Endurance: This feat confers a +4 bonus on any check made for performing a physical action that extends over a period of time (running, swimming, holding breath, and so on). Morale Bonus: Subjects gain an additional +4 morale bonus that stacks with the bonus from the Dungeon Master’S Guide ).",
            "truncated-unfailing-endurance-source",
            ("saving throws against spells", "12 hours", "16 hours", "fatigued instead of exhausted"),
            (),
        ),
        (
            "spells/words-of-the-kami-2081",
            "Words of the Kami",
            "Oriental Adventures (OA), p. 120",
            "To utter the holy words of the kami is to bring forth magic of awesome power. Creatures with the Shadowlands subtype or with a Taint score suffer the following ill effects: The effects are cumulative. Deafened: The creature is deafened for 1d4 rounds. A deafened creature automatically fails Listen checks, suffers a -4 penalty on initiative, and has a 20% chance to miscast and lose any spell with a verbal component. Blinded: The creature is blinded for 2d4 rounds, moves at half speed, and suffers a 4 penalty on most Strength and Dexterity-based skill checks. Paralyzed: The creature is paralyzed and helpless for 1d10 minutes. Killed: Living creatures die. Undead creatures are destroyed.",
            "corrupt-words-of-the-kami-effects",
            ("fewer than 12", "20% chance", "-4 penalty", "1d10 minutes"),
            ("12 or more", "less than 12", "less than 8", "less than 4"),
        ),
    ]
    for record_id, spell_name, source_line, damaged_text, marker, expected_fragments, expected_table_fragments in repair_batch_cases_5:
        damaged_html = f"""
        <h1>{spell_name}</h1><p>{source_line}</p>
        <div>School</div><div>Transmutation</div><div>Casting Time</div><div>1 standard action</div>
        <div>Components</div><div>V, S</div><div>Range</div><div>Touch</div>
        <div>Duration</div><div>1 round/level</div><div>Saving Throw</div><div>See text</div>
        <div>Spell Resistance</div><div>Yes</div><div>Classes</div><div>Wizard 4</div>
        <h2>Description</h2><p>{damaged_text}</p>
        """
        p=DetailParser();p.feed(damaged_html);p.close()
        repaired=parse_spell(p,{"name":spell_name,"id":record_id})
        assert repaired.get("sourceIncomplete"), record_id
        assert repaired.get("sourceIncompleteMarker")==marker, record_id
        assert repaired.get("sourceIncompleteResolved"), record_id
        assert repaired.get("supplementVerified"), record_id
        summary=repaired.get("effectSummary","").casefold()
        for fragment in expected_fragments:
            assert fragment.casefold() in summary, (record_id, fragment, summary)
        flattened_tables=clean(" ".join(
            str(cell)
            for table in (repaired.get("tables") or [])
            for row in table
            for cell in row
        )).casefold()
        for fragment in expected_table_fragments:
            assert fragment.casefold() in flattened_tables, (record_id, fragment, flattened_tables)

    repair_batch_cases_6 = [
        (
            "spells/locate-creature-2505",
            "Locate Creature",
            "Player's Handbook v.3.5 (PH), p. 249",
            "This spell functions like locate object, except this spell locates a known or familiar creature. You slowly turn and sense the creature's direction. The spell can locate a creature of a specific kind (such as a polymorph spells. Material Component: A bit of fur from a bloodhound.",
            "truncated-locate-creature-source",
            ("specific kind", "broad creature type", "within 30 feet", "running water", "mislead"),
            (),
        ),
        (
            "spells/investiture-of-the-malebranche-1183",
            "Investiture of the Malebranche",
            "Fiendish Codex II: Tyrants of the Nine Hells (FC2), p. 104",
            "You infuse a creature with the raw power of a malebranche. While under the effect of this spell, the subject deals extra damage whenever it successfully hits with a charge attack, depending on its size. In addition, the subject gains resistance to fire 10. Magic weapons with the evil outsider bane special ability have full effect against the subject. After the spell expires, the subject is fatigued for 1 minute.",
            "omitted-malebranche-size-damage-table",
            ("charge attack", "fire resistance 10", "evil outsider bane", "fatigued for 1 minute"),
            ("tiny or smaller", "small", "1d6", "medium", "2d6", "colossal", "8d6"),
        ),
        (
            "spells/mudslide-3335",
            "Mudslide",
            "Stormwrack (Sto), p. 119",
            "You create a landslide of mud and water. Creatures within the spell's effect must make a Reflex save. Those who fail take 8d6 points of damage and are buried (see Avalanches on page 90 of the transmute mud to rock spell hardens the slide into stone, trapping any creatures still within.",
            "truncated-stormwrack-mudslide-source",
            ("8d6", "3d6", "8d8", "4 squares", "2 to 3 days"),
            (),
        ),
        (
            "spells/node-genesis-3489",
            "Node Genesis",
            "Underdark (Und), p. 59",
            "The newly generated earth node retains its Class 1 status for one year. Thereafter, its diameter increases at a rate of 20 feet per year. When the node's diameter reaches the low end of the range for the next higher class (see Table 4-1), its class increases by +1. A Class 1 node becomes Class 2 at 40 feet and Class 3 at 120 feet. XP Cost: 5,000 XP.",
            "external-node-genesis-class-table",
            ("20 feet in diameter per year", "40 feet", "120 feet", "5,000 xp"),
            ("class", "node dc", "layer width", "node diameter", "6+", "35+", "600 to 2,400 feet"),
        ),
        (
            "spells/otyugh-swarm-5011",
            "Otyugh Swarm",
            "Dragonlance Campaign Setting (DCS), p. 109",
            "Otyugh swarm creates 3d4 ordinary otyughs or 1d3+1 Huge otyughs with 15 HD. They remain with you for seven days unless dismissed, or seven months for guard duty. You must create the otyughs in an area containing at least 6,000 ounds of sewage, refuse, or offal. Material Component: Ruby dust worth 1,000 gp.",
            "corrupt-dragonlance-otyugh-swarm-pounds",
            ("6,000 pounds", "seven months", "ruby dust worth 1,000 gp", "slough back"),
            (),
        ),
    ]
    for record_id, spell_name, source_line, damaged_text, marker, expected_fragments, expected_table_fragments in repair_batch_cases_6:
        damaged_html = f"""
        <h1>{spell_name}</h1><p>{source_line}</p>
        <div>School</div><div>Conjuration</div><div>Casting Time</div><div>1 standard action</div>
        <div>Components</div><div>V, S, M</div><div>Range</div><div>Medium</div>
        <div>Duration</div><div>1 minute/level</div><div>Saving Throw</div><div>See text</div>
        <div>Spell Resistance</div><div>No</div><div>Classes</div><div>Wizard 6</div>
        <h2>Description</h2><p>{damaged_text}</p>
        """
        p=DetailParser();p.feed(damaged_html);p.close()
        repaired=parse_spell(p,{"name":spell_name,"id":record_id})
        assert repaired.get("sourceIncomplete"), record_id
        assert repaired.get("sourceIncompleteMarker")==marker, record_id
        assert repaired.get("sourceIncompleteResolved"), record_id
        assert repaired.get("supplementVerified"), record_id
        summary=repaired.get("effectSummary","").casefold()
        for fragment in expected_fragments:
            assert fragment.casefold() in summary, (record_id, fragment, summary)
        flattened_tables=clean(" ".join(
            str(cell)
            for table in (repaired.get("tables") or [])
            for row in table
            for cell in row
        )).casefold()
        for fragment in expected_table_fragments:
            assert fragment.casefold() in flattened_tables, (record_id, fragment, flattened_tables)

    repair_batch_cases_7 = [
        (
            "spells/form-of-the-threefold-beast-875",
            "Form of the Threefold Beast",
            "Complete Mage (CM), p. 104",
            "Your arms and legs become powerfully muscled and grow sharp claws as your body hunches over on all fours. Two additional monstrous heads sprout from your shoulders, and two batlike wings stretch out to the sky. You take the form of a chimera ( Polymorph Subschool sidebar on page 91 for more details.",
            "truncated-threefold-beast-chimera-source",
            ("form of a chimera", "30 temporary hit points", "retain your alignment", "own hit points", "gear melds", "slain or rendered unconscious"),
            (),
        ),
        (
            "spells/shape-of-the-hellspawned-stalker-883",
            "Shape of the Hellspawned Stalker",
            "Complete Mage (CM), p. 117",
            "Rust-red fur sprouts from your skin, and your back hunches over until you stand on four clawed feet. Tendrils of black smoke curl from your fanged mouth. You take the form of a hell hound ( Polymorph Subschool sidebar on page 91 for more details.",
            "truncated-hellspawned-stalker-source",
            ("form of a hell hound", "10 temporary hit points", "retain your alignment", "own hit points", "gear melds", "slain or rendered unconscious"),
            (),
        ),
        (
            "spells/prismatic-deluge-831",
            "Prismatic Deluge",
            "Complete Mage (CM), p. 113",
            "In a blinding shower of light, you call an enormous, painfully bright rainbow from the heavens. This spell produces a column of colors resembling the end of a rainbow. Every creature in the area is affected as though by the prismatic spray spell ( prismatic spray table to see what color affects which target.",
            "truncated-prismatic-deluge-source",
            ("8 hit dice or fewer", "blinded for 2d4 rounds", "20 fire damage", "1d6 constitution damage", "two rays"),
            ("red", "20 fire damage", "green", "1d6 constitution damage", "violet", "another plane", "two rays"),
        ),
        (
            "spells/seed-of-undeath-860",
            "Seed of Undeath",
            "Complete Mage (CM), p. 116",
            "The subject's face briefly takes on a gaunt, pale look and a death's-head rictus before returning to normal. You plant a kernel of negative energy in a subject. Should the subject die before the spell expires, it rises as a zombie 1 round later (as per the animate dead spell), as long as a sufficient corpse remains. Any undead created in this manner are automatically under your control. At any given time, you can have a number of HD worth of undead animated through seed of undeath equal to your own HD, and they count against the maximum number of HD worth of animate dead ). Material Component: A black onyx gem worth 25 gp per HD of the subject.",
            "truncated-seed-of-undeath-control-cap",
            ("rises as a zombie 1 round later", "automatically under your control", "cannot exceed your own hit dice", "normal maximum hit dice", "25 gp per hit die"),
            (),
        ),
    ]
    for record_id, spell_name, source_line, damaged_text, marker, expected_fragments, expected_table_fragments in repair_batch_cases_7:
        damaged_html = f"""
        <h1>{spell_name}</h1><p>{source_line}</p>
        <div>School</div><div>Transmutation</div><div>Casting Time</div><div>1 swift action</div>
        <div>Components</div><div>V, S</div><div>Range</div><div>Personal</div>
        <div>Duration</div><div>1 round/level (D)</div><div>Saving Throw</div><div>None</div>
        <div>Spell Resistance</div><div>No</div><div>Classes</div><div>Wizard 5</div>
        <h2>Description</h2><p>{damaged_text}</p>
        """
        p=DetailParser();p.feed(damaged_html);p.close()
        repaired=parse_spell(p,{"name":spell_name,"id":record_id})
        assert repaired.get("sourceIncomplete"), record_id
        assert repaired.get("sourceIncompleteMarker")==marker, record_id
        assert repaired.get("sourceIncompleteResolved"), record_id
        assert repaired.get("supplementVerified"), record_id
        summary=repaired.get("effectSummary","").casefold()
        for fragment in expected_fragments:
            assert fragment.casefold() in summary, (record_id, fragment, summary)
        flattened_tables=clean(" ".join(
            str(cell)
            for table in (repaired.get("tables") or [])
            for row in table
            for cell in row
        )).casefold()
        for fragment in expected_table_fragments:
            assert fragment.casefold() in flattened_tables, (record_id, fragment, flattened_tables)

    repair_batch_cases_8 = [
        (
            "spells/halasters-light-step-351",
            "Halaster's Light Step",
            "City of Splendors: Waterdeep (CoS), p. 154",
            "As fly, except Halaster's light step provides a maximum speed of 30 feet (20 feet if the subject wears medium or heavy armor). Additionally, the subject cannot ascend or descend vertically unless hovering 1 foot or less above terrain that ascends or descends at an angle of less than 45 degrees. It also adds a +15 circumstance bonus on Climb checks, a +10 circumstance bonus on Move Silently checks (which does not stack with the bonus provided by fly .",
            "truncated-halasters-light-step-source",
            ("maximum speed is 30 feet", "+15 circumstance bonus", "+10 circumstance bonus", "boots of elvenkind", "cannot fall", "slow-speed fly"),
            (),
        ),
        (
            "spells/plague-rats-937",
            "Plague of Rats",
            "Defenders of the Faith: A Guidebook to Clerics and Paladins (DF), p. 92",
            "A swarm of dire rats viciously attacks all other creatures within a 20-foot spread, inflicting damage and spreading filth fever (see page 74 of the stinking cloud spell and similar area or effect spells disperse a swarm immediately. As a move-equivalent action, you can direct the swarm to move up to 40 feet per round.",
            "truncated-defenders-plague-of-rats-source",
            ("1d4 damage per caster level", "dc 15 + your intelligence bonus", "-4 penalty", "8 damage per caster level", "move up to 40 feet per round"),
            (),
        ),
        (
            "spells/wake-trailing-3342",
            "Wake Trailing",
            "Stormwrack (Sto), p. 124",
            "You are able to track a vessel over open water by following flotsam and other signs of a ship's recent presence. These signs are subtle, but while the spell is active you can find them on a Survival check as though tracking a Huge, Gargantuan, or Colossal creature over soft ground. The following modifiers are used in place of those given on page 101 of the Player's Handbook. The caster must have the Track feat to use this spell. Material Component: A bit of driftwood wrapped with red thread.",
            "omitted-wake-trailing-survival-table",
            ("track a vessel over open water", "track feat", "distinguishing detail", "driftwood wrapped with red thread"),
            ("every 4 hours", "+1", "vigorous currents", "+2", "overcast or moonless night", "+6"),
        ),
        (
            "spells/hound-of-doom-924",
            "Hound of Doom",
            "Complete Warrior (CW), p. 117",
            "You shape the essence of the Plane of Shadow to create a powerful doglike companion. The hound of doom has the statistics of a dire wolf (see page 65 of the Handle Animal skill (see page 74 of the Player's Handbook). If its hit points are reduced to 0, it is destroyed.",
            "truncated-hound-of-doom-adjustments",
            ("deflection bonus to ac equal to your charisma bonus", "full normal hit points", "base attack bonus", "move action", "magical beast", "instantly dispels"),
            (),
        ),
    ]
    for record_id, spell_name, source_line, damaged_text, marker, expected_fragments, expected_table_fragments in repair_batch_cases_8:
        damaged_html = f"""
        <h1>{spell_name}</h1><p>{source_line}</p>
        <div>School</div><div>Transmutation</div><div>Casting Time</div><div>1 standard action</div>
        <div>Components</div><div>V, S</div><div>Range</div><div>Close</div>
        <div>Duration</div><div>1 round/level</div><div>Saving Throw</div><div>None</div>
        <div>Spell Resistance</div><div>No</div><div>Classes</div><div>Wizard 4</div>
        <h2>Description</h2><p>{damaged_text}</p>
        """
        p=DetailParser();p.feed(damaged_html);p.close()
        repaired=parse_spell(p,{"name":spell_name,"id":record_id})
        assert repaired.get("sourceIncomplete"), record_id
        assert repaired.get("sourceIncompleteMarker")==marker, record_id
        assert repaired.get("sourceIncompleteResolved"), record_id
        assert repaired.get("supplementVerified"), record_id
        summary=repaired.get("effectSummary","").casefold()
        for fragment in expected_fragments:
            assert fragment.casefold() in summary, (record_id, fragment, summary)
        flattened_tables=clean(" ".join(
            str(cell)
            for table in (repaired.get("tables") or [])
            for row in table
            for cell in row
        )).casefold()
        for fragment in expected_table_fragments:
            assert fragment.casefold() in flattened_tables, (record_id, fragment, flattened_tables)

    repair_header_mismatch_html = """
    <h1>Repair Moderate Damage</h1><p>Miniatures Handbook (MH), p. 38</p>
    <div>School</div><div>Transmutation</div><div>Casting Time</div><div>1 standard action</div>
    <div>Components</div><div>V, S, F</div><div>Range</div><div>Touch</div>
    <div>Target</div><div>One construct</div><div>Duration</div><div>Instantaneous</div>
    <div>Classes</div><div>Sorcerer 2Wizard 2</div>
    <h2>Description</h2><p>As repair light damage, except repair moderate damage repairs 2d8 points of damage + 1 point per caster level (up to +10).</p>
    """
    p=DetailParser();p.feed(repair_header_mismatch_html);p.close()
    repair_fixed=parse_spell(p,{"name":"Repair Moderate Damage","id":"spells/repair-moderate-damage-1996"})
    assert repair_fixed.get("components")==["V","S"]
    assert repair_fixed.get("sourceRepairApplied")
    assert repair_fixed.get("sourceRepairMarker")=="verified-miniatures-handbook-repair-components"
    assert not repair_fixed.get("sourceIncomplete")

    repair_header_verified_html = repair_header_mismatch_html.replace("V, S, F", "V, S")
    p=DetailParser();p.feed(repair_header_verified_html);p.close()
    repair_good=parse_spell(p,{"name":"Repair Moderate Damage","id":"spells/repair-moderate-damage-1996"})
    assert repair_good.get("components")==["V","S"]
    assert not repair_good.get("sourceIncomplete")

    identical_reference_html = """
    <h1>Identical Reference Effect</h1><p>Example Book (EX), p. 4</p>
    <div>School</div><div>Abjuration</div><div>Casting Time</div><div>1 action</div>
    <div>Components</div><div>V, S</div><div>Range</div><div>Touch</div>
    <div>Duration</div><div>1 minute</div><div>Classes</div><div>Wizard 2</div>
    <h2>Description</h2><p>This spell works identically to arcane lock, except its DC is 5 higher.</p>
    """
    p=DetailParser();p.feed(identical_reference_html);p.close()
    s=parse_spell(p,{"name":"Identical Reference Effect"})
    assert s.get("effectReferenceDependent")
    assert s.get("effectNeedsSummary") and not s.get("effect")

    fog_does_reference_html = """
    <h1>Fog Does Reference</h1><p>Example Book (EX), p. 4</p>
    <div>School</div><div>Conjuration</div><div>Casting Time</div><div>1 action</div>
    <div>Components</div><div>V, S</div><div>Range</div><div>Medium</div>
    <div>Duration</div><div>1 minute</div><div>Classes</div><div>Wizard 2</div>
    <h2>Description</h2><p>The smoke obscures all sight as a fog cloud does.</p>
    """
    p=DetailParser();p.feed(fog_does_reference_html);p.close()
    s=parse_spell(p,{"name":"Fog Does Reference"})
    assert s.get("effectReferenceDependent")
    assert s.get("effectNeedsSummary") and not s.get("effect")

    fog_with_reference_html = """
    <h1>Fog With Reference</h1><p>Example Book (EX), p. 4</p>
    <div>School</div><div>Conjuration</div><div>Casting Time</div><div>1 action</div>
    <div>Components</div><div>V, S</div><div>Range</div><div>Medium</div>
    <div>Duration</div><div>1 minute</div><div>Classes</div><div>Wizard 2</div>
    <h2>Description</h2><p>As with fog cloud, wind disperses the smoke.</p>
    """
    p=DetailParser();p.feed(fog_with_reference_html);p.close()
    s=parse_spell(p,{"name":"Fog With Reference"})
    assert s.get("effectReferenceDependent")
    assert s.get("effectNeedsSummary") and not s.get("effect")

    as_if_html = """
    <h1>As If Test</h1><p>Example Book (EX), p. 4</p>
    <div>School</div><div>Abjuration</div><div>Casting Time</div><div>1 action</div>
    <div>Components</div><div>V, S</div><div>Range</div><div>Touch</div>
    <div>Duration</div><div>1 minute</div><div>Classes</div><div>Wizard 2</div>
    <h2>Description</h2><p>The linked effect functions as if cast by you, using your caster level.</p>
    """
    p=DetailParser();p.feed(as_if_html);p.close()
    s=parse_spell(p,{"name":"As If Test"})
    assert not s.get("effectReferenceDependent")
    assert s.get("effect") and not s.get("effectNeedsSummary")

    generic_as_html = """
    <h1>Generic As Test</h1><p>Example Book (EX), p. 5</p>
    <div>School</div><div>Transmutation</div><div>Casting Time</div><div>1 action</div>
    <div>Components</div><div>V, S</div><div>Range</div><div>Touch</div>
    <div>Duration</div><div>1 minute</div><div>Classes</div><div>Wizard 2</div>
    <h2>Description</h2><p>It functions as a splash weapon that can be hurled normally.</p>
    """
    p=DetailParser();p.feed(generic_as_html);p.close()
    s=parse_spell(p,{"name":"Generic As Test"})
    assert not s.get("effectReferenceDependent")
    assert s.get("effect") and not s.get("effectNeedsSummary")

    quantitative_condition_html = """
    <h1>Quantitative Condition</h1><p>Example Book (EX), p. 6</p>
    <div>School</div><div>Transmutation</div><div>Casting Time</div><div>1 action</div>
    <div>Components</div><div>V, S</div><div>Range</div><div>Touch</div>
    <div>Duration</div><div>Instantaneous</div><div>Classes</div><div>Wizard 4</div>
    <h2>Description</h2><p>The spell functions as long as at least 1/4 of the object remains.</p>
    """
    p=DetailParser();p.feed(quantitative_condition_html);p.close()
    s=parse_spell(p,{"name":"Quantitative Condition"})
    assert not s.get("effectReferenceDependent")

    longstrider_reference_html = quantitative_condition_html.replace(
        "functions as long as at least 1/4 of the object remains", "functions as longstrider"
    )
    p=DetailParser();p.feed(longstrider_reference_html);p.close()
    s=parse_spell(p,{"name":"Longstrider Reference"})
    assert s.get("effectReferenceDependent")

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

    long_special = "This repeated special rule remains source-captured but requires a concise review summary. " * 8
    long_normal = "This repeated normal rule remains source-captured but requires a concise review summary. " * 8
    long_feat_html = f"""
    <h1>Long Rule Feat</h1><p>General feat</p><p>Example Source (EX), p. 2</p>
    <div>Benefit</div><div>Source mechanic.</div>
    <div>Normal</div><div>{long_normal}</div>
    <div>Special</div><div>{long_special}</div>
    """
    p=DetailParser();p.feed(long_feat_html);p.close()
    f=parse_feat(p,{"name":"Long Rule Feat","id":"self-test-long-feat-rules"})
    assert f.get("normalNeedsSummary") and f.get("specialNeedsSummary")
    assert "normalRule" not in enrichment_gaps("feats",f)
    assert "specialRule" not in enrichment_gaps("feats",f)

    special_type_only_html = """
    <h1>Spell Mastery</h1><p>Special feat</p><p>Player's Handbook v.3.5 (PH), p. 100</p>
    <div>Prerequisite</div><div>Wizard level 1.</div>
    <div>Benefit</div><div>You can prepare selected known spells without referring to a spellbook.</div>
    <div>Normal</div><div>Without this feat, you normally use a spellbook to prepare your spells.</div>
    <div>Description</div><div>You are intimately familiar with certain spells.</div>
    """
    p=DetailParser();p.feed(special_type_only_html);p.close()
    f=parse_feat(p,{"name":"Spell Mastery","id":"self-test-special-feat-type"})
    assert f.get("featType") == "Special feat"
    assert not f["mechanicsPresence"]["specialLabeled"]
    assert "specialRule" not in enrichment_gaps("feats",f)

    reviewed_fixture={
        "name":"Long Reviewed Feat",
        "benefitSha256":feat_rule_digest(long_special),
        "effectSummary":"Concise reviewed benefit.",
        "normalSha256":feat_rule_digest(long_normal),
        "normalSummary":"Concise reviewed normal rule.",
        "provenance":[{"url":"https://example.invalid","role":"self-test"}],
    }
    saved_cache=_FEAT_RULE_SUMMARY_CACHE
    try:
        globals()["_FEAT_RULE_SUMMARY_CACHE"]={"self-test-reviewed-feat":reviewed_fixture}
        reviewed_details={
            "effectNeedsSummary":True,"effectSourceLength":len(long_special),
            "normalNeedsSummary":True,"normalSourceLength":len(long_normal),
        }
        applied=apply_reviewed_feat_rules(
            {"id":"self-test-reviewed-feat","name":"Long Reviewed Feat"},
            reviewed_details,long_special,long_normal,""
        )
        assert applied["effectSummary"]=="Concise reviewed benefit."
        assert applied["normalSummary"]=="Concise reviewed normal rule."
        assert applied["featRuleReviewVerified"] and set(applied["featRuleReviewFields"])=={"benefit","normal"}
        drift=apply_reviewed_feat_rules(
            {"id":"self-test-reviewed-feat","name":"Long Reviewed Feat"},
            reviewed_details,long_special+" drift",long_normal,""
        )
        assert drift.get("effectNeedsSummary") and "benefit" in drift["featRuleReviewMismatchFields"]
    finally:
        globals()["_FEAT_RULE_SUMMARY_CACHE"]=saved_cache

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
