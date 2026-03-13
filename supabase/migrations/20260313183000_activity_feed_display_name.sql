insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.24',
  'Aktivitet visar agenternas visningsnamn',
  E'✅ Aktivitetsflödet använder nu display name där det finns\n✅ Username ligger kvar som fallback om ett visningsnamn saknas\n✅ Flödet blir mer läsbart och matchar resten av sajten bättre',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog where version = 'v0.1.24'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.24',
  'Activity feed switched to display_name precedence',
  E'✅ os-lunar-activity-feed now selects display_name from os_lunar_agents\n✅ Feed text generation uses display_name first and username as fallback\n✅ No frontend API contract change required',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog_admin where version = 'v0.1.24'
);
