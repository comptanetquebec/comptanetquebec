"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Mode = "login" | "signup";

export default function EspaceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Champs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  // Session
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Évite les doubles redirections si l’event d’auth arrive 2x
  const redirectingRef = useRef(false);

  // Où rediriger après succès (par défaut /formulaire)
  const next = searchParams.get("next") || "/formulaire";

  useEffect(() => {
    let mounted = true;

    // 1) Récupérer la session au montage
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      const mail = data.user?.email ?? null;
      setUserEmail(mail);
      if (mail && !redirectingRef.current) {
        redirectingRef.current = true;
        router.replace(next);
      }
      if (error) {
        // silencieux, on laisse l’utilisateur se connecter
        console.warn("getUser error:", error.message);
      }
    });

    // 2) Écouter les changements d’auth
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const mail = session?.user?.email ?? null;
      setUserEmail(mail);
      if (mail && !redirectingRef.current) {
        redirectingRef.current = true;
        router.replace(next);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router, next]);

  // Connexion
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setInfo(null);
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (error) {
      setErrorMsg(mapAuthError(error.message));
    }
    // En succès, onAuthStateChange s’occupe de rediriger
  }

  // Inscription
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setInfo(null);
    setErrorMsg(null);

    // Validation rapide côté UI
    if (password.length < 8) {
      setLoading(false);
      setErrorMsg("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    const { error, data } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // Si, dans Supabase Auth → Email, “Confirm email” est ON :
      // l’utilisateur devra confirmer. Sinon, la session est créée directement.
      options: {
        emailRedirectTo: `${window.location.origin}/espace-client`,
      },
    });

    setLoading(false);

    if (error) {
      setErrorMsg(mapAuthError(error.message));
    } else {
      // Si confirmation requise, pas de session immédiate
      if (!data.session) {
        setInfo(
          "Compte créé. Vérifiez votre boîte de réception pour confirmer votre courriel."
        );
        setMode("login");
      } else {
        // Si pas de confirmation requise, la session existe déjà → redirection via onAuthStateChange
        setInfo("Compte créé !");
      }
    }
  }

  // Mot de passe oublié
  async function handleForgot() {
    setLoading(true);
    setInfo(null);
    setErrorMsg(null);

    const e = email.trim();
    if (!e) {
      setLoading(false);
      setErrorMsg("Entrez votre courriel pour recevoir le lien de réinitialisation.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(e, {
      redirectTo: `${window.location.origin}/espace-client`,
    });

    setLoading(false);
    if (error) setErrorMsg(mapAuthError(error.message));
    else setInfo("Un e-mail de réinitialisation vient d’être envoyé.");
  }

  // Déconnexion (si jamais on voit l’écran connecté)
  async function handleLogout() {
    await supabase.auth.signOut();
    setUserEmail(null);
    setEmail("");
    setPassword("");
    setMode("login");
    redirectingRef.current = false;
  }

  // Écran intermédiaire si déjà connecté
  if (userEmail) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-2">Espace client</h1>
        <p className="text-slate-600 mb-6">
          Connecté en tant que <strong>{userEmail}</strong>. Redirection en cours…
        </p>
        <button onClick={handleLogout} className="text-sm text-slate-600 underline">
          Déconnexion
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Espace client</h1>
      <p className="text-slate-600 mb-6">
        {mode === "login"
          ? "Connectez-vous avec votre e-mail et votre mot de passe."
          : "Créez votre compte pour accéder à votre espace sécurisé."}
      </p>

      <form
        onSubmit={mode === "login" ? handleLogin : handleSignup}
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
            inputMode="email"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-slate-700">Mot de passe</label>
          <div className="flex items-stretch gap-2">
            <input
              type={showPwd ? "text" : "password"}
              required
              minLength={mode === "signup" ? 8 : 1}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border rounded-md px-3 py-2 w-full"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="px-3 border rounded-md text-sm"
              aria-pressed={showPwd}
            >
              {showPwd ? "Cacher" : "Voir"}
            </button>
          </div>
          {mode === "signup" && (
            <p className="text-xs text-slate-500">
              Au moins 8 caractères (tu peux activer “Prevent leaked passwords” dans Supabase pour plus de sécurité).
            </p>
          )}
        </div>
