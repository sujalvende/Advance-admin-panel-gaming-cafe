-- Respawn Gaming Lounge: Supabase/PostgreSQL schema (run in the SQL editor).
create extension if not exists btree_gist;

create type station_type as enum ('ps5','sim','vr');
create type station_status as enum ('available','booked','playing','maintenance','disabled');
create type booking_status as enum ('pending','confirmed','delayed','playing','completed','cancelled','noshow');
create type booking_source as enum ('website','whatsapp','phone','walkin','admin');
create type pay_type as enum ('online','offline');

create table stations (
  id text primary key, name text not null, type station_type not null,
  status station_status not null default 'available', notes text default ''
);
create table games (
  id text primary key, title text not null, genre text not null, image text default '',
  multiplayer_count text default '', description text default '', active boolean not null default true
);
create table pricing_rules (
  id text primary key, station_type station_type not null, label text not null,
  rate numeric(10,2) not null check (rate >= 0), pricing_unit text not null default 'hour' check (pricing_unit in ('hour','half_hour')),
  minimum_duration int not null default 0 check (minimum_duration >= 0),
  group_rate numeric(10,2) check (group_rate >= 0), group_min_players int not null default 4,
  active boolean not null default true
);
create table bookings (
  id uuid primary key default gen_random_uuid(),
  booking_no bigint generated always as identity (start with 101),
  customer_name text not null check (length(trim(customer_name)) > 0),
  phone text not null, whatsapp text default '', email text default '',
  booking_date date not null, start_time time not null,
  duration_minutes int not null check (duration_minutes between 10 and 720),
  station_id text not null references stations(id), game_id text references games(id),
  status booking_status not null default 'pending', booking_source booking_source not null default 'website',
  notes text default '',
  session_started_at timestamptz, paused_at timestamptz, paused_ms bigint not null default 0,
  session_ended_at timestamptz, final_total numeric(10,2) check (final_total >= 0),
  refunded boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  completed_at timestamptz, deleted_at timestamptz,
  slot tstzrange generated always as (
    tstzrange((booking_date + start_time)::timestamptz, (booking_date + start_time)::timestamptz + make_interval(mins => duration_minutes))
  ) stored,
  -- no overlapping live bookings on one station; admin overrides cancel/archive the other row first
  constraint no_station_overlap exclude using gist (station_id with =, slot with &&)
    where (status in ('pending','confirmed','delayed','playing') and deleted_at is null and session_ended_at is null)
);
create table players (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  name text not null, start_time timestamptz, end_time timestamptz,
  planned_minutes int check (planned_minutes > 0),
  rate numeric(10,2), amount numeric(10,2) check (amount >= 0), amount_overridden boolean not null default false,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid')),
  payment_method pay_type, notes text default '',
  check (end_time is null or start_time is null or end_time > start_time)
);
create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  payment_type pay_type not null, amount numeric(10,2) not null check (amount > 0),
  transaction_reference text default '', payment_time timestamptz not null default now(), notes text default ''
);
create index on bookings (booking_date, status);
create index on players (booking_id);
create index on payments (booking_id);

-- Row level security: public can read station/game/price info and CREATE pending website bookings only.
alter table stations enable row level security;
alter table games enable row level security;
alter table pricing_rules enable row level security;
alter table bookings enable row level security;
alter table players enable row level security;
alter table payments enable row level security;

create policy "public read stations" on stations for select using (true);
create policy "public read games" on games for select using (active);
create policy "public read pricing" on pricing_rules for select using (active);
create policy "public create website booking" on bookings for insert to anon
  with check (status = 'pending' and booking_source = 'website' and deleted_at is null);
create policy "public create players" on players for insert to anon
  with check (exists (select 1 from bookings b where b.id = booking_id and b.status = 'pending'));

-- Staff: any authenticated user with the admin role in app_metadata.
create function is_admin() returns boolean language sql stable as
  $$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin' $$;
create policy "admin all stations" on stations for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin all games" on games for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin all pricing" on pricing_rules for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin all bookings" on bookings for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin all players" on players for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin all payments" on payments for all to authenticated using (is_admin()) with check (is_admin());

-- Realtime for the public live-status table and admin boards.
alter publication supabase_realtime add table stations, bookings, players, payments;
-- Public availability should expose a view without customer data rather than bookings rows.
