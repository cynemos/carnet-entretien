#!/usr/bin/env bash
# v1.4.0 : active le stockage de fichiers de l'instance Supabase « carnet » et applique la migration
# 20261114120000 (kilométrage, échéances, statut vendu, dossier privé « carnet »).
# À lancer sans sudo, après un « git pull » de ~/apps/carnet. Rejouable sans risque.
# Ensuite : sudo ~/apps/carnet/scripts/serveur/7_nginx_stockage.sh (ouvre /storage/v1/ côté nginx).
set -euo pipefail

DEPOT=/home/cynemos/apps/carnet
DOSSIER=/home/cynemos/supabase-carnet
MIGRATION=20261114120000_echeances_vendu_fichiers.sql
DB=supabase_db_carnet

echo "1. Sauvegarde préalable"
/home/cynemos/bin/sauvegarde_carnet.sh > /dev/null && echo "   faite"

echo "2. Stockage activé dans config.toml"
python3 - "$DOSSIER/supabase/config.toml" <<'PY'
import re, sys
p = sys.argv[1]
s = open(p).read()
s2 = re.sub(r'(\[storage\]\s*\n)enabled = false', r'\1enabled = true', s, count=1)
s2 = re.sub(r'(\[storage\][^\[]*?file_size_limit = )"[^"]*"', r'\1"20MiB"', s2, count=1)
open(p, 'w').write(s2)
print('   ' + ('modifié' if s2 != s else 'déjà actif'))
PY

echo "3. Redémarrage de l'instance (données conservées)"
cp "$DEPOT/supabase/migrations/$MIGRATION" "$DOSSIER/supabase/migrations/"
cd "$DOSSIER"
/usr/bin/supabase stop > /dev/null 2>&1
# La sortie contient les clés : fichier privé, pas l'écran
( umask 077; /usr/bin/supabase start > "$DOSSIER/demarrage.log" 2>&1 ) \
  || { echo "ÉCHEC du démarrage :"; grep -viE 'key|secret|eyJ' "$DOSSIER/demarrage.log" | tail -20; exit 1; }
docker ps --format '{{.Names}}' | grep -qx supabase_storage_carnet || { echo "ÉCHEC : conteneur de stockage absent"; exit 1; }
echo "   conteneur supabase_storage_carnet en route"

echo "4. Migration"
# Sur une instance existante, « supabase start » n'applique pas les nouvelles migrations : on le fait ici.
docker exec -i "$DB" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q < "$DOSSIER/supabase/migrations/$MIGRATION"
docker exec "$DB" psql -U postgres -d postgres -q -c \
  "insert into supabase_migrations.schema_migrations(version, name) values ('20261114120000','echeances_vendu_fichiers') on conflict do nothing" 2>/dev/null || true
docker exec "$DB" psql -U postgres -d postgres -At -c \
  "select 'colonnes ajoutées : ' || count(*) from information_schema.columns where table_name='vehicles' and column_name in ('current_mileage','ct_interval_years','sold_date','photo_path');
   select 'dossier privé : ' || id || ' (public=' || public || ')' from storage.buckets where id='carnet';
   select 'règles d''accès : ' || count(*) from pg_policies where schemaname='storage' and policyname like 'carnet_%';"
echo "STOCKAGE_OK"
