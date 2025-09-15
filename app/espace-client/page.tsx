'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Mode = 'login' | 'signup';

export default function EspaceClient() {
  const router = useRouter();

  // Champs de formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Utilisateur connecté ?
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Au montage: récupérer l'utilisateur et écouter les changements d'auth
  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const mail = data.user?.email ?? null;
      setUserEmail(mail);
      if (mail) router.replace('/formulaire'); // déjà connecté -> rediriger
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const mail = session?.user?.email ?? null;
      setUserEmail(mail);
      if (mail) router.replace('/formulaire'); // connexion réussie -> rediriger
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // Connexion
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInfo(null);
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErrorMsg(error.message);
    // En succès, l'écouteur onAuthStateChange fera la redirection
  };

  // Inscription
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInfo(null);
    setErrorMsg(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // (facultatif) si vous exigez confirmation par e-mail :
        emailRedirectTo: `${window.location.origin}/espace-client`,
      },
    });
    setLoading(false);
    if (error) setErrorMsg(error.message);
    else {
      setInfo("Compte créé. S'il faut confirmer votre e-mail, vérifiez votre boîte de réception.");
      setMode('login');
    }
  };

  // Mot de passe oublié
  const handleForgot = async () => {
    setLoading(true);
    setInfo(null);
    setErrorMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/espace-client`,
    });
    setLoading(false);
    if (error) setErrorMsg(error.message);
    else setInfo('Un e-mail de réinitialisation vient d’être envoyé.');
  };

  // Déconnexion (au cas où on affiche la page alors qu’on est loggé)
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    setEmail('');
    setPassword('');
    setMode('login');
  };

  // Si on détecte un utilisateur connecté, on peut montrer un petit écran intermédiaire
  if (userEmail) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-2">Espace client</h1>
        <p className="text-slate-600 mb-6">
          Connecté en tant que <strong>{userEmail}</strong>. Redirection en cours…
        </p>
        <button
          onClick={handleLogout}
          className="text-sm text-slate-600 underline"
        >
          Déconnexion
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Espace client</h1>
      <p className="text-slate-600 mb-6">
        {mode === 'login'
          ? 'Connectez-vous avec votre e-mail et votre mot de passe.'
          : 'Créez votre compte pour accéder à votre espace sécurisé.'}
      </p>

      <form
        onSubmit={mode === 'login' ? handleLogin : handleSignup}
        className="rounded-lg border bg-white p-6 grid gap-4"
      >
        <div className="grid gap-2">
          <label className="text-sm text-slate-700">Courriel</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@example.com"
            className="border rounded-md px-3 py-2"
            autoComplete="email"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-slate-700">Mot de passe</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="border rounded-md px-3 py-2"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md px-4 py-2 disabled:opacity-60"
        >
          {loading
            ? (mode === 'login' ? 'Connexion…' : 'Création…')
            : (mode === 'login' ? 'Se connecter' : 'Créer mon compte')}
        </button>

        {mode === 'login' && (
          <button
            type="button"
            onClick={handleForgot}
            className="text-sm text-blue-700 hover:underline justify-self-start"
            disabled={loading || !email}
            title={!email ? 'Entrez votre e-mail pour recevoir le lien' : ''}
          >
            Mot de passe oublié ?
          </button>
        )}

        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}
        {info && <p className="text-green-700 text-sm">{info}</p>}
      </form>

      <div className="mt-4 text-sm text-slate-700">
        {mode === 'login' ? (
          <>
            Pas de compte ?{' '}
            <button
              className="text-blue-700 hover:underline"
              onClick={() => {
                setMode('signup');
                setInfo(null);
                setErrorMsg(null);
              }}
            >
              Créer un compte
            </button>
          </>
        ) : (
          <>
            Déjà inscrit ?{' '}
            <button
              className="text-blue-700 hover:underline"
              onClick={() => {
                setMode('login');
                setInfo(null);
                setErrorMsg(null);
              }}
            >
              Se connecter
            </button>
          </>
        )}
      </div>
    </main>
  );
}
