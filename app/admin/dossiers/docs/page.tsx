"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-CA");
}

export default function AdminDossierDocsPage() {
  const sp = useSearchParams();
  const fid = useMemo(() => (sp.get("fid") ?? "").trim(), [sp]);

  const [msg, setMsg] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(false);

  // évite d’écraser l’état si on change de fid pendant un fetch
  const loadToken = useRef(0);

  const loadDocs = useCallback(async () => {
    if (!fid) return;

    const token = ++loadToken.current;
    setLoading(true);
    setMsg(null);

    const { data, error } = await supabase
      .from(DOCS_TABLE)
      .select("id, original_name, storage_path, created_at")
      .eq("formulaire_id", fid)
      .order("created_at", { ascending: false });

    // si un autre load a démarré entre-temps, on ignore ce résultat
    if (token !== loadToken.current) return;

    setLoading(false);

    if (error) {
      setMsg("❌ " + error.message);
      setDocs([]);
      return;
    }

    setDocs((data ?? []) as DocRow[]);
  }, [fid]);

  useEffect(() => {
    // reset visuel quand on change de dossier
    setDocs([]);
    setMsg(null);

    if (!fid) return;
    void loadDocs();
  }, [fid, loadDocs]);

  const openDoc = useCallback(async (storage_path: string) => {
    setMsg(null);

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storage_path, 60 * 10);

    if (error || !data?.signedUrl) {
      setMsg("❌ " + (error?.message ?? "Impossible d’ouvrir le fichier"));
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }, []);

  if (!fid) {
    return <div style={{ padding: 16 }}>❌ fid manquant (ex: /admin/dossiers/docs?fid=...)</div>;
  }

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
                <div style={{ opacity: 0.7, fontSize: 12, wordBreak: "break-word" }}>
                  {d.storage_path}
                </div>
                {d.created_at && (
                  <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>
                    {formatDate(d.created_at)}
                  </div>
                )}
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

