import {sheetWithInstituteAccess} from './instituteAccess.js';

const fields='id,name';
export const invitePattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function result(query) {
  const {data,error}=await query;
  if(error)throw Error(error.message);
  return data;
}

export function campaignService(client,userId) {
  const campaigns=()=>client.from('ledger_campaigns');
  const sheets=()=>client.from('ledger_campaign_sheets');
  const channels=new Map();
  const encounterReads=new Map();
  return {
    userId,
    async list() {
      const [hosted,assigned]=await Promise.all([
        result(campaigns().select(fields).eq('dm_id',userId).order('name')),
        result(sheets().select('campaign_id,character_id,campaign:ledger_campaigns(name)').eq('user_id',userId)),
      ]);
      return {hosted,assigned};
    },
    start(name) {
      return result(campaigns().insert({name:name.trim()}).select(fields).single());
    },
    removeCampaign(id) {
      return result(campaigns().delete().eq('id',id).eq('dm_id',userId).select('id').single());
    },
    assign(code,characterId) {
      return result(sheets().insert({campaign_id:code.trim(),character_id:characterId}));
    },
    leave(campaignId,ownerId,characterId) {
      return result(sheets().delete().eq('campaign_id',campaignId).eq('user_id',ownerId).eq('character_id',characterId));
    },
    roster(id) {
      return result(sheets().select('user_id,character_id,sheet:characters!inner(name,race,class_name,level,updated_at)').eq('campaign_id',id));
    },
    async sheet(id,member) {
      const row=await result(sheets().select('sheet:characters!inner(data,institute_access,updated_at)').eq('campaign_id',id)
        .eq('user_id',member.user_id).eq('character_id',member.character_id).maybeSingle());
      if(!row?.sheet)return null;
      return {updated_at:row.sheet.updated_at,data:sheetWithInstituteAccess(row.sheet)};
    },
    reward(campaign,member,field,adding,entry) {
      return result(client.rpc('ledger_change_reward',{p_campaign:campaign,p_owner:member.user_id,p_sheet:member.character_id,p_field:field,p_add:adding,p_entry:entry}));
    },
    editSheet(campaign,member,edit,value) {
      return result(client.rpc('ledger_edit_shared_sheet',{p_campaign:campaign,p_owner:member.user_id,p_sheet:member.character_id,p_edit:edit,p_value:value}));
    },
    async rewardUpdate(character) {
      return result(client.from('characters').select('data,institute_access')
        .eq('user_id',userId).eq('id',character.id).or('data->>campaignRewardVersion.neq.'+(Number(character.campaignRewardVersion)||0)+',live_timer_version.gt.'+(Number(character.combatClockVersion)||0)).maybeSingle());
    },
    async membership(characterId) {
      const row=await result(sheets().select('campaign_id').eq('user_id',userId).eq('character_id',characterId).maybeSingle());
      return row?.campaign_id||'';
    },
    mapCatalog(id) { return result(client.rpc('ledger_map_catalog',{p_campaign:id})); },
    mapFloor(id,floor) { return result(client.rpc('ledger_map_floor',{p_campaign:id,p_floor:floor})); },
    prepareMap(campaign,operation,id,parent,value) {
      return result(client.rpc('ledger_prepare_map',{p_campaign:campaign,p_operation:operation,p_id:id,p_parent:parent,p_value:value}));
    },
    endedEncounters(id) { return result(client.rpc('ledger_ended_encounters',{p_campaign:id})); },
    downloadEncounter(id,encounter) { return result(client.rpc('ledger_download_encounter',{p_campaign:id,p_encounter:encounter})); },
    adjustEffect(campaign,member,effect,seconds) {
      return result(client.rpc('ledger_adjust_effect',{p_campaign:campaign,p_owner:member.user_id,p_sheet:member.character_id,p_key:effect.timerInstance||effect.id,p_before:effect.remainingSeconds??null,p_seconds:seconds}));
    },
    advanceTurn(campaign,encounter,serial) { return result(client.rpc('ledger_advance_turn',{p_campaign:campaign,p_encounter:encounter,p_serial:serial})); },
    encounter(id) {
      if(!encounterReads.has(id)){
        const read=result(client.rpc('ledger_combat_state',{p_campaign:id})).finally(()=>encounterReads.delete(id));
        encounterReads.set(id,read);
      }
      return encounterReads.get(id);
    },
    combat(id,encounter,action,payload={}) {
      return result(client.rpc('ledger_combat_command',{p_campaign:id,p_encounter:encounter,p_action:action,p_payload:payload}));
    },
    subscribe(id,refresh) {
      let entry=channels.get(id);
      if(entry){
        entry.listeners.add(refresh);
      }else{
        const listeners=new Set([refresh]);
        const channel=client.channel('dm-campaign-'+id+'-'+crypto.randomUUID());
        entry={listeners,channel};
        channels.set(id,entry);
        let lastRevision,reading=false;
        function notify(){for(const watcher of listeners)watcher();}
        function observe(revision){
          if(lastRevision===revision)return;
          lastRevision=revision;notify();
        }
        // A connected socket can miss a change. Compare one small revision for all
        // views, then fetch their content only when the campaign actually changes.
        async function checkRevision(){
          if(document.hidden||reading)return;
          reading=true;
          const before=lastRevision;
          try{
            const row=await result(campaigns().select('revision').eq('id',id).maybeSingle());
            if(lastRevision===before)observe(row?.revision??null);
          }catch{notify();}finally{reading=false;}
        }
        entry.timer=setInterval(checkRevision,10000);
        channel.on('postgres_changes',{event:'UPDATE',schema:'public',table:'ledger_campaigns',filter:'id=eq.'+id},event=>{
          if(event.new?.revision!=null)observe(event.new.revision);else notify();
        }).subscribe(state=>{if(state==='SUBSCRIBED')notify();});
      }
      return ()=>{
        entry.listeners.delete(refresh);
        if(!entry.listeners.size&&channels.get(id)===entry){
          channels.delete(id);clearInterval(entry.timer);void client.removeChannel(entry.channel);
        }
      };
    },
  };
}

// Coalesce notifications during a fetch. Ignore any result that arrives after leaving the view.
export function watchRoster(api,id,onRows,onError,read=api.roster,{refreshOnTurn=false}={}) {
  let stopped=false,running=false,again=false;
  async function refresh() {
    if(stopped)return;
    if(running){again=true;return;}
    running=true;
    do {
      again=false;
      try{const rows=await read(id);if(!stopped)onRows(rows);}
      catch(e){if(!stopped)onError(e.message);}
    }while(again&&!stopped);
    running=false;
  }
  const focus=()=>{if(!document.hidden)void refresh();};
  const interval=id?null:setInterval(focus,10000);
  const unsubscribe=id?api.subscribe(id,focus):()=>{};
  if(refreshOnTurn)window.addEventListener('ledger-turn-advanced',focus);
  window.addEventListener('focus',focus);
  document.addEventListener('visibilitychange',focus);
  void refresh();
  return ()=>{stopped=true;clearInterval(interval);window.removeEventListener('ledger-turn-advanced',focus);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus);unsubscribe();};
}

