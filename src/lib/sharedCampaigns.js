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
    async rewardUpdate(character) {
      return result(client.from('characters').select('inventory:data->inventory,feats:data->feats,suppressed:data->campaignRemovedFeatIds,version:data->campaignRewardVersion')
        .eq('user_id',userId).eq('id',character.id).neq('data->>campaignRewardVersion',String(character.campaignRewardVersion||0)).maybeSingle());
    },
    async membership(characterId) {
      const row=await result(sheets().select('campaign_id').eq('user_id',userId).eq('character_id',characterId).maybeSingle());
      return row?.campaign_id||'';
    },
    encounter(id) { return result(client.rpc('ledger_combat_state',{p_campaign:id})); },
    combat(id,encounter,action,payload={}) {
      return result(client.rpc('ledger_combat_command',{p_campaign:id,p_encounter:encounter,p_action:action,p_payload:payload}));
    },
    subscribe(id,refresh) {
      const channel=client.channel('dm-campaign-'+id+'-'+crypto.randomUUID())
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:'ledger_campaigns',filter:'id=eq.'+id},refresh)
        .subscribe(state=>{if(state==='SUBSCRIBED')refresh();});
      return ()=>{void client.removeChannel(channel);};
    },
  };
}

// Coalesce notifications during a fetch. Ignore any result that arrives after leaving the view.
export function watchRoster(api,id,onRows,onError,read=api.roster) {
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
  const unsubscribe=id?api.subscribe(id,refresh):()=>{};
  const focus=()=>{if(!document.hidden)void refresh();};
  const timer=setInterval(focus,10000);
  window.addEventListener('focus',focus);
  document.addEventListener('visibilitychange',focus);
  void refresh();
  return ()=>{stopped=true;clearInterval(timer);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus);unsubscribe();};
}

