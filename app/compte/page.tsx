"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "./compte.css";

const LANGS = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS)[number];

const TXT: Record<
  Lang,
  {
    brand: string;
    portal: string;

    title: string;
    intro: string;

    email: string;
    password: string;
    confirm: string;

    create: string;
    creating: string;

    google: string;
    or: string;

    already: string;
    login: string;

    pwRule: string;
    mismatch: string;

    sent: string;
    generic: string;
    emailUsed: string;
  }
> = {
  fr: {
    brand: "ComptaNet Québec",
    portal: "Portail sécurisé",

    title: "Créer un compte",
    intro: "Créez votre compte pour accéder à votre portail sécurisé.",

    email: "Courriel",
    password: "Mot de passe",
    confirm: "Confirmer le mot de passe",

    create: "Créer mon compte",
    creating: "Création…",

    google: "Continuer avec Google",
    or: "ou",

    already: "Déjà un compte ?",
    login: "Se connecter",

    pwRule: "Minimum 8 caractères.",
    mismatch: "Les mots de passe ne correspondent pas.",

    sent: "Compte créé. Vérifiez vos courriels pour confirmer votre adresse.",
    generic: "Une erreur est survenue. Réessayez.",
    emailUsed: "Ce courriel est déjà utilisé.",
  },
  en: {
    brand: "ComptaNet Québec",
    portal: "Secure portal",

    title: "Create an account",
    intro: "Create your account to access your secure portal.",

    email: "Email",
    password: "Password",
    confirm: "Confirm password",

    create: "Create my account",
    creating: "Creating…",

    google: "Continue with Google",
    or: "or",

    already: "Already have an account?",
    login: "Log in",

    pwRule: "Minimum 8 characters.",
    mismatch: "Passwords do not match.",

    sent: "Account created. Please check your email to confirm.",
    generic: "Something went wrong. Please try again.",
    emailUsed: "This email is already in use.",
  },
  es: {
    brand: "ComptaNet Québec",
    portal: "Portal seguro",

    title: "Crear una cuenta",
    intro: "Crea tu cuenta para acceder a tu portal seguro.",

    email: "Correo electrónico",
    password: "Contraseña",
    confirm: "Confirmar contraseña",

    create: "Crear mi cuenta",
    creating: "Creando…",

    google: "Continuar con Google",
    or: "o",

    already: "¿Ya tienes cuenta?",
    login: "Iniciar sesión",

    pwRule: "Mínimo 8 caracteres.",
    mismatch: "Las contraseñas no coinciden.",

    sent: "Cuenta creada. Revisa tu correo para confirmar.",
    generic: "Ocurrió un error. Inténtalo de nuevo.",
    emailUsed: "Este correo ya está en uso.",
  },
};

function safeLang(v: string | null): Lang {
  const raw = (v || "fr").toLowerCase();
  return (LANGS as readonly string[]).includes(raw) ? (raw as Lang) : "fr";
}

function mapSupabaseError(message: string, t: (typeof TXT)[Lang]): string {
  const m = (message || "").toLowerCase();

  // Email déjà utilisé
  if (m.includes("user already registered") || m.includes("already registered")) {
    return t.emailUsed;
  }

  // Mot de passe faible (selon configs)
  if (m.includes("password") && (m.includes("at least") || m.includes("least 8") || m.includes("should be"))) {
    return t.pwRule;
  }

  return message || t.generic;
}

export default function CompteInner() {
  const router = useRouter();
  const params = useSearchParams();

  const lang = useMemo(() => safeLang(params.get("lang")), [params]);
  const t = TXT[lang];

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const redirecting = useRef(false);

  // Si déjà connecté, redirige (optionnel)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && !redirecting.current) {
        redirecting.current = true;
        router.replace(`/dossiers/nouveau?lang=${lang}`);
      }
    });
  }, [router, lang]);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrMsg(null);
    setOkMsg(null);

    const eaddr = email.trim();
    if (!eaddr) return;

    if (pw.length < 8) {
      setErrMsg(t.pwRule);
      return;
    }
    if (pw !== pw2) {
      setErrMsg(t.mismatch);
      return;
    }

    setLoading(true);

    const { error, data } = await supabase.auth.signUp({
      email: eaddr,
      password: pw,
      options: {
        // Après confirmation email, la personne retombe sur /espace-client
        emailRedirectTo: `${window.location.origin}/espace-client?lang=${lang}`,
      },
    });

    setLoading(false);

    if (error) {
      setErrMsg(mapSupabaseError(error.message, t));
      return;
    }

    // Souvent data.session = null si confirmation requise
    setOkMsg(t.sent);

    // Si session créée tout de suite (selon config), redirige vers dossiers
    if (data.session) {
      router.replace(`/dossiers/nouveau?lang=${lang}`);
    }
  }

  async function handleGoogle() {
    setErrMsg(null);
    setOkMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Après OAuth, tu reviens sur espace-client (qui redirige vers dossiers si connecté)
        redirectTo: `${window.location.origin}/espace-client?lang=${lang}`,
      },
    });

    setLoading(false);
    if (error) setErrMsg(error.message || t.generic);
  }

  function goLogin() {
    router.push(`/espace-client?lang=${lang}`);
  }

  return (
    <main className="signup-bg">
      <div className="signup-card">
        <header className="signup-header">
          <Image src="/logo-cq.png" alt={t.brand} width={42} height={42} />
          <div className="signup-header-text">
            <strong>{t.brand}</strong>
            <span>{t.portal}</span>
          </div>
        </header>

        <h1 className="signup-title">{t.title}</h1>
        <p className="signup-intro">{t.intro}</p>

        <button className="btn-google" onClick={handleGoogle} disabled={loading} type="button">
          <Image src="/google-g.png" alt="Google" width={18} height={18} className="google-icon" />
          {t.google}
        </button>

        <div className="divider">
          <span>{t.or}</span>
        </div>

        <form onSubmit={handleSignup} className="signup-form">
          <label className="label">{t.email}</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@example.com"
            autoComplete="email"
            required
          />

          <label className="label">{t.password}</label>
          <input
            className="input"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
          <p className="rule">{t.pwRule}</p>

          <label className="label">{t.confirm}</label>
          <input
            className="input"
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />

          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? t.creating : t.create}
          </button>
        </form>

        <div className="login-row">
          <span className="login-text">{t.already}</span>
          <button className="btn-link" onClick={goLogin} disabled={loading} type="button">
            {t.login}
          </button>
        </div>

        {errMsg && <div className="message error">{errMsg}</div>}
        {okMsg && <div className="message ok">{okMsg}</div>}
      </div>
    </main>
  );
}
