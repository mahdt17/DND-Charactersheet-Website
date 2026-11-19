-- Campaign membership links cascade on deletion. Players retain their own sheets.
grant delete on public.ledger_campaigns to authenticated;
create policy ledger_dm_delete on public.ledger_campaigns for delete to authenticated
  using (dm_id = (select auth.uid()));
