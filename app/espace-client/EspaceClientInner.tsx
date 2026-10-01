"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "./espace-client.css";

/* ===== LANGUES ===== */

const LANGS = ["fr", "en", "es"] as const;

type Lang = (typeof LANGS)[number];

type Txt = {
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
  showPassword: string;
  hidePassword: string;
};

const TXT: Record<Lang, Txt> = {
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
    resetSent:
      "Un courriel de réinitialisation a été envoyé. Vérifiez votre boîte de réception.",
    needEmail: "Veuillez entrer votre courriel.",
    invalid: "Courriel ou mot de passe invalide.",
    noAccount: "Pas encore de compte ?",
    createAccount: "Créer un compte",
    emailPh: "vous@example.com",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
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
    resetSent:
      "A password reset email has been sent. Check your inbox.",
    needEmail: "Please enter your email.",
    invalid: "Invalid email or password.",
    noAccount: "No account yet?",
    createAccount: "Create an account",
    emailPh: "you@example.com",
    showPassword: "Show password",
    hidePassword: "Hide password",
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
    resetSent:
      "Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.",
    needEmail: "Introduce tu correo.",
    invalid: "Correo o contraseña inválidos.",
    noAccount: "¿Aún no tienes cuenta?",
    createAccount: "Crear una cuenta",
    emailPh: "tu@ejemplo.com",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
  },
};

function isLang(v: string): v is Lang {
  return (LANGS as readonly string[]).includes(v);
}

function normalizeLang(v?: string | null): Lang {
  const x = (v || "fr").toLowerCase();

  return isLang(x) ? x : "fr";
}

/*
 * Sécurité :
 * seulement les chemins internes peuvent être utilisés
 * comme destination après connexion.
 */

function safeNext(v?: string | null): string {
  const raw = (v || "").trim();

  if (!raw) {
    return "/dossiers";
  }

  const lower = raw.toLowerCase();

  if (
    lower.startsWith("http:") ||
    lower.startsWith("https:") ||
    lower.startsWith("javascript:")
  ) {
    return "/dossiers";
  }

  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return "/dossiers";
  }

  return raw;
}

/*
 * Ajoute la langue à l'URL cible
 * en conservant les paramètres existants.
 */

function withLang(href: string, lang: Lang): string {
  try {
    const url = new URL(href, "http://dummy.local");

    url.searchParams.set("lang", lang);

    return url.pathname + url.search;
  } catch {
    const separator = href.includes("?") ? "&" : "?";

    return `${href}${separator}lang=${lang}`;
  }
}

