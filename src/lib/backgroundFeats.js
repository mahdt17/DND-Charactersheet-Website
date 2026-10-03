import modern from '../data/srd2024.json' with {type:'json'};
export function backgroundFeat(c){
 if((c.ruleset==='custom'?c.mechanics:c.ruleset)!=='2024')return null;
 const background=modern.backgrounds.find(x=>x.name===c.background);if(!background?.feat)return null;
 const base=modern.feats.find(f=>f.index===background.feat.index);if(!base)return null;
 const list=background.feat.note||({Acolyte:'Cleric',Sage:'Wizard'}[background.name])||background.feat.name.match(/\((Cleric|Druid|Wizard)\)/)?.[1];
 return {...base,id:`background:2024:${background.index}`,catalogId:`2024:${base.index}`,name:background.feat.name,edition:'2024',level:1,source:background.name,sourceType:'background',requiredSpellList:list,magicChoices:list?{list}:undefined};
}
export function setupBackgroundFeats(c){
 const feat=backgroundFeat(c),other=(c.feats||[]).filter(f=>f.sourceType!=='background');
 if(!feat)return other;
 const saved=(c.feats||[]).find(f=>f.id===feat.id);
 return [...other,{...feat,...(saved?{magicChoices:saved.magicChoices}:{}),requiredSpellList:feat.requiredSpellList}];
}
