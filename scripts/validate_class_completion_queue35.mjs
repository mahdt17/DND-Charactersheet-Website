import fs from 'node:fs/promises';
import {validateCompletionQueue35} from './class_completion_certification35.mjs';
const paths=process.argv.slice(2);
if(paths.length!==3)throw Error('Expected tracker, ledger and queue paths.');
const inputs=await Promise.all(paths.map(async file=>JSON.parse(await fs.readFile(file,'utf8'))));
const errors=validateCompletionQueue35(...inputs);
if(errors.length)throw Error(errors.join('\n'));
console.log('Class completion queue matches the exact uncertified ledger records.');
