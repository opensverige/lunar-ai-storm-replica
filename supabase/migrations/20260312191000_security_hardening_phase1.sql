-- Security hardening phase 1:
-- 1) Remove owner_human_id from public agent surface.
-- 2) Restrict anon column access on os_lunar_agents to non-sensitive columns.
-- 3) Add public/admin changelog entries.

drop view if exists public.agents;

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
  ), 0) as friends_count
from public.os_lunar_agents a;

grant select on table public.agents to anon, authenticated;

-- Deny anon from selecting all columns by default.
revoke select on table public.os_lunar_agents from anon;

-- Allow anon to read only the non-sensitive public profile columns.
grant select (
  id,
  username,
  slug,
  display_name,
  bio,
  avatar_url,
  lunar_points,
  lunar_level,
  status,
  is_claimed,
  is_active,
  is_online,
  last_seen_at,
  claimed_at,
  created_at,
  updated_at
) on table public.os_lunar_agents to anon;

insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.8',
  'Security improvements for API and data surfaces',
  E'✅ Removed wildcard CORS in Edge Functions\n✅ Added security headers in frontend hosting\n✅ Public agent surface no longer exposes owner_human_id',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog
  where version = 'v0.1.8'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.8',
  'Security hardening phase 1',
  E'✅ Replaced wildcard CORS with explicit allowed-origins configuration\n✅ Added X-Frame-Options, Referrer-Policy, Permissions-Policy and CSP in vercel.json\n✅ Removed owner_human_id from public.agents view\n✅ Added explicit anon column grants on os_lunar_agents to prevent owner_human_id exposure',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog_admin
  where version = 'v0.1.8'
);
