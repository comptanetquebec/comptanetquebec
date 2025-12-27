"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "./espace-client.css";

/* ===== LANGUES ===== */
const LANGS = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS)[number];

type Copy = {
  title: string;
  intro: string;
  email: string;
  emailPh: string;
  password: string;
  passwordPh: string;
  login: string;
  loading: string;
  forgot: string;
  google: string;
  or: string;
  resetSent: string;
  needEmail: string;
  invalid: string;
  generic: string;
};

const TXT: Record<Lang, Copy> = {
  fr: {
    title: "Espace client",
    intro: "Connectez-vous à votre portail sécurisé.",
    email: "Courriel",
    emailPh: "vous@example.com",
    password: "Mot de passe",
    passwordPh: "••••••••",
    login: "Se connecter",
    loading: "Connexion…",
    forgot: "Mot de passe oublié ?",
    google: "Continuer avec Google",
    or: "ou",
    resetSent: "Un courriel de réinitialisation a été envoyé.",
    needEmail: "Veuillez entrer votre courriel.",
    invalid: "Identifiants invalides.",
    generic: "Une erreur est survenue. Réessayez.",
  },
  en: {
    title: "Client Area",
    intro: "Log in to your secure portal.",
    email: "Email",
    emailPh: "you@example.com",
    password: "Password",
    passwordPh: "••••••••",
    login: "Log in",
    loading: "Logging in…",
    forgot: "Forgot password?",
    google: "Continue with Google",
    or: "or",
    resetSent: "A reset email has been sent.",
    needEmail: "Please enter your email.",
    invalid: "Invalid credentials.",
    generic: "Something went wrong. Please try again.",
  },
  es: {
    title: "Área de cliente",
    intro: "Accede a tu portal seguro.",
    email: "Correo electrónico",
    emailPh: "tu@ejemplo.com",
    password: "Contraseña",
    passwordPh: "••••••••",
    login: "Iniciar sesión",
    loading: "Conectando…",
    forgot: "¿Olvidaste tu contraseña?",
    google: "Continuar con Google",
    or: "o",
    resetSent: "Correo de restablecimiento enviado.",
    needEmail: "Introduce tu correo.",
    invalid: "Credenciales inválidas.",
    generic: "Ocurrió un error. Inténtalo de nuevo.",
  },
};

function sanitizeLang(v: string | null): Lang {
  const x = (v || "").toLowerCase();
  return (LANGS as readonly string[]).includes(x) ? (x as Lang) : "fr";
}

function withLang(path: string, lang: Lang) {
  return path.includes("?") ? `${path}&lang=${lang}` : `${path}?lang=${lang}`;
}

function mapAuthError(message: string, t: Copy) {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login credentials")) return t.invalid;
  if (m.includes("invalid_credentials")) return t.invalid;
  return t.generic;
}

export default function EspaceClient() {
  const router = useRouter();
  const params = useSearchParams();

  // ✅ Lang doit suivre la langue de la page (query ?lang=)
  const lang = sanitizeLang(params.get("lang"));
  const t = TXT[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirecting = useRef(false);

  // ✅ Si déjà connecté → redirige vers le portail
  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (data.user && !redirecting.current) {
        redirecting.current = true;
        router.replace(withLang("/dossiers/nouveau", lang));
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const isLogged = !!session?.user;
      if (isLogged && !redirecting.current) {
        redirecting.current = true;
        router.replace(withLang("/dossiers/nouveau", lang));
      }
    });

    return () => {
      mounted = false;
      try {
        sub?.subscription?.unsubscribe?.();
      } catch {
        /* ignore */
      }
    };
  }, [router, lang]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (error) setMsg(mapAuthError(error.message, t));
  }

  async function google() {
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/espace-client?lang=${lang}`,
      },
    });

    setLoading(false);
    if (error) setMsg(mapAuthError(error.message, t));
  }

  async function forgot() {
    setMsg(null);

    const eaddr = email.trim();
    if (!eaddr) {
      setMsg(t.needEmail);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(eaddr, {
      redirectTo: `${window.location.origin}/espace-client?lang=${lang}`,
    });
    setLoading(false);

    if (error) setMsg(mapAuthError(error.message, t));
    else setMsg(t.resetSent);
  }

  return (
    <main className="login-bg">
      <div className="login-card">
        <header className="login-header">
          <Image
            src="/logo-cq.png"
            alt="ComptaNet Québec"
            width={44}
            height={44}
            priority
          />
          <div className="login-header-text">
            <strong>ComptaNet Québec</strong>
            <span>Portail sécurisé</span>
          </div>
        </header>

        <h1 className="login-title">{t.title}</h1>
        <p className="intro">{t.intro}</p>

        {/* ✅ Bouton Google avec G officiel */}
        <button
          className="btn-google"
          onClick={google}
          type="button"
          disabled={loading}
        >
          <img
            src="/google-g.png"
            alt="Google"
            className="google-icon"
            width={18}
            height={18}
          />
          <span>{t.google}</span>
        </button>

        <div className="divider">
          <span>{t.or}</span>
        </div>

        <form onSubmit={login} className="login-form">
          <label className="label">{t.email}</label>
          <input
            className="input"
            type="email"
            value={email}
            placeholder={t.emailPh}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label className="label">{t.password}</label>
          <input
            className="input"
            type="password"
            value={password}
            placeholder={t.passwordPh}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? t.loading : t.login}
          </button>
        </form>

        <button className="link" onClick={forgot} type="button" disabled={loading}>
          {t.forgot}
        </button>

        {msg && <div className="message">{msg}</div>}
      </div>
    </main>
  );
}
