import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {test} from 'node:test';
const path=new URL('../src/lib/subclassFormulas.js',import.meta.url);
const rules=existsSync(path)?await import(path):{};
const context={level:7,pb:3,str:2,dex:3,con:2,int:4,wis:1,cha:-1};

test('subclass counters calculate their own level, total proficiency and effective ability modifiers',()=>{
 assert.equal(typeof rules.subclassValue,'function');
 assert.equal(rules.subclassValue('2*level+int',context),18);
 assert.equal(rules.subclassValue('2*pb',context),6);
 assert.equal(rules.subclassValue('max(1,cha)',context),1);
 assert.equal(rules.subclassValue('ceil(level/2)',context),4);
 assert.equal(rules.subclassValue('floor(level/2)',context),3);
 assert.equal(rules.subclassValue('min(5,pb+int)',context),5);
 assert.equal(rules.subclassValue('-cha+2',context),3);
 assert.equal(rules.subclassValue({3:8,10:10,18:12},context),8);
 assert.equal(rules.subclassValue({3:8,10:10,18:12},{...context,level:18}),12);
});

test('dynamic subclass rolls retain dice and calculate modifiers without rolling twice',()=>{
 assert.equal(rules.subclassRoll('1d8+int',context),'1d8+4');
 assert.equal(rules.subclassRoll('{ceil(level/2)}d6+wis',context),'4d6+1');
 assert.equal(rules.subclassRoll('1d6+cha',context),'1d6-1');
 assert.equal(rules.subclassRoll('1d10+pb',context),'1d10+3');
 assert.equal(rules.subclassRoll('2d8',context),'2d8');
});

test('unknown and executable source expressions cannot become automatic game mechanics',()=>{
 for(const expression of ['process.exit()','globalThis.secret','constructor(1)','level;1','unknown+1','1/0','min(0,1/0)','max()','floor(1,2)','level)'])assert.throws(()=>rules.subclassValue(expression,context),expression);
 assert.throws(()=>rules.subclassRoll('100d20',context));
 assert.throws(()=>rules.subclassRoll('1d0',context));
 assert.throws(()=>rules.subclassRoll('1d20+unknown',context));
});
