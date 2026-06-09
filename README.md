# VECO V3

Versioon: v3.11.27
Build: 20260608_1742

Muudatused:
- Töökäsu staatuse töövoog: Planeeritud / Töös / Lõpetatud.
- Lõpetamisel VECO enda kinnitusküsimus.
- Lõpetatud töö jääb kalendrisse ja admini vaadetesse, kuid peidetakse tehniku aktiivsest vaatest.
- Lõpetatud tööle salvestatakse completed_at ja completed_by, kui Supabase veerud on olemas.
- Kalendri vaikimisi filter näitab ka lõpetatud töid, et need ei kaoks planeerimisvaatest.
- Tehniku vaade peidab lõpetatud tööd endiselt aktiivsest nimekirjast.
- Kalendris on staatuse järgi pehmed värvieristused.

Supabase lisaveerud:
```sql
alter table workorders
add column if not exists completed_at timestamptz,
add column if not exists completed_by text;
```


## V3.11.9.5 / 20260607_1915
- Supabase sync järjekord: kiire järjestikune salvestamine ei jää enam syncing-luku taha.
- Realtime kõrvale lisatud 5 s turvapolling, et telefoni/admini vaated uueneksid ka juhul, kui brauser realtime sündmuse maha magab.


## V3.11.12.2 / 20260607_1940
- Tehniku vaates peidetakse lõpetatud töö kohe aktiivsest/tänasest vaatest.
- Lõpetamise käsitlemine ühtlustatud ka 'Täida' modalist.
- completed status tuvastus normaliseerib staatuse teksti.


## V3.11.14 / 20260607_1949
- Parandatud vaadete vaheline kohene sünkroon sama brauseri eri kaartide vahel BroadcastChannel/localStorage pulse abil.
- Supabase turvapolling 2 s intervalliga ja kohene esimene kontroll.
- Tehniku vaade eemaldab lõpetatud töö enda nimekirjast kohe pärast salvestust.

## V3.11.15 / 20260607_1955
- Tehniku vaates lisatud eraldi "Lõpetatud tööd" kaardisektsioon.
- Lõpetatud töö ei kao tehniku jaoks lõplikult ära.
- Tehnik saab lõpetatud töö avada/muuta või "Ava uuesti" kaudu tagasi töösse panna.
- Build sisaldab varasema 1949 sync-paranduse muudatusi.


## V3.11.16 / 20260608_0820
- Tehniku vaate töökaardi nupud sõltuvad nüüd staatusest.
- Planeeritud: „Alusta“.
- Töös: „Peata“, „Täida“, „Lõpeta“.
- Lõpetatud: „Ava / muuda“, „Ava uuesti“.
- „Peata“ viib töö tagasi staatusesse Planeeritud; „Ava uuesti“ viib töö staatusesse Töös.
- Lõpetatud tööde sektsioon on tehniku vaates kokkuklapitav.

## V3.11.17 / 20260608_0919
- Tehnik peab töö lõpetamisel lisama kohustusliku töö tulemuse kommentaari.
- Lõpetamise kommentaar salvestub `completion_comment` väljale ning dubleeritakse tehniku vaates töö tulemuse kuvamiseks.
- Lõpetatud töö kaardil kuvatakse töö tulemus eraldi plokina.
- Admini töökaardi kaudu lõpetamisel küsitakse samuti töö tulemust, kui kommentaar puudub.

## V3.11.17 / 20260608_1226
- Headeri VALVE pill kasutab nüüd valitud kalendri/tiimivaate perioodi, mitte ainult tänast kuupäeva.
- Parandatud olukord, kus Tiimivaade näitas Jannot valves, aga päise VALVE pill näitas DEMO.


## V3.11.18 / 20260608_1230
- Tugevdatud sama brauseri kaartide/akende vahelist local sync kontrolli.
- Kalender ja tehniku vaade kontrollivad localStorage muutusi ka siis, kui BroadcastChannel/storage event jääb vahele.


## V3.11.19 / 20260608_1246
- Tehniku vaates uue töö lisamisel objekt enam vaikimisi ei täitu.
- Objektiväli on otsitav: saab valida olemasoleva objekti või kirjutada uue objekti nime.
- Uue objektinime sisestamisel lisatakse objekt registrisse ja seotakse töökäsuga.
- Sisaldab varasemat kuupäeva/Täna nupu ning sync paranduste baasi.


## V3.11.20 / 20260608_1254
- Kalendri Lisa töökäsk objektiväli lubab nüüd uue objekti kirjutamist.
- Eemaldatud brauseri alert objektivalideerimisel; tühi objekt fookustatakse väljal.
- Kui klient on valitud, seotakse uus objekt selle kliendiga.


## V3.11.21 / 20260608_1314
- Parandatud kogu rakenduse taustasünkrooni renderdamine: select/input väljade kasutamise ajal ei renderdata vaadet üle.
- Kalendri ja teiste vaadete rippmenüüd ei sulgu enam kohe pärast avamist.

## V3.11.15 / Build 20260608_1331
- Tiimivaate koormuse loogika korrigeeritud: 8 h ei ole enam ülekoormus, ülekoormus algab üle tööaja piiri.
- Koormuse staatused: Vaba, Madal, Normaalne, Täis, Ülekoormus.
- Lisatud lihtsa väljakutse akti prindi/PDF eelvaade töökäsu ja akti detailvaates.
- PDF toimub esimeses versioonis brauseri prindivaate kaudu: Prindi / salvesta PDF.


## V3.11.21 / 20260608_1358
- Detailpaneelide üldine layout-fix.
- Parempoolse paneeli nupud saavad murduda ja ei lõiku.
- KPI kastid kohanduvad kitsas paneelis.
- Detailtekstidel on word-wrap/overflow-wrap.


