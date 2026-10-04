#!/usr/bin/env node
import fs from 'node:fs';

const args=process.argv.slice(2);
const trackerPath=args.find(arg=>!arg.startsWith('--'))||'docs/class-completion-tracker.json';
const write=args.includes('--write');
const check=args.includes('--check');

function classify(entry){
  const explicit=[];
  for(const dep of entry.dependencies||[]){
    const m=String(dep).match(/^Cohort:\s*([^.]*)/i);
    if(m){
      const canonical={
        'action/resource and feature-reconciliation':'class actions/resources and feature reconciliation',
        'casting/progression':'ordinary prestige spellcasting/selected caster advancement',
        'performance/action-resource':'bardic music/performance resources',
        'persistent choice':'persistent feature choices',
        'transformation/wild-shape':'transformations/wild-shape',
        'psionics/manifesting':'psionics/manifesting',
        'domain/divine':'domains/deity progression',
        'favored-enemy':'Favored Enemy variants',
        'paladin/favored-enemy':'Favored Enemy variants',
        'companion/cohort':'companions/mounts/cohorts',
        'companion/mount':'companions/mounts/cohorts',
        'incarnum':'incarnum/soulmelds',
        'binding':'binding/vestiges',
        'truenaming':'truenaming'
      };
      for(const raw of m[1].split(/\s*,\s*/)){
        const tag=canonical[raw.trim()]||raw.trim();
        if(tag)explicit.push(tag);
      }
    }
  }
  if(explicit.length) return [...new Set(explicit)];
  const text=[entry.name,entry.sourceBook,entry.nextAction,...(entry.gaps||[]),...(entry.dependencies||[])].filter(Boolean).join(' ').toLowerCase();
  const tags=[];
  const add=(tag,re)=>{if(re.test(text))tags.push(tag);};
  add('substitution/base-class replacement',/\bsubstitution\b|\bvariant\b|\breplacement\b|\breplaces?\b|alternate class feature/);
  add('psionics/manifesting',/\bpsion(?:ic|ics)?\b|\bmanifest(?:ing|er)?\b|power points?|powers? known|\bmantle\b|psychic warrior|mind blade/);
  add('incarnum/soulmelds',/\bincarnum\b|soulmeld|essentia|chakra bind|meldshap/);
  add('Tome of Battle maneuvers/stances',/\bmaneuvers?\b|\bstances?\b|initiator level|martial adept|blade magic/);
  add('binding/vestiges',/\bvestiges?\b|soul binding|\bbinder\b/);
  add('truenaming',/truenam|\butterances?\b|lexicon of the/);
  add('shadowcasting/mysteries',/shadowcast|mysteries known|mystery progression|paths? of shadow/);
  add('spellfire',/\bspellfire\b/);
  add('transformations/wild-shape',/wild shape|alternate form|shapechange|\btransform(?:ation|ing)?\b|bear form|dragon form|form of /);
  add('companions/mounts/cohorts',/animal companion|\bcompanion\b|\bfamiliar\b|special mount|\bmount\b|leadership cohort|cohort\/follower|\bfollowers?\b|vermin servant|tether hound|acquire ship|shipbond/);
  add('domains/deity progression',/\bdomains?\b|deity-specific|patron deity|deity progression|domain progression/);
  add('Favored Enemy variants',/favou?red enemy/);
  add('bardic music/performance resources',/bardic music|music uses?|\bperformance\b|\bsong\b|inspire courage|inspire competence/);
  add('temporary/permanent weapon or item state',/weapon state|item state|bonded weapon|signature weapon|legendary weapon|\banoint\b|\bimbue\b|scroll mastery|craft reserve|weapon enhancement|armor enhancement|acquire ship|shipbond/);
  add('special spell acquisition/preparation',/spellbook|spells? known|spell acquisition|advanced learning|learn(?:s|ed|ing)? (?:an? )?spell|prepar(?:e|ed|ation)|spell replacement|expanded spell list|spontaneous spells|spell research|draconic discovery/);
  add('persistent feature choices',/\bchoice\b|\bchoose\b|\bselect(?:ed|ion)?\b|school specialization|\border\b|\bpath\b/);
  add('ordinary prestige spellcasting/selected caster advancement',/spellcasting|caster advancement|existing (?:arcane |divine )?spellcasting|spells? per day|arcane progression|divine progression|spellcasting\/infusions/);
  if(!tags.length) tags.push('class actions/resources and feature reconciliation');
  return [...new Set(tags)];
}

const tracker=JSON.parse(fs.readFileSync(trackerPath,'utf8'));
const entries=tracker.entries||[];
const ids=new Set();
for(const entry of entries){
  if(ids.has(entry.sourceId))throw new Error('Duplicate sourceId: '+entry.sourceId);
  ids.add(entry.sourceId);
  if(entry.status!=='needs-review')continue;
  const expected=classify(entry);
  if(check){
    if(entry.implementationCohort!==expected[0]||JSON.stringify(entry.implementationCohorts||[])!==JSON.stringify(expected)){
      throw new Error('Cohort metadata drift for '+entry.sourceId+': expected '+JSON.stringify(expected)+' got '+JSON.stringify(entry.implementationCohorts||[]));
    }
  }else{
    entry.implementationCohorts=expected;
    entry.implementationCohort=expected[0];
  }
}
const counts=entries.filter(entry=>entry.status==='needs-review').reduce((acc,entry)=>{
  acc[entry.implementationCohort]=(acc[entry.implementationCohort]||0)+1;
  return acc;
},{});
if(entries.length!==1054)throw new Error('Expected 1054 tracker records; found '+entries.length);
if(entries.some(entry=>entry.status==='needs-review'&&(!entry.implementationCohort||!(entry.implementationCohorts||[]).length)))throw new Error('Every needs-review record must have implementation cohort metadata.');
if(write)fs.writeFileSync(trackerPath,JSON.stringify(tracker,null,2)+'\n');
console.log(JSON.stringify({total:entries.length,needsReview:entries.filter(entry=>entry.status==='needs-review').length,cohorts:Object.fromEntries(Object.entries(counts).sort((a,b)=>b[1]-a[1]))},null,2));
