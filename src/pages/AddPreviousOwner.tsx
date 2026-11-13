import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { addPreviousOwnerEntry } from '../utils/firebaseData';
import { PreviousOwner } from '../types';
import { ArrowLeft } from 'lucide-react';

const AddPreviousOwner: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Omit<PreviousOwner, 'id' | 'duration'>>({
    name: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) {
      setError("Vehicle ID is missing.");
      return;
    }
    if (!formData.startDate) {
       setError("La date d'achat est requise.");
       return;
    }

    setLoading(true);
    setError(null);

    try {
      await addPreviousOwnerEntry(vehicleId, formData);
      console.log('Previous owner entry added successfully!');
      navigate(`/vehicle/${vehicleId}/previous-owners`); // Navigate back to the list
    } catch (err) {
      console.error("Error adding previous owner entry:", err);
      setError("Échec de l'ajout de l'entrée. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <button
        onClick={() => navigate(`/vehicle/${vehicleId}/previous-owners`)}
        className="mb-4 flex items-center text-primary hover:underline"
      >
        <ArrowLeft size={20} className="mr-1" /> Retour à la liste des propriétaires
      </button>
      <h1 className="text-2xl font-bold mb-6 text-primary">Ajouter un Ancien Propriétaire</h1>

      {error && <div className="text-danger mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-secondary p-6 rounded-md shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-light text-sm font-bold mb-2" htmlFor="name">
              Nom / Identifiant (Optionnel)
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-dark leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div>
            <label className="block text-light text-sm font-bold mb-2" htmlFor="startDate">
              Date d'achat <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-dark leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label className="block text-light text-sm font-bold mb-2" htmlFor="endDate">
              Date de revente (Optionnel)
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-dark leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => navigate(`/vehicle/${vehicleId}/previous-owners`)}
            className="bg-gray-500 text-light px-4 py-2 rounded-md mr-2 hover:bg-gray-600 transition-colors duration-200"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="bg-primary text-dark px-4 py-2 rounded-md hover:bg-primary-dark transition-colors duration-200"
            disabled={loading}
          >
            {loading ? 'Ajout en cours...' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPreviousOwner;
