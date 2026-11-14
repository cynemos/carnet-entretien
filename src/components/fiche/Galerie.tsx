import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Save, Trash2, X } from 'lucide-react';
import { PhotoGalerie, Vehicle } from '../../types';
import { ajouterPhoto, modifierPhoto, supprimerPhoto } from '../../utils/donnees';
import { envoyerFichier, lienFichier } from '../../utils/fichiers';
import Section, { boutonPrincipal, boutonSecondaire, etiquette } from './Section';

// Image d'un fichier du serveur (lien signé)
const Image: React.FC<{ chemin: string; alt: string; className?: string }> = ({ chemin, alt, className }) => {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let actif = true;
    lienFichier(chemin).then(u => actif && setSrc(u)).catch(() => undefined);
    return () => { actif = false; };
  }, [chemin]);
  return src ? <img src={src} alt={alt} loading="lazy" className={className} /> : <div className={`${className} bg-black/30 animate-pulse`} />;
};

// Galerie photo datée : restauration avant / après, sorties, détails…
const Galerie: React.FC<{ vehicle: Vehicle; onChange: () => void }> = ({ vehicle, onChange }) => {
  const entree = useRef<HTMLInputElement>(null);
  const [envoi, setEnvoi] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouverte, setOuverte] = useState<number | null>(null);
  const [edition, setEdition] = useState<Pick<PhotoGalerie, 'date' | 'legende'>>({});

  const photos = vehicle.photos;
  const courante = ouverte !== null ? photos[ouverte] : undefined;

  useEffect(() => {
    if (courante) setEdition({ date: courante.date ?? '', legende: courante.legende ?? '' });
  }, [courante]);

  // Flèches du clavier et Échap dans la visionneuse
  useEffect(() => {
    if (ouverte === null) return;
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement;
      if (cible.tagName === 'INPUT') return;
      if (e.key === 'Escape') setOuverte(null);
      if (e.key === 'ArrowRight') setOuverte(i => (i === null ? i : (i + 1) % photos.length));
      if (e.key === 'ArrowLeft') setOuverte(i => (i === null ? i : (i - 1 + photos.length) % photos.length));
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [ouverte, photos.length]);

  const envoyer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichiers = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!fichiers.length) return;
    setErreur(null);
    try {
      for (const [i, f] of fichiers.entries()) {
        setEnvoi(`${i + 1} / ${fichiers.length}`);
        if (f.size > 20 * 1024 * 1024) throw new Error(`${f.name} : trop lourd (20 Mo au plus).`);
        const chemin = await envoyerFichier(vehicle.id, f);
        // Date de la photo : celle du fichier (souvent la date de prise de vue sur un téléphone)
        await ajouterPhoto(vehicle.id, { chemin, date: new Date(f.lastModified || Date.now()).toISOString().slice(0, 10) });
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Envoi impossible.');
    } finally {
      setEnvoi(null);
      onChange();
    }
  };

  const enregistrer = async () => {
    if (!courante) return;
    try { await modifierPhoto(courante.id, edition); onChange(); } catch (e) { setErreur(e instanceof Error ? e.message : 'Enregistrement impossible.'); }
  };

  const supprimer = async () => {
    if (!courante || !confirm('Supprimer cette photo ?')) return;
    try {
      await supprimerPhoto(courante.id);
      setOuverte(null);
      onChange();
    } catch (e) { setErreur(e instanceof Error ? e.message : 'Suppression impossible.'); }
  };

  return (
    <Section titre={`Galerie${photos.length ? ` (${photos.length})` : ''}`} actions={
      <button type="button" disabled={!!envoi} onClick={() => entree.current?.click()} className={boutonPrincipal}>
        {envoi ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />} {envoi ? `Envoi ${envoi}` : 'Ajouter des photos'}
      </button>
    }>
      <input ref={entree} type="file" accept="image/*" multiple className="hidden" onChange={envoyer} />
      {photos.length === 0 ? <p className="text-light/60">Photos de la restauration (avant / après), des sorties, des détails… Elles sont réduites avant l'envoi.</p> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {photos.map((p, i) => (
            <button key={p.id} type="button" onClick={() => setOuverte(i)}
              className="group p-1.5 pb-1 bg-[#efe4cc] rounded-sm shadow-[0_4px_10px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 transition-transform text-left">
              <Image chemin={p.chemin} alt={p.legende || 'Photo'} className="w-full aspect-[4/3] object-cover sepia-[.3] group-hover:sepia-0 transition-[filter]" />
              <span className="block font-machine text-[0.7rem] text-[#3a2d20] truncate pt-1">
                {[p.date && new Date(p.date).toLocaleDateString('fr-FR'), p.legende].filter(Boolean).join(' · ') || ' '}
              </span>
            </button>
          ))}
        </div>
      )}
      {erreur && <p className="text-rouille text-sm mt-2">{erreur}</p>}

      {courante && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" role="dialog" aria-modal="true" aria-label="Photo">
          <div className="flex justify-between items-center p-3 text-light">
            <span className="font-machine text-sm">{(ouverte ?? 0) + 1} / {photos.length}</span>
            <button type="button" onClick={() => setOuverte(null)} aria-label="Fermer" className="p-2 hover:text-primary"><X size={28} /></button>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center gap-2 px-2">
            {photos.length > 1 && <button type="button" aria-label="Précédente" onClick={() => setOuverte(i => ((i ?? 0) - 1 + photos.length) % photos.length)} className="p-2 text-light hover:text-primary"><ChevronLeft size={36} /></button>}
            <Image key={courante.id} chemin={courante.chemin} alt={courante.legende || 'Photo'} className="max-h-full max-w-full object-contain min-w-0 flex-1" />
            {photos.length > 1 && <button type="button" aria-label="Suivante" onClick={() => setOuverte(i => ((i ?? 0) + 1) % photos.length)} className="p-2 text-light hover:text-primary"><ChevronRight size={36} /></button>}
          </div>
          <div className="p-3 flex flex-wrap items-end gap-3 justify-center bg-secondary/80">
            <label className="block"><span className={etiquette}>Date</span>
              <input type="date" className="input" value={edition.date ?? ''} onChange={e => setEdition(x => ({ ...x, date: e.target.value }))} /></label>
            <label className="block flex-1 min-w-[12rem] max-w-md"><span className={etiquette}>Légende</span>
              <input className="input w-full" value={edition.legende ?? ''} placeholder="Ex. châssis décapé" onChange={e => setEdition(x => ({ ...x, legende: e.target.value }))} /></label>
            <button type="button" onClick={enregistrer} className={boutonPrincipal}><Save size={16} /> Enregistrer</button>
            <button type="button" onClick={supprimer} className={`${boutonSecondaire} !border-rouille/60 !text-rouille`}><Trash2 size={16} /> Supprimer</button>
          </div>
        </div>
      )}
    </Section>
  );
};

export default Galerie;
