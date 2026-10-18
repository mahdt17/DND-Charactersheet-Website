import {featMagicState,featMagicKey} from './featMagic.js';
import {characterClasses,classCharacter} from './advancement.js';
import {spellAccess} from './editions.js';

export function canClassRitual(c,s){
 if(!s.ritual||!spellAccess(c,s).allowed)return false;
 const edition=c.classDefinition?.edition||c.ruleset||'2014';
 if(edition==='2024')return c.className==='Wizard'||!!s.prepared;
 return edition==='2014'&&(['Wizard','Bard'].includes(c.className)||['Cleric','Druid','Artificer'].includes(c.className)&&!!s.prepared);
}
export function quickRitualOption(c,s){
 if(!s.ritual||!s.prepared||s.edition!=='2024')return null;
 const owner=characterClasses(c).find(row=>row.catalogId===(s.castingClassId||characterClasses(c)[0]?.catalogId));
 if(!owner||owner.edition!=='2024'||!spellAccess(classCharacter(c,owner),s).allowed)return null;
 const feat=(c.feats||[]).find(f=>{const state=featMagicState(f,c);return state.valid&&state.profile?.kind==='ritual'&&state.profile.edition==='2024'&&!c.featSpellUses?.[`${featMagicKey(f)}:quick`];});
 return feat?{key:`${featMagicKey(feat)}:quick`}:null;
}
export function spendQuickRitual(c,s){
 const option=quickRitualOption(c,s);if(!option)throw Error('Quick Ritual is unavailable for this prepared spell.');
 return {featSpellUses:{...c.featSpellUses,[option.key]:1}};
}
