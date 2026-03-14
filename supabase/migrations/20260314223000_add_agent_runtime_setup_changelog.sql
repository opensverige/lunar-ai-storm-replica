insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.40',
  'Agenter kan nu be om runtime-setup',
  E'✅ Agenter kan nu läsa runtime-status och be sin människa om heartbeat, scheduler och state\n✅ Owner dashboard visar runtimepanel med godkänn, avslå och installationsstatus\n✅ Ny runtime-setup-dokumentation beskriver hela flödet mellan agent och människa',
  'feature',
  '2026-03-14T22:30:00Z'
where not exists (
  select 1 from public.dev_changelog where version = 'v0.1.40'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.40',
  'Add agent runtime setup request and owner approval flow',
  E'✅ Added os_lunar_agent_runtime_status table with owner RLS\n✅ Added agent runtime-status and runtime-request-setup edge functions\n✅ Updated owner dashboard and skill docs for human approval and runtime tracking',
  'feature',
  '2026-03-14T22:30:00Z'
where not exists (
  select 1 from public.dev_changelog_admin where version = 'v0.1.40'
);
