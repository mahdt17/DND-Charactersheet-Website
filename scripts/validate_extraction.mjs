#!/usr/bin/env node
import fs from 'node:fs';

const args=process.argv.slice(2);
const inputPath=args.find(a=>!a.startsWith('--'));
if(!inputPath){console.error('Usage: node scripts/validate_extraction.mjs <batch.json> [--min-chars=800]');process.exit(2);}
const minArg=args.find(a=>a.startsWith('--min-chars='));
const defaultMin=Number(minArg?.split('=')[1]||800);
const payload=JSON.parse(fs.readFileSync(inputPath,'utf8'));
const records=Array.isArray(payload)?payload:payload.records||[];
const norm=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
const contamination=['you should be logged in','please log in','create account','navigation menu','privacy policy','cookie policy','all rights reserved'];

function validate(record){
 const content=String(record.content||record.markdown||record.rawContent||'');
 const text=norm(content),failures=[],warnings=[],expectations=record.expectations||{};
 const minChars=Number(expectations.minChars||defaultMin);
 if(!record.sourceUrl)failures.push('missing-source-url');
 if(!record.retrievalProvider)failures.push('missing-retrieval-provider');
 if(!content.trim())failures.push('page-not-retrieved');
 else if(content.length<minChars)failures.push('implausibly-short');
 for(const section of (expectations.requiredSections||[]).map(norm).filter(Boolean))if(!text.includes(section))failures.push('missing-section:'+section);
 for(const value of (expectations.requiredStrings||[]).map(norm).filter(Boolean))if(!text.includes(value))failures.push('missing-required-content:'+value);
 if(expectations.maxLevel){const level=String(expectations.maxLevel);if(!new RegExp('(?:^|\\D)'+level+'(?:st|nd|rd|th)?(?:\\D|$)','i').test(content))failures.push('incomplete-progression-table');}
 if(expectations.requireTable&&content.split(/\r?\n/).filter(line=>line.split('|').length>=4).length<3)failures.push('missing-or-malformed-table');
 const contaminationHits=contamination.filter(value=>text.includes(value));
 if(contaminationHits.length>=3)failures.push('navigation-login-footer-contamination');
 else warnings.push(...contaminationHits.map(x=>'contamination:'+x));
 if(record.edition&&record.detectedEdition&&norm(record.edition)!==norm(record.detectedEdition))failures.push('edition-mismatch');
 if(record.sourceConflict)failures.push('source-conflict');
 if(record.identityConfirmed===false)failures.push('record-identity-unconfirmed');
 if(record.requiredFieldsComplete===false)failures.push('required-fields-incomplete');
 if(record.structuredMechanicsSafe===false)failures.push('structured-mechanics-ambiguous');
 const unique=[...new Set(failures)];
 return {recordId:record.recordId||record.sourceId||record.id||null,recordName:record.recordName||record.name||null,sourceUrl:record.sourceUrl||null,retrievalProvider:record.retrievalProvider||null,status:unique.length?'failed-extraction':'pass',failures:unique,warnings:[...new Set(warnings)],fallbackRequired:unique.length>0};
}
const results=records.map(validate);
const report={schemaVersion:1,generatedAt:new Date().toISOString(),total:results.length,passed:results.filter(r=>r.status==='pass').length,failed:results.filter(r=>r.status!=='pass').length,fallbackRequired:results.filter(r=>r.fallbackRequired).length,results};
console.log(JSON.stringify(report,null,2));
if(report.failed)process.exitCode=1;
