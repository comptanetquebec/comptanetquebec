"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Mode = "login" | "signup";
type Lang = "fr" | "en" | "es";

/* … I18N identique à ton fichier actuel … */

export default function EspaceClientInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const langParam = (searchParams.get("lang") || "fr").toLowerCase() as Lang;
  const [lang, setLang] = useState<Lang>(
    ["fr", "en", "es"].includes(langParam) ? langParam : "fr"
  );
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

  // 🔁 CHANGÉ : par défaut on va vers /formulaire-fiscal
  const next = searchParams.get("next") || "/formulaire-fiscal";

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
    return () => { sub.subscription.unsubscribe(); };
  }, [router, next]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setInfo(null); setErrorMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErrorMsg(mapAuthError(error.message, t));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setInfo(null); setErrorMsg(null);
    if (password.length < 8) { setLoading(false); setErrorMsg(t.pwTooShort); return; }

    // 🔁 CHANGÉ : lien de confirmation → /formulaire-fiscal
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/formulaire-fiscal`,
      },
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
    setLoading(true); setInfo(null); setErrorMsg(null);
    if (!email.trim()) { setLoading(false); setErrorMsg(t.resetNeedEmail); return; }
    // Tu peux aussi mettre /formulaire-fiscal ici si tu préfères
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/espace-client`,
    });
    setLoading(false);
    if (error) setErrorMsg(mapAuthError(error.message, t));
    else setInfo(t.resetSent);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserEmail(null); setEmail(""); setPassword(""); setMode("login");
    redirectingRef.current = false;
  }

  /* ----- UI identique à ton fichier : Header, LangSwitcher, etc. ----- */
  // … garde le reste de ton code tel quel (formulaire, Header, LangSwitcher, mapAuthError)
}
