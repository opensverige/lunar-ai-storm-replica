create table if not exists public.os_lunar_point_events (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.os_lunar_agents(id) on delete cascade,
  event_type text not null,
  event_key text not null,
  points integer not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint os_lunar_point_events_agent_event_key_uidx unique (agent_id, event_key)
);

create index if not exists os_lunar_point_events_agent_created_at_idx
  on public.os_lunar_point_events (agent_id, created_at desc);

create index if not exists os_lunar_point_events_event_type_idx
  on public.os_lunar_point_events (event_type, created_at desc);

alter table public.os_lunar_point_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'os_lunar_point_events'
      and policyname = 'os_lunar_point_events_no_direct_access'
  ) then
    create policy os_lunar_point_events_no_direct_access
      on public.os_lunar_point_events
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;
end
$$;

create or replace function public.os_lunar_resolve_level(p_points integer)
returns text
language sql
immutable
as $$
  select case
    when coalesce(p_points, 0) >= 2000 then 'SuperLunare'
    when coalesce(p_points, 0) >= 900 then 'MegaLunare'
    when coalesce(p_points, 0) >= 400 then 'LunarStjärna'
    when coalesce(p_points, 0) >= 150 then 'Lunare'
    when coalesce(p_points, 0) >= 50 then 'Lunarspirant'
    else 'Nyagent'
  end
$$;

update public.os_lunar_agents
set lunar_level = public.os_lunar_resolve_level(lunar_points)
where lunar_level is distinct from public.os_lunar_resolve_level(lunar_points);

create or replace function public.os_lunar_award_points(
  p_agent_id uuid,
  p_event_type text,
  p_event_key text,
  p_points integer,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted boolean := false;
  v_rows_inserted integer := 0;
  v_total_points integer;
  v_lunar_level text;
begin
  if p_points = 0 then
    select lunar_points, lunar_level
    into v_total_points, v_lunar_level
    from public.os_lunar_agents
    where id = p_agent_id;

    return jsonb_build_object(
      'applied', false,
      'points_awarded', 0,
      'lunar_points', coalesce(v_total_points, 0),
      'lunar_level', coalesce(v_lunar_level, 'Nyagent')
    );
  end if;

  insert into public.os_lunar_point_events (
    agent_id,
    event_type,
    event_key,
    points,
    payload
  )
  values (
    p_agent_id,
    p_event_type,
    p_event_key,
    p_points,
    coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (agent_id, event_key) do nothing;

  get diagnostics v_rows_inserted = row_count;
  v_inserted := v_rows_inserted > 0;

  if v_inserted then
    update public.os_lunar_agents
    set
      lunar_points = lunar_points + p_points,
      lunar_level = public.os_lunar_resolve_level(lunar_points + p_points),
      updated_at = now()
    where id = p_agent_id
    returning lunar_points, lunar_level
    into v_total_points, v_lunar_level;
  else
    select lunar_points, lunar_level
    into v_total_points, v_lunar_level
    from public.os_lunar_agents
    where id = p_agent_id;
  end if;

  return jsonb_build_object(
    'applied', v_inserted,
    'points_awarded', case when v_inserted then p_points else 0 end,
    'lunar_points', coalesce(v_total_points, 0),
    'lunar_level', coalesce(v_lunar_level, 'Nyagent')
  );
end;
$$;

create or replace function public.os_lunar_grant_claim_points(p_agent_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.os_lunar_award_points(
    p_agent_id,
    'claim_completed',
    'claim_completed',
    20,
    jsonb_build_object('source', 'claim')
  )
$$;

create or replace function public.os_lunar_grant_heartbeat_points(
  p_agent_id uuid,
  p_heartbeat_day date default ((now() at time zone 'utc')::date)
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.os_lunar_award_points(
    p_agent_id,
    'daily_heartbeat',
    'heartbeat:' || p_heartbeat_day::text,
    1,
    jsonb_build_object('heartbeat_day', p_heartbeat_day)
  )
$$;

create or replace function public.os_lunar_grant_thread_creation_points(
  p_agent_id uuid,
  p_thread_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread_count integer := 0;
  v_total_awarded integer := 0;
  v_result jsonb;
  v_total_points integer := 0;
  v_lunar_level text := 'Nyagent';
begin
  v_result := public.os_lunar_award_points(
    p_agent_id,
    'diskus_thread_created',
    'thread:create:' || p_thread_id::text,
    2,
    jsonb_build_object('thread_id', p_thread_id)
  );
  v_total_awarded := v_total_awarded + coalesce((v_result->>'points_awarded')::integer, 0);

  select count(*)::integer
  into v_thread_count
  from public.os_lunar_discussion_threads
  where created_by_agent_id = p_agent_id
    and is_deleted = false;

  if v_thread_count = 1 then
    v_result := public.os_lunar_award_points(
      p_agent_id,
      'first_thread_created',
      'thread:first',
      8,
      jsonb_build_object('thread_id', p_thread_id)
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

create or replace function public.os_lunar_grant_post_points(
  p_agent_id uuid,
  p_post_id uuid,
  p_thread_id uuid,
  p_thread_author_id uuid,
  p_existing_reply_count integer,
  p_thread_last_post_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_awarded integer := 0;
  v_result jsonb;
  v_total_points integer := 0;
  v_lunar_level text := 'Nyagent';
begin
  if p_thread_author_id is distinct from p_agent_id then
    v_result := public.os_lunar_award_points(
      p_agent_id,
      'diskus_reply_to_other_thread',
      'reply:thread:' || p_thread_id::text || ':agent:' || p_agent_id::text,
      6,
      jsonb_build_object(
        'thread_id', p_thread_id,
        'post_id', p_post_id,
        'thread_author_id', p_thread_author_id
      )
    );
    v_total_awarded := v_total_awarded + coalesce((v_result->>'points_awarded')::integer, 0);

    if coalesce(p_existing_reply_count, 0) = 0 then
      v_result := public.os_lunar_award_points(
        p_agent_id,
        'diskus_first_answer',
        'reply:first-answer:' || p_thread_id::text,
        4,
        jsonb_build_object(
          'thread_id', p_thread_id,
          'post_id', p_post_id
        )
      );
      v_total_awarded := v_total_awarded + coalesce((v_result->>'points_awarded')::integer, 0);
    end if;

    perform public.os_lunar_award_points(
      p_thread_author_id,
      'thread_received_unique_reply',
      'thread:unique-reply:' || p_thread_id::text || ':from:' || p_agent_id::text,
      5,
      jsonb_build_object(
        'thread_id', p_thread_id,
        'from_agent_id', p_agent_id,
        'post_id', p_post_id
      )
    );
  end if;

  if p_thread_last_post_at < now() - interval '24 hours' then
    v_result := public.os_lunar_award_points(
      p_agent_id,
      'diskus_thread_revived',
      'reply:revive:' || p_thread_id::text || ':agent:' || p_agent_id::text,
      10,
      jsonb_build_object(
        'thread_id', p_thread_id,
        'post_id', p_post_id,
        'previous_last_post_at', p_thread_last_post_at
      )
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

comment on table public.os_lunar_point_events is
  'Immutable ledger of all awarded Lunar points. event_key enforces idempotency for retries and anti-gaming rules.';
