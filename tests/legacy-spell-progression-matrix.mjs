import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {normalizeCatalogRecord} from '../src/lib/catalog.js';
import {progressionTables} from '../src/lib/advancement.js';
import {annotateClassGrantKinds,spellSlotProgression,manualSpellProgression35,reviewedSpellcasting35,castingAdvancementPlan,applyCastingAdvancementSelections,reconcileClassGrants} from '../src/lib/classIntegration.js';
import * as integration from '../src/lib/classIntegration.js';

const normalized=JSON.parse(fs.readFileSync('public/catalogs/dndtools/classes.json','utf8')).map(record=>normalizeCatalogRecord(record,'dndtools','classes'));
const definitions=normalized.map(record=>annotateClassGrantKinds(record,normalized));
const exact=id=>definitions.find(record=>record.sourceId==='classes/'+id);
const padded=values=>Array.from({length:10},(_,index)=>values[index]||0);

test('numeric spell headers and the infusion umbrella retain printed daily counts',()=>{
  const fixtures=[
    ['artificer-36',[0,2]],
    ['cultist-of-the-shattered-peak-540',[0,0]],
    ['ocular-adept-490',[3,1]],
    ['shaman-85',[3,1]],
  ];
  for(const [id,counts] of fixtures){
    const profile=spellSlotProgression(exact(id),1);
    assert(profile,id+' must expose its explicit daily matrix');
    assert.deepEqual(profile.slots,padded(counts),id+' level 1');
  }
  const cultist=spellSlotProgression(exact('cultist-of-the-shattered-peak-540'),1);
  assert.deepEqual(cultist.unlockedSpellLevels,[1],'printed zero unlocks a bonus-only level');
  const ocular=spellSlotProgression(exact('ocular-adept-490'),1);
  assert.deepEqual(ocular.restrictedSlots,padded([0,1]),'the +1 remains a separate restricted slot');
});

test('known powers, per-mystery uses, focus-dependent casting, and taint casting do not become automatic slots',()=>{
  assert.equal(manualSpellProgression35(undefined),null,'missing class records remain unsupported');
  assert.equal(manualSpellProgression35({}),null,'empty class records remain unsupported');
  // The source pages retain semantic captions/prose lost by the imported table:
  // /classes/gnome-artificer-564: Device Powers Known; /shadowcaster-113:
  // uses per known mystery; /chameleon-705: active aptitude focus; /maho-tsukai-637: Taint.
  for(const id of ['gnome-artificer-564','shadowcaster-113','chameleon-705','maho-tsukai-637']){
    const definition=exact(id),reason=integration.manualSpellProgression35?.(definition);
    assert.equal(typeof reason,'string',id+' exposes the source-specific manual reason to cached-profile consumers');
    assert.equal(integration.manualSpellProgression35?.({...definition,sourceId:'classes/other-source'}),null,id+' exclusion requires exact source identity');
    for(let level=1;level<=20;level++)assert.equal(spellSlotProgression(exact(id),level),null,id+' level '+level+' requires its own casting model');
  }
  for(const heading of ['Spells Known','Device Powers Known','Powers Known','Mysteries Known','Mystery Level']){
    const definition={name:'Non-slot fixture',progression:[[heading],['Level','0th','1st'],['1st','4','2']]};
    assert.equal(spellSlotProgression(definition,1),null,heading+' must not grant daily slots');
  }
});

test('newly supported daily sources use only their verified fixed casting abilities',()=>{
  const fixtures=[
    ['artificer-36',[], 'int'],
    ['cultist-of-the-shattered-peak-540',['arcane'],'int'],
    ['ocular-adept-490',['divine'],'wis'],
    ['shaman-85',['divine'],'wis'],
  ];
  for(const [id,traditions,ability] of fixtures){
    assert.deepEqual(reviewedSpellcasting35(exact(id),1),{traditions,ability,bonusAbility:ability},id+' source ability rules');
    const other={...exact(id),sourceId:'classes/other-source',catalogId:'dndtools:classes/other-source',id:'dndtools:classes/other-source'};
    assert.deepEqual(reviewedSpellcasting35(other,1),{traditions:[],ability:null,bonusAbility:null},id+' metadata must not transfer by display name');
  }
});

test('source-reviewed traditions qualify new fixed casters for matching advancements without classifying infusions',()=>{
  const mystic=exact('mystic-theurge-390');
  for(const [id,tradition] of [['cultist-of-the-shattered-peak-540','arcane'],['ocular-adept-490','divine'],['shaman-85','divine'],['artificer-36',null]]){
    const definition=exact(id),character={ruleset:'3.5',level:1,classLevels:[{catalogId:definition.catalogId,name:definition.name,edition:'3.5',definition,level:1}]};
    const plan=castingAdvancementPlan(character,mystic,1);
    assert.deepEqual(plan.groups.map(group=>group.kind),['arcane','divine']);
    for(const group of plan.groups){
      assert.deepEqual(group.candidates.map(candidate=>candidate.classId),group.kind===tradition?[definition.catalogId]:[],id+' eligible for '+group.kind+' advancement');
    }
  }
});

