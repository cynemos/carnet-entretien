import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getVehicleById, deleteVehicle, deleteMaintenanceEntry, deleteControleTechniqueEntry, deletePreviousOwnerEntry } from '../utils/donnees'; // Added deletePreviousOwnerEntry
import { Vehicle } from '../types';
import { ArrowLeft, PlusCircle, Edit, Trash2, FileText, ExternalLink } from 'lucide-react';
import { format, isValid } from 'date-fns'; // Import isValid
import { fr } from 'date-fns/locale';
import Chargement from '../components/Chargement';
import sansPhoto from '../assets/sans-photo.svg';
import { libelleType } from '../utils/alertes';

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
        vehicleData.previousOwners.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
        setVehicle(vehicleData);
      } else {
        setError("Vehicle not found.");
      }
    } catch (err) {
      console.error("Error fetching vehicle:", err);
      setError("Erreur lors du chargement du véhicule.");
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


  // jsPDF n'est chargé qu'au moment de l'export
  const handleGeneratePDF = async () => {
    if (!vehicle) return;
    const { generateVehicleHistoryPdf } = await import('../utils/pdfGenerator');
    generateVehicleHistoryPdf(vehicle);
  };


  if (loading) {
    return <Chargement texte="Chargement…" />;
  }

  if (error) {
    return <div className="container mx-auto text-center text-rouille">Erreur : {error}</div>;
  }

  if (!vehicle) {
    return <div className="container mx-auto text-center text-rouille">Véhicule introuvable.</div>;
  }

  const kmActuels = Math.max(vehicle.initialMileage || 0, ...vehicle.maintenanceHistory.map(e => e.mileage || 0),
    ...vehicle.controleTechniqueHistory.map(e => e.mileage || 0));
  const dateFr = (d?: string) => d && isValid(new Date(d)) ? format(new Date(d), 'dd/MM/yyyy', { locale: fr }) : '—';

  return (
    <div className="container mx-auto">
      <Link
        to="/"
        className="flex items-center mb-4 text-accent hover:text-accent-clair transition-colors duration-200"
      >
        <ArrowLeft size={20} className="mr-2" />
        Retour au garage
      </Link>

      {/* Fiche signalétique du véhicule */}
      <section className="panneau rounded-xl p-5 md:p-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,22rem)_1fr] gap-6 lg:gap-10 items-start">
          <div className="p-2 bg-[#efe4cc] rounded-sm shadow-[0_6px_16px_rgba(0,0,0,0.6)] rotate-[-1.2deg]">
            <img src={vehicle.imageUrl || sansPhoto} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-56 object-cover sepia-[.35]" />
            <p className="font-machine text-[#3a2d20] text-center text-sm pt-2">{vehicle.make} {vehicle.model} — {vehicle.year}</p>
          </div>
          <div>
            <p className="font-titre uppercase tracking-[0.25em] text-xs text-primary/80">{libelleType(vehicle.type)}</p>
            <h2 className="titre-page !mb-4">{vehicle.make} <span className="text-light">{vehicle.model}</span></h2>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {vehicle.licensePlate && <span className="plaque text-lg">{vehicle.licensePlate}</span>}
              <span className="compteur text-xl" aria-label={`${kmActuels} km`}>
                {String(kmActuels).padStart(6, '0').split('').map((c, i) => <span key={i}>{c}</span>)}
                <span className="sep">km</span>
              </span>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-light">
              {([
                ['Année', String(vehicle.year)],
                ["Kilométrage à l'achat", `${vehicle.initialMileage.toLocaleString('fr-FR')} km`],
                ["Date d'achat", dateFr(vehicle.purchaseDate)],
                ['1re mise en circulation', dateFr(vehicle.firstRegistrationDate)],
                ['N° de série (VIN)', vehicle.vin || '—'],
                ['Entretiens enregistrés', String(vehicle.maintenanceHistory.length)],
              ] as const).map(([k, v]) => (
                <div key={k} className="border-b border-dashed border-primary/20 pb-1.5">
                  <dt className="font-titre uppercase tracking-wider text-[0.7rem] text-primary/80">{k}</dt>
                  <dd className="font-machine break-all">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-3 mt-6">
              {vehicle.carteGriseGoogleDriveLink && (
                <a href={vehicle.carteGriseGoogleDriveLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-accent/50 text-accent hover:bg-accent/10 font-titre uppercase tracking-wider text-sm">
                  Carte grise <ExternalLink size={16} />
                </a>
              )}
              <Link to={`/edit-vehicle/${vehicle.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-primary/50 text-primary hover:bg-primary/10 font-titre uppercase tracking-wider text-sm">
                <Edit size={16} /> Modifier
              </Link>
              <button onClick={handleDeleteVehicle} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-rouille/60 text-rouille hover:bg-rouille/10 font-titre uppercase tracking-wider text-sm">
                <Trash2 size={16} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Maintenance History Section */}
      <div className="panneau rounded-lg p-4 md:p-6 mb-8 border border-primary/30">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h3 className="text-xl md:text-2xl font-titre uppercase tracking-wider text-primary">Historique de Maintenance</h3>
          <div className="flex flex-wrap gap-2">
             <button
              onClick={handleGeneratePDF}
              className="bg-accent hover:brightness-110 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
            >
              <FileText size={18} className="mr-2"/> Exporter PDF
            </button>
            <Link
              to={`/vehicle/${vehicleId}/add-maintenance`}
              className="bg-primary text-secondary font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
            >
              <PlusCircle size={18} className="mr-2"/> Ajouter Entrée
            </Link>
          </div>
        </div>

        {vehicle.maintenanceHistory.length === 0 ? (
          <p className="text-light">Aucune entrée de maintenance enregistrée pour ce véhicule.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-cartes min-w-full text-light text-sm md:text-base">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Date</th>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Kilométrage</th>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Description</th>
                  <th className="py-2 px-4 border-b border-primary/30 text-right">Coût Total</th>
                   <th className="py-2 px-4 border-b border-primary/30 text-left">Documents</th>
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
                        className="text-primary hover:text-primary-fonce mr-3"
                        title="Modifier"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDeleteMaintenance(entry.id)}
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

       {/* Controle Technique History Section */}
      <div className="panneau rounded-lg p-4 md:p-6 mb-8 border border-primary/30">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h3 className="text-xl md:text-2xl font-titre uppercase tracking-wider text-primary">Historique Contrôle Technique</h3>
           <div className="flex flex-wrap gap-2">
             {/* Add CT PDF Export Button Here if needed */}
            <Link
              to={`/vehicle/${vehicleId}/add-controle-technique`}
              className="bg-primary text-secondary font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
            >
              <PlusCircle size={18} className="mr-2"/> Ajouter CT
            </Link>
          </div>
        </div>

        {vehicle.controleTechniqueHistory.length === 0 ? (
          <p className="text-light">Aucune entrée de Contrôle Technique enregistrée pour ce véhicule.</p>
        ) : (
           <div className="overflow-x-auto">
            <table className="table-cartes min-w-full text-light text-sm md:text-base">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Date</th>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Kilométrage</th>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Validité</th>
                  <th className="py-2 px-4 border-b border-primary/30 text-left">Défauts Majeurs</th>
                   <th className="py-2 px-4 border-b border-primary/30 text-left">Document</th>
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
                        className="text-primary hover:text-primary-fonce mr-3"
                        title="Modifier"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDeleteControleTechnique(entry.id)}
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

       {/* Previous Owners Section */}
       <div className="panneau rounded-lg p-4 md:p-6 mb-8 border border-primary/30">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h3 className="text-xl md:text-2xl font-titre uppercase tracking-wider text-primary">Propriétaires Précédents</h3>
           <div className="flex flex-wrap gap-2">
            <Link
              to={`/vehicle/${vehicleId}/add-previous-owner`}
              className="bg-primary text-secondary font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
            >
              <PlusCircle size={18} className="mr-2"/> Ajouter Propriétaire
            </Link>
          </div>
        </div>

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
                          className="text-primary hover:text-primary-fonce mr-3"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeletePreviousOwner(owner.id)} // Implement delete function
                          className="text-rouille hover:text-rouille"
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