export default function EspaceClientInner() {
  const router = useRouter();
  const params = useSearchParams();

  const lang = useMemo(
    () => normalizeLang(params.get("lang")),
    [params]
  );

  const t = TXT[lang];

  const nextRaw = params.get("next");

  const next = useMemo(
    () => safeNext(nextRaw),
    [nextRaw]
  );

  const nextWithLang = useMemo(
    () => withLang(next, lang),
    [next, lang]
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [msg, setMsg] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const redirecting = useRef(false);

  /*
   * Si l'utilisateur est déjà connecté,
   * on l'envoie directement vers sa destination.
   */

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } =
        await supabase.auth.getUser();

      if (!alive) {
        return;
      }

      if (
        data.user &&
        !redirecting.current
      ) {
        redirecting.current = true;

        router.replace(nextWithLang);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, nextWithLang]);

  /*
   * Connexion courriel + mot de passe
   */

  async function login(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMsg(null);
    setLoading(true);

    const { error } =
      await supabase.auth.signInWithPassword({
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

  /*
   * Connexion Google
   */

  async function google() {
    setMsg(null);
    setLoading(true);

    const { error } =
      await supabase.auth.signInWithOAuth({
        provider: "google",

        options: {
          redirectTo:
            `${window.location.origin}` +
            `/espace-client` +
            `?lang=${lang}` +
            `&next=${encodeURIComponent(next)}`,
        },
      });

    if (error) {
      setMsg(error.message);
      setLoading(false);
    }
  }

  /*
   * Mot de passe oublié
   */

  async function forgot() {
    setMsg(null);

    const emailAddress = email.trim();

    if (!emailAddress) {
      setMsg(t.needEmail);
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        emailAddress,
        {
          redirectTo:
            `${window.location.origin}` +
            `/nouveau-mot-de-passe` +
            `?lang=${lang}`,
        }
      );

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg(t.resetSent);
  }

  /*
   * Création de compte
   */

  function goCreateAccount() {
    router.push(
      `/compte` +
        `?lang=${lang}` +
        `&next=${encodeURIComponent(next)}`
    );
  }

  return (
    <main className="login-bg">
      <div className="login-card">

        <header className="login-header">
          <Image
            src="/logo-cq.png"
            alt="ComptaNet Québec"
            width={42}
            height={42}
            priority
          />

          <div className="login-header-text">
            <strong>ComptaNet Québec</strong>
            <span>{t.brandSub}</span>
          </div>
        </header>

        <h1 className="login-title">
          {t.title}
        </h1>

        <p className="intro">
          {t.intro}
        </p>

        {/* GOOGLE */}

        <button
          className="btn-google"
          onClick={google}
          disabled={loading}
          type="button"
        >
          <Image
            src="/google-logo.png"
            alt=""
            aria-hidden="true"
            width={20}
            height={20}
            className="google-icon"
          />

          {t.google}
        </button>

        <div className="divider">
          <span>{t.or}</span>
        </div>

        {/* CONNEXION */}

        <form
          onSubmit={login}
          className="login-form"
        >
          <label className="label">
            {t.email}
          </label>

          <input
            className="input"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder={t.emailPh}
            autoComplete="email"
            required
          />

          <label className="label">
            {t.password}
          </label>

          <div
            style={{
              position: "relative",
              width: "100%",
            }}
          >
            <input
              className="input"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="••••••••"
              autoComplete="current-password"
              required
              style={{
                paddingRight: "52px",
              }}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (value) => !value
                )
              }
              aria-label={
                showPassword
                  ? t.hidePassword
                  : t.showPassword
              }
              title={
                showPassword
                  ? t.hidePassword
                  : t.showPassword
              }
              style={eyeButtonStyle}
            >
              <EyeIcon
                open={showPassword}
              />
            </button>
          </div>

          <button
            className="btn-primary"
            disabled={loading}
            type="submit"
          >
            {loading
              ? t.loading
              : t.login}
          </button>
        </form>

        {/* MOT DE PASSE OUBLIÉ */}

        <button
          className="link"
          onClick={forgot}
          disabled={loading}
          type="button"
        >
          {t.forgot}
        </button>

        {/* CRÉATION DE COMPTE */}

        <div className="signup-row">
          <span className="signup-text">
            {t.noAccount}
          </span>

          <button
            className="signup-link"
            onClick={goCreateAccount}
            disabled={loading}
            type="button"
          >
            {t.createAccount}
          </button>
        </div>

        {/* MESSAGE */}

        {msg && (
          <div className="message">
            {msg}
          </div>
        )}
      </div>
    </main>
  );
}

function EyeIcon({
  open,
}: {
  open: boolean;
}) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {open ? (
        <>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle
            cx="12"
            cy="12"
            r="3"
          />
        </>
      ) : (
        <>
          <path d="M3 3l18 18" />

          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />

          <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a16.3 16.3 0 0 1-2.1 2.9" />

          <path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a10.2 10.2 0 0 0 4.1-.8" />
        </>
      )}
    </svg>
  );
}

const eyeButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  right: "10px",
  transform: "translateY(-50%)",
  width: "36px",
  height: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: "8px",
  background: "transparent",
  color: "#667085",
  cursor: "pointer",
};
