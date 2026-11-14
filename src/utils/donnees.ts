// Accès aux données (Supabase). Remplace l'ancien firebaseData.ts : mêmes fonctions, mêmes
// signatures, pour que les pages n'aient pas à changer. Les historiques, autrefois des listes
// dans le document du véhicule, sont des tables séparées ; on les recharge avec le véhicule.
import { supabase } from '../lib/supabase';
import { supprimerFichiers, supprimerFichiersVehicule } from './fichiers';
import { Vehicle, MaintenanceEntry, ControleTechniqueEntry, PreviousOwner, Depense, Travail, PhotoGalerie, Partage, LigneFiche } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- lignes brutes renvoyées par PostgREST
type Ligne = Record<string, any>;

const SELECTION = '*, maintenance_entries(*), controle_technique_entries(*), previous_owners(*), depenses(*), travaux(*), photos(*)';

// Chaîne vide → null (champ facultatif laissé vide dans un formulaire)
const ouNull = (v: unknown) => (v === undefined || v === null || v === '' ? null : v);
// Les pages comparent des chaînes 'AAAA-MM-JJ' : on garde '' plutôt que null pour une date absente.
const date = (v: unknown) => (typeof v === 'string' ? v : '');
const nombre = (v: unknown) => (v === null || v === undefined || v === '' ? 0 : Number(v));

const parCreation = (a: Ligne, b: Ligne) => String(a.created_at).localeCompare(String(b.created_at));

const versEntretien = (l: Ligne): MaintenanceEntry => ({
  id: l.id,
  date: date(l.date),
  mileage: nombre(l.mileage),
  description: l.description ?? '',
  partsCost: nombre(l.parts_cost),
  laborCost: nombre(l.labor_cost),
  totalCost: nombre(l.total_cost),
  categorie: l.categorie ?? 'autre',
  googleDriveLink1: l.drive_link_1 ?? undefined,
  googleDriveLink2: l.drive_link_2 ?? undefined,
  facturePath: l.facture_path ?? undefined,
});

const versControle = (l: Ligne): ControleTechniqueEntry => ({
  id: l.id,
  date: date(l.date),
  mileage: nombre(l.mileage),
  validity: l.validity ?? '',
  minorFailures: l.minor_failures ?? undefined,
  majorFailures: l.major_failures ?? undefined,
  ripage: l.ripage ?? undefined,
  suspensionAsymmetry: l.suspension_asymmetry ?? undefined,
  verticalForces: l.vertical_forces ?? undefined,
  serviceBrake: l.service_brake ?? undefined,
  parkingBrake: l.parking_brake ?? undefined,
  exhaustEmissions: l.exhaust_emissions ?? undefined,
  headlights: l.headlights ?? undefined,
  googleDriveLink: l.drive_link ?? undefined,
  pvPath: l.pv_path ?? undefined,
});

const versProprietaire = (l: Ligne): PreviousOwner => ({
  id: l.id,
  name: l.name ?? undefined,
  startDate: date(l.start_date),
  endDate: date(l.end_date),
});

const versDepense = (l: Ligne): Depense => ({
  id: l.id,
  date: date(l.date),
  categorie: l.categorie ?? 'autre',
  montant: nombre(l.montant),
  libelle: l.libelle ?? '',
});

const versTravail = (l: Ligne): Travail => ({
  id: l.id,
  titre: l.titre ?? '',
  details: l.details ?? undefined,
  priorite: ([1, 2, 3].includes(l.priorite) ? l.priorite : 2) as Travail['priorite'],
  coutEstime: l.cout_estime === null || l.cout_estime === undefined ? undefined : Number(l.cout_estime),
  faitLe: l.fait_le ?? undefined,
  entretienId: l.entretien_id ?? undefined,
});

const versPhoto = (l: Ligne): PhotoGalerie => ({
  id: l.id,
  chemin: l.chemin,
  date: l.date ?? undefined,
  legende: l.legende ?? undefined,
});

const montantOuRien = (v: unknown) => (v === null || v === undefined ? undefined : Number(v));

