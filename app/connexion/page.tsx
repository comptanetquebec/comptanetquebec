"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

// ---------- i18n ----------
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
    google: string;
    or: string;
    forgot: string;
    needEmail: string;
    resetSent: string;
    invalid: string;
  }
> = {
  fr: {
    title: "Espace client",
    intro: "Connecte-toi avec ton courriel et ton mot de passe.",
    email: "Courriel",
    password: "Mot de passe",
    login: "Se connecter",
    loading: "Connexion…",
    google: "Continuer avec Google",
    or: "OU",
    forgot: "Mot de passe oublié ?",
    needEmail: "Entre ton courriel d’abord, puis clique « Mot de passe oublié ».",
    resetSent: "✅ Un courriel de réinitialisation a été envoyé (vérifie tes indésirables).",
    invalid: "Identifiants invalides.",
  },
  en: {
    title: "Client Area",
    intro: "Log in with your email and password.",
    email: "Email",
    password: "Password",
    login: "Log in",
    loading: "Logging in…",
    google: "Continue with Google",
    or: "OR",
    forgot: "Forgot password?",
    needEmail: "Enter your email first, then click “Forgot password”.",
    resetSent: "✅ A reset email has been sent (check spam).",
    invalid: "Invalid credentials.",
  },
  es: {
    title: "Área de cliente",
    intro: "Inicia sesión con tu correo y contraseña.",
    email: "Correo electrónico",
    password: "Contraseña",
    login: "Iniciar sesión",
    loading: "Conectando…",
    google: "Continuar con Google",
    or: "O",
    forgot: "¿Olvidaste tu contraseña?",
    needEmail: "Introduce tu correo primero y luego pulsa “Olvidé mi contraseña”.",
    resetSent: "✅ Se envió un correo de restablecimiento (revisa spam).",
    invalid: "Credenciales inválidas.",
  },
};

function normalizeLang(v?: string | null): Lang {
  const x = (v || "fr").toLowerCase();
  return (LANGS as readonly string[]).includes(x) ? (x as Lang) : "fr";
}

function safeNext(v?: string | null): string {
  // sécurité: on accepte seulement les chemins internes
  const raw = (v || "").trim();
  if (!raw) return "/espace-client";
  if (!raw.startsWith("/")) return "/espace-client";
  if (raw.startsWith("//")) return "/espace-client";
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

export default function ConnexionPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const lang = useMemo(() => normalizeLang(sp.get("lang")), [sp]);
  const t = TXT[lang];

  const next = useMemo(() => safeNext(sp.get("next")), [sp]);
  const nextWithLang = useMemo(() => withLang(next, lang), [next, lang]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
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

    router.replace(nextWithLang);
  }

  async function handleGoogle() {
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // après OAuth, on revient sur /connexion avec lang/next,
        // puis la page espace-client redirigera (ou toi tu peux rediriger ensuite)
        redirectTo: `${window.location.origin}/connexion?lang=${lang}&next=${encodeURIComponent(next)}`,
      },
    });

    setLoading(false);
    if (error) setMsg(error.message);
  }

  async function handleResetPassword() {
    setMsg(null);

    const eaddr = email.trim();
    if (!eaddr) {
      setMsg(t.needEmail);
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(eaddr, {
      // simple: on renvoie sur /connexion (tu peux faire une vraie page /reset plus tard)
      redirectTo: `${window.location.origin}/connexion?lang=${lang}&next=${encodeURIComponent(next)}`,
    });

    setLoading(false);

    if (error) setMsg(error.message);
    else setMsg(t.resetSent);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Image src="/logo-cq.png" alt="ComptaNet Québec" width={42} height={42} priority />
        <div className="leading-tight">
          <div className="font-semibold">ComptaNet Québec</div>
          <div className="text-xs text-gray-500">{lang.toUpperCase()}</div>
        </div>
      </div>

      <h1 className="text-2xl font-semibold mb-2">{t.title}</h1>
      <p className="text-sm text-gray-600 mb-6">{t.intro}</p>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="w-full border rounded p-3 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Image src="/google-g.png" alt="Google" width={18} height={18} />
        {t.google}
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-gray-500">{t.or}</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder={t.email}
          required
          className="w-full border rounded p-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <input
          type="password"
          placeholder={t.password}
          required
          className="w-full border rounded p-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white p-3 rounded font-medium disabled:opacity-50"
        >
          {loading ? t.loading : t.login}
        </button>
      </form>

      <button
        type="button"
        onClick={handleResetPassword}
        disabled={loading}
        className="mt-4 text-sm underline text-gray-700 disabled:opacity-50"
      >
        {t.forgot}
      </button>

      {msg && <p className="mt-4 text-sm text-red-600">{msg}</p>}
    </main>
  );
}
