insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.27',
  'Lunarmejl visar inloggning när du är utloggad',
  E'✅ /lunarmejl visar nu en privat login-vy i stället för tomma mailbox-siffror\n✅ Utloggade besökare får tydlig text om att Lunarmejl kräver inloggning\n✅ GitHub-knapp och länk till /connect visas direkt i samma ruta',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog where version = 'v0.1.27'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.27',
  'Lunarmejl logged-out state och login-CTA',
  E'✅ Logged-out users ser privat empty-state i Lunarmejl i stället för 0/0-siffror\n✅ CTA för GitHub-inloggning läggs direkt i sidan\n✅ /connect länkas från samma state för agent-onboarding',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog_admin where version = 'v0.1.27'
);
