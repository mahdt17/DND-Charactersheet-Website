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
assert.equal(report.prerequisites.patronDeity.recognizedClassCount,54,'closed patron requirements cover the exact measured cohort');
assert.equal(new Set(report.prerequisites.patronDeity.sourceIds).size,54,'patron coverage exposes every exact source ID');
assert.equal(report.prerequisites.powerPoints.recognizedClassCount,8,'reserve and base PP predicates cover eight exact records');
assert.deepEqual(report.prerequisites.powerPoints.sourceIds,['classes/ebon-saint-276','classes/illithid-slayer-911','classes/mindknight-1032','classes/psibond-agent-299','classes/pyrokineticist-914','classes/sanctified-mind-561','classes/war-mind-916','classes/zerth-cenobite-282']);
assert.equal(report.prerequisites.manifesterLevel.recognizedClassCount,5);
assert.deepEqual(report.prerequisites.manifesterLevel.sourceIds,['classes/crystal-master-1046','classes/meditant-1049','classes/metamind-912','classes/psychic-assassin-1051','classes/sangehirn-1052']);
assert.equal(report.prerequisites.powerAccess.recognizedClassCount,21);
assert.deepEqual(report.prerequisites.powerAccess.sourceIds,['classes/ballisteer-993','classes/cerebral-assassin-994','classes/cerebremancer-908','classes/crystal-master-996','classes/crystalsinger-997','classes/defender-of-sardior-1041','classes/devotee-of-sardior-1040','classes/diamond-dragon-371','classes/elocater-909','classes/grim-psion-1023','classes/iron-mind-733','classes/kineticist-1024','classes/percipient-1042','classes/planar-vanguard-1043','classes/psion-uncarnate-913','classes/psionic-dragon-comrade-1047','classes/psychic-theurge-990','classes/psychic-weapon-master-1034','classes/sangehirn-1036','classes/shadow-mind-1037','classes/soul-manifester-1055']);
assert.ok(report.featureStacking&&Number.isInteger(report.featureStacking.candidateClassCount),'feature-stacking reach is required');
assert.equal(report.featureStacking.candidateClassCount,149,'tracker stacking candidate inventory must remain explicit');
assert.ok(Array.isArray(report.prerequisites.clusters)&&report.prerequisites.clusters.length>0,'unsupported prerequisites must be decomposed into repeated shapes');
assert.ok(Array.isArray(report.featureStacking.clusters)&&report.featureStacking.clusters.length>0,'feature-stacking candidates must be decomposed into reusable feature families');
assert.ok(report.prerequisites.clusters.every(row=>row.kind&&Number.isInteger(row.count)&&row.count>0));
assert.ok(report.featureStacking.clusters.every(row=>row.kind&&Number.isInteger(row.count)&&row.count>0));
assert.equal(report.featureStacking.genericFeatureProgressionCandidateCount,114,'generic feature-progression ledger should cover the measured canonical-feature cohort');
assert.equal(report.featureStacking.specializedOrUnresolvedCandidateCount,35,'specialized or vague stacking tail must remain explicit');
assert.equal(report.featureStacking.genericFeatureProgressionCandidateCount+report.featureStacking.specializedOrUnresolvedCandidateCount,report.featureStacking.candidateClassCount,'generic and unresolved stacking partitions must cover the candidate union exactly');
assert.ok(report.featureStacking.genericFeatureProgressionCandidateCount>report.featureStacking.candidateClassCount/2,'the shared progression ledger should represent a majority of stacking candidates');
assert.ok(Array.isArray(report.featureStacking.genericFeatureProgressionExamples)&&report.featureStacking.genericFeatureProgressionExamples.length>0,'representable exact source examples are required');
assert.ok(Array.isArray(report.featureStacking.specializedOrUnresolvedExamples),'unresolved exact source examples are required');
assert.equal(report.featureStacking.reviewedFeatureProgressionClassCount,2,'reviewed exact-source progression activation inventory must stay explicit');
assert.deepEqual(report.featureStacking.reviewedFeatureProgressionSourceIds,['classes/disciple-of-the-eye-712','classes/sun-soul-monk-305']);
assert.equal(report.featureStacking.reviewedGenericCandidateClassCount,0,'reviewed activations currently sit outside the unresolved generic queue');
assert.equal(report.featureStacking.remainingGenericMetadataCandidateCount,114,'all unresolved generic stacking candidates still require reviewed metadata');
assert.equal(report.featureStacking.reviewedGenericCandidateClassCount+report.featureStacking.remainingGenericMetadataCandidateCount,report.featureStacking.genericFeatureProgressionCandidateCount,'reviewed-candidate intersection and remaining queue must partition the unresolved generic cohort exactly');
assert.ok(Array.isArray(report.featureStacking.remainingGenericMetadataExamples)&&report.featureStacking.remainingGenericMetadataExamples.length>0,'remaining generic metadata queue examples are required');
assert.ok(Array.isArray(report.featureStacking.remainingGenericMetadataClusters)&&report.featureStacking.remainingGenericMetadataClusters.length>0,'remaining generic metadata queue must be grouped by reusable feature family');
assert.ok(report.featureStacking.remainingGenericMetadataClusters.every(row=>row.kind&&Number.isInteger(row.count)&&row.count>0),'remaining queue family rows must carry counts');
assert.ok(report.featureStacking.remainingGenericMetadataClusters.every(row=>Array.isArray(row.sourceIds)&&row.sourceIds.length===row.count&&new Set(row.sourceIds).size===row.count),'each metadata family must expose every exact source ID exactly once');
for(let i=1;i<report.featureStacking.remainingGenericMetadataClusters.length;i++)assert.ok(report.featureStacking.remainingGenericMetadataClusters[i-1].count>=report.featureStacking.remainingGenericMetadataClusters[i].count,'remaining queue families must be sorted by descending reach');
assert.ok(['prerequisites','feature-stacking'].includes(report.recommendedNext),'audit must recommend the higher-reach missing primitive family');

console.log(`PASS subsystem primitive audit compares prerequisite and feature-stacking reach across ${report.total} classes; ${report.featureStacking.genericFeatureProgressionCandidateCount}/${report.featureStacking.candidateClassCount} stacking candidates fit the generic feature-progression contract.`);
