"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type DocRow = {
  id: string;
  formulaire_id: string;
  file_path: string;
  file_name: string | null;
  created_at: string;
};

const BUCKET = "client-documents";
const TABLE = "formulaire_documents";

function sanitizeFileName(name: string) {
  // retire caractères problématiques pour des paths storage
  return name.replace(/[^\w.\-()+\s]/g, "_").replace(/\s+/g, " ").trim();
}

export default function DocumentUpload({ formulaireId }: { formulaireId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [busyList, setBusyList] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [selected, setSelected] = useState<File | null>(null);

  const fid = useMemo(() => (formulaireId ? formulaireId.trim() : null), [formulaireId]);

  async function refresh() {
    if (!fid) return;
    setBusyList(true);
    setErr(null);

    const { data, error } = await supabase
      .from(TABLE)
      .select("id, formulaire_id, file_path, file_name, created_at")
      .eq("formulaire_id", fid)
      .order("created_at", { ascending: false });

    setBusyList(false);

    if (error) {
      setErr(error.message);
      return;
    }
    setDocs((data ?? []) as DocRow[]);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fid]);

  async function handleUpload() {
    setOk(null);
    setErr(null);

    if (!fid) {
      setErr("Aucun formulaireId (fid) trouvé. Ajoute ?fid=... dans l’URL pour déposer des documents.");
      return;
    }
    if (!selected) {
      setErr("Choisis un fichier avant d’uploader.");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) throw new Error("Utilisateur non connecté.");

      const cleanName = sanitizeFileName(selected.name);
      const path = `${user.id}/${fid}/${crypto.randomUUID()}-${cleanName}`;

      // 1) Upload Storage
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, selected, {
        upsert: false,
        cacheControl: "3600",
        contentType: selected.type || "application/octet-stream",
      });
      if (upErr) throw upErr;

      // 2) Insert DB
      const { error: dbErr } = await supabase.from(TABLE).insert({
        user_id: user.id,
        formulaire_id: fid,
        file_path: path,
        file_name: cleanName,
      });
      if (dbErr) {
        // si insert DB échoue, on nettoie le fichier uploadé pour éviter un orphan
        await supabase.storage.from(BUCKET).remove([path]);
        throw dbErr;
      }

      setSelected(null);
      setOk("Document déposé ✅");
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(file_path: string) {
    setErr(null);
    setOk(null);

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(file_path, 60 * 10);
    if (error) {
      setErr(error.message);
      return;
    }
    if (!data?.signedUrl) {
      setErr("Impossible de générer le lien.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function handleDelete(doc: DocRow) {
    setErr(null);
    setOk(null);

    const confirm = window.confirm("Supprimer ce document?");
    if (!confirm) return;

    setLoading(true);
    try {
      // 1) Supprimer le fichier
      const { error: rmErr } = await supabase.storage.from(BUCKET).remove([doc.file_path]);
      if (rmErr) throw rmErr;

      // 2) Supprimer la ligne DB
      const { error: dbErr } = await supabase.from(TABLE).delete().eq("id", doc.id);
      if (dbErr) throw dbErr;

      setOk("Document supprimé ✅");
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <h2 className="m-0 text-xl font-extrabold">📤 Dépôt de documents</h2>

      <p className="mt-2 text-sm text-black/70">
        Formulaire ID :{" "}
        <span className="font-mono">
          {fid ? fid : "— (manquant : ajoute ?fid=... dans l’URL) —"}
        </span>
      </p>

      {err && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {err}
        </div>
      )}
      {ok && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {ok}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          type="file"
          className="w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm"
          onChange={(e) => setSelected(e.currentTarget.files?.[0] ?? null)}
          disabled={!fid || loading}
        />

        <button
          type="button"
          onClick={handleUpload}
          disabled={!fid || loading || !selected}
          className="rounded-xl bg-black px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50"
        >
          {loading ? "Upload…" : "Déposer"}
        </button>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="m-0 text-base font-extrabold">📁 Documents déposés</h3>
          <button
            type="button"
            onClick={refresh}
            disabled={!fid || busyList || loading}
            className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-bold disabled:opacity-50"
          >
            {busyList ? "Actualisation…" : "Rafraîchir"}
          </button>
        </div>

        {!fid ? (
          <p className="mt-3 text-sm text-black/60">
            Ajoute <code>?fid=...</code> dans l’URL pour afficher/ajouter les documents liés à un formulaire.
          </p>
        ) : docs.length === 0 ? (
          <p className="mt-3 text-sm text-black/60">Aucun document pour ce formulaire pour l’instant.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-col gap-2 rounded-xl border border-black/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{d.file_name ?? d.file_path}</div>
                  <div className="text-xs text-black/60">
                    {new Date(d.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(d.file_path)}
                    className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-bold"
                    disabled={loading}
                  >
                    Télécharger
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(d)}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
                    disabled={loading}
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
