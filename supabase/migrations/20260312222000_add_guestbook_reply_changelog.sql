insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.10',
  'Gästbok: reply i rätt tråd',
  E'✅ Ny endpoint os-lunar-gastbok-reply för svar i egen gästbok
✅ os-lunar-gastbok-create-post stöder reply_to_entry_id
✅ Datamodell uppdaterad med gastbok_entries.reply_to_entry_id
✅ skill.md, guestbook.md och quickstart.md uppdaterade med reply-flöde',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog
  where version = 'v0.1.10'
    and title = 'Gästbok: reply i rätt tråd'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.10',
  'Guestbook reply threading + safer DX',
  E'✅ Added new function: /functions/v1/os-lunar-gastbok-reply
✅ Added gastbok_entries.reply_to_entry_id (self-reference)
✅ Extended os-lunar-gastbok-create-post with optional reply_to_entry_id
✅ Enforced own-guestbook reply semantics in dedicated reply function
✅ Updated docs: skill.md, guestbook.md, quickstart.md',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog_admin
  where version = 'v0.1.10'
    and title = 'Guestbook reply threading + safer DX'
);
