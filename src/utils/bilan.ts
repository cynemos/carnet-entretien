// Calculs de bilan d'un véhicule, communs à la fiche et aux statistiques
import { Vehicle } from '../types';
import { kmActuel } from './alertes';

const valide = (d?: string) => !!d && !Number.isNaN(new Date(d).getTime());

export const totalEntretien = (v: Vehicle) => v.maintenanceHistory.reduce((s, e) => s + (e.totalCost || 0), 0);
export const totalPieces = (v: Vehicle) => v.maintenanceHistory.reduce((s, e) => s + (e.partsCost || 0), 0);
export const totalMainOeuvre = (v: Vehicle) => v.maintenanceHistory.reduce((s, e) => s + (e.laborCost || 0), 0);
export const totalFrais = (v: Vehicle) => v.depenses.reduce((s, d) => s + (d.montant || 0), 0);

// Fin de possession : date de vente, sinon aujourd'hui
export const finPossession = (v: Vehicle) => (v.soldDate && valide(v.soldDate) ? new Date(v.soldDate) : new Date());

export const anneesPossession = (v: Vehicle) => {
  if (!valide(v.purchaseDate)) return 0;
  return Math.max(0, (finPossession(v).getTime() - new Date(v.purchaseDate).getTime()) / (365.25 * 86_400_000));
};

export const kmParcourus = (v: Vehicle) => Math.max(0, kmActuel(v) - (v.initialMileage || 0));

export interface Bilan {
  entretien: number;
  frais: number;
  achat?: number;
  vente?: number;
  // Achat + entretien + frais − vente : ce que le véhicule a réellement coûté
  coutTotal: number;
  // Vente − achat − entretien − frais (seulement si vendu avec un prix)
  resultatVente?: number;
  coutKm?: number;
  coutAn?: number;
  annees: number;
  km: number;
}

export const bilanVehicule = (v: Vehicle): Bilan => {
  const entretien = totalEntretien(v);
  const frais = totalFrais(v);
  const annees = anneesPossession(v);
  const km = kmParcourus(v);
  const coutTotal = (v.purchasePrice ?? 0) + entretien + frais - (v.salePrice ?? 0);
  return {
    entretien, frais, annees, km, coutTotal,
    achat: v.purchasePrice,
    vente: v.salePrice,
    resultatVente: v.salePrice !== undefined && v.purchasePrice !== undefined ? v.salePrice - v.purchasePrice - entretien - frais : undefined,
    // Coût d'usage (sans l'achat) : entretien et frais rapportés aux km et aux années
    coutKm: km > 0 ? (entretien + frais) / km : undefined,
    coutAn: annees >= 0.25 ? (entretien + frais) / annees : undefined,
  };
};

// Relevés connus (date, km) triés : achat, entretiens, CT
export const releves = (v: Vehicle) => {
  const points = [
    ...(valide(v.purchaseDate) ? [{ t: new Date(v.purchaseDate).getTime(), km: v.initialMileage || 0 }] : []),
    ...v.maintenanceHistory.filter(e => valide(e.date) && e.mileage > 0).map(e => ({ t: new Date(e.date).getTime(), km: e.mileage })),
    ...v.controleTechniqueHistory.filter(c => valide(c.date) && c.mileage > 0).map(c => ({ t: new Date(c.date).getTime(), km: c.mileage })),
  ].sort((a, b) => a.t - b.t);
  // Le relevé du compteur n'a pas de date : on le place aujourd'hui (ou à la vente) s'il dépasse le reste
  const dernier = points[points.length - 1];
  if (v.currentMileage && (!dernier || v.currentMileage > dernier.km)) {
    points.push({ t: Math.max(finPossession(v).getTime(), dernier?.t ?? 0), km: v.currentMileage });
  }
  // Un compteur ne recule pas : on lisse les saisies incohérentes
  let max = 0;
  return points.map(p => ({ t: p.t, km: (max = Math.max(max, p.km)) }));
};

// Kilométrage estimé à une date (interpolation linéaire entre deux relevés)
const kmA = (pts: { t: number; km: number }[], t: number) => {
  if (!pts.length || t <= pts[0].t) return pts[0]?.km ?? 0;
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i].t) {
      const a = pts[i - 1], b = pts[i];
      return b.t === a.t ? b.km : a.km + ((b.km - a.km) * (t - a.t)) / (b.t - a.t);
    }
  }
  return pts[pts.length - 1].km;
};

// Km parcourus par année civile, entre le premier et le dernier relevé
export const kmParAnnee = (v: Vehicle): Record<number, number> => {
  const pts = releves(v);
  if (pts.length < 2) return {};
  const debut = new Date(pts[0].t).getFullYear(), fin = new Date(pts[pts.length - 1].t).getFullYear();
  const resultat: Record<number, number> = {};
  for (let a = debut; a <= fin; a++) {
    const t1 = Math.max(pts[0].t, new Date(a, 0, 1).getTime());
    const t2 = Math.min(pts[pts.length - 1].t, new Date(a + 1, 0, 1).getTime());
    resultat[a] = Math.round(kmA(pts, t2) - kmA(pts, t1));
  }
  return resultat;
};

// Dépenses (entretien + frais) par année civile
export const depensesParAnnee = (v: Vehicle): Record<number, number> => {
  const r: Record<number, number> = {};
  const ajouter = (d: string, m: number) => {
    if (!valide(d)) return;
    const a = new Date(d).getFullYear();
    r[a] = (r[a] ?? 0) + m;
  };
  v.maintenanceHistory.forEach(e => ajouter(e.date, e.totalCost || 0));
  v.depenses.forEach(d => ajouter(d.date, d.montant || 0));
  return r;
};

export const euros = (n: number, decimales = 0) =>
  n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: decimales, maximumFractionDigits: decimales });
