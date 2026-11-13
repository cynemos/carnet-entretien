#!/bin/bash
# Étape 1 — Crée sur le serveur une instance Supabase réservée aux Carnets d'entretien,
# à côté de celles de Lambretta, Bultaco et AéroMag.
# Sans sudo. À lancer une seule fois (relancer ne change rien si l'instance existe déjà).
# Prérequis : 0_elargir_pare_feu.sh (la plage 54320-54329 est pleine).
#
# - Ports 54331 (API), 54332 (base), 54333 (base fantôme, jamais démarrée) : dans la plage
#   54320-54339 fermée au réseau par le service supabase-pare-feu. Seul nginx y accède.
#   Studio est désactivé : la base se gère par psql.
# - Le schéma (supabase/migrations du dépôt) est copié dans l'instance et appliqué au démarrage.
# - Clés tirées au hasard (jwt_secret, publishable_key, secret_key) : sans cela, la CLI utilise
#   des clés d'administration par défaut, identiques sur toutes les installations et donc publiques.
# - Services inutiles à ce site désactivés (temps réel, stockage de fichiers, fonctions Edge, journaux,
#   courriels de test, Studio).
set -euo pipefail
# Le chemin complet /usr/bin/supabase est voulu : une ancienne CLI (2.x) traîne dans ~/.local/share/supabase
# et passe devant dans une session interactive ; elle ne sait pas lire la configuration actuelle.

MODELE=/home/cynemos/supabase/supabase/config.toml   # configuration de Lambretta, qui sert de modèle
DEPOT=$(cd "$(dirname "$0")/../.." && pwd)            # dépôt du site (pour le schéma)
DOSSIER=/home/cynemos/supabase-carnet
CONFIG="$DOSSIER/supabase/config.toml"

if [ -f "$CONFIG" ]; then
  echo "Configuration déjà présente : $CONFIG (non modifiée)"
else
  mkdir -p "$DOSSIER/supabase"
  SECRET=$(openssl rand -hex 32)
  alea() { openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | cut -c1-"$1"; }
  CLE_PUBLIQUE="$(alea 22)_$(alea 8)"
  CLE_ADMIN="$(alea 22)_$(alea 8)"
  ( umask 077; SECRET="$SECRET" CLE_PUBLIQUE="$CLE_PUBLIQUE" CLE_ADMIN="$CLE_ADMIN" python3 - "$MODELE" "$CONFIG" <<'PY'
import os, re, sys
source, cible = sys.argv[1], sys.argv[2]
secret = os.environ["SECRET"]
# section -> {clé: nouvelle valeur}
reglages = {
    "": {"project_id": '"carnet"'},
    "api": {"port": "54331"},
    "db": {"port": "54332", "shadow_port": "54333"},
    "studio": {"enabled": "false"},
    "realtime": {"enabled": "false"},
    "storage": {"enabled": "false"},
    "local_smtp": {"enabled": "false"},
    "storage.s3_protocol": {"enabled": "false"},
    "edge_runtime": {"enabled": "false"},
    "analytics": {"enabled": "false"},
    "auth": {
        "site_url": '"https://carnet.cyneprod.org"',
        "additional_redirect_urls": '["https://carnet.cyneprod.org"]',
        "enable_signup": "false",
    },
}
faits, section, sortie = set(), "", []
for ligne in open(source, encoding="utf-8").read().splitlines():
    titre = re.match(r"^\[([^\]]+)\]\s*$", ligne)
    if titre:
        section = titre.group(1)
        sortie.append(ligne)
        if section == "auth":
            sortie.append("# Clé de signature propre à cette instance (ne jamais la publier).")
            sortie.append(f'jwt_secret = "{secret}"')
            # Les clés « sb_… » ont elles aussi une valeur par défaut publique : on les remplace.
            sortie.append(f'publishable_key = "sb_publishable_{os.environ["CLE_PUBLIQUE"]}"')
            sortie.append(f'secret_key = "sb_secret_{os.environ["CLE_ADMIN"]}"')
        continue
    cle = re.match(r"^([a-z_]+)\s*=", ligne)
    if section == "auth" and (ligne.startswith("# Clés propres") or (cle and cle.group(1) in ("jwt_secret", "publishable_key", "secret_key"))):
        continue  # clés de l'instance modèle : celles de cette instance sont ajoutées plus haut
    if cle and cle.group(1) in reglages.get(section, {}):
        sortie.append(f"{cle.group(1)} = {reglages[section][cle.group(1)]}")
        faits.add((section, cle.group(1)))
        continue
    sortie.append(ligne)
manquants = [(s, c) for s, v in reglages.items() for c in v if (s, c) not in faits]
if manquants:
    sys.exit(f"Réglages introuvables dans le modèle : {manquants}")
open(cible, "w", encoding="utf-8").write("\n".join(sortie) + "\n")
PY
  )
  chmod 600 "$CONFIG"
  echo "Configuration créée : $CONFIG"
fi

# Garde-fou : la plage du pare-feu doit couvrir nos ports
grep -q '^PORTS=54320:54339$' /usr/local/sbin/supabase-pare-feu || { echo "Lancer d'abord 0_elargir_pare_feu.sh (ports 54331-54333 encore ouverts au réseau)."; exit 1; }

mkdir -p "$DOSSIER/supabase/migrations"
cp "$DEPOT"/supabase/migrations/*.sql "$DOSSIER/supabase/migrations/"

cd "$DOSSIER"
if docker ps --format '{{.Names}}' | grep -q '^supabase_db_carnet$'; then
  echo "Instance déjà démarrée."
else
  echo "Démarrage de l'instance (1 à 3 minutes)…"
  # La sortie de « supabase start » contient les clés : elle va dans un fichier privé, pas à l'écran.
  ( umask 077; /usr/bin/supabase start > "$DOSSIER/demarrage.log" 2>&1 ) || { echo "ÉCHEC du démarrage :"; grep -viE 'key|secret|eyJ' "$DOSSIER/demarrage.log" | tail -20; exit 1; }
fi

echo "--- Conteneurs"
docker ps --format '{{.Names}}\t{{.Status}}\t{{.Ports}}' | grep '_carnet' | sort
echo "INSTANCE_OK"
