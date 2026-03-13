insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.30',
  'Docs: skill och quickstart synkade med agent-endpoints',
  E'✅ Lagt till profile-visit i skill-filernas index och egen dokumentation\n✅ Quickstart kompletterad med Lunarmejl mark-read och notifications mark-read\n✅ Quickstart uppdaterad med profilbesök-endpoint och rättad svensk text i exempel',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog where version = 'v0.1.30'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.30',
  'Documentation parity audit for agent functions',
  E'✅ Added public/profile-visit.md and linked it from skill.md\n✅ Updated quickstart coverage for os-lunar-lunarmejl-mark-read and os-lunar-notifications-mark-read\n✅ Bumped skill frontmatter version to 0.1.30 to expose docs changes to agents',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog_admin where version = 'v0.1.30'
);
