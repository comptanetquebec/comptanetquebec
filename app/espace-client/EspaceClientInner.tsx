"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/** Langues supportées (valeur + type) */
const LANGS = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS)[number];
type Mode = "login" | "signup";
type OAuthProvider = "google";

const I18N: Record<
  Lang,
  {
    title: string;
    intro_login: string;
    intro_signup: string;
    email: string;
    password: string;
    see: string;
    hide: string;
    login: string;
    signup: string;
    logging: string;
    signing: string;
    forgot: string;
    needAccount: string;
    haveAccount: string;
    createAccount: string;
    signIn: string;
    pwRule: string;
    loggedAs: (m: string) => string;
    resetSent: string;
    resetNeedEmail: string;
    pwTooShort: string;
    emailNotConfirmed: string;
    invalidCreds: string;
    rateLimit: string;
    magic: string;
    magicHint: string;
    or: string;
    with: (p: string) => string;
    accept: string;
    terms: string;
    and: string;
    privacy: string;
    mustAccept: string;
    badRedirect: string;
    pwStrength: string;
    logout: string;
  }
> = {
  fr: {
    title: "Espace client",
    intro_login: "Connectez-vous avec votre e-mail et votre mot de passe.",
    intro_signup: "Créez votre compte pour accéder à votre espace sécurisé.",
    email: "Courriel",
    password: "Mot de passe",
    see: "Voir",
    hide: "Cacher",
    login: "Se connecter",
    signup: "Créer mon compte",
    logging: "Connexion…",
    signing: "Création…",
    forgot: "Mot de passe oublié ?",
    needAccount: "Pas de compte ?",
    haveAccount: "Déjà inscrit ?",
    createAccount: "Créer un compte",
    signIn: "Se connecter",
    pwRule: "Minimum 8 caractères.",
    loggedAs: (m) => `Connecté en tant que ${m}. Redirection en cours…`,
    resetSent: "Un e-mail de réinitialisation vient d’être envoyé.",
    resetNeedEmail: "Entrez votre courriel pour recevoir le lien.",
    pwTooShort: "Le mot de passe doit contenir au moins 8 caractères.",
    emailNotConfirmed: "Courriel non confirmé.",
    invalidCreds: "Identifiants invalides.",
    rateLimit: "Trop de tentatives. Réessayez plus tard.",
    magic: "Recevoir un lien de connexion",
    magicHint:
      "Nous vous enverrons un e-mail contenant un lien magique pour vous connecter.",
    or: "ou",
    with: (p) => `Continuer avec ${p}`,
    accept: "J’accepte",
    terms: "les Conditions d’utilisation",
    and: "et",
    privacy: "la Politique de confidentialité",
    mustAccept: "Vous devez accepter les conditions pour créer un compte.",
    badRedirect: "Redirection non valide. Utilisation du chemin par défaut.",
    pwStrength: "Robustesse du mot de passe",
    logout: "Se déconnecter",
  },
  en: {
    title: "Client area",
    intro_login: "Log in with your email and password.",
    intro_signup: "Create an account to access your secure area.",
    email: "Email",
    password: "Password",
    see: "Show",
    hide: "Hide",
    login: "Log in",
    signup: "Sign up",
    logging: "Logging in…",
    signing: "Signing up…",
    forgot: "Forgot password?",
    needAccount: "No account?",
    haveAccount: "Already registered?",
    createAccount: "Create account",
    signIn: "Sign in",
    pwRule: "At least 8 characters.",
    loggedAs: (m) => `Logged in as ${m}. Redirecting…`,
    resetSent: "A reset email has been sent.",
    resetNeedEmail: "Enter your email to receive the reset link.",
    pwTooShort: "Password must be at least 8 characters.",
    emailNotConfirmed: "Email not confirmed.",
    invalidCreds: "Invalid credentials.",
    rateLimit: "Too many attempts. Try again later.",
    magic: "Get a magic link",
    magicHint: "We’ll email you a one-click sign-in link.",
    or: "or",
    with: (p) => `Continue with ${p}`,
    accept: "I accept",
    terms: "the Terms of Service",
    and: "and",
    privacy: "the Privacy Policy",
    mustAccept: "You must accept the terms to create an account.",
    badRedirect: "Invalid redirect. Using default path.",
    pwStrength: "Password strength",
    logout: "Log out",
  },
  es: {
    title: "Área de cliente",
    intro_login: "Inicia sesión con tu correo y contraseña.",
    intro_signup: "Crea una cuenta para acceder a tu área segura.",
    email: "Correo electrónico",
    password: "Contraseña",
    see: "Ver",
    hide: "Ocultar",
    login: "Iniciar sesión",
    signup: "Crear cuenta",
    logging: "Conectando…",
    signing: "Creando…",
    forgot: "¿Olvidaste tu contraseña?",
    needAccount: "¿No tienes cuenta?",
    haveAccount: "¿Ya tienes cuenta?",
    createAccount: "Crear cuenta",
    signIn: "Iniciar sesión",
    pwRule: "Mínimo 8 caracteres.",
    loggedAs: (m) => `Conectado como ${m}. Redirigiendo…`,
    resetSent: "Se ha enviado un correo de restablecimiento.",
    resetNeedEmail: "Introduce tu correo para recibir el enlace.",
    pwTooShort: "La contraseña debe tener al menos 8 caracteres.",
    emailNotConfirmed: "Correo no confirmado.",
    invalidCreds: "Credenciales inválidas.",
    rateLimit: "Demasiados intentos. Inténtalo más tarde.",
    magic: "Recibir enlace mágico",
    magicHint:
      "Te enviaremos un correo con un enlace de acceso con un clic.",
    or: "o",
    with: (p) => `Continuar con ${p}`,
    accept: "Acepto",
    terms: "los Términos de servicio",
    and: "y",
    privacy: "la Política de privacidad",
    mustAccept: "Debes aceptar los términos para crear una cuenta.",
    badRedirect: "Redirección no válida. Usando la ruta por defecto.",
    pwStrength: "Fortaleza de la contraseña",
    logout: "Cerrar sesión",
  },
};

