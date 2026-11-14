import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Vehicle } from '../../types';
import { ajouterDepense, supprimerDepense } from '../../utils/donnees';
import { CATEGORIES_FRAIS, libelleFrais } from '../../utils/categories';
import { euros } from '../../utils/bilan';
import Section, { boutonPrincipal, boutonSecondaire, etiquette } from './Section';

// Frais hors entretien (assurance, carte grise, stockage, carburant…), comptés dans le bilan
const FraisAnnexes: React.FC<{ vehicle: Vehicle; onChange: () => void }> = ({ vehicle, onChange }) => {
  const [formulaire, setFormulaire] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categorie, setCategorie] = useState('assurance');
  const [montant, setMontant] = useState('');
  const [libelle, setLibelle] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  const total = vehicle.depenses.reduce((s, d) => s + d.montant, 0);

  const agir = async (action: () => Promise<unknown>) => {
    setErreur(null);
    try { await action(); onChange(); } catch (e) { setErreur(e instanceof Error ? e.message : 'Action impossible.'); }
  };

  const ajouter = (e: React.FormEvent) => {
    e.preventDefault();
    agir(async () => {
      await ajouterDepense(vehicle.id, { date, categorie, montant: Number(montant), libelle: libelle.trim() });
      setMontant(''); setLibelle(''); setFormulaire(false);
    });
  };

  return (
    <Section titre="Frais annexes" actions={!formulaire && (
      <button type="button" onClick={() => setFormulaire(true)} className={boutonPrincipal}><Plus size={18} /> Ajouter</button>
    )}>
      {formulaire && (
        <form onSubmit={ajouter} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5 p-4 rounded-md bg-black/20 border border-dashed border-primary/40">
          <label className="block"><span className={etiquette}>Date</span>
            <input type="date" className="input w-full" required value={date} onChange={e => setDate(e.target.value)} /></label>
          <label className="block"><span className={etiquette}>Catégorie</span>
            <select className="input w-full" value={categorie} onChange={e => setCategorie(e.target.value)}>
              {CATEGORIES_FRAIS.map(c => <option key={c.code} value={c.code}>{c.libelle}</option>)}
            </select></label>
          <label className="block"><span className={etiquette}>Montant (€)</span>
            <input type="number" className="input w-full" required min={0} step="0.01" inputMode="decimal" value={montant} onChange={e => setMontant(e.target.value)} /></label>
          <label className="block"><span className={etiquette}>Libellé (facultatif)</span>
            <input className="input w-full" value={libelle} onChange={e => setLibelle(e.target.value)} placeholder="Ex. assurance collection 2026" /></label>
          <div className="sm:col-span-4 flex gap-2">
            <button type="submit" className={boutonPrincipal}>Enregistrer</button>
            <button type="button" onClick={() => setFormulaire(false)} className={boutonSecondaire}>Annuler</button>
          </div>
        </form>
      )}
      {vehicle.depenses.length === 0 ? <p className="text-light/60">Aucun frais enregistré. Assurance, carte grise, garage, carburant : ils comptent dans le vrai coût du véhicule.</p> : (
        <div className="overflow-x-auto">
          <table className="table-cartes min-w-full text-light text-sm md:text-base">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-primary/30 text-left">Date</th>
                <th className="py-2 px-4 border-b border-primary/30 text-left">Catégorie</th>
                <th className="py-2 px-4 border-b border-primary/30 text-left">Libellé</th>
                <th className="py-2 px-4 border-b border-primary/30 text-right">Montant</th>
                <th className="py-2 px-4 border-b border-primary/30 text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {vehicle.depenses.map(d => (
                <tr key={d.id} className="hover:bg-primary/10">
                  <td className="py-2 px-4 border-b border-primary/30" data-label="Date">{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                  <td className="py-2 px-4 border-b border-primary/30" data-label="Catégorie">{libelleFrais(d.categorie)}</td>
                  <td className="py-2 px-4 border-b border-primary/30" data-label="Libellé">{d.libelle || '—'}</td>
                  <td className="py-2 px-4 border-b border-primary/30 text-right font-machine" data-label="Montant">{euros(d.montant, 2)}</td>
                  <td className="py-2 px-4 border-b border-primary/30 text-right" data-label="Actions">
                    <button type="button" title="Supprimer" onClick={() => confirm('Supprimer ce frais ?') && agir(() => supprimerDepense(d.id))}
                      className="text-rouille"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-right mt-3 text-light/70">Total : <span className="font-machine text-primary">{euros(total, 2)}</span></p>
        </div>
      )}
      {erreur && <p className="text-rouille text-sm mt-2">{erreur}</p>}
    </Section>
  );
};

export default FraisAnnexes;
