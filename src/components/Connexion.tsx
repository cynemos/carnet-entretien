import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Car } from 'lucide-react';
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
    return <div className="min-h-screen bg-dark text-light flex items-center justify-center">Chargement…</div>;
  }
  if (session) return <>{children}</>;

  return (
    <div className="min-h-screen bg-dark text-light flex items-center justify-center p-4">
      <form onSubmit={seConnecter} className="w-full max-w-sm bg-secondary rounded-lg shadow-lg p-6 border border-primary/30 space-y-4">
        <div className="flex items-center mb-2">
          <Car size={32} color="#FF4500" className="mr-2" />
          <h1 className="text-xl font-bold text-primary">Carnets d'entretien</h1>
        </div>
        <label className="block">
          <span className="text-sm text-gray-300">Email</span>
          <input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)}
            className="mt-1 w-full p-2 rounded bg-dark border border-gray-600 text-light focus:outline-none focus:border-primary" />
        </label>
        <label className="block">
          <span className="text-sm text-gray-300">Mot de passe</span>
          <input type="password" required autoComplete="current-password" value={motDePasse} onChange={e => setMotDePasse(e.target.value)}
            className="mt-1 w-full p-2 rounded bg-dark border border-gray-600 text-light focus:outline-none focus:border-primary" />
        </label>
        {erreur && <p className="text-red-500 text-sm">{erreur}</p>}
        <button type="submit" disabled={envoi}
          className="w-full bg-primary text-secondary font-semibold px-4 py-2 rounded-md hover:bg-orange-600 transition-colors duration-200 disabled:opacity-60">
          {envoi ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
};

export default Connexion;
