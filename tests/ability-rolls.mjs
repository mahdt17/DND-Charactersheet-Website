import assert from 'node:assert/strict';
import {createServer} from 'vite';

const server=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const {rollDice}=await server.ssrLoadModule('/src/lib/rules.js');
 const cases=[
  {dice:[1,4,6,3],kept:[4,6,3],dropped:[1],droppedIndices:[0],total:13},
  {dice:[3,1,4,6],kept:[3,4,6],dropped:[1],droppedIndices:[1],total:13},
  {dice:[6,2,2,5],kept:[6,2,5],dropped:[2],droppedIndices:[1],total:13},
  {dice:[1,1,1,1],kept:[1,1,1],dropped:[1],droppedIndices:[0],total:3},
  {dice:[6,6,6,6],kept:[6,6,6],dropped:[6],droppedIndices:[0],total:18},
 ];
 for(const fixture of cases){
  const stream=fixture.dice.map(value=>(value-.5)/6);
  let result;
  assert.doesNotThrow(()=>{result=rollDice('4d6dl1','normal',()=>stream.shift());},'standard ability rolls accept 4d6 drop-lowest notation');
  assert.deepEqual(result.rolls,fixture.dice);
  assert.deepEqual(result.kept,fixture.kept);
  assert.deepEqual(result.dropped,fixture.dropped);
  assert.deepEqual(result.droppedIndices,fixture.droppedIndices);
  assert.equal(result.total,fixture.total);
  assert.equal(stream.length,0,'each ability uses exactly four d6 rolls');
 }
 assert.equal(rollDice('4d6dl1+2','advantage',()=>0).total,5,'drop-lowest totals retain explicit bonuses without d20 advantage');
 assert.equal(rollDice('4d6dl1-2','normal',()=>.99).total,16);
 for(const expression of ['1d6dl1','4d6dl2','4d6dl0','4d6dh1'])assert.throws(()=>rollDice(expression));
 assert.deepEqual(rollDice('2d6+3','normal',()=>0).rolls,[1,1]);
 assert.equal(rollDice('2d6+3','normal',()=>0).total,5);
 let stream=[0,.99];assert.equal(rollDice('1d20+3','advantage',()=>stream.shift()).total,23);
 stream=[0,.99];assert.equal(rollDice('1d20+3','disadvantage',()=>stream.shift()).total,4);
 const setup=await server.ssrLoadModule('/src/lib/abilityRolls.js');
 let draft={...setup.abilityRollSetup([],{}).patch};
 assert(!setup.abilityRollsComplete(draft),'an empty pool cannot finish setup');
 const roll=value=>rollDice('4d6dl1','normal',()=> (value-.5)/6);
 draft={...draft,...setup.recordAbilityRoll(draft,0,roll(6))};
 assert.equal(draft.abilityRollPool[0].total,18);
 assert.equal(draft.abilities.str,0,'rolling does not force a score onto Strength');
 draft={...draft,...setup.assignAbilityRoll(draft,0,'int')};
 assert.equal(draft.abilities.int,18);
 assert.equal(draft.abilityRolls.int.total,18);
 assert(!setup.abilityRollsComplete(draft),'one assigned roll is not six completed scores');
 for(let i=1;i<6;i++)draft={...draft,...setup.recordAbilityRoll(draft,i,roll(i))};
 for(const [i,key] of ['str','dex','con','wis','cha'].entries())draft={...draft,...setup.assignAbilityRoll(draft,i+1,key)};
 assert(setup.abilityRollsComplete(draft));
 draft={...draft,...setup.assignAbilityRoll(draft,0,'str')};
 assert.equal(draft.abilities.str,18);assert.equal(draft.abilities.int,3,'moving a roll to an occupied ability swaps the two rolls');
 assert.equal(new Set(Object.values(draft.abilityRollAssignments)).size,6);
 assert(setup.abilityRollsComplete(draft));
 draft={...draft,...setup.recordAbilityRoll(draft,0,roll(4))};
 assert.equal(draft.abilities.str,12);assert.equal(draft.abilities.int,3,'rerolling changes only the assigned score');
 assert.deepEqual(draft.abilityRolls.str.rolls,[4,4,4,4]);
 draft={...draft,...setup.assignAbilityRoll(draft,0,'')};
 assert.equal(draft.abilities.str,0);assert(!setup.abilityRollsComplete(draft));
 assert.throws(()=>setup.assignAbilityRoll(draft,0,'not-an-ability'));
 assert.throws(()=>setup.recordAbilityRoll(draft,6,roll(3)));
 const duplicate={...draft,abilityRollAssignments:{str:1,dex:1,con:2,int:3,wis:4,cha:5}};
 assert(!setup.abilityRollsComplete(duplicate),'a roll cannot fill two abilities, including tied totals');
 console.log('PASS 4d6 drop exactly one lowest: ties, all ones/sixes, persisted dice, bonuses and existing dice behavior');
}finally{await server.close();}
