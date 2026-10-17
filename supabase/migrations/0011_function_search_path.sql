-- 0011_function_search_path.sql
-- Pin the search_path on functions the Supabase security advisor flagged as mutable
-- (lint 0011_function_search_path_mutable). Behaviour is unchanged.

alter function public.ledger_append_only()   set search_path = public;
alter function public.set_updated_at()       set search_path = public;
alter function public.protect_final_report() set search_path = public;
alter function public.guard_review_update()  set search_path = public;
alter function public.export_my_data()       set search_path = public;
