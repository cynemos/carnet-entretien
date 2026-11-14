import React, { useEffect, useState } from 'react';
import { Vehicle, MaintenanceEntry, ControleTechniqueEntry } from '../types';
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
        backgroundColor: 'rgba(255, 159, 64, 0.6)', // Primary color
        borderColor: 'rgba(255, 159, 64, 1)',
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
          color: '#E0E0E0', // Light text for legend
        },
      },
      title: {
        display: true,
        text: 'Coût Total d\'Entretien par Véhicule',
        color: '#E0E0E0', // Light text for title
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
          color: '#B0B0B0', // Lighter text for x-axis
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)', // Subtle grid lines
        },
      },
      y: {
        ticks: {
          color: '#B0B0B0', // Lighter text for y-axis
           callback: function(value: any) {
              return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
           }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)', // Subtle grid lines
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
        backgroundColor: 'rgba(99, 132, 255, 0.6)', // Accent color
        borderColor: 'rgba(99, 132, 255, 1)',
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
          color: '#E0E0E0', // Light text for legend
        },
      },
      title: {
        display: true,
        text: 'Nombre d\'Entretiens par Véhicule',
        color: '#E0E0E0', // Light text for title
      },
    },
     scales: {
      x: {
        ticks: {
          color: '#B0B0B0', // Lighter text for x-axis
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)', // Subtle grid lines
        },
      },
      y: {
        ticks: {
          color: '#B0B0B0', // Lighter text for y-axis
           stepSize: 1, // Ensure integer ticks for count
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)', // Subtle grid lines
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
          'rgba(255, 99, 132, 0.6)', // Red
          'rgba(54, 162, 235, 0.6)', // Blue
          'rgba(255, 206, 86, 0.6)', // Yellow
          'rgba(75, 192, 192, 0.6)', // Green
          'rgba(153, 102, 255, 0.6)', // Purple
          'rgba(255, 159, 64, 0.6)', // Orange
          'rgba(201, 203, 207, 0.6)', // Grey
          'rgba(100, 149, 237, 0.6)', // Cornflower Blue
          'rgba(218, 112, 214, 0.6)', // Orchid
          'rgba(144, 238, 144, 0.6)', // Light Green
          'rgba(240, 128, 128, 0.6)', // Light Coral
          'rgba(173, 216, 230, 0.6)', // Light Blue
          'rgba(128, 128, 128, 0.6)', // Dark Grey (for 'Autre')
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(201, 203, 207, 1)',
          'rgba(100, 149, 237, 1)',
          'rgba(218, 112, 214, 1)',
          'rgba(144, 238, 144, 1)',
          'rgba(240, 128, 128, 1)',
          'rgba(173, 216, 230, 1)',
          'rgba(128, 128, 128, 1)',
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
          color: '#E0E0E0', // Light text for legend
        },
      },
      title: {
        display: true,
        text: 'Répartition des Coûts par Type d\'Entretien (Estimation)',
        color: '#E0E0E0', // Light text for title
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
        'rgba(255, 99, 132, 1)', // Red
        'rgba(54, 162, 235, 1)', // Blue
        'rgba(255, 206, 86, 1)', // Yellow
        'rgba(75, 192, 192, 1)', // Green
        'rgba(153, 102, 255, 1)', // Purple
        'rgba(255, 159, 64, 1)', // Orange
        'rgba(201, 203, 207, 1)', // Grey
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
          color: '#E0E0E0', // Light text for legend
        },
      },
      title: {
        display: true,
        text: 'Évolution du Kilométrage par Véhicule',
        color: '#E0E0E0', // Light text for title
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
          unit: 'year', // Display ticks by year initially
          tooltipFormat: 'dd/MM/yyyy', // Format date in tooltip
          displayFormats: {
            year: 'yyyy',
            month: 'MMM yyyy',
            day: 'dd/MM/yyyy',
          },
        },
        ticks: {
          color: '#B0B0B0', // Lighter text for x-axis
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)', // Subtle grid lines
        },
      },
      y: {
        title: {
            display: true,
            text: 'Kilométrage (km)',
            color: '#E0E0E0',
        },
        ticks: {
          color: '#B0B0B0', // Lighter text for y-axis
           callback: function(value: any) {
              return value.toLocaleString('fr-FR') + ' km'; // Format mileage
           }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)', // Subtle grid lines
        },
      },
    },
  };


  if (loading) {
    return <div className="text-center text-light">Chargement des statistiques...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (vehicles.length === 0) {
    return <div className="text-center text-light">Ajoutez des véhicules et des entretiens pour voir les statistiques.</div>;
  }

  return (
    <div className="container mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">Statistiques de la Flotte</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mileage Evolution Chart */}
        <div className="bg-secondary rounded-lg shadow-lg p-4 md:p-6 border border-primary/30 lg:col-span-2"> {/* Make it span full width */}
           <Line data={mileageEvolutionData} options={mileageEvolutionOptions} />
        </div>

        {/* Total Cost per Vehicle Chart */}
        <div className="bg-secondary rounded-lg shadow-lg p-4 md:p-6 border border-primary/30">
          <Bar data={totalCostPerVehicleData} options={totalCostPerVehicleOptions} />
        </div>

        {/* Maintenance Entry Count per Vehicle Chart */}
        <div className="bg-secondary rounded-lg shadow-lg p-4 md:p-6 border border-primary/30">
           <Bar data={entryCountPerVehicleData} options={entryCountPerVehicleOptions} />
        </div>

         {/* Total Cost by Maintenance Type Chart */}
         {/* Only show if there are costs categorized */}
         {filteredCosts.length > 0 && (
           <div className="bg-secondary rounded-lg shadow-lg p-4 md:p-6 border border-primary/30 lg:col-span-2 flex justify-center">
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
