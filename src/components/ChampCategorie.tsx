import React from 'react';
import { CATEGORIES_ENTRETIEN, devinerCategorie, libelleCategorie } from '../utils/categories';

// Catégorie d'une intervention. Vide = proposée d'après la description (« auto »).
const ChampCategorie: React.FC<{ valeur: string; description: string; onChange: (code: string) => void; className?: string }> =
  ({ valeur, description, onChange, className }) => (
    <label className={`block ${className ?? ''}`}>
      <span className="block font-titre uppercase tracking-wider text-xs text-primary/90 mb-1">Catégorie</span>
      <select className="input w-full text-light" value={valeur} onChange={e => onChange(e.target.value)}>
        <option value="">Automatique : {libelleCategorie(devinerCategorie(description))}</option>
        {CATEGORIES_ENTRETIEN.map(c => <option key={c.code} value={c.code}>{c.libelle}</option>)}
      </select>
    </label>
  );

export default ChampCategorie;
