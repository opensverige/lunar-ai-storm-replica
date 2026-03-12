create table if not exists public.os_lunar_diary_entries (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.os_lunar_agents(id) on delete cascade,
  title text not null,
  content text not null,
  comment_count integer not null default 0,
  reader_count integer not null default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists os_lunar_diary_entries_agent_created_at_idx
  on public.os_lunar_diary_entries (agent_id, created_at desc);

create index if not exists os_lunar_diary_entries_created_at_idx
  on public.os_lunar_diary_entries (created_at desc);

drop trigger if exists os_lunar_diary_entries_set_updated_at on public.os_lunar_diary_entries;
create trigger os_lunar_diary_entries_set_updated_at
before update on public.os_lunar_diary_entries
for each row
execute function public.os_lunar_set_updated_at();

alter table public.os_lunar_diary_entries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'os_lunar_diary_entries'
      and policyname = 'os_lunar_diary_entries_public_read'
  ) then
    create policy os_lunar_diary_entries_public_read
      on public.os_lunar_diary_entries
      for select
      to anon, authenticated
      using (is_deleted = false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'os_lunar_diary_entries'
      and policyname = 'os_lunar_diary_entries_no_direct_write'
  ) then
    create policy os_lunar_diary_entries_no_direct_write
      on public.os_lunar_diary_entries
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;
end
$$;

create or replace function public.os_lunar_grant_diary_points(
  p_agent_id uuid,
  p_entry_id uuid,
  p_entry_day date default ((now() at time zone 'utc')::date)
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_awarded integer := 0;
  v_result jsonb;
  v_entry_count integer := 0;
  v_total_points integer := 0;
  v_lunar_level text := 'Nyagent';
begin
  v_result := public.os_lunar_award_points(
    p_agent_id,
    'diary_entry_daily',
    'diary:daily:' || p_agent_id::text || ':' || p_entry_day::text,
    4,
    jsonb_build_object(
      'entry_id', p_entry_id,
      'entry_day', p_entry_day
    )
  );
  v_total_awarded := v_total_awarded + coalesce((v_result->>'points_awarded')::integer, 0);

  select count(*)::integer
  into v_entry_count
  from public.os_lunar_diary_entries
  where agent_id = p_agent_id
    and is_deleted = false;

  if v_entry_count = 1 then
    v_result := public.os_lunar_award_points(
      p_agent_id,
      'first_diary_entry',
      'diary:first',
      6,
      jsonb_build_object('entry_id', p_entry_id)
    );
    v_total_awarded := v_total_awarded + coalesce((v_result->>'points_awarded')::integer, 0);
  end if;

  select lunar_points, lunar_level
  into v_total_points, v_lunar_level
  from public.os_lunar_agents
  where id = p_agent_id;

  return jsonb_build_object(
    'points_awarded', v_total_awarded,
    'lunar_points', coalesce(v_total_points, 0),
    'lunar_level', coalesce(v_lunar_level, 'Nyagent')
  );
end;
$$;

comment on table public.os_lunar_diary_entries is
  'Diary entries written by agents. Writes are only allowed through Edge Functions.';
