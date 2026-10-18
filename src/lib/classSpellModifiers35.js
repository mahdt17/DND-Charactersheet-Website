import wuJenData from '../data/wu-jen-spell-elements35.json' with {type:'json'};

const cleanId=value=>String(value||'').replace(/^dndtools:/,'');
const norm=value=>String(value?.name||value||'').trim().toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
function nameKeys(value){
  const raw=String(value?.name||value||'').replace(/[’']/g,"'").trim(),keys=new Set([norm(raw)]);
  const comma=raw.match(/^(.+),\s*(Greater|Lesser|Mass)$/i);if(comma)keys.add(norm(comma[2]+' '+comma[1]));
  const prefix=raw.match(/^(Greater|Lesser|Mass)\s+(.+)$/i);if(prefix)keys.add(norm(prefix[2]+', '+prefix[1]));
  return keys;
}
function sameName(a,b){const ak=nameKeys(a),bk=nameKeys(b);return [...ak].some(key=>bk.has(key));}
function classChoices(character,classId,feature){
  const exact=cleanId(classId),wanted=norm(feature);
  return Object.values(character?.featureChoices||{}).filter(choice=>cleanId(choice?.sourceClassId)===exact&&norm(choice?.feature)===wanted);
}
export function wuJenSpellElement35(spell){
  const level=Number(spell?.level),keys=nameKeys(spell?.name);
  const row=(wuJenData.spellElements||[]).find(item=>Number(item.level)===level&&[...nameKeys(item.name)].some(key=>keys.has(key)));
  return row?.element||null;
}
export function classSpellModifiers35(character,classId,spell,baseCasterLevel=0){
  const result={spellElement:null,casterLevelBonus:0,effectiveCasterLevel:Math.max(0,Number(baseCasterLevel)||0),saveBonusAgainst:0,saveBonusType:null,spellSecrets:[],rangeMultiplier:1,durationMultiplier:1,removesSomatic:false,removesVerbal:false,spellLevelAdjustment:0,notes:[]};
  if(cleanId(classId)!=='classes/wu-jen-6')return result;
  const element=wuJenSpellElement35(spell);result.spellElement=element;
  const mastery=classChoices(character,classId,'Elemental Mastery').flatMap(choice=>choice.choices||[])[0]||'';
  if(mastery&&element&&(element==='All'||norm(element)===norm(mastery))){
    result.casterLevelBonus=2;result.effectiveCasterLevel+=2;result.saveBonusAgainst=2;result.saveBonusType='competence';
    result.notes.push('Elemental Mastery ('+mastery+'): effective caster level +2 for this spell; +2 competence on saves against '+(element==='All'?'All-element':mastery)+' spells.');
  }
  const secretMechanics={
    'Enlarge Spell':{rangeMultiplier:2,note:'Enlarge Spell: range is doubled with no spell-level increase.'},
    'Extend Spell':{durationMultiplier:2,note:'Extend Spell: duration is doubled with no spell-level increase.'},
    'Still Spell':{removesSomatic:true,note:'Still Spell: no somatic component is required, with no spell-level increase.'},
    'Silent Spell':{removesVerbal:true,note:'Silent Spell: no verbal component is required, with no spell-level increase.'}
  };
  for(const choice of classChoices(character,classId,'Spell Secret')){
    const [spellName,secret]=choice.choices||[];
    if(!spellName||!secret||!sameName(spellName,spell?.name))continue;
    const mechanics=secretMechanics[secret];if(!mechanics)continue;
    result.spellSecrets.push(secret);
    if(mechanics.rangeMultiplier)result.rangeMultiplier*=mechanics.rangeMultiplier;
    if(mechanics.durationMultiplier)result.durationMultiplier*=mechanics.durationMultiplier;
    if(mechanics.removesSomatic)result.removesSomatic=true;
    if(mechanics.removesVerbal)result.removesVerbal=true;
    result.notes.push('Spell Secret · '+mechanics.note);
  }
  return result;
}
