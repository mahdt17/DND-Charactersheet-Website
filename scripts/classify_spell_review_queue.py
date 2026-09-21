"""Classify the remaining D&D 3.5 spell review queue without mutating catalogs."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import enrich_dndtools as d35

CATALOG = ROOT / "public" / "catalogs" / "dndtools" / "spells.json"
SUMMARIES = ROOT / "scripts" / "spell_effect_summaries_35.json"
SUPPLEMENTS = ROOT / "scripts" / "spell_supplements_35.json"
REGRESSIONS = ROOT / "scripts" / "spell_regression_cases.json"

KNOWN_REPAIR_FIXTURES = {
    "spells/extract-drug-140",
    "spells/favorable-sacrifice-1942",
    "spells/dragonblood-beast-4864",
    "spells/dragon-ally-lesser-4417",
    "spells/dragonshape-3011",
    "spells/dragonshape-lesser-1078",
    "spells/drown-5004",
    "spells/elemental-burst-2066",
    "spells/enlarge-person-2805",
    "spells/evil-weather-139",
}
KNOWN_REFERENCE_FIXTURES = {
    "spells/eye-of-power-2250",
    "spells/eye-of-power-4471",
    "spells/eye-of-stone-3068",
    "spells/faith-healing-wand-325",
    "spells/false-peacebond-359",
    "spells/fang-trap-3246",
    "spells/familial-geas-1434",
    "spells/false-vision-2669",
    "spells/familiar-refuge-780",
    "spells/incendiary-cloud-2401",
}

REFERENCE_PATTERNS = (
    re.compile(
        r"\b(?:functions?|works?|operates?)\s+like\s+"
        r"(?P<name>[^.;:!?]{2,120}?)(?=,\s*(?:except|but)\b|[.;:!?]|$)",
        re.I,
    ),
    re.compile(
        r"\b(?:functions?|works?|operates?)\s+as\s+"
        r"(?!if\b|though\b|a\b|an\b)(?P<name>[^.;:!?]{2,120}?)(?=,\s*(?:except|but)\b|[.;:!?]|$)",
        re.I,
    ),
    re.compile(
        r"(?:^|[.!?:]\s+)As\s+(?:the\s+spell\s+)?(?P<name>[^.!?]{2,120}?),\s*(?:except|but)\b",
        re.I,
    ),
    re.compile(
        r"\(\s*as\s+(?:the\s+)?(?P<name>[^()]{2,100}?)(?:\s+spell)?\s*\)",
        re.I,
    ),
    re.compile(
        r"\bas\s+(?P<name>(?:greater|lesser)\s+[A-Za-z][A-Za-z'’ -]{1,80})(?=[.;])",
        re.I,
    ),
    re.compile(
        r"\b(?:version\s+of|as\s+per\s+(?:a\s+)?standard)\s+(?P<name>[A-Za-z][A-Za-z'’/-]{1,80})(?=[.;,(]|$)",
        re.I,
    ),
    re.compile(
        r"\b(?:identical\s+to|same\s+as)\s+(?!if\b|the\s+original\b|that\b|those\b)(?P<name>[^.;:!?]{2,100}?)(?=,\s*(?:except|but)\b|[.;:!?]|$)",
        re.I,
    ),
    re.compile(
        r"\b(?:functions?|works?|operates?)\s+identically\s+to\s+"
        r"(?!the\s+original\b|that\b|those\b)(?P<name>[^.;:!?]{2,100}?)(?=,\s*(?:except|but)\b|[.;:!?]|$)",
        re.I,
    ),
    re.compile(
        r"\b(?:functions?|works?|operates?|acts?|behaves?)\s+as\s+"
        r"(?:a|an|the)\s+(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    ),
    re.compile(
        r"\b(?:functions?|works?|operates?|acts?|behaves?)\s+like\s+"
        r"(?:a|an|the)?\s*(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    ),
    re.compile(
        r"\b(?:acts?|behaves?)\s+like\s+(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)(?=[.;,]|$)",
        re.I,
    ),
    re.compile(
        r"\b(?:the\s+)?effects?\s+of\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    ),
    re.compile(
        r"\breveals?\s+as\s+much\s+information\s+as\s+(?:a|an|the)\s+"
        r"(?P<name>detect magic)\s+spell\b",
        re.I,
    ),
    re.compile(
        r"\bas\s+if\s+(?:it\s+were\s+)?affected\s+by\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    ),
    re.compile(
        r"(?:^|[.!?:]\s+)As\s+with\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    ),
    re.compile(
        r"\bas\s+(?:a|the)\s+(?P<name>fog cloud)\s+does\b",
        re.I,
    ),
    re.compile(
        r"(?:^|[.!?]\s+)As\s+with\s+(?P<name>fog cloud)\s*,",
        re.I,
    ),
)

EXTERNAL_MECHANICS_PATTERNS = (
    ("leading-inherited-spell", re.compile(
        r"^\s*As\s+(?:the\s+)?(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)(?:\s+spell)?\s*,\s*(?:and|except|but)\b",
        re.I,
    )),
    ("generic-identical-with", re.compile(
        r"\bidentical\s+(?:with|to)\s+(?!the\s+original\b|that\b|those\b)(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)(?=[,.;(]|$)",
        re.I,
    )),
    ("works-identically-to-spell", re.compile(
        r"\b(?:functions?|works?|operates?)\s+identically\s+to\s+"
        r"(?!the\s+original\b|that\b|those\b)(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)(?=[,.;(]|$)",
        re.I,
    )),
    ("granted-spell-effect", re.compile(
        r"\b(?:plus|gains?|grants?|receives?)\s+(?:the\s+)?effects?\s+of\s+(?:a|an|the)?\s*(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)(?:\s+spell)?(?=[,.;(]|$)",
        re.I,
    )),
    ("external-page-reference", re.compile(
        r"\b(?:see\s+(?:page\s+\d+|chapter\s+\d+|the\s+[^.;]{1,70}\s+spell\s+description)|PH\s+\d+)\b",
        re.I,
    )),
    ("external-rulebook-section", re.compile(
        r"\bsee\s+[^.;]{1,100}\b(?:page|chapter)\s+\d+|"
        r"\bsee\s+[^.;]{1,100}\b(?:Player[’']s Handbook|Dungeon Master[’']s Guide|Book of Vile Darkness|Campaign Setting)\b",
        re.I,
    )),
    ("external-described-page-reference", re.compile(
        r"\bas\s+(?:described|outlined|detailed)\s+(?:on|in)\s+page\s+\d+\b",
        re.I,
    )),
    ("external-rules-sidebar-reference", re.compile(
        r"\bas\s+(?:described|outlined|detailed)\s+in\s+(?:the\s+)?[^.;]{1,80}\bsidebar\b",
        re.I,
    )),
    ("numbered-table-reference", re.compile(r"\bTable\s+\d+(?:-\d+)?\b", re.I)),
    ("similar-spell-effect", re.compile(
        r"\bsimilar\s+to\s+(?:the\s+)?effects?\s+of\s+(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)(?:\s+spell)?(?=[,.;)]|$)",
        re.I,
    )),
    ("polymorph-subschool-reference", re.compile(r"\bpolymorph\s+subschool\b", re.I)),
    ("referenced-creature-stat-block", re.compile(
        r"\b(?:equivalent\s+to|use(?:s)?\s+(?:the\s+)?)\s*(?:a|an|the)?\s*"
        r"(?P<name>[A-Za-z][A-Za-z'’ -]{2,80})\s*\(\s*(?:MM|Monster Manual)\b",
        re.I,
    )),
    ("take-form-with-source-reference", re.compile(
        r"\btake(?:s)?\s+the\s+form\s+of\s+(?P<name>[A-Za-z][A-Za-z'’ -]{2,80})\s*\(",
        re.I,
    )),
    ("embedded-spell-mechanics", re.compile(
        r"\bidentical\s+(?:with|to)\s+(?:those|the\s+effects?)\s+created\s+by\s+(?:the\s+)?"
        r"(?P<name>[A-Za-z][A-Za-z'’ /,-]{2,80}?)(?:\s+spell)?(?=[,.;])",
        re.I,
    )),
    ("see-spell-text", re.compile(
        r"\bsee\s+(?:the\s+)?text\s+for\s+(?P<name>[A-Za-z][A-Za-z'’ /,-]{2,80})",
        re.I,
    )),
    ("fixed-spell-effect", re.compile(r"\b(?:fix|attach)\s+a\s+single\s+spell\s+effect\b", re.I)),
    ("referenced-force-bypass-rules", re.compile(
        r"\bmethods?\s+that\s+can\s+bypass\s+or\s+destroy\s+(?:a|the)\s+(?P<name>[A-Za-z][A-Za-z'’ /,-]{2,80})",
        re.I,
    )),
    ("external-monster-manual-reference", re.compile(
        r"\b(?:MM\s*(?:p\.?\s*)?\d+|see\s+[^.;]{0,120}\bMonster Manual\b|"
        r"(?:the\s+)?Monster Manual\s+(?:has|gives|provides|contains)\s+(?:the\s+)?statistics\b)",
        re.I,
    )),
    ("as-with-named-spell", re.compile(
        r"\bas\s+with\s+(?!any\b|all\b|every\b|other\b)(?:a|an|the)?\s*"
        r"(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    )),
    ("fog-cloud-as-does-inheritance", re.compile(
        r"\bas\s+(?:a|the)\s+(?P<name>fog cloud)\s+does\b",
        re.I,
    )),
    ("as-with-fog-cloud-inheritance", re.compile(
        r"\bas\s+with\s+(?P<name>fog cloud)\s*,",
        re.I,
    )),
    ("as-per-named-spell", re.compile(
        r"\bas\s+per\s+(?:a|an|the)\s+(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    )),
    ("leading-like-named-spell", re.compile(
        r"(?:^|[.!?:]\s+)Like\s+(?!a\b|an\b)(?P<name>[^,.;:!?]{2,100}?)\s*,\s*"
        r"(?:this\s+spell\b|you\b)",
        re.I,
    )),
    ("functions-much-like-spell", re.compile(
        r"\b(?:functions?|works?|operates?|acts?|behaves?)\s+much\s+like\s+"
        r"(?:a|an|the)?\s*(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    )),
    ("named-spell-benefit", re.compile(
        r"\b(?:gains?|grants?|receives?|has)\s+(?:the\s+)?benefits?\s+of\s+"
        r"(?:a|an|the)\s+(?!spell\b|this\b|that\b)"
        r"(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    )),
    ("receives-heal-spell-inheritance", re.compile(
        r"\breceives?\s+(?:a|an|the)\s+(?P<name>heal)\s+spell\b",
        re.I,
    )),
    ("exactly-like-named-spell", re.compile(
        r"\b(?:works?|functions?|operates?|acts?|behaves?)\s+exactly\s+like\s+"
        r"(?:the\s+)?(?:\d+(?:st|nd|rd|th)-level\s+)?(?:arcane\s+|divine\s+)?"
        r"(?:spell\s+)?(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)(?=,|\s+except\b|[.;]|$)",
        re.I,
    )),
    ("received-named-spells", re.compile(
        r"\bas\s+though\s+(?:they|it|he|she|the\s+[A-Za-z][A-Za-z'’ -]{0,40})\s+"
        r"(?:have|has|had)\s+received\s+(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)\s+spells?\b",
        re.I,
    )),
    ("affected-as-though-by-spell", re.compile(
        r"\baffected\s+as\s+though\s+by\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    )),
    ("as-though-affected-by-spell", re.compile(
        r"\bas\s+though\s+(?:it|they|he|she|the\s+[A-Za-z][A-Za-z'’ -]{0,40})\s+"
        r"(?:were|was)\s+affected\s+by\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    )),
    ("similar-to-created-by-spell", re.compile(
        r"\bsimilar\s+to\s+(?:that|those)\s+created\s+by\s+(?:a|an|the)?\s*"
        r"(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    )),
    ("targeted-dispel-magic-inheritance", re.compile(
        r"\b(?:functions?|works?|operates?|acts?|behaves?)\s+as\s+"
        r"(?:a|an|the)\s+(?:targeted|area)\s+(?P<name>dispel magic)\b",
        re.I,
    )),
    ("weapon-stat-inheritance", re.compile(
        r"\btreated\s+in\s+all\s+ways\s+like\s+(?:a|an|the)?\s*[+-]?\d*\s*"
        r"(?P<name>[A-Za-z][A-Za-z'’ -]{2,80})(?=[,.;]|$)",
        re.I,
    )),
    ("equivalent-to-named-spell", re.compile(
        r"\bequivalent\s+to\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    )),
    ("similar-to-named-spell-comparison", re.compile(
        r"\bsimilar\s+to\s+(?:the\s+)?(?:(?:divine|arcane)\s+spell\s+)?"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)"
        r"(?=\s*,\s*(?:this\s+spell\b|except\b|but\b|you\b)|\s*\))",
        re.I,
    )),
    ("similar-to-created-by-named-spell", re.compile(
        r"\bsimilar\s+to\s+(?:that|those)\s+created\s+by\s+(?:a|an|the)?\s*"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)"
        r"(?=\s*,\s*(?:except|but)\b|[.;])",
        re.I,
    )),
    ("as-named-spell-does", re.compile(
        r"\bas\s+(?:a|an|the)\s+(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)"
        r"\s+spell\s+does\b",
        re.I,
    )),
    ("interacts-like-named-spell", re.compile(
        r"\binteracts?\s+with\s+other\s+spells?\s+just\s+(?:like|as)\s+"
        r"(?:a|an|the)?\s*(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)"
        r"(?:\s*\([^)]*\))?\s*(?:does)?(?=[.;])",
        re.I,
    )),
    ("servant-conjured-by-named-spell", re.compile(
        r"\b(?:acts?|behaves?)\s+similar\s+to\s+the\s+servant\s+conjured\s+by\s+"
        r"(?:a|an|the)\s+(?P<name>unseen servant)\s+spell\b",
        re.I,
    )),
    ("equivalent-of-named-spell", re.compile(
        r"\bequivalent\s+of\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    )),
    ("works-just-like-named-spell", re.compile(
        r"\b(?:functions?|works?|operates?|acts?|behaves?)\s+just\s+like\s+"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)"
        r"(?=\s*,?\s*(?:except|but)\b|\s+spell\b)",
        re.I,
    )),
    ("functions-in-all-respects-like-named-spell", re.compile(
        r"\bfunctions?\s+in\s+all\s+respects\s+like\s+"
        r"(?!a\b|an\b|the\b)(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)"
        r"(?=\s*,\s*(?:except|but)\b|[.;])",
        re.I,
    )),
    ("functions-as-if-named-spell-cast", re.compile(
        r"\bfunctions?\s+as\s+if\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)\s+spell\s+"
        r"had\s+been\s+cast\b",
        re.I,
    )),
    ("same-way-as-named-spell", re.compile(
        r"\b(?:in\s+)?the\s+same\s+way\s+as\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    )),
    ("size-change-spell-inheritance", re.compile(
        r"\b(?:shrinks?|grows?|grow)\b[^.;]{0,140}?\bas\s+the\s+"
        r"(?P<name>reduce person|enlarge person)\s+spell\b",
        re.I,
    )),
    ("monster-manual-described-stat-dependency", re.compile(
        r"\bas\s+described\s+in\s+the\s+Monster\s+Manual\b",
        re.I,
    )),
    ("dispel-magic-effect-inheritance", re.compile(
        r"\b(?:target\s+of|as|like)\s+(?:a|an|the)?\s*(?P<name>dispel magic)\s+effect\b",
        re.I,
    )),
    ("modified-named-spell-reference", re.compile(
        r"\bacts?\s+as\s+(?:a|an|the)\s+\+\d+\s+(?P<name>bless\s+weapon)\b",
        re.I,
    )),
    ("named-effect-shorthand", re.compile(
        r"\b(?:gains?|receives?)\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)\s+effect\b",
        re.I,
    )),
    ("activated-named-effect-as-spell", re.compile(
        r"\b(?:activate|invoke|create|produce)s?\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)\s+effect\s*"
        r"\(\s*as\s+the\s+spell\s*\)",
        re.I,
    )),
    ("affected-by-shorthand", re.compile(
        r"\b(?:acts?|behaves?)\s+as\s+though\s+affected\s+by\s+"
        r"(?:a|an|the)?\s*(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)(?=[,.;]|$)",
        re.I,
    )),
    ("external-see-for-details", re.compile(
        r"\bsee\s+(?:the\s+)?[^.;]{1,100}?\s+for\s+(?:more\s+)?details\b",
        re.I,
    )),
    ("external-rules-detailed-page-reference", re.compile(
        r"\brules?\s+(?:are\s+)?(?:detailed|described|explained|found)\s+(?:on|at)\s+page\s+\d+\b",
        re.I,
    )),
    ("external-see-rulebook-reference", re.compile(
        r"\bsee\s+[^.;]{1,120}\b(?:Dungeon[^.;]{0,40}Guide|Player[^.;]{0,40}Handbook)\b",
        re.I,
    )),
    ("parenthetical-see-named-spell", re.compile(
        r"\(\s*see\s+(?:the\s+)?(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,60}?)\s+spell\s*[),.;]",
        re.I,
    )),
    ("affected-as-if-by-named-spell", re.compile(
        r"\baffected\s+as\s+if\s+by\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    )),
    ("as-if-from-named-spell", re.compile(
        r"\bas\s+if\s+from\s+(?:a|an|the)?\s*"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    )),
    ("summoned-creature-stat-dependency", re.compile(
        r"(?:^|[.!?]\s+)(?:This\s+spell\s+summons|You\s+summon)\s+"
        r"(?:(?:a|an|one|two|three|a\s+pair\s+of|a\s+number\s+of|number\s+of)\s+)?"
        r"(?P<name>[^.;]{0,100}?\b(?:golems?|devils?|demons?|archons?|eladrins?|rocs?|wyverns?|"
        r"elementals?|homuncul(?:us|i)|titans?|swarms?|dragons?|undead(?:\s+creatures?)?|"
        r"extraplanar\s+creatures?|natural\s+creatures?|fiends?|creatures?))\b",
        re.I,
    )),
    ("created-creature-stat-dependency", re.compile(
        r"(?:^|[.!?]\s+)(?:This\s+spell\s+creates|You\s+create)\s+"
        r"(?:a|an|one|two|three)\s+"
        r"(?P<name>wyverns?|golems?|devils?|demons?|archons?|eladrins?|rocs?|"
        r"elementals?|homuncul(?:us|i)|titans?|swarms?|dragons?|fiends?)\b",
        re.I,
    )),
    ("condition-as-the-spell", re.compile(
        r"\b(?:slowed|hasted|confused|frightened|paralyzed|petrified|stunned|dazed|blinded|deafened|charmed)\s+as\s+the\s+spell\b",
        re.I,
    )),
    ("slow-condition-shorthand", re.compile(
        r"\b(?:subject|target|creatures?|foe|enemy)\b[^.;]{0,100}\b"
        r"(?:is|are|becomes?|become)\s+slowed\b",
        re.I,
    )),
    ("planar-environment-dependency", re.compile(
        r"\bemulates?\s+(?:its|the|a)\s+native\s+planar\s+environment\b",
        re.I,
    )),
    ("weapon-special-ability-dependency", re.compile(
        r"\bhas\s+(?:the\s+)?(?P<name>[A-Za-z][A-Za-z0-9'’ ,/-]{2,100}?)\s+special\s+abilities\b",
        re.I,
    )),
    ("fog-cloud-concealment-inheritance", re.compile(
        r"\bconcealment\s+similar\s+to\s+(?P<name>fog cloud)\b",
        re.I,
    )),
    ("freedom-of-movement-inheritance", re.compile(
        r"\bprotected\s+by\s+(?P<name>freedom of movement)\b",
        re.I,
    )),
    ("negative-energy-protection-inheritance", re.compile(
        r"\b(?:receives?|gains?|functions?\s+as\s+if\s+affected\s+by)\s+"
        r"(?P<name>negative energy protection)\b",
        re.I,
    )),
    ("under-influence-of-named-spell", re.compile(
        r"\bas\s+if\s+(?:it|he|she|they|the\s+[A-Za-z][A-Za-z'’ -]{0,40})\s+"
        r"(?:were|was)\s+under\s+the\s+influence\s+of\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    )),
    ("mobility-feat-inheritance", re.compile(
        r"\bact(?:s)?\s+as\s+if\s+(?:you|it|he|she|they)\s+had\s+the\s+"
        r"(?P<name>Mobility)\s+feat\b",
        re.I,
    )),
    ("called-creature-stat-dependency", re.compile(
        r"\b(?:the\s+caster|you|this\s+spell)\s+calls?\s+"
        r"(?:a\s+special\s+servant[^.;]{0,80}?\b(?:pegasus|unicorn)\b|"
        r"(?:a|an|one|two|three)\s+(?P<name>[A-Za-z][A-Za-z'’ -]{2,80}?)\s+"
        r"(?:to\s+(?:your|the\s+caster[’']s)\s+location|to\s+serve\s+you))",
        re.I,
    )),
    ("planar-exchange-creature-stat-dependency", re.compile(
        r"\bcall\s+an\s+extraplanar\s+creature\s*\(\s*specifically\s*,\s*"
        r"(?:an\s+)?avoral\s+guardinal\s*,\s*bone\s+devil\s*,\s*or\s+babau\s+demon\b"
        r".{0,700}?\bfull\s+access\s+to\s+all\s+of\s+its\s+abilities\b",
        re.I | re.S,
    )),
    ("spell-of-that-name-inheritance", re.compile(
        r"\b(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,60}?)\s+effect[^.;]{0,100}\b"
        r"functions?\s+identically\s+to\s+the\s+spell\s+of\s+that\s+name\b",
        re.I,
    )),
    ("caught-in-named-spell", re.compile(
        r"\bact(?:s)?\s+as\s+if\s+caught\s+in\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    )),
    ("same-as-named-feat", re.compile(
        r"\b(?:overall\s+)?effect\s+is\s+the\s+same\s+as\s+(?:that\s+of\s+)?(?:the\s+)?"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)\s+feat\b",
        re.I,
    )),
    ("fog-created-by-fog-cloud", re.compile(
        r"\b(?:bank|cloud|fog|mist)\b[^.;]{0,80}\blike\s+that\s+created\s+by\s+"
        r"(?P<name>fog cloud)\b",
        re.I,
    )),
    ("magic-weapon-stat-inheritance", re.compile(
        r"\bas\s+if\s+(?:you|it|the\s+subject|the\s+target)\s+(?:were|was)\s+wearing\s+"
        r"(?:(?:a|an|the)\s+)?(?P<name>\+\d+\s+[A-Za-z][A-Za-z'’ -]{1,60})(?=[.,;:]|\s|$)",
        re.I,
    )),
    ("fired-from-light-crossbow-stat-dependency", re.compile(
        r"\bas\s+if\s+you\s+had\s+fired\s+it\s+from\s+(?:a|an|the)\s+"
        r"(?P<name>light crossbow)\b",
        re.I,
    )),
    ("clairaudience-effect-inheritance", re.compile(
        r"\bmuch\s+like\s+(?:a|an|the)\s+(?P<name>clairaudience)\s+effect\b",
        re.I,
    )),
    ("green-slime-dmg-dependency", re.compile(
        r"\bgreen\s+slime\s*\(\s*DMG\s+76\s*\)",
        re.I,
    )),
    ("daylight-dispel-inheritance", re.compile(
        r"\bdispels?\s+darkness\)?\s+as\s+(?:a|an|the)\s+"
        r"(?P<name>daylight)\s+spell\b",
        re.I,
    )),
    ("evasion-ability-inheritance", re.compile(
        r"\bgain(?:s)?[^.;]{0,100}\bthe\s+(?P<name>evasion)\s+ability\b",
        re.I,
    )),
    ("bard-feature-inheritance", re.compile(
        r"\bfunction(?:s)?\s+as\s+a\s+bard[^.;]{0,140}\bwith\s+respect\s+to\s+"
        r"(?P<name>bardic music and bardic knowledge)\b",
        re.I,
    )),
    ("listed-spell-suite-inheritance", re.compile(
        r"\bchoose\s+a\s+spell\s+from\s+those\s+listed\s+below[^.;]{0,100}\b"
        r"use\s+it\s+as\s+a\s+spell[- ]?like\s+ability\b",
        re.I,
    )),
    ("manual-of-the-planes-reference", re.compile(
        r"\bsee\s+Manual\s+of\s+the\s+Planes\b",
        re.I,
    )),
    ("dmg-page-reference", re.compile(
        r"\bDMG\s+\d+\b",
        re.I,
    )),
    ("monster-manual-statistics-dependency", re.compile(
        r"\b(?:normal\s+)?Monster\s+Manual\s+statistics\b",
        re.I,
    )),
    ("prismatic-spray-inheritance", re.compile(
        r"\bfunctions?\s+as\s+(?:a|an|the)\s+\+\d+\s+"
        r"(?P<name>prismatic spray)\b",
        re.I,
    )),
    ("glyph-of-warding-inheritance", re.compile(
        r"\bbears?\s+(?:a|an|the)?\s*(?P<name>glyph of warding)\b",
        re.I,
    )),
    ("creature-information-page-reference", re.compile(
        r"\b(?:more\s+)?information\s+on\s+(?:the\s+)?"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ -]{2,80}?)\s+can\s+be\s+found\s+"
        r"on\s+page\s+\d+\b",
        re.I,
    )),
    ("granted-weapon-special-abilities", re.compile(
        r"\b(?:gains?|gain|gaining)\s+(?:the\s+)?"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ ,/+:-]{2,100}?)\s+special\s+abilities\b",
        re.I,
    )),
    ("granted-named-feat-benefit", re.compile(
        r"\b(?:gains?|gain|receives?|the\s+benefit\s+of)\s+(?:the\s+)?"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ -]{1,80}?)\s+feat\b",
        re.I,
    )),
    ("treated-as-magic-equipment", re.compile(
        r"\btreated\s+as\s+(?P<name>\+\d+\s+(?:mithral|adamantine)?\s*"
        r"[A-Za-z][A-Za-z'’ -]{1,60})\s+for\s+all\s+purposes\b",
        re.I,
    )),
    ("prismatic-spray-beam-inheritance", re.compile(
        r"\b(?:suffers?|takes?)\s+the\s+effect\s+of\s+one\s+of\s+the\s+"
        r"beams\s+of\s+(?:a|an|the)\s+(?P<name>prismatic spray)\s+spell\b",
        re.I,
    )),
    ("lookingglass-spell-inheritance", re.compile(
        r"\bas\s+if\s+(?:you\s+were\s+using|affected\s+by)\s+"
        r"(?P<name>clairvoyance|teleport without error)\b",
        re.I,
    )),
    ("named-spell-as-spell-like-ability", re.compile(
        r"\b(?P<name>darkvision)\s+as\s+a\s+spell-like\s+ability\b",
        re.I,
    )),
    ("missing-section-below-reference", re.compile(
        r"\bsee\s+The\s+Unnamed\s+section\s+below\b",
        re.I,
    )),
    ("spell-turning-level-inheritance", re.compile(
        r"\bturns?\b[^.;]{0,100}\bspell\s+levels?\s+as\s+the\s+"
        r"(?P<name>spell turning)\s+spell\b",
        re.I,
    )),
    ("receives-named-spell-inheritance", re.compile(
        r"\breceives?\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    )),
    ("normal-restrictions-for-named-effect", re.compile(
        r"\bnormal\s+restrictions?\s+for\s+"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)(?=[).,;]|$)",
        re.I,
    )),
    ("parenthetical-as-the-spell", re.compile(
        r"\b[A-Za-z][A-Za-z0-9'’ -]{1,60}\s*\(\s*as\s+the\s+spell\s*\)",
        re.I,
    )),
    ("glows-as-named-spell", re.compile(
        r"\b(?:glows?|shines?|radiates?)\s+as\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    )),
    ("normal-weapon-use-inheritance", re.compile(
        r"\buse\b[^.;]{0,120}\bas\s+if\s+it\s+were\s+"
        r"(?:a|an|the)\s+normal\s+"
        r"(?P<name>[A-Za-z][A-Za-z'’ -]{1,50})(?=[.;,]|$)",
        re.I,
    )),
    ("normal-weapon-type-inheritance", re.compile(
        r"\bbehaves?\s+as\s+(?:a|an|the)\s+normal\s+weapon\s+of\s+its\s+type\b",
        re.I,
    )),
    ("weapon-transformation-stat-inheritance", re.compile(
        r"\b(?:allows?\s+you\s+to\s+)?(?:temporarily\s+)?transform\s+"
        r"(?:any\s+)?(?:one\s+)?melee\s+weapon\s+into\s+(?:a|an)\s+different\s+melee\s+weapon\b",
        re.I,
    )),
    ("rulebook-modifier-page-reference", re.compile(
        r"\b(?:modifiers?|rules?|bonuses?|penalties?)\b[^.;]{0,120}\b"
        r"(?:given|found|listed|described)\s+on\s+page\s+\d+\s+of\s+the\s+"
        r"(?P<name>Player[’']s Handbook|Dungeon Master[’']s Guide)\b",
        re.I,
    )),
    ("blessed-weapon-special-effects-dependency", re.compile(
        r"\bweapon\s+is\s+considered\s+blessed\s*,?\s*which\s+means\s+"
        r"it\s+has\s+special\s+effects\s+on\s+certain\s+creatures\b",
        re.I,
    )),
    ("targeted-dispel-screen-inheritance", re.compile(
        r"\baffected\s+as\s+by\s+(?:a\s+)?(?P<name>targeted dispel magic)\b",
        re.I,
    )),
    ("summon-monster-turn-inheritance", re.compile(
        r"\bact\s+on\s+your\s+turn\s+just\s+as\s+creatures\s+summoned\s+by\s+"
        r"(?:a\s+)?(?P<name>summon monster)\s+spell\b",
        re.I,
    )),
    ("weapon-size-damage-inheritance", re.compile(
        r"\bdeal\s+damage\s+as\s+if\s+you\s+were\s+one\s+size\s+larger\s+than\s+normal\b",
        re.I,
    )),
    ("held-touch-spell-delivery-inheritance", re.compile(
        r"\bdelivers?\s+the\s+touch\s+spell\b[^.;]{0,120}\bas\s+if\s+you\s+had\s+touched\s+it\s+directly\b",
        re.I,
    )),
    ("evil-outsider-bane-inheritance", re.compile(
        r"\bmagic\s+weapons\s+with\s+the\s+(?P<name>evil outsider bane)\s+special\s+ability\s+"
        r"have\s+full\s+effect\b",
        re.I,
    )),
    ("heavy-armor-movement-inheritance", re.compile(
        r"\bslows?\s+(?:a|the)\s+creature[’']?s\s+movement\s+as\s+if\s+"
        r"(?:it|the\s+creature)\s+were\s+wearing\s+(?P<name>heavy armor)\b",
        re.I,
    )),
    ("monster-manual-found-statistics", re.compile(
        r"\b(?:other\s+)?statistics\s+for\s+[^.;]{1,80}\s+are\s+found\s+in\s+the\s+"
        r"(?P<name>Monster Manual)\b",
        re.I,
    )),
    ("resurrection-restoration-inheritance", re.compile(
        r"\brise\s+from\s+the\s+ashes\s+as\s+if\s+restored\s+to\s+life\s+by\s+a\s+"
        r"(?P<name>resurrection)\s+spell\b",
        re.I,
    )),
    ("protection-from-good-possession-inheritance", re.compile(
        r"\bblocks?\s+possession\s+and\s+mental\s+influence\s*,?\s+just\s+as\s+"
        r"(?P<name>protection from good)\s+does\b",
        re.I,
    )),
    ("legacy-ritual-subsystem-inheritance", re.compile(
        r"\btreated\s+as\s+if\s+(?:it|the\s+target)\s+had\s+not\s+performed\s+"
        r"any\s+of\s+the\s+(?P<name>legacy rituals)\b",
        re.I,
    )),
    ("heroes-feast-benefit-inheritance", re.compile(
        r"\bbenefits?\s+identical\s+to\s+those\s+of\s+(?:a\s+)?"
        r"(?P<name>heroes[’'] feast)\b",
        re.I,
    )),
    ("faerie-fire-effect-inheritance", re.compile(
        r"\bglow\s+with\s+(?:a\s+)?(?:red\s+)?(?P<name>faerie fire)\s+effect\b",
        re.I,
    )),
    ("incorporeal-subtype-rulebook-inheritance", re.compile(
        r"\bas\s+described\s+under\s+the\s+(?P<name>incorporeal subtype)\s+on\s+page\s+\d+\s+"
        r"of\s+the\s+Monster\s+Manual\b",
        re.I,
    )),
    ("corrosive-grasp-inheritance", re.compile(
        r"\bas\s+if\s+(?:you\s+were\s+)?(?:touching\s+it\s+with|using)\s+(?:a\s+)?"
        r"(?P<name>corrosive grasp)(?:\s+spell)?\b",
        re.I,
    )),
    ("lightning-bolt-emulation-inheritance", re.compile(
        r"\bexactly\s+as\s+the\s+(?P<name>lightning bolt)\s+spell\b",
        re.I,
    )),
    ("domain-swap-content-inheritance", re.compile(
        r"\bswap\s+one\s+of\s+your\s+current\s+domains\s+for\s+another\b.{0,260}?\b"
        r"gain\s+the\s+granted\s+power\s+of\s+the\s+new\s+domain\b",
        re.I | re.S,
    )),
    ("animal-form-trait-inheritance", re.compile(
        r"\bgain\s+the\s+same\s+damage\s+reduction\s+you\s+have\s+in\s+animal\s+form\b[^.]{0,220}\b"
        r"(?:scent\s+special\s+quality|feats\s+you\s+have\s+access\s+to\s+in\s+animal\s+form)\b",
        re.I | re.S,
    )),
    ("dmg-small-town-focus-reference", re.compile(
        r"\bsettlement\s+of\s+at\s+least\s+small\s+town\s+size\s+or\s+larger\b[^)]{0,80}"
        r"\bDUNGEON\s+MASTER\s*[’'‘]S\s+Guide\s*,\s*page\s+\d+\b",
        re.I,
    )),
    ("good-aligned-special-effects-dependency", re.compile(
        r"\b(?:weapon|item)\s+(?:affected\s+by\s+this\s+spell\s+)?is\s+considered\s+good-aligned\s*,?\s*"
        r"so\s+it\s+has\s+special\s+effects\s+on\s+certain\s+creatures\b",
        re.I,
    )),
    ("whip-weapon-rules-inheritance", re.compile(
        r"\b(?:wield\s+this\s+weapon\s+as\s+if\s+it\s+were\s+an\s+actual\s+whip|"
        r"follows\s+all\s+the\s+rules\s+for\s+a\s+whip\s+except)\b",
        re.I,
    )),
    ("otyugh-creation-stat-dependency", re.compile(
        r"\b(?:otyughs?\s+swarm\s+)?creates?\s+otyughs?\b|"
        r"\bchoose\s+to\s+create\s+\d+d\d+(?:\+\d+)?\s+(?:ordinary\s+)?otyughs?\b",
        re.I,
    )),
    ("clairaudience-clairvoyance-cast-inheritance", re.compile(
        r"\bfunctions?\s+as\s+if\s+you\s+had\s+cast\s+"
        r"(?P<name>clairaudience/clairvoyance)\b",
        re.I,
    )),
    ("protection-from-evil-taint-possession-inheritance", re.compile(
        r"\bblocks?\s+possession\s+and\s+mental\s+influence\s*,?\s+just\s+as\s+"
        r"(?P<name>protection from (?:evil|Taint))\s+does\b",
        re.I,
    )),
    ("prismatic-spray-ray-suite-inheritance", re.compile(
        r"\b(?:ray\s+effects\s+duplicating\s+the\s+beams\s+of|suffers?\s+the\s+effect\s+of\s+one\s+beam\s+of)\s+"
        r"(?:a\s+)?(?P<name>prismatic spray)\s+spell\b",
        re.I,
    )),
    ("elemental-monolith-stat-dependency", re.compile(
        r"\b(?:elemental monolith|monolith)\s*\(\s*Complete Arcane\s+\d+\s*\)\b|"
        r"\bconjure\s+a\s+tremendously\s+powerful\s+creature\s+known\s+as\s+an\s+elemental\s+monolith\b",
        re.I,
    )),
    ("magic-mouth-message-inheritance", re.compile(
        r"\bactivates?\s+a\s+message\b[^.;]{0,100}\bas\s+if\s+[^.;]{0,40}\s+were\s+a\s+"
        r"(?P<name>magic mouth)\b",
        re.I,
    )),
    ("speak-spell-suite-inheritance", re.compile(
        r"\bgrants?\s+you\s+the\s+effects?\s+of\s+"
        r"(?P<name>speak with animals\s*,\s*speak with plants\s*,\s*and\s*tongues)\b|"
        r"\bas\s+though\s+under\s+the\s+influence\s+of\s+(?P<name2>stone tell)\b",
        re.I,
    )),
    ("shadow-evocation-spell-suite-inheritance", re.compile(
        r"\bquasi-real\s*,?\s*illusory\s+version\s+of\s+a\s+sorcerer\s+or\s+wizard\s+"
        r"(?P<name>evocation spell)\s+of\s+\d+(?:st|nd|rd|th)\s+level\s+or\s+lower\b",
        re.I,
    )),
    ("hold-person-similarity-inheritance", re.compile(
        r"\b(?:effect\s+is\s+)?similar\s+to\s+(?P<name>hold person)\b",
        re.I,
    )),
    ("summon-monster-turn-inheritance-expanded", re.compile(
        r"\bact\s+on\s+the\s+same\s+round\s*,?\s+on\s+your\s+turn\s*,?\s+"
        r"just\s+as\s+creatures\s+summoned\s+by\s+(?:a\s+)?"
        r"(?P<name>summon monster)\s+spell\s+do\b",
        re.I,
    )),
    ("summoned-viper-stat-dependency", re.compile(
        r"\bsummons?\s+\d+d\d+(?:\+\d+)?\s+(?:fiendish|celestial)[^.;]{0,80}\bMedium(?:-size)?\s+vipers?\b",
        re.I,
    )),
    ("greater-teleport-circle-inheritance", re.compile(
        r"\bteleports?\s*,?\s+as\s+(?P<name>greater teleport)\b",
        re.I,
    )),
    ("luminous-assassin-stat-dependency", re.compile(
        r"\b(?:Lesser\s+)?Luminous\s+Assassin\s+appears?\b.{0,700}?\b"
        r"(?:attacks?\s+its\s+target\s+every\s+round|attacks?\s+as\s+it\s+falls)\b",
        re.I | re.S,
    )),
    ("turn-as-undead-rules-inheritance", re.compile(
        r"\bturn\s+creatures?\s+with\s+the\s+opposing\s+alignment\s+subtype\s+"
        r"as\s+though\s+they\s+were\s+(?P<name>undead)\b",
        re.I,
    )),
    ("shroud-undead-rule-inheritance", re.compile(
        r"\btreated\s+as\s+if\s+you\s+were\s+undead\s+for\s+the\s+purposes?\s+of\s+"
        r"all\s+spells\s+and\s+effects?\b",
        re.I,
    )),
    ("possess-animal-stat-dependency", re.compile(
        r"\bproject\s+your\s+spirit\s+into\s+the\s+body\s+of\s+an\s+animal\b.{0,1000}?\b"
        r"keep\s+your\s+Intelligence\s*,\s*Wisdom\s*,\s*Charisma\b",
        re.I | re.S,
    )),
    ("quicken-feat-eligibility-inheritance", re.compile(
        r"\bOnly\s+(?:a\s+)?spells?\s+that\s+can\s+be\s+altered\s+by\s+the\s+"
        r"(?P<name>Quicken Spell)\s+feat\s+can\s+be\s+placed\s+in\s+the\s+matrix\b",
        re.I,
    )),
    ("hold-person-that-of-inheritance", re.compile(
        r"\b(?:effect\s+is\s+)?similar\s+to\s+that\s+of\s+(?P<name>hold person)\b",
        re.I,
    )),
    ("limited-wish-spell-suite-inheritance", re.compile(
        r"\bDuplicate\s+any\s+(?:sorcerer\s*/\s*wizard\s+)?spell\s+of\s+"
        r"\d+(?:st|nd|rd|th)\s+level\s+or\s+lower\b",
        re.I,
    )),
    ("manifest-zone-trait-dependency", re.compile(
        r"\benhance\s+the\s+effects\s+of\s+a\s+manifest\s+zone\s+of\s+a\s+specified\s+plane\b.{0,520}?\b"
        r"(?:next\s+inmost|planar\s+trait|each\s+zone\s+is\s+different)\b",
        re.I | re.S,
    )),
    ("spectral-hand-incorporeal-defense-dependency", re.compile(
        r"\bhand\s+is\s+incorporeal\s+and\s+thus\s+cannot\s+be\s+harmed\s+by\s+normal\s+weapons\b",
        re.I,
    )),
    ("spirit-ally-creature-stat-dependency", re.compile(
        r"\brequest\s+the\s+services\s+of\s+a\s+spirit\s*\(\s*of\s+up\s+to\s+"
        r"\d+\s+HD\s*\)",
        re.I,
    )),
    ("daylight-properties-inheritance", re.compile(
        r"\bradiates?\s+light\s+with\s+all\s+the\s+same\s+properties\s+of\s+a\s+"
        r"(?P<name>daylight)\s+spell\b",
        re.I,
    )),
    ("dagger-stat-inheritance", re.compile(
        r"\bdealing\s+damage\s+as\s+a\s+(?P<name>dagger)\s*"
        r"\(\s*including\s+the\s+threat\s+range\s+and\s+critical\s+multiplier\s*\)",
        re.I,
    )),
    ("transcribed-symbol-mechanics-inheritance", re.compile(
        r"\btransferred\s+(?:symbol|sigil)\s+works\s+normally\s+thereafter\s+and\s+retains\s+"
        r"(?:all\s+)?(?:its\s+)?original\s+triggering\s+conditions\b",
        re.I,
    )),
    ("dancing-lights-illumination-inheritance", re.compile(
        r"\bprovide\s+as\s+much\s+light\s+as\s+(?:a\s+)?(?P<name>dancing lights)\s+spell\b",
        re.I,
    )),
    ("spell-storing-item-arbitrary-spell", re.compile(
        r"\bimbue\s+any\s+spell\s+of\s+\d+(?:st|nd|rd|th)\s+level\s+or\s+lower\s+into\s+the\s+item\b",
        re.I,
    )),
    ("illusory-script-suggestion-inheritance", re.compile(
        r"\bsubject\s+to\s+a\s+(?P<name>suggestion)\s+implanted\s+in\s+the\s+script\b",
        re.I,
    )),
    ("ghost-template-transformation-dependency", re.compile(
        r"\btransform\s+a\s+willing\s+incorporeal\s+undead\s+creature\s+into\s+a\s+(?P<name>ghost)\b",
        re.I,
    )),
    ("disintegrate-effect-inheritance", re.compile(
        r"\b(?:be\s+)?subject\s+to\s+a\s+(?P<name>disintegrate)\s+effect\b",
        re.I,
    )),
    ("pending-potion-effect-dependency", re.compile(
        r"\bmagically\s+delay\s+the\s+effects?\s+of\s+a\s+potion\s+or\s+oil\b",
        re.I,
    )),
    ("psionic-power-suite-dependency", re.compile(
        r"\bgain\s+[^.]{0,120}\baccess\s+to\s+the\s+following\s+powers\b.{0,900}?\b"
        r"manifest\s+the\s+powers\s+as\s+a\s+psion\b",
        re.I | re.S,
    )),
    ("dispel-magic-effect-inheritance", re.compile(
        r"\btargeted\s+by\s+a\s+(?P<name>dispel magic)\s+effect\s+as\s+if\s+you\s+had\s+cast\s+(?:that|the)\s+spell\b",
        re.I,
    )),
    ("passwall-ejection-inheritance", re.compile(
        r"\bharmlessly\s+ejected\s+just\s+as\s+if\s+[^.;]{0,40}\s+inside\s+a\s+(?P<name>passwall)\s+effect\b",
        re.I,
    )),
    ("teleport-base-spell-inheritance", re.compile(
        r"\bAs\s+(?P<name>teleport)\s*,\s*save\s+that\b",
        re.I,
    )),
    ("stored-spell-disk-inheritance", re.compile(
        r"\bsingle\s+spell\s+of\s+up\s+to\s+\d+(?:st|nd|rd|th)\s+level\s+can\s+be\s+cast\s+into\s+it\b"
        r".{0,700}?\bspell\s+immediately\s+takes\s+effect\s+as\s+if\s+it\s+had\s+just\s+been\s+cast\b",
        re.I | re.S,
    )),
    ("shadow-hand-spell-suite-inheritance", re.compile(
        r"\bgive\s+cover\s+as\s+(?:a\s+)?(?P<name>Bigby[’']s interposing hand)\s+spell\b"
        r".{0,180}?\bcarry\s+materials\s+as\s+(?P<name2>Tenser[’']s floating disk)\b",
        re.I | re.S,
    )),
    ("incorporeal-traits-statblock-dependency", re.compile(
        r"\bSQ\s*:\s*[^\n]{0,200}\bincorporeal\s+traits\b|"
        r"\bSpecial\s+Qualities\s*:\s*[^\n]{0,200}\bincorporeal\s+traits\b",
        re.I,
    )),
    ("undefined-mirror-self-dependency", re.compile(
        r"\bcreate\s+a\s+mirror-self\s+that\s+will\s+try\s+to\s+slay\s+you\b",
        re.I,
    )),
    ("any-sword-skill-inheritance", re.compile(
        r"\bwield\s+the\s+beam\s+as\s+if\s+it\s+were\s+any\s+type\s+of\s+sword\b"
        r"[^.]{0,180}\bgain\s+the\s+benefits\s+of\s+any\s+special\s+sword\s+skill\b",
        re.I,
    )),
    ("spirit-self-incorporeal-rule-inheritance", re.compile(
        r"\bspirit\s+is\s+treated\s+as\s+an\s+incorporeal\s+creature\s+for\s+the\s+purposes?\s+of\s+"
        r"determining\s+movement\s*,\s*special\s+qualities\s*,\s*and\s+weaknesses\b",
        re.I,
    )),
    ("golem-special-attack-inheritance", re.compile(
        r"\b(?:you|the\s+subject)\s+(?:also\s+)?become(?:s)?\s+vulnerable\s+to\s+all\s+"
        r"special\s+attacks\s+that\s+affect\s+(?:iron|stone)\s+golems\b",
        re.I,
    )),
    ("phantom-steed-air-movement-inheritance", re.compile(
        r"\b(?:ride|move)\s+(?:in|through)\s+the\s+air\s+as\s+if\s+it\s+were\s+"
        r"(?:on\s+)?firm\s+land\s*,?\s+as\s+(?:a\s+)?phantom\s+steed\s+spell\b",
        re.I,
    )),
    ("phantasmal-thief-improved-disarm-inheritance", re.compile(
        r"\b(?:does|do)\s+this\s+as\s+if\s+it\s+had\s+the\s+Improved\s+Disarm\s+feat\b",
        re.I,
    )),
    ("wand-modulation-arbitrary-spell-inheritance", re.compile(
        r"\bnext\s+spell\s+you\s+cast\s+upon\s+the\s+target\s+wand\b.{0,160}?"
        r"\ballowing\s+the\s+wand\s+to\s+discharge\s+that\s+spell\s+instead\b",
        re.I | re.S,
    )),
    ("simulacrum-creature-stat-inheritance", re.compile(
        r"\bsame\s+as\s+the\s+original\b.{0,220}?\bone-half\s+of\s+the\s+real\s+"
        r"creature[’']s\s+(?:levels|levels\s+or\s+Hit\s+Dice)\b.{0,260}?"
        r"\b(?:feats|skill\s+ranks|special\s+abilities)\b",
        re.I | re.S,
    )),
    ("secure-shelter-spell-suite-inheritance", re.compile(
        r"\barcane\s+locked\b.{0,500}?\balarm\s+spell\b.{0,500}?\bunseen\s+servant\b",
        re.I | re.S,
    )),
    ("imbue-familiar-arbitrary-spell-inheritance", re.compile(
        r"\btransfer\s+a\s+number\s+of\s+your\s+spells\s+and\s+the\s+ability\s+to\s+"
        r"cast\s+them\s+into\s+your\s+familiar\b.{0,500}?\bany\s+spell\b",
        re.I | re.S,
    )),
    ("spirit-self-incorporeal-combat-inheritance", re.compile(
        r"\bdetected\s+and\s+attacked\s+in\s+the\s+same\s+way\s+as\s+"
        r"incorporeal\s+creatures\s+can\b",
        re.I,
    )),
    ("scent-track-feat-rule-inheritance", re.compile(
        r"\bability\s+otherwise\s+follows\s+the\s+rules\s+for\s+the\s+Track\s+feat\b",
        re.I,
    )),
    ("spell-engine-rod-absorption-inheritance", re.compile(
        r"\babsorbs?\s+all\s+these\s+effects\s+as\s+if\s+it\s+were\s+a\s+"
        r"rod\s+of\s+absorption\b",
        re.I,
    )),
    ("miracle-arbitrary-spell-duplication", re.compile(
        r"\bDuplicate\s+any\s+cleric\s+spell\s+of\s+\d+(?:st|nd|rd|th)\s+level\s+or\s+lower\b"
        r".{0,260}?\bDuplicate\s+any\s+other\s+spell\s+of\s+\d+(?:st|nd|rd|th)\s+level\s+or\s+lower\b",
        re.I | re.S,
    )),
    ("srinshee-metamagic-feat-suite-inheritance", re.compile(
        r"\bmetamagic\s+feat\s+from\s+the\s+following\s+list\s*:\s*"
        r"Empower\s+Spell\s*,\s*Enlarge\s+Spell\s*,\s*Extend\s+Spell\s*,\s*"
        r"Maximize\s+Spell\s*,\s*or\s+Widen\s+Spell\b",
        re.I,
    )),
    ("spell-phylactery-arbitrary-scroll-inheritance", re.compile(
        r"\bspell\s+on\s+the\s+scroll\b.{0,260}?\b(?:is\s+cast|cast)\s+"
        r"(?:upon|on)\s+you\b",
        re.I | re.S,
    )),
    ("weapon-deity-special-ability-inheritance", re.compile(
        r"\bweapon\s+gains?\s+a\s+\+\d+\s+enhancement\s+bonus\b.{0,180}?"
        r"\ban\s+additional\s+special\s+ability\s*\(\s*see\s+the\s+list\s+below\s*\)",
        re.I | re.S,
    )),
    ("scramble-phb-diagram-dependency", re.compile(
        r"\busing\s+the\s+[\"“]targeted\s+on\s+square[\"”]\s+part\s+of\s+the\s+diagram\s+"
        r"on\s+page\s+158\s+of\s+the\s+Player[’']s\s+Handbook\b",
        re.I,
    )),
    ("howling-chain-phb-thrown-weapon-dependency", re.compile(
        r"\bUse\s+the\s+rules\s+for\s+missing\s+with\s+a\s+thrown\s+weapon\s+"
        r"on\s+page\s+158\s+of\s+the\s+Player[’']s\s+Handbook\b",
        re.I,
    )),
    ("shadow-conjuration-arbitrary-spell-inheritance", re.compile(
        r"\bcan\s+mimic\s+any\s+sorcerer\s+or\s+wizard\s+conjuration\s*"
        r"\(\s*(?:summoning|creation)\s*\)\s+or\s+conjuration\s*"
        r"\(\s*(?:creation|summoning)\s*\)\s+spell\s+of\s+\d+(?:st|nd|rd|th)\s+"
        r"level\s+or\s+lower\b",
        re.I,
    )),
    ("stored-lightning-bolt-inheritance", re.compile(
        r"\binitial\s+strike\s+does\s+damage\b[^.]{0,120}\bas\s+a\s+lightning\s+bolt\s+spell\b|"
        r"\bdamages\s+objects\s*,?\s+just\s+as\s+a\s+normal\s+lightning\s+bolt\b",
        re.I,
    )),
    ("telekinesis-combat-maneuver-inheritance", re.compile(
        r"\bperform\s+a\s+bull\s+rush\s*,\s*disarm\s*,\s*grapple\s*"
        r"\(\s*including\s+pin\s*\)\s*,\s*or\s+trip\b.{0,120}?"
        r"\bResolve\s+these\s+attempts\s+as\s+normal\b",
        re.I | re.S,
    )),
    ("polymorph-other-creature-stat-inheritance", re.compile(
        r"\bcreature\s+acquires\s+the\s+physical\s+and\s+natural\s+abilities\s+of\s+"
        r"the\s+creature\s+it\s+has\s+been\s+polymorphed\s+into\b",
        re.I,
    )),
    ("phantom-wolf-feat-package-dependency", re.compile(
        r"\bSkills\s+and\s+Feats\s*:\s*Listen\s+\+20\s*,\s*Spot\s+\+20\s*;\s*"
        r"Alertness\s*,\s*Dodge\s*,\s*Combat\s+Reflexes\s*,\s*Mobility\s*,\s*"
        r"Weapon\s+Focus\s*\(\s*bite\s*\)",
        re.I,
    )),
    ("spider-plague-traits-web-dependency", re.compile(
        r"\bSA\s+poison\s*,\s*web\s*,\s*smite\s+(?:evil|good)\s*;\s*"
        r"SQ\s+vermin\s+traits\b",
        re.I,
    )),
    ("prying-eyes-construct-traits-dependency", re.compile(
        r"\bEach\s+eye\s+is\s+a\s+Fine\s+construct\b.{0,260}?\b1\s+hit\s+point\b",
        re.I | re.S,
    )),

)


def external_mechanics_reasons(effect_source: str) -> list[str]:
    reasons = []
    for label, pattern in EXTERNAL_MECHANICS_PATTERNS:
        if pattern.search(effect_source or ""):
            reasons.append(label)
    return sorted(set(reasons))


SUSPICIOUS_PATTERNS = (
    ("missing-content-marker", re.compile(r"\[?missing content in source\]?", re.I)),
    ("missing-table-reference", re.compile(
        r"\b(?:see|following|accompanying)\s+(?:the\s+)?table\b|\btable\s+(?:below|above)\b",
        re.I,
    )),
    ("omitted-stat-block-reference", re.compile(
        r"\b(?:statistics|stat)\s+block\b.*\b(?:below|following)\b",
        re.I,
    )),
    ("suspicious-fp-unit", re.compile(r"\b\d[\d,]*\s+fp\b", re.I)),
    ("malformed-dice-notation", re.compile(r"\b(?:l|I)d\d+\b")),
    ("malformed-talons-source", re.compile(r"\byout\s+other\b|\bconsidered\s+arms\b", re.I)),
    ("garbled-last-judgment-source", re.compile(r"\band\s+resurrection\s+is\s+cast\.\s*$", re.I)),
    ("contradictory-vulnerability-scaling", re.compile(
        r"\bevery four caster levels beyond 9th\b.*"
        r"\breduction of 10 at caster level 15th\b.*"
        r"\breduction of 15 at caster level 19th\b",
        re.I | re.S,
    )),
    ("missing-skull-eyes-effects", re.compile(
        r"\bgaze attack may have either of two effects,\s*as follows\b",
        re.I,
    )),
    ("embedded-html-markup", re.compile(
        r"<\/?(?:em|strong|i|b|span)\b[^>]*>",
        re.I,
    )),
    ("missing-plus-before-bonus", re.compile(
        r"\(\s+\d+\s+(?:armor|natural\s+armor|deflection|enhancement|morale|sacred|profane|resistance|luck|insight|competence)\s+bonus\b",
        re.I,
    )),
    ("garbled-nightstalker-transformation", re.compile(
        r"\bcat[’']s grace\s*,\s*which you drink\b",
        re.I,
    )),
    ("garbled-phantasmal-thief-source", re.compile(
        r"\bEven\s+objects\s+in\s+a\s+Improved\s+Disarm\s+feat\b",
        re.I,
    )),
    ("truncated-nether-trail-source", re.compile(
        r"\bEvil outsider must make its saving throw first\b",
        re.I,
    )),
    ("garbled-spell-matrix-lesser-source", re.compile(
        r"\bOnly a spell that can be altered by the antimagic field\s*,\s*"
        r"the duration of the matrix is interrupted\b",
        re.I,
    )),
    ("undead-torch-unspecified-residual-damage", re.compile(
        r"\bcontinues to burn at the location of its destruction\b[^.]*"
        r"\bcreatures that pass through that area take damage\.",
        re.I,
    )),
    ("missing-following-modifier-block", re.compile(
        r"\bThe following modifiers are used in place of those given on page\s+\d+\s+"
        r"of the Player[’']s Handbook\.\s*(?:The caster|If|Material Component:)",
        re.I,
    )),
    ("garbled-nystuls-magic-aura-source", re.compile(
        r"\bmake\s+a\s+\+\d+\s+identify\s+cast\s+on\s+it\b",
        re.I,
    )),
    ("garbled-shadow-well-source", re.compile(
        r"\bBeings\s+unable\s+to\s+flee\s+cove\.\b|\bupo\s+leaving\b",
        re.I,
    )),
    ("missing-minus-jade-strike-penalty", re.compile(
        r"\bsuffers\s+a\s+4\s+penalty\s+on\s+most\s+Strength\s+and\s+Dexterity-based\s+skills\b",
        re.I,
    )),
    ("missing-malebranche-size-damage-table", re.compile(
        r"\bdeals\s+extra\s+damage\s+whenever\s+it\s+successfully\s+hits\s+with\s+a\s+charge\s+attack\s*,?\s*"
        r"depending\s+on\s+its\s+size\.\s*In\s+addition\b",
        re.I,
    )),
    ("garbled-otyugh-pounds-source", re.compile(
        r"\bat\s+least\s+6,000\s+ounds\s+of\s+(?:sewage|refuse|offal)\b",
        re.I,
    )),
    ("garbled-hidden-ward-source", re.compile(
        r"\bprevent\s+subicion\s+by\s+the\s+players\b|"
        r"\bby\s+one-half\s+you\s+caster\s+level\b",
        re.I,
    )),
    ("self-slowed-condition-shorthand", re.compile(
        r"\byou\s+are\s+slowed\s+for\s+\d+d\d+\s+rounds\b",
        re.I,
    )),
    ("missing-minus-blinded-skill-penalty", re.compile(
        r"\bsuffers\s+a\s+4\s+penalty\s+on\s+most\s+"
        r"Strength\s+and\s+Dexterity-based\s+skill\s+checks\b",
        re.I,
    )),
    ("missing-cerulean-sign-effect-table", re.compile(
        r"\bonce\s+a\s+creature\s+recovers\s+from\s+an\s+effect\s*,?\s+"
        r"it\s+moves\s+up\s+one\s+level\s+on\s+the\s+table\b",
        re.I,
    )),
    ("missing-reality-maelstrom-plane-sidebar", re.compile(
        r"\bsend(?:s|ing)?\s+them\s+to\s+a\s+random\s+plane\s*\(\s*see\s+sidebar\s*\)",
        re.I,
    )),

)


def load_json(path: Path, default):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default


def normalize_name(value: str) -> str:
    value = d35.clean(value or "").casefold().replace("’", "'").replace(chr(96), "'")
    value = re.sub(r"['\"]", "", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return " ".join(value.split())


def name_aliases(name: str) -> set[str]:
    aliases = {normalize_name(name)}
    if "," in (name or ""):
        left, right = [part.strip() for part in name.split(",", 1)]
        if left and right:
            aliases.add(normalize_name(f"{right} {left}"))
    return {alias for alias in aliases if alias}


def clean_reference_name(value: str) -> str:
    value = d35.clean(value or "")
    value = re.sub(r"\s*\(\s*(?:see\b|p(?:age)?\.?\b|ph\b)[^)]*\)\s*$", "", value, flags=re.I)
    value = re.sub(r"^\d+(?:st|nd|rd|th)-level\s+(?:spell\s+)?", "", value, flags=re.I)
    # Strip grammatical "the"/"the spell" prefixes, but preserve a real
    # spell name beginning with "Spell" (for example, Spell Resistance).
    # Ambiguous bare "spell <name>" prose now fails closed instead of silently
    # truncating a legitimate catalog name.
    value = re.sub(r"^the\s+(?:spell\s+)?", "", value, flags=re.I)
    value = re.sub(r"^(?:a|an)\s+", "", value, flags=re.I)
    value = re.sub(r"\s+spell$", "", value, flags=re.I)
    return d35.clean(value.strip(" ,;:-"))

def extract_reference_names(effect_source: str) -> list[str]:
    found = []
    for pattern in REFERENCE_PATTERNS:
        for match in pattern.finditer(effect_source or ""):
            name = clean_reference_name(match.group("name"))
            if not name or normalize_name(name) in {"splash weapon", "weapon", "spell"}:
                continue
            if name not in found:
                found.append(name)
    return found


def source_sha(text: str) -> str:
    return d35.spell_effect_digest(text or "")


def table_sha(tables) -> str:
    return d35.spell_tables_digest(tables or [])


def near_family_key(text: str) -> str:
    value = d35.clean(text or "").casefold()
    value = re.sub(r"\b\d+d\d+(?:[+-]\d+)?\b", "<dice>", value)
    value = re.sub(r"\b\d[\d,]*(?:\.\d+)?\b", "<n>", value)
    value = re.sub(
        r"\b(?:gp|sp|cp|pp|xp|feet|foot|ft|miles?|rounds?|minutes?|hours?|days?)\b",
        "<unit>",
        value,
    )
    value = re.sub(r"[^a-z<>]+", " ", value)
    value = " ".join(value.split())
    if len(value) < 120:
        return ""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def build_catalog_indexes(rows: list[dict]):
    by_id = {}
    by_alias = defaultdict(list)
    for row in rows:
        if row.get("id"):
            by_id[row["id"]] = row
        for alias in name_aliases(row.get("name", "")):
            by_alias[alias].append(row)
    return by_id, by_alias


def suspicious_reasons(entry: dict) -> list[str]:
    text = entry.get("effectSource") or ""
    tables = entry.get("tables") or []
    reasons = []
    if entry.get("sourceIncomplete"):
        reasons.append(entry.get("sourceIncompleteMarker") or "parser-source-incomplete")
    for label, pattern in SUSPICIOUS_PATTERNS:
        if not pattern.search(text):
            continue
        if label == "missing-table-reference" and tables:
            continue
        reasons.append(label)
    if re.search(r"\bsee below\b", text, re.I) and not tables:
        match = re.search(r"\bsee below\b", text, re.I)
        if match and len(text[match.end():].strip()) < 100:
            reasons.append("see-below-without-content")
    if text.count("(") != text.count(")"):
        reasons.append("unbalanced-parentheses")
    if text.count("[") != text.count("]"):
        reasons.append("unbalanced-brackets")
    tail = text.rstrip()
    if len(tail) > 240 and not re.search(r"[.!?)}\]]$", tail):
        if re.search(
            r"\b(?:the|a|an|and|or|of|to|for|with|by|from|as|that|which|than|if|when)\s*$",
            tail,
            re.I,
        ):
            reasons.append("possible-mid-clause-truncation")
    return sorted(set(reasons))


def fetch_spell_packet(row: dict, delay: float) -> dict:
    raw = d35.fetch(row["url"], delay)
    parser = d35.DetailParser()
    parser.feed(raw)
    parser.close()
    details = d35.parse_spell(parser, row)
    effect_source = d35.spell_description_text(parser)
    return {
        "id": row.get("id"),
        "name": row.get("name"),
        "url": row.get("url"),
        "sourceBook": details.get("sourceBook"),
        "sourceSha256": source_sha(effect_source),
        "tablesSha256": table_sha(parser.tables) if parser.tables else None,
        "tables": parser.tables,
        "effectSource": effect_source,
        "header": {
            "school": details.get("school"),
            "castingTime": details.get("casting_time"),
            "components": details.get("components") or [],
            "range": details.get("range"),
            "target": details.get("target"),
            "area": details.get("area"),
            "duration": details.get("duration"),
            "savingThrow": details.get("savingThrow"),
            "spellResistance": details.get("spellResistance"),
            "descriptors": details.get("descriptors") or [],
        },
        "effectSummary": details.get("effectSummary"),
        "effectReviewVerified": bool(details.get("effectReviewVerified")),
        "effectReferenceDependent": bool(details.get("effectReferenceDependent")),
        "sourceIncomplete": bool(details.get("sourceIncomplete")),
        "sourceIncompleteResolved": bool(details.get("sourceIncompleteResolved")),
        "sourceIncompleteMarker": details.get("sourceIncompleteMarker"),
        "supplementVerified": bool(details.get("supplementVerified")),
        "effectReviewMismatch": bool(details.get("effectReviewMismatch")),
        "effectReviewTableMismatch": bool(details.get("effectReviewTableMismatch")),
    }


def resolve_reference_tree(
    reference_name: str,
    by_alias: dict[str, list[dict]],
    delay: float,
    cache: dict[str, dict],
    source_book: str | None = None,
    active: tuple[str, ...] = (),
    depth: int = 0,
    max_depth: int = 8,
) -> dict:
    alias = normalize_name(reference_name)
    candidates = by_alias.get(alias, [])
    result = {
        "referenceName": reference_name,
        "normalizedReferenceName": alias,
        "candidateIds": [row.get("id") for row in candidates],
    }
    if not candidates:
        result["status"] = "missing"
        return result
    if len(candidates) != 1 and d35.clean(source_book or ""):
        source_key = d35.clean(source_book or "").casefold()
        source_matches = []
        candidate_books = {}
        for candidate in candidates:
            candidate_id = candidate.get("id")
            if candidate_id not in cache:
                cache[candidate_id] = fetch_spell_packet(candidate, delay)
            candidate_packet = cache[candidate_id]
            candidate_book = d35.clean(candidate_packet.get("sourceBook") or "")
            candidate_books[candidate_id] = candidate_book
            if candidate_book.casefold() == source_key:
                source_matches.append(candidate)
        result["allCandidateIds"] = [row.get("id") for row in candidates]
        result["candidateSourceBooks"] = candidate_books
        if len(source_matches) == 1:
            candidates = source_matches
            result["candidateIds"] = [source_matches[0].get("id")]
            result["resolutionBasis"] = "unique-sourcebook-match"
    if len(candidates) != 1:
        result["status"] = "ambiguous"
        result["candidates"] = [
            {"id": row.get("id"), "name": row.get("name"), "url": row.get("url")}
            for row in candidates
        ]
        return result
    row = candidates[0]
    record_id = row.get("id")
    if record_id in active:
        result["status"] = "cycle"
        result["cycle"] = list(active) + [record_id]
        return result
    if depth >= max_depth:
        result["status"] = "max-depth"
        return result
    if record_id not in cache:
        cache[record_id] = fetch_spell_packet(row, delay)
    packet = cache[record_id]
    result["status"] = "resolved"
    result["record"] = packet
    nested_names = extract_reference_names(packet.get("effectSource") or "")
    if nested_names:
        result["references"] = [
            resolve_reference_tree(
                nested,
                by_alias,
                delay,
                cache,
                source_book=packet.get("sourceBook"),
                active=active + (record_id,),
                depth=depth + 1,
                max_depth=max_depth,
            )
            for nested in nested_names
        ]
    return result


def flatten_resolution_status(tree: dict) -> Counter:
    out = Counter([tree.get("status") or "unknown"])
    for child in tree.get("references") or []:
        out.update(flatten_resolution_status(child))
    return out


def validate_known_corpus(
    summaries: dict,
    supplements: dict,
    regression_ids: set[str],
    queue_entries: list[dict],
) -> dict:
    reviews = summaries.get("entries") or {}
    supplements_by_id = supplements.get("entries") or {}
    errors = []
    warnings = []
    bad_source_sha = [
        record_id
        for record_id, review in reviews.items()
        if not re.fullmatch(r"[0-9a-f]{64}", d35.clean(review.get("sourceSha256", "")))
    ]
    bad_table_sha = [
        record_id
        for record_id, review in reviews.items()
        if review.get("tablesSha256")
        and not re.fullmatch(r"[0-9a-f]{64}", d35.clean(review.get("tablesSha256", "")))
    ]
    if bad_source_sha:
        errors.append(f"{len(bad_source_sha)} reviewed summaries have invalid sourceSha256")
    if bad_table_sha:
        errors.append(f"{len(bad_table_sha)} reviewed summaries have invalid tablesSha256")
    missing_repair_fixtures = sorted(
        record_id
        for record_id in KNOWN_REPAIR_FIXTURES
        if record_id not in regression_ids or record_id not in supplements_by_id
    )
    if missing_repair_fixtures:
        errors.append(
            "known repair fixtures missing regression/supplement coverage: "
            + ", ".join(missing_repair_fixtures)
        )
    missing_reference_fixtures = sorted(
        record_id for record_id in KNOWN_REFERENCE_FIXTURES if record_id not in reviews
    )
    if missing_reference_fixtures:
        errors.append(
            "known reference fixtures missing reviewed-summary coverage: "
            + ", ".join(missing_reference_fixtures)
        )
    queue_by_id = {entry.get("id"): entry for entry in queue_entries}
    overlap = sorted(set(queue_by_id) & set(reviews))
    unexpected_overlap = [
        record_id
        for record_id in overlap
        if not (
            queue_by_id[record_id].get("effectReviewMismatch")
            or queue_by_id[record_id].get("effectReviewTableMismatch")
        )
    ]
    if unexpected_overlap:
        errors.append(
            f"{len(unexpected_overlap)} digest-locked reviewed entries were unexpectedly requeued"
        )
    drift_overlap = sorted(set(overlap) - set(unexpected_overlap))
    if drift_overlap:
        warnings.append(
            f"{len(drift_overlap)} reviewed entries requeued due to source/table digest drift"
        )
    return {
        "reviewCount": len(reviews),
        "regressionCount": len(regression_ids),
        "supplementCount": len(supplements_by_id),
        "tableLockedReviewCount": sum(
            1 for review in reviews.values() if review.get("tablesSha256")
        ),
        "knownRepairFixtureCount": len(KNOWN_REPAIR_FIXTURES),
        "knownReferenceFixtureCount": len(KNOWN_REFERENCE_FIXTURES),
        "reviewQueueOverlapCount": len(overlap),
        "digestDriftOverlapCount": len(drift_overlap),
        "errors": errors,
        "warnings": warnings,
    }


def validate_live_fixtures(by_id: dict[str, dict], delay: float) -> dict:
    errors = []
    reference_results = []
    repair_results = []
    for record_id in sorted(KNOWN_REFERENCE_FIXTURES):
        row = by_id.get(record_id)
        if not row:
            errors.append(f"missing known reference fixture: {record_id}")
            continue
        try:
            packet = fetch_spell_packet(row, delay)
        except Exception as exc:
            errors.append(f"reference fixture fetch failed for {record_id}: {exc}")
            continue
        names = extract_reference_names(packet.get("effectSource") or "")
        recognized = bool(names)
        reference_results.append({
            "id": record_id,
            "name": packet.get("name"),
            "recognizedReferenceDependent": recognized,
            "parserReferenceDependent": bool(packet.get("effectReferenceDependent")),
            "referenceNames": names,
        })
        if not recognized:
            errors.append(f"known reference-dependent fixture not recognized: {record_id}")
    for record_id in sorted(KNOWN_REPAIR_FIXTURES):
        row = by_id.get(record_id)
        if not row:
            errors.append(f"missing known repair fixture: {record_id}")
            continue
        try:
            packet = fetch_spell_packet(row, delay)
        except Exception as exc:
            errors.append(f"repair fixture fetch failed for {record_id}: {exc}")
            continue
        supplement = (d35.spell_supplements().get(record_id) or {})
        historical_repair = bool(supplement.get("resolvesSourceIncomplete"))
        currently_incomplete = bool(packet.get("sourceIncomplete"))
        supplement_applied = bool(packet.get("supplementVerified"))
        resolved = bool(packet.get("sourceIncompleteResolved"))
        recognized = currently_incomplete or historical_repair
        repair_results.append({
            "id": record_id,
            "name": packet.get("name"),
            "recognizedRepairFixture": recognized,
            "primaryCurrentlySourceIncomplete": currently_incomplete,
            "historicalProvenanceBackedRepair": historical_repair,
            "supplementVerified": supplement_applied,
            "sourceIncompleteResolved": resolved,
            "sourceIncompleteMarker": packet.get("sourceIncompleteMarker"),
        })
        if not recognized:
            errors.append(f"known damaged-source fixture not recognized: {record_id}")
        if historical_repair and not supplement_applied:
            errors.append(f"known repair supplement did not apply: {record_id}")
        if currently_incomplete and historical_repair and not resolved:
            errors.append(f"current source defect was not marked resolved: {record_id}")
    return {
        "referenceFixtures": reference_results,
        "repairFixtures": repair_results,
        "errors": errors,
    }


def queue_id_to_sha(entries: list[dict], record_id: str) -> str:
    for entry in entries:
        if entry.get("id") == record_id:
            return entry.get("sourceSha256") or source_sha(entry.get("effectSource") or "")
    return ""


def classify_queue(
    queue_entries: list[dict],
    summaries: dict,
    supplements: dict,
    regression_ids: set[str],
    by_alias: dict[str, list[dict]],
    delay: float,
    max_reference_depth: int,
    resolve_references: bool,
):
    reviews = summaries.get("entries") or {}
    supplements_by_id = supplements.get("entries") or {}
    source_groups = defaultdict(list)
    review_unit_groups = defaultdict(list)
    near_groups = defaultdict(list)
    for entry in queue_entries:
        digest = entry.get("sourceSha256") or source_sha(entry.get("effectSource") or "")
        tables_digest = entry.get("tablesSha256") or (
            table_sha(entry.get("tables")) if entry.get("tables") else ""
        )
        entry["sourceSha256"] = digest
        entry["tablesSha256"] = tables_digest or None
        entry["_reviewUnitKey"] = digest + ":" + (tables_digest or "-")
        source_groups[digest].append(entry.get("id"))
        review_unit_groups[entry["_reviewUnitKey"]].append(entry.get("id"))
        family = near_family_key(entry.get("effectSource") or "")
        if family:
            near_groups[family].append(entry.get("id"))

    exact_multi = {
        key: ids for key, ids in review_unit_groups.items() if len(ids) > 1
    }
    near_multi = {
        key: ids
        for key, ids in near_groups.items()
        if len(ids) > 1
        and len({queue_id_to_sha(queue_entries, record_id) for record_id in ids}) > 1
    }

    cache = {}
    classified = []
    reference_packets = []
    resolution_counts = Counter()
    for entry in queue_entries:
        record_id = entry.get("id")
        source = entry.get("effectSource") or ""
        tags = set()
        reasons = suspicious_reasons(entry)
        external_reasons = external_mechanics_reasons(source)
        reference_names = extract_reference_names(source)
        self_aliases = name_aliases(entry.get("name") or "")
        reference_names = [
            name
            for name in reference_names
            if not (name_aliases(clean_reference_name(name)) & self_aliases)
        ]
        if record_id in reviews:
            tags.add("already-reviewed")
        supplement = supplements_by_id.get(record_id) or {}
        if supplement:
            tags.add("existing-supplement")
            if supplement.get("resolvesSourceIncomplete"):
                tags.add("historical-source-repair")
        if record_id in regression_ids:
            tags.add("existing-regression")
        if reasons:
            tags.add("suspected-damaged-source")
        parser_reference = bool(entry.get("effectReferenceDependent")) and not re.search(
            r"\\b(?:functions?|works?|operates?)\\s+as\\s+though\\b",
            source,
            re.I,
        )
        if reference_names or parser_reference or external_reasons:
            tags.add("reference-dependent")
        if external_reasons:
            tags.add("external-mechanics-reference")
            tags.add("manual-verification-required")
        if entry.get("tables"):
            tags.add("table-driven")
        if len(source_groups[entry["sourceSha256"]]) > 1:
            tags.add("same-source-sha-family")
        if len(review_unit_groups[entry["_reviewUnitKey"]]) > 1:
            tags.add("exact-duplicate-effect")
        family = near_family_key(source)
        if family and family in near_multi:
            tags.add("near-duplicate-family")

        ref_trees = []
        if "reference-dependent" in tags and resolve_references:
            if reference_names:
                ref_trees = [
                    resolve_reference_tree(
                        name,
                        by_alias,
                        delay,
                        cache,
                        source_book=entry.get("sourceBook"),
                        max_depth=max_reference_depth,
                    )
                    for name in reference_names
                ]
            else:
                ref_trees = [{
                    "referenceName": None,
                    "status": "unparsed-reference",
                    "candidateIds": [],
                }]
            statuses = Counter()
            for tree in ref_trees:
                statuses.update(flatten_resolution_status(tree))
            resolution_counts.update(statuses)
            if any(
                statuses[key]
                for key in ("missing", "ambiguous", "cycle", "max-depth", "unparsed-reference")
            ):
                tags.add("manual-verification-required")
            reference_packets.append({
                "id": record_id,
                "name": entry.get("name"),
                "url": entry.get("url"),
                "sourceSha256": entry["sourceSha256"],
                "effectSource": source,
                "references": ref_trees,
                "resolutionStatusCounts": dict(statuses),
            })
        elif "reference-dependent" in tags:
            tags.add("manual-verification-required")

        if "suspected-damaged-source" in tags or "historical-source-repair" in tags:
            primary = "repair-queue"
            tags.add("manual-verification-required")
        elif "reference-dependent" in tags:
            primary = "reference-dependent"
        elif "exact-duplicate-effect" in tags:
            primary = "exact-duplicate-effect"
        elif "near-duplicate-family" in tags:
            primary = "near-duplicate-family"
        elif "table-driven" in tags:
            primary = "table-driven-effect"
        else:
            primary = "clean-standalone-long-effect"

        review_unit_key = entry.pop("_reviewUnitKey")
        classified.append({
            "id": record_id,
            "name": entry.get("name"),
            "url": entry.get("url"),
            "sourceBook": entry.get("sourceBook"),
            "sourceSha256": entry["sourceSha256"],
            "tablesSha256": entry.get("tablesSha256"),
            "primaryBucket": primary,
            "tags": sorted(tags),
            "suspiciousReasons": reasons,
            "externalMechanicsReasons": external_reasons,
            "referenceNames": reference_names,
            "exactDuplicateIds": sorted(review_unit_groups[review_unit_key]),
            "sameSourceShaIds": sorted(source_groups[entry["sourceSha256"]]),
            "nearDuplicateIds": (
                sorted(near_groups[family]) if family and family in near_multi else []
            ),
        })

    exact_families = []
    for review_unit_key, ids in exact_multi.items():
        source_digest, tables_digest = review_unit_key.split(":", 1)
        exact_families.append({
            "sourceSha256": source_digest,
            "tablesSha256": None if tables_digest == "-" else tables_digest,
            "recordIds": sorted(ids),
            "size": len(ids),
        })
    exact_families.sort(
        key=lambda item: (-item["size"], item["sourceSha256"], item.get("tablesSha256") or "")
    )
    near_families = [
        {"familySha256": key, "recordIds": sorted(ids), "size": len(ids)}
        for key, ids in near_multi.items()
    ]
    near_families.sort(key=lambda item: (-item["size"], item["familySha256"]))
    primary_counts = Counter(item["primaryBucket"] for item in classified)
    tag_counts = Counter(tag for item in classified for tag in item["tags"])
    report = {
        "queueCount": len(classified),
        "primaryBucketCounts": dict(sorted(primary_counts.items())),
        "tagCounts": dict(sorted(tag_counts.items())),
        "uniqueSourceShaCount": len(source_groups),
        "sameSourceShaFamilyCount": sum(
            1 for ids in source_groups.values() if len(ids) > 1
        ),
        "exactDuplicateFamilyCount": len(exact_families),
        "nearDuplicateFamilyCount": len(near_families),
        "deduplicatedReviewUnitCount": len(review_unit_groups),
        "manualVerificationCount": tag_counts.get("manual-verification-required", 0),
        "referenceResolutionStatusCounts": dict(sorted(resolution_counts.items())),
        "exactDuplicateFamilies": exact_families,
        "nearDuplicateFamilies": near_families,
        "entries": sorted(
            classified,
            key=lambda item: (
                item["primaryBucket"],
                (item["name"] or "").casefold(),
                item["id"] or "",
            ),
        ),
    }
    reference_report = {
        "referencePacketCount": len(reference_packets),
        "entries": sorted(
            reference_packets,
            key=lambda item: ((item["name"] or "").casefold(), item["id"] or ""),
        ),
    }
    return report, reference_report


def run_self_test() -> None:
    same_name_rows = [
        {"id": "spells/shared-a", "name": "Shared Spell", "url": "https://example.invalid/a"},
        {"id": "spells/shared-b", "name": "Shared Spell", "url": "https://example.invalid/b"},
    ]
    same_name_cache = {
        "spells/shared-a": {
            "id": "spells/shared-a",
            "name": "Shared Spell",
            "sourceBook": "Book A",
            "effectSource": "A self-contained effect.",
        },
        "spells/shared-b": {
            "id": "spells/shared-b",
            "name": "Shared Spell",
            "sourceBook": "Book B",
            "effectSource": "Another self-contained effect.",
        },
    }
    source_matched = resolve_reference_tree(
        "Shared Spell",
        {"shared spell": same_name_rows},
        0,
        same_name_cache,
        source_book="Book B",
    )
    assert source_matched["status"] == "resolved"
    assert source_matched["record"]["id"] == "spells/shared-b"
    assert source_matched["candidateIds"] == ["spells/shared-b"]
    assert source_matched["allCandidateIds"] == ["spells/shared-a", "spells/shared-b"]
    assert source_matched["resolutionBasis"] == "unique-sourcebook-match"
    still_ambiguous = resolve_reference_tree(
        "Shared Spell",
        {"shared spell": same_name_rows},
        0,
        same_name_cache,
        source_book="Book C",
    )
    assert still_ambiguous["status"] == "ambiguous"

    assert extract_reference_names(
        "This spell functions like arcane eye, except it lasts longer."
    ) == ["arcane eye"]
    assert extract_reference_names(
        "This spell functions as teleport, greater, but only you can travel."
    ) == ["teleport, greater"]
    assert extract_reference_names(
        "As geas/quest, except the casting time is 1 round."
    ) == ["geas/quest"]
    assert extract_reference_names("The weapon functions as if cast by you.") == []
    assert extract_reference_names("The spell functions as though cast from the eye.") == []
    assert extract_reference_names(
        "Any scrying sees an image (as the major image spell)."
    ) == ["major image"]
    assert extract_reference_names(
        "You transport the target as greater teleport."
    ) == ["greater teleport"]
    assert extract_reference_names(
        "Glass Creature: As flesh to stone (PH 232), but the subject becomes glass."
    ) == ["flesh to stone"]
    assert extract_reference_names(
        "This spell is the same as reincarnate, except it works longer."
    ) == ["reincarnate"]
    assert extract_reference_names("If used on undead, harm acts like heal.") == ["heal"]
    assert "cure critical wounds" in extract_reference_names(
        "The first charge functions as a cure critical wounds spell."
    )
    assert "hallow" in extract_reference_names(
        "The chorus grants the effect of a hallow spell."
    )
    assert "hold monster" in extract_reference_names(
        "The gaze immobilizes the target as if affected by a hold monster spell."
    )
    assert "cloudkill" in extract_reference_names(
        "As with a cloudkill spell, the smoke moves away from you."
    )
    assert extract_reference_names(
        "The smoke obscures all sight as a fog cloud does."
    ) == ["fog cloud"]
    assert extract_reference_names(
        "As with fog cloud, wind disperses the smoke."
    ) == ["fog cloud"]
    assert extract_reference_names(
        "If unnatural forces affect the weather, weather eye reveals as much information as a detect magic spell."
    ) == ["detect magic"]
    assert extract_reference_names(
        "If the subject is delaying, it acts as soon as the spell is cast."
    ) == []
    assert extract_reference_names(
        "If you do not wield it, the weapon behaves as if unaffected by this spell."
    ) == []
    assert clean_reference_name("4th-level spell arcane eye") == "arcane eye"
    assert clean_reference_name("arcane eye spell (see page 200)") == "arcane eye"
    assert clean_reference_name("spell resistance (PH 282)") == "spell resistance"
    assert clean_reference_name("the spell arcane eye") == "arcane eye"
    assert extract_reference_names(
        "This spell functions like spell resistance (PH 282), except as noted here."
    ) == ["spell resistance"]
    assert "polymorph-subschool-reference" in external_mechanics_reasons("For details, see The Polymorph Subschool on page 60.")
    assert "referenced-creature-stat-block" in external_mechanics_reasons("The tentacle is equivalent to a giant constrictor snake (MM 280) except that it obeys you.")
    assert extract_reference_names(
        "This spell works identically to arcane lock, except attuned creatures can pass."
    ) == ["arcane lock"]
    assert "works-identically-to-spell" in external_mechanics_reasons(
        "This spell works identically to arcane lock, except attuned creatures can pass."
    )
    assert extract_reference_names("The replica works identically to the original.") == []
    assert "works-identically-to-spell" not in external_mechanics_reasons(
        "The replica works identically to the original."
    )
    assert external_mechanics_reasons("These strands are identical with those created by the web spell, except they regrow.") == ["embedded-spell-mechanics"]
    assert "leading-inherited-spell" in external_mechanics_reasons("As the alarm spell, and in addition this affects coterminous planes.")
    assert "generic-identical-with" in external_mechanics_reasons("This is identical with deathwatch, but only functions on animals and plants.")
    assert "granted-spell-effect" in external_mechanics_reasons("The animal gains a bonus plus the effect of a haste spell.")
    assert "external-page-reference" in external_mechanics_reasons("See page 297 for the inherited servant rules.")
    assert "activated-named-effect-as-spell" in external_mechanics_reasons("You can activate a feather fall effect (as the spell) on yourself.")
    assert "activated-named-effect-as-spell" not in external_mechanics_reasons("You can activate a protective effect on yourself.")
    assert "external-rules-detailed-page-reference" in external_mechanics_reasons("Truename research rules are detailed on page 196.")
    assert "external-rules-detailed-page-reference" not in external_mechanics_reasons("The rules are detailed in the spell text below.")
    assert "external-rulebook-section" in external_mechanics_reasons("See Sacrifices in Chapter 2 for the required DCs.")
    assert "external-described-page-reference" in external_mechanics_reasons("As described on page 76 of the Dungeon Master's Guide, the mold deals damage.")
    assert "external-rules-sidebar-reference" in external_mechanics_reasons("You gain the drawbacks, as outlined in the Incorporeal Subtype sidebar.")
    assert "external-described-page-reference" not in external_mechanics_reasons("The page turns as you read it.")
    assert "external-rules-sidebar-reference" not in external_mechanics_reasons("The sidebar contains decorative artwork.")
    assert "numbered-table-reference" in external_mechanics_reasons("Add +30% to the roll on Table 2-2: Portal Malfunction.")
    assert "similar-spell-effect" in external_mechanics_reasons("The creatures are paralyzed, similar to the effect of hold person.")
    assert "external-monster-manual-reference" in external_mechanics_reasons("Use the creature statistics in MM 52.")
    assert "external-monster-manual-reference" in external_mechanics_reasons("See the Monster Manual for the swarm statistics.")
    assert "external-monster-manual-reference" in external_mechanics_reasons("The Monster Manual has statistics for the rat swarm.")
    assert "as-with-named-spell" in external_mechanics_reasons("You restore life to a dead outsider as with the raise dead spell.")
    assert "as-with-named-spell" not in external_mechanics_reasons("As with any darkness spell, the effect can be suppressed.")
    assert "fog-cloud-as-does-inheritance" in external_mechanics_reasons("The smoke obscures all sight as a fog cloud does.")
    assert "as-with-fog-cloud-inheritance" in external_mechanics_reasons("As with fog cloud, wind disperses the smoke.")
    assert "as-per-named-spell" in external_mechanics_reasons("The glow provides light as per the light spell.")
    assert "leading-like-named-spell" in external_mechanics_reasons("Like shield other, this spell transfers some wounds.")
    assert "functions-much-like-spell" in external_mechanics_reasons("This spell functions much like the sanctuary spell.")
    assert "named-spell-benefit" in external_mechanics_reasons("The subjects gain the benefits of a bless spell.")
    assert "named-spell-benefit" not in external_mechanics_reasons("Creatures receive the benefits of this spell.")
    assert "receives-heal-spell-inheritance" in external_mechanics_reasons("One round later, the target receives a heal spell.")
    assert "receives-heal-spell-inheritance" not in external_mechanics_reasons("The target receives a healing bonus.")
    assert "exactly-like-named-spell" in external_mechanics_reasons("This works exactly like the 1st-level spell sanctuary except for the save DC.")
    assert "received-named-spells" in external_mechanics_reasons("They stick to the path as though they have received spider climb spells.")
    assert "affected-as-though-by-spell" in external_mechanics_reasons("The creature is affected as though by a fear spell.")
    assert "as-though-affected-by-spell" in external_mechanics_reasons("The weapon doubles its threat range as though it were affected by a keen edge spell.")
    assert "similar-to-created-by-spell" in external_mechanics_reasons("The darkness is similar to that created by the deeper darkness spell.")
    assert "targeted-dispel-magic-inheritance" in external_mechanics_reasons("This spell functions as a targeted dispel magic.")
    assert "targeted-dispel-magic-inheritance" not in external_mechanics_reasons("This functions as a splash weapon.")
    assert "weapon-stat-inheritance" in external_mechanics_reasons("The lance is treated in all ways like a +2 shortspear.")
    assert "equivalent-to-named-spell" in external_mechanics_reasons("The armor sheds light equivalent to a daylight spell.")
    assert "similar-to-named-spell-comparison" in external_mechanics_reasons("Similar to status, this spell reports the subject's condition.")
    assert "similar-to-named-spell-comparison" in external_mechanics_reasons("Similar to the divine spell poison, you inflict a toxin.")
    assert "similar-to-named-spell-comparison" in external_mechanics_reasons("This spell is similar to summon monster IX, except it summons one titan.")
    assert "similar-to-named-spell-comparison" in external_mechanics_reasons("Similar to Bigby's grasping hand, this spell creates a claw.")
    assert "similar-to-named-spell-comparison" in external_mechanics_reasons("It serves as a safe haven (similar to project image).")
    assert "similar-to-created-by-named-spell" in external_mechanics_reasons("The pollen is similar to that created by fog cloud, except that it sickens creatures.")
    assert "as-named-spell-does" in external_mechanics_reasons("The effect ends magic as a dispel magic spell does.")
    assert "interacts-like-named-spell" in external_mechanics_reasons("It interacts with other spells just like a wall of force.")
    assert "interacts-like-named-spell" in external_mechanics_reasons("It interacts with other spells just as a wall of force (PH 298) does.")
    assert "servant-conjured-by-named-spell" in external_mechanics_reasons("The shadows act similar to the servant conjured by an unseen servant spell.")
    assert "similar-to-named-spell-comparison" not in external_mechanics_reasons("The structure is similar to a stone archway.")
    assert "equivalent-to-named-spell" not in external_mechanics_reasons("The object is equivalent to a masterwork sword.")
    assert "equivalent-of-named-spell" in external_mechanics_reasons("The illumination is the equivalent of a daylight spell.")
    assert "works-just-like-named-spell" in external_mechanics_reasons("This spell works just like insignia of alarm except the wearers are healed.")
    assert "dispel-magic-effect-inheritance" in external_mechanics_reasons("Anyone passing through becomes the target of a dispel magic effect.")
    assert "equivalent-of-named-spell" not in external_mechanics_reasons("The object has the equivalent of a +2 enhancement bonus.")
    assert "works-just-like-named-spell" not in external_mechanics_reasons("The device works just like normal machinery.")
    assert "green-slime-dmg-dependency" in external_mechanics_reasons("You create a wave of green slime (DMG 76) across the area.")
    assert "green-slime-dmg-dependency" not in external_mechanics_reasons("The spell creates harmless green slime.")
    assert "daylight-dispel-inheritance" in external_mechanics_reasons("The cloak illuminates the area and dispels darkness as a daylight spell.")
    assert "daylight-dispel-inheritance" not in external_mechanics_reasons("The cloak sheds bright daylight.")
    assert "evasion-ability-inheritance" in external_mechanics_reasons("You gain a luck bonus and the evasion ability.")
    assert "evasion-ability-inheritance" not in external_mechanics_reasons("You gain a +2 evasion bonus.")
    assert "bard-feature-inheritance" in external_mechanics_reasons("The subject can function as a bard of one-half your level with respect to bardic music and bardic knowledge.")
    assert "listed-spell-suite-inheritance" in external_mechanics_reasons("You may choose a spell from those listed below once per round and use it as a spell-like ability.")
    assert "manual-of-the-planes-reference" in external_mechanics_reasons("See Manual of the Planes for the gatecrasher ability.")
    assert "dmg-page-reference" in external_mechanics_reasons("The ground becomes dense rubble (DMG 90).")
    assert "dmg-page-reference" not in external_mechanics_reasons("The spell deals 90 points of damage.")
    assert "monster-manual-statistics-dependency" in external_mechanics_reasons("The skeletons have the normal Monster Manual statistics for their kind.")
    assert "monster-manual-statistics-dependency" not in external_mechanics_reasons("The creature resembles a skeleton illustrated in the Monster Manual.")
    assert "prismatic-spray-inheritance" in external_mechanics_reasons("A prismatic bow functions as a +1 prismatic spray.")
    assert "prismatic-spray-inheritance" not in external_mechanics_reasons("The weapon functions as a +1 longsword.")
    assert "glyph-of-warding-inheritance" in external_mechanics_reasons("The marker bears a glyph of warding (blast glyph only).")
    assert "creature-information-page-reference" in external_mechanics_reasons("More information on the aspect of Bahamut can be found on page 152 of this book.")
    assert "creature-information-page-reference" not in external_mechanics_reasons("More information can be found in the spell description itself.")
    assert "created-creature-stat-dependency" in external_mechanics_reasons("This spell creates a wyvern that springs forth from your body.")
    assert "created-creature-stat-dependency" not in external_mechanics_reasons("This spell creates an area in which only good creatures can be magically summoned.")
    assert "created-creature-stat-dependency" not in external_mechanics_reasons("You create the illusion of a pit, and each creature entering it must save.")
    assert "created-creature-stat-dependency" not in external_mechanics_reasons("You create a phantasmal image of the most fearsome creature imaginable.")
    assert "granted-weapon-special-abilities" in external_mechanics_reasons("The weapon gains the keen and flaming burst special abilities.")
    assert "granted-weapon-special-abilities" in external_mechanics_reasons("The weapon bursts into flame, gaining the keen and flaming burst special abilities.")
    assert "granted-named-feat-benefit" in external_mechanics_reasons("The mount gains the benefit of the Run feat.")
    assert "treated-as-magic-equipment" in external_mechanics_reasons("It is treated as +1 mithral breastplate for all purposes.")
    assert "prismatic-spray-beam-inheritance" in external_mechanics_reasons("The target suffers the effect of one of the beams of a prismatic spray spell.")
    assert "lookingglass-spell-inheritance" in external_mechanics_reasons("You can look through it as if you were using clairvoyance.")
    assert "lookingglass-spell-inheritance" in external_mechanics_reasons("You may step through as if affected by teleport without error.")
    assert "named-spell-as-spell-like-ability" in external_mechanics_reasons("You gain Darkvision as a spell-like ability.")
    assert "missing-section-below-reference" in external_mechanics_reasons("Creatures killed are difficult to restore to life (see The Unnamed section below.)")
    assert "glyph-of-warding-inheritance" not in external_mechanics_reasons("The marker bears a warning glyph.")
    assert "functions-as-if-named-spell-cast" in external_mechanics_reasons("She functions as if a raise dead spell had been cast upon her, except she loses no level.")
    assert "functions-as-if-named-spell-cast" not in external_mechanics_reasons("The device functions as if underwater.")
    assert "same-way-as-named-spell" in external_mechanics_reasons("The burst reveals objects in the same way as a true seeing spell.")
    assert "same-way-as-named-spell" not in external_mechanics_reasons("The mirror works in the same way as a polished shield.")
    assert "size-change-spell-inheritance" in external_mechanics_reasons("The target shrinks by one size category, as the reduce person spell.")
    assert "size-change-spell-inheritance" in external_mechanics_reasons("You grow by one size category, as the enlarge person spell.")
    assert "monster-manual-described-stat-dependency" in external_mechanics_reasons("The statuette becomes a Medium-size animated object, as described in the Monster Manual.")
    assert "functions-in-all-respects-like-named-spell" in external_mechanics_reasons("This effect functions in all respects like major image, except that it is a pattern.")
    assert "functions-in-all-respects-like-named-spell" not in external_mechanics_reasons("The device functions in all respects like a normal mirror, except that it is silver.")
    assert "modified-named-spell-reference" in external_mechanics_reasons("The weapon acts as a +5 bless weapon.")
    assert "named-effect-shorthand" in external_mechanics_reasons("Those who succeed gain a true seeing effect.")
    assert "affected-by-shorthand" in external_mechanics_reasons("Those who fail behave as though affected by confusion.")
    assert "external-see-for-details" in external_mechanics_reasons("Failure by 5 or more means it falls; see the Balance skill for details.")
    assert "condition-as-the-spell" in external_mechanics_reasons("A subject who fails a Will save is slowed as the spell.")
    assert "condition-as-the-spell" not in external_mechanics_reasons("The effect lasts as long as the spell remains active.")
    assert "slow-condition-shorthand" in external_mechanics_reasons("The subject is slowed for the spell's duration.")
    assert "slow-condition-shorthand" not in external_mechanics_reasons("Movement is slowed by deep mud.")
    assert "slow-condition-shorthand" in external_mechanics_reasons("A subject that fails a Will save is slowed.")
    assert "external-see-rulebook-reference" in external_mechanics_reasons("The target catches fire; see Catching on Fire in the Dungeon's Master Guide.")
    assert "parenthetical-see-named-spell" in external_mechanics_reasons("The subject is suspended (see the temporal stasis spell) until freed.")
    assert "parenthetical-see-named-spell" not in external_mechanics_reasons("The subject can see and hear itself as if unaffected by the spell.")
    assert "affected-as-if-by-named-spell" in external_mechanics_reasons("The creature is affected as if by a calm emotions spell.")
    assert "affected-as-if-by-named-spell" not in external_mechanics_reasons("The creature is affected as if underwater.")
    assert "as-if-from-named-spell" in external_mechanics_reasons("The undead takes damage as if from a cure minor wounds spell.")
    assert "as-if-from-named-spell" not in external_mechanics_reasons("The target recoils as if from pain.")
    assert "summoned-creature-stat-dependency" in external_mechanics_reasons("You summon a flesh, clay, stone, or iron golem.")
    assert "summoned-creature-stat-dependency" not in external_mechanics_reasons("You summon a handheld musical instrument.")
    assert "summoned-creature-stat-dependency" not in external_mechanics_reasons("You summon an avalanche of snow.")
    assert "parenthetical-see-named-spell" in external_mechanics_reasons("The target is suspended (see the temporal stasis spell) until freed.")
    assert "parenthetical-see-named-spell" not in external_mechanics_reasons("The target can see and hear itself as if unaffected by the spell.")
    assert "affected-as-if-by-named-spell" in external_mechanics_reasons("The creature is affected as if by a calm emotions spell.")
    assert "affected-as-if-by-named-spell" not in external_mechanics_reasons("The creature is affected as if underwater.")
    assert "as-if-from-named-spell" in external_mechanics_reasons("The undead takes damage as if from a cure minor wounds spell.")
    assert "as-if-from-named-spell" not in external_mechanics_reasons("The target recoils as if from pain.")
    assert "summoned-creature-stat-dependency" in external_mechanics_reasons("You summon a flesh, clay, stone, or iron golem.")
    assert "summoned-creature-stat-dependency" not in external_mechanics_reasons("You summon a handheld musical instrument.")
    assert "summoned-creature-stat-dependency" not in external_mechanics_reasons("You summon an avalanche of snow.")

    assert "spell-turning-level-inheritance" in external_mechanics_reasons("The star can turn 1d4+3 spell levels as the spell turning spell.")
    assert "spell-turning-level-inheritance" not in external_mechanics_reasons("The star turns aside attacks with a +3 deflection bonus.")
    assert "receives-named-spell-inheritance" in external_mechanics_reasons("The subject receives a panacea spell (page 152) one round later.")
    assert "receives-named-spell-inheritance" not in external_mechanics_reasons("The subject receives a +2 healing bonus.")
    assert "normal-restrictions-for-named-effect" in external_mechanics_reasons("The caster commands it with the normal restrictions for control undead.")
    assert "normal-restrictions-for-named-effect" not in external_mechanics_reasons("The caster commands it telepathically; it can obey one command at a time.")
    assert "parenthetical-as-the-spell" in external_mechanics_reasons("It emits a magic circle against chaos (as the spell).")
    assert "parenthetical-as-the-spell" not in external_mechanics_reasons("It emits a fully described protective circle.")
    assert "glows-as-named-spell" in external_mechanics_reasons("The point glows as a light spell for the remaining duration.")
    assert "glows-as-named-spell" not in external_mechanics_reasons("The point glows as bright as a torch.")
    assert "normal-weapon-use-inheritance" in external_mechanics_reasons("You can use the whip in combat as if it were a normal whip.")
    assert "normal-weapon-use-inheritance" not in external_mechanics_reasons("You can use the whip in combat with the statistics described here.")
    assert "normal-weapon-type-inheritance" in external_mechanics_reasons("The spectral blade behaves as a normal weapon of its type, with two exceptions.")
    assert "normal-weapon-type-inheritance" not in external_mechanics_reasons("The spectral blade behaves as described below.")
    assert "weapon-transformation-stat-inheritance" in external_mechanics_reasons("A weapon shift spell allows you to temporarily transform any one melee weapon into a different melee weapon.")
    assert "weapon-transformation-stat-inheritance" not in external_mechanics_reasons("The spell transforms a melee weapon into a harmless beam of light.")
    assert "rulebook-modifier-page-reference" in external_mechanics_reasons("The following modifiers are used in place of those given on page 101 of the Player’s Handbook.")
    assert "rulebook-modifier-page-reference" not in external_mechanics_reasons("The following modifiers are +2 during rain and -2 during fog.")
    assert "blessed-weapon-special-effects-dependency" in external_mechanics_reasons("The weapon is considered blessed, which means it has special effects on certain creatures.")
    assert "blessed-weapon-special-effects-dependency" not in external_mechanics_reasons("The weapon is considered good-aligned for the purpose of overcoming damage reduction.")
    assert "targeted-dispel-screen-inheritance" in external_mechanics_reasons("Any spell effect passing through is affected as by a targeted dispel magic at your caster level.")
    assert "targeted-dispel-screen-inheritance" not in external_mechanics_reasons("The screen uses a caster level check against DC 11 + caster level, as fully described here.")
    assert "summon-monster-turn-inheritance" in external_mechanics_reasons("The vipers act on your turn just as creatures summoned by a summon monster spell.")
    assert "summon-monster-turn-inheritance" not in external_mechanics_reasons("The vipers act on your turn and each can move and attack normally.")
    assert "weapon-size-damage-inheritance" in external_mechanics_reasons("While in this stance, you deal damage as if you were one size larger than normal.")
    assert "weapon-size-damage-inheritance" not in external_mechanics_reasons("While in this stance, your attacks deal an extra 1d6 damage.")
    assert "held-touch-spell-delivery-inheritance" in external_mechanics_reasons("This spell also delivers the touch spell to the target as if you had touched it directly.")
    assert "held-touch-spell-delivery-inheritance" not in external_mechanics_reasons("This spell deals 1 point of damage on a successful melee touch attack.")
    assert "evil-outsider-bane-inheritance" in external_mechanics_reasons("Magic weapons with the evil outsider bane special ability have full effect against the subject.")
    assert "evil-outsider-bane-inheritance" not in external_mechanics_reasons("Evil outsiders take 2d6 extra damage from the subject.")
    assert "heavy-armor-movement-inheritance" in external_mechanics_reasons("Tortoise shell slows a creature’s movement as if it were wearing heavy armor.")
    assert "heavy-armor-movement-inheritance" not in external_mechanics_reasons("The creature’s speed becomes 20 feet and its run speed becomes 60 feet.")
    assert "monster-manual-found-statistics" in external_mechanics_reasons("Other statistics for animated objects are found in the Monster Manual.")
    assert "monster-manual-found-statistics" not in external_mechanics_reasons("The object has hardness 5, 30 hit points, and speed 20 feet.")
    assert "resurrection-restoration-inheritance" in external_mechanics_reasons("After 10 minutes, you rise from the ashes as if restored to life by a resurrection spell.")
    assert "resurrection-restoration-inheritance" not in external_mechanics_reasons("After 10 minutes, you rise with 1 hit point and one lost level.")
    assert "protection-from-good-possession-inheritance" in external_mechanics_reasons("The abjuration blocks possession and mental influence, just as protection from good does.")
    assert "protection-from-good-possession-inheritance" not in external_mechanics_reasons("The abjuration blocks possession and grants immunity to charm effects.")
    assert "legacy-ritual-subsystem-inheritance" in external_mechanics_reasons("The target is treated as if it had not performed any of the legacy rituals for its item.")
    assert "legacy-ritual-subsystem-inheritance" not in external_mechanics_reasons("The target loses Greater Legacy, Least Legacy, and Lesser Legacy until it repeats the stated ritual.")
    assert "heroes-feast-benefit-inheritance" in external_mechanics_reasons("Anyone dining here gains benefits identical to those of a heroes’ feast.")
    assert "heroes-feast-benefit-inheritance" not in external_mechanics_reasons("Anyone dining here gains 1d8 temporary hit points and a +1 morale bonus on attacks.")
    assert "faerie-fire-effect-inheritance" in external_mechanics_reasons("Magic items that touch the wall glow with a red faerie fire effect for 1d4+1 rounds.")
    assert "faerie-fire-effect-inheritance" not in external_mechanics_reasons("Magic items glow red for 1d4+1 rounds and shed dim light.")
    assert "incorporeal-subtype-rulebook-inheritance" in external_mechanics_reasons("You can pass through solid objects as described under the incorporeal subtype on page 310 of the Monster Manual.")
    assert "incorporeal-subtype-rulebook-inheritance" not in external_mechanics_reasons("You can pass through solid objects, but not force effects, and cannot attack while inside them.")
    assert "corrosive-grasp-inheritance" in external_mechanics_reasons("The mount takes damage every round as if you were touching it with a corrosive grasp.")
    assert "corrosive-grasp-inheritance" in external_mechanics_reasons("You may make melee touch attacks as if you were using a corrosive grasp spell.")
    assert "corrosive-grasp-inheritance" not in external_mechanics_reasons("Your melee touch attacks deal 1d8 acid damage.")
    assert "lightning-bolt-emulation-inheritance" in external_mechanics_reasons("You can direct two bolts that deal 5d6 electricity damage each, exactly as the lightning bolt spell.")
    assert "lightning-bolt-emulation-inheritance" not in external_mechanics_reasons("You can direct two 120-foot lines that deal 5d6 electricity damage, Reflex half.")
    assert "domain-swap-content-inheritance" in external_mechanics_reasons("You can swap one of your current domains for another that your deity offers. You gain the granted power of the new domain, as well as access to its spells.")
    assert "domain-swap-content-inheritance" not in external_mechanics_reasons("You replace the Strength domain with Healing and gain a +2 bonus on Heal checks.")
    assert "animal-form-trait-inheritance" in external_mechanics_reasons("You gain the same damage reduction you have in animal form, the scent special quality, and the feats you have access to in animal form.")
    assert "animal-form-trait-inheritance" not in external_mechanics_reasons("You gain damage reduction 10/silver, scent out to 30 feet, and a +4 Strength bonus.")
    assert "dmg-small-town-focus-reference" in external_mechanics_reasons("Focus: An abandoned building in a settlement of at least small town size or larger (DUNGEON MASTER ‘S Guide, page 137).")
    assert "dmg-small-town-focus-reference" not in external_mechanics_reasons("Focus: An abandoned building in a settlement of at least small town size or larger.")
    assert "garbled-nystuls-magic-aura-source" in suspicious_reasons({"effectSource":"You could make an ordinary sword register as magical or make a +2 identify cast on it or is similarly examined."})
    assert "garbled-nystuls-magic-aura-source" not in suspicious_reasons({"effectSource":"You could make an ordinary sword register as a +2 vorpal sword to magical detection."})
    assert "garbled-shadow-well-source" in suspicious_reasons({"effectSource":"Beings unable to flee cove. The subject is still afraid upo leaving."})
    assert "garbled-shadow-well-source" not in suspicious_reasons({"effectSource":"Beings unable to flee cower. The subject is still afraid upon leaving."})
    assert "missing-minus-jade-strike-penalty" in suspicious_reasons({"effectSource":"The blinded creature suffers a 4 penalty on most Strength and Dexterity-based skills."})
    assert "missing-minus-jade-strike-penalty" not in suspicious_reasons({"effectSource":"The blinded creature suffers a -4 penalty on most Strength and Dexterity-based skills."})
    assert "missing-malebranche-size-damage-table" in suspicious_reasons({"effectSource":"The subject deals extra damage whenever it successfully hits with a charge attack, depending on its size. In addition, the subject gains resistance to fire 10."})
    assert "missing-malebranche-size-damage-table" not in suspicious_reasons({"effectSource":"The subject deals +2d6 extra damage on a successful charge attack. In addition, it gains resistance to fire 10."})
    assert "good-aligned-special-effects-dependency" in external_mechanics_reasons("A weapon affected by this spell is considered good-aligned, so it has special effects on certain creatures.")
    assert "good-aligned-special-effects-dependency" not in external_mechanics_reasons("A weapon affected by this spell is considered good-aligned for overcoming damage reduction.")
    assert "whip-weapon-rules-inheritance" in external_mechanics_reasons("You wield this weapon as if it were an actual whip and you were proficient with it.")
    assert "whip-weapon-rules-inheritance" in external_mechanics_reasons("It follows all the rules for a whip except that it deals 1d8 lethal damage.")
    assert "whip-weapon-rules-inheritance" not in external_mechanics_reasons("The lash is a ranged touch attack with a 15-foot reach and deals 1d8 electricity damage.")
    assert "otyugh-creation-stat-dependency" in external_mechanics_reasons("Otyughs swarm creates otyughs from a large collection of refuse and filth.")
    assert "otyugh-creation-stat-dependency" not in external_mechanics_reasons("The spell creates a cloud of foul-smelling gas.")
    assert "garbled-otyugh-pounds-source" in suspicious_reasons({"effectSource":"You must create the otyughs in an area containing at least 6,000 ounds of sewage."})
    assert "garbled-otyugh-pounds-source" not in suspicious_reasons({"effectSource":"You must create the otyughs in an area containing at least 6,000 pounds of sewage."})
    assert "clairaudience-clairvoyance-cast-inheritance" in external_mechanics_reasons("This effect otherwise functions as if you had cast clairaudience/clairvoyance in the object’s area.")
    assert "clairaudience-clairvoyance-cast-inheritance" not in external_mechanics_reasons("The coin lets you hear normally from its location while concentrating.")
    assert "protection-from-evil-taint-possession-inheritance" in external_mechanics_reasons("The abjuration blocks possession and mental influence, just as protection from evil does.")
    assert "protection-from-evil-taint-possession-inheritance" in external_mechanics_reasons("The abjuration blocks possession and mental influence, just as protection from Taint does.")
    assert "prismatic-spray-ray-suite-inheritance" in external_mechanics_reasons("A target struck by a ray suffers the effect of one beam of a prismatic spray spell.")
    assert "elemental-monolith-stat-dependency" in external_mechanics_reasons("You conjure a tremendously powerful creature known as an elemental monolith (Complete Arcane 156).")
    assert "magic-mouth-message-inheritance" in external_mechanics_reasons("The first activates a message as if the skull were a magic mouth.")
    assert "magic-mouth-message-inheritance" in external_mechanics_reasons("The first activates a message that the skull delivers as if it were a magic mouth.")
    assert "speak-spell-suite-inheritance" in external_mechanics_reasons("This spell grants you the effects of speak with animals, speak with plants, and tongues.")
    assert "speak-spell-suite-inheritance" in external_mechanics_reasons("You speak with stone as though under the influence of stone tell.")
    assert "shadow-evocation-spell-suite-inheritance" in external_mechanics_reasons("You cast a quasi-real, illusory version of a sorcerer or wizard evocation spell of 4th level or lower.")
    assert "hold-person-similarity-inheritance" in external_mechanics_reasons("The effect is similar to hold person.")
    assert "summon-monster-turn-inheritance-expanded" in external_mechanics_reasons("Spat vipers land nearby and act on the same round, on your turn, just as creatures summoned by a summon monster spell do.")
    assert "summoned-viper-stat-dependency" in external_mechanics_reasons("This spell summons 1d4+3 fiendish (chaotic evil) Medium vipers.")
    assert "greater-teleport-circle-inheritance" in external_mechanics_reasons("The circle teleports, as greater teleport, any creature who stands on it.")
    assert "luminous-assassin-stat-dependency" in external_mechanics_reasons("A Lesser Luminous Assassin appears above the target and attacks as it falls. After its initial attack, a Lesser Luminous Assassin attacks its target every round.")
    assert "turn-as-undead-rules-inheritance" in external_mechanics_reasons("You can turn creatures with the opposing alignment subtype as though they were undead.")
    assert "shroud-undead-rule-inheritance" in external_mechanics_reasons("You are treated as if you were undead for the purpose of all spells and effects.")
    assert "shroud-undead-rule-inheritance" in external_mechanics_reasons("You are treated as if you were undead for the purposes of all spells and effects.")
    assert "possess-animal-stat-dependency" in external_mechanics_reasons("You project your spirit into the body of an animal. While there, you keep your Intelligence, Wisdom, Charisma, level, and classes.")
    assert "quicken-feat-eligibility-inheritance" in external_mechanics_reasons("Only a spell that can be altered by the Quicken Spell feat can be placed in the matrix.")
    assert "quicken-feat-eligibility-inheritance" in external_mechanics_reasons("Only spells that can be altered by the Quicken Spell feat can be placed in the matrix.")
    assert "hold-person-that-of-inheritance" in external_mechanics_reasons("The effect is similar to that of hold person.")
    assert "hold-person-that-of-inheritance" not in external_mechanics_reasons("The effect immobilizes the creature and explicitly lists every restriction.")
    assert "limited-wish-spell-suite-inheritance" in external_mechanics_reasons("Duplicate any sorcerer / wizard spell of 6th level or lower.")
    assert "limited-wish-spell-suite-inheritance" not in external_mechanics_reasons("The spell deals 6d6 damage and allows a Reflex save for half.")
    assert "manifest-zone-trait-dependency" in external_mechanics_reasons("You enhance the effects of a manifest zone of a specified plane. Since each zone is different, the next inmost ring can gain a planar trait.")
    assert "manifest-zone-trait-dependency" not in external_mechanics_reasons("The zone grants a +2 bonus on saves and a 20-foot speed increase.")
    assert "spectral-hand-incorporeal-defense-dependency" in external_mechanics_reasons("The hand is incorporeal and thus cannot be harmed by normal weapons.")
    assert "spectral-hand-incorporeal-defense-dependency" not in external_mechanics_reasons("The hand has AC 22 and can be damaged by any magic weapon with no miss chance.")
    assert "spirit-ally-creature-stat-dependency" in external_mechanics_reasons("You request the services of a spirit (of up to 8 HD) that shares your philosophical alignment.")
    assert "spirit-ally-creature-stat-dependency" not in external_mechanics_reasons("You create a harmless spirit image with AC 20 and 10 hit points.")
    assert "daylight-properties-inheritance" in external_mechanics_reasons("The touched object radiates light with all the same properties of a daylight spell.")
    assert "daylight-properties-inheritance" not in external_mechanics_reasons("The touched object sheds bright light in a 60-foot radius.")
    assert "dagger-stat-inheritance" in external_mechanics_reasons("The blade attacks once per round, dealing damage as a dagger (including the threat range and critical multiplier).")
    assert "dagger-stat-inheritance" not in external_mechanics_reasons("The blade deals 1d4 piercing damage and threatens a critical on 19-20/x2.")
    assert "transcribed-symbol-mechanics-inheritance" in external_mechanics_reasons("The transferred symbol works normally thereafter and retains all its original triggering conditions.")
    assert "transcribed-symbol-mechanics-inheritance" not in external_mechanics_reasons("The transferred mark deals 2d6 fire damage when a creature enters its square.")
    assert "transcribed-symbol-mechanics-inheritance" in external_mechanics_reasons("The transferred sigil works normally thereafter and retains its original triggering conditions.")
    assert "transcribed-symbol-mechanics-inheritance" in external_mechanics_reasons("The transferred sigil works normally thereafter and retains all its original triggering conditions.")
    assert "dancing-lights-illumination-inheritance" in external_mechanics_reasons("These spheres provide as much light as a dancing lights spell.")
    assert "dancing-lights-illumination-inheritance" not in external_mechanics_reasons("These spheres shed bright light in a 20-foot radius.")
    assert "spell-storing-item-arbitrary-spell" in external_mechanics_reasons("You can imbue any spell of 4th level or lower into the item.")
    assert "spell-storing-item-arbitrary-spell" not in external_mechanics_reasons("The item releases a fixed 4d6 fire burst.")
    assert "illusory-script-suggestion-inheritance" in external_mechanics_reasons("Failure means the creature is subject to a suggestion implanted in the script.")
    assert "illusory-script-suggestion-inheritance" not in external_mechanics_reasons("Failure means the creature must close the book and leave for 30 minutes.")
    assert "ghost-template-transformation-dependency" in external_mechanics_reasons("You transform a willing incorporeal undead creature into a ghost.")
    assert "ghost-template-transformation-dependency" not in external_mechanics_reasons("The target becomes translucent and gains a 30-foot fly speed.")
    assert "disintegrate-effect-inheritance" in external_mechanics_reasons("The target must succeed at a Fortitude save or be subject to a disintegrate effect.")
    assert "disintegrate-effect-inheritance" not in external_mechanics_reasons("The target takes 20d6 damage on a failed Fortitude save.")
    assert "pending-potion-effect-dependency" in external_mechanics_reasons("You magically delay the effects of a potion or oil.")
    assert "pending-potion-effect-dependency" not in external_mechanics_reasons("You delay 2d8 points of healing until a later swift action.")
    assert "psionic-power-suite-dependency" in external_mechanics_reasons("You gain 3 power points per caster level and access to the following powers. Mind Thrust: Deal 1d10 damage. You manifest the powers as a psion of your caster level does.")
    assert "psionic-power-suite-dependency" not in external_mechanics_reasons("You gain a +4 bonus to Intelligence and can deal 1d10 damage with a ranged touch attack.")
    assert "dispel-magic-effect-inheritance" in external_mechanics_reasons("Magical fires are targeted by a dispel magic effect as if you had cast that spell.")
    assert "dispel-magic-effect-inheritance" not in external_mechanics_reasons("Magical fires are extinguished on a successful caster level check against DC 11 + the fire caster level.")
    assert "passwall-ejection-inheritance" in external_mechanics_reasons("He is harmlessly ejected just as if he were inside a passwall effect.")
    assert "passwall-ejection-inheritance" not in external_mechanics_reasons("He is harmlessly ejected to the nearest open square.")
    assert "teleport-base-spell-inheritance" in external_mechanics_reasons("As teleport, save that you draw upon the power of a storm.")
    assert "teleport-base-spell-inheritance" not in external_mechanics_reasons("You teleport all targets to the named location with no chance of error.")
    assert "stored-spell-disk-inheritance" in external_mechanics_reasons("A single spell of up to 5th level can be cast into it. The disk stores the spell until shattered. At that point, the spell immediately takes effect as if it had just been cast.")
    assert "stored-spell-disk-inheritance" not in external_mechanics_reasons("The disk releases a fixed 6d6 fire burst when shattered.")
    assert "shadow-hand-spell-suite-inheritance" in external_mechanics_reasons("It can give cover as a Bigby’s interposing hand spell, carry materials as Tenser’s floating disk, or strike opponents.")
    assert "shadow-hand-spell-suite-inheritance" not in external_mechanics_reasons("The hand grants one-half cover, carries 100 pounds, and deals 1d6+4 damage.")
    assert "dispel-magic-effect-inheritance" in external_mechanics_reasons("Magical fires are targeted by a dispel magic effect as if you had cast the spell.")
    assert "incorporeal-traits-statblock-dependency" in external_mechanics_reasons("SQ: incorporeal traits; Feats: Alertness, Dodge.")
    assert "incorporeal-traits-statblock-dependency" not in external_mechanics_reasons("The creature is incorporeal; it has a 50% miss chance against nonmagical attacks, can pass through objects, and has no Strength score.")
    assert "undefined-mirror-self-dependency" in external_mechanics_reasons("When you travel there, you create a mirror-self that will try to slay you and escape.")
    assert "undefined-mirror-self-dependency" not in external_mechanics_reasons("You create a mirror image with AC 18, 20 hit points, and a +6 attack bonus.")
    assert "any-sword-skill-inheritance" in external_mechanics_reasons("If proficient with any type of sword, you can wield the beam as if it were any type of sword and thus gain the benefits of any special sword skill you might have.")
    assert "any-sword-skill-inheritance" not in external_mechanics_reasons("The beam is a melee touch weapon that deals 1d8 damage and has no critical threat range.")
    assert "spirit-self-incorporeal-rule-inheritance" in external_mechanics_reasons("Your spirit is treated as an incorporeal creature for the purposes of determining movement, special qualities, and weaknesses.")
    assert "spirit-self-incorporeal-rule-inheritance" not in external_mechanics_reasons("Your spirit has speed 90 feet, can pass through solid objects, and has a 50% miss chance against nonmagical attacks.")
    assert "golem-special-attack-inheritance" in external_mechanics_reasons("You also become vulnerable to all special attacks that affect iron golems.")
    assert "golem-special-attack-inheritance" in external_mechanics_reasons("You also become vulnerable to all special attacks that affect stone golems.")
    assert "golem-special-attack-inheritance" not in external_mechanics_reasons("You take 1d6 damage per caster level from rusting effects and are slowed by electricity.")
    assert "phantom-steed-air-movement-inheritance" in external_mechanics_reasons("The stag can move through the air as if it were on firm land, as a phantom steed spell cast by a 12th-level caster.")
    assert "phantom-steed-air-movement-inheritance" not in external_mechanics_reasons("The stag has a 60-foot fly speed with good maneuverability.")
    assert "phantasmal-thief-improved-disarm-inheritance" in external_mechanics_reasons("It does this as if it had the Improved Disarm feat.")
    assert "phantasmal-thief-improved-disarm-inheritance" not in external_mechanics_reasons("It makes a +20 opposed check and does not provoke attacks of opportunity.")
    assert "wand-modulation-arbitrary-spell-inheritance" in external_mechanics_reasons("The next spell you cast upon the target wand affects the remaining charges, allowing the wand to discharge that spell instead.")
    assert "wand-modulation-arbitrary-spell-inheritance" not in external_mechanics_reasons("The wand now fires a fixed 2d6 force bolt.")
    assert "simulacrum-creature-stat-inheritance" in external_mechanics_reasons("It appears the same as the original, but it has only one-half of the real creature’s levels or Hit Dice and the appropriate feats, skill ranks, and special abilities.")
    assert "simulacrum-creature-stat-inheritance" not in external_mechanics_reasons("The duplicate has AC 18, 40 hit points, and a +8 melee attack.")
    assert "secure-shelter-spell-suite-inheritance" in external_mechanics_reasons("The doors are arcane locked, the openings are protected by an alarm spell, and an unseen servant is conjured.")
    assert "secure-shelter-spell-suite-inheritance" not in external_mechanics_reasons("The doors have hardness 10 and the alarm rings for 1 round when a creature enters.")
    assert "imbue-familiar-arbitrary-spell-inheritance" in external_mechanics_reasons("This spell allows you to transfer a number of your spells and the ability to cast them into your familiar; you can imbue any spell you have prepared.")
    assert "imbue-familiar-arbitrary-spell-inheritance" not in external_mechanics_reasons("The familiar gains a fixed 3d6 fire ray once.")
    assert "spirit-self-incorporeal-combat-inheritance" in external_mechanics_reasons("Your spirit can be detected and attacked in the same way as incorporeal creatures can.")
    assert "spirit-self-incorporeal-combat-inheritance" not in external_mechanics_reasons("Your spirit has a 50% miss chance against corporeal attacks and can pass through solid objects.")
    assert "scent-track-feat-rule-inheritance" in external_mechanics_reasons("The ability otherwise follows the rules for the Track feat.")
    assert "scent-track-feat-rule-inheritance" not in external_mechanics_reasons("The trail DC is 10 and rises by 2 for each hour of age.")
    assert "spell-engine-rod-absorption-inheritance" in external_mechanics_reasons("It absorbs all these effects as if it were a rod of absorption with unlimited capacity.")
    assert "spell-engine-rod-absorption-inheritance" not in external_mechanics_reasons("It absorbs any spell of 3rd level or lower and can hold 20 spell levels.")
    assert "miracle-arbitrary-spell-duplication" in external_mechanics_reasons("Duplicate any cleric spell of 8th level or lower. Duplicate any other spell of 7th level or lower.")
    assert "miracle-arbitrary-spell-duplication" not in external_mechanics_reasons("The miracle restores all allies to full hit points.")
    assert "srinshee-metamagic-feat-suite-inheritance" in external_mechanics_reasons("You can apply any one metamagic feat from the following list: Empower Spell, Enlarge Spell, Extend Spell, Maximize Spell, or Widen Spell.")
    assert "srinshee-metamagic-feat-suite-inheritance" not in external_mechanics_reasons("You can double a spell’s range or duration.")
    assert "spell-phylactery-arbitrary-scroll-inheritance" in external_mechanics_reasons("When triggered, the spell on the scroll is cast upon you.")
    assert "spell-phylactery-arbitrary-scroll-inheritance" not in external_mechanics_reasons("When triggered, the scroll grants you 10 temporary hit points.")
    assert "weapon-deity-special-ability-inheritance" in external_mechanics_reasons("The weapon gains a +1 enhancement bonus and an additional special ability (see the list below).")
    assert "weapon-deity-special-ability-inheritance" not in external_mechanics_reasons("The weapon gains a +1 enhancement bonus and deals +1d6 fire damage.")
    assert "scramble-phb-diagram-dependency" in external_mechanics_reasons("Move the creature using the \"targeted on square\" part of the diagram on page 158 of the Player’s Handbook.")
    assert "scramble-phb-diagram-dependency" not in external_mechanics_reasons("Roll 1d8 clockwise from north to determine the direction.")
    assert "howling-chain-phb-thrown-weapon-dependency" in external_mechanics_reasons("Use the rules for missing with a thrown weapon on page 158 of the Player’s Handbook.")
    assert "howling-chain-phb-thrown-weapon-dependency" not in external_mechanics_reasons("On a miss, roll 1d8 for direction and 1d4 for distance.")
    assert "shadow-conjuration-arbitrary-spell-inheritance" in external_mechanics_reasons("Shadow conjuration can mimic any sorcerer or wizard conjuration (summoning) or conjuration (creation) spell of 3rd level or lower.")
    assert "shadow-conjuration-arbitrary-spell-inheritance" not in external_mechanics_reasons("The shadow creature deals 4d6 damage and has AC 20.")
    assert "stored-lightning-bolt-inheritance" in external_mechanics_reasons("The initial strike does damage to all creatures within its area, as a lightning bolt spell.")
    assert "stored-lightning-bolt-inheritance" not in external_mechanics_reasons("The initial strike deals 10d6 electricity damage in a 120-foot line.")
    assert "telekinesis-combat-maneuver-inheritance" in external_mechanics_reasons("You can perform a bull rush, disarm, grapple (including pin), or trip. Resolve these attempts as normal, except they do not provoke attacks of opportunity.")
    assert "telekinesis-combat-maneuver-inheritance" not in external_mechanics_reasons("Make an opposed caster-level check against the target’s Strength check; success moves it 5 feet.")
    assert "polymorph-other-creature-stat-inheritance" in external_mechanics_reasons("The creature acquires the physical and natural abilities of the creature it has been polymorphed into.")
    assert "polymorph-other-creature-stat-inheritance" not in external_mechanics_reasons("The subject becomes Large with Strength 20, Dexterity 12, and natural armor +4.")
    assert "summoned-viper-stat-dependency" in external_mechanics_reasons("This spell summons 1d4+3 fiendish (CE) Medium-size vipers.")
    assert "phantom-wolf-feat-package-dependency" in external_mechanics_reasons("Skills and Feats: Listen +20, Spot +20; Alertness, Dodge, Combat Reflexes, Mobility, Weapon Focus (bite).")
    assert "phantom-wolf-feat-package-dependency" not in external_mechanics_reasons("The wolf has +20 Listen, +20 Spot, and all attack/defense modifiers are fully stated.")
    assert "spider-plague-traits-web-dependency" in external_mechanics_reasons("SA poison, web, smite evil; SQ vermin traits, darkvision 60 ft.")
    assert "spider-plague-traits-web-dependency" not in external_mechanics_reasons("The spider's web is fully defined here and it has darkvision 60 ft.")
    assert "prying-eyes-construct-traits-dependency" in external_mechanics_reasons("Each eye is a Fine construct, about the size of a small apple, that has 1 hit point, AC 18.")
    assert "prying-eyes-construct-traits-dependency" not in external_mechanics_reasons("Each eye has 1 hit point, AC 18, fly speed 30 feet, and its immunities are all explicitly listed.")
    assert "missing-cerulean-sign-effect-table" in suspicious_reasons({"effectSource":"Once a creature recovers from an effect, it moves up one level on the table."})
    assert "missing-cerulean-sign-effect-table" not in suspicious_reasons({"effectSource":"Once a creature recovers, it becomes sickened for 1 round and then recovers fully."})
    assert "missing-reality-maelstrom-plane-sidebar" in suspicious_reasons({"effectSource":"The tear sends them to a random plane (see sidebar)."})
    assert "missing-reality-maelstrom-plane-sidebar" not in suspicious_reasons({"effectSource":"The tear sends them to the Astral Plane."})
    assert "missing-minus-blinded-skill-penalty" in suspicious_reasons({"effectSource":"A blinded creature suffers a 4 penalty on most Strength and Dexterity-based skill checks."})
    assert "missing-minus-blinded-skill-penalty" not in suspicious_reasons({"effectSource":"A blinded creature suffers a -4 penalty on most Strength and Dexterity-based skill checks."})
    assert "garbled-hidden-ward-source" in suspicious_reasons({"effectSource":"The DM should make this roll in secret to prevent subicion by the players."})
    assert "garbled-hidden-ward-source" in suspicious_reasons({"effectSource":"This increases the Search DC by one-half you caster level."})
    assert "garbled-hidden-ward-source" not in suspicious_reasons({"effectSource":"This increases the Search DC by one-half your caster level."})
    assert "self-slowed-condition-shorthand" in suspicious_reasons({"effectSource":"If hit by transmute rock to mud, you are slowed for 2d6 rounds."})
    assert "self-slowed-condition-shorthand" not in suspicious_reasons({"effectSource":"Your speed is reduced to 10 feet for 2d6 rounds."})
    assert "listed-spell-suite-inheritance" in external_mechanics_reasons("You can choose a spell from those listed below once per round and use it as a spelllike ability.")
    assert "missing-following-modifier-block" in suspicious_reasons({"effectSource":"The following modifiers are used in place of those given on page 101 of the Player’s Handbook. The caster must have the Track feat to use this spell."})
    assert "missing-following-modifier-block" not in suspicious_reasons({"effectSource":"The following modifiers are used in place of those given on page 101 of the Player’s Handbook. Light rain: +2. Heavy fog: -4."})
    assert "garbled-spell-matrix-lesser-source" in suspicious_reasons({"effectSource":"Only a spell that can be altered by the antimagic field , the duration of the matrix is interrupted, but the spell does not activate."})
    assert "garbled-spell-matrix-lesser-source" not in suspicious_reasons({"effectSource":"If you enter an antimagic field, the duration of the matrix is interrupted, but the spell does not activate."})
    assert "undead-torch-unspecified-residual-damage" in suspicious_reasons({"effectSource":"The undead torch continues to burn at the location of its destruction until the duration expires, and creatures that pass through that area take damage."})
    assert "undead-torch-unspecified-residual-damage" not in suspicious_reasons({"effectSource":"The undead torch continues to burn at the location of its destruction until the duration expires, and creatures that pass through that area take 2d6 points of damage."})
    assert "contradictory-vulnerability-scaling" in suspicious_reasons({"effectSource": "For every four caster levels beyond 9th, the reduction increases; a reduction of 10 at caster level 15th and a reduction of 15 at caster level 19th."})
    assert "contradictory-vulnerability-scaling" not in suspicious_reasons({"effectSource": "For every four caster levels beyond 9th, the reduction increases at 13th and 17th levels."})
    assert "missing-skull-eyes-effects" in suspicious_reasons({"effectSource": "Depending on Hit Dice, the gaze attack may have either of two effects, as follows. While the spell lasts, your eyes are black."})
    assert "weapon-special-ability-dependency" in external_mechanics_reasons("The scepter has the axiomatic, disruption, and flaming burst special abilities.")
    assert "weapon-special-ability-dependency" not in external_mechanics_reasons("The weapon has a +2 enhancement bonus.")
    assert "fog-cloud-concealment-inheritance" in external_mechanics_reasons("The cylinder provides concealment similar to fog cloud.")
    assert "freedom-of-movement-inheritance" in external_mechanics_reasons("You are protected by freedom of movement.")
    assert "negative-energy-protection-inheritance" in external_mechanics_reasons("All subjects receive negative energy protection, except their resistance roll gains +10.")
    assert "under-influence-of-named-spell" in external_mechanics_reasons("The animal serves you as if it were under the influence of a dominate animal spell.")
    assert "mobility-feat-inheritance" in external_mechanics_reasons("When moving in combat, you act as if you had the Mobility feat.")
    assert "called-creature-stat-dependency" in external_mechanics_reasons("The caster calls a special servant of Valarian—either a pegasus or unicorn—to her location.")
    assert "called-creature-stat-dependency" not in external_mechanics_reasons("The caster calls down a peal of thunder.")
    assert "planar-exchange-creature-stat-dependency" in external_mechanics_reasons("You call an extraplanar creature (specifically, an avoral guardinal, bone devil, or babau demon, at your option) to your location. The creature has full access to all of its abilities.")
    assert "planar-exchange-creature-stat-dependency" not in external_mechanics_reasons("You create a fixed guardian with AC 22, 60 hit points, and a +12 bite attack.")
    assert "spell-of-that-name-inheritance" in external_mechanics_reasons("You can create a suggestion effect, which functions identically to the spell of that name.")
    assert "spell-of-that-name-inheritance" not in external_mechanics_reasons("The visual effect is identical in color to the original.")
    assert "caught-in-named-spell" in external_mechanics_reasons("Creatures trapped act as if caught in an entomb spell.")
    assert "caught-in-named-spell" not in external_mechanics_reasons("Creatures act as if caught in deep snow.")
    assert "same-as-named-feat" in external_mechanics_reasons("The overall effect is the same as that of the Quick Draw feat.")
    assert "same-as-named-feat" not in external_mechanics_reasons("The overall effect is the same as a free action.")
    assert "fog-created-by-fog-cloud" in external_mechanics_reasons("The spell creates a bank of fog like that created by fog cloud, except the vapors are nauseating.")
    assert "fog-created-by-fog-cloud" not in external_mechanics_reasons("The spell creates a bank of fog like that created by a forest fire.")
    assert "magic-weapon-stat-inheritance" in external_mechanics_reasons("You can attack with your fist in all respects as if you were wearing a +1 spiked gauntlet.")
    assert "magic-weapon-stat-inheritance" not in external_mechanics_reasons("You fight as if you were wearing heavy armor.")
    assert "fired-from-light-crossbow-stat-dependency" in external_mechanics_reasons("The bolt flies at the target as if you had fired it from a light crossbow, using a ranged attack roll.")
    assert "fired-from-light-crossbow-stat-dependency" not in external_mechanics_reasons("The bolt flies as if you had fired it into the air.")
    assert "embedded-html-markup" in suspicious_reasons({"effectSource":"At <em>10th :</em> level, the barding grants +8 armor."})
    assert "embedded-html-markup" not in suspicious_reasons({"effectSource":"At 10th level, the barding grants +8 armor."})
    assert "missing-plus-before-bonus" in suspicious_reasons({"effectSource":"Scale mail barding ( 4 armor bonus)."})
    assert "missing-plus-before-bonus" not in suspicious_reasons({"effectSource":"Scale mail barding (+4 armor bonus)."})
    assert "clairaudience-effect-inheritance" in external_mechanics_reasons("You hear whatever occurs near the sensor, much like a clairaudience effect.")
    assert "clairaudience-effect-inheritance" not in external_mechanics_reasons("The sound is much like a thunder effect.")
    assert "garbled-nightstalker-transformation" in suspicious_reasons({"effectSource":"You also gain the cat’s grace , which you drink (and whose effects are subsumed)."})
    assert "planar-environment-dependency" in external_mechanics_reasons("The area emulates its native planar environment.")
    assert "summoned-creature-stat-dependency" in external_mechanics_reasons("This spell summons a bearded devil from the Nine Hells.")
    assert "malformed-dice-notation" in suspicious_reasons({"effectSource":"Creatures in the burst take ld8 points of damage."})
    assert "malformed-dice-notation" not in suspicious_reasons({"effectSource":"Creatures in the burst take 1d8 points of damage."})
    assert "garbled-phantasmal-thief-source" in suspicious_reasons({"effectSource":"Even objects in a Improved Disarm feat and a +20 Strength modifier."})
    assert "malformed-talons-source" in suspicious_reasons({"effectSource":"You can attack with yout other hand. You are considered arms."})
    assert "garbled-last-judgment-source" in suspicious_reasons({"effectSource":"This spell affects only humanoids, monstrous humanoids, and resurrection is cast."})
    assert "truncated-nether-trail-source" in suspicious_reasons({"effectSource":"Evil outsider must make its saving throw first."})
    assert "unbalanced-parentheses" in suspicious_reasons({"effectSource": "You take the form of a chimera ( Polymorph Subschool sidebar."})
    assert "teleport greater" in name_aliases("Teleport, Greater")
    assert near_family_key(
        "A " + "word " * 40 + "10 feet"
    ) == near_family_key(
        "A " + "word " * 40 + "20 feet"
    )
    assert near_family_key("short effect") == ""
    print(json.dumps({"selfTest": "passed"}, indent=2))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", type=Path)
    ap.add_argument("--output", type=Path)
    ap.add_argument("--reference-output", type=Path)
    ap.add_argument("--delay", type=float, default=0.08)
    ap.add_argument("--max-reference-depth", type=int, default=8)
    ap.add_argument("--skip-reference-resolution", action="store_true")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        run_self_test()
        return
    if not args.input or not args.output or not args.reference_output:
        ap.error("--input, --output and --reference-output are required unless --self-test is used")

    queue = load_json(args.input, {})
    if queue.get("errors"):
        raise SystemExit("Input review queue contains errors: " + "; ".join(queue["errors"]))
    queue_entries = queue.get("entries") or []
    catalog_rows = load_json(CATALOG, [])
    by_id, by_alias = build_catalog_indexes(catalog_rows)
    summaries = {"entries": dict(d35.spell_effect_summaries())}
    supplements = load_json(SUPPLEMENTS, {"entries": {}})
    regressions = set(
        (load_json(REGRESSIONS, {"recordIds": []}).get("recordIds") or [])
    )

    validation = validate_known_corpus(
        summaries, supplements, regressions, queue_entries
    )
    live_fixtures = validate_live_fixtures(by_id, args.delay)
    validation["liveFixtures"] = live_fixtures
    validation["errors"].extend(live_fixtures["errors"])

    report, references = classify_queue(
        queue_entries,
        summaries,
        supplements,
        regressions,
        by_alias,
        args.delay,
        args.max_reference_depth,
        not args.skip_reference_resolution,
    )
    report["reviewOnly"] = True
    report["catalogMutation"] = False
    report["knownCorpusValidation"] = validation
    references["reviewOnly"] = True
    references["catalogMutation"] = False

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.reference_output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    args.reference_output.write_text(
        json.dumps(references, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "queueCount": report["queueCount"],
        "primaryBucketCounts": report["primaryBucketCounts"],
        "tagCounts": report["tagCounts"],
        "uniqueSourceShaCount": report["uniqueSourceShaCount"],
        "deduplicatedReviewUnitCount": report["deduplicatedReviewUnitCount"],
        "exactDuplicateFamilyCount": report["exactDuplicateFamilyCount"],
        "nearDuplicateFamilyCount": report["nearDuplicateFamilyCount"],
        "manualVerificationCount": report["manualVerificationCount"],
        "referenceResolutionStatusCounts": report["referenceResolutionStatusCounts"],
        "knownCorpusValidation": validation,
    }, indent=2))
    if validation["errors"]:
        raise SystemExit("Known-corpus validation failed")


if __name__ == "__main__":
    main()
