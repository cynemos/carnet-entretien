import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import VehicleList from './pages/VehicleList';
import VehicleDetail from './pages/VehicleDetail';
import AddVehicle from './pages/AddVehicle';
import AddMaintenance from './pages/AddMaintenance';
import Stats from './pages/Stats';
import EditVehicle from './pages/EditVehicle';
import EditMaintenance from './pages/EditMaintenance';
import ControleTechnique from './pages/ControleTechnique'; // This is likely the Add CT page
import VehicleControleTechniqueHistory from './pages/VehicleControleTechniqueHistory';
import PreviousOwners from './pages/PreviousOwners';
import EditControleTechnique from './pages/EditControleTechnique';
import AddPreviousOwner from './pages/AddPreviousOwner';
import EditPreviousOwner from './pages/EditPreviousOwner';
import Suivi from './pages/Suivi'; // Import the Suivi page
import Alerts from './pages/Alerts'; // Import the new Alerts page


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<VehicleList />} />
          <Route path="add-vehicle" element={<AddVehicle />} />
          <Route path="vehicle/:vehicleId" element={<VehicleDetail />} />
          <Route path="vehicle/:vehicleId/add-maintenance" element={<AddMaintenance />} />
          <Route path="stats" element={<Stats />} />
          <Route path="edit-vehicle/:id" element={<EditVehicle />} />
          <Route path="vehicle/:vehicleId/edit-maintenance/:entryId" element={<EditMaintenance />} />
          <Route path="vehicle/:vehicleId/add-controle-technique" element={<ControleTechnique />} />
          <Route path="vehicle/:vehicleId/controle-technique-history" element={<VehicleControleTechniqueHistory />} />
          <Route path="vehicle/:vehicleId/edit-controle-technique/:entryId" element={<EditControleTechnique />} />
          <Route path="vehicle/:vehicleId/previous-owners" element={<PreviousOwners />} />
          <Route path="vehicle/:vehicleId/add-previous-owner" element={<AddPreviousOwner />} />
          <Route path="vehicle/:vehicleId/edit-previous-owner/:entryId" element={<EditPreviousOwner />} />
          <Route path="suivi" element={<Suivi />} /> {/* Suivi route */}
          <Route path="alerts" element={<Alerts />} /> {/* Add the new Alerts route */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
