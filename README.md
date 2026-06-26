# VECO_V3_20260626_0938

## Muudatus

CR-STATE-002 – Startup Hydration / No Blank Refresh

- Kalender salvestab viimase renderdatud vaate lokaalsesse boot-snapshot cache'i.
- F5 korral taastatakse viimane kalendrivaade enne `app.js` laadimist.
- Esimesel app renderil olemasolevat kalendri shell'i enam üle ei kirjutata, vaid sellele seotakse handlerid külge.
- Supabase taustasünk salvestab uue seisu lokaalsesse cache'i, et järgmine refresh ei alustaks vanast seisust.
- Bootstrap taustasünk ei tee nähtavale cache-kalendrile kõva täisrenderit, kui DOM on olemas ja patch ei õnnestu.
- Boot snapshotist eemaldatakse `<script>` elemendid, et cache ei sisaldaks dubleeritud skripte.

## Automaatne regressioonikontroll

Lisatud:

```bash
node tools/veco-regression-check.js
```

Kontrollib automaatselt:

- build number;
- HTML cache-bust;
- boot restore script;
- boot snapshot funktsioon;
- shell hydration guard;
- `title/description` regressioon;
- Supabase merged state cache save;
- own realtime echo suppress;
- sidebar handler guard.

## VECO Build Report

Build: `VECO_V3_20260626_0938`

Mõjutatud komponendid:

- Kalender
- Startup / F5 refresh
- Render pipeline
- LocalStorage cache
- Supabase background sync
- Shell hydration

Risk: 🔴 Kõrge

Ristkontroll:

- ✅ `app.js` süntaks kontrollitud
- ✅ `api.js` süntaks kontrollitud
- ✅ `node tools/veco-regression-check.js` läbitud
- ✅ build nr uuendatud
- ✅ cache-bust uuendatud
- ✅ `title/description` regressioonikontroll läbitud
- ✅ boot snapshot ei salvesta script tag'e
- ⚠ brauseris Supabase realtime / F5 lõplik visuaalne kontroll jääb kasutaja keskkonda

Teadaolev piirang:

- Esimesel laadimisel pärast täiesti uut deploy'd võib boot snapshot puududa. Pärast esimest edukat renderit salvestatakse snapshot ja järgmised F5-refreshid peaksid olema märgatavalt sujuvamad.
