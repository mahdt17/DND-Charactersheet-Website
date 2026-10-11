#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=execFileSync(process.execPath,[path.join(root,'scripts','audit_class_subsystem_primitives35.mjs'),'--json'],{cwd:root,encoding:'utf8'});
const report=JSON.parse(output);

assert.equal(report.total,1054,'primitive coverage audit must span the complete 3.5 class catalog');
assert.equal(report.mutatesSource,false,'coverage audit must remain read-only');
assert.ok(report.prerequisites&&Number.isInteger(report.prerequisites.unsupportedClassCount),'unsupported prerequisite reach is required');
assert.ok(report.featureStacking&&Number.isInteger(report.featureStacking.candidateClassCount),'feature-stacking reach is required');
assert.ok(Array.isArray(report.prerequisites.clusters)&&report.prerequisites.clusters.length>0,'unsupported prerequisites must be decomposed into repeated shapes');
assert.ok(Array.isArray(report.featureStacking.clusters)&&report.featureStacking.clusters.length>0,'feature-stacking candidates must be decomposed into reusable feature families');
assert.ok(report.prerequisites.clusters.every(row=>row.kind&&Number.isInteger(row.count)&&row.count>0));
assert.ok(report.featureStacking.clusters.every(row=>row.kind&&Number.isInteger(row.count)&&row.count>0));
assert.ok(Number.isInteger(report.featureStacking.genericFeatureProgressionCandidateCount),'generic feature-progression representability must be reported');
assert.ok(Number.isInteger(report.featureStacking.specializedOrUnresolvedCandidateCount),'remaining stacking candidates must be reported');
assert.equal(report.featureStacking.genericFeatureProgressionCandidateCount+report.featureStacking.specializedOrUnresolvedCandidateCount,report.featureStacking.candidateClassCount,'generic and unresolved stacking partitions must cover the candidate union exactly');
assert.ok(report.featureStacking.genericFeatureProgressionCandidateCount>report.featureStacking.candidateClassCount/2,'the shared progression ledger should represent a majority of stacking candidates');
assert.ok(Array.isArray(report.featureStacking.genericFeatureProgressionExamples)&&report.featureStacking.genericFeatureProgressionExamples.length>0,'representable exact source examples are required');
assert.ok(Array.isArray(report.featureStacking.specializedOrUnresolvedExamples),'unresolved exact source examples are required');
assert.ok(['prerequisites','feature-stacking'].includes(report.recommendedNext),'audit must recommend the higher-reach missing primitive family');

console.log(`PASS subsystem primitive audit compares prerequisite and feature-stacking reach across ${report.total} classes.`);
