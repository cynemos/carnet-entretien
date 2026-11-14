import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Vehicle } from '../types';
import { restaurerSauvegarde } from '../utils/donnees';

// Restaure une sauvegarde JSON (exportée par « Sauvegarde complète »).
// N'ajoute que ce qui manque : rien d'existant n'est modifié ni supprimé.
const ImportSauvegarde: React.FC<{ onTermine: () => void }> = ({ onTermine }) => {
  const entree = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ texte: string; erreur?: boolean } | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const choisir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    e.target.value = '';
    if (!fichier) return;
    setMessage(null);
    try {
      const contenu = JSON.parse(await fichier.text());
      const vehicules: Vehicle[] = Array.isArray(contenu?.vehicules) ? contenu.vehicules : [];
      if (!vehicules.length || !vehicules.every(v => v && typeof v.id === 'string' && typeof v.make === 'string')) {
        throw new Error("Ce fichier n'est pas une sauvegarde des carnets.");
      }
      const date = contenu.exporteLe ? ` du ${new Date(contenu.exporteLe).toLocaleDateString('fr-FR')}` : '';
      if (!confirm(`Restaurer la sauvegarde${date} (${vehicules.length} véhicules) ?\n\nSeuls les véhicules et les lignes absents du garage seront ajoutés ; rien d'existant n'est modifié ni supprimé.\nLes photos et factures ne sont pas dans la sauvegarde JSON : elles ne reviennent que si leurs fichiers sont encore sur le serveur.`)) return;
      setEnvoi(true);
      const bilan = await restaurerSauvegarde(vehicules);
      setMessage({ texte: bilan.vehicules || bilan.lignes
        ? `Restauré : ${bilan.vehicules} véhicule(s) et ${bilan.lignes} ligne(s) d'historique.`
        : 'Rien à restaurer : tout était déjà là.' });
      onTermine();
    } catch (err) {
      setMessage({ texte: err instanceof SyntaxError ? 'Fichier JSON illisible.' : err instanceof Error ? err.message : 'Restauration impossible.', erreur: true });
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      <button type="button" disabled={envoi} onClick={() => entree.current?.click()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-primary/40 text-primary hover:bg-primary/10 text-sm disabled:opacity-60">
        <Upload size={16} /> {envoi ? 'Restauration…' : 'Restaurer une sauvegarde'}
      </button>
      <input ref={entree} type="file" accept="application/json,.json" className="hidden" onChange={choisir} />
      {message && <p className={`w-full text-center text-sm ${message.erreur ? 'text-rouille' : 'text-accent'}`}>{message.texte}</p>}
    </>
  );
};

export default ImportSauvegarde;
