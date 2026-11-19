import {supportsInstitute} from './instituteAccess.js';
import classes from '../data/classes.json' with {type:'json'};
import equipment from '../data/equipment.json' with {type:'json'};
import {featMagicState} from './featMagic.js';
import {subclassCasting} from './subclassCasting.js';
import {fightingStyleGrants} from './fightingStyleGrants.js';
import {hasWeaponTraining,startingProficiencies} from './training.js';
import {equippedForActiveBody} from './subclassState.js';

export const arcaneArcherId='2014:prestige:arcane-archer';

const features=[
  {index:'enhance-arrow',name:'Enhance Arrow',level:1,desc:['Nonmagical arrows you fire from a shortbow or longbow count as magical and gain +1 to attack and damage. Use the highest applicable enhancement bonus for the shot.']},
  {index:'imbue-arrow',name:'Imbue Arrow',level:2,desc:['As one action, expend a normal spell slot to cast an eligible area spell through a shortbow or longbow. The spell originates where the arrow lands, within the bow’s maximum range. Resolve the landing point and line of effect with your DM. Use the spell’s normal save DC, components, duration and concentration. This is a spellcasting action and does not grant Extra Attack or Dread Ambusher attacks.']},
];

export const arcaneArcherClass={
  category:'class',name:'Arcane Archer (5e Conversion)',index:'arcane-archer-5e',edition:'2014',
  catalogId:arcaneArcherId,prestige:true,hit_die:8,source:'Shadow Archer build guide · 2014 house rules',
  description:'A two-level 2014 prestige conversion for combining trained archery with arcane spellcasting. Use only with DM approval. These levels grant no new proficiencies or spellcasting advancement.',
  progression:[['Level','Features'],['1','Enhance Arrow +1'],['2','Imbue Arrow']],
  levelGrants:features.map(({index,name,level,desc})=>({sourceFeatureId:index,name,level,description:desc[0]})),
  multi_classing:{proficiencies:[]},
};

export const isArcaneArcher=record=>(record?.catalogId||record?.id)===arcaneArcherId&&record.edition==='2014';
const uses2014=c=>((c.ruleset==='custom'?c.mechanics:c.ruleset)||'2014')==='2014';
const arcaneSources=new Set(['Artificer','Bard','Sorcerer','Warlock','Wizard']);
const bowTypes=new Set(['longbow','shortbow']);
const isBow=item=>bowTypes.has(item?.equipmentIndex);

