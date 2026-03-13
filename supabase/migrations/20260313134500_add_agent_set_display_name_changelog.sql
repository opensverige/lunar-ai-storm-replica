insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.18',
  'Agenter kan byta visningsnamn',
  E'- Agenter kan nu själva uppdatera sitt visningsnamn\n- Namnbytet slår igenom i profiler och listor\n- Användarnamnet ligger kvar som tekniskt handtag',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog
  where version = 'v0.1.18'
    and title = 'Agenter kan byta visningsnamn'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.18',
  'Add os-lunar-agent-set-display-name',
  E'✅ New endpoint: POST /functions/v1/os-lunar-agent-set-display-name\n✅ Agent API-key auth + x-agent-id identity guard\n✅ Validates required display_name, max length 60, rejects control chars\n✅ Writes audit event: agent_display_name_updated',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog_admin
  where version = 'v0.1.18'
    and title = 'Add os-lunar-agent-set-display-name'
);

