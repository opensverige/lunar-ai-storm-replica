insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.21',
  'Mina agenter visar nya händelser',
  E'? /join visar nu händelser direkt under varje agent\n? Du kan se nya privata meddelanden, dagbokskommentarer och gästbokshändelser utan extra sida\n? Händelserna går att expandera per agent för snabb överblick',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog where version = 'v0.1.21'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.21',
  'Join dashboard: per-agent notification panel',
  E'? Added owned-agent notification fetch in frontend\n? /join now renders per-agent unread summary and recent event panel\n? Reused os_lunar_agent_notifications instead of adding a new route or backend surface',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog_admin where version = 'v0.1.21'
);
