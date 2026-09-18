export const CONTENT_SCHEMA_VERSION = 1;

const TYPE_ALIASES = {
  classes:'class', class:'class', subclasses:'subclass', subclass:'subclass',
  spells:'spell', spell:'spell', feats:'feat', feat:'feat', items:'item', item:'item',
  equipment:'item', races:'race', race:'race', species:'race', traits:'trait', trait:'trait',
  features:'feature', feature:'feature', backgrounds:'background', background:'background',
  monsters:'monster', monster:'monster', skills:'skill', skill:'skill', templates:'template', template:'template',
  deities:'deity', deity:'deity', domains:'domain', domain:'domain', psionics:'psionic', psionic:'psionic',
  rules:'rule', rule:'rule', rulebooks:'rulebook', rulebook:'rulebook'
};

export function contentType(value='') {
  return TYPE_ALIASES[String(value).trim().toLowerCase()] || String(value || 'reference').trim().toLowerCase();
}

export function normalizeEdition(value='2014') {
  const edition=String(value || '2014').trim().toLowerCase();
  if(['3.5','3.5e','3.5-reference','dnd3.5'].includes(edition)) return '3.5';
  if(['5e','2014','5e-2014'].includes(edition)) return '2014';
  if(['5.5e','2024','revised','5e-2024'].includes(edition)) return '2024';
  if(edition==='custom') return 'custom';
  return value || '2014';
}

export function textValue(value) {
  if(Array.isArray(value)) return value.map(textValue).filter(Boolean).join('\n\n');
  if(value && typeof value==='object') return textValue(value.desc ?? value.description ?? value.name ?? '');
  return String(value ?? '').replace(/\r\n?/g,'\n').trim();
}

const listNames=value=>(value||[]).map(v=>typeof v==='string'?v:v?.name||v?.index).filter(Boolean);
const plainSchool=value=>typeof value==='string'?value:value?.name||value?.index||'';

function sourceMeta(entry, options={}) {
  const sourceName=textValue(options.source || entry.sourceName || entry.source || (entry.referenceOnly?'Reference source':''));
  const url=options.sourceUrl || entry.sourceUrl || entry.url || '';
  let kind=options.sourceKind || entry.sourceKind || 'unknown';
  if(/SRD/i.test(sourceName)) kind='srd';
  else if(/DnD Tools/i.test(sourceName)||/new\.dndtools\.org/i.test(url)) kind='reference';
  else if(/wikidot/i.test(sourceName)||/dnd5e\.wikidot\.com/i.test(url)) kind='reference';
  else if(/homebrew/i.test(sourceName)||entry.homebrew) kind='homebrew';
  return {
    name:sourceName,
    book:textValue(entry.sourceBook || entry.book || entry.document || ''),
    page:entry.sourcePage ?? entry.page ?? null,
    url,
    kind,
    license:textValue(options.license || entry.license || '')
  };
}

function normalizePrerequisites(entry) {
  const value=entry.prerequisites ?? entry.requirements ?? entry.prerequisite ?? entry.requirement;
  if(value == null || value === '') return [];
  if(Array.isArray(value)) return value.flatMap(v=>{
    if(v == null || v === '') return [];
    if(typeof v==='string') return [{kind:'text',text:v.trim()}];
    if(typeof v==='object') return [{kind:v.kind||v.type||'structured',...v,text:textValue(v.text||v.description||v.name||'')}];
    return [{kind:'text',text:String(v)}];
  });
  if(typeof value==='object') return [{kind:value.kind||value.type||'structured',...value,text:textValue(value.text||value.description||value.name||'')}];
  return [{kind:'text',text:String(value).trim()}];
}

function classStats(entry) {
  return {
    hitDie:Number(entry.hit_die ?? entry.hitDie) || null,
    prestige:Boolean(entry.prestige),
    skillPoints:textValue(entry.skillPoints || entry.skill_points || ''),
    primaryAbility:textValue(entry.primaryAbility || entry.primary_ability?.desc || entry.primary_ability || ''),
    savingThrows:listNames(entry.saving_throws || entry.savingThrows),
    proficiencies:listNames(entry.proficiencies),
    spellcastingAbility:textValue(entry.castingAbility || entry.spellcastingAbility || entry.spellcasting?.ability || '')
  };
}

