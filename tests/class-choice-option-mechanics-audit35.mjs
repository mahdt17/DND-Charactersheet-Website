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
assert.ok(report.consumerSpecificKeys.includes('minEffectiveLevel'));
assert.ok(report.consumerSpecificKeys.includes('levelAdjustment'));
assert.ok(Object.keys(report.unhandledKeyCounts).length>0,'audit should surface structured option fields that are not yet generically materialized');
assert.equal(report.mutatesData,false);
assert.equal(report.certifiesClasses,false);
console.log(`choice option mechanics audit ok (${report.featuresWithChoiceOptionMechanics} features, ${report.choiceOptionsWithMechanics} option mechanics)`);
