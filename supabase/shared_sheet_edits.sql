alter table ledger_private.sheet_rewards drop constraint sheet_rewards_field_check,
  add constraint sheet_rewards_field_check check (field in ('inventory','feats','notes','remove_quantity'));

create function ledger_private.stack_position(items jsonb, target jsonb)
returns integer language sql immutable set search_path='' as $$
  select ord::integer-1 from jsonb_array_elements(items) with ordinality e(item,ord)
  where case when target->>'id' is not null then item->>'id'=target->>'id'
             else item-'qty'=target-'qty' end
  order by (item=target) desc,ord limit 1
$$;

create function ledger_private.replay_sheet_edit(sheet jsonb, field text, adding boolean, entry jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare items jsonb; pos integer; left_count integer;
begin
  if field='notes' then
    if coalesce(sheet->>'notes','') not in (entry->>'before',entry->>'after') then
      raise exception 'The journal changed on another screen. Copy your draft, reload the sheet, and review the latest notes before saving.';
    end if;
    return jsonb_set(sheet,'{notes}',entry->'after');
  elsif field='remove_quantity' then
    items:=sheet->'inventory';
    pos:=ledger_private.stack_position(items,entry->'item');
    if pos is null then return sheet; end if;
    left_count:=coalesce((items->pos->>'qty')::integer,1)-(entry->>'amount')::integer;
    if left_count<=0 then items:=items-pos;
    else items:=jsonb_set(items,array[pos::text,'qty'],to_jsonb(left_count)); end if;
    return jsonb_set(sheet,'{inventory}',items);
  end if;
  return ledger_private.apply_sheet_reward(sheet,field,adding,entry);
end $$;

create or replace function ledger_private.preserve_rewards() returns trigger language plpgsql security definer set search_path='' as $$
declare change ledger_private.sheet_rewards; seen bigint; latest bigint; restored_notes boolean:=false;
begin
  if not (old.data ? 'campaignRewardVersion') then return new; end if;
  seen := case when new.data->>'campaignRewardVersion' ~ '^[0-9]{1,16}$' then (new.data->>'campaignRewardVersion')::bigint else 0 end;
  for change in select * from ledger_private.sheet_rewards where owner_id=old.user_id and sheet_id=old.id
    and version>seen order by version loop
    if change.field='notes' then
      if not restored_notes then
        if coalesce(new.data->>'notes','') not in (change.entry->>'before',coalesce(old.data->>'notes','')) then
          raise exception 'The journal changed on another screen. Copy your draft, reload the sheet, and review the latest notes before saving.';
        end if;
        new.data:=jsonb_set(new.data,'{notes}',to_jsonb(coalesce(old.data->>'notes','')));
        restored_notes:=true;
      end if;
    else
      new.data:=ledger_private.replay_sheet_edit(new.data,change.field,change.adding,change.entry);
    end if;
  end loop;
  select max(version) into latest from ledger_private.sheet_rewards where owner_id=old.user_id and sheet_id=old.id;
  if latest is not null then new.data:=jsonb_set(new.data,'{campaignRewardVersion}',to_jsonb(latest)); end if;
  return new;
end $$;

create function public.ledger_edit_shared_sheet(p_campaign uuid,p_owner uuid,p_sheet text,p_edit text,p_value jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare sheet jsonb; revision bigint; change jsonb; item jsonb; pos integer; available integer; amount integer;
begin
  perform 1 from public.ledger_campaign_sheets where campaign_id=p_campaign and dm_id=auth.uid()
    and user_id=p_owner and character_id=p_sheet for share;
  if not found then raise exception 'Only the current campaign DM can edit this shared sheet'; end if;
  select data into strict sheet from public.characters where user_id=p_owner and id=p_sheet for update;
  if p_edit='notes' then
    if jsonb_typeof(p_value->'before') is distinct from 'string' or jsonb_typeof(p_value->'after') is distinct from 'string'
      then raise exception 'Journal text required'; end if;
    if coalesce(sheet->>'notes','')=p_value->>'after' then return; end if;
    if coalesce(sheet->>'notes','')<>p_value->>'before' then
      raise exception 'The player or another DM window saved new notes. Review the latest notes before saving.';
    end if;
    change:=jsonb_build_object('before',p_value->>'before','after',p_value->>'after');
  elsif p_edit='remove_quantity' then
    pos:=ledger_private.stack_position(sheet->'inventory',p_value->'item');
    if pos is null then raise exception 'This item is no longer carried'; end if;
    item:=sheet->'inventory'->pos;
    available:=coalesce((item->>'qty')::integer,1);
    if available is distinct from coalesce((p_value->'item'->>'qty')::integer,1) then raise exception 'The stack quantity changed. Review the new quantity.'; end if;
    amount:=(p_value->>'amount')::integer;
    if amount is null or amount>available or amount<(case when available=0 then 0 else 1 end) then raise exception 'Choose a quantity within the stack'; end if;
    change:=jsonb_build_object('item',item,'amount',amount);
  else raise exception 'Unknown shared sheet edit';
  end if;
  select coalesce(max(version),0)+1 into revision from ledger_private.sheet_rewards where owner_id=p_owner and sheet_id=p_sheet;
  insert into ledger_private.sheet_rewards values(p_owner,p_sheet,revision,p_edit,false,change);
  update public.characters set data=jsonb_set(ledger_private.replay_sheet_edit(sheet,p_edit,false,change),'{campaignRewardVersion}',to_jsonb(revision))
    where user_id=p_owner and id=p_sheet;
end $$;
revoke all on function ledger_private.stack_position(jsonb,jsonb),ledger_private.replay_sheet_edit(jsonb,text,boolean,jsonb) from public,anon,authenticated;
revoke all on function public.ledger_edit_shared_sheet(uuid,uuid,text,text,jsonb) from public,anon;
grant execute on function public.ledger_edit_shared_sheet(uuid,uuid,text,text,jsonb) to authenticated;
