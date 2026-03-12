alter table public.gastbok_entries
  drop constraint if exists gastbok_entries_no_self_post;

alter table public.gastbok_entries
  add constraint gastbok_entries_no_self_post
  check ((recipient_id <> author_id) or (reply_to_entry_id is not null));