function spellStats(entry) {
  return {
    level:Number.isInteger(entry.level)?entry.level:(Number(entry.level)||0),
    school:plainSchool(entry.school),
    castingTime:textValue(entry.casting_time || entry.castingTime || ''),
    range:textValue(entry.range || ''),
    duration:textValue(entry.duration || ''),
    components:Array.isArray(entry.components)?entry.components.map(v=>typeof v==='string'?v:v?.name||v?.index).filter(Boolean):textValue(entry.components).split(/\s*,\s*/).filter(Boolean),
    concentration:Boolean(entry.concentration) || /concentration/i.test(textValue(entry.duration)),
    ritual:Boolean(entry.ritual),
    classes:listNames(entry.classes),
    classLevels:entry.classLevels && typeof entry.classLevels==='object'?{...entry.classLevels}:{},
    higherLevel:textValue(entry.higher_level || entry.higherLevel || ''),
    damage:entry.damage || null,
    healAtSlotLevel:entry.heal_at_slot_level || entry.healAtSlotLevel || null
  };
}

function itemStats(entry) {
  return {
    itemType:textValue(entry.itemType || entry.equipment_category?.name || entry.gear_category?.name || entry.category || ''),
    rarity:textValue(entry.rarity?.name || entry.rarity || ''),
    attunement:entry.requires_attunement ?? entry.attunement ?? null,
    weight:entry.weight ?? null,
    cost:entry.cost ?? null,
    armorClass:entry.armor_class ?? entry.armorClass ?? null,
    damage:entry.damage ?? null,
    properties:listNames(entry.properties),
    charges:entry.charges ?? null
  };
}

function raceStats(entry) {
  return {
    speed:Number(entry.speed) || null,
    size:textValue(entry.size || ''),
    bonuses:entry.bonuses && typeof entry.bonuses==='object'?{...entry.bonuses}:{},
    levelAdjustment:entry.levelAdjustment ?? entry.level_adjustment ?? null,
    traits:listNames(entry.traits)
  };
}

function featureStats(entry) {
  return {
    level:Number(entry.level?.name?.match?.(/\d+$/)?.[0] ?? entry.level) || null,
    className:textValue(entry.class?.name || entry.className || ''),
    subclass:textValue(entry.subclass?.name || entry.subclass || '')
  };
}

function statsFor(type, entry) {
  if(type==='class'||type==='subclass') return classStats(entry);
  if(type==='spell'||type==='psionic') return spellStats(entry);
  if(type==='item') return itemStats(entry);
  if(type==='race') return raceStats(entry);
  if(type==='feature'||type==='trait') return featureStats(entry);
  if(type==='feat') return {category:textValue(entry.feat_category?.name || entry.featType || entry.category || '')};
  if(type==='background') return {proficiencies:listNames(entry.proficiencies),feat:textValue(entry.feat?.name || entry.feat || '')};
  return {};
}

function hasMeaningfulStats(stats) {
  return Object.values(stats).some(value=>{
    if(value == null || value === '') return false;
    if(Array.isArray(value)) return value.length>0;
    if(typeof value==='object') return Object.keys(value).length>0;
    if(typeof value==='boolean') return value;
    return true;
  });
}

