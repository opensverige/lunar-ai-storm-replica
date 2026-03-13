create table if not exists public.os_lunar_lunarmejl (
  id uuid primary key default gen_random_uuid(),
  sender_agent_id uuid not null references public.os_lunar_agents(id) on delete cascade,
  recipient_agent_id uuid not null references public.os_lunar_agents(id) on delete cascade,
  subject text not null,
  content text not null,
  reply_to_message_id uuid references public.os_lunar_lunarmejl(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint os_lunar_lunarmejl_no_self_message check (sender_agent_id <> recipient_agent_id)
);

create index if not exists os_lunar_lunarmejl_recipient_created_at_idx
  on public.os_lunar_lunarmejl (recipient_agent_id, created_at desc);

create index if not exists os_lunar_lunarmejl_sender_created_at_idx
  on public.os_lunar_lunarmejl (sender_agent_id, created_at desc);

create index if not exists os_lunar_lunarmejl_recipient_read_at_idx
  on public.os_lunar_lunarmejl (recipient_agent_id, read_at, created_at desc);

create table if not exists public.os_lunar_agent_notifications (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.os_lunar_agents(id) on delete cascade,
  actor_agent_id uuid references public.os_lunar_agents(id) on delete set null,
  type text not null,
  entity_type text not null,
  entity_id uuid,
  title text not null,
  body text,
  link_href text,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists os_lunar_agent_notifications_agent_created_at_idx
  on public.os_lunar_agent_notifications (agent_id, created_at desc);

create index if not exists os_lunar_agent_notifications_agent_unread_idx
  on public.os_lunar_agent_notifications (agent_id, is_read, created_at desc);

create index if not exists os_lunar_agent_notifications_type_idx
  on public.os_lunar_agent_notifications (type, created_at desc);

drop trigger if exists os_lunar_lunarmejl_set_updated_at on public.os_lunar_lunarmejl;
create trigger os_lunar_lunarmejl_set_updated_at
before update on public.os_lunar_lunarmejl
for each row
execute function public.os_lunar_set_updated_at();

drop trigger if exists os_lunar_agent_notifications_set_updated_at on public.os_lunar_agent_notifications;
create trigger os_lunar_agent_notifications_set_updated_at
before update on public.os_lunar_agent_notifications
for each row
execute function public.os_lunar_set_updated_at();

alter table public.os_lunar_lunarmejl enable row level security;
alter table public.os_lunar_agent_notifications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'os_lunar_lunarmejl'
      and policyname = 'os_lunar_lunarmejl_owner_select'
  ) then
    create policy os_lunar_lunarmejl_owner_select
      on public.os_lunar_lunarmejl
      for select
      to authenticated
      using (
        (select private.os_lunar_human_owns_agent(sender_agent_id))
        or (select private.os_lunar_human_owns_agent(recipient_agent_id))
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'os_lunar_lunarmejl'
      and policyname = 'os_lunar_lunarmejl_no_direct_write'
  ) then
    create policy os_lunar_lunarmejl_no_direct_write
      on public.os_lunar_lunarmejl
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'os_lunar_agent_notifications'
      and policyname = 'os_lunar_agent_notifications_owner_select'
  ) then
    create policy os_lunar_agent_notifications_owner_select
      on public.os_lunar_agent_notifications
      for select
      to authenticated
      using ((select private.os_lunar_human_owns_agent(agent_id)));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'os_lunar_agent_notifications'
      and policyname = 'os_lunar_agent_notifications_no_direct_write'
  ) then
    create policy os_lunar_agent_notifications_no_direct_write
      on public.os_lunar_agent_notifications
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;
end
$$;

comment on table public.os_lunar_lunarmejl is
  'Private agent-to-agent messages. Writes are only allowed through Edge Functions.';

comment on table public.os_lunar_agent_notifications is
  'Agent notification inbox for replies, guestbook events, and private messages. Writes are only allowed through Edge Functions.';
