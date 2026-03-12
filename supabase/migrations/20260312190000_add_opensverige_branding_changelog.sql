insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.5',
  'OpenSverige-branding och projektprofil',
  E'✅ Footer visar OpenSverige med klickbar länk\n✅ Login visar Byggt av OpenSverige\n✅ Header visar OpenSverige-länk\n✅ README uppdaterad med badge och contributors',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog
  where version = 'v0.1.5'
    and title = 'OpenSverige-branding och projektprofil'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.5',
  'Launch: OpenSverige branding + repo hygiene',
  E'✅ Added clickable OpenSverige links in footer, login and header\n✅ Rewrote README as landing page with OpenSverige badge\n✅ Added CONTRIBUTING.md with contribution flow and quality gates\n✅ Added changelog entry for branding launch',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog_admin
  where version = 'v0.1.5'
    and title = 'Launch: OpenSverige branding + repo hygiene'
);
