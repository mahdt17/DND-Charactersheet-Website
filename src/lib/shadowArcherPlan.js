import classes from '../data/classes.json' with {type:'json'};
import equipment from '../data/equipment.json' with {type:'json'};
import {shadarKaiRaces} from '../data/shadarKai.js';
import {finishShadarKaiTrance,reconcileShadarKai} from './shadarKai.js';
import {finishShadowScholar,shadowScholarEquipment} from './shadowScholar.js';
import {catalogSpells} from './editions.js';

export const shadowArcherRoadmap=[
  ['Fighter','Archery and Second Wind'],['Wizard','Spellbook and Arcane Recovery'],
  ['Wizard','Choose Bladesinging'],['Wizard','2nd-level Wizard spells'],['Wizard','2014 Sharpshooter; campaign start'],
  ['Wizard','3rd-level Wizard spells'],['Wizard','Extra Attack'],['Ranger','Ranger training'],
  ['Ranger','Defense Fighting Style'],['Arcane Archer','Enhance Arrow +1'],['Arcane Archer','Imbue Arrow'],
  ['Ranger','Choose legacy Gloom Stalker'],['Fighter','Action Surge; confirm first-turn Dread Ambusher ruling'],
  ['Wizard','4th-level Wizard spells'],['Wizard','Elven Accuracy (+1 Intelligence)'],
  ['Wizard','5th-level Wizard spells'],['Wizard','Song of Defense'],['Wizard','6th-level Wizard spells'],
  ['Wizard','+1 Intelligence and +1 Constitution'],['Wizard','7th-level Wizard spells before training'],
];
const startingSpells=['Mage Hand','Minor Illusion','Ray of Frost','Prestidigitation','Shield','Absorb Elements','Mage Armor','Find Familiar','Feather Fall','Detect Magic','Magic Missile','Identify','Web','Misty Step','Invisibility','Mirror Image'];
const prepared=new Set(['Shield','Absorb Elements','Mage Armor','Feather Fall','Magic Missile','Web','Misty Step','Mirror Image']);
export function createShadowArcher(name,level) {
  if(![1,5].includes(level)||name.trim().length<2)throw Error('Choose a name and a level 1 or 5 start.');
  const classLevels=(level===1?[['Fighter',1]]:[['Fighter',1],['Wizard',4]]).map(([name,level])=>{
    const base=classes.find(c=>c.name===name),catalogId='2014:'+base.index;
    return {name,level,catalogId,edition:'2014',definition:{...base,edition:'2014',catalogId},subclass:name==='Wizard'?'Bladesinging':''};
  });
  const inventory=['leather-armor','longbow','arrow','rapier','whip','crossbow-light','crossbow-bolt','explorers-pack'].map(index=>{
    const item=equipment.find(e=>e.index===index);
    return {id:crypto.randomUUID(),name:item.name,equipmentIndex:index,qty:['arrow','crossbow-bolt'].includes(index)?20:1,equipped:['leather-armor','longbow'].includes(index)};
  });
  const catalog=catalogSpells('2014');
  const spells=level===1?[]:startingSpells.map(name=>{
    const s=catalog.find(spell=>spell.name===name&&spell.classes?.includes('Wizard'));
    if(!s)throw Error('Starting spell is missing: '+name);
    return {...s,id:crypto.randomUUID(),castingClassId:classLevels[1].catalogId,prepared:s.level===0||prepared.has(name)};
  });
  const hp=level===1?12:36;
  let c={id:crypto.randomUUID(),name:name.trim(),level,ruleset:'2014',mechanics:'2014',shadowArcherPlan:true,
    race:'Shadar-kai',raceDefinition:shadarKaiRaces.find(r=>r.version==='motm'),background:'Shadow Scholar',
    className:'Fighter',classDefinition:classLevels[0].definition,classLevels,hitDie:'d10',speed:30,autoArmor:true,ac:16,
    hp:{max:hp,current:hp,temp:0},abilities:{str:10,dex:18,con:15,int:17,wis:15,cha:13},abilityBonuses:{dex:2,int:1},
    skillProf:{Acrobatics:true,Insight:true},saveProf:{str:true,con:true},languages:'Common, Elvish',
    fightingStyles:{choices:['Archery']},inventory,spells,currency:{gp:10},resources:[],actions:[],conditions:[],
    feats:level===1?[]:[{id:crypto.randomUUID(),name:'Sharpshooter',edition:'2014',level:5,catalogId:'wikidot5e:feat:sharpshooter'}]};
  c=finishShadowScholar(reconcileShadarKai(c));
  return {...c,...finishShadarKaiTrance(c,{trance:['poisoners-kit','herbalism-kit']}),
    inventory:[...inventory,...shadowScholarEquipment(c).filter(item=>!item.money).map(item=>({...item,id:crypto.randomUUID()}))]};
}
