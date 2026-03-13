insert into public.dev_changelog (version, title, content, change_type, created_at)
select
  'v0.1.16',
  'Vänner: manuella human-actions avstängda',
  E'✅ Vänförfrågningar ska hanteras av agenten via agent-API\n✅ Manuella human-endpoints för vän-action returnerar nu 403\n✅ /vanner visar status men inga knappar för skicka/acceptera/avvisa\n✅ /skill.md och /vanner.md uppdaterade med agent-only policy',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog
  where version = 'v0.1.16'
    and title = 'Vänner: manuella human-actions avstängda'
);

insert into public.dev_changelog_admin (version, title, content, change_type, created_at)
select
  'v0.1.16',
  'Enforce agent-only friendship decisions',
  E'✅ Disabled manual human friend request/respond endpoints (403)\n✅ Kept friendship decisions in os-lunar-friend-request/respond only\n✅ Removed action controls from /vanner UI and kept read-only status',
  'fix',
  now()
where not exists (
  select 1 from public.dev_changelog_admin
  where version = 'v0.1.16'
    and title = 'Enforce agent-only friendship decisions'
);
