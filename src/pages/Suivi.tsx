import React, { useEffect, useState } from 'react';
import { Vehicle, MaintenanceEntry, ControleTechniqueEntry } from '../types';
import { getVehicles } from '../utils/firebaseData';

const Suivi: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getVehicles();
        setVehicles(data);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setError("Erreur lors du chargement des données de suivi.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  // Helper to find the latest entry in a history array
  const findLatestEntry = <T extends { date: string }>(history: T[]): T | undefined => {
    if (!history || history.length === 0) {
      return undefined;
    }
    // Sort by date descending and take the first one
    return history.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  if (loading) {
    return <div className="text-center text-light">Chargement des données de suivi...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto">
      <h2 className="text-3xl font-bold text-primary mb-6">Suivi des Véhicules</h2>

      {vehicles.length === 0 ? (
        <p className="text-center text-light">Aucun véhicule ajouté pour le moment.</p>
      ) : (
        <div className="space-y-8">
          {vehicles.map(vehicle => {
            const lastMaintenance = findLatestEntry(vehicle.maintenanceHistory);
            const lastControleTechnique = findLatestEntry(vehicle.controleTechniqueHistory);

            return (
              <div key={vehicle.id} className="bg-secondary rounded-lg shadow-lg p-6 border border-primary/30">
                <h3 className="text-xl font-semibold text-light mb-4">{vehicle.year} {vehicle.make} {vehicle.model}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Last Maintenance */}
                  <div>
                    <h4 className="text-lg font-medium text-primary mb-2">Dernier Entretien</h4>
                    {lastMaintenance ? (
                      <div className="text-light/80">
                        <p><strong>Date :</strong> {lastMaintenance.date}</p>
                        <p><strong>Kilométrage :</strong> {lastMaintenance.mileage} km</p>
                        <p><strong>Description :</strong> {lastMaintenance.description}</p>
                      </div>
                    ) : (
                      <p className="text-light/60">Aucun entretien enregistré.</p>
                    )}
                  </div>

                  {/* Last Controle Technique */}
                  <div>
                    <h4 className="text-lg font-medium text-primary mb-2">Dernier Contrôle Technique</h4>
                    {lastControleTechnique ? (
                      <div className="text-light/80">
                        <p><strong>Date :</strong> {lastControleTechnique.date}</p>
                         <p><strong>Kilométrage :</strong> {lastControleTechnique.mileage} km</p>
                        <p><strong>Validité :</strong> {lastControleTechnique.validity}</p>
                      </div>
                    ) : (
                      <p className="text-light/60">Aucun contrôle technique enregistré.</p>
                    )}
                  </div>

                  {/* Removed: Next Maintenance */}
                  {/* Removed: Next Controle Technique */}

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Suivi;
