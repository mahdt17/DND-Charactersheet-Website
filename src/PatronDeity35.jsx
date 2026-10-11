import React,{useEffect,useState} from 'react';
import {patronDeityState35,patronDeityPatch35} from './lib/patronDeity35';

export default function PatronDeity35({char,patch}){
  const patron=patronDeityState35(char),[name,setName]=useState(patron.name);
  useEffect(()=>setName(patron.name),[patron.name]);
  return <section aria-label="Patron deity"><h2>Patron deity</h2>
    <p>Record your patron for class entry requirements. Leave blank if you have no patron. Changing a Cleric’s deity requires choosing domains again.</p>
    {patron.conflict&&<p role="status">Existing class choices name different patrons. Record your current patron to resolve this.</p>}
    <form className="l-toolbar" onSubmit={event=>{event.preventDefault();patch(patronDeityPatch35(char,name));}}>
      <label className="l-field"><span>Patron deity</span><input aria-label="Patron deity" maxLength={120} value={name} onChange={event=>setName(event.target.value)} placeholder="Not recorded"/></label>
      <button className="l-button" type="submit">Save patron</button>
    </form>
    <p className="l-muted">{patron.known?patron.name?`Current patron: ${patron.name}`:'No patron deity.':'Patron not recorded; deity requirements need review.'}</p>
  </section>;
}
