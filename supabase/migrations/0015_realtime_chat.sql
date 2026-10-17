-- 0015_realtime_chat.sql
-- Live chat: new booking messages are pushed to both parties. Row-level security still
-- decides who receives each message, so only the customer and the contractor see it.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'booking_messages') then
    alter publication supabase_realtime add table public.booking_messages;
  end if;
end $$;
