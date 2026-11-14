/* eslint-disable @typescript-eslint/no-explicit-any -- rappels Chart.js typés de façon lâche */
import React, { useEffect, useState } from 'react';
import { Vehicle } from '../types';
import { getVehicles } from '../utils/donnees';
import { Bar, Doughnut, Line } from 'react-chartjs-2'; // Import Line
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement, // Import LineElement
  PointElement, // Import PointElement
  TimeScale, // Import TimeScale for date axis
} from 'chart.js';
import Chargement from '../components/Chargement';
import 'chartjs-adapter-date-fns'; // Import date adapter

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement, // Register LineElement
  PointElement, // Register PointElement
  TimeScale // Register TimeScale
);

// Lettrage des graphiques assorti au thème atelier
ChartJS.defaults.font.family = 'Oswald, sans-serif';
ChartJS.defaults.color = '#efe4cc';

const Stats: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getVehicles();
        setVehicles(data);
      } catch (err) {
        console.error("Error fetching vehicles for stats:", err);
        setError("Erreur lors du chargement des données pour les statistiques.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  // --- Data Processing for Charts ---

  // Total Cost per Vehicle
  const totalCostPerVehicleData = {
    labels: vehicles.map(v => `${v.make} ${v.model}`),
    datasets: [
      {
        label: 'Coût Total d\'Entretien (€)',
        data: vehicles.map(v =>
          v.maintenanceHistory.reduce((sum, entry) => sum + entry.totalCost, 0)
        ),
        backgroundColor: 'rgba(212, 148, 58, 0.6)', // Primary color
        borderColor: 'rgba(212, 148, 58, 1)',
        borderWidth: 1,
      },
    ],
  };

  const totalCostPerVehicleOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#efe4cc', // Light text for legend
        },
      },
      title: {
        display: true,
        text: 'Coût Total d\'Entretien par Véhicule',
        color: '#efe4cc', // Light text for title
      },
      tooltip: {
         callbacks: {
            label: function(context: any) {
               let label = context.dataset.label || '';
               if (label) {
                   label += ': ';
               }
               if (context.parsed.y !== null) {
                   label += new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
               }
               return label;
            }
         }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#bfae8f', // Lighter text for x-axis
        },
        grid: {
          color: 'rgba(212, 148, 58, 0.12)', // Subtle grid lines
        },
      },
      y: {
        ticks: {
          color: '#bfae8f', // Lighter text for y-axis
           callback: function(value: any) {
              return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
           }
        },
        grid: {
          color: 'rgba(212, 148, 58, 0.12)', // Subtle grid lines
        },
      },
    },
  };

  // Maintenance Entry Count per Vehicle
  const entryCountPerVehicleData = {
    labels: vehicles.map(v => `${v.make} ${v.model}`),
    datasets: [
      {
        label: 'Nombre d\'Entretiens',
        data: vehicles.map(v => v.maintenanceHistory.length),
        backgroundColor: 'rgba(143, 191, 159, 0.6)', // Accent color
        borderColor: 'rgba(143, 191, 159, 1)',
        borderWidth: 1,
      },
    ],
  };

   const entryCountPerVehicleOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
         labels: {
          color: '#efe4cc', // Light text for legend
        },
      },
      title: {
        display: true,
        text: 'Nombre d\'Entretiens par Véhicule',
        color: '#efe4cc', // Light text for title
      },
    },
     scales: {
      x: {
        ticks: {
          color: '#bfae8f', // Lighter text for x-axis
        },
        grid: {
          color: 'rgba(212, 148, 58, 0.12)', // Subtle grid lines
        },
      },
      y: {
        ticks: {
          color: '#bfae8f', // Lighter text for y-axis
           stepSize: 1, // Ensure integer ticks for count
        },
        grid: {
          color: 'rgba(212, 148, 58, 0.12)', // Subtle grid lines
        },
      },
    },
  };


  // Total Cost by Maintenance Type
  const maintenanceTypes = [
    'Vidange moteur / filtre à huile',
    'Filtres (air, habitacle, carburant)',
    'Bougies / Injecteurs',
    'Distribution (courroie / chaîne)',
    'Freins (plaquettes, disques, liquide)',
    'Embrayage',
    'Suspension (amortisseurs, ressorts, etc.)',
    'Pneus (montage / permutation / usure / pression)',
    'Climatisation (recharge gaz, filtre, compresseur)',
    'Batterie (état, remplacement)',
    'Échappement / catalyseur / FAP',
    'Système de refroidissement (liquide, radiateur, thermostat)',
    'Autre', // Catch-all for uncategorized
  ];

  const typeCosts: { [key: string]: number } = {};
  maintenanceTypes.forEach(type => typeCosts[type] = 0);

  vehicles.forEach(vehicle => {
    vehicle.maintenanceHistory.forEach(entry => {
      const description = entry.description.toLowerCase();
      let matchedType = 'Autre';

      // Simple keyword matching (can be improved for accuracy)
      if (description.includes('vidange') || description.includes('huile')) matchedType = 'Vidange moteur / filtre à huile';
      else if (description.includes('filtre') && (description.includes('air') || description.includes('habitacle') || description.includes('carburant'))) matchedType = 'Filtres (air, habitacle, carburant)';
      else if (description.includes('bougie') || description.includes('injecteur')) matchedType = 'Bougies / Injecteurs';
      else if (description.includes('distribution') || description.includes('courroie') || description.includes('chaîne')) matchedType = 'Distribution (courroie / chaîne)';
      else if (description.includes('frein') || description.includes('plaquette') || description.includes('disque') || description.includes('liquide de frein')) matchedType = 'Freins (plaquettes, disques, liquide)';
      else if (description.includes('embrayage')) matchedType = 'Embrayage';
      else if (description.includes('suspension') || description.includes('amortisseur') || description.includes('ressort')) matchedType = 'Suspension (amortisseurs, ressorts, etc.)';
      else if (description.includes('pneu') || description.includes('roue')) matchedType = 'Pneus (montage / permutation / usure / pression)';
      else if (description.includes('clim') || description.includes('climatisation') || description.includes('gaz') || description.includes('compresseur clim')) matchedType = 'Climatisation (recharge gaz, filtre, compresseur)';
      else if (description.includes('batterie')) matchedType = 'Batterie (état, remplacement)';
      else if (description.includes('échappement') || description.includes('catalyseur') || description.includes('fap')) matchedType = 'Échappement / catalyseur / FAP';
      else if (description.includes('refroidissement') || description.includes('liquide de refroidissement') || description.includes('radiateur') || description.includes('thermostat')) matchedType = 'Système de refroidissement (liquide, radiateur, thermostat)';


      typeCosts[matchedType] += entry.totalCost;
    });
  });

  // Filter out types with 0 cost for cleaner chart
  const filteredTypes = maintenanceTypes.filter(type => typeCosts[type] > 0);
  const filteredCosts = filteredTypes.map(type => typeCosts[type]);


  const totalCostByTypeData = {
    labels: filteredTypes, // Use filtered labels
    datasets: [
      {
        label: 'Coût Total par Type d\'Entretien (€)',
        data: filteredCosts, // Use filtered data
        backgroundColor: [
          'rgba(194, 85, 58, 0.6)', // Red
          'rgba(122, 167, 184, 0.6)', // Blue
          'rgba(224, 184, 74, 0.6)', // Yellow
          'rgba(111, 143, 114, 0.6)', // Green
          'rgba(142, 59, 70, 0.6)', // Purple
          'rgba(212, 148, 58, 0.6)', // Orange
          'rgba(239, 228, 204, 0.6)', // Grey
          'rgba(107, 122, 128, 0.6)', // Cornflower Blue
          'rgba(184, 115, 74, 0.6)', // Orchid
          'rgba(163, 163, 90, 0.6)', // Light Green
          'rgba(200, 162, 122, 0.6)', // Light Coral
          'rgba(150, 180, 170, 0.6)', // Light Blue
          'rgba(122, 111, 99, 0.6)', // Dark Grey (for 'Autre')
        ],
        borderColor: [
          'rgba(194, 85, 58, 1)',
          'rgba(122, 167, 184, 1)',
          'rgba(224, 184, 74, 1)',
          'rgba(111, 143, 114, 1)',
          'rgba(142, 59, 70, 1)',
          'rgba(212, 148, 58, 1)',
          'rgba(239, 228, 204, 1)',
          'rgba(107, 122, 128, 1)',
          'rgba(184, 115, 74, 1)',
          'rgba(163, 163, 90, 1)',
          'rgba(200, 162, 122, 1)',
          'rgba(150, 180, 170, 1)',
          'rgba(122, 111, 99, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

   const totalCostByTypeOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
         labels: {
          color: '#efe4cc', // Light text for legend
        },
      },
      title: {
        display: true,
        text: 'Répartition des Coûts par Type d\'Entretien (Estimation)',
        color: '#efe4cc', // Light text for title
      },
       tooltip: {
         callbacks: {
            label: function(context: any) {
               let label = context.label || '';
               if (label) {
                   label += ': ';
               }
               if (context.parsed !== null) {
                   label += new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(context.parsed);
               }
               return label;
            }
         }
      }
    },
  };

  // Mileage Evolution per Vehicle
  const mileageEvolutionData = {
    datasets: vehicles.map((vehicle, index) => {
      // Combine initial mileage, maintenance, and CT points
      const points = [
        { date: new Date(vehicle.purchaseDate), mileage: vehicle.initialMileage, type: 'Achat Initial' },
        ...vehicle.maintenanceHistory.map(m => ({ date: new Date(m.date), mileage: m.mileage, type: 'Entretien', description: m.description })),
        ...(vehicle.controleTechniqueHistory || []).map(c => ({ date: new Date(c.date), mileage: c.mileage, type: 'Contrôle Technique', validity: c.validity })),
      ];

      // Sort points by date
      points.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Prepare data for Chart.js
      const dataPoints = points.map(p => ({
        x: p.date,
        y: p.mileage,
        // Store additional info for tooltip
        event: p.type,
        description: (p as any).description, // Cast to any to access optional properties
        validity: (p as any).validity,
      }));

      // Define colors (use a simple palette or generate dynamically)
      const colors = [
        'rgba(194, 85, 58, 1)', // Red
        'rgba(122, 167, 184, 1)', // Blue
        'rgba(224, 184, 74, 1)', // Yellow
        'rgba(111, 143, 114, 1)', // Green
        'rgba(142, 59, 70, 1)', // Purple
        'rgba(212, 148, 58, 1)', // Orange
        'rgba(239, 228, 204, 1)', // Grey
      ];
      const color = colors[index % colors.length];

      return {
        label: `${vehicle.make} ${vehicle.model}`,
        data: dataPoints,
        borderColor: color,
        backgroundColor: color,
        fill: false,
        tension: 0.1, // Smooth the line slightly
        pointRadius: 5, // Make points visible
        pointHoverRadius: 7,
      };
    }),
  };

  const mileageEvolutionOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#efe4cc', // Light text for legend
        },
      },
      title: {
        display: true,
        text: 'Évolution du Kilométrage par Véhicule',
        color: '#efe4cc', // Light text for title
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            // Format date for tooltip title
            if (context.length > 0) {
              const date = new Date(context[0].parsed.x);
              return date.toLocaleDateString('fr-FR'); // Format date nicely
            }
            return '';
          },
          label: function(context: any) {
            const label = context.dataset.label || '';
            const mileage = context.parsed.y;
            const event = context.raw.event; // Access the stored event type
            const description = context.raw.description;
            const validity = context.raw.validity;

            let tooltipText = `${label}: ${mileage} km`;
            if (event) {
                tooltipText += ` (${event})`;
            }
            if (description) {
                tooltipText += ` - ${description}`;
            }
             if (validity) {
                tooltipText += ` - Validité: ${validity}`;
            }
            return tooltipText;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const, // Use time scale for dates
        time: {
          unit: 'year' as const, // Display ticks by year initially
          tooltipFormat: 'dd/MM/yyyy', // Format date in tooltip
          displayFormats: {
            year: 'yyyy',
            month: 'MMM yyyy',
            day: 'dd/MM/yyyy',
          },
        },
        ticks: {
          color: '#bfae8f', // Lighter text for x-axis
        },
        grid: {
          color: 'rgba(212, 148, 58, 0.12)', // Subtle grid lines
        },
      },
      y: {
        title: {
            display: true,
            text: 'Kilométrage (km)',
            color: '#efe4cc',
        },
        ticks: {
          color: '#bfae8f', // Lighter text for y-axis
           callback: function(value: any) {
              return value.toLocaleString('fr-FR') + ' km'; // Format mileage
           }
        },
        grid: {
          color: 'rgba(212, 148, 58, 0.12)', // Subtle grid lines
        },
      },
    },
  };


  if (loading) {
    return <Chargement texte="Chargement des statistiques…" />;
  }

  if (error) {
    return <div className="text-center text-rouille">{error}</div>;
  }

  if (vehicles.length === 0) {
    return <div className="text-center text-light">Ajoutez des véhicules et des entretiens pour voir les statistiques.</div>;
  }

  return (
    <div className="container mx-auto">
      <h2 className="titre-page">Statistiques de la Flotte</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mileage Evolution Chart */}
        <div className="panneau rounded-lg p-4 md:p-6 border border-primary/30 lg:col-span-2"> {/* Make it span full width */}
           <Line data={mileageEvolutionData} options={mileageEvolutionOptions} />
        </div>

        {/* Total Cost per Vehicle Chart */}
        <div className="panneau rounded-lg p-4 md:p-6 border border-primary/30">
          <Bar data={totalCostPerVehicleData} options={totalCostPerVehicleOptions} />
        </div>

        {/* Maintenance Entry Count per Vehicle Chart */}
        <div className="panneau rounded-lg p-4 md:p-6 border border-primary/30">
           <Bar data={entryCountPerVehicleData} options={entryCountPerVehicleOptions} />
        </div>

         {/* Total Cost by Maintenance Type Chart */}
         {/* Only show if there are costs categorized */}
         {filteredCosts.length > 0 && (
           <div className="panneau rounded-lg p-4 md:p-6 border border-primary/30 lg:col-span-2 flex justify-center">
             {/* Doughnut chart might look better centered or in a smaller container */}
             <div className="w-full max-w-md"> {/* Limit width for Doughnut */}
               <Doughnut data={totalCostByTypeData} options={totalCostByTypeOptions} />
             </div>
          </div>
         )}
      </div>
    </div>
  );
};

export default Stats;
