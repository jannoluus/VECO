-- CR-DATA-001/002: kliendid ja objektid Supabase'i
-- Käivita Supabase SQL editoris enne buildi kasutusele võtmist, kui tabeleid veel ei ole.

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  client_no text unique not null,
  name text not null,
  reg_no text,
  contact text,
  phone text,
  email text,
  invoice_email text,
  active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists objects (
  id uuid primary key default gen_random_uuid(),
  object_no text unique not null,
  client_no text references clients(client_no) on update cascade on delete set null,
  name text not null,
  address text,
  main_contact text,
  responsible_tech_id text,
  contract text,
  status text default 'active',
  notes text,
  contacts jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table clients disable row level security;
alter table objects disable row level security;

create index if not exists idx_clients_client_no on clients(client_no);
create index if not exists idx_objects_object_no on objects(object_no);
create index if not exists idx_objects_client_no on objects(client_no);
