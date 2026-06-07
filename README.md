# VECO V3

Versioon: v3.9.9-hotfix
Build: 20260606_1804

Muudatused:
- Parandatud kalendri Peida/Näita L/P lüliti.
- Lähtutud V3.9.9 baasist.


## V3.11.6.2
- Kalender skaleerib tunnirea kõrguse automaatselt nähtava ala järgi.
- 06:00–22:00 mahub ekraanile nii, et alumine ticker jääb nähtavaks.


## V3.11.7.2
- Kalendri drag & drop taastatud samale alusele.
- Kalendri päises lisatud ühtne vaate nimi: KALENDER.
- Ühtlustatud workspace päise ja tickeri kõrgused, et vaadete vahel liikumisel layout vähem nihkuks.


## V3.11.9.3 / 20260607_1519
- Drag & drop taastatud pointer-event loogikaga.
- ESC modalite sulgemine säilitatud.

## V3.11.9.4 / 20260607_1544
- Drag & drop parandatud document-level pointer-event loogikaga.
- ZIP struktuur korrastatud: üks VECO_V3 juurkaust.
- ESC modalite sulgemine säilitatud.


## V3.11.9.5 / 20260607_1600
- Parandatud kalendri drag & drop nähtavus: lohistamisel kasutatakse body külge lisatud ghost-kaarti, mis ei kao päeva veeru overflow taha.
- Lohistamisel kuvatakse ghost-kaardil sihtpäev ja sihtkellaaeg.
- ESC modalite sulgemine säilitatud.


## V3.12.0 / 20260607_1615
- Kalendris töökäsu kestuse muutmine alumisest servast.
- Kestus muutub 1 h sammuga, algusaeg jääb samaks.
- Resize ajal kuvatakse ajavahemik ja kestus.
- Supabase planned_hours tugi lisatud, fallback jääb tööle ka enne andmebaasi veeru lisamist.


## V3.12.1 / 20260607_1627
- Kalendri töökäsu kaardil kuvatakse lõppaeg all vasakul.
- Kestus kuvatakse all paremal.
- Kestuse muutmisel uuenevad lõppaeg ja kestus reaalajas.


## V3.11.10 / 20260607_1630
- Kalender kuvab tööpäeva ala 08:00–17:00 õrna taustatooniga.
- 08:00 ja 17:00 orientiirijooned lisatud, ilma tugeva kontrastita.

## V3.12.2 / 20260607_1708
- Töökäsu muutmise aken korrastatud kalendri jaoks.
- Uue töökäsu loomisel klienti, objekti, projekti ega tehnikut automaatselt ei valita.
- Klient, objekt ja projekt on otsitavad sisestusväljad registri valikutega.
- Muutmisel olemasoleva töökäsu andmed avanevad täidetuna.
- Töökäsu kustutamine lisatud kinnitusküsimusega.
