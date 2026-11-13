-- Carnets d'entretien — schéma de référence (migration depuis Firebase Firestore, v1.1.0).
--
-- Dans Firestore, chaque véhicule était un document contenant ses historiques sous forme de
-- listes. Ici, chaque historique a sa table, reliée au véhicule (suppression en cascade).
--
-- Accès : application privée. Seul un utilisateur connecté (comptes créés à la main,
-- inscriptions fermées) peut lire ou écrire ; un visiteur anonyme ne voit rien.

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  type text not null default '',
  make text not null default '',
  model text not null default '',
  year integer,
  initial_mileage integer not null default 0,
  purchase_date date,
  first_registration_date date,
  vin text,
  image_url text,
  carte_grise_drive_link text,
  license_plate text,
  created_at timestamptz not null default now()
);

create table public.maintenance_entries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  date date not null,
  mileage integer not null default 0,
  description text not null default '',
  parts_cost numeric(12, 2) not null default 0,
  labor_cost numeric(12, 2) not null default 0,
  total_cost numeric(12, 2) generated always as (parts_cost + labor_cost) stored,
  drive_link_1 text,
  drive_link_2 text,
  created_at timestamptz not null default now()
);

create table public.controle_technique_entries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  date date not null,
  mileage integer not null default 0,
  validity text not null default '',
  minor_failures text,
  major_failures text,
  ripage text,
  suspension_asymmetry text,
  vertical_forces text,
  service_brake text,
  parking_brake text,
  exhaust_emissions text,
  headlights text,
  drive_link text,
  created_at timestamptz not null default now()
);

create table public.previous_owners (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  name text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create index maintenance_entries_vehicle_idx on public.maintenance_entries (vehicle_id);
create index controle_technique_entries_vehicle_idx on public.controle_technique_entries (vehicle_id);
create index previous_owners_vehicle_idx on public.previous_owners (vehicle_id);

-- Sécurité : tout est fermé, sauf aux utilisateurs connectés.
alter table public.vehicles enable row level security;
alter table public.maintenance_entries enable row level security;
alter table public.controle_technique_entries enable row level security;
alter table public.previous_owners enable row level security;

create policy "connecte_tout" on public.vehicles
  for all to authenticated using (true) with check (true);
create policy "connecte_tout" on public.maintenance_entries
  for all to authenticated using (true) with check (true);
create policy "connecte_tout" on public.controle_technique_entries
  for all to authenticated using (true) with check (true);
create policy "connecte_tout" on public.previous_owners
  for all to authenticated using (true) with check (true);

revoke all on public.vehicles, public.maintenance_entries,
  public.controle_technique_entries, public.previous_owners from anon;
