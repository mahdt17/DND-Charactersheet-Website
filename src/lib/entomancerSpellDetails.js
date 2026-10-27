import details from '../data/entomancer-spell-details.json' with {type:'json'};

// Match source identity, never a spell's display name: homebrew and revised
// spells may intentionally use different rules under the same name.
export function reviewedEntomancerSpell(spell){
 if(spell.edition&&spell.edition!=='2014')return null;
 return details.entries[spell.catalogId||spell.index||spell.id]||null;
}

export function refreshEntomancerSpell(spell){
 const rules=reviewedEntomancerSpell(spell);
 if(rules)return normalizeSpellLists5e({...spell,...rules,id:spell.id||rules.catalogId});
 const patch=(!spell.edition||spell.edition==='2014')&&details.srdPatches[spell.catalogId];
 return normalizeSpellLists5e(patch?{...spell,...patch}:spell);
}
export function normalizeSpellLists5e(spell){
 if(spell.edition&&spell.edition!=='2014'||!Array.isArray(spell.classes))return spell;
 const labels=spell.sourceClassLists||spell.classes.map(c=>typeof c==='string'?c:c.name);
 return {...spell,sourceClassLists:labels,classes:[...new Set(labels.map(name=>name.replace(/\s*\(Optional\)\s*$/i,'').replace(/^Wizard\s*\((?:Dunamancy|Graviturgy|Chronurgy)\)$/i,'Wizard')))]};
}
