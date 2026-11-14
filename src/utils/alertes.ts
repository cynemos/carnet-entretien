import { addMonths, addYears, format, isBefore, isValid, parse, parseISO } from 'date-fns';
import { Vehicle } from '../types';

// urgent : échéance dépassée ; bientot : moins de 3 mois ; info : rien d'enregistré ou validité illisible
export type NiveauAlerte = 'urgent' | 'bientot' | 'info';
export interface Alerte { niveau: NiveauAlerte; message: string }

const FORMATS_DATE = ['dd/MM/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy', 'dd.MM.yyyy', 'dd/MM/yy'];

// La validité du CT est un texte libre : le plus souvent une date (« 26/11/2026 »),
// parfois « 2 ans » ou « contre visite ».
const echeanceCT = (dateCT: string, validite: string): Date | null => {
  const texte = validite.trim();
  for (const f of FORMATS_DATE) {
    const d = parse(texte, f, new Date());
    if (isValid(d) && d.getFullYear() > 1900) return d;
  }
  const base = parseISO(dateCT);
  if (!isValid(base)) return null;
  if (/contre[\s-]?visite/i.test(texte)) return addMonths(base, 2);
  const ans = texte.match(/(\d+)\s*ans?/i);
  if (ans) return addYears(base, Number(ans[1]));
  return null;
};

const plusRecent = <T extends { date: string }>(liste: T[]): T | undefined =>
  [...liste].sort((a, b) => b.date.localeCompare(a.date))[0];

const jour = (d: Date) => format(d, 'dd/MM/yyyy');

const situer = (echeance: Date, aujourdhui: Date) =>
  isBefore(echeance, aujourdhui) ? 'urgent' : isBefore(echeance, addMonths(aujourdhui, 3)) ? 'bientot' : null;

export const alertesVehicule = (vehicule: Vehicle, aujourdhui = new Date()): Alerte[] => {
  const alertes: Alerte[] = [];

  // Entretien conseillé une fois par an
  const entretien = plusRecent(vehicule.maintenanceHistory);
  if (!entretien) {
    alertes.push({ niveau: 'info', message: 'Aucun entretien enregistré.' });
  } else {
    const prochain = addYears(parseISO(entretien.date), 1);
    const niveau = situer(prochain, aujourdhui);
    if (niveau === 'urgent') alertes.push({ niveau, message: `Entretien annuel en retard depuis le ${jour(prochain)}` });
    if (niveau === 'bientot') alertes.push({ niveau, message: `Entretien annuel à prévoir avant le ${jour(prochain)}` });
  }

  const ct = plusRecent(vehicule.controleTechniqueHistory);
  if (!ct) {
    alertes.push({ niveau: 'info', message: 'Aucun contrôle technique enregistré.' });
  } else {
    const echeance = echeanceCT(ct.date, ct.validity ?? '');
    if (!echeance) {
      alertes.push({ niveau: 'info', message: `Validité du dernier CT illisible : « ${ct.validity} »` });
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
