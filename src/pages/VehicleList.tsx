import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Vehicle } from '../types';
import { getVehicles, deleteVehicle } from '../utils/donnees';
import { alertesVehicule, libelleType, kmActuel, estVendu } from '../utils/alertes';
import { Trash2, Edit, PlusCircle, Wrench, Gauge, AlertTriangle, ChevronRight, Download } from 'lucide-react';
import Chargement from '../components/Chargement';
import { PhotoVehicule } from '../components/Fichiers';
import { exporterJSON, exporterCSV } from '../utils/export';
import ImportSauvegarde from '../components/ImportSauvegarde';

// Affiche un nombre sur des rouleaux de compteur
const Compteur: React.FC<{ valeur: string }> = ({ valeur }) => (
  <span className="compteur" aria-label={valeur}>
    {valeur.split('').map((c, i) => <span key={i} className={/\d/.test(c) ? '' : 'sep'}>{c}</span>)}
  </span>
);

const nombre = (n: number) => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ');


const VehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      setVehicles(await getVehicles());
    } catch (err) {
      console.error('Erreur de chargement des véhicules :', err);
      setError('Erreur lors du chargement des véhicules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleDelete = async (v: Vehicle) => {
    if (!confirm(`Supprimer « ${v.make} ${v.model} » et tout son historique ? Cette action est définitive.`)) return;
    try {
      await deleteVehicle(v.id);
      fetchVehicles();
    } catch (err) {
      console.error('Erreur de suppression du véhicule :', err);
      setError('Erreur lors de la suppression du véhicule.');
    }
  };

  const bilan = useMemo(() => ({
    interventions: vehicles.reduce((n, v) => n + v.maintenanceHistory.length, 0),
    depense: vehicles.reduce((n, v) => n + v.maintenanceHistory.reduce((s, e) => s + (e.totalCost || 0), 0), 0),
  }), [vehicles]);

  if (loading) return <Chargement texte="Ouverture du garage…" />;
  if (error) return <div className="text-center text-rouille">{error}</div>;

  return (
    <div className="container mx-auto">
      {/* Bandeau d'accueil */}
      <section className="panneau rounded-xl px-6 py-7 md:px-10 md:py-9 mb-10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[repeating-linear-gradient(-45deg,#d4943a_0_14px,transparent_14px_28px)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-machine text-light/60 mb-2">Atelier de restauration — registre des véhicules</p>
            <h2 className="titre-page !mb-0">Ma flotte</h2>
          </div>
          <Link to="/add-vehicle" className="flex items-center bg-primary px-5 py-2.5 rounded-md">
            <PlusCircle size={20} className="mr-2" />
            Ajouter un véhicule
          </Link>
        </div>
        <dl className="relative mt-7 grid grid-cols-3 gap-3 md:gap-4 text-sm sm:text-xl md:text-2xl">
          <div><dt className="font-titre uppercase tracking-wider text-xs text-primary/80 mb-1.5">Véhicules</dt><dd><Compteur valeur={String(vehicles.filter(v => !estVendu(v)).length).padStart(2, '0')} /></dd></div>
          <div><dt className="font-titre uppercase tracking-wider text-xs text-primary/80 mb-1.5">Interventions</dt><dd><Compteur valeur={String(bilan.interventions).padStart(3, '0')} /></dd></div>
          <div><dt className="font-titre uppercase tracking-wider text-xs text-primary/80 mb-1.5">Investi (€)</dt><dd><Compteur valeur={nombre(bilan.depense)} /></dd></div>
        </dl>
      </section>

      {vehicles.length === 0 ? (
        <div className="text-center space-y-4">
          <p className="text-light font-machine">Le garage est vide. Ajoutez votre premier véhicule.</p>
          <ImportSauvegarde onTermine={fetchVehicles} />
        </div>
      ) : (
        <>
        {[{ titre: '', liste: vehicles.filter(v => !estVendu(v)) }, { titre: 'Ils ont quitté le garage', liste: vehicles.filter(estVendu) }]
          .filter(g => g.liste.length).map(g => (
        <section key={g.titre} className="mb-12">
        {g.titre && <h3 className="font-display text-xl md:text-2xl text-light/70 uppercase mb-5">{g.titre}</h3>}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
          {g.liste.map(vehicle => {
            const urgent = alertesVehicule(vehicle).some(a => a.niveau === 'urgent');
            return (
              <article key={vehicle.id} className="group panneau rounded-lg overflow-hidden transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.7)]">
                {/* Photo façon tirage argentique : sépia, couleur au survol */}
                <Link to={`/vehicle/${vehicle.id}`} className="block relative m-3 mb-0 p-2 pb-2 bg-[#efe4cc] rounded-sm shadow-[0_4px_10px_rgba(0,0,0,0.5)] rotate-[-0.6deg] group-hover:rotate-0 transition-transform duration-300">
                  <PhotoVehicule vehicle={vehicle} className={`w-full h-48 object-cover contrast-[1.05] transition-[filter] duration-500 ${estVendu(vehicle) ? 'grayscale' : 'sepia-[.55] group-hover:sepia-0'}`} />
                  {estVendu(vehicle) && <span className="tampon-vendu">Vendu</span>}
                  {vehicle.licensePlate && <span className="plaque absolute bottom-4 left-4 text-sm">{vehicle.licensePlate}</span>}
                  <span className="absolute -top-1 -right-1 w-14 h-14 rounded-full bg-rouille text-light font-display text-sm flex items-center justify-center rotate-12 shadow-lg border-2 border-dashed border-light/60">
                    {vehicle.year}
                  </span>
                </Link>
                <div className="p-5">
                  <p className="font-titre uppercase tracking-[0.2em] text-xs text-primary/80 mb-1">{libelleType(vehicle.type)}</p>
                  <h3 className="font-display text-xl text-light mb-3 leading-tight">{vehicle.make} <span className="text-primary">{vehicle.model}</span></h3>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-light/70 mb-4">
                    <span className="flex items-center gap-1.5"><Gauge size={16} className="text-primary" />{nombre(kmActuel(vehicle))} km</span>
                    <span className="flex items-center gap-1.5"><Wrench size={16} className="text-primary" />{vehicle.maintenanceHistory.length} interventions</span>
                    {urgent && <Link to="/alerts" className="flex items-center gap-1.5 text-rouille"><AlertTriangle size={16} />Alerte</Link>}
                  </div>
                  <div className="flex justify-between items-center border-t border-primary/15 pt-3">
                    <Link to={`/vehicle/${vehicle.id}`} className="flex items-center font-titre uppercase tracking-wider text-sm text-accent hover:text-accent-clair">
                      Ouvrir le carnet <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                    <div className="flex gap-3">
                      <Link to={`/edit-vehicle/${vehicle.id}`} aria-label="Modifier" className="text-light/50 hover:text-primary transition-colors"><Edit size={18} /></Link>
                      <button onClick={() => handleDelete(vehicle)} aria-label="Supprimer" className="text-light/50 hover:text-rouille transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        </section>
        ))}
        <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-primary/15">
          <span className="w-full text-center font-titre uppercase tracking-wider text-xs text-light/50">Exporter toutes les données</span>
          <button onClick={() => exporterJSON(vehicles)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-primary/40 text-primary hover:bg-primary/10 text-sm"><Download size={16} /> Sauvegarde complète (JSON)</button>
          <button onClick={() => exporterCSV(vehicles)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-primary/40 text-primary hover:bg-primary/10 text-sm"><Download size={16} /> Entretiens (CSV)</button>
          <ImportSauvegarde onTermine={fetchVehicles} />
        </div>
        </>
      )}
    </div>
  );
};

export default VehicleList;
