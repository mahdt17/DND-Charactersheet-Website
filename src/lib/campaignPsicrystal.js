import {campaignProfile,useCampaignPower,hasConversionFeat} from './archivistCampaign.js';
import {extendedPsionProfile,manifestExtendedPower} from './campaignPsionics.js';
import {whole} from './campaignCreatures.js';
const set=(c,value)=>({...c,archivistCampaign:{...c.archivistCampaign,psicrystal:{...c.archivistCampaign?.psicrystal,...value}}});
export function preservePsicrystalDestruction(c){const s=c.archivistCampaign?.psicrystal;if(!s)return c;const maxHP=Math.max(1,Number(c.archivistCampaign?.rulings?.crystalHP??Math.floor((c.hp?.max||1)/2))),damage=Number(s.damage||0),destroyed=!!s.destroyed||damage>=maxHP||Number.isFinite(s.maxHP)&&damage>=s.maxHP;return destroyed?destroyPsicrystalRing(set(c,{maxHP,destroyed})):set(c,{maxHP,destroyed});}
export function psicrystalProfile(c){
 const p=campaignProfile(c),s=c.archivistCampaign?.psicrystal||{},r=p.rulings,level=hasConversionFeat(c,'Psicrystal Affinity')?p.psion:0,maxHP=Math.max(1,Number(r.crystalHP??Math.floor(c.hp.max/2))),destroyed=!!s.destroyed||Number(s.damage||0)>=maxHP||Number.isFinite(s.maxHP)&&Number(s.damage||0)>=s.maxHP,currentHP=destroyed?0:Math.max(0,maxHP-Number(s.damage||0)),distance=Number(s.distance??(c.archivistCampaign?.psicrystalNearby===false?5281:5)),alive=level>0&&currentHP>0,nearby=alive&&c.archivistCampaign?.psicrystalNearby!==false&&distance<=5280,adjustment=Math.floor(Math.max(0,level-1)/2);
 return {...s,level,maxHP,currentHP,distance,alive,nearby,destroyed,ac:Number(r.crystalAC??13)+adjustment,int:6+adjustment,speed:nearby&&s.legsMinutes>0?30:0,climb:nearby&&s.legsMinutes>0?20:0,flight:nearby&&level>=9&&s.flightMinutes>0?50:0,powerResistance:nearby&&level>=11?level+5:0,sharedPowers:nearby&&distance<=5?s.sharedPowers||{}:{},pendingTouch:s.pendingTouch||null};
}
function requireCrystal(c,level=1){const p=psicrystalProfile(c);if(p.level<level)throw Error(`Psion level ${level} required.`);if(!p.alive)throw Error('A living Psicrystal is required.');if(!p.nearby)throw Error('Psicrystal must be within one mile.');return p;}
export function movePsicrystal(c,distance){whole(distance,'Distance in feet');const next=set(c,{distance,...(distance>5?{sharedPowers:{}}:{}),...(distance>5280?{sightMinutes:0}:{})});return {...next,archivistCampaign:{...next.archivistCampaign,psicrystalNearby:distance<=5280}};}
export function activatePsicrystal(c,kind){const p=requireCrystal(c,({legs:1,flight:9,sight:13})[kind]||99);if(kind==='sight'&&p.sightUsed)throw Error('Sight link already used today.');return set(c,kind==='sight'?{sightUsed:true,sightMinutes:Math.max(1,Number(c.archivistCampaign?.rulings?.crystalSightMinutes??1))}:{[kind==='legs'?'legsMinutes':'flightMinutes']:1440});}
export function changePsicrystalHP(c,amount,{heal=false,evasion=false,saveSucceeded=false}={}){whole(amount,'HP adjustment');const p=psicrystalProfile(c);if(heal&&!p.alive)throw Error('Restore the destroyed crystal through a table ruling first.');const actual=evasion?(saveSucceeded?0:Math.floor(amount/2)):amount,damage=Math.max(0,Math.min(p.maxHP,(p.damage||0)+(heal?-actual:actual))),destroyed=p.destroyed||damage>=p.maxHP;const next=set(c,{damage,maxHP:p.maxHP,destroyed,...(destroyed?{pendingTouch:null,sharedPowers:{},sightMinutes:0,legsMinutes:0,flightMinutes:0}:{})});return destroyed?destroyPsicrystalRing(next):next;}
export function manifestWithPsicrystal(c,id,{mode='normal',...options}={}){
 const power=extendedPsionProfile(c).powers.find(p=>p.id===id);if(!power)throw Error('Known power required.');
 if(mode!=='normal'){const p=requireCrystal(c,mode==='channel'?15:mode==='touch'?3:1);if(!['channel','touch','share'].includes(mode))throw Error('Choose a manifestation mode.');if(mode==='touch'&&(p.distance!==0||power.range!=='Touch'))throw Error('Touch delivery requires contact and a Touch power.');if(mode==='share'&&(p.distance>5||!['Self','Personal'].includes(power.range)))throw Error('Sharing requires a personal power within 5 feet.');}
 let next=['mindlink','inertial-armor','attraction'].includes(id)?useCampaignPower(c,id,options):manifestExtendedPower(c,id,options);
 next=set(next,{pendingTouch:mode==='touch'?{id,power,manifestId:next.archivistCampaign.lastManifest?.id}:null,...(mode==='share'?{sharedPowers:{...psicrystalProfile(c).sharedPowers,[id]:{minutes:next.archivistCampaign.powerEffects?.[id]?.minutes||0}}}:{})});
 return {...next,archivistCampaign:{...next.archivistCampaign,lastManifest:next.archivistCampaign.lastManifest?.power?.id===id?{...next.archivistCampaign.lastManifest,origin:mode==='channel'?'Psicrystal':'Caster',touchPending:mode==='touch'}:next.archivistCampaign.lastManifest}};
}
export function deliverPsicrystalTouch(c){const p=requireCrystal(c,3);if(!p.pendingTouch)throw Error('No pending touch power.');return {...set(c,{pendingTouch:null}),archivistCampaign:{...set(c,{pendingTouch:null}).archivistCampaign,lastManifest:{...c.archivistCampaign.lastManifest,touchPending:false}}};}

