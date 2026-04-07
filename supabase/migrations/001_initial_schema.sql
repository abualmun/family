-- ============================================================
-- Family Tree — Initial Schema Migration
-- 001_initial_schema.sql
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table roots (
  id          uuid        primary key default uuid_generate_v4(),
  name        text        not null,
  canvas_x    float       not null default 0,
  canvas_y    float       not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table people (
  id                  uuid        primary key default uuid_generate_v4(),
  name                text        not null,
  nickname            text,
  birth_date          text,
  bio                 text,
  photo_url           text,
  mother_id           uuid        references people(id) on delete set null,
  root_id             uuid        not null references roots(id) on delete restrict,
  is_shortcut         boolean     not null default false,
  original_person_id  uuid        references people(id) on delete cascade,
  canvas_x            float       not null default 0,
  canvas_y            float       not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint shortcut_requires_original
    check (is_shortcut = false or original_person_id is not null),
  constraint non_shortcut_no_original
    check (is_shortcut = true or original_person_id is null)
);

create table partnerships (
  id          uuid        primary key default uuid_generate_v4(),
  person_a_id uuid        not null references people(id) on delete restrict,
  person_b_id uuid        not null references people(id) on delete restrict,
  created_at  timestamptz not null default now(),
  constraint no_self_partnership
    check (person_a_id != person_b_id),
  constraint unique_partnership
    unique (person_a_id, person_b_id)
);

create table parent_child (
  id          uuid        primary key default uuid_generate_v4(),
  parent_id   uuid        not null references people(id) on delete restrict,
  child_id    uuid        not null references people(id) on delete restrict,
  created_at  timestamptz not null default now(),
  constraint no_self_parenting
    check (parent_id != child_id),
  constraint unique_parent_child
    unique (parent_id, child_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_people_root_id             on people(root_id);
create index idx_people_mother_id           on people(mother_id);
create index idx_people_original_person_id  on people(original_person_id);
create index idx_partnerships_person_a      on partnerships(person_a_id);
create index idx_partnerships_person_b      on partnerships(person_b_id);
create index idx_parent_child_parent        on parent_child(parent_id);
create index idx_parent_child_child         on parent_child(child_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger roots_updated_at
  before update on roots
  for each row execute function handle_updated_at();

create trigger people_updated_at
  before update on people
  for each row execute function handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table roots        enable row level security;
alter table people       enable row level security;
alter table partnerships enable row level security;
alter table parent_child enable row level security;

create policy "public_read_roots"        on roots        for select using (true);
create policy "public_read_people"       on people       for select using (true);
create policy "public_read_partnerships" on partnerships for select using (true);
create policy "public_read_parent_child" on parent_child for select using (true);

create policy "open_insert_roots"    on roots for insert with check (true);
create policy "open_update_roots"    on roots for update using (true);
create policy "open_delete_roots"    on roots for delete using (true);

create policy "open_insert_people"   on people for insert with check (true);
create policy "open_update_people"   on people for update using (true);
create policy "open_delete_people"   on people for delete using (true);

create policy "open_insert_partnerships" on partnerships for insert with check (true);
create policy "open_update_partnerships" on partnerships for update using (true);
create policy "open_delete_partnerships" on partnerships for delete using (true);

create policy "open_insert_parent_child" on parent_child for insert with check (true);
create policy "open_update_parent_child" on parent_child for update using (true);
create policy "open_delete_parent_child" on parent_child for delete using (true);

-- ============================================================
-- STORAGE BUCKET (run in Supabase dashboard > Storage)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- ============================================================

-- ============================================================
-- VIEWS
-- ============================================================

create view people_with_root as
  select p.*, r.name as root_name
  from people p
  join roots r on r.id = p.root_id;

create view partnerships_detail as
  select
    ps.id,
    ps.person_a_id, a.name as person_a_name,
    ps.person_b_id, b.name as person_b_name,
    ps.created_at
  from partnerships ps
  join people a on a.id = ps.person_a_id
  join people b on b.id = ps.person_b_id;

create view parent_child_detail as
  select
    pc.id,
    pc.parent_id, par.name as parent_name,
    pc.child_id,  ch.name  as child_name,
    pc.created_at
  from parent_child pc
  join people par on par.id = pc.parent_id
  join people ch  on ch.id  = pc.child_id;
