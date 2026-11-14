import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Vehicle } from '../types';
import { getVehicles } from '../utils/donnees';
import { alertesVehicule, Alerte, NiveauAlerte } from '../utils/alertes';
import { AlertTriangle, Clock, Info, CheckCircle2 } from 'lucide-react';
import Chargement from '../components/Chargement';

const ORDRE: Record<NiveauAlerte, number> = { urgent: 0, bientot: 1, info: 2 };

const STYLE: Record<NiveauAlerte, { icone: React.ReactNode; classe: string; etiquette: string }> = {
  urgent: { icone: <AlertTriangle size={18} />, classe: 'text-rouille', etiquette: 'En retard' },
  bientot: { icone: <Clock size={18} />, classe: 'text-primary', etiquette: 'Bientôt' },
  info: { icone: <Info size={18} />, classe: 'text-light/60', etiquette: 'À noter' },
};

const Alerts: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVehicles()
      .then(setVehicles)
      .catch(err => {
        console.error('Erreur de chargement des alertes :', err);
        setError("Erreur lors du chargement des données d'alertes.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Véhicules qui ont au moins une alerte, les plus urgents d'abord
  const liste = useMemo(() => vehicles
    .map(vehicle => {
      const alertes = alertesVehicule(vehicle).sort((a, b) => ORDRE[a.niveau] - ORDRE[b.niveau]);
      return { vehicle, alertes, pire: alertes[0]?.niveau };
    })
    .filter((x): x is { vehicle: Vehicle; alertes: Alerte[]; pire: NiveauAlerte } => x.alertes.length > 0)
    .sort((a, b) => ORDRE[a.pire] - ORDRE[b.pire]), [vehicles]);

  if (loading) return <Chargement texte="Inspection de la flotte…" />;
  if (error) return <div className="text-center text-rouille">{error}</div>;

  return (
    <div className="container mx-auto">
      <h2 className="titre-page">Alertes</h2>

      {vehicles.length === 0 ? (
        <p className="text-center text-light">Aucun véhicule ajouté pour le moment.</p>
      ) : liste.length === 0 ? (
        <div className="panneau rounded-lg p-6 flex items-center gap-3 text-accent">
          <CheckCircle2 size={28} /> Tout est à jour : entretiens et contrôles techniques en règle.
        </div>
      ) : (
        <div className="space-y-5">
          {liste.map(({ vehicle, alertes, pire }) => (
            <div key={vehicle.id} className={`panneau rounded-lg p-4 md:p-5 border-l-4 ${pire === 'urgent' ? 'border-l-rouille' : pire === 'bientot' ? 'border-l-primary' : 'border-l-light/20'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <Link to={`/vehicle/${vehicle.id}`} className="text-lg md:text-xl font-titre uppercase tracking-wide text-light hover:text-primary">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </Link>
                {vehicle.licensePlate && <span className="plaque text-xs">{vehicle.licensePlate}</span>}
              </div>
              <ul className="space-y-2">
                {alertes.map((a, i) => (
                  <li key={i} className={`flex items-start gap-2 ${STYLE[a.niveau].classe}`}>
                    <span className="mt-0.5 flex-shrink-0">{STYLE[a.niveau].icone}</span>
                    <span className="text-light/90">
                      <span className={`tampon mr-2 ${STYLE[a.niveau].classe}`}>{STYLE[a.niveau].etiquette}</span>
                      {a.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
