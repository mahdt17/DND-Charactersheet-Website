import wave2 from '../data/class-reviewed-overrides-35-wave2.json' with {type:'json'};
import candidate75 from '../data/class-reviewed-overrides-35-candidates75.json' with {type:'json'};
import candidate75Ordinary2 from '../data/class-reviewed-overrides-35-candidates75-ordinary2.json' with {type:'json'};
import candidate75Ordinary3 from '../data/class-reviewed-overrides-35-candidates75-ordinary3.json' with {type:'json'};
import candidate75Ordinary4 from '../data/class-reviewed-overrides-35-candidates75-ordinary4.json' with {type:'json'};
import candidate75Ordinary5 from '../data/class-reviewed-overrides-35-candidates75-ordinary5.json' with {type:'json'};
import reviewedFeaturesWave2 from '../data/class-reviewed-features-35-wave2.json' with {type:'json'};
import reviewedFeaturesCandidate75 from '../data/class-reviewed-features-35-candidates75.json' with {type:'json'};
import reviewedFeaturesCandidate75Ordinary2 from '../data/class-reviewed-features-35-candidates75-ordinary2.json' with {type:'json'};
import reviewedFeaturesCandidate75Ordinary3 from '../data/class-reviewed-features-35-candidates75-ordinary3.json' with {type:'json'};
import reviewedFeaturesCandidate75Ordinary4 from '../data/class-reviewed-features-35-candidates75-ordinary4.json' with {type:'json'};
import reviewedFeaturesCandidate75Ordinary5 from '../data/class-reviewed-features-35-candidates75-ordinary5.json' with {type:'json'};

const waves=[wave2,candidate75,candidate75Ordinary2,candidate75Ordinary3,candidate75Ordinary4,candidate75Ordinary5];
const entries=Object.assign({},...waves.map(wave=>wave.entries||{}));
const reviewedFeatureEntries={...(reviewedFeaturesWave2.entries||{}),...(reviewedFeaturesCandidate75.entries||{}),...(reviewedFeaturesCandidate75Ordinary2.entries||{}),...(reviewedFeaturesCandidate75Ordinary3.entries||{}),...(reviewedFeaturesCandidate75Ordinary4.entries||{}),...(reviewedFeaturesCandidate75Ordinary5.entries||{})};
const waveFor=id=>waves.find(wave=>wave.entries?.[id])||null;
const norm=value=>String(value||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
const title=value=>String(value||'').replace(/\b\w/g,c=>c.toUpperCase());
const wordNumber={once:1,one:1,twice:2,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};

function progressionTables(row){
  const p=row?.progression;
  if(Array.isArray(p)&&p.length&&Array.isArray(p[0])&&!Array.isArray(p[0][0]))return [p];
  if(Array.isArray(row?.tables)&&row.tables.length)return row.tables;
  if(Array.isArray(row?.advancement)&&row.advancement.length){
    const keys=Object.keys(row.advancement[0]);
    return [[keys,...row.advancement.map(item=>keys.map(key=>item[key]??''))]];
  }
  return [];
}

function pureCastingAdvancement(value){
  const text=String(value||'').trim();
  if(!text)return false;
  const clauses=text.split(/\s*\/\s*|\s*;\s*/).map(item=>item.trim()).filter(Boolean);
  return clauses.length>0&&clauses.every(clause=>/^\+?\s*1\s+level\s+of\s+(?:an?\s+)?(?:existing\s+)?(?:(?:arcane|divine)\s+)?(?:spellcasting\s+class|existing\s+class)$/i.test(clause));
}

function normalizeSpecialCastingProgression(row){
  const source=row?.progression;
  if(!Array.isArray(source)||!source.length||!Array.isArray(source[0])||Array.isArray(source[0][0]))return null;
  const table=source.map(line=>Array.isArray(line)?[...line]:line);
  let headerIndex=-1,specialIndexes=[];
  for(let i=0;i<Math.min(5,table.length);i++){
    const header=table[i]||[];
    if(header.findIndex(value=>/^(?:class |racial )?level$/i.test(String(value).trim()))<0)continue;
    const indexes=header.map((value,index)=>/^(?:specials?|features?|class features?|abilities?)$/i.test(String(value).trim())?index:-1).filter(index=>index>=0);
    if(indexes.length){headerIndex=i;specialIndexes=indexes;break;}
  }
  if(headerIndex<0)return null;
  const hasMove=table.slice(headerIndex+1).some(line=>specialIndexes.some(index=>pureCastingAdvancement(line?.[index])));
  if(!hasMove)return null;
  const header=table[headerIndex];
  let castingIndex=header.findIndex(value=>/^(?:spellcasting|spells? per day(?:\/spells? known)?)$/i.test(String(value).trim()));
  if(castingIndex<0){castingIndex=header.length;header.push('Spellcasting');}
  for(const line of table.slice(headerIndex+1)){
    if(!Array.isArray(line))continue;
    while(line.length<header.length)line.push('');
    const moved=[];
    for(const index of specialIndexes){
      if(!pureCastingAdvancement(line[index]))continue;
      moved.push(String(line[index]).trim());
      line[index]='—';
    }
    if(!moved.length)continue;
    const existing=String(line[castingIndex]||'').trim();
    line[castingIndex]=[...(!existing||/^(?:—|–|-|none)$/i.test(existing)?[]:[existing]),...moved].join('/');
  }
  return table;
}

function splitFeatureCell(value,known=[]){
  const text=String(value||'').trim();
  if(!text||/^(?:—|–|-|none)$/i.test(text))return [];
  const exact=known.find(item=>[item.name,...(item.aliases||[])].some(name=>norm(name)===norm(text)));
  if(exact)return [{name:exact.name,progressionText:text}];
  return text.split(/\s*;\s*|\s*,\s*(?![^()]*\))/).map(chunk=>chunk.trim()).filter(Boolean).map(chunk=>{
    const name=chunk
      .replace(/\s+\d+\s*\/\s*(?:day|rest|encounter)\b.*$/i,'')
      .replace(/\s+\d+\s+times?\s+per\s+(?:day|rest|encounter)\b.*$/i,'')
      .replace(/\s+\+?\d+(?:d\d+)?(?:\s*\/\s*[^,;]+)?$/i,'')
      .replace(/\s+\+?\d+\s*(?:ft\.?|feet)\s*$/i,'')
      .replace(/\s+\d+\/—$/i,'')
      .trim();
    return {name:title(name||chunk),progressionText:chunk};
  });
}

