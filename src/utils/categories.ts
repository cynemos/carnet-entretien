// Catégories d'intervention et de frais annexes.
// Les mots-clés servent à proposer une catégorie d'après la description ; ce sont les mêmes que
// ceux de la migration 20261114180000 (classement de l'historique existant).

export interface Categorie { code: string; libelle: string; motsCles?: RegExp }

export const CATEGORIES_ENTRETIEN: Categorie[] = [
  { code: 'vidange', libelle: 'Vidange / huile', motsCles: /vidange|huile/i },
  { code: 'filtres', libelle: 'Filtres', motsCles: /filtre/i },
  { code: 'allumage', libelle: 'Allumage / injection', motsCles: /bougie|injecteur|allumage|carbu/i },
  { code: 'distribution', libelle: 'Distribution', motsCles: /distribution|courroie|cha[iî]ne/i },
  { code: 'freins', libelle: 'Freins', motsCles: /frein|plaquette|disque|[ée]trier/i },
  { code: 'embrayage', libelle: 'Embrayage', motsCles: /embrayage/i },
  { code: 'suspension', libelle: 'Suspension / direction', motsCles: /suspension|amortisseur|ressort|fourche|rotule|direction|silent/i },
  { code: 'pneus', libelle: 'Pneus / roues', motsCles: /pneu|roue|jante|g[ée]om[ée]trie|parall[ée]lisme/i },
  { code: 'climatisation', libelle: 'Climatisation', motsCles: /clim/i },
  { code: 'electricite', libelle: 'Batterie / électricité', motsCles: /batterie|[ée]lectri|ampoule|phare|alternateur|d[ée]marreur|faisceau/i },
  { code: 'echappement', libelle: 'Échappement', motsCles: /[ée]chappement|catalyseur|fap|silencieux/i },
  { code: 'refroidissement', libelle: 'Refroidissement', motsCles: /refroidissement|radiateur|thermostat|pompe [àa] eau|durite/i },
  { code: 'carrosserie', libelle: 'Carrosserie / peinture', motsCles: /carrosserie|peinture|rouille|soudure|pare-?choc|chrome/i },
  { code: 'restauration', libelle: 'Restauration', motsCles: /restauration|r[ée]fection|remise en [ée]tat/i },
  { code: 'revision', libelle: 'Révision / diagnostic', motsCles: /r[ée]vision|contr[ôo]le|diagnostic/i },
  { code: 'autre', libelle: 'Autre' },
];

export const CATEGORIES_FRAIS: Categorie[] = [
  { code: 'assurance', libelle: 'Assurance' },
  { code: 'immatriculation', libelle: 'Carte grise / immatriculation' },
  { code: 'stockage', libelle: 'Garage / stockage' },
  { code: 'carburant', libelle: 'Carburant' },
  { code: 'equipement', libelle: 'Équipement / accessoires' },
  { code: 'club', libelle: 'Club / sorties / événements' },
  { code: 'autre', libelle: 'Autre' },
];

const libelle = (liste: Categorie[]) => (code?: string) => liste.find(c => c.code === code)?.libelle ?? 'Autre';
export const libelleCategorie = libelle(CATEGORIES_ENTRETIEN);
export const libelleFrais = libelle(CATEGORIES_FRAIS);

export const devinerCategorie = (description: string) =>
  CATEGORIES_ENTRETIEN.find(c => c.motsCles?.test(description))?.code ?? 'autre';

// Lignes proposées quand la fiche technique est vide
export const FICHE_PAR_DEFAUT = [
  'Huile moteur (grade, quantité)', 'Filtre à huile (réf.)', 'Filtre à air (réf.)', 'Bougies (réf., écartement)',
  'Pneus avant (dimension, pression)', 'Pneus arrière (dimension, pression)', 'Batterie', 'Liquide de refroidissement',
];
