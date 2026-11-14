-- v1.4.0 : kilométrage actuel, échéances réglables par véhicule, statut « vendu »,
-- fichiers (photo, carte grise, factures, procès-verbaux) stockés sur le serveur.

alter table public.vehicles
  add column if not exists current_mileage integer,                         -- dernier relevé du compteur
  add column if not exists ct_interval_years integer not null default 2,    -- 5 pour un véhicule de collection
  add column if not exists maintenance_interval_months integer not null default 12,
  add column if not exists maintenance_interval_km integer,                 -- facultatif : entretien tous les N km
  add column if not exists sold_date date,                                  -- renseignée = véhicule vendu, plus d'alertes
  add column if not exists photo_path text,                                 -- chemin dans le dossier de stockage « carnet »
  add column if not exists carte_grise_path text;

alter table public.maintenance_entries add column if not exists facture_path text;
alter table public.controle_technique_entries add column if not exists pv_path text;

alter table public.vehicles drop constraint if exists vehicles_intervalles_positifs;
alter table public.vehicles add constraint vehicles_intervalles_positifs check (
  ct_interval_years between 1 and 10
  and maintenance_interval_months between 1 and 60
  and (maintenance_interval_km is null or maintenance_interval_km > 0)
);

-- Dossier de stockage privé : lecture par lien signé, réservé aux utilisateurs connectés.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('carnet', 'carnet', false, 20971520,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
on conflict (id) do nothing;

drop policy if exists "carnet_lecture" on storage.objects;
create policy "carnet_lecture" on storage.objects
  for select to authenticated using (bucket_id = 'carnet');

drop policy if exists "carnet_ajout" on storage.objects;
create policy "carnet_ajout" on storage.objects
  for insert to authenticated with check (bucket_id = 'carnet');

drop policy if exists "carnet_modification" on storage.objects;
create policy "carnet_modification" on storage.objects
  for update to authenticated using (bucket_id = 'carnet');

drop policy if exists "carnet_suppression" on storage.objects;
create policy "carnet_suppression" on storage.objects
  for delete to authenticated using (bucket_id = 'carnet');
