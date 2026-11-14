// Export PDF de l'historique d'un véhicule, mis en page comme une fiche d'atelier :
// bandeau brun et laiton, tableaux à lignes alternées, totaux, pied de page numéroté.
import { jsPDF } from 'jspdf';
import { Vehicle } from '../types';
import { format, isValid, differenceInMonths } from 'date-fns';
import { libelleType, kmActuel } from './alertes';

type RVB = [number, number, number];
const BRUN: RVB = [34, 27, 21];
const LAITON: RVB = [212, 148, 58];
const CREME: RVB = [250, 246, 236];
const ENCRE: RVB = [40, 32, 25];
const GRIS: RVB = [120, 108, 95];
const LIGNE_PAIRE: RVB = [243, 234, 214];

// Espaces ordinaires : les polices standard du PDF ne connaissent pas l'espace fine insécable
const nombre = (n: number, decimales = 0) =>
  n.toFixed(decimales).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const euros = (n: number) => `${nombre(n, 2)} €`;
const dateFr = (d?: string) => (d && isValid(new Date(d)) ? format(new Date(d), 'dd/MM/yyyy') : '—');

interface Colonne { titre: string; largeur: number; droite?: boolean }

export const generateVehicleHistoryPdf = (vehicle: Vehicle) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const L = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  let y = 0;

  const couleur = (c: RVB, quoi: 'texte' | 'fond' | 'trait') =>
    quoi === 'texte' ? doc.setTextColor(...c) : quoi === 'fond' ? doc.setFillColor(...c) : doc.setDrawColor(...c);

  const fondPage = () => {
    couleur(CREME, 'fond');
    doc.rect(0, 0, L, H, 'F');
  };

  const bandeau = (petit = false) => {
    const h = petit ? 14 : 34;
    couleur(BRUN, 'fond');
    doc.rect(0, 0, L, h, 'F');
    couleur(LAITON, 'fond');
    doc.rect(0, h, L, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    couleur(LAITON, 'texte');
    if (petit) {
      doc.setFontSize(10);
      doc.text(`${vehicle.make} ${vehicle.model} — carnet d'entretien`, M, 9);
    } else {
      doc.setFontSize(9);
      doc.text("CARNET D'ENTRETIEN", M, 11, { charSpace: 1.2 });
      doc.setFontSize(22);
      doc.text(`${vehicle.make} ${vehicle.model}`, M, 24);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      couleur(CREME, 'texte');
      doc.text(`${libelleType(vehicle.type)} · ${vehicle.year}${vehicle.soldDate ? ` · vendu le ${dateFr(vehicle.soldDate)}` : ''}`, M, 30);
      if (vehicle.licensePlate) {
        // Plaque noire à l'ancienne
        const w = doc.getTextWidth(vehicle.licensePlate) * 1.25 + 10;
        doc.setFillColor(10, 10, 10);
        doc.setDrawColor(190, 190, 190);
        doc.setLineWidth(0.6);
        doc.roundedRect(L - M - w, 13, w, 10, 1.2, 1.2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(232, 232, 232);
        doc.text(vehicle.licensePlate, L - M - w / 2, 20, { align: 'center', charSpace: 0.6 });
      }
    }
    y = h + 10;
  };

  const nouvellePage = () => {
    doc.addPage();
    fondPage();
    bandeau(true);
  };

  const place = (hauteur: number) => {
    if (y + hauteur > H - 18) nouvellePage();
  };

  const titreSection = (texte: string) => {
    place(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    couleur(BRUN, 'texte');
    doc.text(texte.toUpperCase(), M, y, { charSpace: 0.4 });
    couleur(LAITON, 'trait');
    doc.setLineWidth(0.8);
    doc.line(M, y + 2, M + 40, y + 2);
    doc.setLineWidth(0.2);
    doc.line(M, y + 3.2, M + 40, y + 3.2);
    y += 9;
  };

  const tableau = (colonnes: Colonne[], lignes: string[][], pied?: string[]) => {
    const entete = () => {
      couleur(BRUN, 'fond');
      doc.rect(M, y, L - 2 * M, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      couleur(LAITON, 'texte');
      let x = M;
      colonnes.forEach(c => {
        doc.text(c.titre.toUpperCase(), c.droite ? x + c.largeur - 2 : x + 2, y + 4.7, { align: c.droite ? 'right' : 'left' });
        x += c.largeur;
      });
      y += 7;
    };
    place(15);
    entete();
    doc.setFontSize(9);
    lignes.forEach((ligne, i) => {
      doc.setFont('helvetica', 'normal');
      const cellules = ligne.map((v, j) => doc.splitTextToSize(v, colonnes[j].largeur - 4) as string[]);
      const h = Math.max(...cellules.map(c => c.length)) * 4.2 + 2.6;
      if (y + h > H - 18) { nouvellePage(); entete(); doc.setFontSize(9); doc.setFont('helvetica', 'normal'); }
      if (i % 2 === 0) { couleur(LIGNE_PAIRE, 'fond'); doc.rect(M, y, L - 2 * M, h, 'F'); }
      couleur(ENCRE, 'texte');
      let x = M;
      cellules.forEach((c, j) => {
        const col = colonnes[j];
        doc.text(c, col.droite ? x + col.largeur - 2 : x + 2, y + 4.4, { align: col.droite ? 'right' : 'left' });
        x += col.largeur;
      });
      y += h;
    });
    if (pied) {
      place(8);
      couleur(LAITON, 'trait');
      doc.setLineWidth(0.5);
      doc.line(M, y, L - M, y);
      doc.setFont('helvetica', 'bold');
      couleur(BRUN, 'texte');
      let x = M;
      pied.forEach((v, j) => {
        const col = colonnes[j];
        if (v) doc.text(v, col.droite ? x + col.largeur - 2 : x + 2, y + 5, { align: col.droite ? 'right' : 'left' });
        x += col.largeur;
      });
      y += 8;
    }
    y += 6;
  };

  // Page 1 : identité du véhicule
  fondPage();
  bandeau();

  const fiche: [string, string][] = [
    ['Kilométrage actuel', `${nombre(kmActuel(vehicle))} km`],
    ["Kilométrage à l'achat", `${nombre(vehicle.initialMileage || 0)} km`],
    ["Date d'achat", dateFr(vehicle.purchaseDate)],
    ['1re mise en circulation', dateFr(vehicle.firstRegistrationDate)],
    ['N° de série (VIN)', vehicle.vin || '—'],
    ['Échéances', `CT tous les ${vehicle.ctIntervalYears} ans, entretien tous les ${vehicle.maintenanceIntervalMonths} mois${vehicle.maintenanceIntervalKm ? ` ou ${nombre(vehicle.maintenanceIntervalKm)} km` : ''}`],
  ];
  const colonneW = (L - 2 * M) / 2;
  fiche.forEach(([k, v], i) => {
    const x = M + (i % 2) * colonneW;
    if (i % 2 === 0 && i > 0) y += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    couleur(GRIS, 'texte');
    doc.text(k.toUpperCase(), x, y);
    doc.setFont('courier', 'normal');
    doc.setFontSize(10.5);
    couleur(ENCRE, 'texte');
    doc.text(doc.splitTextToSize(v, colonneW - 6)[0], x, y + 5);
  });
  y += 18;

  // Entretiens
  const entretiens = [...vehicle.maintenanceHistory].sort((a, b) => a.date.localeCompare(b.date));
  const total = entretiens.reduce((s, e) => s + (e.totalCost || 0), 0);
  titreSection(`Entretiens (${entretiens.length})`);
  if (entretiens.length) {
    tableau(
      [{ titre: 'Date', largeur: 22 }, { titre: 'Km', largeur: 22, droite: true }, { titre: 'Intervention', largeur: 92 },
        { titre: 'Pièces', largeur: 23, droite: true }, { titre: 'Total', largeur: 23, droite: true }],
      entretiens.map(e => [dateFr(e.date), nombre(e.mileage || 0), e.description || '—', euros(e.partsCost || 0), euros(e.totalCost || 0)]),
      ['', '', 'Total investi', '', euros(total)],
    );
  } else {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(10); couleur(GRIS, 'texte');
    doc.text('Aucun entretien enregistré.', M, y); y += 10;
  }

  // Contrôles techniques
  const controles = [...vehicle.controleTechniqueHistory].sort((a, b) => a.date.localeCompare(b.date));
  titreSection(`Contrôles techniques (${controles.length})`);
  if (controles.length) {
    tableau(
      [{ titre: 'Date', largeur: 22 }, { titre: 'Km', largeur: 22, droite: true }, { titre: 'Validité', largeur: 30 },
        { titre: 'Défaillances majeures', largeur: 54 }, { titre: 'Défaillances mineures', largeur: 54 }],
      controles.map(c => [dateFr(c.date), nombre(c.mileage || 0), c.validity || '—', c.majorFailures || '—', c.minorFailures || '—']),
    );
  } else {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(10); couleur(GRIS, 'texte');
    doc.text('Aucun contrôle technique enregistré.', M, y); y += 10;
  }

  // Anciens propriétaires
  const proprietaires = [...vehicle.previousOwners].sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (proprietaires.length) {
    titreSection('Propriétaires successifs');
    tableau(
      [{ titre: 'Nom', largeur: 70 }, { titre: 'Du', largeur: 30 }, { titre: 'Au', largeur: 30 }, { titre: 'Durée', largeur: 52 }],
      proprietaires.map(p => {
        const debut = new Date(p.startDate), fin = new Date(p.endDate);
        let duree = '—';
        if (isValid(debut) && isValid(fin) && fin >= debut) {
          const mois = differenceInMonths(fin, debut);
          duree = [mois >= 12 ? `${Math.floor(mois / 12)} an${mois >= 24 ? 's' : ''}` : '', mois % 12 ? `${mois % 12} mois` : '']
            .filter(Boolean).join(' ') || "moins d'un mois";
        }
        return [p.name || '—', dateFr(p.startDate), dateFr(p.endDate), duree];
      }),
    );
  }

  // Pied de page sur chaque page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    couleur(LAITON, 'trait');
    doc.setLineWidth(0.3);
    doc.line(M, H - 12, L - M, H - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    couleur(GRIS, 'texte');
    doc.text(`Édité le ${format(new Date(), 'dd/MM/yyyy')} · carnet.cyneprod.org`, M, H - 7);
    doc.text(`Page ${i} / ${pages}`, L - M, H - 7, { align: 'right' });
  }

  const nom = `${vehicle.make}-${vehicle.model}`.normalize('NFD').replace(/[^\w-]+/g, '-').replace(/-+/g, '-');
  doc.save(`carnet-${nom}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
