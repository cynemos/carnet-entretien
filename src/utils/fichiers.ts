// Fichiers stockés sur le serveur (dossier privé « carnet ») : photos, cartes grises,
// factures, procès-verbaux de CT. Lecture par liens signés, valables une heure.
import { supabase } from '../lib/supabase';

const DOSSIER = 'carnet';
const DUREE_LIEN = 3600;

// Une photo de téléphone pèse 3 à 10 Mo : on la réduit à 1600 px de large en JPEG.
const reduireImage = async (fichier: File): Promise<Blob> => {
  if (!/^image\/(jpeg|png|webp)$/.test(fichier.type)) return fichier;
  try {
    const image = await createImageBitmap(fichier);
    const echelle = Math.min(1, 1600 / Math.max(image.width, image.height));
    if (echelle === 1 && fichier.size < 1_500_000) return fichier;
    const toile = document.createElement('canvas');
    toile.width = Math.round(image.width * echelle);
    toile.height = Math.round(image.height * echelle);
    toile.getContext('2d')!.drawImage(image, 0, 0, toile.width, toile.height);
    return await new Promise<Blob>((ok, ko) => toile.toBlob(b => (b ? ok(b) : ko(new Error('conversion'))), 'image/jpeg', 0.85));
  } catch {
    return fichier;
  }
};

// Tous les fichiers d'un véhicule sont rangés sous vehicules/<id>/ (suppression groupée possible).
export const envoyerFichier = async (vehicleId: string, fichier: File): Promise<string> => {
  const contenu = await reduireImage(fichier);
  const jpeg = contenu !== fichier;
  const extension = jpeg ? 'jpg' : (fichier.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const chemin = `vehicules/${vehicleId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(DOSSIER)
    .upload(chemin, contenu, { contentType: jpeg ? 'image/jpeg' : fichier.type || undefined });
  if (error) throw new Error(`Envoi du fichier impossible : ${error.message}`);
  return chemin;
};

// Cache des liens signés pour ne pas en redemander à chaque affichage
const cache = new Map<string, { url: string; expire: number }>();

export const lienFichier = async (chemin: string): Promise<string> => {
  const connu = cache.get(chemin);
  if (connu && connu.expire > Date.now()) return connu.url;
  const { data, error } = await supabase.storage.from(DOSSIER).createSignedUrl(chemin, DUREE_LIEN);
  if (error || !data) throw new Error('Fichier introuvable sur le serveur.');
  cache.set(chemin, { url: data.signedUrl, expire: Date.now() + (DUREE_LIEN - 300) * 1000 });
  return data.signedUrl;
};

export const supprimerFichiers = async (chemins: (string | undefined | null)[]) => {
  const liste = chemins.filter((c): c is string => !!c);
  if (liste.length) await supabase.storage.from(DOSSIER).remove(liste);
};

export const supprimerFichiersVehicule = async (vehicleId: string) => {
  const { data } = await supabase.storage.from(DOSSIER).list(`vehicules/${vehicleId}`, { limit: 1000 });
  await supprimerFichiers((data ?? []).map(f => `vehicules/${vehicleId}/${f.name}`));
};

// Liens signés de longue durée, pour un partage en lecture seule : { chemin: lien }
export const liensPartage = async (chemins: string[], secondes: number): Promise<Record<string, string>> => {
  const liste = [...new Set(chemins.filter(Boolean))];
  if (!liste.length) return {};
  const { data, error } = await supabase.storage.from(DOSSIER).createSignedUrls(liste, secondes);
  if (error) throw new Error(`Liens de fichiers impossibles : ${error.message}`);
  return Object.fromEntries((data ?? []).filter(d => d.signedUrl && d.path).map(d => [d.path as string, d.signedUrl as string]));
};