test('advancement data rows never become spell-level subheaders',()=>{
  for(const id of ['jade-phoenix-mage-870','ruby-knight-vindicator-872','yathrinshee-683']){
    for(let level=1;level<=10;level++)assert.equal(spellSlotProgression(exact(id),level),null,id+' level '+level+' has advancement, not a daily matrix');
  }
  const known={name:'Known-only fixture',progression:[['Spells Known'],['Level','0th','1st'],['1st','4','2']]};
  assert.equal(spellSlotProgression(known,1),null,'known spells are not daily slots');
});

test('explicit spellcaster-level wording advances the selected existing progression',()=>{
  const cleric=exact('cleric-91');
  const row=(definition,level)=>({catalogId:definition.catalogId,name:definition.name,edition:'3.5',level,definition});
  const base={ruleset:'3.5',classLevels:[row(cleric,1)],level:1,abilities:{str:10,dex:10,con:10,int:10,wis:18,cha:10}};
  for(const [id,kind] of [['divine-agent-601','spellcasting'],['master-of-shrouds-550','divine']]){
    const prestige=exact(id),plan=castingAdvancementPlan(base,prestige,2);
    assert.equal(plan.groups.length,1,id+' level 2 grants one advancement');
    assert.equal(plan.groups[0].kind,kind,id+' retains the explicit tradition');
    assert.deepEqual(plan.groups[0].candidates.map(candidate=>candidate.classId),[cleric.catalogId]);
    const selected=applyCastingAdvancementSelections({...base,classLevels:[row(cleric,1),row(prestige,2)],level:3},plan,{[plan.groups[0].id]:cleric.catalogId});
    const granted=reconcileClassGrants(selected).classSpellSlots.find(profile=>profile.sourceClassId===cleric.catalogId);
    assert.equal(granted.effectiveClassLevel,2,id+' advances only the selected class');
    assert.deepEqual(granted.slots,padded([4,2]),id+' uses the next Cleric table row');
  }
});

// This oracle reads source columns directly. It does not use the slot parser,
// grant cache, edition slot arrays, or a caster-level formula for expectations.
function sourceMatrix(record){
  // These are verified semantic exclusions, not daily matrices: respectively
  // device powers known, uses per known mystery, focus-dependent spells, and Taint.
  if(['classes/gnome-artificer-564','classes/shadowcaster-113','classes/chameleon-705','classes/maho-tsukai-637'].includes(record.sourceId))return null;
  const label=value=>{
    const match=String(value).trim().match(/^([0-9])(?:st|nd|rd|th)?$/);
    return match?Number(match[1]):null;
  };
  for(const table of progressionTables(record)){
    if(table.slice(0,3).some(row=>row.some(value=>/^spells? known$/i.test(value))))continue;
    const headerIndex=table.slice(0,5).findIndex(row=>row.some(value=>/^(?:class |racial )?level$/i.test(value)));
    if(headerIndex<0)continue;
    const header=table[headerIndex],classColumn=header.findIndex(value=>/^(?:class |racial )?level$/i.test(value));
    let columns=header.flatMap((value,index)=>label(value)===null?[]:[{level:label(value),index}]),start=headerIndex+1;
    if(columns.length<2){
      const umbrella=header.findIndex(value=>/spellcasting|(?:spells?|infusions?) per day/i.test(value));
      const subheader=table[headerIndex+1];
      if(umbrella>=0&&subheader?.length>=2&&subheader.every(value=>label(value)!==null)){
        columns=subheader.map((value,index)=>({level:label(value),index:umbrella+index}));
        start=headerIndex+2;
      }
    }
    if(columns.length<2)continue;
    const rows=table.slice(start).filter(row=>/^\d{1,2}(?:st|nd|rd|th)?$/i.test(String(row[classColumn])));
    if(rows.length)return {columns,rows,classColumn};
  }
  return null;
}

test('every available annotated daily matrix preserves every row, count, restriction, and level gate',()=>{
  let classes=0,rows=0,cells=0;
  for(const definition of definitions){
    const matrix=sourceMatrix(definition);
    if(!matrix)continue;
    classes++;
    for(const source of matrix.rows){
      const level=parseInt(source[matrix.classColumn]),expected=Array(10).fill(0),restricted=Array(10).fill(0),unlocked=[];
      for(const column of matrix.columns){
        const raw=String(source[column.index]??'').trim();
        if(!/^\d+(?:\s*\+\s*\d+)?$/.test(raw))continue;
        const [ordinary,extra='0']=raw.split('+').map(value=>value.trim());
        expected[column.level]=Number(ordinary);
        restricted[column.level]=Number(extra);
        unlocked.push(column.level);
      }
      const profile=spellSlotProgression(definition,level),context=definition.sourceId+' at class level '+level;
      assert(profile,context+' has an explicit source matrix');
      assert.equal(profile.level,level,context+' must not reuse another level');
      assert.deepEqual(profile.slots,expected,context+' ordinary slots');
      assert.deepEqual(profile.restrictedSlots,restricted,context+' restricted slots');
      assert.deepEqual(profile.unlockedSpellLevels,unlocked,context+' printed spell-level access');
      rows++;cells+=matrix.columns.length;
    }
  }
  console.log(`Legacy source matrix audit: ${definitions.length} catalog classes; ${classes} daily/infusion matrices, ${rows} level rows, ${cells} printed spell-level cells.`);
});
