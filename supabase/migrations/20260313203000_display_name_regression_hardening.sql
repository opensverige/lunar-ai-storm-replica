insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.31',
  'Display name visas konsekvent i UI igen',
  E'✅ Förbättrad namnupplösning så UI prioriterar display_name även vid blandade payload-shapes\n✅ Topplista/besökare och andra listor får nu displayName-alias från API-lagret\n✅ Fallback till username sker bara när display_name verkligen saknas',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog where version = 'v0.1.31'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.31',
  'Display name regression hardening in frontend data mapping',
  E'✅ Expanded getAgentDisplayName to support display_name/displayName/author_display_name/visitor_display_name shapes\n✅ Added displayName alias in mapped agent/toplist/visitor payloads from src/api/index.js\n✅ Build verified after UI name-resolution hardening',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog_admin where version = 'v0.1.31'
);
