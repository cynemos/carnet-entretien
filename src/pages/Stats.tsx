/* eslint-disable @typescript-eslint/no-explicit-any -- rappels Chart.js typés de façon lâche */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Vehicle, ControleTechniqueEntry } from '../types';
import { getVehicles } from '../utils/donnees';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  TimeScale,
} from 'chart.js';
import Chargement from '../components/Chargement';
import 'chartjs-adapter-date-fns';
import { bilanVehicule, depensesParAnnee, euros, kmParAnnee, releves, totalMainOeuvre, totalPieces } from '../utils/bilan';
import { CATEGORIES_ENTRETIEN, CATEGORIES_FRAIS, libelleCategorie } from '../utils/categories';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement, TimeScale);

// Lettrage des graphiques assorti au thème atelier
ChartJS.defaults.font.family = 'Oswald, sans-serif';
ChartJS.defaults.color = '#efe4cc';

// Une couleur par véhicule, et une palette pour les catégories
const COULEURS = ['#d4943a', '#7aa7b8', '#c2553a', '#8fbf9f', '#e0b84a', '#8e3b46', '#efe4cc', '#b8734a', '#6b7a80', '#a3a35a'];
const couleur = (i: number, alpha = 1) => {
  const c = COULEURS[i % COULEURS.length];
  if (alpha === 1) return c;
  const n = parseInt(c.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};
const GRILLE = 'rgba(212, 148, 58, 0.12)';
const TICKS = '#bfae8f';

const nom = (v: Vehicle) => `${v.make} ${v.model}`;
const eurosTick = (v: any) => `${Number(v).toLocaleString('fr-FR')} €`;

// Options communes : titre, légende, axes thémés, format des valeurs
const options = (titre: string, format: (n: number) => string, extra: { empile?: boolean; horizontal?: boolean; legende?: boolean } = {}): any => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: extra.horizontal ? 'y' : 'x',
  plugins: {
    title: { display: true, text: titre, color: '#efe4cc', font: { size: 15 } },
    legend: { display: extra.legende ?? true, position: 'bottom', labels: { color: '#efe4cc', boxWidth: 12 } },
    tooltip: { callbacks: { label: (c: any) => `${c.dataset.label ? c.dataset.label + ' : ' : ''}${format(extra.horizontal ? c.parsed.x : c.parsed.y)}` } },
  },
  scales: {
    x: { stacked: extra.empile, ticks: { color: TICKS, ...(extra.horizontal ? { callback: (v: any) => format(v) } : {}) }, grid: { color: GRILLE } },
    y: { stacked: extra.empile, ticks: { color: TICKS, ...(extra.horizontal ? {} : { callback: (v: any) => format(v) }) }, grid: { color: GRILLE } },
  },
});

const optionsAnneau = (titre: string): any => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: { display: true, text: titre, color: '#efe4cc', font: { size: 15 } },
    legend: { position: 'right', labels: { color: '#efe4cc', boxWidth: 12 } },
    tooltip: { callbacks: { label: (c: any) => `${c.label} : ${euros(c.parsed)}` } },
  },
});

const Carte: React.FC<{ children: React.ReactNode; large?: boolean; hauteur?: string }> = ({ children, large, hauteur = 'h-80' }) => (
  <div className={`panneau rounded-lg p-4 md:p-6 border border-primary/30 ${large ? 'lg:col-span-2' : ''}`}>
    <div className={`relative ${hauteur}`}>{children}</div>
  </div>
);

// Mesures du CT : texte libre (« 1,5 m/km », « 12 % », « 250 daN ») → premier nombre
const MESURES: { cle: keyof ControleTechniqueEntry; libelle: string }[] = [
  { cle: 'ripage', libelle: 'Ripage' },
  { cle: 'suspensionAsymmetry', libelle: 'Déséquilibre suspensions' },
  { cle: 'serviceBrake', libelle: 'Frein de service' },
  { cle: 'parkingBrake', libelle: 'Frein de stationnement' },
  { cle: 'verticalForces', libelle: 'Efforts verticaux' },
  { cle: 'exhaustEmissions', libelle: 'Émissions polluantes' },
];
const lireMesure = (t: unknown) => {
  const m = String(t ?? '').replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : undefined;
};
const uniteMesure = (valeurs: unknown[]) => {
  for (const v of valeurs.map(String)) {
    const u = v.match(/m\/km|daN|kN|g\/km|m-1|ppm|%/i);
    if (u) return u[0];
  }
  return '';
};