const versVehicule = (l: Ligne): Vehicle => ({
  id: l.id,
  type: l.type ?? '',
  make: l.make ?? '',
  model: l.model ?? '',
  year: nombre(l.year),
  initialMileage: nombre(l.initial_mileage),
  purchaseDate: date(l.purchase_date),
  firstRegistrationDate: l.first_registration_date ?? undefined,
  vin: l.vin ?? undefined,
  imageUrl: l.image_url ?? undefined,
  carteGriseGoogleDriveLink: l.carte_grise_drive_link ?? undefined,
  licensePlate: l.license_plate ?? undefined,
  currentMileage: l.current_mileage ?? undefined,
  ctIntervalYears: l.ct_interval_years ?? 2,
  maintenanceIntervalMonths: l.maintenance_interval_months ?? 12,
  maintenanceIntervalKm: l.maintenance_interval_km ?? undefined,
  soldDate: l.sold_date ?? undefined,
  photoPath: l.photo_path ?? undefined,
  carteGrisePath: l.carte_grise_path ?? undefined,
  purchasePrice: montantOuRien(l.purchase_price),
  salePrice: montantOuRien(l.sale_price),
  ficheTechnique: Array.isArray(l.fiche_technique) ? (l.fiche_technique as LigneFiche[]) : [],
  maintenanceHistory: [...(l.maintenance_entries ?? [])].sort(parCreation).map(versEntretien),
  controleTechniqueHistory: [...(l.controle_technique_entries ?? [])].sort(parCreation).map(versControle),
  previousOwners: [...(l.previous_owners ?? [])].sort(parCreation).map(versProprietaire),
  depenses: [...(l.depenses ?? [])].sort((a: Ligne, b: Ligne) => String(b.date).localeCompare(String(a.date))).map(versDepense),
  travaux: [...(l.travaux ?? [])].sort(parCreation).map(versTravail),
  photos: [...(l.photos ?? [])].sort((a: Ligne, b: Ligne) => String(a.date ?? a.created_at).localeCompare(String(b.date ?? b.created_at))).map(versPhoto),
});

export type ChampsVehicule = Partial<Omit<Vehicle, 'id' | 'maintenanceHistory' | 'controleTechniqueHistory' | 'previousOwners' | 'depenses' | 'travaux' | 'photos'>>;

// Ne convertit que les champs présents (une mise à jour partielle ne doit rien effacer).
const ligneVehicule = (v: ChampsVehicule): Ligne => {
  const l: Ligne = {};
  const a = (cle: keyof ChampsVehicule) => Object.prototype.hasOwnProperty.call(v, cle);
  if (a('type')) l.type = v.type ?? '';
  if (a('make')) l.make = v.make ?? '';
  if (a('model')) l.model = v.model ?? '';
  if (a('year')) l.year = Number.isFinite(v.year) ? v.year : null;
  if (a('initialMileage')) l.initial_mileage = nombre(v.initialMileage) || 0;
  if (a('purchaseDate')) l.purchase_date = ouNull(v.purchaseDate);
  if (a('firstRegistrationDate')) l.first_registration_date = ouNull(v.firstRegistrationDate);
  if (a('vin')) l.vin = ouNull(v.vin);
  if (a('imageUrl')) l.image_url = ouNull(v.imageUrl);
  if (a('carteGriseGoogleDriveLink')) l.carte_grise_drive_link = ouNull(v.carteGriseGoogleDriveLink);
  if (a('licensePlate')) l.license_plate = ouNull(v.licensePlate);
  if (a('currentMileage')) l.current_mileage = ouNull(v.currentMileage);
  if (a('ctIntervalYears')) l.ct_interval_years = nombre(v.ctIntervalYears) || 2;
  if (a('maintenanceIntervalMonths')) l.maintenance_interval_months = nombre(v.maintenanceIntervalMonths) || 12;
  if (a('maintenanceIntervalKm')) l.maintenance_interval_km = ouNull(v.maintenanceIntervalKm);
  if (a('soldDate')) l.sold_date = ouNull(v.soldDate);
  if (a('photoPath')) l.photo_path = ouNull(v.photoPath);
  if (a('carteGrisePath')) l.carte_grise_path = ouNull(v.carteGrisePath);
  if (a('purchasePrice')) l.purchase_price = ouNull(v.purchasePrice);
  if (a('salePrice')) l.sale_price = ouNull(v.salePrice);
  if (a('ficheTechnique')) l.fiche_technique = (v.ficheTechnique ?? []).filter(f => f.libelle.trim() || f.valeur.trim());
  return l;
};

