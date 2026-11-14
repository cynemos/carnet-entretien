import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import Embleme from '../components/Embleme';
import Chargement from '../components/Chargement';
import { lirePartage } from '../utils/donnees';
import { libelleType } from '../utils/alertes';
import { libelleCategorie } from '../utils/categories';
import { euros } from '../utils/bilan';
import sansPhoto from '../assets/sans-photo.svg';

/* eslint-disable @typescript-eslint/no-explicit-any -- réponse JSON de la fonction carnet_partage */
type Donnees = Record<string, any>;

const dateFr = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const km = (n?: number | null) => `${(n ?? 0).toLocaleString('fr-FR')} km`;

const Fichier: React.FC<{ url?: string; libelle: string }> = ({ url, libelle }) =>
  url ? <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:text-accent-clair"><FileText size={15} />{libelle}</a> : null;

// Carnet en lecture seule, ouvert par un lien de partage (sans compte).
const PagePartage: React.FC = () => {
  const { jeton } = useParams<{ jeton: string }>();
  const [donnees, setDonnees] = useState<Donnees | null | undefined>(undefined);

  useEffect(() => {
    if (!jeton) { setDonnees(null); return; }
    lirePartage(jeton).then(setDonnees).catch(() => setDonnees(null));
  }, [jeton]);

  useEffect(() => {
    const v = donnees?.vehicule;
    document.title = v ? `${v.make} ${v.model} — carnet d'entretien` : "Carnets d'entretien";
  }, [donnees]);

  if (donnees === undefined) return <div className="min-h-screen flex items-center justify-center"><Chargement /></div>;

  if (!donnees) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="panneau rounded-xl p-8 max-w-md text-center">
          <Embleme taille={80} className="mx-auto mb-4" />
          <h1 className="font-display text-2xl text-primary mb-2">Lien expiré</h1>
          <p className="text-light/70">Ce carnet n'est plus partagé, ou le lien est incomplet. Demandez un nouveau lien à son propriétaire.</p>
        </div>
      </div>
    );
  }

  const v = donnees.vehicule;
  const fichiers: Record<string, string> = donnees.fichiers ?? {};
  const entretiens: Donnees[] = donnees.entretiens ?? [];
  const controles: Donnees[] = donnees.controles ?? [];
  const proprietaires: Donnees[] = donnees.proprietaires ?? [];
  const fiche: { libelle: string; valeur: string }[] = v.fiche_technique ?? [];
  const avecMontants = entretiens.some(e => e.total_cost !== null && e.total_cost !== undefined);
  const total = entretiens.reduce((s, e) => s + Number(e.total_cost ?? 0), 0);

  return (
    <div className="min-h-screen text-light px-4 py-8 md:px-10">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center gap-3 mb-8">
          <Embleme taille={48} />
          <div>
            <p className="font-display text-primary text-lg leading-none" style={{ textShadow: '0 2px 0 #000' }}>Carnet d'entretien</p>
            <p className="font-titre uppercase tracking-[0.25em] text-[0.65rem] text-light/60 mt-1">Consultation · lecture seule</p>
          </div>
        </header>

        <section className="panneau rounded-xl p-5 md:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,20rem)_1fr] gap-6 md:gap-10 items-start">
            <div className="p-2 bg-[#efe4cc] rounded-sm shadow-[0_6px_16px_rgba(0,0,0,0.6)] rotate-[-1.2deg]">
              <img src={(v.photo_path && fichiers[v.photo_path]) || v.image_url || sansPhoto} alt={`${v.make} ${v.model}`} className="w-full h-52 object-cover sepia-[.3]" />
            </div>
            <div>
              <p className="font-titre uppercase tracking-[0.25em] text-xs text-primary/80">{libelleType(v.type)} · {v.year}</p>
              <h1 className="titre-page !mb-4">{v.make} <span className="text-light">{v.model}</span></h1>
              <div className="flex flex-wrap items-center gap-4 mb-5">
                {v.license_plate && <span className="plaque text-lg">{v.license_plate}</span>}
                <span className="compteur text-xl">{String(v.km ?? 0).padStart(6, '0').split('').map((c: string, i: number) => <span key={i}>{c}</span>)}<span className="sep">km</span></span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {[['1re mise en circulation', dateFr(v.first_registration_date)], ['N° de série (VIN)', v.vin || '—'],
                  ['Interventions enregistrées', String(entretiens.length)], ['Contrôles techniques', String(controles.length)],
                  ...(proprietaires.length ? [['Propriétaires précédents', String(proprietaires.length)]] : []),
                  ...(avecMontants ? [["Total des interventions", euros(total)]] : [])].map(([k, val]) => (
                  <div key={k} className="border-b border-dashed border-primary/20 pb-1.5">
                    <dt className="font-titre uppercase tracking-wider text-[0.7rem] text-primary/80">{k}</dt>
                    <dd className="font-machine break-all">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="panneau rounded-lg p-4 md:p-6 mb-8">
          <h2 className="text-xl md:text-2xl font-titre uppercase tracking-wider text-primary mb-4">Historique d'entretien</h2>
          {entretiens.length === 0 ? <p className="text-light/60">Aucune intervention enregistrée.</p> : (
            <table className="table-cartes min-w-full text-sm md:text-base">
              <thead><tr>
                <th className="py-2 px-3 border-b border-primary/30 text-left">Date</th>
                <th className="py-2 px-3 border-b border-primary/30 text-left">Km</th>
                <th className="py-2 px-3 border-b border-primary/30 text-left">Intervention</th>
                {avecMontants && <th className="py-2 px-3 border-b border-primary/30 text-right">Coût</th>}
                <th className="py-2 px-3 border-b border-primary/30 text-left">Facture</th>
              </tr></thead>
              <tbody>
                {entretiens.map((e, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 border-b border-primary/20" data-label="Date">{dateFr(e.date)}</td>
                    <td className="py-2 px-3 border-b border-primary/20" data-label="Km">{km(e.mileage)}</td>
                    <td className="py-2 px-3 border-b border-primary/20" data-label="Intervention">
                      <span className="inline-block text-[0.65rem] font-titre uppercase tracking-wider px-1.5 py-0.5 mr-2 rounded bg-primary/15 text-primary/90">{libelleCategorie(e.categorie)}</span>
                      {e.description}
                    </td>
                    {avecMontants && <td className="py-2 px-3 border-b border-primary/20 text-right font-machine" data-label="Coût">{euros(Number(e.total_cost ?? 0), 2)}</td>}
                    <td className="py-2 px-3 border-b border-primary/20" data-label="Facture"><Fichier url={e.facture_path && fichiers[e.facture_path]} libelle="Voir" />{!(e.facture_path && fichiers[e.facture_path]) && '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panneau rounded-lg p-4 md:p-6 mb-8">
          <h2 className="text-xl md:text-2xl font-titre uppercase tracking-wider text-primary mb-4">Contrôles techniques</h2>
          {controles.length === 0 ? <p className="text-light/60">Aucun contrôle technique enregistré.</p> : (
            <table className="table-cartes min-w-full text-sm md:text-base">
              <thead><tr>
                <th className="py-2 px-3 border-b border-primary/30 text-left">Date</th>
                <th className="py-2 px-3 border-b border-primary/30 text-left">Km</th>
                <th className="py-2 px-3 border-b border-primary/30 text-left">Validité</th>
                <th className="py-2 px-3 border-b border-primary/30 text-left">Défaillances</th>
                <th className="py-2 px-3 border-b border-primary/30 text-left">PV</th>
              </tr></thead>
              <tbody>
                {controles.map((c, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 border-b border-primary/20" data-label="Date">{dateFr(c.date)}</td>
                    <td className="py-2 px-3 border-b border-primary/20" data-label="Km">{km(c.mileage)}</td>
                    <td className="py-2 px-3 border-b border-primary/20" data-label="Validité">{c.validity || '—'}</td>
                    <td className="py-2 px-3 border-b border-primary/20" data-label="Défaillances">
                      {[c.major_failures && `Majeures : ${c.major_failures}`, c.minor_failures && `Mineures : ${c.minor_failures}`].filter(Boolean).join(' · ') || 'Aucune'}
                    </td>
                    <td className="py-2 px-3 border-b border-primary/20" data-label="PV"><Fichier url={c.pv_path && fichiers[c.pv_path]} libelle="Voir" />{!(c.pv_path && fichiers[c.pv_path]) && '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {fiche.length > 0 && (
          <section className="panneau rounded-lg p-4 md:p-6 mb-8">
            <h2 className="text-xl md:text-2xl font-titre uppercase tracking-wider text-primary mb-4">Fiche technique</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
              {fiche.map((l, i) => (
                <div key={i} className="border-b border-dashed border-primary/20 pb-1.5">
                  <dt className="font-titre uppercase tracking-wider text-[0.7rem] text-primary/80">{l.libelle}</dt>
                  <dd className="font-machine whitespace-pre-line">{l.valeur}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {proprietaires.length > 0 && (
          <section className="panneau rounded-lg p-4 md:p-6 mb-8">
            <h2 className="text-xl md:text-2xl font-titre uppercase tracking-wider text-primary mb-4">Propriétaires précédents</h2>
            <ul className="space-y-1 font-machine">
              {proprietaires.map((o, i) => <li key={i}>{i + 1}. du {dateFr(o.start_date)} au {dateFr(o.end_date)}</li>)}
            </ul>
          </section>
        )}

        <p className="text-center text-xs text-light/50 font-machine">Lien valable jusqu'au {dateFr(donnees.expire_le)}</p>
      </div>
    </div>
  );
};

export default PagePartage;
