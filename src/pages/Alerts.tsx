import React, { useEffect, useState } from 'react';
import { Vehicle, MaintenanceEntry, ControleTechniqueEntry } from '../types';
import { getVehicles } from '../utils/donnees';
import { AlertTriangle, Bell } from 'lucide-react'; // Import Bell icon
import { format, addYears, addMonths, isBefore, isAfter, parseISO } from 'date-fns'; // Import date-fns functions

// Helper function to calculate alert status for a vehicle
const calculateVehicleAlerts = (vehicle: Vehicle): { hasAlert: boolean; alerts: string[] } => {
  const alerts: string[] = [];
  const today = new Date();
  const threeMonthsFromNow = addMonths(today, 3);

  // 1. Maintenance Alert (Last maintenance date + 12 months)
  const latestMaintenance = vehicle.maintenanceHistory
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (latestMaintenance) {
    const nextMaintenanceDate = addYears(parseISO(latestMaintenance.date), 1);
    if (isBefore(nextMaintenanceDate, threeMonthsFromNow) && isAfter(nextMaintenanceDate, today)) {
      alerts.push(`Entretien recommandé avant le ${format(nextMaintenanceDate, 'dd/MM/yyyy')}`);
    } else if (isBefore(nextMaintenanceDate, today)) {
       alerts.push(`Entretien recommandé dépassé depuis le ${format(nextMaintenanceDate, 'dd/MM/yyyy')}`);
    }
  } else {
     alerts.push("Aucun entretien enregistré. Pensez à ajouter le premier entretien.");
  }


  // 2. Controle Technique Alert (Based on validity date)
  const latestControleTechnique = vehicle.controleTechniqueHistory
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (latestControleTechnique) {
    // Assuming validity is stored as a date string (e.g., 'YYYY-MM-DD')
    // If validity is '2 ans' or similar, you'd need to parse it or store the next due date directly.
    // Let's assume validity is the *next due date* for simplicity based on the prompt asking for "date d'échéance".
    // If validity is the *duration*, we'd need to calculate the next date from the last CT date.
    // Let's refine this: The prompt says "date d'échéance pour le dernier contrôle technique".
    // This implies the `validity` field in `ControleTechniqueEntry` should ideally store the *next due date*.
    // If it stores duration ('2 ans'), we need to calculate: last CT date + duration.
    // Let's assume for now `validity` is the next due date string 'YYYY-MM-DD'.
    // If `validity` is a duration string like '2 ans', we need to adjust.
    // Based on `types.ts`, `validity` is a string like '2 ans', 'Contre-visite'.
    // This means we need to calculate the next date based on the last CT date and its validity.
    // A typical CT is valid for 2 years. A 'Contre-visite' has a shorter validity (e.g., 2 months).
    // Let's add logic to handle '2 ans' and 'Contre-visite'.

    let nextCtDate: Date | null = null;
    const lastCtDate = parseISO(latestControleTechnique.date);

    if (latestControleTechnique.validity === '2 ans') {
      nextCtDate = addYears(lastCtDate, 2);
    } else if (latestControleTechnique.validity === 'Contre-visite') {
      // Assuming contre-visite is typically 2 months
      nextCtDate = addMonths(lastCtDate, 2);
    }
    // Add other validity types if necessary

    if (nextCtDate) {
      if (isBefore(nextCtDate, threeMonthsFromNow) && isAfter(nextCtDate, today)) {
        alerts.push(`Contrôle Technique à renouveler avant le ${format(nextCtDate, 'dd/MM/yyyy')}`);
      } else if (isBefore(nextCtDate, today)) {
         alerts.push(`Contrôle Technique expiré depuis le ${format(nextCtDate, 'dd/MM/yyyy')}`);
      }
    } else {
       // Handle cases where validity is not '2 ans' or 'Contre-visite'
       alerts.push(`Contrôle Technique : Valide jusqu'au ${latestControleTechnique.validity}`);
    }

  } else {
     alerts.push("Aucun Contrôle Technique enregistré. Pensez à ajouter le premier CT.");
  }


  const hasAlert = alerts.length > 0; // Vehicle has an alert if there's at least one message

  return { hasAlert, alerts };
};


const Alerts: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehiclesWithAlerts, setVehiclesWithAlerts] = useState<{ vehicle: Vehicle; alerts: string[] }[]>([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getVehicles();
        setVehicles(data);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setError("Erreur lors du chargement des données d'alertes.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  useEffect(() => {
    // Calculate alerts whenever vehicles data changes
    const alertsData = vehicles
      .map(vehicle => {
        const { hasAlert, alerts } = calculateVehicleAlerts(vehicle);
        return { vehicle, alerts, hasAlert };
      })
      .filter(item => item.hasAlert); // Only keep vehicles that have alerts

    setVehiclesWithAlerts(alertsData);
  }, [vehicles]); // Recalculate when vehicles state updates

  if (loading) {
    return <div className="text-center text-light">Chargement des alertes...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">Alertes</h2>

      {vehicles.length === 0 ? (
        <p className="text-center text-light">Aucun véhicule ajouté pour le moment.</p>
      ) : vehiclesWithAlerts.length === 0 ? (
        <p className="text-center text-light">Aucune alerte pour le moment. Tout est à jour !</p>
      ) : (
        <div className="space-y-6">
          {vehiclesWithAlerts.map(({ vehicle, alerts }) => (
            <div key={vehicle.id} className="bg-secondary rounded-lg shadow-lg p-4 border border-red-500/50"> {/* Use red border for alert */}
              <div className="flex items-center mb-2">
                {/* Visual Alert Indicator: Bell + Red Dot */}
                <div className="relative mr-3">
                  <Bell size={24} className="text-red-500" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-secondary bg-red-500"></span>
                </div>
                <h3 className="text-xl font-semibold text-light">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
              </div>
              <div className="text-light/80 space-y-2">
                {alerts.map((alert, index) => (
                  <p key={index} className="flex items-center">
                    <AlertTriangle size={18} className="inline mr-2 text-yellow-500 flex-shrink-0" /> {/* Use AlertTriangle for specific message */}
                    <span>{alert}</span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
