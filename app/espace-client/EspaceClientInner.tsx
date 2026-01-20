"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    brandSub: string;
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
    emailPh: string;
  }
> = {
  fr: {
    brandSub: "Portail sécurisé",
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
    emailPh: "vous@example.com",
  },
  en: {
    brandSub: "Secure portal",
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
    emailPh: "you@example.com",
  },
  es: {
    brandSub: "Portal seguro",
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
    emailPh: "tu@ejemplo.com",
  },
};

function normalizeLang(v?: string | null): Lang {
  const x = (v || "fr").toLowerCase();
  return (LANGS as readonly string[]).includes(x as any) ? (x as Lang) : "fr";
}

function safeNext(v?: string | null): string {
  // sécurité: on accepte seulement un chemin interne
  const raw = (v || "").trim();
  if (!raw) return "/dossiers/nouveau";

  // bloque les URLs externes ou protocoles
  const lower = raw.toLowerCase();
  if (lower.startsWith("http:") || lower.startsWith("https:")) return "/dossiers/nouveau";
  if (lower.startsWith("javascript:")) return "/dossiers/nouveau";

  if (!raw.startsWith("/")) return "/dossiers/nouveau";
  if (raw.startsWith("//")) return "/dossiers/nouveau";

  return raw;
}

function withLang(href: string, lang: Lang): string {
  try {
    const u = new URL(href, "http://dummy.local");
    u.searchParams.set("lang", lang);
    return u.pathname + u.search;
  } catch {
    const sep = href.includes("?") ? "&" : "?";
    return `${href}${sep}lang=${lang}`;
  }
}

export default function EspaceClientInner() {
  const router = useRouter();
  const params = useSearchParams();

  const lang = useMemo(() => normalizeLang(params.get("lang")), [params]);
  const t = TXT[lang];

  const nextRaw = params.get("next"); // string | null
  const next = useMemo(() => safeNext(nextRaw), [nextRaw]);

  // destination finale (lang forcé)
  const nextWithLang = useMemo(() => withLang(next, lang), [next, lang]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // anti double redirect
  const redirecting = useRef(false);

  // ✅ si déjà connecté -> redirige immédiatement vers next
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;

      if (data.user && !redirecting.current) {
        redirecting.current = true;
        router.replace(nextWithLang);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, nextWithLang]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setMsg(t.invalid);
      return;
    }

    if (!redirecting.current) {
      redirecting.current = true;
      router.replace(nextWithLang);
    }
  }

  async function google() {
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // ✅ on revient sur /espace-client avec lang + next (puis getUser() redirect vers nextWithLang)
        redirectTo: `${window.location.origin}/espace-client?lang=${lang}&next=${encodeURIComponent(next)}`,
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
      // ✅ on garde lang + next
      redirectTo: `${window.location.origin}/espace-client?lang=${lang}&next=${encodeURIComponent(next)}`,
    });
    setLoading(false);

    if (error) setMsg(error.message);
    else setMsg(t.resetSent);
  }

  function goCreateAccount() {
    router.push(`/compte?lang=${lang}&next=${encodeURIComponent(next)}`);
  }

  return (
    <main className="login-bg">
      <div className="login-card">
        <header className="login-header">
          <Image src="/logo-cq.png" alt="ComptaNet Québec" width={42} height={42} priority />
          <div className="login-header-text">
            <strong>ComptaNet Québec</strong>
            <span>{t.brandSub}</span>
          </div>
        </header>

        <h1 className="login-title">{t.title}</h1>
        <p className="intro">{t.intro}</p>

        <button className="btn-google" onClick={google} disabled={loading} type="button">
          <Image src="/google-g.png" alt="Google" width={18} height={18} className="google-icon" priority />
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
            placeholder={t.emailPh}
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

        <div className="signup-row">
          <span className="signup-text">{t.noAccount}</span>
          <button className="signup-link" onClick={goCreateAccount} disabled={loading} type="button">
            {t.createAccount}
          </button>
        </div>

        {msg && <div className="message">{msg}</div>}
      </div>
    </main>
  );
}
