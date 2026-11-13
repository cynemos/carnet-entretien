import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getVehicleById, updateControleTechniqueEntry } from '../utils/firebaseData';
import { ControleTechniqueEntry, Vehicle } from '../types';

const EditControleTechnique: React.FC = () => {
  const { vehicleId, entryId } = useParams<{ vehicleId: string; entryId: string }>();
  const navigate = useNavigate();

  const [entry, setEntry] = useState<ControleTechniqueEntry | null>(null);
  const [date, setDate] = useState('');
  const [mileage, setMileage] = useState('');
  const [validity, setValidity] = useState('');
  const [minorFailures, setMinorFailures] = useState('');
  const [majorFailures, setMajorFailures] = useState('');
  const [ripage, setRipage] = useState('');
  const [suspensionAsymmetry, setSuspensionAsymmetry] = useState('');
  const [verticalForces, setVerticalForces] = useState('');
  const [serviceBrake, setServiceBrake] = useState('');
  const [parkingBrake, setParkingBrake] = useState('');
  const [exhaustEmissions, setExhaustEmissions] = useState('');
  const [headlights, setHeadlights] = useState('');
  const [googleDriveLink, setGoogleDriveLink] = useState(''); // State for Google Drive link
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntry = async () => {
      if (!vehicleId || !entryId) {
        setError("Vehicle ID is missing.");
        setLoading(false);
        return;
      }
      try {
        const vehicle = await getVehicleById(vehicleId);
        if (vehicle) {
          const foundEntry = vehicle.controleTechniqueHistory.find(e => e.id === entryId);
          if (foundEntry) {
            setEntry(foundEntry);
            setDate(foundEntry.date);
            setMileage(foundEntry.mileage.toString());
            setValidity(foundEntry.validity);
            setMinorFailures(foundEntry.minorFailures || '');
            setMajorFailures(foundEntry.majorFailures || '');
            setRipage(foundEntry.ripage || '');
            setSuspensionAsymmetry(foundEntry.suspensionAsymmetry || '');
            setVerticalForces(foundEntry.verticalForces || '');
            setServiceBrake(foundEntry.serviceBrake || '');
            setParkingBrake(foundEntry.parkingBrake || '');
            setExhaustEmissions(foundEntry.exhaustEmissions || '');
            setHeadlights(foundEntry.headlights || '');
            setGoogleDriveLink(foundEntry.googleDriveLink || ''); // Load existing link
          } else {
            setError("Contrôle Technique entry not found.");
          }
        } else {
          setError("Vehicle not found.");
        }
      } catch (err) {
        console.error("Error fetching entry:", err);
        setError("Failed to load Contrôle Technique entry.");
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

    const parsedMileage = parseInt(mileage, 10);
    if (isNaN(parsedMileage)) {
      setError("Kilométrage doit être un nombre valide.");
      return; // Stop submission
    }


    const updatedEntryData: ControleTechniqueEntry = {
      ...entry, // Keep existing fields like id, reportUrl
      date,
      mileage: parsedMileage, // Use the parsed number
      validity,
      minorFailures,
      majorFailures,
      ripage,
      suspensionAsymmetry,
      verticalForces,
      serviceBrake,
      parkingBrake,
      exhaustEmissions,
      headlights,
      googleDriveLink: googleDriveLink || undefined, // Pass the updated Google Drive link state (will be converted to null in firebaseData)
      // reportUrl is not updated via file upload anymore
    };

    console.log("Submitting CT update:", updatedEntryData); // Log data before sending

    try {
      // Pass undefined for the file object as file upload is removed
      // Ensure updatedEntryData includes the potentially changed googleDriveLink
      await updateControleTechniqueEntry(vehicleId, updatedEntryData, undefined);
      console.log('Contrôle Technique entry updated successfully!');
      navigate(`/vehicle/${vehicleId}`);
    } catch (error) {
      console.error('Error updating Contrôle Technique entry:', error);
      // Handle error (e.g., show an error message to the user)
      setError(`Failed to update entry: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleGoogleDriveLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGoogleDriveLink(e.target.value);
  };


  if (loading) {
    return <div className="container mx-auto text-center text-light">Chargement...</div>;
  }

  if (error) {
    return <div className="container mx-auto text-center text-danger">Erreur : {error}</div>;
  }

   if (!entry) {
     return <div className="container mx-auto text-center text-danger">Entrée de Contrôle Technique introuvable.</div>;
  }


  return (
    <div className="container mx-auto">
      <Link
        to={`/vehicle/${vehicleId}`}
        className="flex items-center mb-4 text-accent hover:text-blue-400 transition-colors duration-200"
      >
        <ArrowLeft size={20} className="mr-2" />
        Retour au véhicule
      </Link>

      <h2 className="text-3xl font-bold text-primary mb-6">Modifier l'entrée de Contrôle Technique</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-secondary rounded-lg shadow-lg p-6 border border-primary/30"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input text-light"
            placeholder="Date du contrôle"
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
          <input
            type="text"
            value={validity}
            onChange={e => setValidity(e.target.value)}
            className="input text-light"
            placeholder="Validité (ex: 2 ans)"
            required
          />
          <input
            type="text"
            value={minorFailures}
            onChange={e => setMinorFailures(e.target.value)}
            className="input text-light"
            placeholder="Défauts mineurs"
          />
          <input
            type="text"
            value={majorFailures}
            onChange={e => setMajorFailures(e.target.value)}
            className="input text-light"
            placeholder="Défauts majeurs"
          />
          <input
            type="text"
            value={ripage}
            onChange={e => setRipage(e.target.value)}
            className="input text-light"
            placeholder="Ripage (m/km)"
          />
           <input
            type="text"
            value={suspensionAsymmetry}
            onChange={e => setSuspensionAsymmetry(e.target.value)}
            className="input text-light"
            placeholder="Déséquilibre suspension (%)"
          />
           <input
            type="text"
            value={verticalForces}
            onChange={e => setVerticalForces(e.target.value)}
            className="input text-light"
            placeholder="Forces verticales (daN)"
          />
           <input
            type="text"
            value={serviceBrake}
            onChange={e => setServiceBrake(e.target.value)}
            className="input text-light"
            placeholder="Frein de service (daN)"
          />
           <input
            type="text"
            value={parkingBrake}
            onChange={e => setParkingBrake(e.target.value)}
            className="input text-light"
            placeholder="Frein de stationnement (daN)"
          />
           <input
            type="text"
            value={exhaustEmissions}
            onChange={e => setExhaustEmissions(e.target.value)}
            className="input text-light"
            placeholder="Émissions d'échappement"
          />
           <input
            type="text"
            value={headlights}
            onChange={e => setHeadlights(e.target.value)}
            className="input text-light"
            placeholder="Réglage phares"
          />
            <div className="md:col-span-2">
              <label htmlFor="googleDriveLink" className="block text-light text-sm font-bold mb-2">
                Lien Google Drive (Optionnel - Pour rapports existants)
              </label>
              <input
                type="url" // Use type="url"
                id="googleDriveLink"
                value={googleDriveLink}
                onChange={handleGoogleDriveLinkChange}
                className="input text-light"
                placeholder="Collez le lien Google Drive ici"
              />
               {/* Display existing link if current input is empty */}
               {entry.googleDriveLink && !googleDriveLink && (
                 <p className="text-gray-400 text-sm mt-2">Lien Google Drive existant : <a href={entry.googleDriveLink} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Voir</a></p>
               )}
           </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="submit"
            className="bg-primary hover:bg-orange-600 text-secondary font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditControleTechnique;
