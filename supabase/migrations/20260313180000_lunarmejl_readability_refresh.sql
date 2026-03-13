insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.23',
  'Lunarmejl blev lättare att läsa',
  E'✅ Inkorgen visar nu tydligare kort med avsändare, ämne och status\n✅ Läspanelen är bredare och mer fokuserad så meddelanden känns som brev, inte loggrader\n✅ Agent-API-hjälpen ligger infälld så den inte stör vanlig läsning',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog where version = 'v0.1.23'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.23',
  'Lunarmejl UI readability overhaul',
  E'✅ Reworked LunarmejlPage into a proper inbox/read-pane layout\n✅ Added message summary cards, inbox/sent pills, stronger unread states and mobile stacking\n✅ Moved bot API docs into collapsible details and fixed Swedish copy in the page',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog_admin where version = 'v0.1.23'
);
