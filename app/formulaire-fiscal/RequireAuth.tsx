"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  lang: string;
  nextPath: string; // ex: "/formulaire-fiscal/depot-documents?fid=...&lang=fr"
  children: (userId: string) => React.ReactNode;
};

export default function RequireAuth({ lang, nextPath, children }: Props) {
  const router = useRouter();
  const [booting, setBooting] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!alive) return;

      if (error || !data.user) {
        setBooting(false);
        router.replace(
          `/espace-client?lang=${encodeURIComponent(lang)}&next=${encodeURIComponent(nextPath)}`
        );
        return;
      }

      setUserId(data.user.id);
      setBooting(false);
    })();

    return () => {
      alive = false;
    };
  }, [router, lang, nextPath]);

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
