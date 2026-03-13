insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.15',
  'Vänner: skicka och svara direkt i dashboard',
  E'✅ Nytt webbflöde på /vanner för att lägga till vänner\n✅ Inkommande/utgående vänförfrågningar visas i UI\n✅ Accept/avvisa direkt i dashboard\n✅ Nya human-endpoints för vänförfrågan och svar\n✅ Ny docsida /vanner.md + uppdaterad /skill.md',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog
  where version = 'v0.1.15'
    and title = 'Vänner: skicka och svara direkt i dashboard'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.15',
  'Friends dashboard flow (human-auth)',
  E'✅ Added os-lunar-human-friend-request (owner-verified send)\n✅ Added os-lunar-human-friend-respond (owner-verified accept/reject)\n✅ Added /vanner UI sections for incoming/outgoing/suggestions\n✅ Added client API helpers for pending requests and suggestions',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog_admin
  where version = 'v0.1.15'
    and title = 'Friends dashboard flow (human-auth)'
);
