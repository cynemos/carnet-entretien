#!/usr/bin/env python3
"""Rappels « Carnets d'entretien » sur le téléphone, via ntfy.

Mêmes règles que la page Alertes de l'appli (src/utils/alertes.ts) :
- entretien en retard ou à prévoir dans les 3 mois (tous les N mois), ou à moins de 10 % du pas en km ;
- contrôle technique expiré ou à repasser dans les 3 mois ;
- les véhicules vendus sont ignorés.

Envoi seulement si la liste des alertes a changé depuis le dernier envoi, ou le lundi s'il reste
des retards (rappel hebdomadaire). À lancer chaque jour par cron :
    30 8 * * * /home/cynemos/bin/rappels_carnet.py >/dev/null 2>&1
Options : --essai (affiche sans envoyer), --forcer (envoie même sans changement).
Canal ntfy : NTFY_CANAL dans ~/.config/lambretta-alerte (commun aux sauvegardes), jamais dans le dépôt.
"""
import calendar
import datetime as dt
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.request

DB = "supabase_db_carnet"
ETAT = os.path.expanduser("~/.local/state/carnet-rappels.json")
CONFIG = os.path.expanduser("~/.config/lambretta-alerte")
SITE = "https://carnet.cyneprod.org/alerts"

REQUETE = """
select coalesce(json_agg(json_build_object(
  'nom', concat_ws(' ', v.year, v.make, v.model),
  'plaque', v.license_plate,
  'ct_ans', v.ct_interval_years,
  'mois', v.maintenance_interval_months,
  'pas_km', v.maintenance_interval_km,
  'km', greatest(coalesce(v.current_mileage, 0), coalesce(v.initial_mileage, 0),
                 (select coalesce(max(m.mileage), 0) from maintenance_entries m where m.vehicle_id = v.id),
                 (select coalesce(max(c.mileage), 0) from controle_technique_entries c where c.vehicle_id = v.id)),
  'entretien', (select json_build_object('date', m.date, 'km', m.mileage) from maintenance_entries m
                where m.vehicle_id = v.id order by m.date desc limit 1),
  'ct', (select json_build_object('date', c.date, 'validite', c.validity) from controle_technique_entries c
         where c.vehicle_id = v.id order by c.date desc limit 1)
) order by v.year), '[]') from vehicles v where v.sold_date is null
"""


def ajouter_mois(d, n):
    m = d.month - 1 + n
    a, m = d.year + m // 12, m % 12 + 1
    return dt.date(a, m, min(d.day, calendar.monthrange(a, m)[1]))


def lire_date(texte):
    texte = (texte or "").strip()
    for f in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d.%m.%Y", "%d/%m/%y"):
        try:
            return dt.datetime.strptime(texte, f).date()
        except ValueError:
            pass
    return None


def echeance_ct(ct, intervalle):
    d = lire_date(ct.get("validite"))
    if d:
        return d
    base = lire_date(ct.get("date"))
    if not base:
        return None
    texte = ct.get("validite") or ""
    if re.search(r"contre[\s-]?visite", texte, re.I):
        return ajouter_mois(base, 2)
    ans = re.search(r"(\d+)\s*ans?", texte, re.I)
    return ajouter_mois(base, 12 * (int(ans.group(1)) if ans else intervalle))


def jour(d):
    return d.strftime("%d/%m/%Y")


def km(n):
    return f"{n:,}".replace(",", " ") + " km"


def alertes(v, aujourdhui):
    sortie = []
    dans3mois = ajouter_mois(aujourdhui, 3)

    def situer(e):
        return "urgent" if e < aujourdhui else "bientot" if e < dans3mois else None

    e = v.get("entretien")
    if e and lire_date(e["date"]):
        prochain = ajouter_mois(lire_date(e["date"]), v["mois"] or 12)
        n = situer(prochain)
        if n == "urgent":
            sortie.append((n, f"entretien en retard depuis le {jour(prochain)}"))
        elif n == "bientot":
            sortie.append((n, f"entretien avant le {jour(prochain)}"))
        if v.get("pas_km") and e.get("km"):
            cible = e["km"] + v["pas_km"]
            reste = cible - v["km"]
            if reste <= 0:
                sortie.append(("urgent", f"entretien dû à {km(cible)}, dépassé de {km(-reste)}"))
            elif reste <= v["pas_km"] * 0.1:
                sortie.append(("bientot", f"entretien dans {km(reste)}"))
    ct = v.get("ct")
    if ct:
        ech = echeance_ct(ct, v["ct_ans"] or 2)
        n = situer(ech) if ech else None
        if n == "urgent":
            sortie.append((n, f"CT expiré depuis le {jour(ech)}"))
        elif n == "bientot":
            sortie.append((n, f"CT à repasser avant le {jour(ech)}"))
    return sortie


def canal():
    try:
        for ligne in open(CONFIG):
            m = re.match(r'\s*NTFY_CANAL=["\']?([^"\'\s]+)', ligne)
            if m:
                return m.group(1)
    except OSError:
        pass
    return None


def main():
    essai, forcer = "--essai" in sys.argv, "--forcer" in sys.argv
    brut = subprocess.run(["docker", "exec", DB, "psql", "-U", "postgres", "-d", "postgres", "-At", "-c", REQUETE],
                          check=True, capture_output=True, text=True).stdout
    aujourdhui = dt.date.today()
    lignes, urgent = [], False
    for v in json.loads(brut):
        for niveau, texte in alertes(v, aujourdhui):
            urgent |= niveau == "urgent"
            lignes.append(f"{'⚠' if niveau == 'urgent' else '⏳'} {v['nom']}{' (' + v['plaque'] + ')' if v.get('plaque') else ''} : {texte}")

    empreinte = hashlib.sha256("\n".join(lignes).encode()).hexdigest()
    try:
        precedente = json.load(open(ETAT)).get("empreinte")
    except (OSError, ValueError):
        precedente = None
    changement = empreinte != precedente
    rappel_hebdo = urgent and aujourdhui.weekday() == 0

    if essai:
        print("\n".join(lignes) or "Aucune alerte.")
        print(f"(envoi prévu : {'oui' if lignes and (changement or rappel_hebdo) else 'non'})")
        return
    if lignes and (changement or rappel_hebdo or forcer):
        c = canal()
        if not c:
            sys.exit("Canal ntfy absent (~/.config/lambretta-alerte).")
        corps = json.dumps({
            "topic": c,
            "title": f"Carnets d'entretien : {len(lignes)} échéance{'s' if len(lignes) > 1 else ''}",
            "message": "\n".join(lignes),
            "priority": 4 if urgent else 3,
            "tags": ["wrench"],
            "click": SITE,
        }).encode()
        req = urllib.request.Request("https://ntfy.sh", data=corps, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=20).read()
    os.makedirs(os.path.dirname(ETAT), exist_ok=True)
    json.dump({"empreinte": empreinte, "le": aujourdhui.isoformat(), "alertes": len(lignes)}, open(ETAT, "w"))


if __name__ == "__main__":
    main()
