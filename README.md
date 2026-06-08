# VECO V3

Versioon: v3.11.13
Build: 20260607_1907

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
