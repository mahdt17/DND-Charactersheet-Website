"""Confirm the published-catalog gate detects damaged data without a network call."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from check_published_catalogs35 import CATALOG, check_category, read
from determine_spell_validation_scope import needs_live_35

row = read(CATALOG / "dndtools/classes.json")[0]
corpus = {"classes": [row["name"]]}
check = lambda rows: check_category("classes", "class", rows, 1, corpus)
assert check([row]) == []
assert "hit_die" in str(check([{**row, "hit_die": None}]))
assert "source URL" in str(check([{**row, "url": ""}]))
assert "incomplete enrichment" in str(check([{**row, "enrichment": {"validated": False}}]))
assert "duplicate" in str(check([row, row]))
assert "missing regression class" in str(check([]))
assert needs_live_35("scripts/enrich_dndtools.py")
assert needs_live_35("scripts/item_source_fallbacks_35.json")
assert needs_live_35("scripts/spell_effect_summaries_35_batches/sample.json.gz")
assert needs_live_35("public/catalogs/dndtools/classes.json")
assert not needs_live_35("src/Affiliations.jsx")
print("PASS published-catalog negative controls and live-check scope")
