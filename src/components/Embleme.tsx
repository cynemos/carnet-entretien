import React, { useId } from 'react';

// Emblème émaillé de l'atelier : deux clés croisées sous un pignon (illustration originale)
const Embleme: React.FC<{ taille?: number; className?: string }> = ({ taille = 48, className }) => {
  // Identifiants uniques : deux emblèmes coexistent (bandeau téléphone masqué + barre latérale)
  const id = useId().replace(/:/g, '');
  return (
  <svg width={taille} height={taille} viewBox="0 0 64 64" className={className} aria-hidden="true">
    <defs>
      <radialGradient id={`${id}e`} cx="50%" cy="35%" r="70%">
        <stop offset="0" stopColor="#3a2a1c" />
        <stop offset="1" stopColor="#1a120b" />
      </radialGradient>
      <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f1c97a" />
        <stop offset=".5" stopColor="#d4943a" />
        <stop offset="1" stopColor="#8a5a22" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill={`url(#${id}l)`} />
    <circle cx="32" cy="32" r="26" fill={`url(#${id}e)`} />
    <circle cx="32" cy="32" r="23.5" fill="none" stroke="#d4943a" strokeWidth="1" strokeDasharray="2 2.6" opacity=".7" />
    {/* Pignon */}
    <g fill={`url(#${id}l)`} transform="translate(32 22)">
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="-1.6" y="-8.5" width="3.2" height="4" rx=".6" transform={`rotate(${i * 45})`} />
      ))}
      <circle r="5.6" />
      <circle r="2.2" fill="#1a120b" />
    </g>
    {/* Clés croisées */}
    <g fill="#efe4cc" stroke="#1a120b" strokeWidth=".6">
      <g transform="translate(32 40) rotate(40)">
        <rect x="-1.6" y="-11" width="3.2" height="20" rx="1.4" />
        <path d="M-4.5 -14a4.5 4.5 0 1 0 9 0l-2 0 0 2.4-5 0 0-2.4z" />
      </g>
      <g transform="translate(32 40) rotate(-40)">
        <rect x="-1.6" y="-11" width="3.2" height="20" rx="1.4" />
        <path d="M-4.5 -14a4.5 4.5 0 1 0 9 0l-2 0 0 2.4-5 0 0-2.4z" />
      </g>
    </g>
  </svg>
  );
};

export default Embleme;
