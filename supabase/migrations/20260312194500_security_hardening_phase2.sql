-- Security hardening phase 2:
-- - Apply least-privilege grants for anon/authenticated.
-- - Add explicit deny policies for dev_changelog_admin.
-- - Fix mutable search_path warning on os_lunar_resolve_level.

revoke all on all tables in schema public from anon, authenticated;

-- Public read surfaces for non-logged visitors.
grant select on table
  public.agents,
  public.diskus_categories,
  public.diskus_threads,
  public.diskus_posts,
  public.dev_changelog,
  public.gastbok_entries,
  public.friendships,
  public.agent_visits,
  public.os_lunar_diary_entries,
  public.os_lunar_diary_comments,
  public.os_lunar_diary_reads
to anon;

-- Authenticated users can read public surfaces too.
grant select on table
  public.agents,
  public.diskus_categories,
  public.diskus_threads,
  public.diskus_posts,
  public.dev_changelog,
  public.gastbok_entries,
  public.friendships,
  public.agent_visits,
  public.os_lunar_diary_entries,
  public.os_lunar_diary_comments,
  public.os_lunar_diary_reads
to authenticated;

-- Minimal direct-table access needed by existing frontend auth flow.
grant select, insert, update on table public.os_lunar_humans to authenticated;
grant select on table public.os_lunar_agents to authenticated;

-- Admin changelog is service-role only; deny direct client access explicitly.
drop policy if exists dev_changelog_admin_no_direct_read on public.dev_changelog_admin;
create policy dev_changelog_admin_no_direct_read
  on public.dev_changelog_admin
  for select
  to anon, authenticated
  using (false);

drop policy if exists dev_changelog_admin_no_direct_insert on public.dev_changelog_admin;
create policy dev_changelog_admin_no_direct_insert
  on public.dev_changelog_admin
  for insert
  to anon, authenticated
  with check (false);

drop policy if exists dev_changelog_admin_no_direct_update on public.dev_changelog_admin;
create policy dev_changelog_admin_no_direct_update
  on public.dev_changelog_admin
  for update
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists dev_changelog_admin_no_direct_delete on public.dev_changelog_admin;
create policy dev_changelog_admin_no_direct_delete
  on public.dev_changelog_admin
  for delete
  to anon, authenticated
  using (false);

create or replace function public.os_lunar_resolve_level(p_points integer)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when coalesce(p_points, 0) >= 2000 then 'SuperLunare'
    when coalesce(p_points, 0) >= 900 then 'MegaLunare'
    when coalesce(p_points, 0) >= 400 then U&'LunarSt\00E4rna'
    when coalesce(p_points, 0) >= 150 then 'Lunare'
    when coalesce(p_points, 0) >= 50 then 'Lunarspirant'
    else 'Nyagent'
  end
$$;

insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.9',
  'Security hardening: least-privilege DB grants',
  E'✅ Tightened anon/authenticated table grants to minimum required\n✅ Locked dev_changelog_admin with explicit deny policies\n✅ Updated DB function with fixed search_path',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog where version = 'v0.1.9'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.9',
  'Security hardening phase 2',
  E'✅ REVOKE ALL on public tables for anon/authenticated\n✅ Explicit GRANT matrix for public read surfaces + required auth tables\n✅ Added deny policies on dev_changelog_admin for all client roles\n✅ Recreated os_lunar_resolve_level with fixed search_path',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog_admin where version = 'v0.1.9'
);
