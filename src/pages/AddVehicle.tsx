import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addVehicle } from '../utils/donnees';
import { Vehicle } from '../types';
import ChampsSuivi, { SUIVI_PAR_DEFAUT } from '../components/ChampsSuivi';

const AddVehicle: React.FC = () => {
  const navigate = useNavigate();
  const [vehicleData, setVehicleData] = useState<Omit<Vehicle, 'id' | 'maintenanceHistory' | 'controleTechniqueHistory' | 'previousOwners'>>({ // Updated Omit
    type: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    initialMileage: 0,
    purchaseDate: '',
    firstRegistrationDate: '',
    vin: '',
    imageUrl: '',
    carteGriseGoogleDriveLink: '',
    licensePlate: '', // Initialize new field
    ...SUIVI_PAR_DEFAUT,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVehicleData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'initialMileage' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // No need to generate ID or add history arrays here, firebaseData handles it
      const id = await addVehicle(vehicleData);
      navigate(`/vehicle/${id}`); // la fiche permet ensuite d'ajouter photo et carte grise
    } catch (err) {
      console.error("Error adding vehicle:", err);
      setError("Erreur lors de l'ajout du véhicule.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <h2 className="titre-page">Ajouter un nouveau véhicule</h2>
      <form onSubmit={handleSubmit} className="panneau rounded-lg p-4 md:p-6 border border-primary/30 space-y-4">
        <div>
          <label htmlFor="type" className="block text-light/80 text-sm font-medium mb-1">Type</label>
          <select
            id="type"
            name="type"
            value={vehicleData.type}
            onChange={handleChange}
            required
            className="input w-full"
          >
            <option value="">Sélectionner un type</option>
            <option value="Car">Voiture</option>
            <option value="Motorcycle">Moto</option>
            <option value="Truck">Camion</option>
            <option value="Van">Utilitaire</option>
            <option value="Scooter">Scooter</option>{/* Added Scooter */}
            <option value="Other">Autre</option>
          </select>
        </div>
        <div>
          <label htmlFor="make" className="block text-light/80 text-sm font-medium mb-1">Marque</label>
          <input
            type="text"
            id="make"
            name="make"
            value={vehicleData.make}
            onChange={handleChange}
            required
            className="input w-full"
          />
        </div>
        <div>
          <label htmlFor="model" className="block text-light/80 text-sm font-medium mb-1">Modèle</label>
          <input
            type="text"
            id="model"
            name="model"
            value={vehicleData.model}
            onChange={handleChange}
            required
            className="input w-full"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="year" className="block text-light/80 text-sm font-medium mb-1">Année</label>
            <input
              type="number"
              id="year"
              name="year"
              value={vehicleData.year}
              onChange={handleChange}
              required
              min="1900"
              max={new Date().getFullYear()}
              className="input w-full"
            />
          </div>
          <div>
            <label htmlFor="initialMileage" className="block text-light/80 text-sm font-medium mb-1">Kilométrage initial (km)</label>
            <input
              type="number"
              id="initialMileage"
              name="initialMileage"
              value={vehicleData.initialMileage}
              onChange={handleChange}
              required
              min="0"
              className="input w-full"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
            <label htmlFor="purchaseDate" className="block text-light/80 text-sm font-medium mb-1">Date d'achat</label>
            <input
              type="date"
              id="purchaseDate"
              name="purchaseDate"
              value={vehicleData.purchaseDate}
              onChange={handleChange}
              required
              className="input w-full"
            />
          </div>
          <div>
            <label htmlFor="firstRegistrationDate" className="block text-light/80 text-sm font-medium mb-1">Date 1ère mise en circulation (Optionnel)</label>
            <input
              type="date"
              id="firstRegistrationDate"
              name="firstRegistrationDate"
              value={vehicleData.firstRegistrationDate || ''}
              onChange={handleChange}
              className="input w-full"
            />
          </div>
        </div>
        <div>
          <label htmlFor="vin" className="block text-light/80 text-sm font-medium mb-1">VIN (Optionnel)</label>
          <input
            type="text"
            id="vin"
            name="vin"
            value={vehicleData.vin || ''}
            onChange={handleChange}
            className="input w-full"
          />
        </div>
        <div>
          <label htmlFor="imageUrl" className="block text-light/80 text-sm font-medium mb-1">URL Image (Optionnel)</label>
          <input
            type="text"
            id="imageUrl"
            name="imageUrl"
            value={vehicleData.imageUrl || ''}
            onChange={handleChange}
            className="input w-full"
            placeholder="Ex: https://unsplash.com/photos/..."
          />
        </div>
         {/* New field for Carte Grise Google Drive Link */}
        <div>
          <label htmlFor="carteGriseGoogleDriveLink" className="block text-light/80 text-sm font-medium mb-1">URL Google Drive Carte Grise (Optionnel)</label>
          <input
            type="text"
            id="carteGriseGoogleDriveLink"
            name="carteGriseGoogleDriveLink"
            value={vehicleData.carteGriseGoogleDriveLink || ''}
            onChange={handleChange}
            className="input w-full"
            placeholder="Ex: https://drive.google.com/file/d/..."
          />
        </div>
        {/* New field for License Plate */}
        <div>
          <label htmlFor="licensePlate" className="block text-light/80 text-sm font-medium mb-1">Plaque d'immatriculation (Optionnel)</label>
          <input
            type="text"
            id="licensePlate"
            name="licensePlate"
            value={vehicleData.licensePlate || ''}
            onChange={handleChange}
            className="input w-full"
            placeholder="Ex: AB-123-CD"
          />
        </div>
        <ChampsSuivi valeur={vehicleData} onChange={v => setVehicleData(prev => ({ ...prev, ...v }))} />
        <p className="text-light/60 text-sm font-machine">Photo et carte grise : à envoyer depuis « Modifier » une fois le véhicule créé.</p>
         {error && <p className="text-rouille text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-primary text-secondary font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Ajout en cours...' : 'Ajouter le véhicule'}
        </button>
      </form>
    </div>
  );
};

export default AddVehicle;
