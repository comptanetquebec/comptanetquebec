"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const STORAGE_BUCKET = "client-documents";
const DOCS_TABLE = "formulaire_documents";

type DocRow = {
  id: string;
  original_name: string;
  storage_path: string;
  created_at: string | null;
};

export default function AdminDossierDocsPage() {
  const params = useSearchParams();
  const fid = params.get("fid") ?? "";

  const [msg, setMsg] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDocs = useCallback(async () => {
    if (!fid) return;

    setLoading(true);
    setMsg(null);

    const { data, error } = await supabase
      .from(DOCS_TABLE)
      .select("id, original_name, storage_path, created_at")
      .eq("formulaire_id", fid)
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      setMsg("❌ " + error.message);
      return;
    }

    setDocs((data ?? []) as DocRow[]);
  }, [fid]);

  useEffect(() => {
    void loadDocs();
  }, [loadDocs]);

  const openDoc = useCallback(async (storage_path: string) => {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storage_path, 60 * 10);

    if (error || !data?.signedUrl) {
      setMsg("❌ " + (error?.message ?? "Impossible d’ouvrir le fichier"));
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }, []);

  if (!fid) return <div style={{ padding: 16 }}>❌ fid manquant</div>;

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Docs du dossier</h1>
      <div style={{ marginBottom: 12, opacity: 0.8 }}>fid: {fid}</div>

      {msg && (
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, marginBottom: 12 }}>
          {msg}
        </div>
      )}

      {loading ? (
        <div>Chargement…</div>
      ) : docs.length === 0 ? (
        <div>Aucun document pour ce dossier.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {docs.map((d) => (
            <div
              key={d.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: 12,
                border: "1px solid #ddd",
                borderRadius: 10,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, wordBreak: "break-word" }}>{d.original_name}</div>
                <div style={{ opacity: 0.7, fontSize: 12, wordBreak: "break-word" }}>{d.storage_path}</div>
              </div>

              <button
                type="button"
                onClick={() => void openDoc(d.storage_path)}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc" }}
              >
                Ouvrir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
