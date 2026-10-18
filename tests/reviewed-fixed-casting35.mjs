import assert from 'node:assert/strict';
import {createServer} from 'vite';

const server=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]}});
try {
  const e=await server.ssrLoadModule('/src/lib/editions.js');
  const definition={
    name:'Reviewed Fixed Caster',
    edition:'3.5',
    prestige:true,
    hit_die:6,
    spellcastingAbility:'int',
    progression:[
      ['Level','BAB','Fort','Ref','Will','1st','2nd'],
      ['1st','+0','+0','+0','+2','0','—']
    ]
  };
  const character={
    id:'reviewed-fixed-caster',
    name:'Reviewed Fixed Caster Test',
    className:definition.name,
    classDefinition:definition,
    ruleset:'3.5',
    mechanics:'3.5',
    level:1,
    abilities:{str:10,dex:10,con:10,int:18,wis:10,cha:10},
    abilityBonuses:{},
    spells:[]
  };
  assert.equal(e.castingKey(character),'int','reviewed fixed casting ability must come from the class definition');
  assert.equal(e.characterSlots(character)[1],1,'an unlocked printed-zero 1st-level slot must receive its Intelligence bonus slot');
  assert.equal(e.characterSlots(character)[2],0,'a dash must not unlock bonus slots at that spell level');
  assert.equal(e.castingKey({...character,classDefinition:{...definition,spellcastingAbility:'Intelligence'}}),'int','long-form reviewed ability names must normalize to sheet ability keys');
  console.log('PASS reviewed fixed 3.5 casting ability drives spell UI and bonus slots.');
} finally {
  await server.close();
}