function featureRows(row){
  const grants=[],known=reviewedFeatureEntries[row.id]||[];
  for(const table of progressionTables(row)){
    if(!Array.isArray(table)||!table.length)continue;
    let headerIndex=-1,levelIndex=-1,featureIndexes=[];
    for(let i=0;i<Math.min(5,table.length);i++){
      const header=table[i]||[];
      const candidate=header.findIndex(value=>/^(?:class |racial )?level$/i.test(String(value).trim()));
      if(candidate<0)continue;
      const indexes=header.map((value,index)=>/^(?:specials?|features?|class features?|abilities?)$/i.test(String(value).trim())?index:-1).filter(index=>index>=0);
      if(indexes.length){headerIndex=i;levelIndex=candidate;featureIndexes=indexes;break;}
    }
    if(headerIndex<0)continue;
    for(const data of table.slice(headerIndex+1)){
      const level=parseInt(data?.[levelIndex]);
      if(!Number.isFinite(level)||level<1||level>30)continue;
      for(const index of featureIndexes)for(const feature of splitFeatureCell(data?.[index],known))grants.push({level,...feature});
    }
  }
  return grants;
}

function sourceText(row){
  return String(row?.sourceDescription||row?.sourceText||row?.description||row?.effectSummary||row?.effect||'').trim();
}

