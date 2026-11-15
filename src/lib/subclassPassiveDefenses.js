import {expandedSubclassRows,expandedFeatureUnlocked} from './expandedSubclasses.js';
import {retainsOwnFeatures,equippedForActiveBody} from './subclassState.js';
import equipment from '../data/equipment.json' with {type:'json'};
// Reviewed unconditional own-body damage defenses. Conditional defenses have
// separate source-specific controls and must not be inferred from prose.
const rules=[
 ['artificer:alchemist','Chemical Mastery','resistance',['acid','poison']],
 ['cleric:forge','Soul of the Forge','resistance',['fire']],
 ['cleric:forge','Saint of Forge and Fire','immunity',['fire']],
 ['druid:twilight-ua','Watcher at the Threshold','resistance',['necrotic','radiant']],
 ['sorcerer:aberrant-mind','Psychic Defenses','resistance',['psychic']],
 ['sorcerer:aberrant-mind-ua','Psychic Defenses','resistance',['psychic']],
 ['sorcerer:storm-sorcery','Heart of the Storm','resistance',['lightning','thunder']],
 ['sorcerer:storm-sorcery','Wind Soul','immunity',['lightning','thunder']],
 ['sorcerer:pyromancy','Fire in the Veins','resistance',['fire']],
 ['sorcerer:pyromancy','Fiery Soul','immunity',['fire']],
 ['sorcerer:favored-soul-revisited-ua','Divine Purity','immunity',['poison']],
 ['sorcerer:sea-sorcery-ua','Watery Defense','resistance',['fire']],
 ['sorcerer:sea-sorcery-ua','Water Soul','resistance',['bludgeoning','piercing','slashing']],
 ['warlock:celestial','Radiant Soul','resistance',['radiant']],
 ['warlock:celestial-ua','Radiant Soul','resistance',['radiant']],
 ['warlock:undying-light-ua','Radiant Soul','resistance',['radiant']],
 ['warlock:fathomless','Oceanic Soul','resistance',['cold']],
 ['warlock:lurker-in-the-deep-ua','Fathomless Soul','resistance',['cold']],
 ['warlock:great-old-one','Thought Shield','resistance',['psychic']],
 ['warlock:raven-queen-ua',"Raven's Shield",'resistance',['necrotic']],
 ['warlock:seeker-ua','Far Wanderer','resistance',['cold','fire']],
 ['wizard:necromancy','Inured to Undeath','resistance',['necrotic']],
 ['fighter:psi-warrior','Guarded Mind','resistance',['psychic']],
 ['fighter:psi-knight-ua','Psi-Enhanced Metabolism','resistance',['poison','psychic']],
];
export function subclassPassiveDefenseSupported(recordId,feature,kind){return rules.some(([source,name,effect])=>recordId===`2014:subclass:${source}`&&name===feature&&effect===kind);}
export function subclassPassiveDamageDefense(c,type,{attack=false,magical=false}={}){
 if(!type||!retainsOwnFeatures(c))return {resistant:false,immune:false};
 const damage=String(type).toLowerCase(),result={resistant:false,immune:false};
 for(const p of expandedSubclassRows(c))for(const [source,feature,kind,types] of rules){
  if(!types.includes(damage))continue;
  const f=p.record.features.find(f=>(f.inheritedRecordId||p.record.id)===`2014:subclass:${source}`&&f.name===feature&&expandedFeatureUnlocked(p,f));
  if(f)result[kind==='immunity'?'immune':'resistant']=true;
 }
 if(attack&&!magical&&['bludgeoning','piercing','slashing'].includes(damage)){
  for(const p of expandedSubclassRows(c)){
   const f=p.record.features.find(f=>['2014:subclass:cleric:war','2014:subclass:cleric:strength'].includes(f.inheritedRecordId||p.record.id)&&f.name==='Avatar of Battle'&&expandedFeatureUnlocked(p,f));
   const forge=p.record.features.find(f=>(f.inheritedRecordId||p.record.id)==='2014:subclass:cleric:forge'&&f.name==='Saint of Forge and Fire'&&expandedFeatureUnlocked(p,f));
   const heavy=(c.inventory||[]).some(i=>i.equipped&&equippedForActiveBody(c,i)&&equipment.find(e=>e.index===i.equipmentIndex)?.armor_category==='Heavy');
   if(f||forge&&heavy)result.resistant=true;
  }
 }
 return result;
}
