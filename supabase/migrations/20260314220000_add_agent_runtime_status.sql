create table if not exists public.os_lunar_agent_runtime_status (
  agent_id uuid primary key references public.os_lunar_agents(id) on delete cascade,
  install_request_status text not null default 'not_requested',
  requested_by text not null default 'none',
  requested_capabilities jsonb not null default jsonb_build_object(
    'heartbeat', true,
    'scheduler', true,
    'state', true
  ),
  request_message text,
  requested_at timestamptz,
  human_decision text not null default 'pending',
  human_decision_at timestamptz,
  human_decision_note text,
  heartbeat_configured boolean not null default false,
  scheduler_configured boolean not null default false,
  state_configured boolean not null default false,
  installed_at timestamptz,
  runtime_path text,
  scheduler_hint text,
  last_agent_check_at timestamptz,
  last_agent_request_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint os_lunar_agent_runtime_status_install_request_status_check
    check (install_request_status in ('not_requested', 'pending_human_approval', 'approved_waiting_install', 'configured', 'declined')),
  constraint os_lunar_agent_runtime_status_requested_by_check
    check (requested_by in ('none', 'agent', 'human')),
  constraint os_lunar_agent_runtime_status_human_decision_check
    check (human_decision in ('pending', 'approved', 'declined'))
);

create index if not exists os_lunar_agent_runtime_status_requested_at_idx
  on public.os_lunar_agent_runtime_status (requested_at desc nulls last);

drop trigger if exists os_lunar_agent_runtime_status_set_updated_at on public.os_lunar_agent_runtime_status;
create trigger os_lunar_agent_runtime_status_set_updated_at
before update on public.os_lunar_agent_runtime_status
for each row
execute function public.os_lunar_set_updated_at();

alter table public.os_lunar_agent_runtime_status enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'os_lunar_agent_runtime_status'
      and policyname = 'os_lunar_agent_runtime_status_owner_select'
  ) then
    create policy os_lunar_agent_runtime_status_owner_select
      on public.os_lunar_agent_runtime_status
      for select
      to authenticated
      using ((select private.os_lunar_human_owns_agent(agent_id)));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'os_lunar_agent_runtime_status'
      and policyname = 'os_lunar_agent_runtime_status_owner_insert'
  ) then
    create policy os_lunar_agent_runtime_status_owner_insert
      on public.os_lunar_agent_runtime_status
      for insert
      to authenticated
      with check ((select private.os_lunar_human_owns_agent(agent_id)));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'os_lunar_agent_runtime_status'
      and policyname = 'os_lunar_agent_runtime_status_owner_update'
  ) then
    create policy os_lunar_agent_runtime_status_owner_update
      on public.os_lunar_agent_runtime_status
      for update
      to authenticated
      using ((select private.os_lunar_human_owns_agent(agent_id)))
      with check ((select private.os_lunar_human_owns_agent(agent_id)));
  end if;
end $$;

grant select, insert, update on public.os_lunar_agent_runtime_status to authenticated;
