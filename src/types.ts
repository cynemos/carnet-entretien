
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
  maintenanceHistory: MaintenanceEntry[];
  controleTechniqueHistory: ControleTechniqueEntry[];
  previousOwners: PreviousOwner[];
}

export interface MaintenanceEntry {
  id: string;
  date: string; // ISO date string 'YYYY-MM-DD'
  mileage: number;
  description: string;
  partsCost: number;
  laborCost: number;
  totalCost: number; // Calculated: partsCost + laborCost
  invoiceUrl?: string; // URL to the invoice file in storage (if using storage - kept for backward compatibility if needed)
  googleDriveLink1?: string; // Optional Google Drive link 1
  googleDriveLink2?: string; // Optional Google Drive link 2
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
}

export interface PreviousOwner {
  id: string;
  name?: string;
  startDate: string; // ISO date string 'YYYY-MM-DD'
  endDate: string; // ISO date string 'YYYY-MM-DD'
  duration?: string; // Calculated duration (e.g., '2 ans 3 mois')
}