function featureDescription(row,name){
  const source=sourceText(row);
  if(!source||!name)return '';
  const candidates=[name,String(name).replace(/\s*\([^)]*\)\s*$/,'')].filter(Boolean);
  for(const candidate of [...new Set(candidates)]){
    const escaped=candidate.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const heading=new RegExp('(?:^|\\n)\\s*(?:#{1,6}\\s*)?(?:\\*\\*)?'+escaped+'(?:\\s*\\([^\\n)]*\\))?(?:\\*\\*)?\\s*:?\\s*','i');
    const match=heading.exec(source);
    if(match){
      const rest=source.slice(match.index+match[0].length);
      const next=rest.search(/\n\s*(?:#{1,6}\s*)?(?:\*\*)?[A-Z][A-Za-z0-9 ’'()\/+—–-]{1,80}(?:\s*\([^\n)]*\))?(?:\*\*)?\s*:/);
      const value=(next>=0?rest.slice(0,next):rest).trim();
      if(value)return value;
    }
    const paragraph=source.split(/\n\s*\n/).find(part=>norm(part).includes(norm(candidate)));
    if(paragraph&&paragraph.length<=5000){
      const value=paragraph.replace(/^\s*(?:#{1,6}\s*)?(?:\*\*)?[^:]{1,100}(?:\*\*)?\s*:\s*/,'').trim();
      if(value)return value;
    }
  }
  return '';
}

function actionType(description){
  const text=String(description||'');
  const match=text.match(/\bas (?:an?|the)\s+(standard|move|free|swift|immediate|full[- ]round)\s+action\b/i)
    ||text.match(/\b(standard|move|free|swift|immediate|full[- ]round)\s+action\b/i);
  if(!match)return null;
  const label=match[1].toLowerCase().replace('full round','full-round');
  return label==='full-round'?'Full-round action':label.charAt(0).toUpperCase()+label.slice(1)+' action';
}

function fixedDailyUses(text){
  const raw=String(text||'');
  const fraction=raw.match(/\b(\d+)\s*\/\s*day\b/i);
  if(fraction)return Number(fraction[1]);
  const words=raw.match(/\b(once|twice|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:times?\s+)?per\s+day\b/i);
  return words?wordNumber[words[1].toLowerCase()]||null:null;
}

function grantMetadata(grant,description){
  const metadata={};
  const type=actionType(description);
  if(type)metadata.actionType=type;
  const uses=fixedDailyUses(grant.progressionText)||fixedDailyUses(description);
  if(Number.isFinite(uses)&&uses>0)metadata.resource={max:uses,period:'day'};
  return metadata;
}

function reviewedLevelGrants(row){
  const reviewed=reviewedFeatureEntries[row.id]||[];
  const grants=featureRows(row).map(grant=>{
    // Only explicit aliases or numeric progression suffixes may join names.
    // Semantic qualifiers such as Favored Enemy (Giant) remain part of identity.
    const key=norm(grant.name.replace(/\s*\([+-]?\d[^)]*\)\s*$/,''));
    const detail=reviewed.find(item=>[item.name,...(item.aliases||[])].some(name=>norm(name)===key));
    if(detail){
      const {aliases:ignoredAliases,...metadata}=detail;
      return {...grant,...metadata,preserveName:true,reviewedSourceUrl:entries[row.id].sourceUrl};
    }
    const description=featureDescription(row,grant.name);
    return {...grant,description,...grantMetadata(grant,description)};
  });
  for(const detail of reviewed){
    if(!Number.isInteger(detail.level)||detail.level<1||grants.some(grant=>norm(grant.name)===norm(detail.name)))continue;
    const {aliases:ignoredAliases,...metadata}=detail;
    grants.push({...metadata,preserveName:true,reviewedSourceUrl:entries[row.id].sourceUrl});
  }
  return grants.sort((a,b)=>a.level-b.level);
}

export function reviewedWave35Override(row){
  const spec=entries[row?.id],wave=waveFor(row?.id);
  if(!spec||!wave)return null;
  const sourceUrl=row.sourceUrl||row.url||null;
  const reviewDate=spec.reviewEvidence?.reviewDate||'2026-10-05';
  const normalizedProgression=normalizeSpecialCastingProgression(row);
  const reviewedRow=normalizedProgression?{...row,progression:normalizedProgression}:row;
  return {
    ...spec,
    ...(normalizedProgression?{progression:normalizedProgression}:{}),
    verified:true,
    reviewBatch:wave.reviewBatch,
    sourceBook:spec.sourceBook,
    sourceVersion:spec.sourceVersion||'D&D 3.5',
    prerequisiteReview:{verified:true,sourceUrl:spec.reviewEvidence?.requirementsUrl||sourceUrl,note:'Exact source entry gate recovered from the same-book/version requirements section.'},
    classSkillReview:{verified:true,sourceUrl:spec.reviewEvidence?.classSkillsUrl||sourceUrl,note:'Exact source class-skill table, excluding skill mentions in feature prose.'},
    proficiencyReview:{verified:true,sourceUrl,note:`Exact source record weapon/armor training statement reviewed in the ${reviewDate} action/resource wave.`},
    levelGrants:reviewedLevelGrants(reviewedRow)
  };
}
