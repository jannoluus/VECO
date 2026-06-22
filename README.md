# VECO_V3_20260622_0929

Parandused:
- kliendi arhiveerimine kirjutab kohe Supabase clients tabelisse;
- objekti arhiveerimine kirjutab kohe Supabase objects tabelisse;
- vea korral kuvatakse hoiatus;
- kliendi detailvaade ei ole enam vaikimisi avatud;
- kliendi detail avaneb rea klikiga ja sulgub Sulge nupuga või sama rea teisel klikil.

Eeldus: SUPABASE_CLIENTS_OBJECTS_SOFT_DELETE.sql on käivitatud.

# VECO V3 - build 20260622_0859

Base: VECO_V3_20260622_0742

## CR-DATA-004

Rakendatud kliendi ja objekti soft delete / arhiveerimine.

Enne kasutamist käivita Supabase SQL editoris:

`SUPABASE_CLIENTS_OBJECTS_SOFT_DELETE.sql`

Muudatused:
- kliendi detailis `Arhiveeri`;
- objekti detailis `Arhiveeri`;
- arhiveeritud kirjed peidetakse aktiivsetest valikutest;
- vanadel töödel jääb seos alles ja nimele lisatakse `(arhiivis)`;
- diagnostikas kuvatakse aktiivsed ja arhiivis kliendid/objektid.

## Kontroll

- `node --check assets/js/app.js` OK
- `node --check assets/js/api.js` OK