export default function EspaceClientInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Langue depuis URL + persistance localStorage
  const urlLang = (searchParams.get("lang") || "").toLowerCase();
  const storedLang =
    (typeof window !== "undefined" &&
      (localStorage.getItem("cq.lang") as Lang | null)) ||
    undefined;

  const initialLang: Lang = (LANGS as readonly string[]).includes(urlLang)
    ? (urlLang as Lang)
    : (storedLang ?? "fr");

  const [lang, setLang] = useState<Lang>(initialLang);
  const t = I18N[lang];

  // UI state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  // Password strength (0..4)
  const pwScore = getPasswordScore(password);

  // Redirection sécurisée
  const redirectingRef = useRef(false);
  const nextRaw = searchParams.get("next");
  const next = sanitizeNext(nextRaw) || "/dossiers/nouveau";

  // Session / écouteur auth
  useEffect(() => {
    let mounted = true;

    // Persister la langue
    try {
      localStorage.setItem("cq.lang", lang);
    } catch {
      /* ignore */
    }

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
  }, [router, next, lang]);

  // Actions
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

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setInfo(null);
    setErrorMsg(null);
    if (password.length < 8) {
      setLoading(false);
      setErrorMsg(t.pwTooShort);
      return;
    }
    if (!accepted) {
      setLoading(false);
      setErrorMsg(t.mustAccept);
      return;
    }
    const { error, data } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/espace-client` },
    });
    setLoading(false);
    if (error) {
      setErrorMsg(mapAuthError(error.message, t));
    } else {
      if (!data.session) {
        setInfo("Compte créé. Vérifiez votre boîte mail pour confirmer.");
        setMode("login");
      } else {
        setInfo("Compte créé !");
      }
    }
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
      redirectTo: `${window.location.origin}/espace-client`,
    });
    setLoading(false);
    if (error) setErrorMsg(mapAuthError(error.message, t));
    else setInfo(t.resetSent);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserEmail(null);
    setEmail("");
    setPassword("");
    setMode("login");
    redirectingRef.current = false;
  }

  async function handleMagicLink(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setLoading(true);
    setInfo(null);
    setErrorMsg(null);
    const eaddr = email.trim();
    if (!eaddr) {
      setLoading(false);
      setErrorMsg(t.resetNeedEmail);
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: eaddr,
      options: { emailRedirectTo: `${window.location.origin}/espace-client` },
    });
    setLoading(false);
    if (error) setErrorMsg(mapAuthError(error.message, t));
    else setInfo(t.resetSent);
  }

  async function handleOAuth(provider: OAuthProvider) {
    setLoading(true);
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/espace-client` },
    });
    setLoading(false);
    if (error) setErrorMsg(mapAuthError(error.message, t));
  }

  // Écran si déjà connecté
  if (userEmail) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
          <Header lang={lang} setLang={setLang} />
          <h1 className="text-2xl font-semibold mt-2">{t.title}</h1>
          <p className="mt-2 text-sm text-gray-600">{t.loggedAs(userEmail)}</p>
          <button onClick={handleLogout} className="btn btn-outline mt-6 w-full">
            {t.logout}
          </button>
        </div>
      </main>
    );
  }

  // Formulaire login / signup
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <Header
          lang={lang}
          setLang={(l) => {
            setLang(l);
            try {
              localStorage.setItem("cq.lang", l);
            } catch {
              /* ignore */
            }
          }}
        />

        <h1 className="text-2xl font-semibold mt-2">{t.title}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {mode === "login" ? t.intro_login : t.intro_signup}
        </p>

        <form
          onSubmit={mode === "login" ? handleLogin : handleSignup}
          className="mt-6 space-y-4"
        >
          <label className="block">
            <span className="text-sm font-medium">{t.email}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@example.com"
              autoComplete="email"
              inputMode="email"
              className="mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">{t.password}</span>
            <div className="mt-1 grid" style={{ gridTemplateColumns: "1fr auto" }}>
              <input
                type={showPwd ? "text" : "password"}
                required
                minLength={mode === "signup" ? 8 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="rounded-l-xl border px-3 py-2 focus:outline-none focus:ring"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="btn btn-outline rounded-r-xl"
                aria-pressed={showPwd}
                aria-label={showPwd ? t.hide : t.see}
              >
                {showPwd ? t.hide : t.see}
              </button>
            </div>
            {mode === "signup" && (
              <div className="mt-2">
                <p className="text-xs text-gray-600">{t.pwRule}</p>
                <PwMeter label={t.pwStrength} score={pwScore} />
              </div>
            )}
          </label>

          {mode === "login" ? (
            <div className="flex flex-col gap-2">
              <button type="submit" disabled={loading} className="btn btn-primary w-full">
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
              <div className="relative my-2 text-center text-sm text-gray-500">
                <span className="px-2 bg-white relative z-10">{t.or}</span>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b" />
              </div>
              <button onClick={handleMagicLink} className="btn btn-outline w-full" disabled={loading}>
                {t.magic}
              </button>
              <button onClick={() => handleOAuth("google")} className="btn btn-outline w-full" disabled={loading}>
                {t.with("Google")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="inline-flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <span>
                  {t.accept}{" "}
                  <a className="underline" href="/legal/terms" target="_blank" rel="noreferrer">
                    {t.terms}
                  </a>{" "}
                  {t.and}{" "}
                  <a className="underline" href="/legal/privacy" target="_blank" rel="noreferrer">
                    {t.privacy}
                  </a>
                </span>
              </label>
              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                {loading ? t.signing : t.signup}
              </button>
            </div>
          )}

          {errorMsg && <p className="text-sm" style={{ color: "#dc2626" }}>{errorMsg}</p>}
          {info && <p className="text-sm" style={{ color: "#16a34a" }}>{info}</p>}
        </form>

        <div className="mt-6 text-sm text-gray-700">
          {mode === "login" ? (
            <>
              {t.needAccount}{" "}
              <button className="btn btn-link" onClick={() => setMode("signup")}>
                {t.createAccount}
              </button>
            </>
          ) : (
            <>
              {t.haveAccount}{" "}
              <button className="btn btn-link" onClick={() => setMode("login")}>
                {t.signIn}
              </button>
            </>
          )}
        </div>

        {nextRaw && !sanitizeNext(nextRaw) && (
          <p className="mt-4 text-xs text-amber-600">{t.badRedirect}</p>
        )}

        <p className="mt-4 text-xs text-gray-500">{t.magicHint}</p>
      </div>
    </main>
  );
}

