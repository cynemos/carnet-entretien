import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Vehicle } from '../types';
import { getVehicles } from '../utils/donnees';
import { CATEGORIES_ENTRETIEN, libelleCategorie, libelleFrais } from '../utils/categories';
import { euros } from '../utils/bilan';
import Chargement from '../components/Chargement';

interface Resultat {
  vehicule: Vehicle;
  genre: 'Entretien' | 'Contrôle technique' | 'Travail' | 'Frais' | 'Fiche technique';
  date?: string;
  texte: string;
  detail?: string;
  montant?: number;
}

// Sans accents ni majuscules : « echappement » trouve « Échappement »
const normaliser = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Recherche dans tout le garage : entretiens, CT, travaux, frais, fiches techniques
const Recherche: React.FC = () => {
  const [vehicules, setVehicules] = useState<Vehicle[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [parametres, setParametres] = useSearchParams();
  const q = parametres.get('q') ?? '';
  const vehiculeId = parametres.get('vehicule') ?? '';
  const categorie = parametres.get('categorie') ?? '';

  useEffect(() => { getVehicles().then(setVehicules).catch(e => setErreur(e.message)); }, []);

  const regler = (cle: string, valeur: string) => {
    const p = new URLSearchParams(parametres);
    if (valeur) p.set(cle, valeur); else p.delete(cle);
    setParametres(p, { replace: true });
  };

  const resultats = useMemo<Resultat[]>(() => {
    if (!vehicules) return [];
    const mots = normaliser(q).split(/\s+/).filter(Boolean);
    if (!mots.length && !categorie) return [];
    const correspond = (...textes: (string | undefined)[]) => {
      const t = normaliser(textes.filter(Boolean).join(' '));
      return mots.every(m => t.includes(m));
    };
    const liste: Resultat[] = [];
    for (const v of vehicules.filter(x => !vehiculeId || x.id === vehiculeId)) {
      for (const e of v.maintenanceHistory) {
        if ((!categorie || e.categorie === categorie) && correspond(e.description, libelleCategorie(e.categorie))) {
          liste.push({ vehicule: v, genre: 'Entretien', date: e.date, texte: e.description, detail: `${libelleCategorie(e.categorie)} · ${e.mileage.toLocaleString('fr-FR')} km`, montant: e.totalCost });
        }
      }
      if (categorie) continue; // le filtre de catégorie ne concerne que les entretiens
      for (const c of v.controleTechniqueHistory) {
        if (correspond(c.majorFailures, c.minorFailures, c.validity)) {
          liste.push({ vehicule: v, genre: 'Contrôle technique', date: c.date, texte: [c.majorFailures, c.minorFailures].filter(Boolean).join(' · ') || c.validity, detail: `Validité : ${c.validity}` });
        }
      }
      for (const t of v.travaux) {
        if (correspond(t.titre, t.details)) liste.push({ vehicule: v, genre: 'Travail', date: t.faitLe, texte: t.titre, detail: t.faitLe ? 'fait' : 'à faire', montant: t.coutEstime });
      }
      for (const d of v.depenses) {
        if (correspond(d.libelle, libelleFrais(d.categorie))) liste.push({ vehicule: v, genre: 'Frais', date: d.date, texte: d.libelle || libelleFrais(d.categorie), detail: libelleFrais(d.categorie), montant: d.montant });
      }
      for (const f of v.ficheTechnique) {
        if (correspond(f.libelle, f.valeur)) liste.push({ vehicule: v, genre: 'Fiche technique', texte: `${f.libelle} : ${f.valeur}` });
      }
    }
    return liste.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  }, [vehicules, q, vehiculeId, categorie]);

  const totalEntretiens = resultats.filter(r => r.genre === 'Entretien').reduce((s, r) => s + (r.montant ?? 0), 0);
  const nbEntretiens = resultats.filter(r => r.genre === 'Entretien').length;

  if (erreur) return <div className="text-center text-rouille">{erreur}</div>;
  if (!vehicules) return <Chargement texte="Chargement…" />;

  return (
    <div className="container mx-auto">
      <h2 className="titre-page">Recherche</h2>
      <div className="panneau rounded-lg p-4 md:p-6 mb-6 grid grid-cols-1 md:grid-cols-[1fr_14rem_14rem] gap-3">
        <label className="relative block">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/70" />
          <input type="search" autoFocus className="input w-full !pl-10" placeholder="Courroie, pneus, 10W40, assurance…" value={q} onChange={e => regler('q', e.target.value)} />
        </label>
        <select className="input" value={vehiculeId} onChange={e => regler('vehicule', e.target.value)} aria-label="Véhicule">
          <option value="">Tous les véhicules</option>
          {vehicules.map(v => <option key={v.id} value={v.id}>{v.make} {v.model}</option>)}
        </select>
        <select className="input" value={categorie} onChange={e => regler('categorie', e.target.value)} aria-label="Catégorie d'entretien">
          <option value="">Toutes les catégories</option>
          {CATEGORIES_ENTRETIEN.map(c => <option key={c.code} value={c.code}>{c.libelle}</option>)}
        </select>
      </div>

      {!q.trim() && !categorie ? (
        <p className="text-light/60 text-center font-machine">Tapez un mot ou choisissez une catégorie.</p>
      ) : resultats.length === 0 ? (
        <p className="text-light/60 text-center font-machine">Rien trouvé.</p>
      ) : (
        <>
          <p className="text-light/70 mb-3">
            {resultats.length} résultat{resultats.length > 1 ? 's' : ''}
            {nbEntretiens > 0 && <> · {nbEntretiens} entretien{nbEntretiens > 1 ? 's' : ''} pour <span className="font-machine text-primary">{euros(totalEntretiens, 2)}</span></>}
          </p>
          <ul className="panneau rounded-lg divide-y divide-primary/15">
            {resultats.map((r, i) => (
              <li key={i}>
                <Link to={`/vehicle/${r.vehicule.id}`} className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3 hover:bg-primary/10">
                  <span className="w-24 shrink-0 font-machine text-sm text-light/60">{r.date ? new Date(r.date).toLocaleDateString('fr-FR') : ''}</span>
                  <span className="flex-1 min-w-[14rem]">
                    <span className="block text-light">{r.texte}</span>
                    <span className="block text-xs text-light/50">
                      <span className="font-titre uppercase tracking-wider text-primary/80">{r.genre}</span> · {r.vehicule.make} {r.vehicule.model}{r.detail ? ` · ${r.detail}` : ''}
                    </span>
                  </span>
                  {r.montant !== undefined && <span className="font-machine text-primary">{euros(r.montant, 2)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Recherche;
