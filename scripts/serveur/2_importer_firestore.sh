#!/bin/bash
# Étape 2 — Copie les données de Firebase Firestore (ancien hébergement) dans la base du serveur.
# Sans sudo. À lancer sur le serveur une fois l'instance créée (étape 1) :
#   ~/apps/carnet/scripts/serveur/2_importer_firestore.sh
# Options : SIMULATION=1 (lit et contrôle, n'écrit rien) ; REMPLACER=1 (vide les tables avant,
# pour refaire l'import juste avant la bascule si des saisies ont eu lieu entre-temps).
#
# - La base Firestore est lisible sans clé (aucune règle d'accès) : on lit par l'API REST publique.
# - L'export brut est archivé tel quel (avec la facture PDF que l'ancienne version stockait dans la
#   base) dans ~/carnet-installation/archive-firestore/<date>/ : rien n'est perdu.
# - Identifiants stables : un même document Firestore donne toujours le même identifiant, et
#   l'ordre d'affichage d'origine est conservé (colonne created_at).
# - Tout est écrit dans une seule transaction, puis comparé à l'export (nombres et totaux).
set -euo pipefail

PROJET=carnet-entretien-cynemos
DB=supabase_db_carnet
ARCHIVE=/home/cynemos/carnet-installation/archive-firestore/$(date +%F_%H%M%S)
mkdir -p "$ARCHIVE"

echo "=== Lecture de Firestore"
page=""; n=0
while :; do
  n=$((n + 1))
  curl -sf "https://firestore.googleapis.com/v1/projects/$PROJET/databases/(default)/documents/vehicles?pageSize=300${page:+&pageToken=$page}" \
    -o "$ARCHIVE/vehicles-$n.json"
  page=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("nextPageToken",""))' "$ARCHIVE/vehicles-$n.json")
  [ -n "$page" ] || break
done

python3 - "$ARCHIVE" <<'PY'
import base64, datetime, glob, json, os, re, sys, uuid

archive = sys.argv[1]
docs = []
for f in sorted(glob.glob(os.path.join(archive, "vehicles-*.json")), key=lambda p: int(re.findall(r"(\d+)\.json$", p)[0])):
    docs += json.load(open(f, encoding="utf-8")).get("documents", [])

ESPACE = uuid.UUID("6f1c2b1e-3d4a-4f6b-9c1d-2a7e5b8c9d01")  # espace de noms des identifiants dérivés

def val(champ):
    """Valeur Python d'un champ Firestore REST."""
    if champ is None:
        return None
    (t, v), = champ.items()
    if t == "nullValue": return None
    if t == "integerValue": return int(v)
    if t == "doubleValue": return float(v)
    if t == "arrayValue": return [val(x) for x in v.get("values", [])]
    if t == "mapValue": return {k: val(x) for k, x in v.get("fields", {}).items()}
    return v  # stringValue, booleanValue, timestampValue

def texte(v):
    if v is None: return "null"
    return "'" + str(v).replace("'", "''") + "'"

def nombre(v):
    if v in (None, ""): return "0"
    return repr(float(v)) if isinstance(v, float) else str(int(v))

avert = []
def jour(v, ou):
    if v in (None, ""): return "null"
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(v)):
        datetime.date.fromisoformat(v)
        return texte(v)
    avert.append(f"date illisible ignorée ({ou}) : {v!r}")
    return "null"

def ident(v, graine):
    try:
        return str(uuid.UUID(str(v)))
    except (ValueError, TypeError):
        return str(uuid.uuid5(ESPACE, graine))

debut = datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc)
horloge = [0]
def instant():
    horloge[0] += 1
    return texte((debut + datetime.timedelta(seconds=horloge[0])).isoformat())

sql = ["begin;"]
if os.environ.get("REMPLACER") == "1":
    sql.append("truncate public.vehicles cascade;")
else:
    sql.append("do $$ begin if exists (select 1 from public.vehicles) then "
               "raise exception 'La base contient déjà des véhicules : relancer avec REMPLACER=1 pour la remplacer.'; end if; end $$;")

