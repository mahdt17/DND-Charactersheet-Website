"""Live, read-only enrichment preflight across a broad deterministic sample.

This script never writes catalog files. It samples evenly across each source catalog,
runs the same enrichment/validation functions used by the importers, and fails when
the observed parse success rate is below the configured threshold.

Usage:
  python scripts/preflight_enrichment.py
  python scripts/preflight_enrichment.py --dnd-sample 20 --wikidot-sample 15 --min-rate 0.85
"""
from __future__ import annotations

import argparse
import json
import math
import sys
import time
from pathlib import Path

import enrich_dndtools as d35
import import_wikidot as w5

ROOT = Path(__file__).resolve().parents[1]
DND_CATALOG = ROOT / "public" / "catalogs" / "dndtools"


def even_sample(rows, count):
    """Deterministic coverage across the entire ordered collection."""
    if count <= 0 or not rows:
        return []
    if count >= len(rows):
        return list(rows)
    if count == 1:
        return [rows[len(rows)//2]]
    indexes = []
    for i in range(count):
        idx = round(i * (len(rows) - 1) / (count - 1))
        if idx not in indexes:
            indexes.append(idx)
    return [rows[i] for i in indexes]


def summarize(name, passed, failed, samples):
    total = passed + failed
    rate = passed / total if total else 0.0
    return {
        "category": name,
        "sampled": total,
        "passed": passed,
        "failed": failed,
        "successRate": round(rate, 4),
        "examples": samples[:8],
    }


def dndtools_preflight(sample_size, delay):
    results = []
    categories = ["classes", "feats", "spells", "items", "equipment"]
    for category in categories:
        rows = json.loads((DND_CATALOG / f"{category}.json").read_text(encoding="utf-8"))
        sample = even_sample(rows, sample_size)
        passed = failed = 0
        failures = []
        for entry in sample:
            try:
                enriched = d35.enrich_entry(entry, category, delay)
                if not enriched.get("enrichment", {}).get("validated"):
                    raise AssertionError("validated enrichment flag missing")
                passed += 1
            except Exception as exc:
                failed += 1
                failures.append({
                    "name": entry.get("name"),
                    "url": entry.get("url"),
                    "error": str(exc)[:240],
                })
        results.append(summarize("3.5/" + category, passed, failed, failures))
    return results


def wikidot_rows(category, delay):
    if category == "classes":
        return [w5.source_record(name.title(), w5.BASE + "/" + name, "class") for name in w5.CLASS_URLS]
    page = w5.parse(w5.INDEX_URLS[category], delay)
    discover = {
        "spells": w5.discover_spells,
        "feats": w5.discover_feats,
        "items": w5.discover_items,
    }[category]
    return discover(page)


def wikidot_preflight(sample_size, delay):
    results = []
    for category in ["classes", "spells", "feats", "items"]:
        rows = wikidot_rows(category, delay)
        sample = rows if category == "classes" else even_sample(rows, sample_size)
        passed = failed = 0
        failures = []
        for row in sample:
            try:
                page = w5.parse(row["url"], delay)
                result = w5.DETAIL_PARSERS[row["category"]](row, page)
                w5.validate_detail(row, page, result)
                passed += 1
            except Exception as exc:
                failed += 1
                failures.append({
                    "name": row.get("name"),
                    "url": row.get("url"),
                    "error": str(exc)[:240],
                })
        results.append(summarize("5e/" + category, passed, failed, failures))
    return results


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dnd-sample", type=int, default=20,
                    help="Per-category 3.5 sample size, evenly spread across the catalog.")
    ap.add_argument("--wikidot-sample", type=int, default=15,
                    help="Per-category 5e sample size for spells/feats/items; all base classes are tested.")
    ap.add_argument("--min-rate", type=float, default=0.85,
                    help="Minimum success rate required per category.")
    ap.add_argument("--delay", type=float, default=0.10)
    args = ap.parse_args()

    started = time.time()
    results = []
    results.extend(dndtools_preflight(args.dnd_sample, args.delay))
    results.extend(wikidot_preflight(args.wikidot_sample, args.delay))

    report = {
        "readOnly": True,
        "dndSamplePerCategory": args.dnd_sample,
        "wikidotSamplePerCategory": args.wikidot_sample,
        "minimumRate": args.min_rate,
        "elapsedSeconds": round(time.time() - started, 2),
        "categories": results,
    }
    print(json.dumps(report, indent=2))

    bad = [r for r in results if r["successRate"] < args.min_rate]
    if bad:
        print("\nPRECHECK FAILED:", ", ".join(
            f"{r['category']}={r['successRate']:.1%}" for r in bad
        ), file=sys.stderr)
        raise SystemExit(1)

    print("\nPASS broad live enrichment preflight")


if __name__ == "__main__":
    main()
