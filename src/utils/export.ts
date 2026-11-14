// Exports téléchargeables : sauvegarde complète (JSON) et entretiens pour un tableur (CSV)
import { Vehicle } from '../types';
import { libelleType } from './alertes';

const aujourdhui = () => new Date().toISOString().slice(0, 10);

const telecharger = (contenu: BlobPart, type: string, nom: string) => {
  const url = URL.createObjectURL(new Blob([contenu], { type }));
  const lien = Object.assign(document.createElement('a'), { href: url, download: nom });
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exporterJSON = (vehicules: Vehicle[]) =>
  telecharger(JSON.stringify({ exporteLe: new Date().toISOString(), vehicules }, null, 2),
    'application/json', `carnets-entretien-${aujourdhui()}.json`);

// Format attendu par Excel en français : séparateur « ; », virgule décimale, BOM UTF-8
const cellule = (v: unknown) => {
  const texte = typeof v === 'number' ? String(v).replace('.', ',') : String(v ?? '');
  return /[;"\n\r]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
};

export const exporterCSV = (vehicules: Vehicle[]) => {
  const entetes = ['Véhicule', 'Type', 'Plaque', 'Date', 'Kilométrage', 'Description', 'Pièces (€)', "Main-d'œuvre (€)", 'Total (€)'];
  const lignes = vehicules.flatMap(v => [...v.maintenanceHistory]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(e => [`${v.year} ${v.make} ${v.model}`, libelleType(v.type), v.licensePlate ?? '', e.date, e.mileage,
      e.description, e.partsCost, e.laborCost, e.totalCost]));
  const csv = [entetes, ...lignes].map(l => l.map(cellule).join(';')).join('\r\n');
  telecharger('﻿' + csv, 'text/csv;charset=utf-8', `entretiens-${aujourdhui()}.csv`);
};
