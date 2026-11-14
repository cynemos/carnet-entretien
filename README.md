# Carnets d'entretien

Carnet d'entretien numérique pour une petite flotte de véhicules de collection et du quotidien : voitures, motos, scooters.
Chaque véhicule a sa fiche, son historique d'entretien, ses contrôles techniques et la liste de ses anciens propriétaires.
L'interface reprend l'ambiance d'un atelier de restauration vintage.

En ligne (accès réservé) : <https://carnet.cyneprod.org>

## Fonctionnalités

- **Ma flotte** : cartes des véhicules (photo, plaque, kilométrage, nombre d'interventions) et bilan général : véhicules, interventions, montant investi.
  Les véhicules vendus sont rangés à part, sous un tampon « Vendu », et ne déclenchent plus d'alertes.
- **Fiche véhicule** : données d'identification (VIN, dates, plaque, lien vers la carte grise) et trois historiques.
  - Entretiens : coût des pièces et de la main-d'œuvre, deux liens vers des factures.
  - Contrôles techniques : mesures, défaillances, lien vers le procès-verbal.
  - Anciens propriétaires.
- **Kilométrage** : relevé du compteur en un clic depuis la fiche ; le kilométrage affiché est le plus récent connu (relevé, entretiens, CT).
- **Échéances réglables par véhicule** : CT tous les 2 ans ou 5 ans (véhicule de collection), entretien tous les N mois et/ou tous les N km.
- **Fichiers sur le serveur** : photo du véhicule, carte grise, factures et procès-verbaux de CT (photo ou PDF, 20 Mo au plus).
  Les photos sont réduites avant l'envoi. Le dossier est privé : chaque ouverture passe par un lien signé valable une heure.
- **Export PDF** de l'historique d'un véhicule, mis en page comme une fiche d'atelier.
- **Export des données** : sauvegarde complète en JSON, entretiens en CSV pour un tableur.
- **Statistiques** : courbe du kilométrage, coût et nombre d'entretiens par véhicule, répartition des dépenses.
- **Suivi** : dernier entretien et dernier CT de chaque véhicule.
- **Alertes** : entretien en retard ou à prévoir, CT expiré ou à repasser dans les 3 mois. Le nombre d'alertes s'affiche dans le menu.
- **Rappels sur le téléphone** (ntfy) : le serveur vérifie les échéances chaque matin et prévient quand la situation change, plus un rappel le lundi s'il reste des retards.
- **Installable** sur le téléphone comme une appli (écran d'accueil, plein écran).
- Adapté au téléphone : menu escamotable, tableaux présentés en cartes.

## Technique

| Élément | Choix |
| --- | --- |
| Interface | React 18, TypeScript, Vite 5, Tailwind CSS 3, React Router 7 |
| Graphiques et PDF | Chart.js, jsPDF (chargés uniquement quand on en a besoin) |
| Données et comptes | Supabase auto-hébergé (PostgreSQL + PostgREST + GoTrue + Storage) |
| Appli installable | manifeste web et service worker (`public/`) ; les données ne sont jamais mises en cache |
| Polices | Alfa Slab One, Oswald, Special Elite, Barlow, embarquées via Fontsource (aucun appel à Google Fonts) |

### Sécurité

- Application privée : il faut un compte pour voir quoi que ce soit, et les inscriptions sont fermées.
  Les comptes sont créés sur le serveur avec `scripts/serveur/4_creer_compte.sh`.
- Chaque table est protégée par une règle RLS qui n'autorise que les utilisateurs connectés. Le rôle anonyme n'a aucun droit.
- Le dossier de fichiers « carnet » est privé, avec les mêmes règles (utilisateurs connectés seulement).
- Côté nginx, seuls les chemins `rest`, `auth` et `storage` de l'API sont exposés.

### Organisation du code

```
src/
  components/   Layout (menu), Connexion, Embleme, Chargement
  pages/        une page par écran (liste, fiche, formulaires, stats, suivi, alertes)
  utils/
    donnees.ts      accès aux données (Supabase), conversion snake_case ↔ camelCase
    alertes.ts      calcul des échéances d'entretien et de CT
    fichiers.ts     envoi, liens signés et suppression des fichiers
    export.ts       exports JSON et CSV
    pdfGenerator.ts export PDF
  lib/supabase.ts client Supabase
supabase/migrations/  schéma de la base (tables, clés, RLS)
scripts/serveur/      installation et exploitation sur le serveur
```

## Développement

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
cp .env.example .env.local   # puis renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

Pour travailler sur les vraies données depuis le PC, ouvrir un tunnel vers l'API du serveur et pointer `.env.local` sur `http://127.0.0.1:54331` :

```bash
ssh -N -L 54331:127.0.0.1:54331 lambretta
```

Autres commandes :

```bash
npm run build   # vérification des types puis build de production
npm run lint
```

## Déploiement

Le site est servi par nginx depuis un clone du dépôt sur le serveur (`~/apps/carnet`).
Pour publier la branche `main` :

```bash
~/apps/carnet/scripts/serveur/3_deployer_site.sh
```

Le script récupère la branche, construit le site à côté de la version en ligne, puis bascule.

Scripts d'installation (déjà exécutés, conservés pour une réinstallation) :

| Script | Rôle |
| --- | --- |
| `0_elargir_pare_feu.sh` | ouvre la plage de ports des instances Supabase (sudo) |
| `1_creer_instance.sh` | crée l'instance Supabase `carnet` avec des clés aléatoires |
| `2_importer_firestore.sh` | importe les données de l'ancienne base Firebase |
| `4_creer_compte.sh` | crée un compte ou change son mot de passe |
| `5_nginx_certificat.sh` | configure nginx et le certificat HTTPS (sudo) |
| `6_activer_stockage.sh` | v1.4 : active le stockage de fichiers et applique la migration |
| `7_nginx_stockage.sh` | v1.4 : ouvre `/storage/v1/` dans nginx (sudo) |
| `sauvegarde_carnet.sh` | sauvegarde quotidienne de la base et des fichiers (disque local + NAS) |
| `rappels_carnet.py` | rappels ntfy des échéances ; `--essai` pour voir sans envoyer |

Tâches planifiées (`crontab -e`, utilisateur cynemos) :

```
15 4 * * * /home/cynemos/bin/sauvegarde_carnet.sh >/dev/null 2>&1
30 8 * * * /home/cynemos/bin/rappels_carnet.py >/dev/null 2>&1
```

## Historique

- **1.0** : version d'origine, hébergée sur Netlify avec Firebase.
- **1.1** : migration vers Supabase auto-hébergé, connexion obligatoire.
- **1.2** : affichage adapté au téléphone.
- **1.3** : thème « atelier de restauration vintage » et calcul des alertes corrigé ; mises à jour de sécurité des dépendances.
- **1.4** : kilométrage relevé, échéances par véhicule, statut vendu, fichiers sur le serveur, rappels ntfy, appli installable, exports JSON/CSV, nouveau PDF.