const ligneEntretien = (e: Partial<MaintenanceEntry>): Ligne => ({
  date: e.date,
  mileage: nombre(e.mileage),
  description: e.description ?? '',
  parts_cost: nombre(e.partsCost),
  labor_cost: nombre(e.laborCost),
  categorie: e.categorie || 'autre',
  drive_link_1: ouNull(e.googleDriveLink1),
  drive_link_2: ouNull(e.googleDriveLink2),
  facture_path: ouNull(e.facturePath),
});

const ligneControle = (e: Partial<ControleTechniqueEntry>): Ligne => ({
  date: e.date,
  mileage: nombre(e.mileage),
  validity: e.validity ?? '',
  minor_failures: ouNull(e.minorFailures),
  major_failures: ouNull(e.majorFailures),
  ripage: ouNull(e.ripage),
  suspension_asymmetry: ouNull(e.suspensionAsymmetry),
  vertical_forces: ouNull(e.verticalForces),
  service_brake: ouNull(e.serviceBrake),
  parking_brake: ouNull(e.parkingBrake),
  exhaust_emissions: ouNull(e.exhaustEmissions),
  headlights: ouNull(e.headlights),
  drive_link: ouNull(e.googleDriveLink),
  pv_path: ouNull(e.pvPath),
});

const ligneProprietaire = (e: Partial<PreviousOwner>): Ligne => ({
  name: ouNull(e.name),
  start_date: ouNull(e.startDate),
  end_date: ouNull(e.endDate),
});

// Lève une erreur lisible si Supabase répond une erreur
function verifier<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

// Véhicules

export const getVehicles = async (): Promise<Vehicle[]> => {
  const lignes = verifier(await supabase.from('vehicles').select(SELECTION).order('created_at'));
  return (lignes ?? []).map(versVehicule);
};

export const getVehicleById = async (vehicleId: string): Promise<Vehicle | undefined> => {
  const ligne = verifier(await supabase.from('vehicles').select(SELECTION).eq('id', vehicleId).maybeSingle());
  return ligne ? versVehicule(ligne) : undefined;
};

export const addVehicle = async (vehicle: ChampsVehicule): Promise<string> => {
  const ligne = verifier(await supabase.from('vehicles').insert(ligneVehicule(vehicle)).select('id').single());
  return (ligne as Ligne).id;
};

export const updateVehicle = async (vehicleId: string, updatedVehicle: ChampsVehicule): Promise<void> => {
  verifier(await supabase.from('vehicles').update(ligneVehicule(updatedVehicle)).eq('id', vehicleId));
};

export const deleteVehicle = async (vehicleId: string): Promise<void> => {
  verifier(await supabase.from('vehicles').delete().eq('id', vehicleId));
  // Fichiers du véhicule : un échec ici ne doit pas faire croire que la suppression a échoué
  await supprimerFichiersVehicule(vehicleId).catch(() => undefined);
};

// Entretiens

export const addMaintenanceEntry = async (vehicleId: string, entry: Omit<MaintenanceEntry, 'id' | 'totalCost'>): Promise<string> => {
  const ligne = verifier(await supabase.from('maintenance_entries')
    .insert({ ...ligneEntretien(entry), vehicle_id: vehicleId }).select('id').single());
  return (ligne as Ligne).id;
};

export const updateMaintenanceEntry = async (vehicleId: string, updatedEntry: MaintenanceEntry): Promise<void> => {
  verifier(await supabase.from('maintenance_entries').update(ligneEntretien(updatedEntry))
    .eq('id', updatedEntry.id).eq('vehicle_id', vehicleId));
};

export const deleteMaintenanceEntry = async (vehicleId: string, entryId: string): Promise<void> => {
  const lignes = verifier(await supabase.from('maintenance_entries').delete().eq('id', entryId).eq('vehicle_id', vehicleId).select('facture_path')) as Ligne[];
  await supprimerFichiers((lignes ?? []).map(l => l.facture_path)).catch(() => undefined);
};

