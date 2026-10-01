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

    showPassword: string;
    hidePassword: string;
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

    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
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

    showPassword: "Show password",
    hidePassword: "Hide password",
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

    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
  },
};

function safeLang(v: string | null): Lang {
  const raw = (v || "fr").toLowerCase();

  return (LANGS as readonly string[]).includes(raw)
    ? (raw as Lang)
    : "fr";
}

function mapSupabaseError(
  message: string,
  t: (typeof TXT)[Lang]
): string {
  const m = (message || "").toLowerCase();

  if (
    m.includes("user already registered") ||
    m.includes("already registered")
  ) {
    return t.emailUsed;
  }

  if (
    m.includes("password") &&
    (
      m.includes("at least") ||
      m.includes("least 8") ||
      m.includes("should be")
    )
  ) {
    return t.pwRule;
  }

  return message || t.generic;
}

export default function CompteInner() {
  const router = useRouter();
  const params = useSearchParams();

  const lang = useMemo(
    () => safeLang(params.get("lang")),
    [params]
  );

  const t = TXT[lang];

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const redirecting = useRef(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (
        data.user &&
        !redirecting.current
      ) {
        redirecting.current = true;

        router.replace(
          `/dossiers/nouveau?lang=${lang}`
        );
      }
    });
  }, [router, lang]);

  async function handleSignup(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setErrMsg(null);
    setOkMsg(null);

    const eaddr = email.trim();

    if (!eaddr) {
      return;
    }

    if (pw.length < 8) {
      setErrMsg(t.pwRule);
      return;
    }

    if (pw !== pw2) {
      setErrMsg(t.mismatch);
      return;
    }

    setLoading(true);

    const { error, data } =
      await supabase.auth.signUp({
        email: eaddr,
        password: pw,

        options: {
          emailRedirectTo:
            `${window.location.origin}` +
            `/espace-client?lang=${lang}`,
        },
      });

    setLoading(false);

    if (error) {
      setErrMsg(
        mapSupabaseError(
          error.message,
          t
        )
      );

      return;
    }

    setOkMsg(t.sent);

    if (data.session) {
      router.replace(
        `/dossiers/nouveau?lang=${lang}`
      );
    }
  }

  async function handleGoogle() {
    setErrMsg(null);
    setOkMsg(null);
    setLoading(true);

    const { error } =
      await supabase.auth.signInWithOAuth({
        provider: "google",

        options: {
          redirectTo:
            `${window.location.origin}` +
            `/espace-client?lang=${lang}`,
        },
      });

    setLoading(false);

    if (error) {
      setErrMsg(
        error.message || t.generic
      );
    }
  }

  function goLogin() {
    router.push(
      `/espace-client?lang=${lang}`
    );
  }

  return (
    <main className="signup-bg">
      <div className="signup-card">
        <header className="signup-header">
          <Image
            src="/logo-cq.png"
            alt={t.brand}
            width={42}
            height={42}
          />

          <div className="signup-header-text">
            <strong>{t.brand}</strong>
            <span>{t.portal}</span>
          </div>
        </header>

        <h1 className="signup-title">
          {t.title}
        </h1>

        <p className="signup-intro">
          {t.intro}
        </p>

        <button
          className="btn-google"
          onClick={handleGoogle}
          disabled={loading}
          type="button"
        >
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

        <form
          onSubmit={handleSignup}
          className="signup-form"
        >
          <label className="label">
            {t.email}
          </label>

          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="vous@example.com"
            autoComplete="email"
            required
          />

          <label className="label">
            {t.password}
          </label>

          <div style={passwordWrapperStyle}>
            <input
              className="input"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={pw}
              onChange={(e) =>
                setPw(e.target.value)
              }
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={8}
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

          <p className="rule">
            {t.pwRule}
          </p>

          <label className="label">
            {t.confirm}
          </label>

          <div style={passwordWrapperStyle}>
            <input
              className="input"
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              value={pw2}
              onChange={(e) =>
                setPw2(e.target.value)
              }
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={8}
              required
              style={{
                paddingRight: "52px",
              }}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(
                  (value) => !value
                )
              }
              aria-label={
                showConfirmPassword
                  ? t.hidePassword
                  : t.showPassword
              }
              title={
                showConfirmPassword
                  ? t.hidePassword
                  : t.showPassword
              }
              style={eyeButtonStyle}
            >
              <EyeIcon
                open={showConfirmPassword}
              />
            </button>
          </div>

          <button
            className="btn-primary"
            disabled={loading}
            type="submit"
          >
            {loading
              ? t.creating
              : t.create}
          </button>
        </form>

        <div className="login-row">
          <span className="login-text">
            {t.already}
          </span>

          <button
            className="btn-link"
            onClick={goLogin}
            disabled={loading}
            type="button"
          >
            {t.login}
          </button>
        </div>

        {errMsg && (
          <div className="message error">
            {errMsg}
          </div>
        )}

        {okMsg && (
          <div className="message ok">
            {okMsg}
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

const passwordWrapperStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
};

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
