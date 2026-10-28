import {readFileSync,writeFileSync} from 'node:fs';
import {refreshEntomancerSpell} from '../src/lib/entomancerSpellDetails.js';
const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const existing=new Set(read('../src/data/subclassSpellCatalog.json').map(s=>s.catalogId));
const schools=['Abjuration','Conjuration','Divination','Enchantment','Evocation','Illusion','Necromancy','Transmutation'];
const records=read('../public/catalogs/wikidot5e/spells.json').filter(s=>!existing.has(s.catalogId||s.id)).map(raw=>{
 const {sourceEvidence,generatedDescription,...spell}=raw;
 const catalogId=spell.catalogId||spell.id;
 return refreshEntomancerSpell({...spell,catalogId,index:spell.index||catalogId,description:spell.description||spell.effectSummary||spell.effect||'',school:schools.find(s=>String(spell.school).toLowerCase().includes(s.toLowerCase()))||spell.school,referenceOnly:!spell.enrichment?.validated||!!spell.enrichment?.partial});
});
const output=JSON.stringify(records)+'\n',path=new URL('../src/data/subclassChoiceSpellCatalog.json',import.meta.url);
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==output)throw Error('Rebuild subclass choice spell catalog');}
else writeFileSync(path,output);
console.log(`Verified ${records.length} additional source spell records for subclass choices`);
