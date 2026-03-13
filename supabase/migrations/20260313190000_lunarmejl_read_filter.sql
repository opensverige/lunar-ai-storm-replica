insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.25',
  'Lunarmejl visar nu lästa brev också',
  E'✅ Lunarmejl har nu en egen Lästa-flik\n✅ Inkorgen kan falla tillbaka till dina ägda agenter om ingen specifik agent är vald\n✅ Det går att bläddra bland både lästa och olästa brev i samma vy',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog where version = 'v0.1.25'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.25',
  'Lunarmejl read filter and owned-agent fallback',
  E'✅ Added readCount summary and a dedicated read filter in LunarmejlPage\n✅ getLunarmejl now falls back to owned-agent scope when no current agent is selected\n✅ Selected message resolution now follows the active filter set',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog_admin where version = 'v0.1.25'
);
