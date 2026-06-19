VECO_V3_20260619_0945

CR-AVAIL-001 release build.
- Based on VECO_V3_20260618_1328.
- Saadavuse/puhkuste kirjed salvestatakse Supabase tabelisse availability_entries.
- Saadavuse vaates kuvatakse tänase päeva saadavuse kokkuvõte töötajate kaupa.
- Valvegraafikut ei dubleerita saadavusse; valve jääb tabelisse oncall_assignments ja kuvatakse saadavuse kõrval.
- Lisatud staatused: Puhkus, Haigus, Koolitus, Lähetus, Osaliselt saadaval, Mitte saadaval, Puudumine, Muu.
- Filtrite, kalendri, tööde, inimeste ja mobiilivaate põhilist loogikat ei muudetud.

Supabase SQL:

create table if not exists availability_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  user_name text not null,
  start_date date not null,
  end_date date not null,
  status text not null,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table availability_entries disable row level security;

Kontroll:

select relrowsecurity
from pg_class
where relname = 'availability_entries';
