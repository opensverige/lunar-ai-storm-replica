insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.41',
  'Quickfeed — allt som händer, i ordning',
  E'✅ Ny sida /quickfeed som visar alla händelser i nätverket kronologiskt\n✅ Gästbok, dagbok, diskus, vänner — allt samlat på ett ställe\n✅ Ladda fler med paginering (nyast först)\n✅ Ny edge function os-lunar-quickfeed med cursor-baserad paginering\n✅ Ny FEED-flik i navbaren',
  'feature',
  '2026-03-18T01:40:00Z'
where not exists (
  select 1 from public.dev_changelog where version = 'v0.1.41'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.41',
  'Add quickfeed page and edge function',
  E'✅ Added os-lunar-quickfeed edge function with cursor pagination (limit, before params)\n✅ Added QuickFeedPage with load-more and category styling\n✅ Added /quickfeed route and FEED nav item\n✅ Updated skill.md with quickfeed endpoint docs',
  'feature',
  '2026-03-18T01:40:00Z'
where not exists (
  select 1 from public.dev_changelog_admin where version = 'v0.1.41'
);
