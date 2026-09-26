import {characterClasses,classCharacter,progressionRow,contentKey} from './advancement.js';
const abilities={Psion:'int','Psychic Warrior':'wis',Wilder:'cha'};
export const psionDisciplines={Clairsentience:'Seer',Metacreativity:'Shaper',Psychokinesis:'Kineticist',Psychometabolism:'Egoist',Psychoportation:'Nomad',Telepathy:'Telepath'};
const norm=x=>String(x?.name||x||'').trim().toLowerCase();
export function specialCastingProfile(c){
 if((c.classDefinition?.edition||c.ruleset)!=='3.5')return null;
 const id=c.activeCastingClassId||contentKey(c.classDefinition||{name:c.className,edition:'3.5'});
 const extra=(c.castingAdvancements||[]).filter(x=>x.targetClassId===id&&x.kind==='psionic').reduce((n,x)=>n+(Number(x.amount)||0),0),level=c.level+extra;
 const row=progressionRow(c.classDefinition,level),value=pattern=>{const entry=Object.entries(row).find(([key])=>pattern.test(key));return entry?parseInt(entry[1]):NaN;};
 if(abilities[c.className]){
  const base=value(/power points|^pp$/i),known=value(/^powers? known$/i),maximum=value(/maximum power level/i);
  if(!Number.isFinite(base)||!Number.isFinite(known)||!Number.isFinite(maximum))return null;
  const ability=abilities[c.className],score=Number(c.abilities?.[ability]||10)+Number(c.abilityBonuses?.[ability]||0),bonus=Math.max(0,Math.floor((score-10)/2));
  return {kind:'power',id,ability,level,known,maximum,points:base+Math.floor(bonus*level/2),discipline:c.legacyCastingChoices?.[id]?.discipline};
 }
 if(c.className==='Warlock'){
  const known=value(/^invocations? known$/i);if(!Number.isFinite(known))return null;
  return {kind:'invocation',id,ability:'cha',level:c.level,known,grade:c.level>=16?3:c.level>=11?2:c.level>=6?1:0};
 }
 return null;
}
export function specialCastingAccess(c,s){
 const p=specialCastingProfile(c);if(!p)return null;
 if(s.edition&&s.edition!=='3.5')return {allowed:false,level:s.level,reason:'This ability belongs to a different edition.'};
 if(p.kind==='invocation'){
  const grade=['least','lesser','greater','dark'].indexOf(norm(s.school).replace(/\s+invocation.*$/,''));
  const allowed=grade>=0&&grade<=p.grade&&(s.classes||[]).some(x=>norm(x)==='warlock');
  return {allowed,level:s.classLevels?.Warlock??s.level,reason:allowed?'Warlock invocation':'Choose a Warlock invocation of an unlocked grade.'};
 }
 const names=[c.className,...(c.className==='Wilder'?['Psion']:[]),...(c.className==='Psion'&&psionDisciplines[p.discipline]?[psionDisciplines[p.discipline]]:[])];
 const levels=Object.entries(s.classLevels||{}).filter(([name])=>names.some(n=>norm(n)===norm(name))).map(([,level])=>level);
 const member=levels.length||(s.classes||[]).some(x=>names.some(n=>norm(n)===norm(x)));
 const level=levels.length?Math.min(...levels):s.level,score=Number(c.abilities?.[p.ability]||10)+Number(c.abilityBonuses?.[p.ability]||0);
 const powerSchool=Object.keys(psionDisciplines).some(school=>norm(s.school).startsWith(norm(school)));
 const allowed=!!member&&powerSchool&&Number.isInteger(level)&&level>0&&level<=p.maximum&&score>=10+level;
 return {allowed,level,reason:allowed?'Class power':'Choose a power from this class or selected discipline, within its level and ability limits.'};
}
export function powerPointReserve(c){
 const total=characterClasses(c).reduce((n,row)=>{const p=specialCastingProfile(classCharacter(c,row));return n+(p?.kind==='power'?p.points:0);},0);
 const bonus=Number(c.powerPointBonus?.amount)||0;
 const maximum=total+(c.powerPointBonus?.source?Math.max(0,bonus):0),used=Math.max(0,Number(c.powerPointsUsed)||0);
 return {maximum,used,remaining:Math.max(0,maximum-used)};
}
export function spendPower(c,model,s,points){
 const p=specialCastingProfile(model),access=specialCastingAccess(model,s),reserve=powerPointReserve(c);
 const minimum=access?.level*2-1;
 if(p?.kind!=='power'||!access?.allowed||!Number.isInteger(points)||points<minimum||points>p.level||points>reserve.remaining)throw Error('Choose a legal power-point cost within your class manifester level and remaining reserve.');
 return {powerPointsUsed:reserve.used+points};
}
