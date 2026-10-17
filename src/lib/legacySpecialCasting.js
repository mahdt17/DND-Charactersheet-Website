import {progressionRow,contentKey} from './advancement.js';
import {invocationProfile35} from './invocationAcquisition35.js';
import {powerPointProfile35,powerPointReserve35} from './manifesting35.js';
const abilities={Psion:'int','Psychic Warrior':'wis',Wilder:'cha'};
export const psionDisciplines={Clairsentience:'Seer',Metacreativity:'Shaper',Psychokinesis:'Kineticist',Psychometabolism:'Egoist',Psychoportation:'Nomad',Telepathy:'Telepath'};
const norm=x=>String(x?.name||x||'').trim().toLowerCase();
export function specialCastingProfile(c){
 if((c.classDefinition?.edition||c.ruleset)!=='3.5')return null;
 const id=c.activeCastingClassId||contentKey(c.classDefinition||{name:c.className,edition:'3.5'});
 const row=progressionRow(c.classDefinition,c.level),value=pattern=>{const entry=Object.entries(row).find(([key])=>pattern.test(key));return entry?parseInt(entry[1]):NaN;};
 if(abilities[c.className]){
  const profile=powerPointProfile35(c);
  if(!profile||!Number.isFinite(profile.known)||!Number.isFinite(profile.maximum))return null;
  return {kind:'power',...profile,discipline:c.legacyCastingChoices?.[id]?.discipline};
 }
 if(c.className==='Warlock'||c.className==='Dragonfire Adept'){
  const sourceId=c.activeCastingClassId||c.classDefinition?.catalogId||(c.classLevels||[]).find(r=>r.name===c.className)?.catalogId||id;
  const profile=invocationProfile35(sourceId),known=profile?Number(profile.knownByLevel[c.level]):value(/^invocations? known$/i);if(!Number.isFinite(known))return null;
  return {kind:'invocation',id:sourceId,className:c.className,ability:'cha',level:c.level,known,grade:c.level>=16?3:c.level>=11?2:c.level>=6?1:0};
 }
 return null;
}
export function specialCastingAccess(c,s){
 const p=specialCastingProfile(c);if(!p)return null;
 if(s.edition&&s.edition!=='3.5')return {allowed:false,level:s.level,reason:'This ability belongs to a different edition.'};
 if(p.kind==='invocation'){
  const grade=['least','lesser','greater','dark'].indexOf(norm(s.school).replace(/\s+invocation.*$/,''));
  const className=p.className||c.className,allowed=grade>=0&&grade<=p.grade&&(s.classes||[]).some(x=>norm(x)===norm(className));
  return {allowed,level:s.classLevels?.[className]??s.level,reason:allowed?className+' invocation':'Choose a '+className+' invocation of an unlocked grade.'};
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
 return powerPointReserve35(c);
}
export function spendPower(c,model,s,points){
 const p=specialCastingProfile(model),access=specialCastingAccess(model,s),reserve=powerPointReserve(c);
 const minimum=access?.level*2-1;
 if(p?.kind!=='power'||!access?.allowed||!Number.isInteger(points)||points<minimum||points>p.level||points>reserve.remaining)throw Error('Choose a legal power-point cost within your class manifester level and remaining reserve.');
 return {powerPointsUsed:reserve.used+points};
}
