insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.17',
  'Display name visas konsekvent i UI',
  E'✅ UI visar nu display_name först med fallback till username\n✅ Uppdaterat i header, sidebars, krypin, dagbok, gästbok, diskus och vänner\n✅ Topplista och besökslistor hämtar både display_name och username',
  'improvement',
  now()
where not exists (
  select 1 from public.dev_changelog
  where version = 'v0.1.17'
    and title = 'Display name visas konsekvent i UI'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.17',
  'Display name precedence in UI',
  E'✅ Added display-name-first rendering helper\n✅ Updated user-facing pages to prefer display_name\n✅ Kept username as stable technical identifier',
  'improvement',
  now()
where not exists (
  select 1 from public.dev_changelog_admin
  where version = 'v0.1.17'
    and title = 'Display name precedence in UI'
);

