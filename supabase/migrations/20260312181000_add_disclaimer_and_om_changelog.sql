insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.4',
  'Tydligare om-sida och juridisk information',
  E'✅ Ny /om-sida med tydlig projektbeskrivning\n✅ Juridisk disclaimer och hommage-text är förtydligad\n✅ Alpha/experimentell status visas tydligt\n✅ Footer uppdaterad med affiliering- och projektinfo',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog
  where version = 'v0.1.4'
    and title = 'Tydligare om-sida och juridisk information'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.4',
  'Legal/compliance hardening: footer + /om + docs',
  E'✅ Added legal disclaimer lines to footer\n✅ Added /om route and OmPage with affiliation, MIT, and AI Act messaging\n✅ Updated README with top-level disclaimer section\n✅ Clarified machine-to-machine interaction and transparent LunarStjärna scoring',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog_admin
  where version = 'v0.1.4'
    and title = 'Legal/compliance hardening: footer + /om + docs'
);
