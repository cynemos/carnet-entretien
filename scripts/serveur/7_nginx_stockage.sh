#!/usr/bin/env bash
# v1.4.0 : ouvre le chemin /storage/v1/ de l'API Carnets dans nginx (liste blanche) et accepte
# des envois jusqu'à 25 Mo. À lancer avec sudo, après 6_activer_stockage.sh.
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "À lancer avec sudo."; exit 1; }

F=/etc/nginx/sites-available/carnet
cp "$F" "$F.avant-stockage"

python3 - "$F" <<'PY'
import re, sys
p = sys.argv[1]
s = open(p).read()
s = s.replace('location ~ ^/(rest|auth)/v1/ {', 'location ~ ^/(rest|auth|storage)/v1/ {')
if 'client_max_body_size' in s:
    s = re.sub(r'client_max_body_size\s+\S+;.*', 'client_max_body_size 25m;   # photos et factures (20 Mo au plus)', s)
else:
    # dans le bloc server de l'API, juste avant la liste blanche
    s = s.replace('    location ~ ^/(rest|auth|storage)/v1/ {',
                  '    client_max_body_size 25m;   # photos et factures (20 Mo au plus)\n\n    location ~ ^/(rest|auth|storage)/v1/ {', 1)
open(p, 'w').write(s)
PY

grep -q 'rest|auth|storage' "$F" || { echo "ÉCHEC : liste blanche non trouvée dans $F"; cp "$F.avant-stockage" "$F"; exit 1; }
if nginx -t 2>/dev/null; then
  systemctl reload nginx
  echo "NGINX_OK : /storage/v1/ ouvert pour api-carnet.cyneprod.org"
else
  cp "$F.avant-stockage" "$F"
  nginx -t || true
  echo "ÉCHEC : configuration refusée, ancienne version remise en place"
  exit 1
fi
