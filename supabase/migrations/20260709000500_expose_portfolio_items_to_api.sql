grant usage on schema public to anon, authenticated;
grant select on public.portfolio_items to anon, authenticated;
grant insert, update, delete on public.portfolio_items to authenticated;

notify pgrst, 'reload schema';
