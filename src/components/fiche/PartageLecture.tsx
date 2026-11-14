import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Link2, Share2, ShieldOff } from 'lucide-react';
import { Partage, Vehicle } from '../../types';
import { creerPartage, listerPartages, revoquerPartage } from '../../utils/donnees';
import { liensPartage } from '../../utils/fichiers';
import Section, { boutonPrincipal, boutonSecondaire, etiquette } from './Section';

const adresse = (jeton: string) => `${window.location.origin}/partage/${jeton}`;

// Lien de partage en lecture seule (pour un acheteur, un club, un garage) : expire tout seul,
// révocable. Ne montre ni prix d'achat ou de vente, ni frais annexes, ni noms des anciens propriétaires.
const PartageLecture: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
  const [partages, setPartages] = useState<Partage[]>([]);
  const [formulaire, setFormulaire] = useState(false);
  const [jours, setJours] = useState(30);
  const [avecMontants, setAvecMontants] = useState(true);
  const [avecFactures, setAvecFactures] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [copie, setCopie] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(() => {
    listerPartages(vehicle.id).then(setPartages).catch(e => setErreur(e.message));
  }, [vehicle.id]);
  useEffect(charger, [charger]);

  const actifs = partages.filter(p => !p.revoque && new Date(p.expireLe) > new Date());

  const creer = async () => {
    setEnvoi(true);
    setErreur(null);
    try {
      const secondes = jours * 86_400;
      const chemins = [
        vehicle.photoPath ?? '',
        ...(avecFactures ? [...vehicle.maintenanceHistory.map(e => e.facturePath ?? ''), ...vehicle.controleTechniqueHistory.map(c => c.pvPath ?? '')] : []),
      ];
      const fichiers = await liensPartage(chemins, secondes);
      const jeton = await creerPartage(vehicle.id, { expireLe: new Date(Date.now() + secondes * 1000).toISOString(), avecMontants, avecFactures, fichiers });
      setFormulaire(false);
      charger();
      await copier(jeton);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Création impossible.');
    } finally {
      setEnvoi(false);
    }
  };

  const copier = async (jeton: string) => {
    try {
      await navigator.clipboard.writeText(adresse(jeton));
      setCopie(jeton);
      setTimeout(() => setCopie(null), 2500);
    } catch { /* presse-papiers refusé : l'adresse reste affichée */ }
  };

  const partager = (jeton: string) =>
    navigator.share?.({ title: `${vehicle.make} ${vehicle.model} — carnet d'entretien`, url: adresse(jeton) }).catch(() => undefined);

  const revoquer = async (p: Partage) => {
    if (!confirm("Révoquer ce lien ? La page ne s'ouvrira plus.")) return;
    try { await revoquerPartage(p.id); charger(); } catch (e) { setErreur(e instanceof Error ? e.message : 'Révocation impossible.'); }
  };

  return (
    <Section titre="Partager le carnet" actions={!formulaire && (
      <button type="button" onClick={() => setFormulaire(true)} className={boutonPrincipal}><Link2 size={18} /> Créer un lien</button>
    )}>
      <p className="text-light/60 text-sm mb-4">
        Un lien en lecture seule, pour un acheteur ou un garage : historique d'entretien, contrôles techniques, fiche technique.
        Jamais les prix d'achat et de vente, les frais annexes ni les noms des anciens propriétaires.
      </p>
      {formulaire && (
        <div className="mb-5 p-4 rounded-md bg-black/20 border border-dashed border-primary/40 space-y-3">
          <label className="block max-w-xs"><span className={etiquette}>Valable</span>
            <select className="input w-full" value={jours} onChange={e => setJours(Number(e.target.value))}>
              <option value={7}>7 jours</option><option value={30}>30 jours</option><option value={90}>90 jours</option>
            </select></label>
          <label className="flex items-center gap-2 text-light"><input type="checkbox" checked={avecMontants} onChange={e => setAvecMontants(e.target.checked)} className="accent-[#d4943a] w-4 h-4" />
            Montrer le coût de chaque intervention</label>
          <label className="flex items-center gap-2 text-light"><input type="checkbox" checked={avecFactures} onChange={e => setAvecFactures(e.target.checked)} className="accent-[#d4943a] w-4 h-4" />
            Joindre les factures et procès-verbaux enregistrés</label>
          {avecFactures && <p className="text-xs text-light/50">Les liens vers les fichiers restent valables jusqu'à l'expiration, même si le partage est révoqué avant.</p>}
          <div className="flex gap-2">
            <button type="button" onClick={creer} disabled={envoi} className={boutonPrincipal}>{envoi ? 'Création…' : 'Créer et copier le lien'}</button>
            <button type="button" onClick={() => setFormulaire(false)} className={boutonSecondaire}>Annuler</button>
          </div>
        </div>
      )}
      {actifs.length === 0 ? <p className="text-light/60">Aucun lien actif.</p> : (
        <ul className="divide-y divide-primary/15">
          {actifs.map(p => (
            <li key={p.id} className="py-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[14rem]">
                <p className="font-machine text-sm text-light break-all">{adresse(p.jeton)}</p>
                <p className="text-xs text-light/50">
                  Expire le {new Date(p.expireLe).toLocaleDateString('fr-FR')}
                  {p.avecMontants ? ' · avec montants' : ' · sans montants'}{p.avecFactures ? ' · avec factures' : ''}
                </p>
              </div>
              <button type="button" onClick={() => copier(p.jeton)} className={boutonSecondaire}><Copy size={15} /> {copie === p.jeton ? 'Copié' : 'Copier'}</button>
              {'share' in navigator && <button type="button" onClick={() => partager(p.jeton)} className={boutonSecondaire}><Share2 size={15} /> Envoyer</button>}
              <button type="button" onClick={() => revoquer(p)} className={`${boutonSecondaire} !border-rouille/60 !text-rouille`}><ShieldOff size={15} /> Révoquer</button>
            </li>
          ))}
        </ul>
      )}
      {erreur && <p className="text-rouille text-sm mt-2">{erreur}</p>}
    </Section>
  );
};

export default PartageLecture;
