import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Vehicle } from '../types';
import { getVehicles, deleteVehicle } from '../utils/donnees';
import { Trash2, Edit, PlusCircle } from 'lucide-react'; // Import Edit icon

const VehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError("Erreur lors du chargement des véhicules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await deleteVehicle(id);
        fetchVehicles(); // Refresh list
      } catch (err) {
        console.error("Error deleting vehicle:", err);
        setError("Erreur lors de la suppression du véhicule.");
      }
    }
  };

  if (loading) {
    return <div className="text-center text-light">Chargement des véhicules...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-primary">Ma Flotte</h2>
        <Link to="/add-vehicle" className="flex items-center bg-primary text-secondary px-4 py-2 rounded-md hover:bg-orange-600 transition-colors duration-200">
          <PlusCircle size={20} className="mr-2" />
          Ajouter un véhicule
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <p className="text-center text-light">Aucun véhicule ajouté pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="bg-secondary rounded-lg shadow-lg overflow-hidden border border-primary/30">
              {/* Placeholder Image */}
              <img
                src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1580414057403-c5f474b2f0f8?auto=format&fit=crop&q=80&w=2940&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1pYWdlfHx8fGVufDB8fHx8fA%3D%3D'}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-light mb-2">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                <p className="text-light/80 text-sm mb-4">Type: {vehicle.type}</p>
                <div className="flex justify-between items-center">
                  <Link to={`/vehicle/${vehicle.id}`} className="text-accent hover:text-blue-400 transition-colors duration-200 font-medium">
                    Voir les entretiens
                  </Link>
                  <div className="flex space-x-3">
                    {/* Add Edit Link/Icon */}
                    <Link to={`/edit-vehicle/${vehicle.id}`} className="text-light/60 hover:text-primary transition-colors duration-200">
                      <Edit size={18} />
                    </Link>
                    <button onClick={() => handleDelete(vehicle.id)} className="text-light/60 hover:text-primary transition-colors duration-200">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleList;
