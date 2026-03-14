create table if not exists public.os_lunar_vercel_analytics_baseline (
  id boolean primary key default true,
  visitors_offset bigint not null default 0 check (visitors_offset >= 0),
  page_views_offset bigint not null default 0 check (page_views_offset >= 0),
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.os_lunar_vercel_analytics_baseline enable row level security;

revoke all on public.os_lunar_vercel_analytics_baseline from public;
revoke all on public.os_lunar_vercel_analytics_baseline from anon;
revoke all on public.os_lunar_vercel_analytics_baseline from authenticated;

comment on table public.os_lunar_vercel_analytics_baseline is
  'Manual baseline offsets used to align the public traffic counter with historical Vercel dashboard totals.';

insert into public.os_lunar_vercel_analytics_baseline (
  id,
  visitors_offset,
  page_views_offset,
  notes,
  updated_at
)
values (
  true,
  117,
  909,
  'Backfill offset from Vercel dashboard on 2026-03-14: 118 visitors and 915 page views, minus 1 visitor and 6 page views already drained.',
  now()
)
on conflict (id) do update
set
  visitors_offset = excluded.visitors_offset,
  page_views_offset = excluded.page_views_offset,
  notes = excluded.notes,
  updated_at = excluded.updated_at;

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
  ),
  baseline as (
    select
      coalesce(visitors_offset, 0)::bigint as visitors_offset,
      coalesce(page_views_offset, 0)::bigint as page_views_offset
    from public.os_lunar_vercel_analytics_baseline
    where id = true
  )
  select
    coalesce(totals.visitors, 0) + coalesce((select visitors_offset from baseline), 0) as visitors,
    coalesce(totals.page_views, 0) + coalesce((select page_views_offset from baseline), 0) as page_views,
    totals.last_event_at,
    (
      exists (
        select 1
        from public.os_lunar_vercel_analytics_events
        where event_type = 'pageview'
          and coalesce(vercel_environment, 'production') = 'production'
      )
      or exists (
        select 1
        from public.os_lunar_vercel_analytics_baseline
        where id = true
          and (visitors_offset > 0 or page_views_offset > 0)
      )
    ) as has_data
  from totals;
$$;

insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.36',
  'Besöksräknaren fick historisk backfill',
  E'✅ Trafikräknaren kan nu starta från befintliga Vercel-siffror i stället för från noll\n✅ Baseline-offset lagras i databasen och nya drain-händelser läggs ovanpå den\n✅ Publik räknare ligger nu närmare Vercel Analytics dashboard direkt efter aktivering',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog where version = 'v0.1.36'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.36',
  'Added baseline offsets for Vercel traffic counter backfill',
  E'✅ Added os_lunar_vercel_analytics_baseline table\n✅ Seeded baseline to 117 visitors and 909 page views from dashboard minus drained rows\n✅ os_lunar_public_site_stats() now returns baseline + live drain totals',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog_admin where version = 'v0.1.36'
);
