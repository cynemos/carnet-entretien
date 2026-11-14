import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getVehicleById, deleteVehicle, deleteMaintenanceEntry, deleteControleTechniqueEntry, deletePreviousOwnerEntry } from '../utils/donnees'; // Added deletePreviousOwnerEntry
import { Vehicle, MaintenanceEntry, ControleTechniqueEntry, PreviousOwner } from '../types'; // Added PreviousOwner
import { ArrowLeft, PlusCircle, Edit, Trash2, FileText, ExternalLink } from 'lucide-react';
import { format, isValid } from 'date-fns'; // Import isValid
import { fr } from 'date-fns/locale';
import { generateVehicleHistoryPdf } from '../utils/pdfGenerator'; // Corrected import name

const VehicleDetail: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicle = async () => {
    if (!vehicleId) {
      setError("Vehicle ID is missing.");
      setLoading(false);
      return;
    }
    try {
      const vehicleData = await getVehicleById(vehicleId);
      if (vehicleData) {
        // Sort maintenance and CT history by date descending
        vehicleData.maintenanceHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        vehicleData.controleTechniqueHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        // Sort previous owners by end date descending
        vehicleData.previousOwners.sort((a, b) => new Date(b.endDate).getTime() - new Date(b.endDate).getTime()); // Fixed sort key
        setVehicle(vehicleData);
      } else {
        setError("Vehicle not found.");
      }
    } catch (err) {
      console.error("Error fetching vehicle:", err);
      setError("Failed to load vehicle details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicle();
  }, [vehicleId]);

  const handleDeleteVehicle = async () => {
    if (vehicleId && confirm("Êtes-vous sûr de vouloir supprimer ce véhicule et toutes ses données ?")) {
      try {
        await deleteVehicle(vehicleId);
        console.log('Vehicle deleted successfully!');
        navigate('/'); // Navigate back to the vehicle list
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        // Handle error
      }
    }
  };

  const handleDeleteMaintenance = async (entryId: string) => {
    if (vehicleId && confirm("Êtes-vous sûr de vouloir supprimer cette entrée de maintenance ?")) {
      try {
        await deleteMaintenanceEntry(vehicleId, entryId);
        console.log('Maintenance entry deleted successfully!');
        // Refresh the vehicle data
        fetchVehicle();
      } catch (error) {
        console.error('Error deleting maintenance entry:', error);
        // Handle error
      }
    }
  };

   const handleDeleteControleTechnique = async (entryId: string) => {
    if (vehicleId && confirm("Êtes-vous sûr de vouloir supprimer cette entrée de Contrôle Technique ?")) {
      try {
        await deleteControleTechniqueEntry(vehicleId, entryId);
        console.log('Contrôle Technique entry deleted successfully!');
        // Refresh the vehicle data
        fetchVehicle();
      } catch (error) {
        console.error('Error deleting Contrôle Technique entry:', error);
        // Handle error
      }
    }
  };

  const handleDeletePreviousOwner = async (entryId: string) => {
    if (vehicleId && confirm("Êtes-vous sûr de vouloir supprimer cette entrée de propriétaire précédent ?")) {
      try {
        await deletePreviousOwnerEntry(vehicleId, entryId);
        console.log('Previous owner entry deleted successfully!');
        // Refresh the vehicle data
        fetchVehicle();
      } catch (error) {
        console.error('Error deleting previous owner entry:', error);
        // Handle error
      }
    }
  };


  const handleGeneratePDF = () => {
    if (vehicle) {
      generateVehicleHistoryPdf(vehicle); // Corrected function call
    }
  };


  if (loading) {
    return <div className="container mx-auto text-center text-light">Chargement...</div>;
  }

  if (error) {
    return <div className="container mx-auto text-center text-danger">Erreur : {error}</div>;
  }

  if (!vehicle) {
    return <div className="container mx-auto text-center text-danger">Véhicule introuvable.</div>;
  }

  return (
    <div className="container mx-auto">
      <Link
        to="/"
        className="flex items-center mb-4 text-accent hover:text-blue-400 transition-colors duration-200"
      >
        <ArrowLeft size={20} className="mr-2" />
        Retour à la liste des véhicules
      </Link>

      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-primary">{vehicle.make} {vehicle.model} ({vehicle.year})</h2>
        <div className="flex flex-wrap gap-2">
           <button
            onClick={handleDeleteVehicle}
            className="bg-danger hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
          >
            <Trash2 size={18} className="mr-2"/> Supprimer Véhicule
          </button>
        </div>
      </div>

      <div className="bg-secondary rounded-lg shadow-lg p-4 md:p-6 mb-8 border border-primary/30">
        <h3 className="text-xl md:text-2xl font-semibold text-primary mb-4">Informations Générales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-light">
          <p><strong>Type:</strong> {vehicle.type}</p>
          <p><strong>Marque:</strong> {vehicle.make}</p>
          <p><strong>Modèle:</strong> {vehicle.model}</p>
          <p><strong>Année:</strong> {vehicle.year}</p>
          <p><strong>Kilométrage Initial:</strong> {vehicle.initialMileage} km</p>
          {/* Check if purchaseDate is valid before formatting */}
          <p><strong>Date d'achat:</strong> {isValid(new Date(vehicle.purchaseDate)) ? format(new Date(vehicle.purchaseDate), 'dd/MM/yyyy', { locale: fr }) : 'Date invalide'}</p>
           {vehicle.firstRegistrationDate && (
             // Check if firstRegistrationDate is valid before formatting
             <p><strong>1ère mise en circulation:</strong> {isValid(new Date(vehicle.firstRegistrationDate)) ? format(new Date(vehicle.firstRegistrationDate), 'dd/MM/yyyy', { locale: fr }) : 'Date invalide'}</p>
           )}
          {vehicle.vin && <p><strong>VIN:</strong> {vehicle.vin}</p>}
          {/* New: Display License Plate */}
          {vehicle.licensePlate && <p><strong>Plaque:</strong> {vehicle.licensePlate}</p>}
          {/* Display Carte Grise Google Drive Link */}
          {vehicle.carteGriseGoogleDriveLink && (
            <p className="md:col-span-2">
              <strong>Carte Grise:</strong>{' '}
              <a
                href={vehicle.carteGriseGoogleDriveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline flex items-center inline-flex" // Use inline-flex to keep icon next to text
              >
                Voir sur Google Drive <ExternalLink size={16} className="ml-1"/>
              </a>
            </p>
          )}
          {vehicle.imageUrl && (
            <div className="md:col-span-2">
              <strong>Image:</strong> <img src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="mt-2 max-h-40 rounded-md"/>
            </div>
          )}
        </div>
      </div>

      {/* Maintenance History Section */}
      <div className="bg-secondary rounded-lg shadow-lg p-4 md:p-6 mb-8 border border-primary/30">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h3 className="text-xl md:text-2xl font-semibold text-primary">Historique de Maintenance</h3>
          <div className="flex flex-wrap gap-2">
             <button
              onClick={handleGeneratePDF}
              className="bg-accent hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
            >
              <FileText size={18} className="mr-2"/> Exporter PDF
            </button>
            <Link
              to={`/vehicle/${vehicleId}/add-maintenance`}
              className="bg-primary hover:bg-orange-600 text-secondary font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
            >
              <PlusCircle size={18} className="mr-2"/> Ajouter Entrée
            </Link>
          </div>
        </div>

        {vehicle.maintenanceHistory.length === 0 ? (
          <p className="text-light">Aucune entrée de maintenance enregistrée pour ce véhicule.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-cartes min-w-full bg-secondary text-light text-sm md:text-base">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Date</th>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Kilométrage</th>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Description</th>
                  <th className="py-2 px-4 border-b border-primary/30 text-right">Coût Total</th>
                   <th className="py-2 px-4 border-b border-primary/30 text-left">Documents</th> {/* Updated column header */}
                  <th className="py-2 px-4 border-b border-primary/30 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicle.maintenanceHistory.map(entry => (
                  <tr key={entry.id} className="hover:bg-primary/10">
                    {/* Check if entry.date is valid before formatting */}
                    <td className="py-2 px-4 border-b border-primary/30" data-label="Date">{isValid(new Date(entry.date)) ? format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr }) : 'Date invalide'}</td>
                    <td className="py-2 px-4 border-b border-primary/30" data-label="Kilométrage">{entry.mileage} km</td>
                    <td className="py-2 px-4 border-b border-primary/30" data-label="Description">{entry.description}</td>
                    <td className="py-2 px-4 border-b border-primary/30 text-right" data-label="Coût Total">{entry.totalCost.toFixed(2)} €</td>
                     <td className="py-2 px-4 border-b border-primary/30" data-label="Documents">
                      {/* Display the two Google Drive links if they exist */}
                      {entry.googleDriveLink1 && (
                        <a href={entry.googleDriveLink1} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center mb-1">
                          Facture GDrive 1 <ExternalLink size={16} className="ml-1"/>
                        </a>
                      )}
                       {entry.googleDriveLink2 && (
                        <a href={entry.googleDriveLink2} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center mb-1">
                          Facture GDrive 2 <ExternalLink size={16} className="ml-1"/>
                        </a>
                      )}
                       {/* Keep GCS link display for backward compatibility if needed */}
                       {entry.invoiceUrl && (
                        <a href={entry.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center">
                          Facture GCS <ExternalLink size={16} className="ml-1"/>
                        </a>
                      )}
                       {!entry.googleDriveLink1 && !entry.googleDriveLink2 && !entry.invoiceUrl && '-'} {/* Display '-' if no links */}
                    </td>
                    <td className="py-2 px-4 border-b border-primary/30 text-right" data-label="Actions">
                      <Link
                        to={`/vehicle/${vehicleId}/edit-maintenance/${entry.id}`}
                        className="text-primary hover:text-orange-600 mr-3"
                        title="Modifier"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDeleteMaintenance(entry.id)}
                        className="text-danger hover:text-red-700"
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

       {/* Controle Technique History Section */}
      <div className="bg-secondary rounded-lg shadow-lg p-4 md:p-6 mb-8 border border-primary/30">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h3 className="text-xl md:text-2xl font-semibold text-primary">Historique Contrôle Technique</h3>
           <div className="flex flex-wrap gap-2">
             {/* Add CT PDF Export Button Here if needed */}
            <Link
              to={`/vehicle/${vehicleId}/add-controle-technique`}
              className="bg-primary hover:bg-orange-600 text-secondary font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
            >
              <PlusCircle size={18} className="mr-2"/> Ajouter CT
            </Link>
          </div>
        </div>

        {vehicle.controleTechniqueHistory.length === 0 ? (
          <p className="text-light">Aucune entrée de Contrôle Technique enregistrée pour ce véhicule.</p>
        ) : (
           <div className="overflow-x-auto">
            <table className="table-cartes min-w-full bg-secondary text-light text-sm md:text-base">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Date</th>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Kilométrage</th>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Validité</th>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Défauts Majeurs</th>
                   <th className="py-2 px-4 border-b border-primary/30 text-left">Document</th> {/* New column */}
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicle.controleTechniqueHistory.map(entry => (
                  <tr key={entry.id} className="hover:bg-primary/10">
                    {/* Check if entry.date is valid before formatting */}
                    <td className="py-2 px-4 border-b border-primary/30" data-label="Date">{isValid(new Date(entry.date)) ? format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr }) : 'Date invalide'}</td>
                    <td className="py-2 px-4 border-b border-primary/30" data-label="Kilométrage">{entry.mileage} km</td>
                    <td className="py-2 px-4 border-b border-primary/30" data-label="Validité">{entry.validity}</td>
                    <td className="py-2 px-4 border-b border-primary/30" data-label="Défauts Majeurs">{entry.majorFailures || '-'}</td>
                     <td className="py-2 px-4 border-b border-primary/30" data-label="Document">
                       {entry.reportUrl && (
                        <a href={entry.reportUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center">
                          Rapport GCS <ExternalLink size={16} className="ml-1"/>
                        </a>
                      )}
                       {entry.googleDriveLink && (
                        <a href={entry.googleDriveLink} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center">
                          Rapport GDrive <ExternalLink size={16} className="ml-1"/>
                        </a>
                      )}
                       {!entry.reportUrl && !entry.googleDriveLink && '-'}
                    </td> {/* Display link */}
                    <td className="py-2 px-4 border-b border-primary/30 text-right" data-label="Actions">
                       <Link
                        to={`/vehicle/${vehicleId}/edit-controle-technique/${entry.id}`}
                        className="text-primary hover:text-orange-600 mr-3"
                        title="Modifier"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDeleteControleTechnique(entry.id)}
                        className="text-danger hover:text-red-700"
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

       {/* Previous Owners Section */}
       <div className="bg-secondary rounded-lg shadow-lg p-4 md:p-6 mb-8 border border-primary/30">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h3 className="text-xl md:text-2xl font-semibold text-primary">Propriétaires Précédents</h3>
           <div className="flex flex-wrap gap-2">
            <Link
              to={`/vehicle/${vehicleId}/add-previous-owner`}
              className="bg-primary hover:bg-orange-600 text-secondary font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
            >
              <PlusCircle size={18} className="mr-2"/> Ajouter Propriétaire
            </Link>
          </div>
        </div>

        {vehicle.previousOwners.length === 0 ? (
          <p className="text-light">Aucun ancien propriétaire enregistré pour ce véhicule.</p>
        ) : (
           <div className="overflow-x-auto">
            <table className="table-cartes min-w-full bg-secondary text-light text-sm md:text-base">
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
                {vehicle.previousOwners.map(owner => {
                   const startDate = new Date(owner.startDate);
                   const endDate = new Date(owner.endDate);
                   // Calculate duration (simple approximation)
                   const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                   const years = Math.floor(diffDays / 365);
                   const months = Math.floor(((diffDays % 365) / 30)); // Simple month calculation

                  const durationParts = [];
                  if (years > 0) durationParts.push(`${years} an(s)`);
                  if (months > 0) durationParts.push(`${months} mois`);
                  const duration = durationParts.length > 0 ? durationParts.join(' ') : 'Moins d\'un mois';


                  return (
                    <tr key={owner.id} className="hover:bg-primary/10">
                      <td className="py-2 px-4 border-b border-primary/30" data-label="Nom">{owner.name || '-'}</td>
                      {/* Check if startDate is valid before formatting */}
                      <td className="py-2 px-4 border-b border-primary/30" data-label="Date Début">{isValid(startDate) ? format(startDate, 'dd/MM/yyyy', { locale: fr }) : 'Date invalide'}</td>
                      {/* Check if endDate is valid before formatting */}
                      <td className="py-2 px-4 border-b border-primary/30" data-label="Date Fin">{isValid(endDate) ? format(endDate, 'dd/MM/yyyy', { locale: fr }) : 'Date invalide'}</td>
                      <td className="py-2 px-4 border-b border-primary/30" data-label="Durée">{duration}</td>
                      <td className="py-2 px-4 border-b border-primary/30 text-right" data-label="Actions">
                        <Link
                          to={`/vehicle/${vehicleId}/edit-previous-owner/${owner.id}`}
                          className="text-primary hover:text-orange-600 mr-3"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeletePreviousOwner(owner.id)} // Implement delete function
                          className="text-danger hover:text-red-700"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


    </div>
  );
};

export default VehicleDetail;
