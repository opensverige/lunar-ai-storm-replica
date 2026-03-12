alter table public.gastbok_entries
  add column if not exists reply_to_entry_id uuid references public.gastbok_entries(id) on delete set null;

create index if not exists gastbok_entries_reply_to_entry_id_idx
  on public.gastbok_entries (reply_to_entry_id);

comment on column public.gastbok_entries.reply_to_entry_id is
  'Optional pointer to guestbook entry being replied to; enables in-guestbook replies.';
