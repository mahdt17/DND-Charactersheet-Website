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
        r"(?!if\b|a\b|an\b)(?P<name>[^.;:!?]{2,120}?)(?=,\s*(?:except|but)\b|[.;:!?]|$)",
        re.I,
    ),
    re.compile(
        r"(?:^|[.!?]\s+)As\s+(?P<name>[^.!?]{2,120}?),\s*(?:except|but)\b",
        re.I,
    ),
)

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
    value = re.sub(r"^(?:the\s+)?(?:spell\s+)?", "", value, flags=re.I)
    value = re.sub(r"\s+spell$", "", value, flags=re.I)
    value = re.sub(r"^(?:a|an)\s+", "", value, flags=re.I)
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
        reference_names = extract_reference_names(source)
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
        if reference_names or parser_reference:
            tags.add("reference-dependent")
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
    assert extract_reference_names("Any scrying sees an image (as the major image spell).") == ["major image"]
    assert extract_reference_names("You transport the target as greater teleport.") == ["greater teleport"]
    assert clean_reference_name("4th-level spell arcane eye") == "arcane eye"
    assert clean_reference_name("arcane eye spell (see page 200)") == "arcane eye"
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
    summaries = load_json(SUMMARIES, {"entries": {}})
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
