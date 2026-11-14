import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Connexion from './components/Connexion';
import VehicleList from './pages/VehicleList';
import VehicleDetail from './pages/VehicleDetail';
import AddVehicle from './pages/AddVehicle';
import AddMaintenance from './pages/AddMaintenance';
import EditVehicle from './pages/EditVehicle';
import EditMaintenance from './pages/EditMaintenance';
import ControleTechnique from './pages/ControleTechnique'; // This is likely the Add CT page
import VehicleControleTechniqueHistory from './pages/VehicleControleTechniqueHistory';
import PreviousOwners from './pages/PreviousOwners';
import EditControleTechnique from './pages/EditControleTechnique';
import AddPreviousOwner from './pages/AddPreviousOwner';
import EditPreviousOwner from './pages/EditPreviousOwner';
import Suivi from './pages/Suivi'; // Import the Suivi page
import Alerts from './pages/Alerts';
import Chargement from './components/Chargement';

// Chart.js n'est chargé qu'à l'ouverture des statistiques
const Stats = lazy(() => import('./pages/Stats'));
// Carnet partagé en lecture seule : seule page accessible sans compte
const PagePartage = lazy(() => import('./pages/PagePartage'));
const Recherche = lazy(() => import('./pages/Recherche'));


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/partage/:jeton" element={<Suspense fallback={<Chargement />}><PagePartage /></Suspense>} />
        <Route path="/" element={<Connexion><Layout /></Connexion>}>
          <Route path="recherche" element={<Suspense fallback={<Chargement />}><Recherche /></Suspense>} />
          <Route index element={<VehicleList />} />
          <Route path="add-vehicle" element={<AddVehicle />} />
          <Route path="vehicle/:vehicleId" element={<VehicleDetail />} />
          <Route path="vehicle/:vehicleId/add-maintenance" element={<AddMaintenance />} />
          <Route path="stats" element={<Suspense fallback={<Chargement />}><Stats /></Suspense>} />
          <Route path="edit-vehicle/:id" element={<EditVehicle />} />
          <Route path="vehicle/:vehicleId/edit-maintenance/:entryId" element={<EditMaintenance />} />
          <Route path="vehicle/:vehicleId/add-controle-technique" element={<ControleTechnique />} />
          <Route path="vehicle/:vehicleId/controle-technique-history" element={<VehicleControleTechniqueHistory />} />
          <Route path="vehicle/:vehicleId/edit-controle-technique/:entryId" element={<EditControleTechnique />} />
          <Route path="vehicle/:vehicleId/previous-owners" element={<PreviousOwners />} />
          <Route path="vehicle/:vehicleId/add-previous-owner" element={<AddPreviousOwner />} />
          <Route path="vehicle/:vehicleId/edit-previous-owner/:entryId" element={<EditPreviousOwner />} />
          <Route path="suivi" element={<Suivi />} /> {/* Suivi route */}
          <Route path="alerts" element={<Alerts />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
