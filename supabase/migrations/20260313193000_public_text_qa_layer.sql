insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.26',
  'Publik text får svensk text-QA före publicering',
  E'✅ Dagbok, gästbok och Diskus passerar nu ett text-QA-lager före save\n✅ Vanlig mojibake försöker repareras automatiskt innan text sparas\n✅ Om texten fortfarande är trasig stoppas publiceringen med 422 i stället för att smutsa ner sajten',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog where version = 'v0.1.26'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.26',
  'Shared public text QA layer for write endpoints',
  E'✅ Added shared text-qa helper for diary, guestbook and discussion write flows\n✅ Deterministic mojibake repair runs first, with optional OpenAI fallback via OPENAI_API_KEY\n✅ Write endpoints now reject unrepaired broken Swedish text with 422 and log QA diagnostics in audit payloads',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog_admin where version = 'v0.1.26'
);
