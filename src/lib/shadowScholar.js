import {shadowScholarId,shadowScholarBackground,shadowScholarItems,shadowScholarNotes} from '../data/shadowScholar.js';
const norm=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function isShadowScholar(c){return c?.background==='Shadow Scholar'&&((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')==='2014'&&(!c.backgroundDefinition||c.backgroundDefinition.catalogId===shadowScholarId&&c.backgroundDefinition.edition==='2014');}
export const shadowScholarLanguage=c=>isShadowScholar(c)?(c.shadowScholar?.language==='Undercommon'?'Undercommon':'Draconic'):null;
export const shadowScholarTraining=c=>isShadowScholar(c)?[{index:'thieves-tools',name:"Thieves' Tools",kind:'tools',source:'Shadow Scholar'}]:[];
export function shadowScholarEquipment(c){return isShadowScholar(c)?[...shadowScholarItems.map(item=>({...item,auto:'background',backgroundGrantId:shadowScholarId})),{name:'gp',qty:10,money:true}]:[];}
export function reconcileShadowScholar(c){
 const retained=(c.traits||[]).filter(t=>t.homebrew||t.backgroundGrantId!==shadowScholarId);
 if(!isShadowScholar(c))return retained.length===(c.traits||[]).length?c:{...c,traits:retained};
 return {...c,traits:[...retained,{id:shadowScholarId+':researcher',name:'Researcher',description:shadowScholarBackground.feature[1],source:'Shadow Scholar · Sage (2014) feature',backgroundGrantId:shadowScholarId}]};
}
// Creation-only defaults: inventory and currency are handled by the creator's
// starting-equipment flow. Reopening and resting never award this package.
export function finishShadowScholar(c){
 if(!isShadowScholar(c))return c;
 const languages=String(c.languages||'').split(/[,;\n]/).map(value=>value.trim()).filter(Boolean),language=shadowScholarLanguage(c);if(!languages.some(value=>norm(value)===norm(language)))languages.push(language);
 const tools=String(c.toolProf||'').split(/[,;\n]/).map(t=>t.trim()).filter(Boolean);if(!tools.some(t=>norm(t)==='thievestools'))tools.push("Thieves' Tools");
 return reconcileShadowScholar({...c,backgroundDefinition:{catalogId:shadowScholarId,name:'Shadow Scholar',edition:'2014',source:shadowScholarBackground.source},shadowScholar:{...c.shadowScholar,language:shadowScholarLanguage(c)},languages:languages.join(', '),skillProf:{...c.skillProf,Stealth:true,Arcana:true},toolProf:tools.join(', '),notes:c.notes?.trim()?c.notes:shadowScholarNotes});
}
