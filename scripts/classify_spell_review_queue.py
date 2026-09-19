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
        r"\bas\s+if\s+(?:it\s+were\s+)?affected\s+by\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)\s+spell\b",
        re.I,
    ),
    re.compile(
        r"(?:^|[.!?:]\s+)As\s+with\s+(?:a|an|the)\s+"
        r"(?P<name>[A-Za-z][A-Za-z'’ /,-]{1,80}?)\s+spell\b",
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
    ("affected-by-shorthand", re.compile(
        r"\b(?:acts?|behaves?)\s+as\s+though\s+affected\s+by\s+"
        r"(?:a|an|the)?\s*(?P<name>[A-Za-z][A-Za-z0-9'’ /,-]{1,80}?)(?=[,.;]|$)",
        re.I,
    )),
    ("external-see-for-details", re.compile(
        r"\bsee\s+(?:the\s+)?[^.;]{1,100}?\s+for\s+(?:more\s+)?details\b",
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
        r"(?P<name>[^.;]{0,100}?\b(?:golems?|devils?|demons?|archons?|eladrins?|rocs?|"
        r"elementals?|homuncul(?:us|i)|titans?|swarms?|dragons?|undead(?:\s+creatures?)?|"
        r"extraplanar\s+creatures?|natural\s+creatures?|fiends?|creatures?))\b",
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
    ("truncated-nether-trail-source", re.compile(
        r"\bEvil outsider must make its saving throw first\b",
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
    value = re.sub(r"^(?:the\s+)?(?:spell\s+)?", "", value, flags=re.I)
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
        "If the subject is delaying, it acts as soon as the spell is cast."
    ) == []
    assert extract_reference_names(
        "If you do not wield it, the weapon behaves as if unaffected by this spell."
    ) == []
    assert clean_reference_name("4th-level spell arcane eye") == "arcane eye"
    assert clean_reference_name("arcane eye spell (see page 200)") == "arcane eye"
    assert "polymorph-subschool-reference" in external_mechanics_reasons("For details, see The Polymorph Subschool on page 60.")
    assert "referenced-creature-stat-block" in external_mechanics_reasons("The tentacle is equivalent to a giant constrictor snake (MM 280) except that it obeys you.")
    assert external_mechanics_reasons("These strands are identical with those created by the web spell, except they regrow.") == ["embedded-spell-mechanics"]
    assert "leading-inherited-spell" in external_mechanics_reasons("As the alarm spell, and in addition this affects coterminous planes.")
    assert "generic-identical-with" in external_mechanics_reasons("This is identical with deathwatch, but only functions on animals and plants.")
    assert "granted-spell-effect" in external_mechanics_reasons("The animal gains a bonus plus the effect of a haste spell.")
    assert "external-page-reference" in external_mechanics_reasons("See page 297 for the inherited servant rules.")
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
    assert "as-per-named-spell" in external_mechanics_reasons("The glow provides light as per the light spell.")
    assert "leading-like-named-spell" in external_mechanics_reasons("Like shield other, this spell transfers some wounds.")
    assert "functions-much-like-spell" in external_mechanics_reasons("This spell functions much like the sanctuary spell.")
    assert "named-spell-benefit" in external_mechanics_reasons("The subjects gain the benefits of a bless spell.")
    assert "named-spell-benefit" not in external_mechanics_reasons("Creatures receive the benefits of this spell.")
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
