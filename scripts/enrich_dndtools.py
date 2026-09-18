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
import json
import re
import time
from html.parser import HTMLParser
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
        except (URLError, TimeoutError) as error:
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
    match = re.search(r"(?:(?:Prestige|Base|NPC|Psionic) Class\s+)?([^|]{2,120}?)\s*\(([A-Za-z0-9 .&'-]{1,16})\)\s*(?:,\s*p\.\s*(\d+))?", joined)
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


def parse_class_skills(parser: DetailParser) -> list[str]:
    skills = section(parser.lines, parser.headings, "Class Skills")
    names=[]
    if skills:
        for line in skills[:8]:
            if ":" in line and len(line) > 120:
                continue
            names += re.findall(r"[A-Z][A-Za-z' -]+?(?=[A-Z]|$)", line)
    for table in parser.tables:
        if not table:
            continue
        header=[clean(x).casefold() for x in table[0]]
        if "skill name" in header:
            for row in table[1:]:
                if row and clean(row[0]):
                    names.append(clean(row[0]))
    cleaned=[]
    for name in names:
        value=clean(name)
        if value and value.casefold() not in {"skill name","key ability","trained only","armor check penalty"} and value not in cleaned:
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


def explicit_variant_parent(lines: list[str], entry_name: str) -> str:
    joined=" ".join(lines)
    patterns=[
        r"same hit dice, skills, starting gold, and advancement as (?:a |the )?standard ([A-Za-z ]+?)(?:\s*\(|\s+except|\s+as|\.)",
        r"has all the standard ([A-Za-z ]+?) class features",
        r"standard ([A-Za-z]+) class feature",
    ]
    for pattern in patterns:
        match=re.search(pattern,joined,re.I)
        if match:
            return clean(match.group(1)).title()
    parenthetical=re.search(r"\(([^)]+)\)\s*$",entry_name or "")
    if parenthetical and len(parenthetical.group(1).split())<=2:
        return clean(parenthetical.group(1)).title()
    return ""


def legacy_class_fallback(entry: dict) -> dict:
    url=legacy_class_url(entry)
    raw=fetch_allowed(url,{urlparse(LEGACY_CLASS_BASE).netloc},0.05)
    parser=DetailParser(); parser.feed(raw); parser.close()
    result={"fallbackSourceUrl":url}
    req=parse_requirement_lines(section(parser.lines,parser.headings,"Requirements"))
    if req: result["prerequisites"]=req
    hit=next_value(parser.lines,"Hit die") or next_value(parser.lines,"Hit Die")
    if m:=re.search(r"d\s*(\d+)",hit,re.I): result["hit_die"]=int(m.group(1))
    skill_points=next_value(parser.lines,"Skill points") or next_value(parser.lines,"Skill Points")
    if skill_points: result["skillPoints"]=skill_points
    skills=parse_class_skills(parser)
    if skills: result["classSkills"]=skills
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
    enriched = {
        **source_meta(lines),
        "hit_die": int(m.group(1)) if (m := re.search(r"d\s*(\d+)", next_value(lines, "Hit Die"), re.I)) else None,
        "skillPoints": next_value(lines, "Skill Points"),
        "minBab": next_value(lines, "Min. BAB Req.") or next_value(lines, "Min BAB Req."),
        "prerequisites": parse_requirement_lines(section(lines, parser.headings, "Requirements")),
    }
    lower = " ".join(lines[:20]).casefold()
    if "prestige class" in lower:
        enriched["prestige"] = True

    progression,advancement=parse_progression_table(parser)
    if progression:
        enriched["progression"]=progression
        enriched["advancement"]=advancement

    skills=parse_class_skills(parser)
    if skills:
        enriched["classSkills"]=skills

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
            for key in ("prerequisites","hit_die","skillPoints","classSkills","progression","advancement","inheritsFrom"):
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
    enriched["mechanicsPresence"] = {
        "classFeatures": bool(section(lines, parser.headings, "Class Features")) or bool(fallback_presence.get("classFeatures")),
        "ruleProse": has_rule_prose(lines, entry.get("name","")) or bool(fallback_presence.get("ruleProse"))
    }
    return {k:v for k,v in enriched.items() if v not in (None,"",[],{})}


