"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";
function normalizeLang(v: string | null | undefined): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

type Props = {
  /** Optionnel: si tu veux forcer une langue depuis le parent */
  lang?: Lang;
  /** Optionnel: si tu veux forcer le nextPath depuis le parent */
  nextPath?: string;
  children: (userId: string) => React.ReactNode;
};

/**
 * RequireAuth (TA)
 * - Garde exactement le même comportement.
 * - Auto-detect lang via querystring ?lang=fr|en|es si lang n'est pas fourni.
 * - Auto-build nextPath = pathname + search (si nextPath n'est pas fourni).
 */
export default function RequireAuthTA({ lang, nextPath, children }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const [booting, setBooting] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const redirected = useRef(false);

  // Lang par défaut depuis URL (TA)
  const resolvedLang: Lang = lang ?? normalizeLang(params.get("lang"));

  // nextPath par défaut (TA): page actuelle + query
  // (Important: côté client, window est OK)
  const resolvedNextPath =
    nextPath ??
    (typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "/formulaire-autonome?lang=" + encodeURIComponent(resolvedLang));

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!alive) return;

      if (error || !data.user) {
        setBooting(false);

        if (!redirected.current) {
          redirected.current = true;
          router.replace(
            `/espace-client?lang=${encodeURIComponent(resolvedLang)}&next=${encodeURIComponent(
              resolvedNextPath
            )}`
          );
        }
        return;
      }

      setUserId(data.user.id);
      setBooting(false);
    })();

    return () => {
      alive = false;
    };
  }, [router, resolvedLang, resolvedNextPath]);

  if (booting) {
    return (
      <main className="ff-bg">
        <div className="ff-container">
          <div style={{ padding: 24 }}>Chargement…</div>
        </div>
      </main>
    );
  }

  if (!userId) return null;

  return <>{children(userId)}</>;
}