const Stats: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehiculeCT, setVehiculeCT] = useState('');

  useEffect(() => {
    getVehicles()
      .then(setVehicles)
      .catch(() => setError('Erreur lors du chargement des données pour les statistiques.'))
      .finally(() => setLoading(false));
  }, []);

  const d = useMemo(() => {
    const bilans = vehicles.map(v => ({ v, b: bilanVehicule(v) }));

    // Années couvertes par les dépenses ou les relevés
    const depAnnees = vehicles.map(depensesParAnnee);
    const kmAnnees = vehicles.map(kmParAnnee);
    const annees = [...new Set([...depAnnees, ...kmAnnees].flatMap(r => Object.keys(r).map(Number)))].sort((a, b) => a - b);
    const anneesDepenses = annees.filter(a => depAnnees.some(r => r[a]));
    const anneesKm = annees.filter(a => kmAnnees.some(r => r[a]));
    const budgetMoyen = anneesDepenses.length
      ? anneesDepenses.reduce((s, a) => s + depAnnees.reduce((t, r) => t + (r[a] ?? 0), 0), 0) / anneesDepenses.length : 0;

    // Répartitions par catégorie (entretien) et par type de frais
    const parCategorie = new Map<string, number>();
    vehicles.forEach(v => v.maintenanceHistory.forEach(e => parCategorie.set(e.categorie, (parCategorie.get(e.categorie) ?? 0) + (e.totalCost || 0))));
    const categories = CATEGORIES_ENTRETIEN.filter(c => (parCategorie.get(c.code) ?? 0) > 0)
      .sort((a, b) => (parCategorie.get(b.code) ?? 0) - (parCategorie.get(a.code) ?? 0));
    const parFrais = new Map<string, number>();
    vehicles.forEach(v => v.depenses.forEach(x => parFrais.set(x.categorie, (parFrais.get(x.categorie) ?? 0) + x.montant)));
    const frais = CATEGORIES_FRAIS.filter(c => (parFrais.get(c.code) ?? 0) > 0);

    const pieces = vehicles.reduce((s, v) => s + totalPieces(v), 0);
    const mainOeuvre = vehicles.reduce((s, v) => s + totalMainOeuvre(v), 0);

    const top = vehicles.flatMap(v => v.maintenanceHistory.map(e => ({ v, e })))
      .sort((a, b) => (b.e.totalCost || 0) - (a.e.totalCost || 0)).slice(0, 5);

    return { bilans, depAnnees, kmAnnees, anneesDepenses, anneesKm, budgetMoyen, parCategorie, categories, parFrais, frais, pieces, mainOeuvre, top };
  }, [vehicles]);

  // Véhicules dont le CT contient au moins une mesure chiffrée
  const avecMesures = vehicles.filter(v => v.controleTechniqueHistory.some(c => MESURES.some(m => lireMesure(c[m.cle]) !== undefined)));
  const vCT = avecMesures.find(v => v.id === vehiculeCT) ?? avecMesures[0];

  if (loading) return <Chargement texte="Chargement des statistiques…" />;
  if (error) return <div className="text-center text-rouille">{error}</div>;
  if (vehicles.length === 0) return <div className="text-center text-light">Ajoutez des véhicules et des entretiens pour voir les statistiques.</div>;

  const { bilans, depAnnees, kmAnnees, anneesDepenses, anneesKm, budgetMoyen, parCategorie, categories, parFrais, frais, pieces, mainOeuvre, top } = d;
  const roulants = bilans.filter(x => x.b.km > 0);
  const possedes = bilans.filter(x => x.b.annees >= 0.25);
  const totalGeneral = bilans.reduce((s, x) => s + x.b.entretien + x.b.frais, 0);

  return (
    <div className="container mx-auto">
      <h2 className="titre-page">Statistiques de la flotte</h2>

      {/* Bilan par véhicule */}
      <div className="panneau rounded-lg p-4 md:p-6 border border-primary/30 mb-8 overflow-x-auto">
        <h3 className="text-xl font-titre uppercase tracking-wider text-primary mb-4">Bilan par véhicule</h3>
        <table className="table-cartes min-w-full text-light text-sm">
          <thead>
            <tr>
              {['Véhicule', 'Achat', 'Entretien', 'Frais', 'Vente', 'Coût total', '€ / km', '€ / an'].map((t, i) => (
                <th key={t} className={`py-2 px-3 border-b border-primary/30 ${i ? 'text-right' : 'text-left'}`}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bilans.map(({ v, b }) => (
              <tr key={v.id} className="hover:bg-primary/10">
                <td className="py-2 px-3 border-b border-primary/20" data-label="Véhicule"><Link to={`/vehicle/${v.id}`} className="text-accent hover:text-accent-clair">{nom(v)}</Link>{v.soldDate && <span className="text-light/40"> · vendu</span>}</td>
                <td className="py-2 px-3 border-b border-primary/20 text-right font-machine" data-label="Achat">{b.achat !== undefined ? euros(b.achat) : '—'}</td>
                <td className="py-2 px-3 border-b border-primary/20 text-right font-machine" data-label="Entretien">{euros(b.entretien)}</td>
                <td className="py-2 px-3 border-b border-primary/20 text-right font-machine" data-label="Frais">{euros(b.frais)}</td>
                <td className="py-2 px-3 border-b border-primary/20 text-right font-machine" data-label="Vente">{b.vente !== undefined ? euros(b.vente) : '—'}</td>
                <td className="py-2 px-3 border-b border-primary/20 text-right font-machine text-primary" data-label="Coût total">{euros(b.coutTotal)}</td>
                <td className="py-2 px-3 border-b border-primary/20 text-right font-machine" data-label="€ / km">{b.coutKm !== undefined ? b.coutKm.toFixed(2).replace('.', ',') : '—'}</td>
                <td className="py-2 px-3 border-b border-primary/20 text-right font-machine" data-label="€ / an">{b.coutAn !== undefined ? euros(b.coutAn) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-light/50 mt-3">Coût total = achat + entretien + frais − vente. Coût au km et par an : entretien et frais seulement (sans l'achat).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {roulants.length > 0 && (
          <Carte>
            <Bar options={options('Coût au kilomètre', n => `${n.toFixed(2).replace('.', ',')} €`, { empile: true })} data={{
              labels: roulants.map(x => nom(x.v)),
              datasets: [
                { label: 'Entretien', data: roulants.map(x => x.b.entretien / x.b.km), backgroundColor: couleur(0, 0.75) },
                { label: 'Frais annexes', data: roulants.map(x => x.b.frais / x.b.km), backgroundColor: couleur(1, 0.75) },
              ],
            }} />
          </Carte>
        )}
        {possedes.length > 0 && (
          <Carte>
            <Bar options={options('Coût par année de possession', n => euros(n), { empile: true })} data={{
              labels: possedes.map(x => nom(x.v)),
              datasets: [
                { label: 'Entretien', data: possedes.map(x => x.b.entretien / x.b.annees), backgroundColor: couleur(0, 0.75) },
                { label: 'Frais annexes', data: possedes.map(x => x.b.frais / x.b.annees), backgroundColor: couleur(1, 0.75) },
              ],
            }} />
          </Carte>
        )}

        {anneesDepenses.length > 0 && (
          <Carte large>
            <Bar options={options(`Budget par année (moyenne : ${euros(budgetMoyen)} par an)`, eurosTickNombre, { empile: true })} data={{
              labels: anneesDepenses.map(String),
              datasets: vehicles.map((v, i) => ({ label: nom(v), data: anneesDepenses.map(a => depAnnees[i][a] ?? 0), backgroundColor: couleur(i, 0.8) }))
                .filter(ds => ds.data.some(x => x > 0)),
            }} />
          </Carte>
        )}

        {anneesKm.length > 0 && (
          <Carte large>
            <Bar options={options('Kilomètres parcourus par année (estimés entre deux relevés)', n => `${Math.round(n).toLocaleString('fr-FR')} km`)} data={{
              labels: anneesKm.map(String),
              datasets: vehicles.map((v, i) => ({ label: nom(v), data: anneesKm.map(a => kmAnnees[i][a] ?? 0), backgroundColor: couleur(i, 0.8) }))
                .filter(ds => ds.data.some(x => x > 0)),
            }} />
          </Carte>
        )}

        <Carte large>
          <Line options={{
            ...options('Évolution du kilométrage', n => `${Math.round(n).toLocaleString('fr-FR')} km`),
            scales: {
              x: { type: 'time', time: { unit: 'year', tooltipFormat: 'dd/MM/yyyy', displayFormats: { year: 'yyyy' } }, ticks: { color: TICKS }, grid: { color: GRILLE } },
              y: { ticks: { color: TICKS, callback: (v: any) => `${Number(v).toLocaleString('fr-FR')} km` }, grid: { color: GRILLE } },
            },
          }} data={{
            datasets: vehicles.map((v, i) => ({
              label: nom(v),
              data: releves(v).map(p => ({ x: p.t, y: p.km })),
              borderColor: couleur(i), backgroundColor: couleur(i), tension: 0.1, pointRadius: 3,
            })) as any,
          }} />
        </Carte>

        {mainOeuvre + pieces > 0 && (
          <Carte>
            <Bar options={options(`Pièces ou main-d'œuvre (${Math.round((pieces / (pieces + mainOeuvre)) * 100)} % en pièces)`, n => euros(n), { empile: true, horizontal: true })} data={{
              labels: vehicles.map(nom),
              datasets: [
                { label: 'Pièces (fait soi-même ou fournies)', data: vehicles.map(totalPieces), backgroundColor: couleur(3, 0.75) },
                { label: "Main-d'œuvre (garage)", data: vehicles.map(totalMainOeuvre), backgroundColor: couleur(2, 0.75) },
              ],
            }} />
          </Carte>
        )}

        {categories.length > 0 && (
          <Carte>
            <Doughnut options={optionsAnneau("Entretien par catégorie")} data={{
              labels: categories.map(c => c.libelle),
              datasets: [{ data: categories.map(c => parCategorie.get(c.code) ?? 0), backgroundColor: categories.map((_, i) => couleur(i, 0.8)), borderColor: '#221b15' }],
            }} />
          </Carte>
        )}

        {frais.length > 0 && (
          <Carte>
            <Doughnut options={optionsAnneau('Frais annexes par type')} data={{
              labels: frais.map(c => c.libelle),
              datasets: [{ data: frais.map(c => parFrais.get(c.code) ?? 0), backgroundColor: frais.map((_, i) => couleur(i + 3, 0.8)), borderColor: '#221b15' }],
            }} />
          </Carte>
        )}

        {vCT && (
          <div className="panneau rounded-lg p-4 md:p-6 border border-primary/30 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <h3 className="font-titre uppercase tracking-wider text-primary">Mesures des contrôles techniques</h3>
              {avecMesures.length > 1 && (
                <select className="input" value={vCT.id} onChange={e => setVehiculeCT(e.target.value)} aria-label="Véhicule">
                  {avecMesures.map(v => <option key={v.id} value={v.id}>{nom(v)}</option>)}
                </select>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {MESURES.map(m => {
                const cts = [...vCT.controleTechniqueHistory].sort((a, b) => a.date.localeCompare(b.date));
                const points = cts.map(c => ({ x: c.date, y: lireMesure(c[m.cle]) })).filter(p => p.y !== undefined);
                if (!points.length) return null;
                const unite = uniteMesure(cts.map(c => c[m.cle]).filter(Boolean));
                return (
                  <div key={m.cle} className="relative h-52 bg-black/20 rounded p-2">
                    <Line options={{
                      ...options(`${m.libelle}${unite ? ` (${unite})` : ''}`, n => `${n.toLocaleString('fr-FR')}${unite ? ' ' + unite : ''}`, { legende: false }),
                      scales: {
                        x: { ticks: { color: TICKS }, grid: { color: GRILLE } },
                        y: { ticks: { color: TICKS }, grid: { color: GRILLE } },
                      },
                    }} data={{
                      labels: points.map(p => new Date(p.x).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })),
                      datasets: [{ data: points.map(p => p.y as number), borderColor: couleur(0), backgroundColor: couleur(0), tension: 0.2, pointRadius: 4 }],
                    }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {top.length > 0 && (
          <div className="panneau rounded-lg p-4 md:p-6 border border-primary/30 lg:col-span-2">
            <h3 className="font-titre uppercase tracking-wider text-primary mb-3">Les 5 plus grosses interventions</h3>
            <ol className="space-y-2">
              {top.map(({ v, e }, i) => (
                <li key={e.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-dashed border-primary/20 pb-2">
                  <span className="font-display text-2xl text-primary w-8">{i + 1}</span>
                  <span className="flex-1 min-w-[14rem]">
                    <span className="text-light">{e.description}</span>
                    <span className="block text-xs text-light/50">
                      <Link to={`/vehicle/${v.id}`} className="text-accent hover:text-accent-clair">{nom(v)}</Link> · {new Date(e.date).toLocaleDateString('fr-FR')} · {libelleCategorie(e.categorie)}
                    </span>
                  </span>
                  <span className="font-machine text-lg text-primary">{euros(e.totalCost, 2)}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-light/50 mt-3">Total des dépenses de la flotte (entretien et frais) : {euros(totalGeneral)}.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const eurosTickNombre = (n: number) => eurosTick(n);

export default Stats;
