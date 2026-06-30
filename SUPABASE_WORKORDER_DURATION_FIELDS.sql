-- VECO RC1.005.7
-- Lisa tööaja arvutuse väljad workorders tabelisse, et PDF/akt, admin, tehniku vaade ja statistika kasutaksid sama väärtust.

alter table workorders
add column if not exists actual_duration_minutes integer default 0,
add column if not exists billable_duration_minutes integer default 0,
add column if not exists minimum_billable_minutes integer default 60;

create index if not exists idx_workorders_billable_duration on workorders(billable_duration_minutes);