/* ---------- Header & LangSwitcher ---------- */

function Header({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <header className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <Image src="/logo-cq.png" alt="ComptaNet Québec" className="h-10 w-auto" width={120} height={40} priority />
        <span className="font-semibold">ComptaNet Québec</span>
      </div>
      <LangSwitcher lang={lang} setLang={setLang} />
    </header>
  );
}

function LangSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex gap-2">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={(lang === l ? "btn btn-primary" : "btn btn-outline") + " px-3 py-1 rounded-xl"}
          type="button"
          aria-pressed={lang === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/* ---------- Helpers ---------- */

function mapAuthError(message: string, t: (typeof I18N)["fr"]): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return t.invalidCreds;
  if (m.includes("email rate limit")) return t.rateLimit;
  if (m.includes("password should be at least")) return t.pwTooShort;
  if (m.includes("email not confirmed")) return t.emailNotConfirmed;
  return message;
}

function sanitizeNext(input: string | null): string | null {
  if (!input) return null;
  if (!input.startsWith("/")) return null;
  if (input.startsWith("//") || input.includes("://")) return null;
  return input;
}

function getPasswordScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function PwMeter({ label, score }: { label: string; score: number }) {
  const steps = 4;
  // Astuce pour éviter tout "any": on génère directement un tableau d’index [0..steps-1]
  const bars = Array.from({ length: steps }, (_: unknown, i: number) => i);
  return (
    <div className="mt-1">
      <div
        className="flex gap-1"
        aria-label={label}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={steps}
        aria-valuenow={score}
      >
        {bars.map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded ${i < score ? "bg-emerald-500" : "bg-gray-200"}`} />
        ))}
      </div>
      <span className="sr-only">
        {label}: {score}/{steps}
      </span>
    </div>
  );
}
