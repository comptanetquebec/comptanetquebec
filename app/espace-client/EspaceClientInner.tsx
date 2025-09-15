"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Mode = "login" | "signup";
type Lang = "fr" | "en" | "es";

/* ====================== i18n ====================== */
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
    pwRule:
      "Minimum 8 caractères (vous pouvez activer la vérification des mots de passe compromis dans Supabase).",
    loggedAs: (m) => `Connecté en tant que ${m}. Redirection en cours…`,
    resetSent: "Un e-mail de réinitialisation vient d’être envoyé.",
    resetNeedEmail:
      "Entrez votre courriel pour recevoir le lien de réinitialisation.",
    pwTooShort: "Le mot de passe doit contenir au moins 8 caractères.",
    emailNotConfirmed:
      "Courriel non confirmé. Vérifiez votre boîte de réception.",
    invalidCreds: "Identifiants invalides.",
    rateLimit: "Trop de tentatives. Réessayez dans quelques minutes.",
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
    pwRule:
      "At least 8 characters (you can enable leaked password checks in Supabase).",
    loggedAs: (m) => `Logged in as ${m}. Redirecting…`,
    resetSent: "A reset email has been sent.",
    resetNeedEmail: "Enter your email to receive the reset link.",
    pwTooShort: "Password must be at least 8 characters.",
    emailNotConfirmed: "Email not confirmed. Check your inbox.",
    invalidCreds: "Invalid credentials.",
    rateLimit: "Too many attempts. Please try again later.",
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
    pwRule:
      "Mínimo 8 caracteres (puedes activar la verificación de contraseñas filtradas en Supabase).",
    loggedAs: (m) => `Conectado como ${m}. Redirigiendo…`,
    resetSent: "Se ha enviado un correo de restablecimiento.",
    resetNeedEmail:
      "Introduce tu correo para recibir el enlace de restablecimiento.",
    pwTooShort: "La contraseña debe tener al menos 8 caracteres.",
    emailNotConfirmed: "Correo no confirmado. Revisa tu bandeja.",
    invalidCreds: "Credenciales inválidas.",
    rateLimit: "Demasiados intentos. Inténtalo más tarde.",
  },
};

/* ====================== Page ====================== */
export default function EspaceClientInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lang via ?lang=fr|en|es (FR par défaut)
  const langParam = (searchParams.get("lang") || "fr").toLowerCase() as Lang;
  const [lang, setLang] = useState<Lang>(
    ["fr", "en", "es"].includes(langParam) ? langParam : "fr"
  );
  const t = I18N[lang];

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
  const redirectingRef = useRef(false);
  const next = searchParams.get("next") || "/formulaire";

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

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const mail = session?.user?.email ?? null;
        setUserEmail(mail);
        if (mail && !redirectingRef.current) {
          redirectingRef.current = true;
          router.replace(next);
        }
      }
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router, next]);

  /* ========== Actions ========== */
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
    if (error) setErrorMsg(mapAuthError(error.message, t));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setInfo(null);
    setErrorMsg(null);

    if (password.length < 8) {
      setLoading(false);
      setErrorMsg(t.pwTooShort);
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
        setInfo(
          "Compte créé. Vérifiez votre boîte de réception pour confirmer votre courriel."
        );
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

    const e = email.trim();
    if (!e) {
      setLoading(false);
      setErrorMsg(t.resetNeedEmail);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(e, {
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

  /* ========== Écran si déjà connecté ========== */
  if (userEmail) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4">
        <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
          <Header lang={lang} setLang={setLang} />
          <h1 className="text-2xl font-bold text-slate-900 mt-4">
            {t.title}
          </h1>
          <p className="text-slate-600 mt-2">{t.loggedAs(userEmail)}</p>
          <button
            onClick={handleLogout}
            className="mt-6 inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </main>
    );
  }

  /* ========== Formulaire (stylé) ========== */
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <Header lang={lang} setLang={setLang} />

        <h1 className="text-3xl font-bold text-slate-900 mt-4">
          {t.title}
        </h1>
        <p className="text-slate-600 mt-2">
          {mode === "login" ? t.intro_login : t.intro_signup}
        </p>

        <form
          onSubmit={mode === "login" ? handleLogin : handleSignup}
          className="mt-6 space-y-4"
        >
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.email}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@example.com"
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.password}
            </label>
            <div className="flex items-stretch gap-2">
              <input
                type={showPwd ? "text" : "password"}
                required
                minLength={mode === "signup" ? 8 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="rounded-lg border px-3 text-sm hover:bg-slate-50"
                aria-pressed={showPwd}
              >
                {showPwd ? t.hide : t.see}
              </button>
            </div>
            {mode === "signup" && (
              <p className="mt-1 text-xs text-slate-500">{t.pwRule}</p>
            )}
          </div>

          {/* CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#0f3b74] hover:bg-[#0c2f5c] text-white font-semibold py-2 transition disabled:opacity-60"
          >
            {loading
              ? mode === "login"
                ? t.logging
                : t.signing
              : mode === "login"
              ? t.login
              : t.signup}
          </button>

          {mode === "login" && (
            <button
              type="button"
              onClick={handleForgot}
              className="text-sm text-[#0f3b74] hover:underline"
              disabled={loading}
            >
              {t.forgot}
            </button>
          )}

          {errorMsg && (
            <p className="text-red-600 text-sm">{errorMsg}</p>
          )}
          {info && <p className="text-green-700 text-sm">{info}</p>}
        </form>

        {/* Switch login/signup */}
        <div className="mt-6 text-sm text-slate-700">
          {mode === "login" ? (
            <>
              {t.needAccount}{" "}
              <button
                className="text-[#0f3b74] hover:underline"
                onClick={() => {
                  setMode("signup");
                  setInfo(null);
                  setErrorMsg(null);
                }}
              >
                {t.createAccount}
              </button>
            </>
          ) : (
            <>
              {t.haveAccount}{" "}
              <button
                className="text-[#0f3b74] hover:underline"
                onClick={() => {
                  setMode("login");
                  setInfo(null);
                  setErrorMsg(null);
                }}
              >
                {t.signIn}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

/* ====================== Sous-composants ====================== */

// En-tête avec logo + sélecteur de langue
function Header({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Remplace le src si ton logo a un autre nom */}
        <img src="/logo-cq.png" alt="ComptaNet Québec" className="h-10 w-auto" />
        <span className="font-semibold text-slate-900">ComptaNet Québec</span>
      </div>

      <LangSwitcher lang={lang} setLang={setLang} />
    </div>
  );
}

function LangSwitcher({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  return (
    <div className="flex gap-1">
      {(["fr", "en", "es"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 rounded-md border text-xs ${
            lang === l ? "bg-[#0f3b74] text-white border-[#0f3b74]" : "hover:bg-slate-50"
          }`}
          type="button"
          aria-pressed={lang === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/* ====================== Helpers ====================== */

function mapAuthError(message: string, t: (typeof I18N)["fr"]): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return t.invalidCreds;
  if (m.includes("email rate limit")) return t.rateLimit;
  if (m.includes("password should be at least")) return t.pwTooShort;
  if (m.includes("email not confirmed")) return t.emailNotConfirmed;
  return message;
}
