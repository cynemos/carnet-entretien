#!/bin/bash
# Étape 5 — Publie les Carnets d'entretien : nginx pour carnet.cyneprod.org (le site) et
# api-carnet.cyneprod.org (Supabase), puis ajout des deux noms au certificat HTTPS.
# Demande sudo : à lancer par l'utilisateur, une fois les deux entrées DNS créées.
# En cas d'erreur de configuration, nginx n'est pas rechargé et le fichier est retiré :
# les autres sites ne sont jamais touchés.
set -euo pipefail

NOMS="carnet.cyneprod.org api-carnet.cyneprod.org"
CERTIFICAT=/etc/letsencrypt/live/cyneprod.org
FICHIER=/etc/nginx/sites-available/carnet
SERVEUR_PUBLIC=$(getent ahostsv4 cyneprod.org | awk 'NR==1 {print $1}')

echo "=== DNS"
for nom in $NOMS; do
  ip=$(getent ahostsv4 "$nom" | awk 'NR==1 {print $1}')
  [ "$ip" = "$SERVEUR_PUBLIC" ] || { echo "$nom ne pointe pas (encore) vers $SERVEUR_PUBLIC (trouvé : ${ip:-rien}). Créer l'entrée DNS puis relancer."; exit 1; }
  echo "$nom → $ip"
done
[ -s /home/cynemos/apps/carnet/dist/index.html ] || { echo "Site non compilé : lancer d'abord 3_deployer_site.sh"; exit 1; }

echo "=== nginx"
sudo tee "$FICHIER" > /dev/null <<EOF
# Site Carnets d'entretien
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name carnet.cyneprod.org;

    ssl_certificate $CERTIFICAT/fullchain.pem;
    ssl_certificate_key $CERTIFICAT/privkey.pem;

    root /home/cynemos/apps/carnet/dist;
    index index.html;

    # Une adresse par page (/vehicle/…, /stats…) : toutes renvoient vers l'application
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    # Fichiers compilés : leur nom change à chaque version, le navigateur peut les garder
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Supabase des Carnets d'entretien
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name api-carnet.cyneprod.org;

    ssl_certificate $CERTIFICAT/fullchain.pem;
    ssl_certificate_key $CERTIFICAT/privkey.pem;

    client_max_body_size 1m;   # pas d envoi de fichiers

    # Liste blanche : seuls les services utilisés par le site sont publics.
    # Tout le reste (/pg/ = exécution SQL en superutilisateur, etc.) est refusé.
    location ~ ^/(rest|auth)/v1/ {
        proxy_pass http://127.0.0.1:54331;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location / {
        return 403;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name carnet.cyneprod.org api-carnet.cyneprod.org;
    return 301 https://\$host\$request_uri;
}
EOF
sudo ln -sf "$FICHIER" /etc/nginx/sites-enabled/carnet
if ! sudo nginx -t; then
  echo "ERREUR de configuration : retrait du fichier des Carnets, rien n'a changé pour les autres sites."
  sudo rm -f /etc/nginx/sites-enabled/carnet
  exit 1
fi
sudo systemctl reload nginx

echo "=== Certificat (ajout des deux noms)"
sudo certbot certonly --nginx --cert-name cyneprod.org --expand \
  -d cyneprod.org -d www.cyneprod.org -d api.cyneprod.org -d lambretta.cyneprod.org \
  -d bultaco.cyneprod.org -d api-bultaco.cyneprod.org \
  -d aeromag.cyneprod.org -d api-aeromag.cyneprod.org \
  -d carnet.cyneprod.org -d api-carnet.cyneprod.org
sudo systemctl reload nginx

echo "=== Vérification"
R="--resolve carnet.cyneprod.org:443:127.0.0.1 --resolve api-carnet.cyneprod.org:443:127.0.0.1 --resolve cyneprod.org:443:127.0.0.1 --resolve lambretta.cyneprod.org:443:127.0.0.1 --resolve bultaco.cyneprod.org:443:127.0.0.1 --resolve aeromag.cyneprod.org:443:127.0.0.1"
verifier() { code=$(curl -s $R -o /dev/null -m 15 -w '%{http_code}' "$1" || true); printf '%-50s %s (attendu %s)\n' "$1" "$code" "$2"; [ "$code" = "$2" ]; }
ok=1
verifier https://carnet.cyneprod.org/ 200 || ok=0
verifier https://carnet.cyneprod.org/stats 200 || ok=0
verifier https://api-carnet.cyneprod.org/auth/v1/health 200 || ok=0
verifier https://api-carnet.cyneprod.org/pg/ 403 || ok=0
verifier https://api-carnet.cyneprod.org/ 403 || ok=0
verifier https://cyneprod.org/ 200 || ok=0
verifier https://lambretta.cyneprod.org/ 200 || ok=0
verifier https://bultaco.cyneprod.org/ 200 || ok=0
verifier https://aeromag.cyneprod.org/ 200 || ok=0
verifier https://api-carnet.cyneprod.org/rest/v1/vehicles 401 || ok=0
[ "$ok" = 1 ] && echo "PUBLICATION_OK" || { echo "PUBLICATION À VÉRIFIER"; exit 1; }
