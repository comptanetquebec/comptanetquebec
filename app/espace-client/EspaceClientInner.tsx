"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "./espace-client.css";

/* ===== LANGUES ===== */
const LANGS = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS)[number];

const TXT: Record<
  Lang,
  {
    title: string;
    intro: string;
    email: string;
    password: string;
    login: string;
    loading: string;
    forgot: string;
    google: string;
    or: string;
    resetSent: string;
    needEmail: string;
    invalid: string;
    noAccount: string;
    createAccount: string;
  }
> = {
  fr: {
    title: "Espace client",
    intro: "Connectez-vous à votre portail sécurisé.",
    email: "Courriel",
    password: "Mot de passe",
    login: "Se connecter",
    loading: "Connexion…",
    forgot: "Mot de passe oublié ?",
    google: "Continuer avec Google",
    or: "ou",
    resetSent: "Un courriel de réinitialisation a été envoyé.",
    needEmail: "Veuillez entrer votre courriel.",
    invalid: "Identifiants invalides.",
    noAccount: "Pas encore de compte ?",
    createAccount: "Créer un compte",
  },
  en: {
    title: "Client Area",
    intro: "Log in to your secure portal.",
    email: "Email",
    password: "Password",
    login: "Log in",
    loading: "Logging in…",
    forgot: "Forgot password?",
    google: "Continue with Google",
    or: "or",
    resetSent: "A reset email has been sent.",
    needEmail: "Please enter your email.",
    invalid: "Invalid credentials.",
    noAccount: "No account yet?",
    createAccount: "Create an account",
  },
  es: {
    title: "Área de cliente",
    intro: "Accede a tu portal seguro.",
    email: "Correo electrónico",
    password: "Contraseña",
    login: "Iniciar sesión",
    loading: "Conectando…",
    forgot: "¿Olvidaste tu contraseña?",
    google: "Continuar con Google",
    or: "o",
    resetSent: "Correo de restablecimiento enviado.",
    needEmail: "Introduce tu correo.",
    invalid: "Credenciales inválidas.",
    noAccount: "¿Aún no tienes cuenta?",
    createAccount: "Crear una cuenta",
  },
};

export default function EspaceClientInner() {
  const router = useRouter();
  const params = useSearchParams();

  const urlLangRaw = (params.get("lang") || "fr").toLowerCase();
  const lang: Lang = (LANGS as readonly string[]).includes(urlLangRaw)
    ? (urlLangRaw as Lang)
    : "fr";
  const t = TXT[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirecting = useRef(false);

  // où envoyer après connexion (tu peux changer si tu veux)
  const next = `/dossiers/nouveau?lang=${lang}`;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && !redirecting.current) {
        redirecting.current = true;
        router.replace(next);
      }
    });
  }, [router, next]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (error) setMsg(t.invalid);
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
    if (error) setMsg(error.message);
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

    if (error) setMsg(error.message);
    else setMsg(t.resetSent);
  }

  function goCreateAccount() {
    router.push(`/compte?lang=${lang}`);
  }

  return (
    <main className="login-bg">
      <div className="login-card">
        <header className="login-header">
          <Image src="/logo-cq.png" alt="ComptaNet Québec" width={42} height={42} />
          <div className="login-header-text">
            <strong>ComptaNet Québec</strong>
            <span>Portail sécurisé</span>
          </div>
        </header>

        <h1 className="login-title">{t.title}</h1>
        <p className="intro">{t.intro}</p>

        <button className="btn-google" onClick={google} disabled={loading} type="button">
          <Image
            src="/google-g.png"
            alt="Google"
            width={18}
            height={18}
            className="google-icon"
          />
          {t.google}
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
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@example.com"
            autoComplete="email"
            required
          />

          <label className="label">{t.password}</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? t.loading : t.login}
          </button>
        </form>

        <button className="link" onClick={forgot} disabled={loading} type="button">
          {t.forgot}
        </button>

        {/* ✅ IMPORTANT : chemin “pas de compte” */}
        <div className="signup-row">
          <span className="signup-text">{t.noAccount}</span>
          <button className="btn-create" onClick={goCreateAccount} disabled={loading} type="button">
            {t.createAccount}
          </button>
        </div>

        {msg && <div className="message">{msg}</div>}
      </div>
    </main>
  );
}
