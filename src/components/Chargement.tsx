import React from 'react';
import { Cog } from 'lucide-react';

// Indicateur de chargement : un pignon qui tourne
const Chargement: React.FC<{ texte?: string }> = ({ texte = 'Chargement…' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-primary">
    <Cog size={44} className="animate-spin [animation-duration:2.5s]" />
    <span className="font-machine text-light/70">{texte}</span>
  </div>
);

export default Chargement;
