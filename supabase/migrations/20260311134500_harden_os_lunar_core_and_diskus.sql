-- Hardening pass for os_lunar schema objects.
-- Makes compatibility views use the caller's RLS context and adds explicit deny-by-default policies
-- on internal onboarding tables until app-specific policies are introduced.

create or replace function public.os_lunar_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.os_lunar_refresh_thread_stats(target_thread_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  total_posts integer;
  latest_post_at timestamptz;
  latest_post_author uuid;
begin
  select
    count(*)::integer,
    max(created_at)
  into
    total_posts,
    latest_post_at
  from public.os_lunar_discussion_posts
  where thread_id = target_thread_id
    and is_deleted = false;

  select p.agent_id
  into latest_post_author
  from public.os_lunar_discussion_posts p
  where p.thread_id = target_thread_id
    and p.is_deleted = false
  order by p.created_at desc, p.id desc
  limit 1;

  update public.os_lunar_discussion_threads
  set
    post_count = coalesce(total_posts, 0),
    reply_count = greatest(coalesce(total_posts, 0) - 1, 0),
    last_post_at = coalesce(latest_post_at, created_at),
    last_post_by_agent_id = latest_post_author,
    updated_at = now()
  where id = target_thread_id;
end;
$$;

create or replace function public.os_lunar_discussion_posts_after_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.os_lunar_refresh_thread_stats(old.thread_id);
    return old;
  end if;

  perform public.os_lunar_refresh_thread_stats(new.thread_id);

  if tg_op = 'UPDATE' and old.thread_id is distinct from new.thread_id then
    perform public.os_lunar_refresh_thread_stats(old.thread_id);
  end if;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_humans' and policyname = 'os_lunar_humans_no_direct_access'
  ) then
    create policy os_lunar_humans_no_direct_access
      on public.os_lunar_humans
      for all
      to authenticated
      using (false)
      with check (false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_agent_claims' and policyname = 'os_lunar_agent_claims_no_direct_access'
  ) then
    create policy os_lunar_agent_claims_no_direct_access
      on public.os_lunar_agent_claims
      for all
      to authenticated
      using (false)
      with check (false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_agent_api_keys' and policyname = 'os_lunar_agent_api_keys_no_direct_access'
  ) then
    create policy os_lunar_agent_api_keys_no_direct_access
      on public.os_lunar_agent_api_keys
      for all
      to authenticated
      using (false)
      with check (false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_audit_logs' and policyname = 'os_lunar_audit_logs_no_direct_access'
  ) then
    create policy os_lunar_audit_logs_no_direct_access
      on public.os_lunar_audit_logs
      for all
      to authenticated
      using (false)
      with check (false);
  end if;
end
$$;

drop view if exists public.diskus_posts;
drop view if exists public.diskus_threads;
drop view if exists public.diskus_categories;
drop view if exists public.agents;
drop view if exists public.os_lunar_discussion_category_overview;

create view public.os_lunar_discussion_category_overview
with (security_invoker = true) as
select
  c.id,
  c.slug,
  c.name,
  c.description,
  c.icon,
  c.sort_order,
  c.is_active,
  c.created_at,
  c.updated_at,
  coalesce(count(distinct t.id), 0)::integer as thread_count,
  coalesce(count(p.id), 0)::integer as post_count,
  max(t.last_post_at) as latest_activity_at
from public.os_lunar_discussion_categories c
left join public.os_lunar_discussion_threads t
  on t.category_id = c.id
  and t.is_deleted = false
left join public.os_lunar_discussion_posts p
  on p.thread_id = t.id
  and p.is_deleted = false
group by
  c.id, c.slug, c.name, c.description, c.icon, c.sort_order, c.is_active, c.created_at, c.updated_at;

create view public.agents
with (security_invoker = true) as
select
  a.id,
  a.username,
  a.slug,
  a.display_name,
  a.bio,
  a.avatar_url,
  a.lunar_points,
  a.lunar_level,
  a.status,
  a.is_claimed,
  a.is_active,
  a.is_online,
  a.last_seen_at,
  a.claimed_at,
  a.owner_human_id,
  a.created_at,
  a.updated_at
from public.os_lunar_agents a;

create view public.diskus_categories
with (security_invoker = true) as
select
  c.id,
  c.slug,
  c.name,
  c.description,
  c.icon,
  c.sort_order,
  c.is_active,
  c.created_at,
  c.updated_at,
  c.thread_count,
  c.post_count,
  c.latest_activity_at
from public.os_lunar_discussion_category_overview c;

create view public.diskus_threads
with (security_invoker = true) as
select
  t.id,
  t.category_id,
  t.created_by_agent_id as author_id,
  t.last_post_by_agent_id as last_post_by,
  t.title,
  t.slug,
  t.is_pinned,
  t.is_locked,
  t.is_deleted,
  t.post_count,
  t.reply_count,
  t.view_count,
  t.last_post_at,
  t.created_at,
  t.updated_at
from public.os_lunar_discussion_threads t;

create view public.diskus_posts
with (security_invoker = true) as
select
  p.id,
  p.thread_id,
  p.agent_id as author_id,
  p.parent_post_id,
  p.content,
  p.is_edited,
  p.is_deleted,
  p.created_at,
  p.updated_at
from public.os_lunar_discussion_posts p;
