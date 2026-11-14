import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, ExternalLink } from 'lucide-react'; // Import ExternalLink
import { getVehicleById, deleteControleTechniqueEntry } from '../utils/donnees';
import { Vehicle, ControleTechniqueEntry } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const VehicleControleTechniqueHistory: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!vehicleId) {
        setError("Vehicle ID is missing.");
        setLoading(false);
        return;
      }
      try {
        const vehicleData = await getVehicleById(vehicleId);
        if (vehicleData) {
          setVehicle(vehicleData);
        } else {
          setError("Vehicle not found.");
        }
      } catch (err) {
        console.error("Error fetching vehicle:", err);
        setError("Failed to load vehicle data.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [vehicleId]);

  const handleDeleteControleTechnique = async (entryId: string) => {
    if (!vehicleId || !confirm("Are you sure you want to delete this Controle Technique entry?")) {
      return;
    }
    try {
      await deleteControleTechniqueEntry(vehicleId, entryId);
      // Refetch vehicle data to update the list
      const updatedVehicle = await getVehicleById(vehicleId);
      if (updatedVehicle) {
        setVehicle(updatedVehicle);
      }
    } catch (err) {
      console.error("Error deleting Controle Technique entry:", err);
      alert("Failed to delete Controle Technique entry.");
    }
  };


  if (loading) {
    return <div className="text-center text-light">Chargement de l'historique CT...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!vehicle) {
    return <div className="text-center text-red-500">Véhicule non trouvé.</div>;
  }

  const sortedHistory = vehicle.controleTechniqueHistory
    ? [...vehicle.controleTechniqueHistory].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    : [];

  return (
    <div className="container mx-auto p-4">
      <Link
        to={`/vehicle/${vehicleId}`}
        className="flex items-center mb-4 text-accent hover:text-blue-400 transition-colors duration-200"
      >
        <ArrowLeft size={20} className="mr-2" />
        Retour au véhicule
      </Link>

      <h1 className="text-2xl font-bold text-primary mb-6">Historique Contrôle Technique - {vehicle.make} {vehicle.model}</h1>

      {sortedHistory.length > 0 ? (
        <div className="space-y-4">
          {sortedHistory.map((entry) => (
            <div key={entry.id} className="bg-secondary p-4 rounded-md shadow-md flex flex-wrap justify-between items-center gap-3">
              <div>
                <p className="text-light font-semibold">{format(parseISO(entry.date), 'dd/MM/yyyy', { locale: fr })} - {entry.mileage} km</p>
                <p className="text-gray-400 text-sm">Validité: {entry.validity}</p>
                {entry.minorFailures && <p className="text-gray-400 text-sm">Défauts mineurs: {entry.minorFailures}</p>}
                {entry.majorFailures && <p className="text-gray-400 text-sm">Défauts majeurs: {entry.majorFailures}</p>}
                {entry.ripage && <p className="text-gray-400 text-sm">Ripage: {entry.ripage}</p>}
                {entry.suspensionAsymmetry && <p className="text-gray-400 text-sm">Déséquilibre suspension: {entry.suspensionAsymmetry}</p>}
                {entry.verticalForces && <p className="text-gray-400 text-sm">Forces verticales: {entry.verticalForces}</p>}
                {entry.serviceBrake && <p className="text-gray-400 text-sm">Frein de service: {entry.serviceBrake}</p>}
                {entry.parkingBrake && <p className="text-gray-400 text-sm">Frein de stationnement: {entry.parkingBrake}</p>}
                {entry.exhaustEmissions && <p className="text-gray-400 text-sm">Émissions d'échappement: {entry.exhaustEmissions}</p>}
                {entry.headlights && <p className="text-gray-400 text-sm">Réglage phares: {entry.headlights}</p>}
                 {entry.reportUrl && ( // Display report link if URL exists
                    <p className="text-gray-400 text-sm flex items-center mt-2">
                      Rapport CT:
                      <a
                        href={entry.reportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline ml-1 flex items-center"
                      >
                        Voir <ExternalLink size={14} className="ml-1" />
                      </a>
                    </p>
                  )}
              </div>
              <div className="flex flex-wrap gap-2">
                 <Link
                    to={`/vehicle/${vehicleId}/edit-controle-technique/${entry.id}`}
                    className="text-blue-400 hover:text-blue-500"
                    title="Modifier"
                  >
                    <Edit size={20} />
                  </Link>
                <button
                  onClick={() => handleDeleteControleTechnique(entry.id)}
                  className="text-red-400 hover:text-red-500"
                  title="Supprimer"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400">Aucun historique de Contrôle Technique enregistré pour ce véhicule.</p>
      )}
    </div>
  );
};

export default VehicleControleTechniqueHistory;
