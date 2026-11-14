import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVehicleById, deletePreviousOwnerEntry } from '../utils/donnees';
import { Vehicle } from '../types';
import { ArrowLeft, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { format, isValid } from 'date-fns';
import Chargement from '../components/Chargement';
import { fr } from 'date-fns/locale';

const PreviousOwners: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicleData = async () => {
    if (!vehicleId) {
      setError("Vehicle ID is missing.");
      setLoading(false);
      return;
    }
    try {
      const vehicleData = await getVehicleById(vehicleId);
      if (vehicleData) {
        // Sort previous owners by end date descending
        vehicleData.previousOwners.sort((a, b) => new Date(b.endDate || b.startDate).getTime() - new Date(a.endDate || a.startDate).getTime()); // Sort by end date, fallback to start date
        setVehicle(vehicleData);
      } else {
        setError("Vehicle not found.");
      }
    } catch (err) {
      console.error("Error fetching vehicle data:", err);
      setError("Erreur lors du chargement du véhicule.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleData();
  }, [vehicleId]); // Re-fetch if vehicleId changes

  const handleDeletePreviousOwner = async (entryId: string) => {
    if (vehicleId && confirm("Êtes-vous sûr de vouloir supprimer cette entrée de propriétaire précédent ?")) {
      try {
        await deletePreviousOwnerEntry(vehicleId, entryId);
        console.log('Previous owner entry deleted successfully!');
        // Refresh the list
        fetchVehicleData();
      } catch (error) {
        console.error('Error deleting previous owner entry:', error);
        // Handle error
      }
    }
  };

  if (loading) {
    return <Chargement texte="Chargement…" />;
  }

  if (error) {
    return <div className="container mx-auto text-center text-rouille">Erreur : {error}</div>;
  }

  if (!vehicle) {
    return <div className="container mx-auto text-center text-rouille">Véhicule introuvable. Impossible de charger les propriétaires précédents.</div>;
  }

   // Helper to calculate duration
   const calculateDuration = (startDateStr: string, endDateStr: string | undefined) => {
    const startDate = new Date(startDateStr);
    const endDate = endDateStr ? new Date(endDateStr) : new Date(); // Use current date if no end date

    if (!isValid(startDate) || (endDateStr && !isValid(endDate))) {
        return 'Dates invalides';
    }

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} jour(s)`;

    const years = Math.floor(diffDays / 365);
    const remainingDaysAfterYears = diffDays % 365;
    const months = Math.floor(remainingDaysAfterYears / 30); // Simple month calculation

    const durationParts = [];
    if (years > 0) durationParts.push(`${years} an(s)`);
    if (months > 0) durationParts.push(`${months} mois`);

    if (durationParts.length === 0) return 'Moins d\'un mois';

    return durationParts.join(' ');
  };


  return (
    <div className="container mx-auto">
      <Link
        to={`/vehicle/${vehicleId}`} // Link back to the specific vehicle detail page
        className="flex items-center mb-4 text-accent hover:text-accent-clair transition-colors duration-200"
      >
        <ArrowLeft size={20} className="mr-2" />
        Retour aux détails du véhicule
      </Link>

      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h2 className="titre-page !mb-0">Propriétaires Précédents pour {vehicle.make} {vehicle.model}</h2>
        <Link
          to={`/vehicle/${vehicleId}/add-previous-owner`}
          className="bg-primary text-secondary font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
        >
          <PlusCircle size={18} className="mr-2"/> Ajouter Propriétaire
        </Link>
      </div>

      <div className="panneau rounded-lg p-4 md:p-6 border border-primary/30">
        {vehicle.previousOwners.length === 0 ? (
          <p className="text-light">Aucun ancien propriétaire enregistré pour ce véhicule.</p>
        ) : (
           <div className="overflow-x-auto">
            <table className="table-cartes min-w-full text-light text-sm md:text-base">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Nom</th>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Date Début</th>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Date Fin</th>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Durée</th>
                  <th className="py-2 px-4 border-b border-primary/30 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicle.previousOwners.map(owner => (
                    <tr key={owner.id} className="hover:bg-primary/10">
                      <td className="py-2 px-4 border-b border-primary/30" data-label="Nom">{owner.name || '-'}</td>
                      {/* Check if startDate is valid before formatting */}
                      <td className="py-2 px-4 border-b border-primary/30" data-label="Date Début">{isValid(new Date(owner.startDate)) ? format(new Date(owner.startDate), 'dd/MM/yyyy', { locale: fr }) : 'Date invalide'}</td>
                      {/* Check if endDate is valid before formatting */}
                      <td className="py-2 px-4 border-b border-primary/30" data-label="Date Fin">{owner.endDate && isValid(new Date(owner.endDate)) ? format(new Date(owner.endDate), 'dd/MM/yyyy', { locale: fr }) : '-'}</td>
                      <td className="py-2 px-4 border-b border-primary/30" data-label="Durée">{calculateDuration(owner.startDate, owner.endDate)}</td>
                      <td className="py-2 px-4 border-b border-primary/30 text-right" data-label="Actions">
                        <Link
                          to={`/vehicle/${vehicleId}/edit-previous-owner/${owner.id}`}
                          className="text-primary hover:text-primary-fonce mr-3"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeletePreviousOwner(owner.id)}
                          className="text-rouille hover:text-rouille"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviousOwners;
