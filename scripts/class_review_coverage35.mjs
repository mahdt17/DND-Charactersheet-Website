const list=value=>Array.isArray(value)?value:[];
const text=value=>typeof value==='string'&&value.trim().length>0;
const sorted=values=>[...new Set(values)].sort();

// Presence of reviewed evidence is deliberately weaker than complete coverage.
// Only the caller's exact source ID may supply runtime evidence.
export function resolveClassReviewCoverage35({sourceId,record=null,featureSummaries={},trainingSupplements={}}={}){
  const exact=record?.sourceId===sourceId?record:null;
  const featureEvidence=[];
  if(list(featureSummaries[sourceId]).length)featureEvidence.push({kind:'reviewed-summary',sourceId,path:'src/data/class-feature-summaries-35.json'});
  for(const grant of list(exact?.levelGrants)){
    if(text(grant?.reviewedSourceUrl))featureEvidence.push({kind:'reviewed-runtime-grant',sourceId,name:grant.name||null,sourceUrl:grant.reviewedSourceUrl});
  }
  const trainingEvidence=[];
  const supplement=trainingSupplements[sourceId];
  if(supplement?.verified===true)trainingEvidence.push({kind:'reviewed-training-supplement',sourceId,path:'src/data/class-proficiencies35.json',sourceUrl:supplement.sourceUrl||null});
  if(exact?.proficiencyReview?.verified===true)trainingEvidence.push({kind:'reviewed-runtime-training',sourceId,sourceUrl:exact.proficiencyReview.sourceUrl||null});
  return {
    scope:'Reviewed evidence presence only; does not establish complete feature coverage or satisfy certification axes.',
    features:{hasReviewedEvidence:featureEvidence.length>0,complete:false,evidence:featureEvidence},
    training:{hasReviewedEvidence:trainingEvidence.length>0,evidence:trainingEvidence}
  };
}

// Text labels organize existing blockers for planning. They never resolve a blocker.
const blockerPatterns=[
  ['source-integrity',/source-conflict|failed-extraction|unresolved-source|exact.{0,50}(?:incomplete|not expose)|independently verifiable|unsupported inference/i],
  ['psionics',/psionic|manifest(?:ing|er)|power.points|powers.known|mind.blade/i],
  ['binding',/vestige|soul.binding|pact.augmentation|binding.subsystem/i],
  ['incarnum',/incarnum|soulmeld|essentia|chakra/i],
  ['maneuvers',/\bmaneuvers?\b|\bstances?\b|\binitiator\b/i],
  ['invocations',/invocation|eldritch.blast/i],
  ['casting',/spellcasting|caster.advancement|spells.per.day|spell.acquisition|spellbook|spells.known/i],
  ['companions',/\bcompanions?\b|\bfamiliars?\b|\bmounts?\b|\bcohorts?\b|\bfollowers?\b/i],
  ['choices',/choice|select(?:ion|able)|choose|checkbox/i],
  ['actions-resources',/\bactions?\b|\bresources?\b|\bdaily\b|uses.per.day/i],
  ['transformations',/wild.shape|alternate.form|transformation/i],
  ['training',/proficienc|training|class.skill/i],
  ['prerequisites',/prerequisite|entry.(?:gate|rule|requirement)|eligibility/i]
];

export function buildClassReviewClusters35(entries=[],{trackerEntries=[]}={}){
  const trackerById=new Map(trackerEntries.map(entry=>[entry.sourceId,entry]));
  const cohorts=new Map(),diagnostics=new Map(),missingEvidence=new Map(),blockers=new Map();
  const ids=new Set();
  const add=(groups,key,id)=>{
    if(!text(key))return;
    if(!groups.has(key))groups.set(key,new Set());
    groups.get(key).add(id);
  };
  for(const entry of entries){
    const id=entry.sourceId||entry.recordId;
    if(!text(id))continue;
    ids.add(id);
    const tracker=trackerById.get(id)||entry;
    for(const tag of list(tracker.implementationCohorts))add(cohorts,tag,id);
    // Free-text blockers and evidence axes have their own groups, rather than
    // being duplicated into the diagnostic-code index.
    for(const reason of list(entry.reasons))if(!list(entry.blockers).includes(reason)&&!String(reason).startsWith('missing-certification-evidence:'))add(diagnostics,reason,id);
    for(const axis of list(entry.missingEvidence))add(missingEvidence,axis,id);
    for(const original of list(entry.blockers)){
      if(!text(original))continue;
      const matches=blockerPatterns.filter(([,pattern])=>pattern.test(original)).map(([key])=>key);
      for(const key of matches.length?matches:['unmapped']){
        if(!blockers.has(key))blockers.set(key,{ids:new Set(),texts:new Map()});
        const group=blockers.get(key);
        group.ids.add(id);
        add(group.texts,original,id);
      }
    }
  }
  const serialize=groups=>[...groups].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,sourceIds])=>({key,count:sourceIds.size,sourceIds:sorted(sourceIds)}));
  return {
    uniqueRecordCount:ids.size,
    semantics:{
      counts:'Unique exact source IDs per group; groups overlap and must not be summed as a total.',
      cohorts:'Stored planning estimates, not verified subsystem deficits or guaranteed class unblocks.',
      blockers:'Heuristic planning labels retain original unresolved blockers; unmatched text remains in unmapped. No label resolves a blocker or certifies a class.'
    },
    cohorts:serialize(cohorts),diagnostics:serialize(diagnostics),missingEvidence:serialize(missingEvidence),
    blockers:[...blockers].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,group])=>({key,count:group.ids.size,sourceIds:sorted(group.ids),blockers:serialize(group.texts).map(({key:text,...rest})=>({text,...rest}))}))
  };
}
