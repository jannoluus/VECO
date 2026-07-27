# VECO_RC1.006.3 — 2026-07-27

- Muudetud ainult avalikku `oncall-public.html` valvevaadet.
- Aktiivse valve rea taust kasutab nüüd töökindlat `rgba()` värvi.
- Lisatud vasak roheline aktsentriba ja õrn sisemine ääris.
- Teisi vaateid ega sisselogimislehte ei muudetud.

# VECO_RC1.006.2 — 2026-07-27

- Avaliku valvevaate aktiivne tehnik on nüüd rõhutatud õrna taustavärvi ja vasaku VECO-rohelise aktsentribaga.
- Aktiivse ning järgmiste tehnikute tekstisuurus ja kirjakaal on ühesugused.
- Sisselogimisvaates on Logi sisse nupu all nupp **Valveinfo**.
- Valveinfo avaneb eraldi vahelehel ja ei nõua PIN-i.
- Cache/build viited uuendatud versioonile RC1.006.2.

# VECO_RC1.006.2

## Avalik valveinfo
- Vähendatud hetkel valves oleva tehniku nime suurust.
- Eemaldatud rotatsiooni horisontaalne kerimine.
- Rotatsioon murdub kitsal ekraanil automaatselt uuele reale.
- Tehniku nimi ja sellele järgnev nool on seotud üheks sammuks, et nool ei jääks eraldi rea lõppu.
- Mobiilivaates kuvatakse rotatsioon ühe tehniku kaupa vertikaalselt.
- Eemaldatud aktiivse nime automaatne `scrollIntoView`, mis võis lehte külgsuunas nihutada.

# VECO_RC1.006.2

## Calendar Layout Audit
- Tuvastatud kalendri vasaku tühja ala põhjus: see ei olnud eraldi riba teistes vaadetes, vaid `index.html` kalendri ajatelje veerg + vasak padding.
- Kitsendatud ainult kalendri ajatelje veergu desktop-vaates.
- Päevade grid jäi muutmata, seega kõik päevad jäävad võrdsed.
- Uuendatud current-time marker offset vastavalt uuele ajatelje laiusele.

## Ei muudetud
- Andmeid.
- Töövooge.
- Supabase salvestust.
- Tehniku vaadet.
- Väljakutse / akti loogikat.


## RC1.006.2
- Parandatud PDF akti algusaja allikas: akt kasutab töökaardi/plaani algusaega, mitte tehnilist start timestampi.
- Lisatud tööaja kestuse väljade Supabase sünkroon: actual_duration_minutes, billable_duration_minutes, minimum_billable_minutes.
- Lisatud fallback, et rakendus ei katki, kui Supabase migratsioon pole veel käivitatud.

## VECO_RC1.006.2 — 2026-07-27

- Lisatud PIN-ita avalik valveinfo leht `oncall-public.html`.
- Kuvatakse hetkel valves olev tehnik ja valveperiood.
- Kuvatakse kogu valve rotatsioon kujul `Aleksei → Artem → Sergei → Dmitri`.
- Aktiivne tehnik märgitakse rohelise punktiga.
- Lisatud automaatne värskendus iga 5 minuti järel ning lehele naasmisel.
- Lisatud veateated puuduva valve, kattuvate valveperioodide ja ühendusvea korral.
- Technician V1 PIN-vaatesse lisatud link „Vaata valveinfot“.

## VECO_RC1.006.2 – 2026-07-27
- Avalik valvevaade muudetud lihtsaks graafikuks.
- Kõik valve read kasutavad ühtset põhifondisuurust.
- Aktiivne valve eristub ainult bold kirjaga.
- Igal real kuvatakse kuupäevavahemik ja ISO nädalanumber.
- Mobiilivaates kuvatakse periood nime all; horisontaalset kerimist ei teki.

## VECO_RC1.006.4 — 2026-07-27
- Parandatud avaliku valveinfo aktiivse rea tuvastus: aktiivsus arvutatakse kuupäevavahemiku põhjal.
- Aktiivse tehniku reale lisatud selgelt nähtav rohekas taust ja vasak aktsentriba.
- Ühtlustatud APP_BUILD ja kõigi HTML-varade cache-versioon RC1.006.4 peale.
- Muid töövooge ega andmemudelit ei muudetud.
