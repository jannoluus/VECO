# VECO V3 – 20260622_1012

Parandusbuild:
- kliendi/objekti arhiveerimine ei sõltu enam `currentUser` muutujast;
- arhiveerimisel kasutatakse turvalist kasutajanime fallback’i;
- objekti detailvaates on arhiveerimise nupp nähtav;
- cache-bust uuendatud.


## VECO_V3_20260622_1034

- CR-DATA-004B: kliendi/objekti arhiivivaated ja taastamine.
- Kliendid: Aktiivsed / Arhiivis / Kõik filter.
- Objektid: Aktiivsed / Arhiivis / Kõik filter.
- Taastamine toimub VECO modaaliga ja kirjutab Supabase’i.
