import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Embleme from './Embleme';
import Chargement from './Chargement';
import { supabase } from '../lib/supabase';

// Application privée : tant que personne n'est connecté, seul le formulaire est affiché.
// Les comptes sont créés sur le serveur (inscriptions fermées).
const Connexion: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_evenement, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const seConnecter = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
    if (error) setErreur(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : error.message);
    setEnvoi(false);
  };

  if (session === undefined) {
    return <div className="min-h-screen flex items-center justify-center"><Chargement /></div>;
  }
  if (session) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={seConnecter} className="panneau w-full max-w-sm rounded-xl px-7 pt-8 pb-9 space-y-5">
        <div className="flex flex-col items-center text-center mb-2">
          <Embleme taille={96} className="drop-shadow-[0_6px_12px_rgba(0,0,0,0.7)] mb-4" />
          <h1 className="font-display text-3xl text-primary" style={{ textShadow: '0 2px 0 #000' }}>Carnets d'entretien</h1>
          <p className="font-titre uppercase tracking-[0.3em] text-xs text-light/60 mt-2">Atelier · accès réservé</p>
        </div>
        <label className="block">
          <span className="font-titre uppercase tracking-wider text-xs text-primary/90">Email</span>
          <input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)}
            className="input mt-1 w-full" />
        </label>
        <label className="block">
          <span className="font-titre uppercase tracking-wider text-xs text-primary/90">Mot de passe</span>
          <input type="password" required autoComplete="current-password" value={motDePasse} onChange={e => setMotDePasse(e.target.value)}
            className="input mt-1 w-full" />
        </label>
        {erreur && <p className="text-rouille text-sm">{erreur}</p>}
        <button type="submit" disabled={envoi}
          className="w-full bg-primary px-4 py-2.5 rounded-md disabled:opacity-60">
          {envoi ? 'Ouverture…' : 'Entrer au garage'}
        </button>
      </form>
    </div>
  );
};

export default Connexion;
