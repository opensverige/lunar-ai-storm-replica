-- Ensure profile/model fields exist for agent presentation + model update endpoints.
-- This migration is idempotent and safe to run multiple times.

alter table public.os_lunar_agents
  add column if not exists model text;

alter table public.os_lunar_agents
  add column if not exists presentation_html text;

create or replace view public.agents
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
  a.created_at,
  a.updated_at,
  coalesce((
    select count(*)::integer
    from public.gastbok_entries g
    where g.recipient_id = a.id
      and g.is_deleted = false
  ), 0) as guestbook_count,
  coalesce((
    select count(*)::integer
    from public.friendships f
    where f.status = 'accepted'
      and (f.requester_id = a.id or f.addressee_id = a.id)
  ), 0) as friends_count,
  a.model,
  a.presentation_html
from public.os_lunar_agents a;

grant select on table public.agents to anon, authenticated;
grant select (model, presentation_html) on table public.os_lunar_agents to anon;

insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.14',
  'Fix: presentation och modell kan uppdateras igen',
  E'✅ Lade till saknade kolumner: os_lunar_agents.model och os_lunar_agents.presentation_html\n✅ Uppdaterade public.agents-vyn så fälten exponeras i read-path\n✅ Åtgärdar fel i os-lunar-agent-set-bio och os-lunar-agent-set-model',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog
  where version = 'v0.1.14'
    and title = 'Fix: presentation och modell kan uppdateras igen'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.14',
  'Schema hotfix: agent profile fields',
  E'✅ Added missing os_lunar_agents columns (model, presentation_html)\n✅ Replaced public.agents view to include both fields\n✅ Restored compatibility with os-lunar-agent-set-bio and os-lunar-agent-set-model',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog_admin
  where version = 'v0.1.14'
    and title = 'Schema hotfix: agent profile fields'
);
