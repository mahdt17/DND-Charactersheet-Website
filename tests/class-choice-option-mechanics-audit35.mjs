#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..');
const output=execFileSync(process.execPath,[path.join(root,'scripts','audit_choice_option_mechanics35.mjs'),'--json'],{cwd:root,encoding:'utf8'});
const report=JSON.parse(output);

assert.equal(report.schemaVersion,1);
assert.ok(report.featuresWithChoiceOptionMechanics>0,'reviewed 3.5 data should contain option-specific mechanics');
assert.ok(report.choiceOptionsWithMechanics>=report.featuresWithChoiceOptionMechanics);
assert.ok(report.keyCounts.description>0,'option mechanics should expose reviewed descriptions');
assert.ok(report.runtimeHandledKeys.includes('classSkills'));
assert.ok(report.runtimeHandledKeys.includes('actionType'));
assert.ok(report.runtimeHandledKeys.includes('resource'));
assert.ok(report.runtimeHandledKeys.includes('effects'));
assert.ok(report.runtimeHandledKeys.includes('acceptableAlignments'),'reviewed option alignment constraints should be enforced by the source-choice runtime');
assert.equal(report.unhandledKeyCounts.acceptableAlignments,undefined);
for(const key of ['minEffectiveLevel','levelAdjustment','spellElement','casterLevelBonus','saveBonus','saveBonusType']){
  assert.ok(report.consumerSpecificKeys.includes(key),`${key} is consumed by an existing specialized subsystem and must not be reported as a generic choice gap`);
  assert.equal(report.unhandledKeyCounts[key],undefined);
}
assert.ok(report.dependentChoiceKeys.includes('allowedElements'),'fields consumed by choiceOptionsFromFeatureMechanic must not be reported as generic runtime gaps');
assert.equal(report.unhandledKeyCounts.allowedElements,undefined);
assert.deepEqual(Object.keys(report.unhandledKeyCounts).sort(),['breathWeapon','violationEffect'],'after accounting for existing consumers, only genuinely unsupported structured option fields should remain');
assert.equal(report.mutatesData,false);
assert.equal(report.certifiesClasses,false);
console.log(`choice option mechanics audit ok (${report.featuresWithChoiceOptionMechanics} features, ${report.choiceOptionsWithMechanics} option mechanics)`);
