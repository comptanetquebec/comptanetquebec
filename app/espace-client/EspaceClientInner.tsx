"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/** Langues dispo (tuple) → type Lang dérivé automatiquement */
const LANGS = ["fr", "en", "es"] as const;
type Lang = typeof LANGS[number];

type Mode = "login" | "signup";

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
    pwRule: "Minimum 8 caractères.",
    loggedAs: (m) => `Connecté en tant que ${m}. Redirection en cours…`,
    resetSent: "Un e-mail de réinitialisation vient d’être envoyé.",
    resetNeedEmail: "Entrez votre courriel pour recevoir le lien.",
    pwTooShort: "Le mot de passe doit contenir au moins 8 caractères.",
    emailNotConfirmed: "Courriel non confirmé.",
    invalidCreds: "Identifiants invalides.",
    rateLimit: "Trop de tentatives. Réessayez plus tard.",
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
  },
};

export default function EspaceClientInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Récupère ?lang= et le force proprement au type Lang
  const langParamRaw = (searchParams.get("lang") || "fr").toLowerCase();
  const initialLang: Lang = (LANGS as readonly string[]).includes(langParamRaw)
    ? (langParamRaw as Lang)
    : "fr";

  const [lang, setLang] = useState<Lang>(initialLang);
  const t = I18N[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const redirectingRef = useRef(false);
  const next = searchParams.get("next") || "/formulaire";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
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
      sub.subscription.unsubscribe();
    };
  }, [router, next]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setInfo(null);
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/espace-client` },
    });
    setLoading(false);
    if (error) setErrorMsg(mapAuthError(error.message, t));
    else {
      if (!data.session) {
        setInfo("Compte créé. Vérifiez votre boîte mail pour confirmer.");
        setMode("login");
      } else setInfo("Compte créé !");
    }
  }

  async function handleForgot() {
    setLoading(true);
    setInfo(null);
    setErrorMsg(null);
    if (!email.trim()) {
      setLoading(false);
      setErrorMsg(t.resetNeedEmail);
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
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

  // Déjà connecté
  if (userEmail) {
    return (
      <main className="hero">
        <div className="card container">
          <Header lang={lang} setLang={setLang} />
          <h1>{t.title}</h1>
          <p>{t.loggedAs(userEmail)}</p>
          <button onClick={handleLogout} className="btn btn-outline">
            Logout
          </button>
        </div>
      </main>
    );
  }

  // Formulaire
  return (
    <main className="hero">
      <div className="card container">
        <Header lang={lang} setLang={setLang} />

        <h1>{t.title}</h1>
        <p>{mode === "login" ? t.intro_login : t.intro_signup}</p>

        <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="form">
          <label>
            {t.email}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@example.com"
            />
          </label>

          <label>
            {t.password}
            <div className="grid" style={{ gridTemplateColumns: "1fr auto" }}>
              <input
                type={showPwd ? "text" : "password"}
                required
                minLength={mode === "signup" ? 8 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="btn btn-outline"
              >
                {showPwd ? t.hide : t.see}
              </button>
            </div>
          </label>
          {mode === "signup" && <p className="note">{t.pwRule}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? (mode === "login" ? t.logging : t.signing) : (mode === "login" ? t.login : t.signup)}
          </button>

          {mode === "login" && (
            <button type="button" onClick={handleForgot} className="btn btn-outline" disabled={loading}>
              {t.forgot}
            </button>
          )}

          {errorMsg && <p className="note" style={{ color: "red" }}>{errorMsg}</p>}
          {info && <p className="note" style={{ color: "green" }}>{info}</p>}
        </form>

        <div className="note">
          {mode === "login" ? (
            <>
              {t.needAccount}{" "}
              <button className="btn btn-outline" onClick={() => setMode("signup")}>
                {t.createAccount}
              </button>
            </>
          ) : (
            <>
              {t.haveAccount}{" "}
              <button className="btn btn-outline" onClick={() => setMode("login")}>
                {t.signIn}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

/* ---------- Header & LangSwitcher ---------- */

function Header({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <header className="brand" style={{ justifyContent: "space-between", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src="/logo-cq.png" alt="ComptaNet Québec" style={{ height: 40, width: "auto" }} />
        <span className="brand-text">ComptaNet Québec</span>
      </div>
      <LangSwitcher lang={lang} setLang={setLang} />
    </header>
  );
}

function LangSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="nav">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={lang === l ? "btn btn-primary" : "btn btn-outline"}
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
