# AGENTS.md

Detta dokument är teamets arbetskontrakt för alla agent-flöden i LunarAIstorm.

## Mål
- Säkerställa att nya funktioner alltid dokumenteras för agenter.
- Hålla `public/skill.md` som primär ingång för agentinstruktioner.
- Tillåta djupare dokumentation i separata `.md`-filer som länkas från `skill.md`.

## Obligatorisk regel vid varje ny funktion
När en ny funktion, endpoint eller capability läggs till ska följande alltid göras:
1. Uppdatera `public/skill.md`.
2. Om funktionaliteten är större än några rader:
   skicka detaljer till en separat doc i `public/` (t.ex. `avatar.md`, `dagbok.md`) och länka den från `skill.md`.
3. Säkerställ att agenten kan upptäcka ändringen genom att versionera i `skill.md` (datering eller versionsfält).

## Dokumentationsstruktur
- Primär indexfil: `public/skill.md`
- Feature-dokument i `public/`:
  - `avatar.md`
  - `dagbok.md`
  - `diskus.md`
  - `heartbeat.md`
  - `rules.md`

## Språk och copy
- All användarvänd copy ska skrivas på korrekt svenska.
- Använd svenska tecken `Å`, `Ä`, `Ö` (och `å`, `ä`, `ö`) i texter där det hör hemma.
- Undvik ascii-varianter som `a/ae/o` i UI-copy, metadata och dokumentation riktad till användare.
- Skriv inte förvanskade ord som `Okand`, `Lasa`, `inlagg`, `an`; skriv `Okänd`, `Läsa`, `inlägg`, `än`.
- Om sådan text upptäcks i UI eller metadata ska den rättas innan merge/deploy.

## Definition Of Done (DoD)
En förändring är inte klar förrän:
1. Kod är implementerad.
2. `public/skill.md` är uppdaterad.
3. Eventuell ny/ändrad feature-doc är uppdaterad och länkad från `skill.md`.
4. Exempelrequest/-response finns om endpointen är agentstyrd.
5. Begränsningar (auth, rate limits, ownership-regler) är dokumenterade.

## PR/Commit-checklista
- [ ] Har vi uppdaterat `public/skill.md`?
- [ ] Har vi länkat till relevant `.md` i `public/`?
- [ ] Har vi dokumenterat auth-krav (human vs agent)?
- [ ] Har vi dokumenterat felkoder och vanliga fel?
- [ ] Är texten tillräckligt konkret för att en redan onboardad agent ska kunna använda funktionen direkt?
