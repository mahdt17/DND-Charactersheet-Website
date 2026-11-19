"""Read-only regression check of the shipped, previously audited DnD Tools catalogs."""
import json
from pathlib import Path

from audit_enrichment_output import AUDITORS, REQUIRED_FILES
from enrich_dndtools import BASE, enrichment_gaps

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "public/catalogs"


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def check_category(category, kind, rows, audited_total, corpus):
    errors = []
    seen = set()
    names = set()
    item_cases = {case["id"]: case for case in corpus.get("records", [])}
    if len(rows) != audited_total or not rows:
        errors.append(f"{category}: expected {audited_total} audited records, found {len(rows)}")
    for row in rows:
        record_id = row.get("id", "")
        gaps = set(enrichment_gaps(category, row)) | set(AUDITORS[kind](row))
        if record_id in seen or not record_id.startswith(category + "/"):
            gaps.add("duplicate or invalid ID")
        if row.get("url") != BASE + "/" + record_id:
            gaps.add("source URL")
        enrichment = row.get("enrichment") or {}
        if enrichment.get("validated") is not True or enrichment.get("partial") is not False or enrichment.get("missingExpected"):
            gaps.add("incomplete enrichment")
        case = item_cases.get(record_id)
        if case:
            flags = {"supplement": "supplementVerified", "sourceFallback": "sourceFallbackVerified",
                     "nonGameplayReference": "nonGameplayReference"}
            flag = flags.get(case["mode"])
            if flag and row.get(flag) is not True:
                gaps.add(flag)
            for key in ("ruleFamily", "referenceKind"):
                if key in case and row.get(key) != case[key]:
                    gaps.add(key)
            gaps.update(key for key in case.get("required", []) if row.get(key) in (None, "", [], {}))
        if gaps:
            errors.append(f"{record_id}: {', '.join(sorted(gaps))}")
        seen.add(record_id)
        names.add(row.get("name"))
    for missing in sorted((set(corpus.get("recordIds", [])) | set(item_cases)) - seen):
        errors.append(f"{category}: missing regression ID {missing}")
    for missing in sorted(set(corpus.get("classes", [])) - names):
        errors.append(f"{category}: missing regression class {missing}")
    return errors


def main():
    audit = read(CATALOG / "enrichment-release-audit.json")
    totals = {entry["category"]: entry["total"] for entry in audit["categories"]}
    errors = []
    for name, (filename, kind) in REQUIRED_FILES.items():
        if not name.startswith("3.5/"):
            continue
        category = name.split("/")[1]
        corpus = {} if kind == "equipment" else read(ROOT / "scripts" / f"{kind}_regression_cases.json")
        rows = read(CATALOG / filename)
        failures = check_category(category, kind, rows, totals[name], corpus)
        print(f"{name}: {len(rows)} published records, {len(failures)} errors")
        errors.extend(failures)
    if errors:
        raise SystemExit("\n".join(errors))


if __name__ == "__main__":
    main()
