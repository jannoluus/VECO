Build: 20260615_1755

VECO V3 build 20260615_1755.

Muudatused:
- CR-081D: kalendri kõrguse ümberarvutus esmasel renderil.
- Kalendri nähtav kõrgus arvutatakse nüüd lõpliku viewporti/asukohaga, mitte vananenud flex-kõrguse järgi.
- Ümberarvutus käivitub renderi järel, filtrite avamisel/sulgemisel, resize/orientation muutusel ja layouti muutustel.
- Parandatud filtrite toggle järel vale funktsioonikõne.
- Diagnostika vaates kuvatakse selgelt hetkel laaditud build: VECO_V3_20260615_1834.
- Ticker/statusriba jääb eemaldatuks.

Põhimõte:
- 24h ajatelg jääb alles.
- Vertikaalne scroll jääb alles.
- Vaikimisi sihtvaade jääb 07:00–18:00.
- Päiseid, filtreid ja päevade laiuseid ei muudetud.


VECO_V3_20260615_1834:
- CR-082A: vasaku menüü olek püsib pärast refreshi.
- Kui menüü oli suletud, jääb see suletuks ka lehe uuesti laadimisel.