attendu = {"vehicles": 0, "maintenance_entries": 0, "controle_technique_entries": 0, "previous_owners": 0, "total": 0.0}
for d in docs:
    fid = d["name"].rsplit("/", 1)[1]
    f = {k: val(x) for k, x in d.get("fields", {}).items()}
    vid = str(uuid.uuid5(ESPACE, "vehicle/" + fid))
    attendu["vehicles"] += 1
    sql.append("insert into public.vehicles (id, type, make, model, year, initial_mileage, purchase_date, "
               "first_registration_date, vin, image_url, carte_grise_drive_link, license_plate, created_at) values ("
               f"'{vid}', {texte(f.get('type') or '')}, {texte(f.get('make') or '')}, {texte(f.get('model') or '')}, "
               f"{'null' if f.get('year') in (None, '') else int(f['year'])}, {nombre(f.get('initialMileage'))}, "
               f"{jour(f.get('purchaseDate'), fid)}, {jour(f.get('firstRegistrationDate'), fid)}, "
               f"{texte(f.get('vin') or None)}, {texte(f.get('imageUrl') or None)}, "
               f"{texte(f.get('carteGriseGoogleDriveLink') or None)}, {texte(f.get('licensePlate') or None)}, {instant()});")

    for i, e in enumerate(f.get("maintenanceHistory") or []):
        attendu["maintenance_entries"] += 1
        attendu["total"] += float(e.get("partsCost") or 0) + float(e.get("laborCost") or 0)
        # Ancien champ unique « googleDriveLink » : repris si le lien 1 est vide
        lien1 = e.get("googleDriveLink1") or e.get("googleDriveLink") or None
        if e.get("invoiceContent"):
            nom = re.sub(r"[^\w.-]", "_", e.get("invoiceFileName") or f"facture-{e.get('id')}.pdf")
            contenu = e["invoiceContent"].split(",", 1)[-1]  # retire un éventuel « data:…;base64, »
            open(os.path.join(archive, "facture-" + nom), "wb").write(base64.b64decode(contenu))
        sql.append("insert into public.maintenance_entries (id, vehicle_id, date, mileage, description, parts_cost, "
                   "labor_cost, drive_link_1, drive_link_2, created_at) values ("
                   f"'{ident(e.get('id'), f'm/{fid}/{i}')}', '{vid}', {jour(e.get('date'), fid)}, {nombre(e.get('mileage'))}, "
                   f"{texte(e.get('description') or '')}, {nombre(e.get('partsCost'))}, {nombre(e.get('laborCost'))}, "
                   f"{texte(lien1)}, {texte(e.get('googleDriveLink2') or None)}, {instant()});")

    for i, e in enumerate(f.get("controleTechniqueHistory") or []):
        attendu["controle_technique_entries"] += 1
        cols = ["minorFailures", "majorFailures", "ripage", "suspensionAsymmetry", "verticalForces",
                "serviceBrake", "parkingBrake", "exhaustEmissions", "headlights"]
        sql.append("insert into public.controle_technique_entries (id, vehicle_id, date, mileage, validity, "
                   "minor_failures, major_failures, ripage, suspension_asymmetry, vertical_forces, service_brake, "
                   "parking_brake, exhaust_emissions, headlights, drive_link, created_at) values ("
                   f"'{ident(e.get('id'), f'ct/{fid}/{i}')}', '{vid}', {jour(e.get('date'), fid)}, {nombre(e.get('mileage'))}, "
                   f"{texte(e.get('validity') or '')}, " + ", ".join(texte(e.get(c) or None) for c in cols) +
                   f", {texte(e.get('googleDriveLink') or None)}, {instant()});")
        if e.get("reportUrl"):
            avert.append(f"rapport de CT stocké chez Firebase non repris : {e['reportUrl']}")

    for i, e in enumerate(f.get("previousOwners") or []):
        attendu["previous_owners"] += 1
        # Anciens champs purchaseDate/resaleDate : repris seulement si startDate/endDate manquent
        sql.append("insert into public.previous_owners (id, vehicle_id, name, start_date, end_date, created_at) values ("
                   f"'{ident(e.get('id'), f'p/{fid}/{i}')}', '{vid}', {texte(e.get('name') or None)}, "
                   f"{jour(e.get('startDate') or e.get('purchaseDate'), fid)}, {jour(e.get('endDate') or e.get('resaleDate'), fid)}, {instant()});")

sql.append("commit;")
open(os.path.join(archive, "import.sql"), "w", encoding="utf-8").write("\n".join(sql) + "\n")
json.dump(attendu, open(os.path.join(archive, "attendu.json"), "w"))
for a in avert:
    print("ATTENTION :", a)
print("Lu :", ", ".join(f"{k} {v:.2f}" if k == "total" else f"{k} {v}" for k, v in attendu.items()))
PY

ls "$ARCHIVE"/facture-* 2>/dev/null | sed 's/^/Facture archivée : /' || true

if [ "${SIMULATION:-0}" = 1 ]; then
  echo "SIMULATION : rien n'a été écrit (SQL prêt dans $ARCHIVE/import.sql)."
  exit 0
fi

echo "=== Écriture dans la base"
docker exec -i "$DB" psql -U postgres -d postgres -q -v ON_ERROR_STOP=1 < "$ARCHIVE/import.sql"

echo "=== Contrôle"
TROUVE=$(docker exec "$DB" psql -U postgres -d postgres -At -c "select json_build_object(
  'vehicles', (select count(*) from public.vehicles),
  'maintenance_entries', (select count(*) from public.maintenance_entries),
  'controle_technique_entries', (select count(*) from public.controle_technique_entries),
  'previous_owners', (select count(*) from public.previous_owners),
  'total', (select coalesce(sum(total_cost), 0) from public.maintenance_entries))" </dev/null)
python3 - "$ARCHIVE/attendu.json" "$TROUVE" <<'PY'
import json, sys
a, t = json.load(open(sys.argv[1])), json.loads(sys.argv[2])
ok = all(a[k] == t[k] for k in a if k != "total") and abs(a["total"] - float(t["total"])) < 0.01
for k in a:
    print(f"  {k:28} Firestore {a[k]!s:>10}   serveur {t[k]!s:>10}")
print("IMPORT_OK" if ok else "IMPORT DIFFÉRENT DE L'EXPORT")
sys.exit(0 if ok else 1)
PY
