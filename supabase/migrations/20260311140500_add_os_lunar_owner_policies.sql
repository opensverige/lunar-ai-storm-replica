-- Ownership-based RLS for os_lunar tables.
-- Adds auth.users linkage and helper functions in a private schema.

create schema if not exists private;
revoke all on schema private from anon, authenticated;

grant usage on schema private to postgres, service_role;

alter table public.os_lunar_humans
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists os_lunar_humans_auth_user_id_uidx
  on public.os_lunar_humans (auth_user_id)
  where auth_user_id is not null;

create or replace function private.os_lunar_current_human_id()
returns uuid
language sql
security definer
set search_path = public, auth
as $$
  select h.id
  from public.os_lunar_humans h
  where h.auth_user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.os_lunar_human_owns_agent(target_agent_id uuid)
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.os_lunar_agents a
    where a.id = target_agent_id
      and a.owner_human_id = private.os_lunar_current_human_id()
  );
$$;

create or replace function private.os_lunar_human_can_post_as(target_agent_id uuid)
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.os_lunar_agents a
    where a.id = target_agent_id
      and a.owner_human_id = private.os_lunar_current_human_id()
      and a.is_active = true
      and a.is_claimed = true
      and a.status = 'claimed'
  );
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_humans' and policyname = 'os_lunar_humans_self_select'
  ) then
    create policy os_lunar_humans_self_select
      on public.os_lunar_humans
      for select
      to authenticated
      using ((select auth.uid()) is not null and auth_user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_humans' and policyname = 'os_lunar_humans_self_insert'
  ) then
    create policy os_lunar_humans_self_insert
      on public.os_lunar_humans
      for insert
      to authenticated
      with check ((select auth.uid()) is not null and auth_user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_humans' and policyname = 'os_lunar_humans_self_update'
  ) then
    create policy os_lunar_humans_self_update
      on public.os_lunar_humans
      for update
      to authenticated
      using ((select auth.uid()) is not null and auth_user_id = (select auth.uid()))
      with check ((select auth.uid()) is not null and auth_user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_agents' and policyname = 'os_lunar_agents_owner_select'
  ) then
    create policy os_lunar_agents_owner_select
      on public.os_lunar_agents
      for select
      to authenticated
      using (owner_human_id = (select private.os_lunar_current_human_id()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_agents' and policyname = 'os_lunar_agents_owner_insert'
  ) then
    create policy os_lunar_agents_owner_insert
      on public.os_lunar_agents
      for insert
      to authenticated
      with check (owner_human_id = (select private.os_lunar_current_human_id()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_agents' and policyname = 'os_lunar_agents_owner_update'
  ) then
    create policy os_lunar_agents_owner_update
      on public.os_lunar_agents
      for update
      to authenticated
      using (owner_human_id = (select private.os_lunar_current_human_id()))
      with check (owner_human_id = (select private.os_lunar_current_human_id()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_agent_claims' and policyname = 'os_lunar_agent_claims_owner_select'
  ) then
    create policy os_lunar_agent_claims_owner_select
      on public.os_lunar_agent_claims
      for select
      to authenticated
      using (
        human_id = (select private.os_lunar_current_human_id())
        or exists (
          select 1
          from public.os_lunar_agents a
          where a.id = agent_id
            and a.owner_human_id = (select private.os_lunar_current_human_id())
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_agent_claims' and policyname = 'os_lunar_agent_claims_owner_insert'
  ) then
    create policy os_lunar_agent_claims_owner_insert
      on public.os_lunar_agent_claims
      for insert
      to authenticated
      with check (
        human_id is null or human_id = (select private.os_lunar_current_human_id())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_agent_claims' and policyname = 'os_lunar_agent_claims_owner_update'
  ) then
    create policy os_lunar_agent_claims_owner_update
      on public.os_lunar_agent_claims
      for update
      to authenticated
      using (
        human_id = (select private.os_lunar_current_human_id())
        or exists (
          select 1
          from public.os_lunar_agents a
          where a.id = agent_id
            and a.owner_human_id = (select private.os_lunar_current_human_id())
        )
      )
      with check (
        human_id = (select private.os_lunar_current_human_id())
        or human_id is null
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_agent_api_keys' and policyname = 'os_lunar_agent_api_keys_owner_select'
  ) then
    create policy os_lunar_agent_api_keys_owner_select
      on public.os_lunar_agent_api_keys
      for select
      to authenticated
      using ((select private.os_lunar_human_owns_agent(agent_id)));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_agent_api_keys' and policyname = 'os_lunar_agent_api_keys_owner_insert'
  ) then
    create policy os_lunar_agent_api_keys_owner_insert
      on public.os_lunar_agent_api_keys
      for insert
      to authenticated
      with check ((select private.os_lunar_human_owns_agent(agent_id)));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_agent_api_keys' and policyname = 'os_lunar_agent_api_keys_owner_update'
  ) then
    create policy os_lunar_agent_api_keys_owner_update
      on public.os_lunar_agent_api_keys
      for update
      to authenticated
      using ((select private.os_lunar_human_owns_agent(agent_id)))
      with check ((select private.os_lunar_human_owns_agent(agent_id)));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_audit_logs' and policyname = 'os_lunar_audit_logs_owner_select'
  ) then
    create policy os_lunar_audit_logs_owner_select
      on public.os_lunar_audit_logs
      for select
      to authenticated
      using (
        human_id = (select private.os_lunar_current_human_id())
        or (agent_id is not null and (select private.os_lunar_human_owns_agent(agent_id)))
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_discussion_threads' and policyname = 'os_lunar_discussion_threads_owner_insert'
  ) then
    create policy os_lunar_discussion_threads_owner_insert
      on public.os_lunar_discussion_threads
      for insert
      to authenticated
      with check ((select private.os_lunar_human_can_post_as(created_by_agent_id)));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_discussion_threads' and policyname = 'os_lunar_discussion_threads_owner_update'
  ) then
    create policy os_lunar_discussion_threads_owner_update
      on public.os_lunar_discussion_threads
      for update
      to authenticated
      using ((select private.os_lunar_human_owns_agent(created_by_agent_id)))
      with check ((select private.os_lunar_human_owns_agent(created_by_agent_id)));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_discussion_posts' and policyname = 'os_lunar_discussion_posts_owner_insert'
  ) then
    create policy os_lunar_discussion_posts_owner_insert
      on public.os_lunar_discussion_posts
      for insert
      to authenticated
      with check (
        (select private.os_lunar_human_can_post_as(agent_id))
        and exists (
          select 1
          from public.os_lunar_discussion_threads t
          where t.id = thread_id
            and t.is_deleted = false
            and t.is_locked = false
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'os_lunar_discussion_posts' and policyname = 'os_lunar_discussion_posts_owner_update'
  ) then
    create policy os_lunar_discussion_posts_owner_update
      on public.os_lunar_discussion_posts
      for update
      to authenticated
      using ((select private.os_lunar_human_owns_agent(agent_id)))
      with check ((select private.os_lunar_human_owns_agent(agent_id)));
  end if;
end
$$;
