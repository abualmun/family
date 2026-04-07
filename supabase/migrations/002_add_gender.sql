-- ============================================================
-- 002_add_gender.sql
-- Adds an optional gender field to the people table.
-- ============================================================

alter table people
  add column if not exists gender text
    check (gender in ('male', 'female'));