export function generatedDescription(type, edition, entry, stats, source) {
  const label=edition==='3.5'?'3.5e':edition==='2024'?'5.5e / 2024':edition==='2014'?'5e / 2014':edition;
  if(type==='class'||type==='subclass'){
    const bits=[stats.prestige?'prestige class':type==='subclass'?'subclass':'class'];
    if(stats.hitDie)bits.push(`d${stats.hitDie} hit die`);
    if(stats.skillPoints)bits.push(`${stats.skillPoints} skill points`);
    return `${entry.name} is a ${label} ${bits.join(' with ')}${source.book?` from ${source.book}`:''}. ${entry.referenceOnly?'Detailed source mechanics can be completed or overridden in the catalog editor.':'Its structured class information is available in this catalog.'}`;
  }
  if(type==='spell'||type==='psionic'){
    const level=Number(stats.level)||0;
    const bits=[level?(`level ${level}`):'cantrip',stats.school].filter(Boolean).join(' ');
    const use=[stats.castingTime&&`cast in ${stats.castingTime}`,stats.range&&`range ${stats.range}`,stats.duration&&`duration ${stats.duration}`].filter(Boolean).join(', ');
    return `${entry.name} is a ${label} ${bits||'spell'}${source.book?` from ${source.book}`:''}.${use?` ${use}.`:''} ${entry.referenceOnly?'Open the source or edit this entry to complete any missing rule details.':''}`.trim();
  }
  if(type==='item'){
    const bits=[stats.rarity,stats.itemType].filter(Boolean).join(' ');
    return `${entry.name} is a ${label} ${bits||'item'}${source.book?` from ${source.book}`:''}. ${entry.referenceOnly?'Known item statistics are shown when available; missing fields can be edited.':''}`.trim();
  }
  if(type==='feat'){
    return `${entry.name} is a ${label} feat${source.book?` from ${source.book}`:''}. ${entry.referenceOnly?'Prerequisites and mechanical details are shown when available and can be completed in the editor.':''}`.trim();
  }
  if(type==='race')return `${entry.name} is a ${label} ancestry/species reference${stats.speed?` with ${stats.speed} ft. base speed`:''}. Missing traits or statistics can be completed in the editor.`;
  return `${entry.name} is a ${label} ${type||'rules'} reference${source.book?` from ${source.book}`:''}. Known structured information is shown below and missing details can be edited.`;
}

export function normalizeContentEntry(entry, options={}) {
  const type=contentType(options.contentType || entry.contentType || entry.category);
  const edition=normalizeEdition(options.edition || entry.edition);
  const sourceDescription=textValue(entry.description || entry.desc || options.description || '');
  const source=sourceMeta(entry,options);
  const prerequisites=normalizePrerequisites(entry);
  const progression=Array.isArray(entry.progression)?entry.progression:Array.isArray(entry.tables)?entry.tables:[];
  const stats={...statsFor(type,entry),...(entry.stats && typeof entry.stats==='object'?entry.stats:{})};
  const description=sourceDescription || generatedDescription(type,edition,entry,stats,source);
  const missing=[];
  if(!sourceDescription) missing.push('description');
  if(!source.name && !source.url) missing.push('source');
  if(['class','spell','item','race','feat','subclass'].includes(type)&&!hasMeaningfulStats(stats)) missing.push('stats');
  if((type==='class'||type==='subclass')&&entry.prestige&&prerequisites.length===0) missing.push('prerequisites');
  if(type==='class'&&progression.length===0) missing.push('progression');
  const id=entry.catalogId || entry.id || `${edition}:${type}:${entry.index||entry.slug||entry.name}`;
  return {
    ...entry,
    schemaVersion:CONTENT_SCHEMA_VERSION,
    id:entry.id || id,
    catalogId:id,
    contentType:type,
    edition,
    name:textValue(entry.name),
    description,
    descriptionOrigin:sourceDescription?'source':'generated',
    sourceDescription,
    source:typeof entry.source==='string'?entry.source:source.name,
    sourceUrl:source.url,
    sourceMeta:source,
    stats,
    prerequisites,
    progression,
    editable:entry.editable!==false,
    completeness:{
      complete:missing.length===0,
      missing,
      hasDescription:Boolean(description),
      hasSourceDescription:Boolean(sourceDescription),
      hasStats:hasMeaningfulStats(stats),
      hasSource:Boolean(source.name||source.url),
      hasPrerequisites:prerequisites.length>0,
      hasProgression:progression.length>0
    }
  };
}

export function auditContent(entries=[]) {
  const rows=entries.map(entry=>normalizeContentEntry(entry));
  const byType={};
  const missing={description:0,stats:0,source:0,prerequisites:0,progression:0};
  for(const row of rows){
    const bucket=byType[row.contentType] ||= {total:0,complete:0,incomplete:0};
    bucket.total++;
    if(row.completeness.complete) bucket.complete++; else bucket.incomplete++;
    for(const key of row.completeness.missing) missing[key]=(missing[key]||0)+1;
  }
  return {total:rows.length,complete:rows.filter(r=>r.completeness.complete).length,incomplete:rows.filter(r=>!r.completeness.complete).length,missing,byType};
}
