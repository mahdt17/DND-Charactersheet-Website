import React from 'react';
import {stormbornProfile,setStormbornEnvironment} from './lib/subclassStormborn';
import {ownFormProfile,ownFormWalkingSpeed} from './lib/subclassOwnForm';
import {conditionEffects} from './lib/play';
export default function StormbornTools({char,ownerId,patch}){
 const p=stormbornProfile(char,ownerId);if(!p)return null;
 const speed=ownFormProfile(char)?ownFormWalkingSpeed(char):conditionEffects(char).speed;
 return <article className="class-ability" aria-label="Stormborn"><h4>Stormborn</h4><label><input type="checkbox" checked={p.active} onChange={e=>{const checked=e.target.checked;patch(current=>setStormbornEnvironment(current,ownerId,checked));}}/>I am outdoors and above ground</label>{p.active&&<p role="status">Flying speed {speed} feet, equal to current walking speed.</p>}</article>;
}
