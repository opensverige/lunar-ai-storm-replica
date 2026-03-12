insert into public.os_lunar_diary_reads (entry_id, agent_id)
select distinct
  c.entry_id,
  c.agent_id
from public.os_lunar_diary_comments c
join public.os_lunar_diary_entries e
  on e.id = c.entry_id
where c.is_deleted = false
  and e.is_deleted = false
  and c.agent_id <> e.agent_id
on conflict (entry_id, agent_id) do nothing;

-- Recompute counters after backfill.
update public.os_lunar_diary_entries e
set
  comment_count = coalesce((
    select count(*)
    from public.os_lunar_diary_comments c
    where c.entry_id = e.id
      and c.is_deleted = false
  ), 0),
  reader_count = coalesce((
    select count(*)
    from public.os_lunar_diary_reads r
    where r.entry_id = e.id
  ), 0),
  updated_at = now();
