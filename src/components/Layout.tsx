import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Car, PlusCircle, BarChart2, ListChecks, AlertTriangle, LogOut, Menu, X, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getVehicles } from '../utils/donnees';
import { compterAlertesActives } from '../utils/alertes';
import Embleme from './Embleme';

const LIENS = [
  { to: '/', label: 'Ma flotte', icone: Car, fin: true },
  { to: '/add-vehicle', label: 'Ajouter un véhicule', icone: PlusCircle },
  { to: '/stats', label: 'Statistiques', icone: BarChart2 },
  { to: '/recherche', label: 'Recherche', icone: Search },
  { to: '/suivi', label: 'Suivi', icone: ListChecks },
  { to: '/alerts', label: 'Alertes', icone: AlertTriangle, badge: true },
];

// Enseigne émaillée de l'atelier
const Enseigne: React.FC<{ compacte?: boolean }> = ({ compacte }) => (
  <Link to="/" className="flex items-center gap-3 group">
    <Embleme taille={compacte ? 36 : 56} className="drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:rotate-[20deg]" />
    <span className="leading-none">
      <span className={`block font-display text-primary ${compacte ? 'text-base' : 'text-xl'}`} style={{ textShadow: '0 2px 0 #000' }}>
        Carnets
      </span>
      <span className={`block font-titre uppercase tracking-[0.25em] text-light/70 ${compacte ? 'text-[0.6rem]' : 'text-[0.7rem] mt-1'}`}>
        d'entretien
      </span>
    </span>
  </Link>
);

const Layout: React.FC = () => {
  // Téléphone : la barre latérale devient un menu escamotable, refermé à chaque changement de page
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [nbAlertes, setNbAlertes] = useState(0);
  const { pathname } = useLocation();
  useEffect(() => setMenuOuvert(false), [pathname]);

  // Badge des alertes, recalculé à chaque page (la flotte est petite)
  useEffect(() => {
    getVehicles().then(v => setNbAlertes(compterAlertesActives(v))).catch(() => setNbAlertes(0));
  }, [pathname]);

  return (
    <div className="flex min-h-screen text-light">
      {/* Bandeau du haut, téléphone uniquement */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-16 flex items-center justify-between px-4 bg-secondary/95 backdrop-blur border-b-2 border-primary/60 shadow-lg">
        <Enseigne compacte />
        <button type="button" onClick={() => setMenuOuvert(o => !o)} aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOuvert} className="relative p-2 -mr-2 text-light hover:text-primary">
          {menuOuvert ? <X size={28} /> : <Menu size={28} />}
          {!menuOuvert && nbAlertes > 0 && <span className="absolute top-1 right-0 h-2.5 w-2.5 rounded-full bg-rouille ring-2 ring-secondary" />}
        </button>
      </header>
      {menuOuvert && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/70" onClick={() => setMenuOuvert(false)} aria-hidden="true" />
      )}

      {/* Barre latérale : fixe sur ordinateur, tiroir sur téléphone */}
      <aside className={`barre-atelier w-72 md:w-64 p-6 flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 md:z-auto ${menuOuvert ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10"><Enseigne /></div>
        <nav className="flex flex-col gap-1.5">
          {LIENS.map(({ to, label, icone: Icone, fin, badge }) => (
            <NavLink key={to} to={to} end={fin}
              className={({ isActive }) => `relative flex items-center gap-3 px-3 py-2.5 rounded-md font-titre uppercase tracking-wider text-sm transition-all duration-200 ${isActive
                ? 'bg-black/40 text-primary shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r before:bg-primary'
                : 'text-light/80 hover:text-light hover:bg-white/5 hover:translate-x-1'}`}>
              <Icone size={19} />
              <span className="flex-1">{label}</span>
              {badge && nbAlertes > 0 && (
                <span className="min-w-[1.4rem] h-[1.4rem] px-1 rounded-full bg-rouille text-light text-xs font-bold flex items-center justify-center shadow">
                  {nbAlertes}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-primary/20 flex items-center justify-between text-sm text-light/50">
          <button type="button" onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 hover:text-primary transition-colors duration-200">
            <LogOut size={16} />
            Déconnexion
          </button>
          <span className="font-machine">v{__APP_VERSION__}</span>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-4 pb-10 pt-24 md:px-10 md:py-10">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
