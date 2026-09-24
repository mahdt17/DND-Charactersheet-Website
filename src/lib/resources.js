import {characterClasses} from './advancement.js';

const count=v=>Math.max(0,Math.floor(Number(v)||0));
const nameKey=s=>String(s||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
const unsupported=r=>r?.homebrew||r?.source==='Homebrew'||r?.prestige||r?.stats?.prestige;

// Reviewed core class counters only. Feature effects, conversions, and initiative
// triggers remain explicit player actions. Rules sources are in APPLICATION_INTEGRATION.
export function classResourceDefinitions(c,abilities=c.abilities||{}) {
  const edition=c.ruleset||'2014',rows=characterClasses(c),revised=edition==='2024';
  if(!['2014','2024'].includes(edition)||rows.some(r=>r.edition!==edition||unsupported(r)||unsupported(r.definition)))return [];
  const result=[];
  for(const row of rows) {
    const n=row.level,cls=row.name;
    const add=(key,name,max,short=0,extra={})=>{
      if(!max)return;
      const classResourceKey=`${edition}:${cls}:${key}`;
      result.push({id:classResourceKey,classResourceKey,name,max,used:0,reset:short==='all'?'short':'long',shortRecovery:short,className:cls,edition,unlimited:false,meditation:false,restoration:0,...extra});
    };
    if(cls==='Barbarian')add('rage','Rage',n<3?2:n<6?3:n<12?4:n<17?5:6,revised?1:0,{unlimited:!revised&&n>=20});
    if(cls==='Bard')add('inspiration','Bardic Inspiration',Math.max(1,Math.floor(((Number(abilities.cha)||10)-10)/2)),n>=5?'all':0);
    if(cls==='Druid'&&n>=2)add('wild-shape','Wild Shape',revised?(n<6?2:n<17?3:4):2,revised?1:'all',{unlimited:!revised&&n>=20});
    if(cls==='Fighter') {
      add('second-wind','Second Wind',revised?(n<4?2:n<10?3:4):1,revised?1:'all');
      if(n>=2)add('action-surge','Action Surge',n>=17?2:1,'all');
      if(n>=9)add('indomitable','Indomitable',n<13?1:n<17?2:3);
    }
    if(cls==='Monk'&&n>=2)add('points',revised?'Focus Points':'Ki Points',n,'all',{meditation:!revised,aliases:['Ki','Focus','Ki Points','Focus Points']});
    if(cls==='Paladin')add('lay-on-hands','Lay on Hands',n*5);
    if(cls==='Sorcerer'&&n>=2)add('points','Sorcery Points',n,!revised&&n>=20?4:0,{restoration:revised&&n>=5?Math.floor(n/2):0});
    if(cls==='Ranger'&&revised)add('hunters-mark','Hunter’s Mark (free casts)',n<5?2:n<9?3:n<13?4:n<17?5:6,0,{aliases:['Hunter’s Mark','Hunters Mark free casts']});
    if((cls==='Cleric'&&n>=2)||(cls==='Paladin'&&n>=3)) {
      const max=cls==='Cleric'?(n<6?1:n<18?2:3)+(revised?1:0):revised?(n<11?2:3):1;
      if(revised)add('channel-divinity',`Channel Divinity (${cls})`,max,1,{aliases:['Channel Divinity']});
      else {
        // 2014 multiclassing shares uses; additional class sources add effects,
        // not another pool. Higher Cleric levels increase the shared capacity.
        const shared=result.find(r=>r.classResourceKey==='2014:channel-divinity');
        if(shared){shared.max=Math.max(shared.max,max);shared.className+=' / '+cls;}
        else add('channel-divinity','Channel Divinity',max,'all',{id:'2014:channel-divinity',classResourceKey:'2014:channel-divinity'});
      }
    }
  }
  return result;
}

export function resourceMatches(resource,definition) {
  return [definition.name,...definition.aliases||[]].some(n=>nameKey(resource.name)===nameKey(n));
}
export function characterResources(c,abilities) {
  const definitions=classResourceDefinitions(c,abilities),saved=Array.isArray(c.resources)?c.resources:[];
  const resources=saved.map(r=>{
    const definition=definitions.find(d=>d.classResourceKey===r.classResourceKey);
    return {...r,...(definition&&!r.manual?definition:{}),id:r.id,used:count(r.used)};
  });
  for(const d of definitions) {
    if(c.hiddenClassResources?.includes(d.classResourceKey))continue;
    // Preserve older hand-entered pools and their rules until explicitly adopted.
    if(resources.some(r=>r.classResourceKey===d.classResourceKey||(!r.classResourceKey&&resourceMatches(r,d))))continue;
    resources.push(d);
  }
  return resources;
}
export function resourceRecoveryText(r) {
  const short=r.shortRecovery??(r.reset==='short'?'all':0);
  return `${short==='all'?'All on short or long rest':short?`${short} on short rest; all on long rest`:r.reset==='none'?'Manual recovery':'All on long rest'}${r.meditation?' · requires 30 minutes of meditation':''}${r.restoration?' · optional Sorcerous Restoration on short rest':''}`;
}
export function adjustResource(c,id,amount,abilities) {
  if(!Number.isInteger(amount))throw Error('Use a whole number of resource points.');
  const resources=characterResources(c,abilities),r=resources.find(r=>r.id===id);
  if(!r)throw Error('Resource not found.');
  if(r.unlimited)return {resources};
  if(amount>0&&count(r.used)+amount>count(r.max))throw Error('Not enough resource uses remaining.');
  return {resources:resources.map(x=>x.id===id?{...x,used:Math.max(0,count(x.used)+amount)}:x)};
}
export function restResources(c,rest,{meditated=false,restoreSorcery=false}={},abilities) {
  if(!['short','long'].includes(rest))throw Error('Choose a short or long rest.');
  let restored=false;
  const resources=characterResources(c,abilities).map(r=>{
    if(r.meditation&&!meditated)return r;
    let recovery=rest==='long'?(r.reset==='long'||r.reset==='short'?'all':0):(r.shortRecovery??(r.reset==='short'?'all':0));
    if(rest==='short'&&r.restoration&&restoreSorcery&&!c.sorcerousRestorationUsed&&r.used>0){recovery=r.restoration;restored=true;}
    return {...r,used:recovery==='all'?0:Math.max(0,count(r.used)-count(recovery))};
  });
  return {resources,...(rest==='long'?{sorcerousRestorationUsed:false}:restored?{sorcerousRestorationUsed:true}:{})};
}
