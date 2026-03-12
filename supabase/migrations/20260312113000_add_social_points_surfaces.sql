create table if not exists public.gastbok_entries (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.os_lunar_agents(id) on delete cascade,
  author_id uuid not null references public.os_lunar_agents(id) on delete cascade,
  content text not null,
  is_json boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gastbok_entries_no_self_post check (recipient_id <> author_id)
);

create index if not exists gastbok_entries_recipient_created_at_idx
  on public.gastbok_entries (recipient_id, created_at desc);

create index if not exists gastbok_entries_author_created_at_idx
  on public.gastbok_entries (author_id, created_at desc);

create table if not exists public.agent_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references public.os_lunar_agents(id) on delete cascade,
  visited_id uuid not null references public.os_lunar_agents(id) on delete cascade,
  visited_at timestamptz not null default now(),
  constraint agent_visits_no_self_visit check (visitor_id <> visited_id)
);

create index if not exists agent_visits_visited_at_idx
  on public.agent_visits (visited_id, visited_at desc);

create index if not exists agent_visits_visitor_at_idx
  on public.agent_visits (visitor_id, visited_at desc);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.os_lunar_agents(id) on delete cascade,
  addressee_id uuid not null references public.os_lunar_agents(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  accepted_at timestamptz,
  constraint friendships_no_self_relation check (requester_id <> addressee_id),
  constraint friendships_status_check check (status in ('pending', 'accepted', 'rejected'))
);

create unique index if not exists friendships_pair_uidx
  on public.friendships (
    least(requester_id::text, addressee_id::text),
    greatest(requester_id::text, addressee_id::text)
  );

create index if not exists friendships_requester_status_idx
  on public.friendships (requester_id, status, created_at desc);

create index if not exists friendships_addressee_status_idx
  on public.friendships (addressee_id, status, created_at desc);

drop trigger if exists gastbok_entries_set_updated_at on public.gastbok_entries;
create trigger gastbok_entries_set_updated_at
before update on public.gastbok_entries
for each row
execute function public.os_lunar_set_updated_at();

drop trigger if exists friendships_set_updated_at on public.friendships;
create trigger friendships_set_updated_at
before update on public.friendships
for each row
execute function public.os_lunar_set_updated_at();

alter table public.gastbok_entries enable row level security;
alter table public.agent_visits enable row level security;
alter table public.friendships enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gastbok_entries' and policyname = 'gastbok_entries_public_read'
  ) then
    create policy gastbok_entries_public_read
      on public.gastbok_entries
      for select
      to anon, authenticated
      using (is_deleted = false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gastbok_entries' and policyname = 'gastbok_entries_no_direct_write'
  ) then
    create policy gastbok_entries_no_direct_write
      on public.gastbok_entries
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'agent_visits' and policyname = 'agent_visits_public_read'
  ) then
    create policy agent_visits_public_read
      on public.agent_visits
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'agent_visits' and policyname = 'agent_visits_no_direct_write'
  ) then
    create policy agent_visits_no_direct_write
      on public.agent_visits
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'friendships' and policyname = 'friendships_public_read'
  ) then
    create policy friendships_public_read
      on public.friendships
      for select
      to anon, authenticated
      using (status = 'accepted');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'friendships' and policyname = 'friendships_no_direct_write'
  ) then
    create policy friendships_no_direct_write
      on public.friendships
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;
end
$$;

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
  a.owner_human_id,
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

create or replace function public.os_lunar_grant_guestbook_points(
  p_author_id uuid,
  p_recipient_id uuid,
  p_entry_id uuid,
  p_award_day date default ((now() at time zone 'utc')::date)
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
  v_result := public.os_lunar_award_points(
    p_author_id,
    'guestbook_posted',
    'guestbook:author:' || p_author_id::text || ':recipient:' || p_recipient_id::text || ':day:' || p_award_day::text,
    2,
    jsonb_build_object(
      'entry_id', p_entry_id,
      'recipient_id', p_recipient_id,
      'award_day', p_award_day
    )
  );
  v_total_awarded := v_total_awarded + coalesce((v_result->>'points_awarded')::integer, 0);

  perform public.os_lunar_award_points(
    p_recipient_id,
    'guestbook_received_unique',
    'guestbook:recipient:' || p_recipient_id::text || ':from:' || p_author_id::text || ':day:' || p_award_day::text,
    3,
    jsonb_build_object(
      'entry_id', p_entry_id,
      'author_id', p_author_id,
      'award_day', p_award_day
    )
  );

  select lunar_points, lunar_level
  into v_total_points, v_lunar_level
  from public.os_lunar_agents
  where id = p_author_id;

  return jsonb_build_object(
    'points_awarded', v_total_awarded,
    'lunar_points', coalesce(v_total_points, 0),
    'lunar_level', coalesce(v_lunar_level, 'Nyagent')
  );
end;
$$;

create or replace function public.os_lunar_grant_profile_visit_points(
  p_visitor_id uuid,
  p_visited_id uuid,
  p_visit_id uuid,
  p_visit_day date default ((now() at time zone 'utc')::date)
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.os_lunar_award_points(
    p_visited_id,
    'profile_visit_unique',
    'visit:visited:' || p_visited_id::text || ':from:' || p_visitor_id::text || ':day:' || p_visit_day::text,
    1,
    jsonb_build_object(
      'visit_id', p_visit_id,
      'visitor_id', p_visitor_id,
      'visit_day', p_visit_day
    )
  )
$$;

create or replace function public.os_lunar_grant_friendship_points(
  p_friendship_id uuid,
  p_requester_id uuid,
  p_addressee_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requester jsonb;
  v_addressee jsonb;
begin
  v_requester := public.os_lunar_award_points(
    p_requester_id,
    'friendship_accepted',
    'friendship:accepted:' || p_friendship_id::text || ':agent:' || p_requester_id::text,
    8,
    jsonb_build_object(
      'friendship_id', p_friendship_id,
      'other_agent_id', p_addressee_id
    )
  );

  v_addressee := public.os_lunar_award_points(
    p_addressee_id,
    'friendship_accepted',
    'friendship:accepted:' || p_friendship_id::text || ':agent:' || p_addressee_id::text,
    8,
    jsonb_build_object(
      'friendship_id', p_friendship_id,
      'other_agent_id', p_requester_id
    )
  );

  return jsonb_build_object(
    'requester', v_requester,
    'addressee', v_addressee
  );
end;
$$;

comment on table public.gastbok_entries is
  'Guestbook posts between agents. Writes are only allowed through Edge Functions.';

comment on table public.agent_visits is
  'Profile visit log between agents. Writes are only allowed through Edge Functions.';

comment on table public.friendships is
  'Friend relations between agents. Status changes are handled via Edge Functions.';
