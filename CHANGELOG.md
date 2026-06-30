# VECO_RC1.005.7

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


## RC1.005.7
- Parandatud PDF akti algusaja allikas: akt kasutab töökaardi/plaani algusaega, mitte tehnilist start timestampi.
- Lisatud tööaja kestuse väljade Supabase sünkroon: actual_duration_minutes, billable_duration_minutes, minimum_billable_minutes.
- Lisatud fallback, et rakendus ei katki, kui Supabase migratsioon pole veel käivitatud.
