import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVehicleById, updatePreviousOwnerEntry } from '../utils/firebaseData';
import { PreviousOwner, Vehicle } from '../types';
import { ArrowLeft } from 'lucide-react';

const EditPreviousOwner: React.FC = () => {
  const { vehicleId, entryId } = useParams<{ vehicleId: string; entryId: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PreviousOwner | null>(null);
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
        const vehicleData = await getVehicleById(vehicleId);
        if (vehicleData) {
          const entryToEdit = vehicleData.previousOwners.find(entry => entry.id === entryId);
          if (entryToEdit) {
            // Load existing data into form state
            setFormData({
              ...entryToEdit,
              // Ensure dates are in 'YYYY-MM-DD' format for input type="date"
              startDate: entryToEdit.startDate,
              endDate: entryToEdit.endDate || '', // Handle optional endDate
            });
          } else {
            setError("Previous owner entry not found.");
          }
        } else {
          setError("Vehicle not found.");
        }
      } catch (err) {
        console.error("Error fetching previous owner entry:", err);
        setError("Failed to load entry data.");
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [vehicleId, entryId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !entryId || !formData) {
      setError("Vehicle ID, Entry ID, or form data is missing.");
      return;
    }
     if (!formData.startDate) {
       setError("La date d'achat est requise.");
       return;
    }

    setLoading(true);
    setError(null);

    try {
      await updatePreviousOwnerEntry(vehicleId, formData);
      console.log('Previous owner entry updated successfully!');
      navigate(`/vehicle/${vehicleId}/previous-owners`); // Navigate back to the list
    } catch (err) {
      console.error("Error updating previous owner entry:", err);
      setError("Échec de la mise à jour de l'entrée. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-light">Chargement...</div>;
  }

  if (error) {
    return <div className="text-center text-danger">{error}</div>;
  }

  if (!formData) {
     return <div className="text-center text-danger">Entrée non trouvée pour modification.</div>;
  }


  return (
    <div className="container mx-auto p-4">
      <button
        onClick={() => navigate(`/vehicle/${vehicleId}/previous-owners`)}
        className="mb-4 flex items-center text-primary hover:underline"
      >
        <ArrowLeft size={20} className="mr-1" /> Retour à la liste des propriétaires
      </button>
      <h1 className="text-2xl font-bold mb-6 text-primary">Modifier l'Ancien Propriétaire</h1>

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
            {loading ? 'Enregistrement en cours...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPreviousOwner;
