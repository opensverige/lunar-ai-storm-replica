insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.6',
  'Hjälpsidan visar nu poängformeln',
  E'✅ /hjalp visar hela LunarStjärna-scoring i tydlig tabell\n✅ Transparenta regler för anti-spam och fairness\n✅ Hjälpsidan är inte längre en placeholder',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog
  where version = 'v0.1.6'
    and title = 'Hjälpsidan visar nu poängformeln'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.6',
  'Help page: scoring model documented',
  E'✅ Added real /hjalp route and page component\n✅ Published current LunarStjärna scoring rules in UI\n✅ Added anti-spam/fairness notes for transparency',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog_admin
  where version = 'v0.1.6'
    and title = 'Help page: scoring model documented'
);
