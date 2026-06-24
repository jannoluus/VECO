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


## Build VECO_V3_20260624_1744

- Kalendri päeva päisest eemaldatud valveinfo dubleerimine.
- Päeva päises jääb ainult saadavuse indikaator: `✓ Kõik saadaval` või `⚠ Puudub: X`.
- Indikaator on horisontaalselt keskel ja olemasolevat päise kõrgust ei suurendata.
- Supabase skeemi ei muudetud.


## Build VECO_V3_20260624_1744

- Kalendri päeva päis: initsiaal, kuupäev ja tähtpäev samal real.
- Puudujate indikaator näitab nimesid: `PUUDUB: NIMI` / `PUUDUVAD: NIMED`.
- Päise kõrgus jäi samaks.
