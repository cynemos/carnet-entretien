import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { addMaintenanceEntry } from '../utils/donnees';
import { MaintenanceEntry } from '../types';

const AddMaintenance: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();

  const [date, setDate] = useState('');
  const [mileage, setMileage] = useState('');
  const [description, setDescription] = useState('');
  const [partsCost, setPartsCost] = useState('');
  const [laborCost, setLaborCost] = useState('');
  // Reverted state for two Google Drive links
  const [googleDriveLink1, setGoogleDriveLink1] = useState('');
  const [googleDriveLink2, setGoogleDriveLink2] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicleId) {
      console.error("Vehicle ID is missing.");
      return;
    }

    // Debugging: Log the values before submitting
    console.log("Submitting maintenance entry with:", {
      date,
      mileage,
      description,
      partsCost,
      laborCost,
      googleDriveLink1,
      googleDriveLink2,
    });

    // Omit fields that will be calculated or handled separately
    // Updated to use two googleDriveLink fields
    const newEntryData: Omit<MaintenanceEntry, 'id' | 'totalCost' | 'googleDriveLink1' | 'googleDriveLink2'> & { googleDriveLink1?: string, googleDriveLink2?: string } = {
      date,
      mileage: parseInt(mileage, 10),
      description,
      partsCost: parseFloat(partsCost || '0'),
      laborCost: parseFloat(laborCost || '0'),
      // Include the two Google Drive links if provided
      googleDriveLink1: googleDriveLink1 || undefined,
      googleDriveLink2: googleDriveLink2 || undefined,
    };

    try {
      // Call the updated addMaintenanceEntry function
      await addMaintenanceEntry(vehicleId, newEntryData);
      console.log('Maintenance entry saved successfully!');
      navigate(`/vehicle/${vehicleId}`);
    } catch (error) {
      console.error('Error saving maintenance entry:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  return (
    <div className="container mx-auto">
      <Link
        to={`/vehicle/${vehicleId}`}
        className="flex items-center mb-4 text-accent hover:text-blue-400 transition-colors duration-200"
      >
        <ArrowLeft size={20} className="mr-2" />
        Retour au véhicule
      </Link>

      <h2 className="text-3xl font-bold text-primary mb-6">Ajouter une entrée de maintenance</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-secondary rounded-lg shadow-lg p-6 border border-primary/30"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input"
            placeholder="Date de l'entretien"
            required
          />
          <input
            type="number"
            value={mileage}
            onChange={e => setMileage(e.target.value)}
            className="input"
            placeholder="Kilométrage"
            required
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="input md:col-span-2"
            placeholder="Description de l'entretien (ex: Vidange, changement plaquettes)"
            required
          />
          <input
            type="number"
            value={partsCost}
            onChange={e => setPartsCost(e.target.value)}
            className="input"
            placeholder="Coût des pièces (€)"
            step="0.01"
          />
          <input
            type="number"
            value={laborCost}
            onChange={e => setLaborCost(e.target.value)}
            className="input"
            placeholder="Coût main d'œuvre (€)"
            step="0.01"
          />
           {/* Two fields for Google Drive links */}
           <div className="md:col-span-2">
              <label htmlFor="googleDriveLink1" className="block text-light text-sm font-bold mb-2">
                Facture 1 (optionnel) : Coller un lien Google Drive existant
              </label>
              <input
                type="url" // Use type="url" for better mobile keyboard and validation
                id="googleDriveLink1"
                value={googleDriveLink1}
                onChange={e => setGoogleDriveLink1(e.target.value)}
                className="input text-light"
                placeholder="Collez le lien Google Drive ici"
              />
           </div>
            <div className="md:col-span-2">
              <label htmlFor="googleDriveLink2" className="block text-light text-sm font-bold mb-2">
                Facture 2 (optionnel) : Coller un lien Google Drive existant
              </label>
              <input
                type="url" // Use type="url" for better mobile keyboard and validation
                id="googleDriveLink2"
                value={googleDriveLink2}
                onChange={e => setGoogleDriveLink2(e.target.value)}
                className="input text-light"
                placeholder="Collez le lien Google Drive ici"
              />
           </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="submit"
            className="bg-primary hover:bg-orange-600 text-secondary font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMaintenance;
