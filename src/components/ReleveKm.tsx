import React, { useState } from 'react';
import { Gauge, Check, X } from 'lucide-react';
import { updateVehicle } from '../utils/donnees';

// Saisie rapide du kilométrage relevé au compteur, depuis la fiche
const ReleveKm: React.FC<{ vehicleId: string; actuel: number; onEnregistre: () => void }> = ({ vehicleId, actuel, onEnregistre }) => {
  const [ouvert, setOuvert] = useState(false);
  const [valeur, setValeur] = useState(String(actuel));
  const [erreur, setErreur] = useState<string | null>(null);

  const enregistrer = async (e: React.FormEvent) => {
    e.preventDefault();
    const km = Math.round(Number(valeur));
    if (!Number.isFinite(km) || km < 0) { setErreur('Kilométrage invalide.'); return; }
    if (km < actuel && !confirm(`${km} km est inférieur au dernier relevé (${actuel} km). Enregistrer quand même ?`)) return;
    try {
      await updateVehicle(vehicleId, { currentMileage: km });
      setOuvert(false);
      onEnregistre();
    } catch {
      setErreur("Enregistrement impossible.");
    }
  };

  if (!ouvert) {
    return (
      <button type="button" onClick={() => { setValeur(String(actuel)); setErreur(null); setOuvert(true); }}
        className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-clair font-titre uppercase tracking-wider">
        <Gauge size={16} /> Relever le compteur
      </button>
    );
  }
  return (
    <form onSubmit={enregistrer} className="flex items-center gap-2">
      <input type="number" min={0} inputMode="numeric" autoFocus value={valeur} onChange={e => setValeur(e.target.value)}
        className="input w-32 !p-1.5" aria-label="Kilométrage relevé" />
      <span className="text-light/60 text-sm">km</span>
      <button type="submit" aria-label="Enregistrer" className="p-1.5 rounded bg-primary"><Check size={16} /></button>
      <button type="button" aria-label="Annuler" onClick={() => setOuvert(false)} className="p-1.5 text-light/60 hover:text-rouille"><X size={16} /></button>
      {erreur && <span className="text-rouille text-sm">{erreur}</span>}
    </form>
  );
};

export default ReleveKm;
