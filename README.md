Build: 20260616_1142

VECO_V3_20260616_1142:
- CR-088A: lisatud keskse kasutajate/PIN-ide andmehoidla adapter Supabase jaoks.
- Kui Supabase `auth_users` tabel on olemas, saab sama PIN-iga sisse logida ka inkognitos, telefonis ja teises brauseris.
- Admini tegevused “Luba uus PIN”, “Määra PIN” ja admin PIN reset kirjutatakse keskandmetesse.
- Kui tabelit veel pole, töötab rakendus endiselt lokaalse fallbackiga.

Supabase tabeli minimaalne SQL:
```sql
create table if not exists public.auth_users (
  user_id text primary key,
  name text,
  role text,
  active boolean default true,
  pin_hash text,
  pin_set_at timestamptz,
  pin_reset_required boolean default false,
  updated_at timestamptz default now()
);
```

Build: 20260616_1133

VECO_V3_20260616_1133:
- CR-087B: admin-controlled PIN reset.
- Admin saab tehnikule/kasutajale lubada uue PIN-i seadistamise järgmisel sisselogimisel.
- Login-vaates küsitakse uut PIN-i ja kordust ainult siis, kui admin on reseti lubanud.
- Admin saab vajadusel PIN-i ise määrata nupuga "Määra PIN".
- PIN staatus näitab "Uus PIN ootel".

Build: 20260616_1129

VECO_V3_20260616_1129:
- CR-086A: tehniku sisselogimisvaade lihtsustatud.
- Eemaldatud sisselogimisvaatest nupud "Süsteemi taastamine" ja "Teema".
- PIN sisestus viidud labeli alla ja täislaiuseks.
- Lisatud sisselogimisvaate alla build number.

Build: 20260615_1755

VECO V3 build 20260615_1755.

Muudatused:
- CR-081D: kalendri kõrguse ümberarvutus esmasel renderil.
- Kalendri nähtav kõrgus arvutatakse nüüd lõpliku viewporti/asukohaga, mitte vananenud flex-kõrguse järgi.
- Ümberarvutus käivitub renderi järel, filtrite avamisel/sulgemisel, resize/orientation muutusel ja layouti muutustel.
- Parandatud filtrite toggle järel vale funktsioonikõne.
- Diagnostika vaates kuvatakse selgelt hetkel laaditud build: VECO_V3_20260616_1129.
- Ticker/statusriba jääb eemaldatuks.

Põhimõte:
- 24h ajatelg jääb alles.
- Vertikaalne scroll jääb alles.
- Vaikimisi sihtvaade jääb 07:00–18:00.
- Päiseid, filtreid ja päevade laiuseid ei muudetud.


VECO_V3_20260616_1129:
- CR-085A: kalendri päevavaates töökaardid ei kata enam kogu päeva laiust; paremale jääb klikiriba uue töö lisamiseks.

VECO_V3_20260616_1101:
- CR-082A: vasaku menüü olek püsib pärast refreshi.
- Kui menüü oli suletud, jääb see suletuks ka lehe uuesti laadimisel.
