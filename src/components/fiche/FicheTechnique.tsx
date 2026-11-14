import React, { useState } from 'react';
import { Edit, Plus, Save, Trash2, X } from 'lucide-react';
import { LigneFiche, Vehicle } from '../../types';
import { updateVehicle } from '../../utils/donnees';
import { FICHE_PAR_DEFAUT } from '../../utils/categories';
import Section, { boutonPrincipal, boutonSecondaire } from './Section';

// Aide-mémoire d'atelier : huile, filtres, pneus, références… (lignes libres)
const FicheTechnique: React.FC<{ vehicle: Vehicle; onChange: () => void }> = ({ vehicle, onChange }) => {
  const [edition, setEdition] = useState<LigneFiche[] | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const ouvrir = () => setEdition(vehicle.ficheTechnique.length
    ? vehicle.ficheTechnique.map(l => ({ ...l }))
    : FICHE_PAR_DEFAUT.map(libelle => ({ libelle, valeur: '' })));

  const changer = (i: number, l: Partial<LigneFiche>) => setEdition(e => e && e.map((x, j) => (j === i ? { ...x, ...l } : x)));

  const enregistrer = async () => {
    if (!edition) return;
    setEnvoi(true);
    setErreur(null);
    try {
      await updateVehicle(vehicle.id, { ficheTechnique: edition.filter(l => l.valeur.trim()) });
      setEdition(null);
      onChange();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Section titre="Fiche technique" actions={!edition && (
      <button type="button" onClick={ouvrir} className={boutonSecondaire}><Edit size={16} /> {vehicle.ficheTechnique.length ? 'Modifier' : 'Remplir'}</button>
    )}>
      {!edition && (vehicle.ficheTechnique.length === 0
        ? <p className="text-light/60">Huile, filtres, bougies, pressions des pneus, références des pièces : tout ce qu'il faut avoir sous la main à l'atelier.</p>
        : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {vehicle.ficheTechnique.map((l, i) => (
              <div key={i} className="border-b border-dashed border-primary/20 pb-1.5">
                <dt className="font-titre uppercase tracking-wider text-[0.7rem] text-primary/80">{l.libelle}</dt>
                <dd className="font-machine text-light whitespace-pre-line">{l.valeur}</dd>
              </div>
            ))}
          </dl>
        ))}
      {edition && (
        <div className="space-y-2">
          {edition.map((l, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-center pb-2 sm:pb-0 border-b sm:border-0 border-primary/15">
              <input className="input sm:w-64" value={l.libelle} placeholder="Élément" onChange={e => changer(i, { libelle: e.target.value })} />
              <input className="input flex-1" value={l.valeur}
                placeholder="Valeur, référence…" onChange={e => changer(i, { valeur: e.target.value })} />
              <button type="button" aria-label="Retirer la ligne" onClick={() => setEdition(e => e && e.filter((_, j) => j !== i))}
                className="text-light/50 hover:text-rouille p-1"><Trash2 size={18} /></button>
            </div>
          ))}
          <p className="text-xs text-light/50">Les lignes sans valeur ne sont pas enregistrées.</p>
          {erreur && <p className="text-rouille text-sm">{erreur}</p>}
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="button" onClick={() => setEdition(e => e && [...e, { libelle: '', valeur: '' }])} className={boutonSecondaire}><Plus size={16} /> Ligne</button>
            <button type="button" onClick={enregistrer} disabled={envoi} className={boutonPrincipal}><Save size={16} /> {envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
            <button type="button" onClick={() => setEdition(null)} className={boutonSecondaire}><X size={16} /> Annuler</button>
          </div>
        </div>
      )}
    </Section>
  );
};

export default FicheTechnique;
