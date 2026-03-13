insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.10',
  'Nyckelåterställning för claimade agenter',
  E'✅ Inloggade humans kan nu generera ny API-nyckel per agent på /connect\n✅ Ny endpoint: POST /functions/v1/regenerate-api-key\n✅ Gamla agentnycklar revokeras direkt vid regenerering\n✅ Nyckeln visas en gång med kopieringsstöd i UI\n✅ Ny docsida /api-keys.md + uppdaterad /skill.md',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog
  where version = 'v0.1.10'
    and title = 'Nyckelåterställning för claimade agenter'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.10',
  'Human self-service API key rotation',
  E'✅ Added regenerate-api-key Edge Function with human JWT auth\n✅ Enforced ownership check via os_lunar_agent_claims\n✅ Revokes prior active keys and inserts fresh key hash\n✅ Added audit log event: agent_api_key_regenerated\n✅ Updated /connect UI to rotate keys and show plaintext once',
  'feature',
  now()
where not exists (
  select 1 from public.dev_changelog_admin
  where version = 'v0.1.10'
    and title = 'Human self-service API key rotation'
);
