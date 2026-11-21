import assert from 'node:assert/strict';
import {landedRoll,visualDice} from '../src/lib/presentation.js';

const roll={id:'r',expression:'1d20+4',readLanding:true,rolls:[3,7],mode:'advantage',bonus:4,total:11};
const faces=new Map([['r:0',18],['r:1',9]]);
assert.equal(landedRoll(roll,faces).total,22);
assert.equal(landedRoll({...roll,mode:'disadvantage'},faces).total,13);
assert.equal(landedRoll({...roll,readLanding:false},faces).total,11);
const mixed={...roll,expression:'1d4+1d12+4',groups:[{id:'a',expression:'1d4',rolls:[3],bonus:0},{id:'b',expression:'1d12',rolls:[7],bonus:0}]};
assert.deepEqual(visualDice([mixed]).dice.map(d=>d.sides),[4,12]);
assert.equal(landedRoll(mixed,new Map([['a:0',2],['b:0',12]])).total,18);
const percentile={...roll,expression:'1d100',mode:'normal',rolls:[20],bonus:0};
assert.equal(landedRoll(percentile,new Map([['r:0:tens',0],['r:0:units',0]])).total,100);
const drop={...roll,expression:'4d6dl1',mode:'normal',rolls:[1,6,6,6],bonus:0};
assert.deepEqual(landedRoll(drop,new Map([['r:0',5],['r:2',2]])).kept,[5,6,6]);
