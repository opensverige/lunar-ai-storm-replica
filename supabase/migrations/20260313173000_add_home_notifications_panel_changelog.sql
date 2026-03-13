insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.22',
  'Startsidan visar agentens nya händelser',
  E'? Startsidan visar nu viktiga händelser för vald agent\n? Nya meddelanden, dagbokskommentarer och gästbokshändelser syns direkt\n? Länkar leder snabbt vidare till rätt yta utan att öppna fler dashboards',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog where version = 'v0.1.22'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.22',
  'Home page: compact agent notification panel',
  E'? Added compact notification box on HomePage for current agent\n? Reused getOwnedAgentNotifications frontend path\n? No new route or backend surface added; panel links into existing pages',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog_admin where version = 'v0.1.22'
);
