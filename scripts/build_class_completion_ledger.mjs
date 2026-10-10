#!/usr/bin/env node
import fs from 'node:fs/promises';
import {buildClassCompletionLedger35} from './class_completion_certification35.mjs';
import {buildClassReviewClusters35} from './class_review_coverage35.mjs';

const args=process.argv.slice(2);
const trackerPath=(args.find(arg=>arg.startsWith('--tracker='))||'--tracker=docs/class-completion-tracker.json').split('=')[1];
const evidencePath=(args.find(arg=>arg.startsWith('--evidence='))||'--evidence=docs/class-completion-evidence35.json').split('=')[1];
const outputArg=args.find(arg=>arg.startsWith('--output='));
const tracker=JSON.parse(await fs.readFile(trackerPath,'utf8'));
const evidence=JSON.parse(await fs.readFile(evidencePath,'utf8'));
const ledger={
  ...buildClassCompletionLedger35(tracker,evidence),
  generatedAt:new Date().toISOString(),
  sourceTracker:trackerPath,
  sourceEvidence:evidencePath
};
ledger.clusters=buildClassReviewClusters35(ledger.entries,{trackerEntries:tracker.entries||[]});
const out=JSON.stringify(ledger,null,2)+'\n';
if(outputArg)await fs.writeFile(outputArg.split('=')[1],out);else process.stdout.write(out);