export function arcaneArcherRequirements(c,rows,confirmations={}) {
  const primary=rows[0],training=startingProficiencies(c,classes.find(row=>row.name===primary?.name)?.proficiencies);
  const bow=equipment.some(item=>bowTypes.has(item.index)&&hasWeaponTraining(c,item,training));
  const race=c.raceDefinition?.name||c.race||'';
  const elf=/^(?:elf|half[- ]elf|shadar[- ]kai|eladrin|drow|astral elf|sea elf|high elf|wood elf)(?:\s*\(|$)/i.test(race);
  const spellcasting=rows.some(row=>row.edition==='2014'&&!row.definition?.homebrew&&
    (arcaneSources.has(row.name)||subclassCasting({className:row.name,subclass:row.subclass,level:row.level,ruleset:row.edition})?.active))
    ||(c.feats||[]).some(feat=>{
      const grant=featMagicState(feat,{...c,ruleset:'2014'});
      return grant.profile?.edition==='2014'&&arcaneSources.has(grant.list)&&grant.spells.some(spell=>spell.level===1);
    });
  const styles=fightingStyleGrants(c).styles;
  const rangerStyle=!styles.some(style=>style.sourceClassName==='Ranger')&&rows.some(row=>row.edition==='2014'&&row.name==='Ranger'&&row.level>=2&&!row.definition?.homebrew);
  return [
    ['edition','Use 2014 5e rules',uses2014(c)],
    ...(supportsInstitute(c)&&c.shadowArcherPlan ? [['training','Converted entry score of 6 (Fighter + Ranger + half Wizard levels)', rows.reduce((n,r)=>n+(r.edition!=='2014'?0:['Fighter','Ranger'].includes(r.name)?r.level:r.name==='Wizard'?Math.floor(r.level/2):0),0)>=6]] : []),
    ['ancestry','Elf or half-elf (including Shadar-kai)',elf],
    ['archery','Archery Fighting Style',styles.some(style=>style.id==='archery')],
    ['bow','Proficiency with a shortbow or longbow',bow],
    ['sharpshooter','2014 Sharpshooter feat',(c.feats||[]).some(feat=>feat.name==='Sharpshooter'&&(feat.edition||'2014')==='2014')],
    ['spellcasting','Ability to cast a 1st-level arcane spell',spellcasting],
  ].map(([key,text,met])=>{
    const id=arcaneArcherId+':'+key;
    const manual=key==='archery'&&!met&&rangerStyle;
    return {id,text:manual?'Confirm Archery is your Ranger Fighting Style':text,label:'Prestige entry',
      status:met?'met':manual?(confirmations[id]?'confirmed':'manual'):'unmet'};
  });
}

export function arcaneArcherLevel(c) {
  if(!uses2014(c))return 0;
  const row=(c.classLevels||[]).find(row=>row.edition==='2014'&&(row.catalogId===arcaneArcherId||isArcaneArcher(row.definition)));
  return Math.min(2,Number(row?.level??(isArcaneArcher(c.classDefinition)?c.level:0))||0);
}

export const arcaneArcherFeatures=c=>features.filter(feature=>feature.level<=arcaneArcherLevel(c));
export const enhancedArrow=(c,item)=>arcaneArcherLevel(c)>0&&isBow(item)&&!c.arcaneArcher?.magicalAmmunition;
export function arcaneArcherBowBonus(c,item) {
  if(!arcaneArcherLevel(c)||!isBow(item))return 0;
  const existing=c.arcaneArcher?.bowBonuses?.[item.id]??item.magicBonus;
  return Math.max(enhancedArrow(c,item)?1:0,Math.min(3,Math.max(0,Math.trunc(Number(existing)||0))));
}
export const isMagicalArrowAttack=(c,item)=>arcaneArcherLevel(c)>0&&isBow(item)
  &&(enhancedArrow(c,item)||!!c.arcaneArcher?.magicalAmmunition||arcaneArcherBowBonus(c,item)>0||item.magical===true);

export const equippedImbueBows=c=>(c.inventory||[]).filter(item=>isBow(item)&&equippedForActiveBody(c,item));

// Some published entries describe their area in rules text without the catalog field.
const areaSpells=new Set(['flaming sphere','hypnotic pattern','plant growth','purify food and drink','wall of force','web','fog cloud','fireball','sickening radiance','synaptic static','otiluke\'s freezing sphere','freezing sphere','reverse gravity']);
export function imbueArrowSpell(spell) {
  const name=String(spell?.name||'').toLowerCase().replaceAll('’',"'");
  const shape=String(spell?.area_of_effect?.type||'').toLowerCase();
  const selfRange=/^self\b/i.test(spell?.range||'');
  const transferableArea=selfRange?['cone','cube','line'].includes(shape):Boolean(shape)||areaSpells.has(name);
  return (spell?.edition||'2014')==='2014'&&Number(spell?.level)>0
    &&/^(?:1 )?action$/i.test(String(spell.casting_time||'').trim())
    &&name!=='forcecage'&&transferableArea;
}

export function imbueArrowOrigin(c,spell,{bowId,distance,point}={}) {
  if(arcaneArcherLevel(c)<2)throw Error('Imbue Arrow requires Arcane Archer level 2.');
  if(!imbueArrowSpell(spell))throw Error('Choose an eligible area spell with a casting time of one action.');
  const bow=equippedImbueBows(c).find(item=>item.id===bowId);
  if(!bow)throw Error('Choose an equipped bow.');
  const maximum=equipment.find(item=>item.index===bow.equipmentIndex)?.range?.long;
  const feet=Number(distance),landing=String(point||'').trim();
  if(!Number.isFinite(maximum)||distance==null||String(distance).trim()===''||!Number.isFinite(feet)||feet<0||feet>maximum)throw Error(`Enter a distance from 0 to ${maximum} feet for the selected bow.`);
  if(!landing)throw Error('Enter the arrow’s landing point.');
  return {bowId:bow.id,bowName:bow.name,distance:feet,point:landing};
}
