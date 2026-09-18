from __future__ import annotations

import json
import tempfile
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))

import enrich_dndtools as d35
import import_wikidot as w5
import audit_enrichment_output as output_audit

REQUIRED=sorted(d35.REQUIRED_AUDIT_CATEGORIES)
assert set(REQUIRED)==w5.REQUIRED_AUDIT_CATEGORIES


def report(categories=None, *, full=True, passed=True, missing=0, rate=1.0, output=True):
    cats=categories if categories is not None else REQUIRED
    return {
        "readOnly":True,
        "fullCatalog":full,
        "strictGameplayCompleteness":True,
        "sourceExtractionVerified":True,
        "outputCompletenessVerified":output,
        "releaseReady":output,
        "minimumRate":rate,
        "criticalMissingCount":missing,
        "passed":passed,
        "categories":[
            {"category":name,"sampled":100,"passed":100,"failed":0,"successRate":1.0}
            for name in cats
        ],
    }


with tempfile.TemporaryDirectory() as tmp:
    path=Path(tmp)/"audit.json"

    assert not d35.audit_report_allows_write(None)
    assert not w5.audit_report_allows_write(None)

    path.write_text(json.dumps(report(full=False)),encoding="utf-8")
    assert not d35.audit_report_allows_write(str(path))
    assert not w5.audit_report_allows_write(str(path))

    source_only=report(output=False)
    path.write_text(json.dumps(source_only),encoding="utf-8")
    assert not d35.audit_report_allows_write(str(path))
    assert not w5.audit_report_allows_write(str(path))

    path.write_text(json.dumps(report(categories=REQUIRED[:-1])),encoding="utf-8")
    assert not d35.audit_report_allows_write(str(path))
    assert not w5.audit_report_allows_write(str(path))

    bad=report()
    bad["categories"][0]["failed"]=1
    bad["categories"][0]["passed"]=99
    bad["categories"][0]["successRate"]=0.99
    bad["criticalMissingCount"]=1
    bad["passed"]=False
    path.write_text(json.dumps(bad),encoding="utf-8")
    assert not d35.audit_report_allows_write(str(path))
    assert not w5.audit_report_allows_write(str(path))

    almost=report(rate=0.999)
    path.write_text(json.dumps(almost),encoding="utf-8")
    assert not d35.audit_report_allows_write(str(path))
    assert not w5.audit_report_allows_write(str(path))

    good=report()
    path.write_text(json.dumps(good),encoding="utf-8")
    assert d35.audit_report_allows_write(str(path))
    assert w5.audit_report_allows_write(str(path))

# Critical-gap contracts must flag missing gameplay mechanics rather than just parse success.
class_gaps=d35.enrichment_gaps("classes",{
    "sourceBook":"Example",
    "hit_die":8,
    "skillPoints":"4 + Int",
    "progression":[["Level","BAB"],["1","+0"]],
    "classSkills":["Spot"],
    "mechanicsPresence":{"classFeatures":False,"ruleProse":True},
})
assert "classFeatures" in class_gaps

feat_gaps=d35.enrichment_gaps("feats",{
    "sourceBook":"Example",
    "featType":"General feat",
    "mechanicsPresence":{"benefit":False,"description":False,"ruleProse":False},
})
assert "featEffect" in feat_gaps

spell_gaps=w5.enrichment_gaps({"category":"spell"},{
    "level":3,"school":"Evocation","casting_time":"1 action","components":["V","S"],
    "range":"150 feet","duration":"Instantaneous","classes":["Wizard"],
    "mechanicsPresence":{"ruleProse":False},
})
assert spell_gaps==["spellEffect"]

# Final-output class audit must match the source completeness contract closely enough
# to catch staging/generation losses, including dynamic class-skill rules.
complete_class={
    "name":"Example Prestige Class",
    "sourceBook":"Example",
    "generatedDescription":"Structured generated summary.",
    "hit_die":8,
    "skillPoints":"4 + Int",
    "progression":[["Level","BAB","Special"],["1st","+0","Example feature"]],
    "classSkillRule":{"mode":"inherit_from_other_classes"},
    "prestige":True,
    "prerequisites":[{"kind":"skills","label":"Skills","text":"Spot 5 ranks"}],
    "featureNames":["Example feature"],
    "mechanicsPresence":{"classFeatures":True,"ruleProse":True},
}
assert output_audit.class_gaps(complete_class)==[]

missing_skill_points=dict(complete_class)
missing_skill_points.pop("skillPoints")
assert "skillPoints" in output_audit.class_gaps(missing_skill_points)

conflicted=dict(complete_class)
conflicted["supplementConflicts"]=["hit_die"]
assert "supplementConflict" in output_audit.class_gaps(conflicted)

print("PASS enrichment release gate rejects incomplete audits and critical gameplay gaps")
