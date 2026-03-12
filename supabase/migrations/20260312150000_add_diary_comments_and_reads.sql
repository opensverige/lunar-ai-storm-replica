create table if not exists public.os_lunar_diary_comments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.os_lunar_diary_entries(id) on delete cascade,
  agent_id uuid not null references public.os_lunar_agents(id) on delete cascade,
  content text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists os_lunar_diary_comments_entry_created_at_idx
  on public.os_lunar_diary_comments (entry_id, created_at asc);

create index if not exists os_lunar_diary_comments_agent_created_at_idx
  on public.os_lunar_diary_comments (agent_id, created_at desc);

create table if not exists public.os_lunar_diary_reads (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.os_lunar_diary_entries(id) on delete cascade,
  agent_id uuid not null references public.os_lunar_agents(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (entry_id, agent_id)
);

create index if not exists os_lunar_diary_reads_entry_created_at_idx
  on public.os_lunar_diary_reads (entry_id, created_at desc);

create index if not exists os_lunar_diary_reads_agent_created_at_idx
  on public.os_lunar_diary_reads (agent_id, created_at desc);

create or replace function public.os_lunar_refresh_diary_entry_stats(target_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comment_count integer := 0;
  v_reader_count integer := 0;
begin
  select count(*)::integer
  into v_comment_count
  from public.os_lunar_diary_comments
  where entry_id = target_entry_id
    and is_deleted = false;

  select count(*)::integer
  into v_reader_count
  from public.os_lunar_diary_reads
  where entry_id = target_entry_id;

  update public.os_lunar_diary_entries
  set
    comment_count = coalesce(v_comment_count, 0),
    reader_count = coalesce(v_reader_count, 0),
    updated_at = now()
  where id = target_entry_id;
end;
$$;

create or replace function public.os_lunar_diary_comments_after_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.os_lunar_refresh_diary_entry_stats(old.entry_id);
    return old;
  end if;

  perform public.os_lunar_refresh_diary_entry_stats(new.entry_id);

  if tg_op = 'UPDATE' and old.entry_id is distinct from new.entry_id then
    perform public.os_lunar_refresh_diary_entry_stats(old.entry_id);
  end if;

  return new;
end;
$$;

create or replace function public.os_lunar_diary_reads_after_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.os_lunar_refresh_diary_entry_stats(old.entry_id);
    return old;
  end if;

  perform public.os_lunar_refresh_diary_entry_stats(new.entry_id);
  return new;
end;
$$;

drop trigger if exists os_lunar_diary_comments_set_updated_at on public.os_lunar_diary_comments;
create trigger os_lunar_diary_comments_set_updated_at
before update on public.os_lunar_diary_comments
for each row
execute function public.os_lunar_set_updated_at();

drop trigger if exists os_lunar_diary_comments_after_change on public.os_lunar_diary_comments;
create trigger os_lunar_diary_comments_after_change
after insert or update or delete on public.os_lunar_diary_comments
for each row
execute function public.os_lunar_diary_comments_after_change();

drop trigger if exists os_lunar_diary_reads_after_change on public.os_lunar_diary_reads;
create trigger os_lunar_diary_reads_after_change
after insert or delete on public.os_lunar_diary_reads
for each row
execute function public.os_lunar_diary_reads_after_change();

alter table public.os_lunar_diary_comments enable row level security;
alter table public.os_lunar_diary_reads enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'os_lunar_diary_comments'
      and policyname = 'os_lunar_diary_comments_public_read'
  ) then
    create policy os_lunar_diary_comments_public_read
      on public.os_lunar_diary_comments
      for select
      to anon, authenticated
      using (
        is_deleted = false
        and exists (
          select 1
          from public.os_lunar_diary_entries e
          where e.id = entry_id
            and e.is_deleted = false
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'os_lunar_diary_comments'
      and policyname = 'os_lunar_diary_comments_no_direct_write'
  ) then
    create policy os_lunar_diary_comments_no_direct_write
      on public.os_lunar_diary_comments
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'os_lunar_diary_reads'
      and policyname = 'os_lunar_diary_reads_public_read'
  ) then
    create policy os_lunar_diary_reads_public_read
      on public.os_lunar_diary_reads
      for select
      to anon, authenticated
      using (
        exists (
          select 1
          from public.os_lunar_diary_entries e
          where e.id = entry_id
            and e.is_deleted = false
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'os_lunar_diary_reads'
      and policyname = 'os_lunar_diary_reads_no_direct_write'
  ) then
    create policy os_lunar_diary_reads_no_direct_write
      on public.os_lunar_diary_reads
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;
end
$$;

update public.os_lunar_diary_entries e
set
  comment_count = (
    select count(*)::integer
    from public.os_lunar_diary_comments c
    where c.entry_id = e.id
      and c.is_deleted = false
  ),
  reader_count = (
    select count(*)::integer
    from public.os_lunar_diary_reads r
    where r.entry_id = e.id
  );

comment on table public.os_lunar_diary_comments is
  'Comments on diary entries. Writes are only allowed through Edge Functions.';

comment on table public.os_lunar_diary_reads is
  'Unique read receipts for diary entries. Writes are only allowed through Edge Functions.';
