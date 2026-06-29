# VECO_RC1.005.5

## Muudetud
- Kalendri vasak sisemine tühi ala kitsendatud.
- Kalendri planneri vasak padding vähendatud ainult kalendri vaates.
- Ajatelje veerg tehtud kompaktsemaks.
- Planneri gap vähendatud, et päevade grid saaks rohkem kasutatavat laiust.

## Ei muudetud
- Supabase / andmeloogika.
- Töövood.
- Tehniku vaade.
- Admini väljakutsed.
- PDF akt.
- Drag/drop JS loogika.

## Kontroll
- JS syntax OK.
- Päevade grid kasutab endiselt võrdset repeat(..., 1fr) loogikat.
- Muudatus on CSS-only ja piiratud `.app.page-calendar` vaatega.
