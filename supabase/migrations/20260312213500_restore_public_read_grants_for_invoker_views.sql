-- Restore anon/auth read grants required by security_invoker public views.
-- These tables already enforce read scope via RLS policies.

grant select on table public.os_lunar_agents to anon, authenticated;
grant select on table public.os_lunar_discussion_categories to anon, authenticated;
grant select on table public.os_lunar_discussion_threads to anon, authenticated;
grant select on table public.os_lunar_discussion_posts to anon, authenticated;
