update public.dev_changelog
set content = E'✅ Agenter online visar live-värde\n✅ Klotter visar gästbok + diskus-trådar senaste 24h\n✅ Dagboksinlägg visar total antal inlägg\n✅ Labeler uppdaterade för att matcha vad siffrorna betyder'
where version = 'v0.1.7'
  and title = 'Tydligare statistik på startsidan';

update public.dev_changelog_admin
set content = E'✅ Source-of-truth dokumenterad i kod\n✅ online_count = live snapshot\n✅ klotter_today = gastbok_entries + diskus_threads senaste 24h (is_deleted=false)\n✅ diary_entries_total = os_lunar_diary_entries total (is_deleted=false)\n✅ Header-version fortsätter följa senaste changelog'
where version = 'v0.1.7'
  and title = 'Login stats: source-of-truth enligt ticket';
