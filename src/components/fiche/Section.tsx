import React from 'react';

// Panneau de la fiche véhicule : titre, actions à droite, contenu
const Section: React.FC<{ titre: string; actions?: React.ReactNode; children: React.ReactNode; id?: string }> = ({ titre, actions, children, id }) => (
  <section id={id} className="panneau rounded-lg p-4 md:p-6 mb-8 border border-primary/30">
    <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
      <h3 className="text-xl md:text-2xl font-titre uppercase tracking-wider text-primary">{titre}</h3>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
    {children}
  </section>
);

export const boutonPrincipal = 'bg-primary text-secondary font-bold py-2 px-4 rounded flex items-center gap-2 disabled:opacity-60';
export const boutonSecondaire = 'inline-flex items-center gap-2 px-3 py-1.5 rounded border border-primary/50 text-primary hover:bg-primary/10 text-sm disabled:opacity-60';
export const etiquette = 'block font-titre uppercase tracking-wider text-xs text-primary/90 mb-1';

export default Section;
