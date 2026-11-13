#!/bin/bash
# Étape 0 — Élargit la plage de ports Supabase fermée au réseau : 54320-54329 → 54320-54339.
# La plage d'origine est pleine (Lambretta, Bultaco, AéroMag) ; les Carnets d'entretien
# utiliseront 54331-54333. Demande sudo : à lancer par l'utilisateur, une seule fois.
# Les règles déjà en place restent ; les nouvelles couvrent la plage élargie.
set -euo pipefail

PARE_FEU=/usr/local/sbin/supabase-pare-feu

if grep -q '^PORTS=54320:54339$' "$PARE_FEU"; then
  echo "Plage déjà élargie."
else
  grep -q '^PORTS=54320:54329$' "$PARE_FEU" || { echo "Contenu inattendu dans $PARE_FEU : rien n'a été modifié."; exit 1; }
  sudo cp "$PARE_FEU" "$PARE_FEU.avant-54339"
  sudo sed -i 's/^PORTS=54320:54329$/PORTS=54320:54339/' "$PARE_FEU"
  echo "Plage élargie dans $PARE_FEU (ancienne version : $PARE_FEU.avant-54339)."
fi

# Applique tout de suite (le service le refera à chaque démarrage)
sudo "$PARE_FEU"

echo "=== Vérification"
ok=1
sudo iptables -C DOCKER-USER -i "$(ip route show default | awk '{print $5; exit}')" -p tcp -m conntrack --ctorigdstport 54320:54339 --ctdir ORIGINAL -j DROP 2>/dev/null || ok=0
sudo iptables -S INPUT | grep -q -- '--dport 54320:54339 -j DROP' || ok=0
sudo ip6tables -S INPUT | grep -q -- '--dport 54320:54339 -j DROP' || ok=0
[ "$ok" = 1 ] && echo "PARE_FEU_OK : ports 54320-54339 fermés au réseau" || { echo "PARE-FEU À VÉRIFIER"; exit 1; }
