import React from 'react';
import { Vehicle } from '../../types';
import { bilanVehicule, euros } from '../../utils/bilan';
import Section from './Section';

const Case: React.FC<{ titre: string; valeur: string; note?: string; ton?: 'bon' | 'mauvais' }> = ({ titre, valeur, note, ton }) => (
  <div className="rounded-md bg-black/25 border border-primary/20 px-4 py-3">
    <dt className="font-titre uppercase tracking-wider text-[0.7rem] text-primary/80">{titre}</dt>
    <dd className={`font-machine text-xl mt-1 ${ton === 'bon' ? 'text-accent' : ton === 'mauvais' ? 'text-rouille' : 'text-light'}`}>{valeur}</dd>
    {note && <p className="text-xs text-light/50 mt-0.5">{note}</p>}
  </div>
);

// Ce que coûte (ou a coûté) le véhicule : achat, entretien, frais, vente, coût au km et par an
const BilanVehicule: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
  const b = bilanVehicule(vehicle);
  const annees = b.annees >= 1 ? `${b.annees.toFixed(1).replace('.', ',')} ans` : `${Math.round(b.annees * 12)} mois`;
  return (
    <Section titre="Bilan">
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Case titre="Prix d'achat" valeur={b.achat !== undefined ? euros(b.achat) : '—'} note={b.achat === undefined ? 'À saisir dans « Modifier »' : undefined} />
        <Case titre="Entretien" valeur={euros(b.entretien)} note={`${vehicle.maintenanceHistory.length} interventions`} />
        <Case titre="Frais annexes" valeur={euros(b.frais)} note="assurance, stockage…" />
        {vehicle.soldDate
          ? <Case titre="Prix de vente" valeur={b.vente !== undefined ? euros(b.vente) : '—'} />
          : <Case titre="Détenu depuis" valeur={annees} note={`${b.km.toLocaleString('fr-FR')} km parcourus`} />}
        <Case titre="Coût au km" valeur={b.coutKm !== undefined ? `${b.coutKm.toFixed(2).replace('.', ',')} €` : '—'} note="entretien + frais" />
        <Case titre="Coût par an" valeur={b.coutAn !== undefined ? euros(b.coutAn) : '—'} note="entretien + frais" />
        <Case titre="Coût total" valeur={euros(b.coutTotal)} note={vehicle.soldDate ? 'achat + dépenses − vente' : 'achat + dépenses'} />
        {b.resultatVente !== undefined
          ? <Case titre="Résultat de la vente" valeur={`${b.resultatVente >= 0 ? '+' : ''}${euros(b.resultatVente)}`}
              ton={b.resultatVente >= 0 ? 'bon' : 'mauvais'} note="vente − achat − dépenses" />
          : <Case titre="Investi au total" valeur={euros((b.achat ?? 0) + b.entretien + b.frais)} />}
      </dl>
    </Section>
  );
};

export default BilanVehicule;
