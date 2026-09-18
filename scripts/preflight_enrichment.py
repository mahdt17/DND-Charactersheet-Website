"""Live, read-only enrichment preflight across a broad deterministic sample.

This script never writes catalog files. It samples evenly across each source catalog,
runs the same enrichment/validation functions used by the importers, and fails when
the observed parse success rate is below the configured threshold.

Usage:
  python scripts/preflight_enrichment.py
  python scripts/preflight_enrichment.py --dnd-sample 50 --wikidot-sample 40 --min-rate 1.0
  python scripts/preflight_enrichment.py --full --min-rate 1.0 --report test-results/enrichment-full-audit.json
"""
from __future__ import annotations

import argparse
import json
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


def summarize(name, passed, failed, samples, record_ids=None):
    total = passed + failed
    rate = passed / total if total else 0.0
    result = {
        "category": name,
        "sampled": total,
        "passed": passed,
        "failed": failed,
        "successRate": round(rate, 4),
        "failureNames": [sample.get("name") for sample in samples],
        "failures": [{"id":sample.get("id"),"name":sample.get("name"),"url":sample.get("url"),"error":sample.get("error")} for sample in samples],
        "examples": samples[:8],
    }
    if record_ids is not None:
        result["recordIds"] = record_ids
    return result


def shard_rows(rows, shard_count, shard_index):
    """Split a full ordered catalog deterministically with no overlap."""
    return [row for i, row in enumerate(rows) if i % shard_count == shard_index]


def dndtools_preflight(sample_size, delay, strict=True, only=None, shard_count=1, shard_index=0):
    results = []
    categories = ["classes", "feats", "spells", "items", "equipment"]
    for category in categories:
        full_name = "3.5/" + category
        if only and full_name not in only:
            continue
        rows = json.loads((DND_CATALOG / f"{category}.json").read_text(encoding="utf-8"))
        sample = list(rows) if sample_size is None else even_sample(rows, sample_size)
        if sample_size is None and shard_count > 1:
            sample = shard_rows(sample, shard_count, shard_index)
        passed = failed = 0
        failures = []
        for entry in sample:
            parser = None
            try:
                raw = d35.fetch(entry["url"], delay)
                parser = d35.DetailParser()
                parser.feed(raw)
                parser.close()
                details = d35.PARSERS[category](parser, entry)
                d35.validate_details(entry, category, parser, details)
                gaps = d35.enrichment_gaps(category, details)
                if strict and gaps:
                    raise ValueError("Critical gameplay fields missing: " + ", ".join(gaps))
                passed += 1
            except Exception as exc:
                failed += 1
                snapshot = {}
                if parser is not None and len(failures) < 2:
                    snapshot = {
                        "lines": parser.lines[:24],
                        "headings": parser.headings[:12],
                        "tableHeaders": [table[0] for table in parser.tables[:4] if table],
                    }
                failures.append({
                    "id": entry.get("id"),
                    "name": entry.get("name"),
                    "url": entry.get("url"),
                    "error": str(exc)[:240],
                    **snapshot,
                })
        results.append(summarize(
            "3.5/" + category,
            passed,
            failed,
            failures,
            record_ids=[entry.get("id") for entry in sample],
        ))
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


