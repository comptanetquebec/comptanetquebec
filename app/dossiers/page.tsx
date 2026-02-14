"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function EspaceClientDashboard() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "fr";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace(`/espace-client?lang=${lang}&next=/dossiers`);
        return;
      }

      const { data } = await supabase
        .from("formulaires_fiscaux")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      setRows(data || []);
      setLoading(false);
    })();
  }, [router, lang]);

  if (loading) return <div style={{ padding: 20 }}>Chargement...</div>;

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1>Espace client</h1>

      <div style={{ marginBottom: 20 }}>
        <Link href={`/dossiers/nouveau?lang=${lang}`}>
          + Commencer un dossier
        </Link>
      </div>

      {rows.length === 0 ? (
        <p>Aucun dossier pour le moment.</p>
      ) : (
        rows.map((r) => (
          <div
            key={r.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 14,
              marginBottom: 12,
            }}
          >
            <strong>{r.form_type}</strong> ({r.annee || "—"})
            <div style={{ marginTop: 6 }}>
              Statut: {r.status || "—"} | Paiement: {r.payment_status || "—"}
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 12 }}>
              <Link href={`/formulaire-fiscal?fid=${r.id}&lang=${lang}`}>
                Continuer
              </Link>

              <Link href={`/formulaire-fiscal/depot-documents?fid=${r.id}&lang=${lang}`}>
                Déposer documents
              </Link>
            </div>
          </div>
        ))
      )}
    </main>
  );
}
