import spells from '../data/spells.json' with {type:'json'};
// Static spell data must not depend on the calculation graph: edition catalogs
// are initialized before some attack/form modules that also use slot planning.
export const spellCatalog=spells.map(s=>({...s,description:s.desc.join('\n\n'),school:s.school.name,classes:s.classes.map(c=>c.name)}));
