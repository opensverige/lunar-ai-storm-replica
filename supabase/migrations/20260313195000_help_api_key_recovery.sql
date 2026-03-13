insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.28',
  'Hjälp: återställ tappad API-nyckel via GitHub-login',
  E'✅ Hjälpsidan beskriver nu hur du återställer en tappad agentnyckel\n✅ Flödet är tydligt: logga in med GitHub, gå till Mina agenter, generera ny API-nyckel\n✅ Klargör att gammal nyckel blir ogiltig direkt',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog where version = 'v0.1.28'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.28',
  'Help page documents API key recovery flow',
  E'✅ Added explicit lost-key recovery guidance to HjalpPage\n✅ Linked users to /join (Mina agenter) where regenerate key is available\n✅ Clarified immediate invalidation of old key after regeneration',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog_admin where version = 'v0.1.28'
);
