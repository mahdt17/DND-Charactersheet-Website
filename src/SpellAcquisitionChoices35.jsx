import React from 'react';
import SpellPicker from './EditionSpellPicker';
import {keyOf} from './lib/editions';
import {activeAcquiredSpells35,shugenjaSpellElement35,shugenjaOrderSpellMatches35,validateSpellReplacement35} from './lib/spellAcquisition35';

export default function SpellAcquisitionChoices35({events=[],spells=[],picks={},onChange,character=null}){
  if(!events.length)return null;
  const setPick=(event,value)=>onChange({...picks,[event.eventId||event.id]:value});
  const toggleIds=(event,spell,limit)=>{
    const id=keyOf(spell),key=event.eventId||event.id,current=Array.isArray(picks[key])?picks[key]:[];
    const next=current.includes(id)?current.filter(value=>value!==id):current.length<limit?[...current,id]:current;
    setPick(event,next);
  };
  return <section aria-label="3.5 spell acquisition choices">
    <h3>Spell acquisition</h3>
    {events.map(event=>{
      const key=event.eventId||event.id;
      if(event.kind==='choose-known-spells'){
        const legal=spells.filter(spell=>Number(spell.level)===Number(event.spellLevel));
        return <SpellPicker
          key={key}
          label={`Known level ${event.spellLevel} spells`}
          spells={legal}
          selected={Array.isArray(picks[key])?picks[key]:[]}
          limit={event.count}
          onToggle={spell=>toggleIds(event,spell,event.count)}
        />;
      }
      if(event.kind==='choose-flex-known-spells'){
        const alreadyOwned=new Set(activeAcquiredSpells35(character,event.classId).map(item=>item.spellKey));
        const selectedElsewhere=new Set(Object.entries(picks).filter(([id])=>id!==key).flatMap(([,pick])=>Array.isArray(pick)?pick:(Array.isArray(pick?.firstLevel)?pick.firstLevel:[])));
        const legal=spells.filter(spell=>Number(spell.level)<=Number(event.maxSpellLevel)&&!alreadyOwned.has(keyOf(spell))&&!selectedElsewhere.has(keyOf(spell)));
        return <SpellPicker
          key={key}
          label={`Known spell up to level ${event.maxSpellLevel}`}
          spells={legal}
          selected={Array.isArray(picks[key])?picks[key]:[]}
          limit={event.count}
          onToggle={spell=>toggleIds(event,spell,event.count)}
        />;
      }
      if(event.kind==='choose-partitioned-known-spells'){
        const value=picks[key]||{},favored=Array.isArray(value.favored)?value.favored:[],unrestricted=Array.isArray(value.unrestricted)?value.unrestricted:[];
        const used=new Set([...favored,...unrestricted,...(value.orderSpellId?[value.orderSpellId]:[])]);
        const levelSpells=spells.filter(spell=>Number(spell.level)===Number(event.spellLevel));
        const favoredLegal=levelSpells.filter(spell=>shugenjaSpellElement35(spell)===event.favoredElement&&(!used.has(keyOf(spell))||favored.includes(keyOf(spell)));
        const unrestrictedLegal=levelSpells.filter(spell=>shugenjaSpellElement35(spell)!==event.prohibitedElement&&(!used.has(keyOf(spell))||unrestricted.includes(keyOf(spell))));
        const orderLegal=event.orderSpellName?levelSpells.filter(spell=>shugenjaOrderSpellMatches35(spell,event.orderSpellName)):[];
        const toggle=(field,selected,limit,spell)=>{
          const id=keyOf(spell),next=selected.includes(id)?selected.filter(x=>x!==id):selected.length<limit?[...selected,id]:selected;
          setPick(event,{...value,[field]:next});
        };
        return <section key={key} aria-label={`Shugenja level ${event.spellLevel} known spells`}>
          <p className="l-notice">Favored element: {event.favoredElement}. {event.prohibitedElement?event.prohibitedElement+' spells are prohibited. ':''}{event.orderSpellName?`Order spell: ${event.orderSpellName}.`:''}</p>
          {event.orderSpellName&&<SpellPicker label="Fixed Order spell" spells={orderLegal} selected={value.orderSpellId?[value.orderSpellId]:[]} limit={1} onToggle={spell=>setPick(event,{...value,orderSpellId:value.orderSpellId===keyOf(spell)?'':keyOf(spell)})}/>}
          {event.favoredCount>0&&<SpellPicker label={`Favored-element level ${event.spellLevel} spells`} spells={favoredLegal} selected={favored} limit={event.favoredCount} onToggle={spell=>toggle('favored',favored,event.favoredCount,spell)}/>}
          {event.unrestrictedCount>0&&<SpellPicker label={`Additional level ${event.spellLevel} spells`} spells={unrestrictedLegal} selected={unrestricted} limit={event.unrestrictedCount} onToggle={spell=>toggle('unrestricted',unrestricted,event.unrestrictedCount,spell)}/>}
        </section>;
      }
      if(event.kind==='retrieve-daily-spells'){
        const value=picks[key]||{},byLevel=value.byLevel||{};
        const setLevel=(level,selected,limit,spell)=>{
          const id=keyOf(spell),next=selected.includes(id)?selected.filter(x=>x!==id):selected.length<limit?[...selected,id]:selected;
          setPick(event,{...value,byLevel:{...byLevel,[level]:next}});
        };
        return <section key={key} aria-label="Spirit Shaman daily spell retrieval">
          <p className="l-notice">Retrieve the day’s Druid spells. These are the spells available for spontaneous casting until the next daily retrieval.</p>
          {Object.entries(event.limits||{}).map(([level,limit])=>{const selected=Array.isArray(byLevel[level])?byLevel[level]:[];return <SpellPicker key={level} label={`Retrieved level ${level} spells`} spells={spells.filter(spell=>Number(spell.level)===Number(level))} selected={selected} limit={limit} onToggle={spell=>setLevel(level,selected,limit,spell)}/>;})}
        </section>;
      }
      if(event.kind==='magewright-spell-mastery'){
        const value=picks[key]||{};
        const mastered=Array.isArray(value.mastered)?value.mastered:[];
        const bonusCantrips=Array.isArray(value.bonusCantrips)?value.bonusCantrips:[];
        const alreadyOwned=new Set(activeAcquiredSpells35(character,event.classId).map(item=>item.spellKey));
        const selectedElsewhere=new Set(Object.entries(picks).filter(([id])=>id!==key).flatMap(([,pick])=>{
          if(Array.isArray(pick))return pick;
          return [...(Array.isArray(pick?.firstLevel)?pick.firstLevel:[]),...(Array.isArray(pick?.mastered)?pick.mastered:[]),...(Array.isArray(pick?.bonusCantrips)?pick.bonusCantrips:[])];
        }));
        const masteryLegal=spells.filter(spell=>Number(spell.level)<=Number(event.maxSpellLevel)&&!alreadyOwned.has(keyOf(spell))&&!selectedElsewhere.has(keyOf(spell))&&!bonusCantrips.includes(keyOf(spell)));
        const cantripLegal=spells.filter(spell=>Number(spell.level)===0&&!alreadyOwned.has(keyOf(spell))&&!selectedElsewhere.has(keyOf(spell))&&!mastered.includes(keyOf(spell)));
        const toggleList=(field,selected,limit,spell)=>{
          const id=keyOf(spell);
          const next=selected.includes(id)?selected.filter(x=>x!==id):selected.length<limit?[...selected,id]:selected;
          setPick(event,{...value,[field]:next});
        };
        return <section key={key} aria-label="Magewright spell mastery">
          <p className="l-notice">Choose the spells this Magewright has mastered and can prepare without a spellbook.</p>
          {event.count>0&&<SpellPicker
            label="Mastered spells"
            spells={masteryLegal}
            selected={mastered}
            limit={event.count}
            onToggle={spell=>toggleList('mastered',mastered,event.count,spell)}
          />}
          {event.bonusCantripCount>0&&<SpellPicker
            label="Additional mastered level 0 spell"
            spells={cantripLegal}
            selected={bonusCantrips}
            limit={event.bonusCantripCount}
            onToggle={spell=>toggleList('bonusCantrips',bonusCantrips,event.bonusCantripCount,spell)}
          />}
        </section>;
      }
      if(event.kind==='wizard-starting-spellbook'){
        const cantrips=spells.filter(spell=>Number(spell.level)===0);
        const first=spells.filter(spell=>Number(spell.level)===1);
        const value=picks[key]||{},selected=Array.isArray(value.firstLevel)?value.firstLevel:[];
        const toggle=spell=>{
          const id=keyOf(spell);
          const next=selected.includes(id)?selected.filter(value=>value!==id):selected.length<event.firstLevelChoices?[...selected,id]:selected;
          setPick(event,{...value,firstLevel:next});
        };
        return <div key={key}>
          <p className="l-notice">Automatic level 0 spellbook entries: {cantrips.length} legal class spells will be added when you finish creation.</p>
          <SpellPicker label="Starting spells" spells={first} selected={selected} limit={event.firstLevelChoices} onToggle={toggle}/>
        </div>;
      }
      if(event.kind==='wizard-free-spellbook-additions'){
        const legal=spells.filter(spell=>Number(spell.level)<=Number(event.maxSpellLevel));
        return <SpellPicker
          key={key}
          label="Free spellbook additions"
          spells={legal}
          selected={Array.isArray(picks[key])?picks[key]:[]}
          limit={event.count}
          onToggle={spell=>toggleIds(event,spell,event.count)}
        />;
      }
      if(event.kind==='optional-replacement'){
        const value=picks[key]||{},owned=activeAcquiredSpells35(character,event.classId)
          .filter(item=>item.affectsQuota!==false&&Number(item.spellLevel)<=Number(event.maxReplacementSpellLevel)&&(event.profileId!=='shugenja-35'||item.origin!=='order-spell'))
          .sort((a,b)=>Number(a.spellLevel)-Number(b.spellLevel)||String(a.spellName).localeCompare(String(b.spellName)));
        const removed=owned.find(item=>item.spellKey===value.removedSpellKey)||null;
        const alreadyOwned=new Set(activeAcquiredSpells35(character,event.classId).map(item=>item.spellKey));
        const selectedElsewhere=new Set(Object.entries(picks).filter(([id])=>id!==key).flatMap(([,pick])=>Array.isArray(pick)?pick:(Array.isArray(pick?.firstLevel)?pick.firstLevel:[])));
        const replacements=removed?spells.filter(spell=>Number(spell.level)===Number(removed.spellLevel)&&!alreadyOwned.has(keyOf(spell))&&!selectedElsewhere.has(keyOf(spell))&&validateSpellReplacement35(character,event,{removedSpellKey:removed.spellKey,addedSpell:spell}).valid):[];
        const enabled=Boolean(value.enabled);
        return <section key={key} aria-label="Optional spell replacement" className="creation-section">
          <h4>Optional spell replacement</h4>
          <p>You may replace one eligible known spell at this class level. Skipping this does not block level-up.</p>
          <label className="l-check"><input type="checkbox" aria-label="Replace one known spell this level" checked={enabled} onChange={e=>setPick(event,e.target.checked?{enabled:true}:{enabled:false})}/> Replace one known spell this level</label>
          {enabled&&<><label className="l-field"><span>Known spell to replace</span><select aria-label="Known spell to replace" value={value.removedSpellKey||''} onChange={e=>setPick(event,{enabled:true,removedSpellKey:e.target.value,addedSpellId:''})}><option value="">Choose known spell</option>{owned.map(item=><option key={item.id||item.spellKey} value={item.spellKey}>{item.spellName}</option>)}</select></label>
          {removed&&<SpellPicker label={`Replacement level ${removed.spellLevel} spells`} spells={replacements} selected={value.addedSpellId?[value.addedSpellId]:[]} limit={1} onToggle={spell=>setPick(event,{...value,enabled:true,removedSpellKey:removed.spellKey,addedSpellId:value.addedSpellId===keyOf(spell)?'':keyOf(spell)})}/>}</>}
        </section>;
      }
      return null;
    })}
  </section>;
}
