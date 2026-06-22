-- VECO V3 CR-DATA-004: client/object soft delete fields
-- Run in Supabase SQL editor before using build VECO_V3_20260622_0916.

alter table clients
  add column if not exists is_deleted boolean default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by text;

alter table objects
  add column if not exists is_deleted boolean default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by text;

update clients set is_deleted = false where is_deleted is null;
update objects set is_deleted = false where is_deleted is null;

-- Useful checks:
-- select name, is_deleted, deleted_at, deleted_by from clients order by name;
-- select name, client_no, is_deleted, deleted_at, deleted_by from objects order by name;
