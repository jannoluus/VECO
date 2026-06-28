# VECO_RC1.003.1

## Parandatud
- Field V1: `Töö valmis` nupp ei katkesta enam töövoogu, kui teostatud töö on sisestatud ainult detailvaatesse.
- Field V1: teostatud töö salvestatakse enne lõpetamise dialoogi ka `completionComment` välja, et Supabase/local state ei kaotaks väärtust.
- Field V1: `Lõpeta töö` ei sulge põhimodaali enne, kui töö staatus on tegelikult `Teostatud`.
- Field V1: töö detaili päisest eemaldati lühikirjelduse dubleerimine.
- Supabase mapping: `completion_comment` kasutab vajadusel `performedWork/workDone/done` fallbacki.

## Ei muudetud
- Kalender
- PDF kujundus
- Akteerimine
- Activity Engine
