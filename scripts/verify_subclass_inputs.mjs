import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'data/subclasses2014');
const entries=readFileSync(resolve(root,'SHA256SUMS'),'utf8').trim().split('\n');
for(const line of entries){const m=line.match(/^([a-f0-9]{64})  (.+)$/);if(!m||m[2].includes('..')||m[2].startsWith('/'))throw Error('Invalid checksum entry');const digest=createHash('sha256').update(readFileSync(resolve(root,m[2]))).digest('hex');if(digest!==m[1])throw Error(`Source checksum mismatch: ${m[2]}`);}
console.log(`PASS ${entries.length} subclass source checksums`);
