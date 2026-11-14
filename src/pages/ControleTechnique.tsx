import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { addControleTechniqueEntry } from '../utils/donnees';
import { ControleTechniqueEntry } from '../types';

const ControleTechnique: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicleId) {
      console.error("Vehicle ID is missing.");
      return;
    }

    // Omit fields that will be calculated or handled separately
    const newEntryData: Omit<ControleTechniqueEntry, 'id' | 'reportUrl'> = {
      date,
      mileage: parseInt(mileage, 10),
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
    };

    try {
      // Pass the file object directly to the firebaseData function
      await addControleTechniqueEntry(vehicleId, newEntryData, undefined, googleDriveLink);
      console.log('Contrôle Technique entry saved successfully!');
      navigate(`/vehicle/${vehicleId}`); // Navigate back to vehicle detail
    } catch (error) {
      console.error('Error saving Contrôle Technique entry:', error);
      // Handle error
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

      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">Ajouter un Contrôle Technique</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-secondary rounded-lg shadow-lg p-4 md:p-6 border border-primary/30"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input text-light" // Added text-light
            placeholder="Date du contrôle"
            required
          />
          <input
            type="number"
            value={mileage}
            onChange={e => setMileage(e.target.value)}
            className="input text-light" // Added text-light
            placeholder="Kilométrage"
            required
          />
          <input
            type="text"
            value={validity}
            onChange={e => setValidity(e.target.value)}
            className="input text-light" // Added text-light
            placeholder="Validité (ex: 2 ans)"
            required
          />
          <input
            type="text"
            value={minorFailures}
            onChange={e => setMinorFailures(e.target.value)}
            className="input text-light" // Added text-light
            placeholder="Défauts mineurs"
          />
          <input
            type="text"
            value={majorFailures}
            onChange={e => setMajorFailures(e.target.value)}
            className="input text-light" // Added text-light
            placeholder="Défauts majeurs"
          />
          <input
            type="text"
            value={ripage}
            onChange={e => setRipage(e.target.value)}
            className="input text-light" // Added text-light
            placeholder="Ripage (m/km)"
          />
           <input
            type="text"
            value={suspensionAsymmetry}
            onChange={e => setSuspensionAsymmetry(e.target.value)}
            className="input text-light" // Added text-light
            placeholder="Déséquilibre suspension (%)"
          />
           <input
            type="text"
            value={verticalForces}
            onChange={e => setVerticalForces(e.target.value)}
            className="input text-light" // Added text-light
            placeholder="Forces verticales (daN)"
          />
           <input
            type="text"
            value={serviceBrake}
            onChange={e => setServiceBrake(e.target.value)}
            className="input text-light" // Added text-light
            placeholder="Frein de service (daN)"
          />
           <input
            type="text"
            value={parkingBrake}
            onChange={e => setParkingBrake(e.target.value)}
            className="input text-light" // Added text-light
            placeholder="Frein de stationnement (daN)"
          />
           <input
            type="text"
            value={exhaustEmissions}
            onChange={e => setExhaustEmissions(e.target.value)}
            className="input text-light" // Added text-light
            placeholder="Émissions d'échappement"
          />
           <input
            type="text"
            value={headlights}
            onChange={e => setHeadlights(e.target.value)}
            className="input text-light" // Added text-light
            placeholder="Réglage phares"
          />
          <div>
            <label htmlFor="googleDriveLink" className="block text-sm font-medium text-light">
              Lien Google Drive (Optionnel - Pour rapports existants)
            </label>
            <input
              type="text"
              id="googleDriveLink"
              value={googleDriveLink}
              onChange={e => setGoogleDriveLink(e.target.value)}
              className="input text-light mt-1"
              placeholder="Coller un lien Google Drive existant"
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

export default ControleTechnique;
