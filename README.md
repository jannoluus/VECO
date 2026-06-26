# VECO_V3_20260626_0826

## Muudetud
- CR-STATE-001 esimene samm: optimistic/offline-first bootstrap.
- F5/esmane laadimine renderdab esmalt lokaalse cache'i ning Supabase uuendab taustal.
- Realtime/polling uuendus liigub sama taustauuenduse kanalisse.

## Mõjutatud komponendid
- Kalender
- Bootstrap / esmane laadimine
- Supabase load / realtime / polling
- Shell/render

## Risk
🔴 Kõrge – puudutab renderdust ja Supabase andmevoogu.

## Ristkontroll
- ✅ Staatiline kontroll: app.js süntaks läbitud `node --check`.
- ✅ Build nr uuendatud: app.js, HTML cache-bust, BUILD_INFO, README.
- ✅ Sidebar handleri parandus jäi alles.
- ✅ Ajajoone eraldi uuendamise loogika jäi alles.
- ⚠ Brauseris kontrollimata: reaalne Supabase realtime käitumine.
- ⚠ Brauseris kontrollimata: drag/resize käsitsi test.
- ⚠ Brauseris kontrollimata: mobile login.

## Teadaolevad riskid
- Kui lokaalne cache on tühi, kuvatakse esimesel avamisel tühi baasvaade kuni Supabase taustalaadimine jõuab.
- Kui remote muudab töö asukohta/aega, võib kalender teha ühe täisrenderi, sest kaardi layout muutub.
