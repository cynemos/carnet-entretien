import React from 'react';
import { Vehicle } from '../types';

export type Suivi = Pick<Vehicle, 'currentMileage' | 'ctIntervalYears' | 'maintenanceIntervalMonths' | 'maintenanceIntervalKm' | 'soldDate'>;

export const SUIVI_PAR_DEFAUT: Suivi = { ctIntervalYears: 2, maintenanceIntervalMonths: 12 };

const entier = (v: string) => (v === '' ? undefined : Math.max(0, Math.round(Number(v))));

// Réglages de suivi d'un véhicule : compteur, échéances, vente
const ChampsSuivi: React.FC<{ valeur: Suivi; onChange: (v: Partial<Suivi>) => void }> = ({ valeur, onChange }) => (
  <fieldset className="border border-primary/25 rounded-lg p-4 space-y-4">
    <legend className="px-2 font-titre uppercase tracking-wider text-sm text-primary">Suivi et échéances</legend>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label className="block">
        <span>Kilométrage actuel</span>
        <input type="number" min={0} inputMode="numeric" className="input w-full mt-1" placeholder="Dernier relevé du compteur"
          value={valeur.currentMileage ?? ''} onChange={e => onChange({ currentMileage: entier(e.target.value) })} />
      </label>
      <label className="block">
        <span>Contrôle technique</span>
        <select className="input w-full mt-1" value={valeur.ctIntervalYears}
          onChange={e => onChange({ ctIntervalYears: Number(e.target.value) })}>
          <option value={2}>Tous les 2 ans</option>
          <option value={5}>Tous les 5 ans (véhicule de collection)</option>
        </select>
      </label>
      <label className="block">
        <span>Entretien tous les (mois)</span>
        <input type="number" min={1} max={60} inputMode="numeric" className="input w-full mt-1"
          value={valeur.maintenanceIntervalMonths} onChange={e => onChange({ maintenanceIntervalMonths: entier(e.target.value) || 12 })} />
      </label>
      <label className="block">
        <span>… ou tous les (km, facultatif)</span>
        <input type="number" min={1} inputMode="numeric" className="input w-full mt-1" placeholder="Ex. 6000"
          value={valeur.maintenanceIntervalKm ?? ''} onChange={e => onChange({ maintenanceIntervalKm: entier(e.target.value) || undefined })} />
      </label>
      <label className="block sm:col-span-2">
        <span>Vendu le (laisser vide s'il est toujours là)</span>
        <input type="date" className="input w-full mt-1"
          value={valeur.soldDate ?? ''} onChange={e => onChange({ soldDate: e.target.value || undefined })} />
      </label>
    </div>
  </fieldset>
);

export default ChampsSuivi;
