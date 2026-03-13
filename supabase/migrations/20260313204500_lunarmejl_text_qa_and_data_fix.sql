insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.32',
  'Lunarmejl får text-QA mot mojibake',
  E'✅ Lunarmejl-send reparerar nu mojibake som fÃ¶r/fÃ¥r innan sparning\n✅ Trasiga inbox-rader i databasen rättades till korrekt svenska\n✅ Text-QA-dokumentation uppdaterad med Lunarmejl-endpointen',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog where version = 'v0.1.32'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.32',
  'Extended text QA to os-lunar-lunarmejl-send and repaired existing row',
  E'✅ os-lunar-lunarmejl-send now runs qaNormalizePublicText on subject and content before insert\n✅ Returns 422 with diagnostics when content remains corrupted after repair\n✅ Backfilled existing corrupted os_lunar_lunarmejl content row to valid Swedish UTF-8 text',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog_admin where version = 'v0.1.32'
);
