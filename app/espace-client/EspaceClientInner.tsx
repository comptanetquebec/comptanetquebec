"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "./espace-client.css";

/* ===== LANGUES ===== */
const LANGS = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS)[number];

const TXT: Record<Lang, any> = {
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
  },
};

export default function EspaceClient() {
  const router = useRouter();
  const params = useSearchParams();

  const urlLang = (params.get("lang") || "fr") as Lang;
  const lang: Lang = LANGS.includes(urlLang) ? urlLang : "fr";
  const t = TXT[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirecting = useRef(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && !redirecting.current) {
        redirecting.current = true;
        router.replace(`/dossiers/nouveau?lang=${lang}`);
      }
    });
  }, [router, lang]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) setMsg(t.invalid);
  }

  async function google() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/espace-client?lang=${lang}`,
      },
    });
  }

  async function forgot() {
    if (!email) {
      setMsg(t.needEmail);
      return;
    }
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/espace-client?lang=${lang}`,
    });
    setMsg(t.resetSent);
  }

  return (
    <main className="login-bg">
      <div className="login-card">
        <header className="login-header">
          <Image src="/logo-cq.png" alt="ComptaNet Québec" width={48} height={48} />
          <div>
            <strong>ComptaNet Québec</strong>
            <span>Portail sécurisé</span>
          </div>
        </header>

        <h1>{t.title}</h1>
        <p className="intro">{t.intro}</p>

        <button className="btn-outline" onClick={google}>
          {t.google}
        </button>

        <div className="divider">{t.or}</div>

        <form onSubmit={login}>
          <label>{t.email}</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />

          <label>{t.password}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn-primary" disabled={loading}>
            {loading ? t.loading : t.login}
          </button>
        </form>

        <button className="link" onClick={forgot}>
          {t.forgot}
        </button>

        {msg && <div className="message">{msg}</div>}
      </div>
    </main>
  );
}