def parse_feat(parser: DetailParser, entry: dict) -> dict:
    lines = parser.lines
    meta = source_meta(lines)
    category = ""
    for line in lines[:24]:
        folded = clean(line).casefold()
        if len(line) < 100 and re.search(r"\bfeat\b", folded) and not folded.startswith(("back to ","characters ")):
            category = clean(line)
            break
    prereq = next_value(lines, "Prerequisite") or next_value(lines, "Prerequisites")
    if not prereq:
        req = section(lines, parser.headings, "Prerequisite") or section(lines, parser.headings, "Prerequisites")
        prereq = " ".join(req[:4])
    result = {**meta}
    if category:
        result["featType"] = category
    if prereq:
        result["prerequisites"] = [{"kind":"text","label":"Prerequisite","text":prereq}]
    result["mechanicsPresence"] = {
        "benefit": bool(next_value(lines, "Benefit")),
        "description": bool(next_value(lines, "Description")),
        "normal": bool(next_value(lines, "Normal")),
        "special": bool(next_value(lines, "Special")),
        "ruleProse": has_rule_prose(lines, entry.get("name",""))
    }
    return result


def split_class_levels(value: str) -> dict:
    # Rendered source often collapses "Sorcerer 1Wizard 1Warmage 1".
    pairs = re.findall(r"([A-Z][A-Za-z'’ -]*?)\s+(\d)(?=[A-Z]|$)", value)
    return {clean(name): int(level) for name, level in pairs}


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
    if re.search(r"\((?:Strike|Boost|Counter|Stance)\)", school_value, re.I):
        result["isManeuver"]=True
    classes_raw = next_value(lines, "Classes")
    class_levels = split_class_levels(classes_raw)
    if class_levels:
        result["classLevels"] = class_levels
        result["classes"] = list(class_levels)
        result["level"] = min(class_levels.values())
    domains_raw = next_value(lines, "Domains")
    if domains_raw:
        result["domains"] = domains_raw
    descriptors_raw = next_value(lines, "Descriptors")
    if descriptors_raw:
        result["descriptors"] = [clean(x) for x in re.split(r"[,;]", descriptors_raw) if clean(x)]
    result["mechanicsPresence"] = {"ruleProse": has_rule_prose(lines, entry.get("name",""))}
    return {k:v for k,v in result.items() if v not in (None,"",[],{})}


def parse_item(parser: DetailParser, entry: dict) -> dict:
    lines = parser.lines
    result = {**source_meta(lines)}
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
    prereq = next_value(lines, "Prerequisites") or next_value(lines, "Prerequisite")
    if prereq:
        result["prerequisites"] = [{"kind":"text","label":"Prerequisite","text":prereq}]
    name_fold=(entry.get("name","") or "").casefold()
    if re.match(r"power stones?\s+\d+(?:st|nd|rd|th)?\s+level power",name_fold):
        result["ruleFamily"]="power-stone"
        result["genericRuleSource"]="SRD psionic power-stone rules"
    result["mechanicsPresence"] = {"ruleProse": has_rule_prose(lines, entry.get("name",""))}
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
        if not details.get("sourceBook"):
            raise ValueError("Class parse missing source book")
        useful = ("hit_die","skillPoints","minBab","prerequisites","progression","advancement","classSkills")
        if not any(details.get(key) for key in useful):
            # Some catalog records are source pointers (for example variant base
            # classes) with no mechanics on that exact page. They are safe to retain
            # as partial references, but they must not be stamped as enriched.
            raise ValueError("Class page contains no structured mechanics to enrich")
    elif category == "spells":
        required = ["sourceBook", "school", "casting_time", "range", "duration"]
        missing = [key for key in required if not details.get(key)]
        if missing:
            raise ValueError("Spell parse missing required fields: " + ", ".join(missing))
    elif category == "feats":
        if not details.get("sourceBook"):
            raise ValueError("Feat parse missing source book")
    elif category == "items":
        if not details.get("sourceBook"):
            raise ValueError("Item parse missing source book")
        useful = ("price","cost","weight","bodySlot","casterLevel","aura","activation","rarity","itemType")
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
        "feats": ("sourceBook",),
        "items": ("sourceBook",),
        "equipment": ("kind","itemCategory"),
    }.get(category, ())
    gaps = [key for key in expected if not details.get(key)]

    if category == "classes":
        if details.get("prestige") and not details.get("prerequisites"):
            gaps.append("prerequisites")
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
        if not (presence.get("benefit") or presence.get("description")):
            gaps.append("featEffect")
    elif category == "spells":
        psionic=bool(re.search(r"\b(psychometabolism|psychokinesis|metacreativity|clairsentience|telepathy|psychoportation)\b",details.get("school",""),re.I))
        if psionic:
            details["isPsionicPower"]=True
        if not details.get("isManeuver") and not psionic and not details.get("components"):
            gaps.append("components")
        if not presence.get("ruleProse"):
            gaps.append("spellEffect")
    elif category == "items":
        useful = ("price","cost","weight","bodySlot","casterLevel","aura","activation","rarity","itemType")
        if not any(details.get(key) for key in useful):
            gaps.append("itemStats")
        if not presence.get("ruleProse") and not details.get("ruleFamily"):
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


