create table if not exists public.os_lunar_vercel_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_hash text not null unique,
  schema text not null,
  data_source_name text,
  event_type text not null check (event_type in ('pageview', 'event')),
  event_name text,
  occurred_at timestamptz not null,
  project_id text,
  owner_id text,
  vercel_environment text,
  session_id text,
  device_id text,
  origin text,
  path text,
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists os_lunar_vercel_analytics_events_occurred_at_idx
  on public.os_lunar_vercel_analytics_events (occurred_at desc);

create index if not exists os_lunar_vercel_analytics_events_environment_idx
  on public.os_lunar_vercel_analytics_events (vercel_environment, occurred_at desc);

create index if not exists os_lunar_vercel_analytics_events_path_idx
  on public.os_lunar_vercel_analytics_events (path);

create index if not exists os_lunar_vercel_analytics_events_device_idx
  on public.os_lunar_vercel_analytics_events (device_id);

alter table public.os_lunar_vercel_analytics_events enable row level security;

revoke all on public.os_lunar_vercel_analytics_events from public;
revoke all on public.os_lunar_vercel_analytics_events from anon;
revoke all on public.os_lunar_vercel_analytics_events from authenticated;

comment on table public.os_lunar_vercel_analytics_events is
  'Raw Vercel Web Analytics drain events used for the public human traffic widget.';

create or replace function public.os_lunar_public_site_stats()
returns table (
  visitors bigint,
  page_views bigint,
  last_event_at timestamptz,
  has_data boolean
)
language sql
security definer
set search_path = public
as $$
  with filtered as (
    select event_hash, occurred_at, device_id, session_id
    from public.os_lunar_vercel_analytics_events
    where event_type = 'pageview'
      and coalesce(vercel_environment, 'production') = 'production'
  ),
  totals as (
    select
      count(*)::bigint as page_views,
      count(
        distinct case
          when nullif(device_id, '') is not null then device_id
          when nullif(session_id, '') is not null then concat('session:', session_id)
          else event_hash
        end
      )::bigint as visitors,
      max(occurred_at) as last_event_at
    from filtered
  )
  select
    coalesce(totals.visitors, 0) as visitors,
    coalesce(totals.page_views, 0) as page_views,
    totals.last_event_at,
    exists (
      select 1
      from public.os_lunar_vercel_analytics_events
      where event_type = 'pageview'
        and coalesce(vercel_environment, 'production') = 'production'
    ) as has_data
  from totals;
$$;

revoke all on function public.os_lunar_public_site_stats() from public;
grant execute on function public.os_lunar_public_site_stats() to anon;
grant execute on function public.os_lunar_public_site_stats() to authenticated;
grant execute on function public.os_lunar_public_site_stats() to service_role;

comment on function public.os_lunar_public_site_stats() is
  'Public aggregate of all-time Vercel traffic for the human UI. Counts production pageviews and unique device/session identifiers since start.';

insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.35',
  'Publik trafikruta med Vercel Analytics',
  E'✅ Sajten kan nu visa en publik besöksräknare från Vercel Analytics, även för utloggade besökare\n✅ Räknaren visar total trafik sedan start i stället för bara senaste dygnet\n✅ Trafiken läses via en säker Vercel-drain till Supabase och visas i högerspalten',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog where version = 'v0.1.35'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.35',
  'Added Vercel Analytics drain ingestion and public traffic summary',
  E'✅ Added os_lunar_vercel_analytics_events for raw Vercel drain payloads\n✅ Added os_lunar_public_site_stats() plus public site-stats/drain edge functions\n✅ Public UI now reads all-time production visitor/pageview totals without requiring login',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog_admin where version = 'v0.1.35'
);