// Contrôles techniques
// Le 3e paramètre (fichier de rapport) est ignoré : l'envoi de fichiers n'était plus utilisé,
// les rapports sont des liens Google Drive. Le 4e (lien Drive) était ignoré par l'ancienne
// version à l'ajout : il est maintenant enregistré.

export const addControleTechniqueEntry = async (
  vehicleId: string,
  entry: Omit<ControleTechniqueEntry, 'id'>,
  _reportFile?: File,
  googleDriveLink?: string,
): Promise<string> => {
  const ligne = verifier(await supabase.from('controle_technique_entries')
    .insert({ ...ligneControle({ ...entry, googleDriveLink: googleDriveLink ?? entry.googleDriveLink }), vehicle_id: vehicleId })
    .select('id').single());
  return (ligne as Ligne).id;
};

export const updateControleTechniqueEntry = async (vehicleId: string, updatedEntry: ControleTechniqueEntry, _reportFile?: File): Promise<void> => {
  verifier(await supabase.from('controle_technique_entries').update(ligneControle(updatedEntry))
    .eq('id', updatedEntry.id).eq('vehicle_id', vehicleId));
};

export const deleteControleTechniqueEntry = async (vehicleId: string, entryId: string): Promise<void> => {
  const lignes = verifier(await supabase.from('controle_technique_entries').delete().eq('id', entryId).eq('vehicle_id', vehicleId).select('pv_path')) as Ligne[];
  await supprimerFichiers((lignes ?? []).map(l => l.pv_path)).catch(() => undefined);
};

// Anciens propriétaires

export const addPreviousOwnerEntry = async (vehicleId: string, entry: Omit<PreviousOwner, 'id' | 'duration'>): Promise<string> => {
  const ligne = verifier(await supabase.from('previous_owners')
    .insert({ ...ligneProprietaire(entry), vehicle_id: vehicleId }).select('id').single());
  return (ligne as Ligne).id;
};

export const updatePreviousOwnerEntry = async (vehicleId: string, updatedEntry: PreviousOwner): Promise<void> => {
  verifier(await supabase.from('previous_owners').update(ligneProprietaire(updatedEntry))
    .eq('id', updatedEntry.id).eq('vehicle_id', vehicleId));
};

export const deletePreviousOwnerEntry = async (vehicleId: string, entryId: string): Promise<void> => {
  verifier(await supabase.from('previous_owners').delete().eq('id', entryId).eq('vehicle_id', vehicleId));
};

// Frais annexes

const ligneDepense = (d: Omit<Depense, 'id'>): Ligne => ({
  date: d.date,
  categorie: d.categorie || 'autre',
  montant: nombre(d.montant),
  libelle: d.libelle ?? '',
});

export const ajouterDepense = async (vehicleId: string, d: Omit<Depense, 'id'>) => {
  verifier(await supabase.from('depenses').insert({ ...ligneDepense(d), vehicle_id: vehicleId }));
};

export const supprimerDepense = async (id: string) => {
  verifier(await supabase.from('depenses').delete().eq('id', id));
};

// Travaux à faire

const ligneTravail = (t: Partial<Travail>): Ligne => {
  const l: Ligne = {};
  if ('titre' in t) l.titre = t.titre ?? '';
  if ('details' in t) l.details = ouNull(t.details);
  if ('priorite' in t) l.priorite = t.priorite ?? 2;
  if ('coutEstime' in t) l.cout_estime = ouNull(t.coutEstime);
  if ('faitLe' in t) l.fait_le = ouNull(t.faitLe);
  if ('entretienId' in t) l.entretien_id = ouNull(t.entretienId);
  return l;
};

export const ajouterTravail = async (vehicleId: string, t: Omit<Travail, 'id'>) => {
  verifier(await supabase.from('travaux').insert({ ...ligneTravail(t), vehicle_id: vehicleId }));
};

export const modifierTravail = async (id: string, t: Partial<Omit<Travail, 'id'>>) => {
  verifier(await supabase.from('travaux').update(ligneTravail(t)).eq('id', id));
};

export const supprimerTravail = async (id: string) => {
  verifier(await supabase.from('travaux').delete().eq('id', id));
};

// Galerie photo

export const ajouterPhoto = async (vehicleId: string, p: Omit<PhotoGalerie, 'id'>) => {
  verifier(await supabase.from('photos').insert({ vehicle_id: vehicleId, chemin: p.chemin, date: ouNull(p.date), legende: ouNull(p.legende) }));
};

