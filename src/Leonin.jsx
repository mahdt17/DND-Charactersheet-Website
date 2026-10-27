import React,{useState} from 'react';
import {leoninProfile,leoninActionBlock,useDauntingRoar,endDauntingRoar} from './lib/leonin';
const signed=n=>`${n>=0?'+':''}${n}`;
export default function Leonin({char,patch,roll,abilities}){
 const [notice,setNotice]=useState(''),[error,setError]=useState('');
 const p=leoninProfile(char,abilities);if(!p.active)return null;
 const blocked=leoninActionBlock(char);
 function roar(){try{patch(useDauntingRoar);setNotice('Roar used. Resolve the chosen creatures’ Wisdom saves and frightened condition at the table.');setError('');}catch(e){setError(e.message);}}
 function claws(){const result=roll(`1d20${signed(p.attack)}`,'Leonin claws attack');if(result){const critical=result.total-result.bonus===20;roll(critical?p.damage.replace('1d4','2d4'):p.damage,`Leonin claws · ${critical?'critical ':''}damage if hit`,{kind:'damage'});}}
 return <section className="l-panel section-spaced" aria-label="Leonin racial abilities"><h3>Leonin</h3><p className="l-muted">Mythic Odysseys of Theros · Darkvision 60 feet · Walking speed 35 feet</p>
 <article className="class-ability"><h4>Claws</h4><p>Melee unarmed strike · Strength · 5 feet · {signed(p.attack)} to hit · {p.damage} slashing damage</p><div className="l-toolbar"><button type="button" className="l-button" disabled={!!blocked} onClick={claws}>Claws attack</button><button type="button" className="l-button" disabled={!!blocked} onClick={()=>roll(p.damage,'Leonin claws damage',{kind:'damage'})}>Claws damage</button></div></article>
 <article className="class-ability"><h4>Daunting Roar</h4><p>Bonus action · 10 feet · Wisdom save DC {p.dc} · {p.remaining} / 1 use · Short- or long-rest recovery</p><p>Choose creatures in range that can hear you. On a failed save, they are frightened of you until the end of your next turn.</p><div className="l-toolbar"><button type="button" className="l-button primary" disabled={!!blocked||!p.remaining} onClick={roar}>Use Daunting Roar</button>{p.roaring&&<button type="button" className="l-button" onClick={()=>patch(endDauntingRoar)}>End roar reminder</button>}</div>{p.roaring&&<p role="status">Roar reminder: frightened targets recover when your next turn ends. Ending this reminder does not restore the use.</p>}</article>
 {blocked&&<p className="l-muted">{blocked}</p>}{notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}</section>;
}
