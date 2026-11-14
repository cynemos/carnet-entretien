-- v1.5.0 : prix d'achat et de vente, catégories d'intervention, frais annexes, travaux à faire,
-- fiche technique, galerie photo et liens de partage en lecture seule.
-- Rejouable sans risque (if not exists, drop … if exists).

-- Véhicule : bilan d'achat et de vente, aide-mémoire technique
alter table public.vehicles
  add column if not exists purchase_price numeric(12, 2),
  add column if not exists sale_price numeric(12, 2),
  add column if not exists fiche_technique jsonb not null default '[]'::jsonb;   -- [{ "libelle": "Huile", "valeur": "10W40, 3,5 l" }, …]

-- Catégorie d'intervention (vidange, freins, pneus…), devinée pour l'historique existant
alter table public.maintenance_entries
  add column if not exists categorie text not null default 'autre';

update public.maintenance_entries set categorie = case
  when description ~* '(vidange|huile)' then 'vidange'
  when description ~* 'filtre' then 'filtres'
  when description ~* '(bougie|injecteur|allumage|carbu)' then 'allumage'
  when description ~* '(distribution|courroie|cha[iî]ne)' then 'distribution'
  when description ~* '(frein|plaquette|disque|[ée]trier)' then 'freins'
  when description ~* 'embrayage' then 'embrayage'
  when description ~* '(suspension|amortisseur|ressort|fourche|rotule|direction|silent)' then 'suspension'
  when description ~* '(pneu|roue|jante|g[ée]om[ée]trie|parall[ée]lisme)' then 'pneus'
  when description ~* 'clim' then 'climatisation'
  when description ~* '(batterie|[ée]lectri|ampoule|phare|alternateur|d[ée]marreur|faisceau)' then 'electricite'
  when description ~* '([ée]chappement|catalyseur|fap|silencieux)' then 'echappement'
  when description ~* '(refroidissement|radiateur|thermostat|pompe [àa] eau|durite)' then 'refroidissement'
  when description ~* '(carrosserie|peinture|rouille|soudure|pare-?choc|chrome)' then 'carrosserie'
  when description ~* '(restauration|r[ée]fection|remise en [ée]tat)' then 'restauration'
  when description ~* '(r[ée]vision|contr[ôo]le|diagnostic)' then 'revision'
  else 'autre' end
where categorie = 'autre';

-- Frais annexes hors entretien : assurance, carte grise, stockage, carburant…
create table if not exists public.depenses (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  date date not null,
  categorie text not null default 'autre',
  montant numeric(12, 2) not null default 0,
  libelle text not null default '',
  created_at timestamptz not null default now()
);

-- Travaux à faire : pièces à commander, défauts relevés au CT…
create table if not exists public.travaux (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  titre text not null default '',
  details text,
  priorite smallint not null default 2 check (priorite between 1 and 3),   -- 1 urgent, 2 normal, 3 un jour
  cout_estime numeric(12, 2),
  fait_le date,
  entretien_id uuid references public.maintenance_entries (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Galerie : photos datées (restauration avant / après), fichiers dans le dossier « carnet »
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  chemin text not null,
  date date,
  legende text,
  created_at timestamptz not null default now()
);

-- Liens de partage en lecture seule (pour un acheteur). Le jeton est long et aléatoire ;
-- le lien expire tout seul et peut être révoqué. « fichiers » contient des liens signés
-- vers les fichiers montrés, créés pour la même durée que le partage.
create table if not exists public.partages (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  jeton text not null unique default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  expire_le timestamptz not null,
  revoque boolean not null default false,
  avec_montants boolean not null default true,
  avec_factures boolean not null default false,
  fichiers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists depenses_vehicle_idx on public.depenses (vehicle_id);
create index if not exists travaux_vehicle_idx on public.travaux (vehicle_id);
create index if not exists photos_vehicle_idx on public.photos (vehicle_id);
create index if not exists partages_vehicle_idx on public.partages (vehicle_id);

alter table public.depenses enable row level security;
alter table public.travaux enable row level security;
alter table public.photos enable row level security;
alter table public.partages enable row level security;

drop policy if exists "connecte_tout" on public.depenses;
create policy "connecte_tout" on public.depenses for all to authenticated using (true) with check (true);
drop policy if exists "connecte_tout" on public.travaux;
create policy "connecte_tout" on public.travaux for all to authenticated using (true) with check (true);
drop policy if exists "connecte_tout" on public.photos;
create policy "connecte_tout" on public.photos for all to authenticated using (true) with check (true);
drop policy if exists "connecte_tout" on public.partages;
create policy "connecte_tout" on public.partages for all to authenticated using (true) with check (true);

revoke all on public.depenses, public.travaux, public.photos, public.partages from anon;

-- Seule porte ouverte aux visiteurs : lire UN carnet avec un jeton valide (non révoqué, non expiré).
-- Ne renvoie ni prix d'achat ou de vente, ni frais annexes, ni noms des anciens propriétaires.
create or replace function public.carnet_partage(p_jeton text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'expire_le', p.expire_le,
    'fichiers', p.fichiers,
    'vehicule', jsonb_build_object(
      'type', v.type, 'make', v.make, 'model', v.model, 'year', v.year,
      'license_plate', v.license_plate, 'vin', v.vin,
      'first_registration_date', v.first_registration_date,
      'photo_path', v.photo_path, 'image_url', v.image_url,
      'fiche_technique', v.fiche_technique,
      'km', greatest(coalesce(v.current_mileage, 0), v.initial_mileage,
                     (select coalesce(max(m.mileage), 0) from maintenance_entries m where m.vehicle_id = v.id),
                     (select coalesce(max(c.mileage), 0) from controle_technique_entries c where c.vehicle_id = v.id))),
    'entretiens', (select coalesce(jsonb_agg(jsonb_build_object(
        'date', m.date, 'mileage', m.mileage, 'description', m.description, 'categorie', m.categorie,
        'total_cost', case when p.avec_montants then m.total_cost end,
        'facture_path', case when p.avec_factures then m.facture_path end
      ) order by m.date desc), '[]'::jsonb) from maintenance_entries m where m.vehicle_id = v.id),
    'controles', (select coalesce(jsonb_agg(jsonb_build_object(
        'date', c.date, 'mileage', c.mileage, 'validity', c.validity,
        'major_failures', c.major_failures, 'minor_failures', c.minor_failures,
        'pv_path', case when p.avec_factures then c.pv_path end
      ) order by c.date desc), '[]'::jsonb) from controle_technique_entries c where c.vehicle_id = v.id),
    'proprietaires', (select coalesce(jsonb_agg(jsonb_build_object('start_date', o.start_date, 'end_date', o.end_date)
        order by o.start_date), '[]'::jsonb) from previous_owners o where o.vehicle_id = v.id)
  )
  from partages p join vehicles v on v.id = p.vehicle_id
  where p.jeton = p_jeton and not p.revoque and p.expire_le > now()
$$;

revoke all on function public.carnet_partage(text) from public;
grant execute on function public.carnet_partage(text) to anon, authenticated;
