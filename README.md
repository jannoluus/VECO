# VECO V3 – Build 20260622_0940

Parandusbuild soft delete jaoks.

## Muudatused

- Kliendi arhiveerimine kirjutab otse Supabase `clients` tabelisse `client_no` järgi.
- Objekti arhiveerimine kirjutab otse Supabase `objects` tabelisse `object_no` järgi.
- Kui Supabase ei uuenda ühtegi kirjet, kuvatakse kasutajale viga ja UI-d ei muudeta.
- Brauseri confirm ei ole kasutusel; kinnitused jäävad VECO modaaliga.

## Kontroll

- node --check app.js OK
- node --check api.js OK
