import React, { useEffect, useRef, useState } from 'react';
import { FileText, Upload, X, Loader2 } from 'lucide-react';
import { envoyerFichier, lienFichier } from '../utils/fichiers';
import { Vehicle } from '../types';
import sansPhoto from '../assets/sans-photo.svg';

// Ouvre un fichier du serveur dans un nouvel onglet (lien signé obtenu au clic)
export const LienFichier: React.FC<{ chemin: string; libelle?: string; className?: string }> = ({ chemin, libelle = 'Voir', className }) => {
  const [erreur, setErreur] = useState(false);
  const ouvrir = async () => {
    // L'onglet est ouvert tout de suite (sinon le navigateur du téléphone bloque la fenêtre)
    const onglet = window.open('', '_blank');
    try {
      const url = await lienFichier(chemin);
      if (onglet) onglet.location.href = url; else window.location.href = url;
    } catch {
      onglet?.close();
      setErreur(true);
    }
  };
  return (
    <button type="button" onClick={ouvrir} className={className ?? 'inline-flex items-center gap-1 text-accent hover:text-accent-clair'}>
      <FileText size={16} /> {erreur ? 'Introuvable' : libelle}
    </button>
  );
};

// Photo du véhicule : fichier du serveur, sinon adresse web, sinon croquis
export const PhotoVehicule: React.FC<{ vehicle: Pick<Vehicle, 'photoPath' | 'imageUrl' | 'make' | 'model'>; className?: string }> = ({ vehicle, className }) => {
  const [src, setSrc] = useState<string>(vehicle.photoPath ? '' : vehicle.imageUrl || sansPhoto);
  useEffect(() => {
    if (!vehicle.photoPath) { setSrc(vehicle.imageUrl || sansPhoto); return; }
    let actif = true;
    lienFichier(vehicle.photoPath).then(u => actif && setSrc(u)).catch(() => actif && setSrc(vehicle.imageUrl || sansPhoto));
    return () => { actif = false; };
  }, [vehicle.photoPath, vehicle.imageUrl]);
  return src
    ? <img src={src} alt={`${vehicle.make} ${vehicle.model}`} loading="lazy" className={className} onError={() => setSrc(sansPhoto)} />
    : <div className={`${className} bg-black/30 animate-pulse`} />;
};

// Champ de formulaire : envoyer, voir, remplacer ou retirer un fichier
export const ChampFichier: React.FC<{
  vehicleId: string;
  chemin?: string;
  onChange: (chemin: string | undefined) => void;
  libelle: string;
  accept?: string;
}> = ({ vehicleId, chemin, onChange, libelle, accept = 'image/*,application/pdf' }) => {
  const entree = useRef<HTMLInputElement>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const choisir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    e.target.value = '';
    if (!fichier) return;
    if (fichier.size > 20 * 1024 * 1024) { setErreur('Fichier trop lourd (20 Mo au plus).'); return; }
    setEnvoi(true);
    setErreur(null);
    try {
      onChange(await envoyerFichier(vehicleId, fichier));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Envoi impossible.');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div>
      <span className="block font-titre uppercase tracking-wider text-xs text-primary/90 mb-1">{libelle}</span>
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-md border border-dashed border-primary/40 bg-black/20">
        {chemin ? <LienFichier chemin={chemin} libelle="Fichier enregistré" /> : <span className="text-light/50 text-sm font-machine">Aucun fichier</span>}
        <button type="button" disabled={envoi} onClick={() => entree.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-primary/50 text-primary hover:bg-primary/10 text-sm disabled:opacity-60">
          {envoi ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {envoi ? 'Envoi…' : chemin ? 'Remplacer' : 'Envoyer'}
        </button>
        {chemin && !envoi && (
          <button type="button" onClick={() => onChange(undefined)} className="inline-flex items-center gap-1 text-sm text-light/60 hover:text-rouille">
            <X size={15} /> Retirer
          </button>
        )}
        <input ref={entree} type="file" accept={accept} className="hidden" onChange={choisir} />
      </div>
      {erreur && <p className="text-rouille text-sm mt-1">{erreur}</p>}
    </div>
  );
};
