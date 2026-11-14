import { jsPDF } from 'jspdf';
import { Vehicle } from '../types';
import { format, isValid, differenceInDays } from 'date-fns'; // Import date-fns functions
import { libelleType } from './alertes';
import { fr } from 'date-fns/locale'; // Import French locale

export const generateVehicleHistoryPdf = (vehicle: Vehicle) => {
  const doc = new jsPDF();

  let yOffset = 10;
  const margin = 10;
  const lineHeight = 7;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight(); // Get page height

  // Set font and size
  doc.setFont('helvetica');

  // Function to add page number
  const addPageNumber = (doc: jsPDF, pageNum: number) => {
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Page ' + pageNum, pageWidth - margin, pageHeight - margin);
      doc.setFontSize(10); // Reset font size for content
      doc.setTextColor(0); // Reset text color
  };

  // Function to check and add new page if needed
  const checkPageBreak = () => {
      if (yOffset > pageHeight - margin * 2) { // Check if close to bottom margin
          doc.addPage();
          yOffset = margin; // Reset yOffset for new page
          addPageNumber(doc, doc.getNumberOfPages()); // Add page number to new page
      }
  };


  // Title
  doc.setFontSize(18);
  doc.setTextColor(41, 128, 185); // Set title color (e.g., a shade of blue)
  doc.text(`Historique du Véhicule: ${vehicle.make} ${vehicle.model} (${vehicle.year})`, margin, yOffset);
  yOffset += lineHeight * 2;

  // Vehicle Details
  doc.setFontSize(12);
  doc.setTextColor(0); // Reset text color to black
  doc.text(`Type: ${libelleType(vehicle.type)}`, margin, yOffset); yOffset += lineHeight;
  doc.text(`Kilométrage initial: ${vehicle.initialMileage} km`, margin, yOffset); yOffset += lineHeight;
  // Check if purchaseDate is valid before formatting
  doc.text(`Date d'achat: ${isValid(new Date(vehicle.purchaseDate)) ? format(new Date(vehicle.purchaseDate), 'dd/MM/yyyy', { locale: fr }) : 'Date invalide'}`, margin, yOffset); yOffset += lineHeight;
  if (vehicle.firstRegistrationDate && isValid(new Date(vehicle.firstRegistrationDate))) {
     doc.text(`1ère mise en circulation: ${format(new Date(vehicle.firstRegistrationDate), 'dd/MM/yyyy', { locale: fr })}`, margin, yOffset); yOffset += lineHeight;
  }
  if (vehicle.vin) {
    doc.text(`VIN: ${vehicle.vin}`, margin, yOffset); yOffset += lineHeight;
  }
  if (vehicle.licensePlate) { // Added License Plate
    doc.text(`Plaque: ${vehicle.licensePlate}`, margin, yOffset); yOffset += lineHeight;
  }
   // Removed Carte Grise Link from PDF
  yOffset += lineHeight * 1.5; // Add some space

  // Maintenance History Section (Text only, no table)
  checkPageBreak(); // Check before starting new section
  doc.setFontSize(16);
  doc.setTextColor(41, 128, 185); // Set section title color
  doc.text('Historique d\'entretien', margin, yOffset);
  yOffset += lineHeight * 1.5;

  doc.setTextColor(0); // Reset text color
  doc.setFontSize(10); // Smaller font for details

  if (vehicle.maintenanceHistory && vehicle.maintenanceHistory.length > 0) {
    // Sort by date ascending
    const sortedMaintenance = vehicle.maintenanceHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedMaintenance.forEach(entry => {
      checkPageBreak(); // Check before each entry
      // Check if entry.date is valid before formatting
      doc.text(`- Date: ${isValid(new Date(entry.date)) ? format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr }) : 'Date invalide'}, Kilométrage: ${entry.mileage} km, Coût: ${(entry.partsCost + entry.laborCost).toFixed(2)} €`, margin, yOffset);
      yOffset += lineHeight;
      // Handle description wrapping manually if needed, or keep it simple
      doc.text(`  Description: ${entry.description}`, margin + 5, yOffset);
      yOffset += lineHeight;
      // Removed document links from PDF
      yOffset += lineHeight * 0.5; // Space between entries
    });

  } else {
    checkPageBreak(); // Check before adding "No entries" text
    doc.text('Aucun historique d\'entretien enregistré.', margin, yOffset);
    yOffset += lineHeight;
  }

  yOffset += lineHeight; // Add some space before next section

  // Controle Technique History Section (Text only, no table)
  checkPageBreak(); // Check before starting new section
  doc.setFontSize(16);
  doc.setTextColor(41, 128, 185); // Set section title color
  doc.text('Historique des Contrôles Techniques', margin, yOffset);
  yOffset += lineHeight * 1.5;

  doc.setTextColor(0); // Reset text color
  doc.setFontSize(9); // Smaller font for CT details

  if (vehicle.controleTechniqueHistory && vehicle.controleTechniqueHistory.length > 0) {
     // Sort by date ascending
     const sortedCt = vehicle.controleTechniqueHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

     sortedCt.forEach(entry => {
        checkPageBreak(); // Check before each entry
        // Check if entry.date is valid before formatting
        doc.text(`- Date: ${isValid(new Date(entry.date)) ? format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr }) : 'Date invalide'}, Km: ${entry.mileage} km, Validité: ${entry.validity}`, margin, yOffset);
        yOffset += lineHeight;
        doc.text(`  Défauts Majeurs: ${entry.majorFailures || '-'}`, margin + 5, yOffset);
        yOffset += lineHeight;
        // Removed document links from PDF
        yOffset += lineHeight * 0.5; // Space between entries
     });

  } else {
    checkPageBreak(); // Check before adding "No entries" text
    doc.text('Aucun contrôle technique enregistré.', margin, yOffset);
    yOffset += lineHeight;
  }

  yOffset += lineHeight; // Add some space before next section

  // Previous Owners Section
  checkPageBreak(); // Check before starting new section
  doc.setFontSize(16);
  doc.setTextColor(41, 128, 185); // Set section title color
  doc.text('Propriétaires Précédents', margin, yOffset);
  yOffset += lineHeight * 1.5;

  doc.setTextColor(0); // Reset text color
  doc.setFontSize(10); // Smaller font for details

  if (vehicle.previousOwners && vehicle.previousOwners.length > 0) {
     // Sort by start date ascending
     const sortedOwners = vehicle.previousOwners.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

     sortedOwners.forEach(owner => {
        checkPageBreak(); // Check before each entry

        const startDate = new Date(owner.startDate);
        const endDate = new Date(owner.endDate);
        let duration = 'Dates invalides';

        if (isValid(startDate) && isValid(endDate)) {
            const diffDays = differenceInDays(endDate, startDate);
            if (diffDays < 0) {
                duration = 'Date de fin avant date de début';
            } else {
                const years = Math.floor(diffDays / 365);
                const remainingDays = diffDays % 365;
                const months = Math.floor(remainingDays / 30); // Simple month calculation

                const durationParts = [];
                if (years > 0) durationParts.push(`${years} an(s)`);
                if (months > 0) durationParts.push(`${months} mois`);
                if (years === 0 && months === 0 && diffDays >= 0) durationParts.push(`${diffDays} jour(s)`); // Handle less than a month

                duration = durationParts.length > 0 ? durationParts.join(' ') : 'Moins d\'un jour';
            }
        }


        doc.text(`- Nom: ${owner.name || '-'}, Début: ${isValid(startDate) ? format(startDate, 'dd/MM/yyyy', { locale: fr }) : 'Date invalide'}, Fin: ${isValid(endDate) ? format(endDate, 'dd/MM/yyyy', { locale: fr }) : 'Date invalide'}, Durée: ${duration}`, margin, yOffset);
        yOffset += lineHeight;
        yOffset += lineHeight * 0.5; // Space between entries
     });

  } else {
    checkPageBreak(); // Check before adding "No entries" text
    doc.text('Aucun ancien propriétaire enregistré.', margin, yOffset);
    yOffset += lineHeight;
  }


   // Add footer on the last page (or first if only one page)
   addPageNumber(doc, doc.getNumberOfPages());


  // Save the PDF
  doc.save(`historique_${vehicle.make}_${vehicle.model}.pdf`);
};
