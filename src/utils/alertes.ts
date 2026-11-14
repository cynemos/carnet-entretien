import { addMonths, addYears, format, isBefore, isValid, parse, parseISO } from 'date-fns';
import { Vehicle } from '../types';

// urgent : échéance dépassée ; bientot : moins de 3 mois ; info : rien d'enregistré ou validité illisible
export type NiveauAlerte = 'urgent' | 'bientot' | 'info';
export interface Alerte { niveau: NiveauAlerte; message: string }

const FORMATS_DATE = ['dd/MM/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy', 'dd.MM.yyyy', 'dd/MM/yy'];

// La validité du CT est un texte libre : le plus souvent une date (« 26/11/2026 »),
// parfois « 2 ans » ou « contre visite ». Sinon : date du CT + périodicité du véhicule.
const echeanceCT = (dateCT: string, validite: string, intervalleAns: number): Date | null => {
  const texte = validite.trim();
  for (const f of FORMATS_DATE) {
    const d = parse(texte, f, new Date());
    if (isValid(d) && d.getFullYear() > 1900) return d;
  }
  const base = parseISO(dateCT);
  if (!isValid(base)) return null;
  if (/contre[\s-]?visite/i.test(texte)) return addMonths(base, 2);
  const ans = texte.match(/(\d+)\s*ans?/i);
  return addYears(base, ans ? Number(ans[1]) : intervalleAns);
};

const plusRecent = <T extends { date: string }>(liste: T[]): T | undefined =>
  [...liste].sort((a, b) => b.date.localeCompare(a.date))[0];

const jour = (d: Date) => format(d, 'dd/MM/yyyy');
const km = (n: number) => `${n.toLocaleString('fr-FR')} km`;

const situer = (echeance: Date, aujourdhui: Date) =>
  isBefore(echeance, aujourdhui) ? 'urgent' : isBefore(echeance, addMonths(aujourdhui, 3)) ? 'bientot' : null;

// Kilométrage le plus récent connu : relevé manuel, entretiens, CT
export const kmActuel = (v: Vehicle) => Math.max(
  v.currentMileage || 0,
  v.initialMileage || 0,
  ...v.maintenanceHistory.map(e => e.mileage || 0),
  ...v.controleTechniqueHistory.map(e => e.mileage || 0),
);

export const estVendu = (v: Vehicle) => !!v.soldDate;

export const alertesVehicule = (vehicule: Vehicle, aujourdhui = new Date()): Alerte[] => {
  if (estVendu(vehicule)) return [];
  const alertes: Alerte[] = [];

  // Entretien : tous les N mois, et/ou tous les N km
  const entretien = plusRecent(vehicule.maintenanceHistory);
  const mois = vehicule.maintenanceIntervalMonths || 12;
  if (!entretien) {
    alertes.push({ niveau: 'info', message: 'Aucun entretien enregistré.' });
  } else {
    const prochain = addMonths(parseISO(entretien.date), mois);
    const niveau = situer(prochain, aujourdhui);
    if (niveau === 'urgent') alertes.push({ niveau, message: `Entretien en retard depuis le ${jour(prochain)} (tous les ${mois} mois)` });
    if (niveau === 'bientot') alertes.push({ niveau, message: `Entretien à prévoir avant le ${jour(prochain)}` });

    const pas = vehicule.maintenanceIntervalKm;
    if (pas && entretien.mileage) {
      const prochainKm = entretien.mileage + pas;
      const reste = prochainKm - kmActuel(vehicule);
      if (reste <= 0) alertes.push({ niveau: 'urgent', message: `Entretien dû à ${km(prochainKm)} : dépassé de ${km(-reste)}` });
      else if (reste <= pas * 0.1) alertes.push({ niveau: 'bientot', message: `Entretien dans ${km(reste)} (à ${km(prochainKm)})` });
    }
  }

  const ct = plusRecent(vehicule.controleTechniqueHistory);
  if (!ct) {
    alertes.push({ niveau: 'info', message: 'Aucun contrôle technique enregistré.' });
  } else {
    const echeance = echeanceCT(ct.date, ct.validity ?? '', vehicule.ctIntervalYears || 2);
    if (!echeance) {
      alertes.push({ niveau: 'info', message: `Date du dernier CT illisible.` });
    } else {
      const niveau = situer(echeance, aujourdhui);
      if (niveau === 'urgent') alertes.push({ niveau, message: `Contrôle technique expiré depuis le ${jour(echeance)}` });
      if (niveau === 'bientot') alertes.push({ niveau, message: `Contrôle technique à repasser avant le ${jour(echeance)}` });
    }
  }
  return alertes;
};

// Nombre d'alertes qui demandent une action (badge du menu)
export const compterAlertesActives = (vehicules: Vehicle[]) =>
  vehicules.reduce((n, v) => n + alertesVehicule(v).filter(a => a.niveau !== 'info').length, 0);

// Le type est stocké en anglais (valeurs des listes déroulantes) : libellé français pour l'affichage
const TYPES: Record<string, string> = {
  Car: 'Voiture', Motorcycle: 'Moto', Truck: 'Camion', Van: 'Utilitaire', Scooter: 'Scooter', Other: 'Autre',
};
export const libelleType = (type: string) => TYPES[type] ?? type;
