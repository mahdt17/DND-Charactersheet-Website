import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true}});
try{
 const {castToolSpell}=await server.ssrLoadModule('/src/lib/toolSpellcasting.js');
 const {classFeatTools}=await server.ssrLoadModule('/src/lib/classFeatTools.js');
 const {catalogSpells}=await server.ssrLoadModule('/src/lib/editions.js');
 const {conversionFeats}=await server.ssrLoadModule('/src/data/archivistCampaign.js');
 const feat=name=>({...conversionFeats.find(f=>f.name===name),id:name});
 const row={name:'Cleric',level:10,edition:'2014',catalogId:'2014:cleric',definition:{name:'Cleric',edition:'2014',catalogId:'2014:cleric'}};
 const cure={...catalogSpells('2014').find(s=>s.name==='Cure Wounds'),prepared:true,castingClassId:row.catalogId};
 const light={...catalogSpells('2014').find(s=>s.name==='Light'),prepared:true,castingClassId:row.catalogId};
 const c={ruleset:'2014',level:10,className:'Cleric',classDefinition:row.definition,classLevels:[row],abilities:{int:12,wis:18},hp:{current:30,max:30},feats:[feat('Reach Spell'),feat('Chain Spell')],spells:[cure,light],archivistCampaign:{independentChoices:true}};
 const cast=castToolSpell(c,cure.catalogId,{slot:3,reach:true});
 assert.equal(cast.slotsUsed[3],1);assert.equal(cast.archivistCampaign.lastCast.effectLevel,1);assert.equal(cast.archivistCampaign.lastCast.dc,16);
 assert.throws(()=>castToolSpell(c,cure.catalogId,{slot:2,reach:true}),/adjusted/i);
 assert.throws(()=>castToolSpell({...c,feats:[]},cure.catalogId,{slot:3,reach:true}),/feat/i);
 assert.throws(()=>castToolSpell({...c,spells:[{...cure,prepared:false}]},cure.catalogId,{slot:3,reach:true}),/prepare/i);
 assert.throws(()=>castToolSpell({...c,conditions:['Stunned']},light.catalogId,{slot:1}),/cannot act/i,'cantrips must not bypass action availability');
 assert.throws(()=>castToolSpell({...c,spells:Array.from({length:15},(_,i)=>({...cure,id:'extra-'+i}))},cure.catalogId,{slot:3,reach:true}),/limit/i,'the feat tab must honor the class preparation limit');
 assert.deepEqual(classFeatTools(c).map(t=>t.name),['Cleric','Reach Spell','Chain Spell']);
 assert.deepEqual(classFeatTools({...c,feats:[]}).map(t=>t.name),['Cleric']);
 assert.equal(classFeatTools(c).find(t=>t.name==='Chain Spell').id,classFeatTools({...c,feats:[c.feats[1]]}).find(t=>t.name==='Chain Spell').id,'removing another feat must preserve the remaining panel identity');
 assert.equal(classFeatTools({...c,ruleset:'3.5'}).length,0);
 console.log('PASS independent feat spell modifiers, source/slot/preparation checks and dynamic class/feat directory');
}finally{await server.close();}
