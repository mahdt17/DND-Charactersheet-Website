import {entomancerId} from '../data/entomancer.js';
import {campaignIds} from '../data/archivistCampaign.js';

const core=new Set(['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard']);
export const spellRulesEdition=c=>c.ruleset==='custom'?(c.mechanics||'2014'):(c.ruleset||'2014');

// Custom is a workspace choice, not a different progression for a published class.
export function usesClassSpellRules(c){
 const edition=spellRulesEdition(c),definition=c.classDefinition||{};
 if(!['2014','2024'].includes(edition)||(definition.edition&&definition.edition!==edition))return false;
 const id=definition.catalogId||definition.id;
 if(edition==='2014'&&(id===entomancerId||Object.values(campaignIds).includes(id)))return true;
 if(definition.homebrew||definition.source==='Homebrew')return false;
 return core.has(c.className)||(edition==='2014'&&c.className==='Artificer');
}

export const manualSpellChoices=c=>!usesClassSpellRules(c);