## V3.11.22 / 20260608_1411
- Akti nupud eraldatud: Eelvaade, Prindi, PDF.
- Akti eelvaade avaneb uues aknas.
- Akti prindivaade kompaktsem: üldandmed 3 veerus.
- Lisatud VECO ümmargune logo akti ülaossa.
- Akti number vormingus VECO-YYYYMMDD-HHMMSS.
- Töö lõpetamisel saab valida akti tüübi: Väljakutse akt.

## V3.11.15 / Build 20260608_1433
- Akti eelvaates kasutatakse lisatud VECO ümmargust logo failist assets/img/veco-act-logo.jpg.
- Prindi ja Salvesta PDF on eraldi toimingud.
- Salvesta PDF käivitab PDF-faili allalaadimise, mitte brauseri printimise dialoogi.


## V3.11.22 / Build 20260608_1448
- Akt V2 PDF salvestus renderdab A4 akti canvas-põhiselt PDF-i sisse, et Eesti täpitähed säiliksid.
- PDF failinimi kujul VECO_AKT_....pdf.
- PDF kasutab ümmargust VECO logo, kompaktset 3-veerulist üldandmete plokki ja suuremat töö tulemuse ala.


## V3.11.23 / 20260608_1501
- Akti PDF/print layout optimeeritud.
- Logo ja pealkiri väiksemaks.
- Üldandmed 4 veerus + aadress täislaiuses.
- Töö kirjeldus kompaktsem, töö tulemus suurem.
- Allkirjaplokk kompaktsem.


## V3.11.24 / Build 20260608_1522

- Akti/PDF päis ümber kujundatud: akti nr ja kuupäev vasakul, objekt ja töökäsk paremal, logo keskel.
- Üldandmetest eemaldatud dubleerivad akti nr, kuupäev, objekt ja töökäsk.
- Töö kirjelduse ala kompaktsem, töö tulemuse ala suurem.


## V3.11.25 / Build 20260608_1527
- Aktide PDF: pealkiri eemaldatud, tüübi väli eemaldatud.
- PDF kuupäevad formaadis DD.MM.YYYY.
- PDF failinimi tulevikukindla aktitüübi prefiksiga, hetkel väljakutse akt: VECO_VA_YYYYMMDD_Txxx.pdf.
- Töö kirjeldus kompaktsem ja töö tulemuse ala mõõdukam.


## V3.11.26 / Build 20260608_1547
- PDF akti layout: üldandmete gridis suuremad vahed, teine rida täidetud väljadega Algus/Lõpp/Tüüp/Töökäsk.
- Aadressi ja Töö kirjelduse vahele lisatud selgem sektsioonivahe.
- Töö tulemuse ala muudetud mõõdukamaks, et vältida liigset tühja pinda.
- PDF logo joondus ja prindivaate paigutus korrigeeritud.


## V3.11.27 / Build 20260608_1742
- PDF akti sektsioonide vahed korrigeeritud: Töö tulemus ja Allkirjad ei alga enam kohe eelneva kasti all.
- Kuupäevade kuvamine veebirakenduses ühtlustatud kujule DD.MM.YYYY kohtades, kus kuupäeva näidatakse kasutajale.
- Sisestusväljade ISO kuupäeva väärtused jäid muutmata.
## 2026-06-08 calendar update
- Kalendrisündmust saab lohistada vasakule/paremale teisele päevale.
- Kui liikumine on peamiselt horisontaalne, säilib algne kellaaeg.
- Töökaardil on vasakul/paremal serval visuaalne riba, mis annab märku nihutamise võimalusest.
- Vertikaalne lohistamine muudab jätkuvalt päeva sees kellaaega.

## Build: VECO_V3_20260608_2157

Muudatused:
- Lisatud kalendrisündmuse/töökäsu horisontaalne venitamine vasakust ja paremast servast.
- Paremast servast venitamine pikendab sündmuse lõppkuupäeva.
- Vasakust servast venitamine muudab sündmuse alguskuupäeva.
- Mitmepäevane sündmus kuvatakse nädalavaates laiema kaardina üle mitme päeva.
- Sündmuse tavapärane lohistamine teisele päevale säilitab mitmepäevase kestuse.
- Vertikaalne resize jäi alles kellalise kestuse muutmiseks.


## Build VECO_V3_20260609_0420

- Parandatud kalendri mitmepäevase sündmuse kuvamine.
- Venitamisel ei kuvata sündmust enam ühe laia kaardina üle veergude, mis jäi päevaveergude taha peitu.
- Sama broneering kuvatakse nüüd igal kestuse päeval eraldi päevakaardina: 1/3, 2/3, 3/3.
- Nihutamisel säilib mitmepäevase sündmuse kestus.
- Kuuvaates arvestatakse samuti mitmepäevase sündmuse kõiki kuupäevi.

## Build VECO_V3_20260609_0438
- Kalendri mitmepäevane töö kuvatakse nädalavaates ühe laia ribana üle päevade.
- Kestuse venitus kasutab endiselt ühte tööd ning muudab algus-/lõppkuupäeva.
- Sama 09:00–13:00 töö 3 päeva ulatuses arvestub koormuses 4 h × 3 = 12 h.
- Praeguse aja marker on tõstetud töökaartidest kõrgemale kihile.


## Build VECO_V3_20260609_0445
- Parandatud modali taustale klikkimise sulgemine.
- ESC sulgeb modali.
- Modal tõstetud kalendri ajamarkerist ja töökaartidest ettepoole.
- Modali avamisel on kalendri drag/resize ja ajamarkeri kihid mitteaktiivsed.