const ringItem=(c,id)=>c.inventory?.find(i=>i.id===id&&/^ring of spell storing$/i.test(String(i.name||'').trim())&&Number(i.qty??1)>0);
export function psicrystalRing(c){return ringItem(c,c.archivistCampaign?.psicrystal?.ringId)||null;}
function destroyPsicrystalRing(c){const id=c.archivistCampaign?.psicrystal?.ringId;if(!id)return c;const next=set(c,{ringId:null});return {...next,inventory:(c.inventory||[]).map(i=>i.id===id?{...i,qty:Math.max(0,Number(i.qty??1)-1),storedSpells:[]}:i)};}
export function assignPsicrystalRing(c,id){if(!psicrystalProfile(c).alive)throw Error('A living Psicrystal is required.');if(!ringItem(c,id))throw Error('An available Ring of Spell Storing in inventory is required.');return set(c,{ringId:id});}
export function loadPsicrystalRing(c,{name,level,confirmed}={}){
 const ring=psicrystalRing(c);if(!ring||!psicrystalProfile(c).alive)throw Error('Assign an available ring to a living Psicrystal first.');
 if(!confirmed)throw Error('Confirm that the spell was cast into the ring.');
 const spell=String(name||'').trim(),n=Number(level),known={'revivify':3,'raise dead':5,'reincarnate':5};if(!spell||!Number.isInteger(n)||n<1||n>5||known[spell.toLowerCase()]&&n<known[spell.toLowerCase()])throw Error('Enter a valid spell name and spell level.');
 const stored=ring.storedSpells||[];if(stored.reduce((sum,s)=>sum+Number(s.level),0)+n>5)throw Error('Ring capacity is five total spell levels.');
 return {...c,inventory:c.inventory.map(i=>i.id===ring.id?{...i,storedSpells:[...stored,{name:spell,level:n}]}:i)};
}
export function reviveWithPsicrystal(c,index,{minutesSinceDeath,requirementsConfirmed,castingCompleted}={}){
 const conditions=Array.isArray(c.conditions)?c.conditions:String(c.conditions||'').split(',').map(x=>x.trim()).filter(Boolean),dead=c.archivistCampaign?.dead||Number(c.deathSaves?.failure||0)>=3||conditions.some(x=>String(x?.name??x).toLowerCase()==='dead')||Number(c.exhaustion||0)>=6;
 if(!dead)throw Error('Confirmed death is required.');
 if(c.archivistCampaign?.soulDestroyed||c.soulDestroyed)throw Error('The soul must be available for revival.');
 const ring=psicrystalRing(c);if(!ring||!psicrystalProfile(c).alive)throw Error('A living Psicrystal with its assigned ring is required.');
 const spells=ring.storedSpells||[],spell=spells[index],name=String(spell?.name||'').toLowerCase();if(!spell||!(name==='revivify'&&spell.level>=3&&spell.level<=5||(name==='raise dead'||name==='reincarnate')&&spell.level===5))throw Error('Select a stored eligible revival spell.');
 const minutes=Number(minutesSinceDeath);if(minutesSinceDeath==null||minutesSinceDeath===''||!Number.isFinite(minutes)||minutes<0)throw Error('Enter time since death in minutes.');
 if(name==='revivify'&&minutes>1)throw Error('Revivify requires death within one minute.');if(name!=='revivify'&&minutes>14400)throw Error('This spell requires death within ten days.');
 if(!requirementsConfirmed)throw Error('Confirm body access and all spell requirements.');if(name!=='revivify'&&(!castingCompleted||minutes<60))throw Error('Confirm the one-hour casting is complete.');
 const next=set(c,{lastRevival:{spell:spell.name,minutesSinceDeath:minutes}});
 return {...next,hp:{...c.hp,current:1},...(Number(c.exhaustion)>0?{exhaustion:Math.max(0,Number(c.exhaustion)-1)}:{}),deathSaves:{success:0,failure:0},conditions:conditions.filter(x=>String(x?.name??x).toLowerCase()!=='dead'),inventory:c.inventory.map(i=>i.id===ring.id?{...i,storedSpells:spells.filter((_,n)=>n!==index)}:i),archivistCampaign:{...next.archivistCampaign,dead:false}};
}
