import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormulaireVehicule } from '../types';
import Chargement from '../components/Chargement';
import ChampsSuivi from '../components/ChampsSuivi';
import { ChampFichier } from '../components/Fichiers';
import { getVehicleById, updateVehicle } from '../utils/donnees';

const EditVehicle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicleData, setVehicleData] = useState<FormulaireVehicule | null>(null); // Updated Omit
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchVehicle = async () => {
      if (id) {
        setLoading(true);
        setError(null);
        try {
          const existingVehicle = await getVehicleById(id);
          if (existingVehicle) {
            // Set state with existing vehicle data, excluding id and history arrays
            setVehicleData({
              type: existingVehicle.type,
              make: existingVehicle.make,
              model: existingVehicle.model,
              year: existingVehicle.year,
              initialMileage: existingVehicle.initialMileage,
              purchaseDate: existingVehicle.purchaseDate,
              firstRegistrationDate: existingVehicle.firstRegistrationDate || '',
              vin: existingVehicle.vin || '',
              imageUrl: existingVehicle.imageUrl || '',
              carteGriseGoogleDriveLink: existingVehicle.carteGriseGoogleDriveLink || '',
              licensePlate: existingVehicle.licensePlate || '', // Include new field
              currentMileage: existingVehicle.currentMileage,
              ctIntervalYears: existingVehicle.ctIntervalYears,
              maintenanceIntervalMonths: existingVehicle.maintenanceIntervalMonths,
              maintenanceIntervalKm: existingVehicle.maintenanceIntervalKm,
              soldDate: existingVehicle.soldDate,
              photoPath: existingVehicle.photoPath,
              carteGrisePath: existingVehicle.carteGrisePath,
              purchasePrice: existingVehicle.purchasePrice,
              salePrice: existingVehicle.salePrice,
            });
          } else {
            setError("Véhicule non trouvé.");
            // Optionally redirect if vehicle not found
            // navigate('/');
          }
        } catch (err) {
           console.error("Error fetching vehicle for edit:", err);
           setError("Erreur lors du chargement des données du véhicule.");
        } finally {
           setLoading(false);
        }
      } else {
         setLoading(false);
         setError("ID du véhicule manquant.");
      }
    };
    fetchVehicle();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVehicleData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: name === 'year' || name === 'initialMileage' ? Number(value) : value,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id && vehicleData) {
      setLoading(true);
      setError(null);
      try {
        await updateVehicle(id, vehicleData); // Pass the updated vehicleData
        navigate(`/vehicle/${id}`); // Navigate back to detail page
      } catch (err) {
        console.error("Error updating vehicle:", err);
        setError("Erreur lors de la mise à jour du véhicule.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <Chargement texte="Chargement…" />;
  }

  if (error) {
     return <div className="text-center text-rouille">{error}</div>;
  }

  if (!vehicleData) {
     return <div className="text-center text-light">Véhicule non trouvé pour l'édition.</div>;
  }


  return (
    <div className="container mx-auto">
      <h2 className="titre-page">Modifier le véhicule</h2>
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
        {id && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ChampFichier vehicleId={id} libelle="Photo du véhicule" accept="image/*" chemin={vehicleData.photoPath}
              onChange={c => setVehicleData(prev => prev && { ...prev, photoPath: c })} />
            <ChampFichier vehicleId={id} libelle="Carte grise (photo ou PDF)" chemin={vehicleData.carteGrisePath}
              onChange={c => setVehicleData(prev => prev && { ...prev, carteGrisePath: c })} />
          </div>
        )}
        <ChampsSuivi valeur={vehicleData} onChange={v => setVehicleData(prev => prev && { ...prev, ...v })} />
        {error && <p className="text-rouille text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-primary text-secondary font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  );
};

export default EditVehicle;
