import React, { useState, useEffect } from 'react';
import { ChampFichier } from '../components/Fichiers';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getVehicleById, updateMaintenanceEntry } from '../utils/donnees';
import { MaintenanceEntry } from '../types';
import Chargement from '../components/Chargement';
import { ArrowLeft } from 'lucide-react'; // Import ArrowLeft

const EditMaintenance: React.FC = () => {
  const { vehicleId, entryId } = useParams<{ vehicleId: string; entryId: string }>();
  const navigate = useNavigate();

  const [entry, setEntry] = useState<MaintenanceEntry | null>(null);
  const [date, setDate] = useState('');
  const [mileage, setMileage] = useState('');
  const [description, setDescription] = useState('');
  const [partsCost, setPartsCost] = useState('');
  const [laborCost, setLaborCost] = useState('');
  // Reverted state for two Google Drive links
  const [googleDriveLink1, setGoogleDriveLink1] = useState('');
  const [googleDriveLink2, setGoogleDriveLink2] = useState('');
  const [facturePath, setFacturePath] = useState<string | undefined>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntry = async () => {
      if (!vehicleId || !entryId) {
        setError("Vehicle ID or Entry ID is missing.");
        setLoading(false);
        return;
      }
      try {
        const vehicle = await getVehicleById(vehicleId);
        if (vehicle) {
          const foundEntry = vehicle.maintenanceHistory.find(e => e.id === entryId);
          if (foundEntry) {
            setEntry(foundEntry);
            setDate(foundEntry.date);
            setMileage(foundEntry.mileage.toString());
            setDescription(foundEntry.description);
            setPartsCost(foundEntry.partsCost.toString());
            setLaborCost(foundEntry.laborCost.toString());
            // Load existing two links
            setGoogleDriveLink1(foundEntry.googleDriveLink1 || '');
            setGoogleDriveLink2(foundEntry.googleDriveLink2 || '');
            setFacturePath(foundEntry.facturePath);
          } else {
            setError("Maintenance entry not found.");
          }
        } else {
          setError("Vehicle not found.");
        }
      } catch (err) {
        console.error("Error fetching entry:", err);
        setError("Erreur lors du chargement de l'entretien.");
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [vehicleId, entryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicleId || !entry) {
      console.error("Vehicle ID or entry data is missing.");
      return;
    }

    const updatedEntryData: MaintenanceEntry = {
      ...entry, // Keep existing fields like id, invoiceUrl
      date,
      mileage: parseInt(mileage, 10),
      description,
      partsCost: parseFloat(partsCost || '0'),
      laborCost: parseFloat(laborCost || '0'),
      totalCost: parseFloat(partsCost || '0') + parseFloat(laborCost || '0'), // Recalculate total
      // Update the two Google Drive links
      googleDriveLink1: googleDriveLink1 || undefined,
      googleDriveLink2: googleDriveLink2 || undefined,
      facturePath,
      // invoiceUrl is not updated via file upload anymore
      invoiceUrl: entry.invoiceUrl, // Keep existing GCS URL if any
    };

    try {
      // Call the updateMaintenanceEntry function
      await updateMaintenanceEntry(vehicleId, updatedEntryData);
      console.log('Maintenance entry updated successfully!');
      navigate(`/vehicle/${vehicleId}`);
    } catch (error) {
      console.error('Error updating maintenance entry:', error);
      // Handle error
    }
  };

  if (loading) {
    return <Chargement texte="Chargement…" />;
  }

  if (error) {
    return <div className="container mx-auto text-center text-rouille">Erreur : {error}</div>;
  }

  if (!entry) {
     return <div className="container mx-auto text-center text-rouille">Entrée de maintenance introuvable.</div>;
  }


  return (
    <div className="container mx-auto">
      <Link
        to={`/vehicle/${vehicleId}`}
        className="flex items-center mb-4 text-accent hover:text-accent-clair transition-colors duration-200"
      >
        <ArrowLeft size={20} className="mr-2" />
        Retour au véhicule
      </Link>

      <h2 className="titre-page">Modifier l'entrée de maintenance</h2>

      <form
        onSubmit={handleSubmit}
        className="panneau rounded-lg p-4 md:p-6 border border-primary/30"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input text-light"
            placeholder="Date de l'entretien"
            required
          />
          <input
            type="number"
            value={mileage}
            onChange={e => setMileage(e.target.value)}
            className="input text-light"
            placeholder="Kilométrage"
            required
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="input text-light md:col-span-2"
            placeholder="Description de l'entretien (ex: Vidange, changement plaquettes)"
            required
          />
          <input
            type="number"
            value={partsCost}
            onChange={e => setPartsCost(e.target.value)}
            className="input text-light"
            placeholder="Coût des pièces (€)"
            step="0.01"
          />
          <input
            type="number"
            value={laborCost}
            onChange={e => setLaborCost(e.target.value)}
            className="input text-light"
            placeholder="Coût main d'œuvre (€)"
            step="0.01"
          />
           {/* Two fields for Google Drive links */}
           <div className="md:col-span-2">
              <label htmlFor="googleDriveLink1" className="block text-light text-sm font-bold mb-2">
                Facture 1 (optionnel) : Coller un lien Google Drive existant
              </label>
              <input
                type="url" // Use type="url"
                id="googleDriveLink1"
                value={googleDriveLink1}
                onChange={e => setGoogleDriveLink1(e.target.value)}
                className="input text-light"
                placeholder="Collez le lien Google Drive ici"
              />
               {entry.googleDriveLink1 && !googleDriveLink1 && <p className="text-gray-400 text-sm mt-2">Lien Google Drive existant : <a href={entry.googleDriveLink1} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Voir</a></p>}
           </div>
            <div className="md:col-span-2">
              <label htmlFor="googleDriveLink2" className="block text-light text-sm font-bold mb-2">
                Facture 2 (optionnel) : Coller un lien Google Drive existant
              </label>
              <input
                type="url" // Use type="url"
                id="googleDriveLink2"
                value={googleDriveLink2}
                onChange={e => setGoogleDriveLink2(e.target.value)}
                className="input text-light"
                placeholder="Collez le lien Google Drive ici"
              />
               {entry.googleDriveLink2 && !googleDriveLink2 && <p className="text-gray-400 text-sm mt-2">Lien Google Drive existant : <a href={entry.googleDriveLink2} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Voir</a></p>}
           </div>
        </div>

        {vehicleId && (
          <div className="mt-4">
            <ChampFichier vehicleId={vehicleId} libelle="Facture (photo ou PDF)" chemin={facturePath} onChange={setFacturePath} />
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <button
            type="submit"
            className="bg-primary text-secondary font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditMaintenance;
