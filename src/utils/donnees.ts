// Accès aux données (Supabase). Remplace l'ancien firebaseData.ts : mêmes fonctions, mêmes
// signatures, pour que les pages n'aient pas à changer. Les historiques, autrefois des listes
// dans le document du véhicule, sont des tables séparées ; on les recharge avec le véhicule.
import { supabase } from '../lib/supabase';
import { Vehicle, MaintenanceEntry, ControleTechniqueEntry, PreviousOwner } from '../types';

type Ligne = Record<string, any>;

const SELECTION = '*, maintenance_entries(*), controle_technique_entries(*), previous_owners(*)';

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
  googleDriveLink1: l.drive_link_1 ?? undefined,
  googleDriveLink2: l.drive_link_2 ?? undefined,
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
});

const versProprietaire = (l: Ligne): PreviousOwner => ({
  id: l.id,
  name: l.name ?? undefined,
  startDate: date(l.start_date),
  endDate: date(l.end_date),
});

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
  maintenanceHistory: [...(l.maintenance_entries ?? [])].sort(parCreation).map(versEntretien),
  controleTechniqueHistory: [...(l.controle_technique_entries ?? [])].sort(parCreation).map(versControle),
  previousOwners: [...(l.previous_owners ?? [])].sort(parCreation).map(versProprietaire),
});

type ChampsVehicule = Partial<Omit<Vehicle, 'id' | 'maintenanceHistory' | 'controleTechniqueHistory' | 'previousOwners'>>;

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
  return l;
};

const ligneEntretien = (e: Partial<MaintenanceEntry>): Ligne => ({
  date: e.date,
  mileage: nombre(e.mileage),
  description: e.description ?? '',
  parts_cost: nombre(e.partsCost),
  labor_cost: nombre(e.laborCost),
  drive_link_1: ouNull(e.googleDriveLink1),
  drive_link_2: ouNull(e.googleDriveLink2),
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

export const addVehicle = async (vehicle: Omit<Vehicle, 'id' | 'maintenanceHistory' | 'controleTechniqueHistory' | 'previousOwners'>): Promise<string> => {
  const ligne = verifier(await supabase.from('vehicles').insert(ligneVehicule(vehicle)).select('id').single());
  return (ligne as Ligne).id;
};

export const updateVehicle = async (vehicleId: string, updatedVehicle: ChampsVehicule): Promise<void> => {
  verifier(await supabase.from('vehicles').update(ligneVehicule(updatedVehicle)).eq('id', vehicleId));
};

export const deleteVehicle = async (vehicleId: string): Promise<void> => {
  verifier(await supabase.from('vehicles').delete().eq('id', vehicleId));
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
  verifier(await supabase.from('maintenance_entries').delete().eq('id', entryId).eq('vehicle_id', vehicleId));
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
  verifier(await supabase.from('controle_technique_entries').delete().eq('id', entryId).eq('vehicle_id', vehicleId));
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