export const modifierPhoto = async (id: string, p: Pick<PhotoGalerie, 'date' | 'legende'>) => {
  verifier(await supabase.from('photos').update({ date: ouNull(p.date), legende: ouNull(p.legende) }).eq('id', id));
};

export const supprimerPhoto = async (id: string) => {
  const lignes = verifier(await supabase.from('photos').delete().eq('id', id).select('chemin')) as Ligne[];
  await supprimerFichiers((lignes ?? []).map(l => l.chemin)).catch(() => undefined);
};

// Liens de partage en lecture seule

const versPartage = (l: Ligne): Partage => ({
  id: l.id,
  jeton: l.jeton,
  expireLe: l.expire_le,
  revoque: !!l.revoque,
  avecMontants: !!l.avec_montants,
  avecFactures: !!l.avec_factures,
  createdAt: l.created_at,
});

export const listerPartages = async (vehicleId: string): Promise<Partage[]> => {
  const lignes = verifier(await supabase.from('partages')
    .select('id, jeton, expire_le, revoque, avec_montants, avec_factures, created_at')
    .eq('vehicle_id', vehicleId).order('created_at', { ascending: false })) as Ligne[];
  return (lignes ?? []).map(versPartage);
};

export const creerPartage = async (vehicleId: string, p: { expireLe: string; avecMontants: boolean; avecFactures: boolean; fichiers: Record<string, string> }) => {
  const ligne = verifier(await supabase.from('partages').insert({
    vehicle_id: vehicleId, expire_le: p.expireLe, avec_montants: p.avecMontants, avec_factures: p.avecFactures, fichiers: p.fichiers,
  }).select('jeton').single()) as Ligne;
  return ligne.jeton as string;
};

export const revoquerPartage = async (id: string) => {
  verifier(await supabase.from('partages').update({ revoque: true, fichiers: {} }).eq('id', id));
};

// Lecture publique d'un carnet partagé (aucune connexion nécessaire)
export const lirePartage = async (jeton: string) => {
  const { data, error } = await supabase.rpc('carnet_partage', { p_jeton: jeton });
  if (error) throw new Error(error.message);
  return data as Ligne | null;
};

// Restauration d'une sauvegarde JSON : n'ajoute que ce qui manque (mêmes identifiants),
// ne modifie ni ne supprime rien de ce qui existe déjà.
export const restaurerSauvegarde = async (vehicules: Vehicle[]) => {
  const bilan = { vehicules: 0, lignes: 0 };
  const inserer = async (table: string, lignes: Ligne[]) => {
    if (!lignes.length) return 0;
    const r = verifier(await supabase.from(table).upsert(lignes, { onConflict: 'id', ignoreDuplicates: true }).select('id')) as Ligne[];
    return (r ?? []).length;
  };
  for (const v of vehicules) {
    const { maintenanceHistory, controleTechniqueHistory, previousOwners, depenses, travaux, photos, id, ...champs } = v;
    bilan.vehicules += await inserer('vehicles', [{ ...ligneVehicule(champs), id }]);
    bilan.lignes += await inserer('maintenance_entries', (maintenanceHistory ?? []).map(e => ({ ...ligneEntretien(e), id: e.id, vehicle_id: id })));
    bilan.lignes += await inserer('controle_technique_entries', (controleTechniqueHistory ?? []).map(e => ({ ...ligneControle(e), id: e.id, vehicle_id: id })));
    bilan.lignes += await inserer('previous_owners', (previousOwners ?? []).map(e => ({ ...ligneProprietaire(e), id: e.id, vehicle_id: id })));
    bilan.lignes += await inserer('depenses', (depenses ?? []).map(e => ({ ...ligneDepense(e), id: e.id, vehicle_id: id })));
    bilan.lignes += await inserer('travaux', (travaux ?? []).map(e => ({ ...ligneTravail(e), id: e.id, vehicle_id: id })));
    bilan.lignes += await inserer('photos', (photos ?? []).map(e => ({ chemin: e.chemin, date: ouNull(e.date), legende: ouNull(e.legende), id: e.id, vehicle_id: id })));
  }
  return bilan;
};
