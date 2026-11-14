
export interface Vehicle {
  id: string;
  type: string; // e.g., 'Voiture', 'Moto', 'Camion', 'Scooter'
  make: string;
  model: string;
  year: number;
  initialMileage: number;
  purchaseDate: string; // ISO date string 'YYYY-MM-DD'
  firstRegistrationDate?: string; // ISO date string 'YYYY-MM-DD' - Optional
  vin?: string; // Optional VIN
  imageUrl?: string; // Optional URL for vehicle image
  carteGriseGoogleDriveLink?: string; // Optional Google Drive link for carte grise
  licensePlate?: string; // New: Optional license plate field
  currentMileage?: number; // dernier relevé du compteur
  ctIntervalYears: number; // 2 en général, 5 pour un véhicule de collection
  maintenanceIntervalMonths: number;
  maintenanceIntervalKm?: number;
  soldDate?: string; // renseignée = véhicule vendu
  photoPath?: string; // chemin dans le stockage du serveur
  carteGrisePath?: string;
  purchasePrice?: number; // prix d'achat (€)
  salePrice?: number; // prix de vente (€), avec soldDate
  ficheTechnique: LigneFiche[]; // aide-mémoire : huile, pneus, références…
  maintenanceHistory: MaintenanceEntry[];
  controleTechniqueHistory: ControleTechniqueEntry[];
  previousOwners: PreviousOwner[];
  depenses: Depense[];
  travaux: Travail[];
  photos: PhotoGalerie[];
}

export interface LigneFiche {
  libelle: string;
  valeur: string;
}

// Frais hors entretien : assurance, carte grise, stockage, carburant…
export interface Depense {
  id: string;
  date: string;
  categorie: string;
  montant: number;
  libelle: string;
}

// Travail à faire ; une fois fait, il peut pointer vers l'entretien correspondant
export interface Travail {
  id: string;
  titre: string;
  details?: string;
  priorite: 1 | 2 | 3;
  coutEstime?: number;
  faitLe?: string;
  entretienId?: string;
}

export interface PhotoGalerie {
  id: string;
  chemin: string;
  date?: string;
  legende?: string;
}

export interface Partage {
  id: string;
  jeton: string;
  expireLe: string;
  revoque: boolean;
  avecMontants: boolean;
  avecFactures: boolean;
  createdAt: string;
}

export interface MaintenanceEntry {
  id: string;
  date: string; // ISO date string 'YYYY-MM-DD'
  mileage: number;
  description: string;
  partsCost: number;
  laborCost: number;
  totalCost: number; // Calculated: partsCost + laborCost
  categorie: string; // code de src/utils/categories.ts
  invoiceUrl?: string; // URL to the invoice file in storage (if using storage - kept for backward compatibility if needed)
  googleDriveLink1?: string; // Optional Google Drive link 1
  googleDriveLink2?: string; // Optional Google Drive link 2
  facturePath?: string; // facture stockée sur le serveur
}

export interface ControleTechniqueEntry {
  id: string;
  date: string; // ISO date string 'YYYY-MM-DD'
  mileage: number;
  validity: string; // e.g., '2 ans', 'Contre-visite'
  minorFailures?: string;
  majorFailures?: string;
  ripage?: string; // e.g., '1.5 m/km'
  suspensionAsymmetry?: string; // e.g., '5%'
  verticalForces?: string; // e.g., '250 daN'
  serviceBrake?: string; // e.g., '300 daN'
  parkingBrake?: string; // e.g., '150 daN'
  exhaustEmissions?: string; // e.g., '0.5%'
  headlights?: string; // e.g., 'OK'
  reportUrl?: string; // URL to the report file in storage (if using storage)
  googleDriveLink?: string; // Optional Google Drive link for CT report
  pvPath?: string; // procès-verbal stocké sur le serveur
}

export interface PreviousOwner {
  id: string;
  name?: string;
  startDate: string; // ISO date string 'YYYY-MM-DD'
  endDate: string; // ISO date string 'YYYY-MM-DD'
  duration?: string; // Calculated duration (e.g., '2 ans 3 mois')
}

// Champs saisis dans les formulaires Ajouter / Modifier un véhicule
export type FormulaireVehicule = Omit<Vehicle, 'id' | 'maintenanceHistory' | 'controleTechniqueHistory' | 'previousOwners' | 'depenses' | 'travaux' | 'photos' | 'ficheTechnique'>;
