import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Car, PlusCircle, BarChart2, ListChecks, AlertTriangle, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Define props for Layout, including the new hasUnreadAlerts prop
interface LayoutProps {
  hasUnreadAlerts?: boolean; // Optional prop to indicate unread alerts
}

// Update the component signature to accept props
const Layout: React.FC<LayoutProps> = ({ hasUnreadAlerts = false }) => { // Default to false if not provided
  return (
    <div className="flex min-h-screen bg-dark text-light">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary p-6 flex flex-col">
        <div className="flex items-center mb-8">
          <Car size={32} color="#FF4500" className="mr-2" />
          <h1 className="text-xl font-bold text-primary">Carnets d'entretien</h1>
        </div>
        <nav className="flex flex-col space-y-4">
          <Link to="/" className="flex items-center text-light hover:text-primary transition-colors duration-200">
            <Car size={20} className="mr-2" />
            Véhicules
          </Link>
          <Link to="/add-vehicle" className="flex items-center text-light hover:text-primary transition-colors duration-200">
            <PlusCircle size={20} className="mr-2" />
            Ajouter Véhicule
          </Link>
          <Link to="/stats" className="flex items-center text-light hover:text-primary transition-colors duration-200">
            <BarChart2 size={20} className="mr-2" />
            Statistiques
          </Link>
          {/* Link to Suivi */}
          <Link to="/suivi" className="flex items-center text-light hover:text-primary transition-colors duration-200">
            <ListChecks size={20} className="mr-2" />
            Suivi
          </Link>
           {/* Link to Alerts */}
          <Link to="/alerts" className="flex items-center text-light hover:text-primary transition-colors duration-200 relative"> {/* Added relative positioning */}
            <AlertTriangle size={20} className="mr-2" />
            Alertes
            {/* Conditional indicator */}
            {hasUnreadAlerts && (
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-secondary bg-red-500"></span> // Added absolute positioning and styling
            )}
          </Link>
        </nav>
        <div className="mt-auto pt-8 flex items-center justify-between text-sm text-gray-400">
          <button type="button" onClick={() => supabase.auth.signOut()}
            className="flex items-center hover:text-primary transition-colors duration-200">
            <LogOut size={16} className="mr-2" />
            Déconnexion
          </button>
          <span>v{__APP_VERSION__}</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-dark bg-racing-stripes bg-repeat">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
