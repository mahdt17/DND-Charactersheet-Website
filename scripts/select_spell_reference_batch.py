"""Select a deterministic, fail-closed batch of resolved 3.5 spell references.

This tool is review-only. It selects only reference-dependent records whose single
spell dependency resolves to a permanently regression-locked, self-contained
primary-source record. It never mutates catalogs or approves summaries.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import classify_spell_review_queue as classifier
import enrich_dndtools as d35


ALLOWED_TAGS = {
    "reference-dependent",
    "external-mechanics-reference",
    "manual-verification-required",
}

LEGACY_REFERENCE_SOURCE_BOOKS = {
    "Ghostwalk",
    "Savage Species",
}

# Cross-sourcebook inheritance remains fail-closed. Add pairs only after
# independently confirming that both sources use compatible 3.5 mechanics.
ALLOWED_CROSS_SOURCEBOOK_PAIRS = {
    ("Spell Compendium", "Player's Handbook v.3.5"),
}


ALLOWED_EXTERNAL_REASONS = {
    "leading-inherited-spell",
    "similar-to-named-spell-comparison",
    "as-with-named-spell",
    "receives-named-spell-inheritance",
    "named-effect-shorthand",
    "parenthetical-as-the-spell",
    "named-spell-benefit",
    "generic-identical-with",
}

HEADER_FIELDS = (
    "school",
    "castingTime",
    "components",
    "range",
    "target",
    "area",
    "duration",
    "savingThrow",
    "spellResistance",
    "descriptors",
)


def normalized_header(entry: dict) -> dict | None:
    header = entry.get("header")
    if not isinstance(header, dict):
        return None
    result = {}
    for field in HEADER_FIELDS:
        value = header.get(field)
        if isinstance(value, list):
            result[field] = [d35.clean(str(item)) for item in value if d35.clean(str(item))]
        else:
            result[field] = d35.clean(str(value or ""))
    return result


def header_differences(source_entry: dict, target_entry: dict) -> list[dict]:
    source_header = normalized_header(source_entry)
    target_header = normalized_header(target_entry)
    if source_header is None or target_header is None:
        return []
    differences = []
    for field in HEADER_FIELDS:
        if source_header[field] == target_header[field]:
            continue
        differences.append({
            "field": field,
            "source": source_header[field],
            "reference": target_header[field],
        })
    return differences


def strip_resolved_reference_page_citations(
    effect_source: str,
    reference_name: str | None,
    target_name: str | None,
) -> str:
    """Strip only page citations directly attached to the resolved spell name."""
    stripped = effect_source or ""
    names = {
        d35.clean(reference_name or ""),
        d35.clean(target_name or ""),
    }
    names.discard("")
    citation = (
        r"(?:PH\s*\d+|page\s+\d+|"
        r"see\s+page\s+\d+(?:\s+of\s+the\s+Player[’']s\s+Handbook)?)"
    )
    for name in sorted(names, key=len, reverse=True):
        name_pattern = re.escape(name).replace(r"\ ", r"\s+")
        pattern = re.compile(
            rf"(?P<name>{name_pattern})\s*\(\s*{citation}\s*\)",
            re.I,
        )
        stripped = pattern.sub(lambda match: match.group("name"), stripped)
    return stripped


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def candidate_reasons(
    classified: dict,
    packet: dict,
    queue_ids: set[str],
    regression_ids: set[str],
) -> list[str]:
    reasons: list[str] = []
    record_id = classified.get("id")
    source = packet.get("effectSource") or ""

    # Phrases like "except as noted/described above/here" delegate part of
    # the mechanics to the spell header. They are reviewable only when both
    # headers are captured and at least one explicit header field differs.
    header_exception = bool(
        re.search(r"\bexcept\s+as\s+(?:noted|described)\s+(?:above|here)\b", source, re.I)
    )

    if packet.get("id") != record_id:
        reasons.append("classification-packet-id-mismatch")
    if classified.get("primaryBucket") != "reference-dependent":
        reasons.append("not-reference-dependent-primary")
    if classified.get("sourceBook") in LEGACY_REFERENCE_SOURCE_BOOKS:
        reasons.append("legacy-source-edition-needs-manual-reference-review")
    if classified.get("suspiciousReasons"):
        reasons.append("classifier-suspicious-reasons")

    tags = set(classified.get("tags") or [])
    if not tags.issubset(ALLOWED_TAGS):
        reasons.append("disallowed-classifier-tags")

    external_reasons = set(classified.get("externalMechanicsReasons") or [])
    provisional_external = ALLOWED_EXTERNAL_REASONS | {"external-page-reference"}
    if not external_reasons.issubset(provisional_external):
        reasons.append("disallowed-external-mechanics")

    packet_sha = packet.get("sourceSha256")
    actual_source_sha = d35.spell_effect_digest(source)
    if not source.strip():
        reasons.append("empty-effect-source")
    if classified.get("sourceSha256") != actual_source_sha:
        reasons.append("classification-source-sha-mismatch")
    if packet_sha != actual_source_sha:
        reasons.append("packet-source-sha-mismatch")

    # Re-run current detectors so stale artifacts fail closed.
    if classifier.suspicious_reasons(packet):
        reasons.append("current-suspicion-detector-hit")
    current_external = set(classifier.external_mechanics_reasons(source))
    if not current_external.issubset(provisional_external):
        reasons.append("current-disallowed-external-mechanics")

    references = packet.get("references") or []
    if len(references) != 1:
        reasons.append("requires-exactly-one-reference")
        return sorted(set(reasons))

    reference = references[0]
    if reference.get("status") != "resolved":
        reasons.append("reference-not-resolved")
        return sorted(set(reasons))

    target = reference.get("record")
    if not target:
        reasons.append("resolved-reference-missing-record")
        return sorted(set(reasons))

    if header_exception:
        source_header = normalized_header(packet)
        target_header = normalized_header(target)
        if source_header is None or target_header is None:
            reasons.append("header-dependent-exception-missing-header-context")
        elif not header_differences(packet, target):
            reasons.append("header-dependent-exception-without-header-difference")

    if "external-page-reference" in external_reasons or "external-page-reference" in current_external:
        citation_stripped_source = strip_resolved_reference_page_citations(
            source,
            reference.get("referenceName"),
            target.get("name"),
        )
        if citation_stripped_source == source:
            reasons.append("unverified-reference-page-citation")
        else:
            stripped_external = set(
                classifier.external_mechanics_reasons(citation_stripped_source)
            )
            if not stripped_external.issubset(ALLOWED_EXTERNAL_REASONS):
                reasons.append("current-disallowed-external-mechanics")

    source_book = d35.clean(classified.get("sourceBook") or packet.get("sourceBook") or "")
    target_source_book = d35.clean(target.get("sourceBook") or "")
    if not source_book or not target_source_book:
        reasons.append("reference-sourcebook-missing")
    elif (
        source_book.casefold() != target_source_book.casefold()
        and (source_book, target_source_book) not in ALLOWED_CROSS_SOURCEBOOK_PAIRS
    ):
        reasons.append("reference-target-sourcebook-mismatch")

    target_id = target.get("id")
    candidate_ids = reference.get("candidateIds") or []
    if len(candidate_ids) != 1 or candidate_ids[0] != target_id:
        reasons.append("reference-candidate-identity-not-unique")

    if target_id == record_id:
        reasons.append("self-reference")
    if target_id in queue_ids:
        reasons.append("reference-target-still-in-review-queue")
    if target_id not in regression_ids:
        reasons.append("reference-target-not-regression-locked")

    target_source = target.get("effectSource") or ""
    target_summary = d35.clean(target.get("effectSummary") or "")
    target_review_verified = bool(target.get("effectReviewVerified") and target_summary)

    if target.get("effectReferenceDependent") and not target_review_verified:
        reasons.append("reference-target-reference-dependent")
    if target.get("sourceIncomplete"):
        reasons.append("reference-target-source-incomplete")
    if target.get("effectReviewMismatch"):
        reasons.append("reference-target-review-digest-mismatch")
    if target.get("effectReviewTableMismatch"):
        reasons.append("reference-target-table-digest-mismatch")
    if target.get("tables") or target.get("tablesSha256"):
        reasons.append("reference-target-table-driven")

    target_sha = d35.spell_effect_digest(target_source)
    if not target_source.strip():
        reasons.append("reference-target-empty-source")
    if target.get("sourceSha256") != target_sha:
        reasons.append("reference-target-source-sha-mismatch")

    if target_review_verified:
        reviewed_target = {
            **target,
            "effectSource": target_summary,
            "sourceIncomplete": False,
            "tables": [],
        }
        if classifier.suspicious_reasons(reviewed_target):
            reasons.append("reference-target-reviewed-summary-suspicion-hit")
        if classifier.external_mechanics_reasons(target_summary):
            reasons.append("reference-target-reviewed-summary-external-mechanics-hit")
        if classifier.extract_reference_names(target_summary):
            reasons.append("reference-target-reviewed-summary-reference-hit")
    else:
        if classifier.suspicious_reasons(target):
            reasons.append("reference-target-current-suspicion-hit")
        if classifier.external_mechanics_reasons(target_source):
            reasons.append("reference-target-current-external-mechanics-hit")
        if classifier.extract_reference_names(target_source):
            reasons.append("reference-target-current-reference-hit")

    counts = packet.get("resolutionStatusCounts") or {}
    # A digest-locked reviewed target summary is the canonical mechanics boundary.
    # Once that summary is independently verified as self-contained above, nested
    # references found only in the target's original source prose are no longer
    # dependencies of the candidate being selected.
    if not target_review_verified and counts != {"resolved": 1}:
        reasons.append("reference-resolution-count-not-exact")

    return sorted(set(reasons))


def select_batch(
    classification: dict,
    packets: dict,
    regressions: dict,
    count: int,
) -> dict:
    errors: list[str] = []
    if not classification.get("reviewOnly") or classification.get("catalogMutation") is not False:
        errors.append("classification artifact is not explicitly review-only")
    if not packets.get("reviewOnly") or packets.get("catalogMutation") is not False:
        errors.append("reference packet artifact is not explicitly review-only")
    validation = classification.get("knownCorpusValidation") or {}
    if validation.get("errors"):
        errors.append("classification known-corpus validation contains errors")
    if validation.get("warnings"):
        errors.append("classification known-corpus validation contains warnings")
    if errors:
        raise ValueError("; ".join(errors))

    regression_ids = set(regressions.get("recordIds") or [])
    queue_entries = classification.get("entries") or []
    queue_ids = {entry.get("id") for entry in queue_entries}
    if None in queue_ids or len(queue_ids) != len(queue_entries):
        raise ValueError("classification contains missing or duplicate record IDs")

    classified_by_id = {entry["id"]: entry for entry in queue_entries}
    packet_entries = packets.get("entries") or []
    packet_ids = [entry.get("id") for entry in packet_entries]
    if None in packet_ids or len(set(packet_ids)) != len(packet_ids):
        raise ValueError("reference packet artifact contains missing or duplicate record IDs")

    eligible: list[dict] = []
    rejected_counts: dict[str, int] = {}
    rejected_entries: list[dict] = []

    def rejection_diagnostic(packet: dict, reasons: list[str], classified: dict | None = None) -> dict:
        references = []
        for reference in packet.get("references") or []:
            target = reference.get("record") or {}
            references.append({
                "referenceName": reference.get("referenceName"),
                "status": reference.get("status"),
                "candidateIds": reference.get("candidateIds") or [],
                "targetId": target.get("id"),
                "targetName": target.get("name"),
                "targetSourceBook": target.get("sourceBook"),
                "headerDifferences": header_differences(packet, target) if target else [],
            })
        return {
            "id": packet.get("id"),
            "name": packet.get("name"),
            "sourceBook": (classified or {}).get("sourceBook"),
            "reasons": sorted(set(reasons)),
            "references": references,
        }

    for packet in packet_entries:
        classified = classified_by_id.get(packet["id"])
        if classified is None:
            reason = "packet-record-not-in-review-queue"
            rejected_counts[reason] = rejected_counts.get(reason, 0) + 1
            rejected_entries.append(rejection_diagnostic(packet, [reason]))
            continue
        reasons = candidate_reasons(classified, packet, queue_ids, regression_ids)
        if reasons:
            for reason in reasons:
                rejected_counts[reason] = rejected_counts.get(reason, 0) + 1
            rejected_entries.append(rejection_diagnostic(packet, reasons, classified))
            continue
        candidate = json.loads(json.dumps(packet))
        target = candidate["references"][0]["record"]
        differences = header_differences(candidate, target)
        if differences:
            candidate["referenceHeaderDifferences"] = differences
        eligible.append(candidate)

    rejected_entries.sort(
        key=lambda entry: (
            entry.get("id") or "",
            entry.get("name") or "",
        )
    )
    eligible.sort(
        key=lambda entry: (
            len(d35.clean(entry.get("effectSource") or "")),
            d35.clean(entry.get("name") or "").casefold(),
            entry.get("id") or "",
        )
    )
    if len(eligible) < count:
        raise ValueError(
            f"requested {count} records but only {len(eligible)} resolved-reference candidates remain"
        )

    selected = eligible[:count]
    fingerprint_lines: list[str] = []
    for entry in selected:
        ref = entry["references"][0]
        target = ref["record"]
        header_fingerprint = json.dumps(
            entry.get("referenceHeaderDifferences") or [],
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
        )
        fingerprint_lines.append(
            f"{entry.get('id')}:{entry.get('sourceSha256')}:"
            f"{target.get('id')}:{target.get('sourceSha256')}:{header_fingerprint}"
        )
    fingerprint = "\n".join(fingerprint_lines)

    return {
        "reviewOnly": True,
        "catalogMutation": False,
        "selectionPolicy": "resolved-single-reference-compatible-sourcebook-regression-locked-reviewed-boundary-header-aware-shortest-first-v6",
        "requestedCount": count,
        "eligibleCount": len(eligible),
        "selectedCount": len(selected),
        "selectionSha256": hashlib.sha256(fingerprint.encode("utf-8")).hexdigest(),
        "rejectedReasonCounts": dict(sorted(rejected_counts.items())),
        "rejectedDiagnosticsVersion": 1,
        "rejectedEntries": rejected_entries,
        "entries": selected,
    }


def run_self_test() -> None:
    base_source = "The subject gains resistance 10 to one energy type."
    base_sha = d35.spell_effect_digest(base_source)
    target = {
        "id": "spells/resist-energy-test",
        "name": "Resist Energy Test",
        "sourceBook": "Player's Handbook v.3.5",
        "sourceSha256": base_sha,
        "tablesSha256": None,
        "tables": [],
        "effectSource": base_source,
        "effectReferenceDependent": False,
        "sourceIncomplete": False,
        "effectReviewMismatch": False,
        "effectReviewTableMismatch": False,
    }

    source = "As resist energy, except that it affects multiple creatures."
    source_sha = d35.spell_effect_digest(source)
    classified = {
        "id": "spells/resist-energy-mass-test",
        "name": "Resist Energy Mass Test",
        "sourceBook": "Player's Handbook v.3.5",
        "sourceSha256": source_sha,
        "primaryBucket": "reference-dependent",
        "tags": ["reference-dependent"],
        "suspiciousReasons": [],
        "externalMechanicsReasons": [],
    }
    packet = {
        "id": classified["id"],
        "name": classified["name"],
        "sourceSha256": source_sha,
        "effectSource": source,
        "references": [{
            "referenceName": "resist energy",
            "normalizedReferenceName": "resist energy",
            "candidateIds": [target["id"]],
            "status": "resolved",
            "record": target,
        }],
        "resolutionStatusCounts": {"resolved": 1},
    }
    report = {
        "reviewOnly": True,
        "catalogMutation": False,
        "knownCorpusValidation": {"errors": [], "warnings": []},
        "entries": [classified],
    }
    packets = {"reviewOnly": True, "catalogMutation": False, "entries": [packet]}
    regressions = {"recordIds": [target["id"]]}

    selected = select_batch(report, packets, regressions, 1)
    assert selected["selectedCount"] == 1
    assert selected["entries"][0]["id"] == classified["id"]

    zero = select_batch(report, packets, regressions, 0)
    assert zero["selectedCount"] == 0
    assert zero["eligibleCount"] == 1
    assert zero["rejectedEntries"] == []

    unlocked = select_batch(report, packets, {"recordIds": []}, 0)
    assert unlocked["eligibleCount"] == 0
    assert len(unlocked["rejectedEntries"]) == 1
    diagnostic = unlocked["rejectedEntries"][0]
    assert diagnostic["id"] == classified["id"]
    assert diagnostic["reasons"] == ["reference-target-not-regression-locked"]
    assert diagnostic["references"][0]["targetId"] == target["id"]

    unresolved = json.loads(json.dumps(packet))
    unresolved["references"][0]["status"] = "ambiguous"
    unresolved["references"][0].pop("record")
    unresolved["resolutionStatusCounts"] = {"ambiguous": 1}
    assert "reference-not-resolved" in candidate_reasons(
        classified, unresolved, {classified["id"]}, {target["id"]}
    )

    assert "reference-target-still-in-review-queue" in candidate_reasons(
        classified, packet, {classified["id"], target["id"]}, {target["id"]}
    )
    assert "reference-target-not-regression-locked" in candidate_reasons(
        classified, packet, {classified["id"]}, set()
    )

    reviewed_nested = json.loads(json.dumps(packet))
    reviewed_target = reviewed_nested["references"][0]["record"]
    reviewed_target["effectSource"] = (
        "This spell functions like protection from energy, except it grants resistance 10."
    )
    reviewed_target["sourceSha256"] = d35.spell_effect_digest(reviewed_target["effectSource"])
    reviewed_target["effectReferenceDependent"] = True
    reviewed_target["effectSummary"] = "The subject gains resistance 10 to one energy type."
    reviewed_target["effectReviewVerified"] = True
    reviewed_nested["references"][0]["references"] = [{
        "referenceName": "protection from energy",
        "status": "resolved",
        "candidateIds": ["spells/protection-from-energy-test"],
    }]
    reviewed_nested["resolutionStatusCounts"] = {"resolved": 2}
    reviewed_reasons = candidate_reasons(
        classified, reviewed_nested, {classified["id"]}, {target["id"]}
    )
    assert "reference-target-reference-dependent" not in reviewed_reasons
    assert "reference-target-current-reference-hit" not in reviewed_reasons
    assert "reference-target-reviewed-summary-reference-hit" not in reviewed_reasons
    assert "reference-resolution-count-not-exact" not in reviewed_reasons

    unverified_nested = json.loads(json.dumps(reviewed_nested))
    unverified_nested["references"][0]["record"]["effectReviewVerified"] = False
    unverified_reasons = candidate_reasons(
        classified, unverified_nested, {classified["id"]}, {target["id"]}
    )
    assert "reference-target-reference-dependent" in unverified_reasons
    assert "reference-resolution-count-not-exact" in unverified_reasons

    unresolved_review = json.loads(json.dumps(reviewed_nested))
    unresolved_review["references"][0]["record"]["effectSummary"] = (
        "This effect functions like protection from energy."
    )
    assert "reference-target-reviewed-summary-reference-hit" in candidate_reasons(
        classified, unresolved_review, {classified["id"]}, {target["id"]}
    )

    cited = json.loads(json.dumps(packet))
    cited["effectSource"] = (
        "This spell functions like Resist Energy Test (PH 272), "
        "except that it affects multiple creatures."
    )
    cited["sourceSha256"] = d35.spell_effect_digest(cited["effectSource"])
    cited["references"][0]["referenceName"] = "Resist Energy Test"
    cited_classified = json.loads(json.dumps(classified))
    cited_classified["sourceSha256"] = cited["sourceSha256"]
    cited_classified["tags"] = [
        "reference-dependent",
        "external-mechanics-reference",
        "manual-verification-required",
    ]
    cited_classified["externalMechanicsReasons"] = ["external-page-reference"]
    cited_reasons = candidate_reasons(
        cited_classified, cited, {classified["id"]}, {target["id"]}
    )
    assert "disallowed-external-mechanics" not in cited_reasons
    assert "current-disallowed-external-mechanics" not in cited_reasons
    assert "unverified-reference-page-citation" not in cited_reasons

    cited_extra = json.loads(json.dumps(cited))
    cited_extra["effectSource"] += " See page 150 for planar hazard rules."
    cited_extra["sourceSha256"] = d35.spell_effect_digest(cited_extra["effectSource"])
    cited_extra_classified = json.loads(json.dumps(cited_classified))
    cited_extra_classified["sourceSha256"] = cited_extra["sourceSha256"]
    assert "current-disallowed-external-mechanics" in candidate_reasons(
        cited_extra_classified, cited_extra, {classified["id"]}, {target["id"]}
    )

    assert strip_resolved_reference_page_citations(
        "As Earthen Grasp (see page 104), except the arm is stone.",
        "Earthen Grasp",
        "Earthen Grasp",
    ) == "As Earthen Grasp, except the arm is stone."
    header_dependent = json.loads(json.dumps(packet))
    header_dependent["effectSource"] = "As Resist Energy Test, except as noted above."
    header_dependent["sourceSha256"] = d35.spell_effect_digest(header_dependent["effectSource"])
    header_dependent["header"] = {
        "school": "Abjuration",
        "castingTime": "1 standard action",
        "components": ["V", "S"],
        "range": "Close (25 ft. + 5 ft./2 levels)",
        "target": "One creature/level",
        "area": "",
        "duration": "10 min./level",
        "savingThrow": "Fortitude negates (harmless)",
        "spellResistance": "Yes (harmless)",
        "descriptors": [],
    }
    header_target = header_dependent["references"][0]["record"]
    header_target["header"] = {
        "school": "Abjuration",
        "castingTime": "1 standard action",
        "components": ["V", "S"],
        "range": "Touch",
        "target": "Creature touched",
        "area": "",
        "duration": "10 min./level",
        "savingThrow": "Fortitude negates (harmless)",
        "spellResistance": "Yes (harmless)",
        "descriptors": [],
    }
    header_classified = json.loads(json.dumps(classified))
    header_classified["sourceSha256"] = header_dependent["sourceSha256"]
    header_reasons = candidate_reasons(
        header_classified, header_dependent, {classified["id"]}, {target["id"]}
    )
    assert "header-dependent-exception-missing-header-context" not in header_reasons
    assert "header-dependent-exception-without-header-difference" not in header_reasons
    assert {row["field"] for row in header_differences(header_dependent, header_target)} == {
        "range", "target"
    }

    missing_header = json.loads(json.dumps(header_dependent))
    missing_header.pop("header")
    assert "header-dependent-exception-missing-header-context" in candidate_reasons(
        header_classified, missing_header, {classified["id"]}, {target["id"]}
    )

    same_header = json.loads(json.dumps(header_dependent))
    same_header["header"] = json.loads(json.dumps(same_header["references"][0]["record"]["header"]))
    assert "header-dependent-exception-without-header-difference" in candidate_reasons(
        header_classified, same_header, {classified["id"]}, {target["id"]}
    )

    described_above = json.loads(json.dumps(header_dependent))
    described_above["effectSource"] = "This spell functions like Resist Energy Test, except as described above, and grants resistance 20."
    described_above["sourceSha256"] = d35.spell_effect_digest(described_above["effectSource"])
    described_classified = json.loads(json.dumps(classified))
    described_classified["sourceSha256"] = described_above["sourceSha256"]
    assert "header-dependent-exception-missing-header-context" not in candidate_reasons(
        described_classified, described_above, {classified["id"]}, {target["id"]}
    )

    noted_here = json.loads(json.dumps(header_dependent))
    noted_here["effectSource"] = "This spell functions like Resist Energy Test, except as noted here."
    noted_here["sourceSha256"] = d35.spell_effect_digest(noted_here["effectSource"])
    noted_here_classified = json.loads(json.dumps(classified))
    noted_here_classified["sourceSha256"] = noted_here["sourceSha256"]
    assert "header-dependent-exception-missing-header-context" not in candidate_reasons(
        noted_here_classified, noted_here, {classified["id"]}, {target["id"]}
    )

    explicit_here = json.loads(json.dumps(header_dependent))
    explicit_here["effectSource"] = "This spell functions like Resist Energy Test, except as noted here and it grants resistance 30."
    explicit_here["sourceSha256"] = d35.spell_effect_digest(explicit_here["effectSource"])
    explicit_classified = json.loads(json.dumps(classified))
    explicit_classified["sourceSha256"] = explicit_here["sourceSha256"]
    assert "header-dependent-exception-missing-header-context" not in candidate_reasons(
        explicit_classified, explicit_here, {classified["id"]}, {target["id"]}
    )

    legacy_classified = json.loads(json.dumps(classified))
    legacy_classified["sourceBook"] = "Ghostwalk"
    assert "legacy-source-edition-needs-manual-reference-review" in candidate_reasons(
        legacy_classified, packet, {classified["id"]}, {target["id"]}
    )

    cross_book_classified = json.loads(json.dumps(classified))
    cross_book_classified["sourceBook"] = "Complete Arcane"
    assert "reference-target-sourcebook-mismatch" in candidate_reasons(
        cross_book_classified, packet, {classified["id"]}, {target["id"]}
    )

    spell_compendium_classified = json.loads(json.dumps(classified))
    spell_compendium_classified["sourceBook"] = "Spell Compendium"
    assert "reference-target-sourcebook-mismatch" not in candidate_reasons(
        spell_compendium_classified, packet, {classified["id"]}, {target["id"]}
    )

    missing_book_target = json.loads(json.dumps(target))
    missing_book_target.pop("sourceBook")
    missing_book_packet = json.loads(json.dumps(packet))
    missing_book_packet["references"][0]["record"] = missing_book_target
    assert "reference-sourcebook-missing" in candidate_reasons(
        classified, missing_book_packet, {classified["id"]}, {target["id"]}
    )

    print(json.dumps({"selfTest": "passed"}, indent=2))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--classification", type=Path)
    ap.add_argument("--references", type=Path)
    ap.add_argument(
        "--regressions",
        type=Path,
        default=ROOT / "scripts" / "spell_regression_cases.json",
    )
    ap.add_argument("--count", type=int, default=25)
    ap.add_argument("--output", type=Path)
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()

    if args.self_test:
        run_self_test()
        return
    if not args.classification or not args.references or not args.output:
        ap.error("--classification, --references and --output are required unless --self-test is used")
    if args.count < 0:
        ap.error("--count must be non-negative")

    payload = select_batch(
        load_json(args.classification),
        load_json(args.references),
        load_json(args.regressions),
        args.count,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "selectedCount": payload["selectedCount"],
        "eligibleCount": payload["eligibleCount"],
        "selectionSha256": payload["selectionSha256"],
        "catalogMutation": payload["catalogMutation"],
    }, indent=2))


if __name__ == "__main__":
    main()
