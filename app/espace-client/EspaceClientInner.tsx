"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/** Langues supportées */
const LANGS = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS)[number];

const I18N: Record<
  Lang,
  {
    title: string;
    intro: string;
    email: string;
    password: string;
    show: string;
    hide: string;
    login: string;
    logging: string;
    forgot: string;
    resetSent: string;
    resetNeedEmail: string;
    or: string;
    withGoogle: string;
    badRedirect: string;
    invalidCreds: string;
    emailNotConfirmed: string;
    rateLimit: string;
  }
> = {
  fr: {
    title: "Espace client",
    intro: "Connectez-vous avec votre e-mail et votre mot de passe.",
    email: "Courriel",
    password: "Mot de passe",
    show: "Voir",
    hide: "Cacher",
    login: "Se connecter",
    logging: "Connexion…",
    forgot: "Mot de passe oublié ?",
    resetSent: "Un e-mail de réinitialisation vient d’être envoyé.",
    resetNeedEmail: "Entrez votre courriel pour recevoir le lien.",
    or: "ou",
    withGoogle: "Continuer avec Google",
    badRedirect: "Redirection non valide. Utilisation du chemin par défaut.",
    invalidCreds: "Identifiants invalides.",
    emailNotConfirmed: "Courriel non confirmé.",
    rateLimit: "Trop de tentatives. Réessayez plus tard.",
  },
  en: {
    title: "Client area",
    intro: "Log in with your email and password.",
    email: "Email",
    password: "Password",
    show: "Show",
    hide: "Hide",
    login: "Log in",
    logging: "Logging in…",
    forgot: "Forgot password?",
    resetSent: "A reset email has been sent.",
    resetNeedEmail: "Enter your email to receive the link.",
    or: "or",
    withGoogle: "Continue with Google",
    badRedirect: "Invalid redirect. Using default path.",
    invalidCreds: "Invalid credentials.",
    emailNotConfirmed: "Email not confirmed.",
    rateLimit: "Too many attempts. Try again later.",
  },
  es: {
    title: "Área de cliente",
    intro: "Inicia sesión con tu correo y contraseña.",
    email: "Correo electrónico",
    password: "Contraseña",
    show: "Ver",
    hide: "Ocultar",
    login: "Iniciar sesión",
    logging: "Conectando…",
    forgot: "¿Olvidaste tu contraseña?",
    resetSent: "Se ha enviado un correo de restablecimiento.",
    resetNeedEmail: "Introduce tu correo para recibir el enlace.",
    or: "o",
    withGoogle: "Continuar con Google",
    badRedirect: "Redirección no válida. Usando la ruta por defecto.",
    invalidCreds: "Credenciales inválidas.",
    emailNotConfirmed: "Correo no confirmado.",
    rateLimit: "Demasiados intentos. Inténtalo más tarde.",
  },
};

export default function EspaceClientInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ Lang vient de l’URL (lang=fr|en|es), sinon FR par défaut
  const urlLang = (searchParams.get("lang") || "").toLowerCase();
  const lang: Lang = (LANGS as readonly string[]).includes(urlLang)
    ? (urlLang as Lang)
    : "fr";
  const t = I18N[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);

  // ✅ next sécurisé + on conserve la langue dans l’URL si on redirige
  const redirectingRef = useRef(false);
  const nextRaw = searchParams.get("next");
  const nextBase = sanitizeNext(nextRaw) || "/dossiers/nouveau";
  const next = withLang(nextBase, lang);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const mail = data.user?.email ?? null;
      setUserEmail(mail);
      if (mail && !redirectingRef.current) {
        redirectingRef.current = true;
        router.replace(next);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const mail = session?.user?.email ?? null;
      setUserEmail(mail);
      if (mail && !redirectingRef.current) {
        redirectingRef.current = true;
        router.replace(next);
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
  }, [router, next]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setInfo(null);
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    if (error) setErrorMsg(mapAuthError(error.message, t));
  }

  async function handleForgot() {
    setLoading(true);
    setInfo(null);
    setErrorMsg(null);

    const eaddr = email.trim();
    if (!eaddr) {
      setLoading(false);
      setErrorMsg(t.resetNeedEmail);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(eaddr, {
      // ✅ retour sur /espace-client avec la même langue
      redirectTo: `${window.location.origin}/espace-client?lang=${lang}`,
    });

    setLoading(false);
    if (error) setErrorMsg(mapAuthError(error.message, t));
    else setInfo(t.resetSent);
  }

  async function handleGoogle() {
    setLoading(true);
    setInfo(null);
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // ✅ retour sur /espace-client avec la même langue
        redirectTo: `${window.location.origin}/espace-client?lang=${lang}`,
      },
    });

    setLoading(false);
    if (error) setErrorMsg(mapAuthError(error.message, t));
  }

  // ✅ si déjà connecté
  if (userEmail) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
          <Header />
          <h1 className="text-2xl font-semibold mt-2">{t.title}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {userEmail} — {t.logging}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <Header />

        <h1 className="text-2xl font-semibold mt-2">{t.title}</h1>
        <p className="mt-2 text-sm text-gray-600">{t.intro}</p>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="mt-6 btn btn-outline w-full"
        >
          {t.withGoogle}
        </button>

        <div className="relative my-5 text-center text-sm text-gray-500">
          <span className="px-2 bg-white relative z-10">{t.or}</span>
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">{t.email}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{t.password}</span>
            <div
              className="mt-1 grid"
              style={{ gridTemplateColumns: "1fr auto" }}
            >
              <input
                type={showPwd ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="rounded-l-xl border px-3 py-2 focus:outline-none focus:ring"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="btn btn-outline rounded-r-xl"
                aria-pressed={showPwd}
                aria-label={showPwd ? t.hide : t.show}
              >
                {showPwd ? t.hide : t.show}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? t.logging : t.login}
          </button>

          <button
            type="button"
            onClick={handleForgot}
            className="btn btn-outline w-full"
            disabled={loading}
          >
            {t.forgot}
          </button>

          {errorMsg && (
            <p className="text-sm" style={{ color: "#dc2626" }}>
              {errorMsg}
            </p>
          )}
          {info && (
            <p className="text-sm" style={{ color: "#16a34a" }}>
              {info}
            </p>
          )}
        </form>

        {nextRaw && !sanitizeNext(nextRaw) && (
          <p className="mt-4 text-xs text-amber-600">{t.badRedirect}</p>
        )}
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <Image
          src="/logo-cq.png"
          alt="ComptaNet Québec"
          className="h-10 w-auto"
          width={120}
          height={40}
          priority
        />
        <span className="font-semibold">ComptaNet Québec</span>
      </div>
    </header>
  );
}

/* ---------- Helpers ---------- */

function mapAuthError(message: string, t: (typeof I18N)["fr"]): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return t.invalidCreds;
  if (m.includes("email not confirmed")) return t.emailNotConfirmed;
  if (m.includes("too many requests") || m.includes("rate limit"))
    return t.rateLimit;
  return message;
}

function sanitizeNext(input: string | null): string | null {
  if (!input) return null;
  if (!input.startsWith("/")) return null;
  if (input.startsWith("//") || input.includes("://")) return null;
  return input;
}

function withLang(path: string, lang: Lang): string {
  // Ajoute/force ?lang=... tout en gardant les autres query params
  try {
    const url = new URL(path, "http://x.local");
    url.searchParams.set("lang", lang);
    return url.pathname + url.search;
  } catch {
    // fallback simple
    if (path.includes("?")) return `${path}&lang=${lang}`;
    return `${path}?lang=${lang}`;
  }
}
