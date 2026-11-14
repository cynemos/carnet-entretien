import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ClipboardList, Plus, Trash2, Undo2, Wrench } from 'lucide-react';
import { Travail, Vehicle } from '../../types';
import { ajouterTravail, modifierTravail, supprimerTravail } from '../../utils/donnees';
import { euros } from '../../utils/bilan';
import Section, { boutonPrincipal, boutonSecondaire, etiquette } from './Section';

const PRIORITES: Record<Travail['priorite'], { libelle: string; classe: string }> = {
  1: { libelle: 'Urgent', classe: 'bg-rouille text-light' },
  2: { libelle: 'Normal', classe: 'bg-primary/80 text-secondary' },
  3: { libelle: 'Un jour', classe: 'bg-light/20 text-light' },
};

const aujourdhui = () => new Date().toISOString().slice(0, 10);
const dateFr = (d?: string) => (d ? new Date(d).toLocaleDateString('fr-FR') : '');

// Défauts d'un CT (texte libre) → un travail par ligne
const lignesDefauts = (texte?: string) =>
  (texte ?? '').split(/\r?\n|;|•/).map(t => t.replace(/^[\s\-–*]+/, '').trim()).filter(t => t.length > 2);

// Liste des travaux à faire : pièces à commander, défauts relevés au CT…
// « Fait » ouvre la saisie d'un entretien pré-remplie ; le travail est coché à l'enregistrement.
const TravauxAFaire: React.FC<{ vehicle: Vehicle; onChange: () => void }> = ({ vehicle, onChange }) => {
  const [formulaire, setFormulaire] = useState(false);
  const [titre, setTitre] = useState('');
  const [details, setDetails] = useState('');
  const [priorite, setPriorite] = useState<Travail['priorite']>(2);
  const [cout, setCout] = useState('');
  const [voirFaits, setVoirFaits] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const ouverts = vehicle.travaux.filter(t => !t.faitLe).sort((a, b) => a.priorite - b.priorite);
  const faits = vehicle.travaux.filter(t => t.faitLe).sort((a, b) => (b.faitLe ?? '').localeCompare(a.faitLe ?? ''));
  const estimation = ouverts.reduce((s, t) => s + (t.coutEstime ?? 0), 0);

  const dernierCT = [...vehicle.controleTechniqueHistory].sort((a, b) => b.date.localeCompare(a.date))[0];
  const defautsCT = dernierCT ? [...lignesDefauts(dernierCT.majorFailures).map(t => ({ t, p: 1 as const })), ...lignesDefauts(dernierCT.minorFailures).map(t => ({ t, p: 2 as const }))]
    .filter(d => !vehicle.travaux.some(t => t.titre === d.t)) : [];

  const agir = async (action: () => Promise<unknown>) => {
    setErreur(null);
    try { await action(); onChange(); } catch (e) { setErreur(e instanceof Error ? e.message : 'Action impossible.'); }
  };

  const ajouter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;
    agir(async () => {
      await ajouterTravail(vehicle.id, { titre: titre.trim(), details: details.trim() || undefined, priorite, coutEstime: cout ? Number(cout) : undefined });
      setTitre(''); setDetails(''); setCout(''); setPriorite(2); setFormulaire(false);
    });
  };

  return (
    <Section titre="Travaux à faire" actions={!formulaire && (
      <button type="button" onClick={() => setFormulaire(true)} className={boutonPrincipal}><Plus size={18} /> Ajouter</button>
    )}>
      {formulaire && (
        <form onSubmit={ajouter} className="grid grid-cols-1 sm:grid-cols-[1fr_10rem_10rem] gap-3 mb-5 p-4 rounded-md bg-black/20 border border-dashed border-primary/40">
          <label className="block sm:col-span-3"><span className={etiquette}>Travail</span>
            <input className="input w-full" required value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex. Changer les pneus avant" autoFocus /></label>
          <label className="block"><span className={etiquette}>Détails (facultatif)</span>
            <input className="input w-full" value={details} onChange={e => setDetails(e.target.value)} placeholder="Référence, fournisseur…" /></label>
          <label className="block"><span className={etiquette}>Priorité</span>
            <select className="input w-full" value={priorite} onChange={e => setPriorite(Number(e.target.value) as Travail['priorite'])}>
              <option value={1}>Urgent</option><option value={2}>Normal</option><option value={3}>Un jour</option>
            </select></label>
          <label className="block"><span className={etiquette}>Coût estimé (€)</span>
            <input className="input w-full" type="number" min={0} step="0.01" inputMode="decimal" value={cout} onChange={e => setCout(e.target.value)} /></label>
          <div className="sm:col-span-3 flex gap-2">
            <button type="submit" className={boutonPrincipal}>Enregistrer</button>
            <button type="button" onClick={() => setFormulaire(false)} className={boutonSecondaire}>Annuler</button>
          </div>
        </form>
      )}

      {defautsCT.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-light/70">
          <span>Le dernier CT signale {defautsCT.length} défaut{defautsCT.length > 1 ? 's' : ''} pas encore dans la liste.</span>
          <button type="button" className={boutonSecondaire}
            onClick={() => agir(() => Promise.all(defautsCT.map(d => ajouterTravail(vehicle.id, { titre: d.t, details: `Relevé au CT du ${dateFr(dernierCT.date)}`, priorite: d.p }))))}>
            <ClipboardList size={16} /> Les ajouter
          </button>
        </div>
      )}

      {ouverts.length === 0 ? <p className="text-light/60">Rien en attente.</p> : (
        <ul className="divide-y divide-primary/15">
          {ouverts.map(t => (
            <li key={t.id} className="py-3 flex flex-wrap items-start gap-3">
              <span className={`text-[0.65rem] font-titre uppercase tracking-wider px-2 py-0.5 rounded ${PRIORITES[t.priorite].classe}`}>{PRIORITES[t.priorite].libelle}</span>
              <div className="flex-1 min-w-[12rem]">
                <p className="text-light">{t.titre}</p>
                {(t.details || t.coutEstime !== undefined) && (
                  <p className="text-sm text-light/55">{[t.details, t.coutEstime !== undefined ? `≈ ${euros(t.coutEstime)}` : ''].filter(Boolean).join(' · ')}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link to={`/vehicle/${vehicle.id}/add-maintenance?travail=${t.id}&description=${encodeURIComponent(t.titre)}`}
                  className="inline-flex items-center gap-1 text-accent hover:text-accent-clair text-sm" title="Noter l'entretien correspondant">
                  <Wrench size={16} /> Fait
                </Link>
                <button type="button" title="Cocher sans noter d'entretien" onClick={() => agir(() => modifierTravail(t.id, { faitLe: aujourdhui() }))}
                  className="text-light/50 hover:text-accent"><Check size={18} /></button>
                <button type="button" title="Supprimer" onClick={() => confirm('Supprimer ce travail ?') && agir(() => supprimerTravail(t.id))}
                  className="text-light/50 hover:text-rouille"><Trash2 size={18} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {estimation > 0 && <p className="text-sm text-light/60 mt-3 text-right">Estimation des travaux en attente : <span className="font-machine text-primary">{euros(estimation)}</span></p>}

      {faits.length > 0 && (
        <div className="mt-4">
          <button type="button" onClick={() => setVoirFaits(v => !v)} className="text-sm text-light/50 hover:text-light">
            {voirFaits ? 'Masquer' : 'Voir'} les {faits.length} travaux faits
          </button>
          {voirFaits && (
            <ul className="mt-2 space-y-1">
              {faits.map(t => (
                <li key={t.id} className="flex items-center gap-3 text-sm text-light/50">
                  <Check size={15} className="text-accent" />
                  <span className="line-through flex-1">{t.titre}</span>
                  <span className="font-machine">{dateFr(t.faitLe)}</span>
                  <button type="button" title="Remettre dans la liste" onClick={() => agir(() => modifierTravail(t.id, { faitLe: undefined, entretienId: undefined }))}
                    className="hover:text-primary"><Undo2 size={15} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {erreur && <p className="text-rouille text-sm mt-2">{erreur}</p>}
    </Section>
  );
};

export default TravauxAFaire;
