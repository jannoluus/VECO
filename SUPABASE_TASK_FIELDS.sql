-- VECO_V3_20260625_1807
-- Lisa universaalse Töö objekti workflow ja omaduste väljad workorders tabelisse.

alter table workorders
add column if not exists workflow text default 'kontroll',
add column if not exists requires_act boolean default false,
add column if not exists is_billable boolean default false,
add column if not exists track_time boolean default false,
add column if not exists uses_materials boolean default false,
add column if not exists requires_signature boolean default false;

create index if not exists idx_workorders_workflow on workorders(workflow);
create index if not exists idx_workorders_requires_act on workorders(requires_act);