def wikidot_preflight(sample_size, delay, strict=True, only=None, shard_count=1, shard_index=0):
    results = []
    for category in ["classes", "spells", "feats", "items"]:
        full_name = "5e/" + category
        if only and full_name not in only:
            continue
        passed = failed = 0
        failures = []
        try:
            rows = wikidot_rows(category, delay)
        except Exception as exc:
            results.append({
                "category":"5e/" + category,
                "sampled":0,
                "passed":0,
                "failed":1,
                "successRate":0.0,
                "examples":[{"name":"INDEX DISCOVERY","url":w5.INDEX_URLS.get(category,""),"error":str(exc)[:240]}],
            })
            continue
        discovered_ids=[row.get("id") for row in rows]
        sample = rows if category == "classes" or sample_size is None else even_sample(rows, sample_size)
        if sample_size is None and shard_count > 1:
            sample = shard_rows(sample, shard_count, shard_index)
        for row in sample:
            page = None
            try:
                page = w5.parse(row["url"], delay)
                result = w5.DETAIL_PARSERS[row["category"]](row, page)
                w5.validate_detail(row, page, result)
                gaps = w5.enrichment_gaps(row, result)
                if strict and gaps:
                    raise ValueError("Critical gameplay fields missing: " + ", ".join(gaps))
                passed += 1
            except Exception as exc:
                failed += 1
                snapshot = {}
                if page is not None and len(failures) < 2:
                    snapshot = {
                        "lines": page.lines[:24],
                        "headings": page.headings[:12],
                        "tableHeaders": [table[0] for table in page.tables[:4] if table],
                    }
                failures.append({
                    "id": row.get("id"),
                    "name": row.get("name"),
                    "url": row.get("url"),
                    "error": str(exc)[:240],
                    **snapshot,
                })
        summary=summarize(
            "5e/" + category,
            passed,
            failed,
            failures,
            record_ids=[row.get("id") for row in sample],
        )
        if sample_size is None:
            summary["discoveredRecordIds"]=discovered_ids
        results.append(summary)
    return results


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dnd-sample", type=int, default=20,
                    help="Per-category 3.5 sample size, evenly spread across the catalog.")
    ap.add_argument("--wikidot-sample", type=int, default=15,
                    help="Per-category 5e sample size for spells/feats/items; all base classes are tested.")
    ap.add_argument("--min-rate", type=float, default=1.0,
                    help="Minimum success rate required per category. Release gate is 1.0.")
    ap.add_argument("--delay", type=float, default=0.10)
    ap.add_argument("--full", action="store_true",
                    help="Audit every discovered record instead of sampling.")
    ap.add_argument("--shard-count", type=int, default=1,
                    help="Split a full selected category into deterministic read-only shards.")
    ap.add_argument("--shard-index", type=int, default=0,
                    help="Zero-based shard index used with --shard-count.")
    ap.add_argument("--report", type=Path,
                    help="Optional JSON report path. Writing a report does not alter catalog data.")
    ap.add_argument("--only", nargs="+", choices=[
        "3.5/classes","3.5/feats","3.5/spells","3.5/items","3.5/equipment",
        "5e/classes","5e/spells","5e/feats","5e/items"
    ], help="Audit only selected categories. Intended for sharded full-catalog CI.")
    args = ap.parse_args()

    if args.shard_count < 1 or not 0 <= args.shard_index < args.shard_count:
        ap.error("--shard-index must be within 0..--shard-count-1")
    if args.shard_count > 1 and not args.full:
        ap.error("Sharding is only valid with --full")
    selected = set(args.only or [])
    if args.shard_count > 1 and len(selected) != 1:
        ap.error("Sharded preflight requires exactly one explicit --only category")
    dnd_sample = None if args.full else args.dnd_sample
    wikidot_sample = None if args.full else args.wikidot_sample
    started = time.time()
    results = []
    results.extend(dndtools_preflight(
        dnd_sample,
        args.delay,
        strict=True,
        only=selected,
        shard_count=args.shard_count,
        shard_index=args.shard_index,
    ))
    results.extend(wikidot_preflight(
        wikidot_sample,
        args.delay,
        strict=True,
        only=selected,
        shard_count=args.shard_count,
        shard_index=args.shard_index,
    ))

    complete_scope = bool(args.full and args.shard_count == 1)
    report = {
        "readOnly": True,
        "fullCatalog": bool(complete_scope and not selected),
        "fullScopeForSelectedCategories": complete_scope,
        "scopeCategories": sorted(selected) if selected else [
            "3.5/classes","3.5/feats","3.5/spells","3.5/items","3.5/equipment",
            "5e/classes","5e/spells","5e/feats","5e/items"
        ],
        "strictGameplayCompleteness": True,
        "sourceExtractionVerified": bool(args.shard_count == 1),
        "outputCompletenessVerified": False,
        "releaseReady": False,
        "dndSamplePerCategory": "ALL" if args.full else args.dnd_sample,
        "wikidotSamplePerCategory": "ALL" if args.full else args.wikidot_sample,
        "minimumRate": args.min_rate,
        "shardCount": args.shard_count,
        "shardIndex": args.shard_index,
        "elapsedSeconds": round(time.time() - started, 2),
        "categories": results,
    }
    report["criticalMissingCount"] = sum(r["failed"] for r in results)
    report["passed"] = all(r["successRate"] >= args.min_rate for r in results) and report["criticalMissingCount"] == 0
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))

    bad = [r for r in results if r["successRate"] < args.min_rate or r["failed"] > 0]
    if bad:
        print("\nPRECHECK FAILED:", ", ".join(
            f"{r['category']}={r['successRate']:.1%}" for r in bad
        ), file=sys.stderr)
        raise SystemExit(1)

    print("\nPASS broad live enrichment preflight")


if __name__ == "__main__":
    main()