def enrich_entry(entry: dict, category: str, delay: float) -> dict:
    html_text = fetch(entry["url"], delay)
    parser = DetailParser()
    parser.feed(html_text)
    parser.close()
    details = PARSERS[category](parser, entry)
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


def run_category(category: str, limit: int | None, delay: float, force: bool, write: bool, candidate_dir: Path | None = None):
    path = CATALOG / f"{category}.json"
    rows = json.loads(path.read_text(encoding="utf-8"))
    changed = 0
    attempted = 0
    for i, entry in enumerate(rows):
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
        # Checkpoint after every 25 successful records.
        if write and changed and changed % 25 == 0:
            path.write_text(json.dumps(rows, ensure_ascii=False) + "\n", encoding="utf-8")
    if write and changed:
        path.write_text(json.dumps(rows, ensure_ascii=False) + "\n", encoding="utf-8")
    if candidate_dir is not None:
        target=candidate_dir/"dndtools"/f"{category}.json"
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text(json.dumps(rows,ensure_ascii=False)+"\n",encoding="utf-8")
    return {"category":category,"attempted":attempted,"changed":changed,"total":len(rows),"write":write,"candidate":str(candidate_dir) if candidate_dir else None}


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

    spell_html = """
    <h1>Magic Missile</h1><p>Player's Handbook v.3.5 (PH), p. 251</p>
    <div>School</div><div>Evocation</div><div>Casting Time</div><div>1 standard action</div>
    <div>Components</div><div>V, S</div><div>Range</div><div>Medium</div>
    <div>Duration</div><div>Instantaneous</div><div>Classes</div><div>Sorcerer 1Wizard 1Warmage 1</div>
    """
    p=DetailParser();p.feed(spell_html);p.close()
    s=parse_spell(p,{"name":"Magic Missile"})
    assert s["school"] == "Evocation" and s["classLevels"]["Wizard"] == 1 and s["level"] == 1

    feat_html = """
    <h1>Monkey Grip</h1><p>General feat</p><p>Complete Warrior (CW), p. 103</p>
    <div>Prerequisite</div><div>BAB +1.</div>
    """
    p=DetailParser();p.feed(feat_html);p.close()
    f=parse_feat(p,{"name":"Monkey Grip"})
    assert f["featType"] == "General feat" and f["prerequisites"][0]["text"] == "BAB +1."

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
    ap.add_argument("--self-test", action="store_true")
    args=ap.parse_args()
    if args.self_test:
        self_test()
        return
    if args.write and not audit_report_allows_write(args.audit_report):
        raise SystemExit("--write is locked until a strict full-catalog audit report passes with zero critical gaps.")
    results=[run_category(c,args.limit,args.delay,args.force,args.write,args.candidate_dir) for c in args.categories]
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
