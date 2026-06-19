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

select relrowsecurity
from pg_class
where relname = 'availability_entries';
