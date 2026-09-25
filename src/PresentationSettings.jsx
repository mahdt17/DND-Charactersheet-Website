import React,{createContext,useContext,useEffect,useState} from 'react';
import {Settings} from 'lucide-react';
import {readPresentation,writePresentation} from './lib/presentation';

const Context=createContext(null);
export function PresentationProvider({children}) {
  const [preferences,setPreferences]=useState(readPresentation);
  useEffect(()=>writePresentation(preferences),[preferences]);
  const update=patch=>setPreferences(previous=>({...previous,...patch}));
  return <Context.Provider value={{preferences,update}}>{children}</Context.Provider>;
}
export const usePresentation=()=>useContext(Context);
export function useReducedMotion() {
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(query.matches);query.addEventListener('change',change);return()=>query.removeEventListener('change',change);},[]);
  return reduced;
}
export default function PresentationSettings() {
  const {preferences,update}=usePresentation();
  return <details className="appearance-control"><summary><Settings size={16}/><span>Appearance</span></summary><div className="appearance-popover">
    <strong>Make the ledger yours</strong>
    <label><input type="checkbox" checked={preferences.backgrounds} onChange={e=>update({backgrounds:e.target.checked})}/>Scenic backgrounds</label>
    <p>Turn off the scenery for a simpler page.</p>
    <label><input type="checkbox" checked={preferences.animation} onChange={e=>update({animation:e.target.checked})}/>Animated dice</label>
    <p>Dice styles are in the dice roller. Your preferences stay on this device.</p>
  </div></details>;
}
