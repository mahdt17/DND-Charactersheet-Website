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
assert spell_gaps==["effectSummary","spellEffect"]

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

# Realistic site shell: HTML title previously let navigation pass for effect text.
html="""<title>Example - DND 5th Edition</title><p>You should be logged in to clone a site.</p><div id="page-content"><h1>Example</h1><p>Source: Example Book</p><p>This short rule grants advantage on the next check.</p></div><p>Click here to edit contents of this page.</p>"""
p=w5.Page();p.feed(html);p.close()
assert w5.concise_rule_effect(p,"Example",("Example Book",))==("This short rule grants advantage on the next check.",False)
# A short secondary clause must not hide an unrepresented long primary effect.
p=w5.Page();p.feed('<h1>Example</h1><p>'+('Long mechanics with multiple conditions. '*15)+'</p><p>This second effect lasts for only one round.</p>');p.close()
assert w5.concise_rule_effect(p,"Example")==("",True)
for category in ["spell","feat","item"]:
 assert "effectBoilerplate" in w5.enrichment_gaps({"category":category},{"effect":"You should be logged in to clone a site."})
assert not output_audit.presence({"effect":"You should be logged in to clone a site."},"effect")

html="""<div id="page-content"><h1>Complex</h1><p>Source: Test</p><p>1st-level evocation</p>
<p>Casting Time: 1 action</p><p>Range: 60 feet</p><p>Components: V, S</p><p>Duration: Instantaneous</p>
<p>Primary mechanical paragraph with enough detail to qualify as rule prose.</p>
<ul><li>Short rider: prone.</li><li>Another rider with a conditional exception.</li></ul>
<p>At Higher Levels. Increase the damage by one die for each slot level above 1st.</p>
<table><tr><th>d4</th><th>Result</th></tr><tr><td>1</td><td>One</td></tr></table></div>"""
p=w5.Page();p.feed(html);p.close()
ev=w5.rule_evidence(p,"Complex",("Test","1st-level evocation","1 action","60 feet","Instantaneous","V, S"))
assert ev["blockCount"]>=4 and ev["tableCount"]==1 and ev["hasUpcasting"] and ev["hasNestedRules"]
row=w5.source_record("Complex",w5.BASE+"/spell:complex","spell",{"level":1})
parsed=w5.parse_spell_detail(row,p)
assert parsed.get("effectNeedsSummary") is True and not parsed.get("effect")
print("PASS site-shell contamination, multi-block/table evidence and partial-effect rejection")
