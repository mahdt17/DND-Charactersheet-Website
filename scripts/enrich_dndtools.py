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


def fetch(url: str, delay: float = 0.35) -> str:
    if urlparse(url).netloc != urlparse(BASE).netloc:
        raise ValueError(f"Refusing non-DnDTools URL: {url}")
    last = None
    for attempt in range(4):
        try:
            if delay:
                time.sleep(delay)
            req = Request(url, headers={"User-Agent": AGENT, "Cache-Control": "no-cache"})
            with urlopen(req, timeout=45) as response:
                final = response.geturl()
                if urlparse(final).netloc != urlparse(BASE).netloc:
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
        if len(value) >= 55:
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

    # Advancement tables vary: normal classes use BAB/Fort/Ref/Will, while epic
    # and unusual classes may use headers such as "Loremaster Level" + "Special".
    for table in parser.tables:
        if not table:
            continue
        header_index = None
        header = None
        for idx, candidate in enumerate(table[:4]):
            normalized = [clean(c) for c in candidate]
            folded = [h.casefold() for h in normalized]
            has_level = any(h == "level" or h.endswith(" level") for h in folded)
            has_progress = any(h in folded for h in ("bab","fort","fortitude","ref","reflex","will","special","spellcasting"))
            if has_level and has_progress:
                header_index = idx
                header = normalized
                break
        if header is not None:
            data_rows = table[header_index+1:]
            rows = []
            for row in data_rows:
                values = row + [""] * max(0, len(header)-len(row))
                rows.append({header[i] or f"column_{i+1}": clean(values[i]) for i in range(len(header))})
            enriched["advancement"] = rows
            enriched["progression"] = [header] + data_rows
            break

    # Keep class skills as names only if the page renders them as separate tokens.
    skills = section(lines, parser.headings, "Class Skills")
    if skills:
        tokens = []
        for line in skills[:5]:
            tokens += re.findall(r"[A-Z][A-Za-z' -]+?(?=[A-Z]|$)", line)
        enriched["classSkills"] = [clean(x) for x in tokens if clean(x)]
    enriched["mechanicsPresence"] = {
        "classFeatures": bool(section(lines, parser.headings, "Class Features")),
        "ruleProse": has_rule_prose(lines, entry.get("name",""))
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
        if not details.get("sourceBook") or not details.get("featType"):
            raise ValueError("Feat parse missing source book or feat type")
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
        "spells": ("sourceBook","school","casting_time","components","range","duration"),
        "feats": ("sourceBook","featType"),
        "items": ("sourceBook",),
        "equipment": ("kind","itemCategory"),
    }.get(category, ())
    gaps = [key for key in expected if not details.get(key)]

    if category == "classes":
        if details.get("prestige") and not details.get("prerequisites"):
            gaps.append("prerequisites")
        if not presence.get("classFeatures"):
            gaps.append("classFeatures")
        if not presence.get("ruleProse"):
            gaps.append("classRuleText")
    elif category == "feats":
        if not (presence.get("benefit") or presence.get("description")):
            gaps.append("featEffect")
        if not presence.get("ruleProse"):
            gaps.append("featRuleText")
    elif category == "spells":
        if not presence.get("ruleProse"):
            gaps.append("spellEffect")
    elif category == "items":
        useful = ("price","cost","weight","bodySlot","casterLevel","aura","activation","rarity","itemType")
        if not any(details.get(key) for key in useful):
            gaps.append("itemStats")
        if not presence.get("ruleProse"):
            gaps.append("itemEffect")
    elif category == "equipment":
        if not any(details.get(key) for key in (
            "cost","weight","armorClassBonus","maxDex","armorCheckPenalty",
            "arcaneSpellFailure","damageSmall","damageMedium","critical","rangeIncrement"
        )):
            gaps.append("equipmentStats")
    return sorted(set(gaps))


def enrich_entry(entry: dict, category: str, delay: float) -> dict:
    html_text = fetch(entry["url"], delay)
    parser = DetailParser()
    parser.feed(html_text)
    parser.close()
    details = PARSERS[category](parser, entry)
    validate_details(entry, category, parser, details)
    gaps = enrichment_gaps(category, details)
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


def run_category(category: str, limit: int | None, delay: float, force: bool, write: bool):
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
    return {"category":category,"attempted":attempted,"changed":changed,"total":len(rows),"write":write}


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
        and report.get("criticalMissingCount") == 0
        and float(report.get("minimumRate", 0)) >= 1.0
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
    ap.add_argument("--self-test", action="store_true")
    args=ap.parse_args()
    if args.self_test:
        self_test()
        return
    if args.write and not audit_report_allows_write(args.audit_report):
        raise SystemExit("--write is locked until a strict full-catalog audit report passes with zero critical gaps.")
    results=[run_category(c,args.limit,args.delay,args.force,args.write) for c in args.categories]
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
