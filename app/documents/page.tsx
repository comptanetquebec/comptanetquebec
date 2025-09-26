"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

/* ---------- Langues ---------- */
const LANGS = ["fr", "en", "es"] as const;
type Lang = typeof LANGS[number];

const I18N: Record<
  Lang,
  {
    brand: string;
    pageTitle: string;
    intro: string;
    uploadBtn: string;
    or: string;
    dropHere: string;
    maxSize: string;
    table_name: string;
    table_size: string;
    table_updated: string;
    empty: string;
    actions_download: string;
    actions_delete: string;
    deleting: string;
    downloading: string;
    uploading: string;
    loginNeeded: string;
    backToLogin: string;
  }
> = {
  fr: {
    brand: "ComptaNet Québec",
    pageTitle: "Mes documents",
    intro: "Déposez vos T4, relevés, reçus… Seuls vous et l’équipe ComptaNet y avez accès.",
    uploadBtn: "Téléverser un fichier",
    or: "ou",
    dropHere: "glissez-déposez ici",
    maxSize: "Taille max. 20 Mo par fichier",
    table_name: "Nom",
    table_size: "Taille",
    table_updated: "Modifié le",
    empty: "Aucun fichier pour l’instant.",
    actions_download: "Télécharger",
    actions_delete: "Supprimer",
    deleting: "Suppression…",
    downloading: "Préparation du lien…",
    uploading: "Envoi en cours…",
    loginNeeded: "Vous devez être connecté pour voir vos documents.",
    backToLogin: "Aller à l’espace client",
  },
  en: {
    brand: "ComptaNet Québec",
    pageTitle: "My documents",
    intro: "Upload your T4 slips, receipts, etc. Only you and ComptaNet can access them.",
    uploadBtn: "Upload a file",
    or: "or",
    dropHere: "drag & drop here",
    maxSize: "Max size 20 MB per file",
    table_name: "Name",
    table_size: "Size",
    table_updated: "Last modified",
    empty: "No files yet.",
    actions_download: "Download",
    actions_delete: "Delete",
    deleting: "Deleting…",
    downloading: "Preparing link…",
    uploading: "Uploading…",
    loginNeeded: "You must be logged in to view your documents.",
    backToLogin: "Go to client area",
  },
  es: {
    brand: "ComptaNet Québec",
    pageTitle: "Mis documentos",
    intro: "Sube tus T4, recibos, etc. Solo tú y ComptaNet tienen acceso.",
    uploadBtn: "Subir un archivo",
    or: "o",
    dropHere: "arrastra y suelta aquí",
    maxSize: "Tamaño máx. 20 MB por archivo",
    table_name: "Nombre",
    table_size: "Tamaño",
    table_updated: "Modificado",
    empty: "Aún no hay archivos.",
    actions_download: "Descargar",
    actions_delete: "Eliminar",
    deleting: "Eliminando…",
    downloading: "Preparando enlace…",
    uploading: "Subiendo…",
    loginNeeded: "Debes iniciar sesión para ver tus documentos.",
    backToLogin: "Ir al área de cliente",
  },
};

/* ---------- Utils ---------- */
function fmtBytes(n: number) {
  if (!n && n !== 0) return "-";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0, x = n;
  while (x >= 1024 && i < u.length - 1) { x /= 1024; i++; }
  return `${x.toFixed(i ? 1 : 0)} ${u[i]}`;
}
function fmtDate(d?: string) {
  if (!d) return "-";
  try { return new Date(d).toLocaleString(); } catch { return d; }
}

/* ---------- Page ---------- */
export default function DocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const langParam = (searchParams.get("lang") || "fr").toLowerCase();
  const lang: Lang = (LANGS as readonly string[]).includes(langParam) ? (langParam as Lang) : "fr";
  const t = I18N[lang];

  const [uid, setUid] = useState<string | null>(null);
  const [files, setFiles] = useState<Array<{
    name: string;
    size: number;
    updated_at: string | null;
  }>>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [busy, setBusy] = useState<string | null>(null); // "upload" | "download" | "delete"
  const dropRef = useRef<HTMLDivElement | null>(null);

  // Auth + fetch list
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const me = data.session?.user?.id || null;
      if (!me) return;
      setUid(me);
      await refreshList(me);
    })();
  }, []);

  const userPrefix = useMemo(() => (uid ? `${uid}/` : null), [uid]);

  // Drag & drop styling
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    function on(e: DragEvent) {
      e.preventDefault(); e.stopPropagation();
      el.classList.add("ring");
    }
    function off(e: DragEvent) {
      e.preventDefault(); e.stopPropagation();
      el.classList.remove("ring");
    }
    el.addEventListener("dragenter", on);
    el.addEventListener("dragover", on);
    el.addEventListener("dragleave", off);
    el.addEventListener("drop", off);
    return () => {
      el.removeEventListener("dragenter", on);
      el.removeEventListener("dragover", on);
      el.removeEventListener("dragleave", off);
      el.removeEventListener("drop", off);
    };
  }, []);

  async function refreshList(me: string) {
    setLoadingList(true);
    const { data, error } = await supabase.storage.from("clients").list(me, {
      limit: 100,
      sortBy: { column: "updated_at", order: "desc" },
    });
    setLoadingList(false);
    if (error) {
      console.error(error);
      setFiles([]);
      return;
    }
    setFiles(
      (data || []).map((f) => ({
        name: f.name,
        size: (f as any).metadata?.size ?? f.metadata?.size ?? 0,
        updated_at: (f as any).updated_at ?? f.updated_at ?? null,
      }))
    );
  }

  async function onChooseFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!uid || !e.target.files?.length) return;
    await uploadFiles(uid, Array.from(e.target.files));
    (e.target as HTMLInputElement).value = "";
  }

  async function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!uid) return;
    const files = Array.from(e.dataTransfer.files || []);
    await uploadFiles(uid, files);
  }

  async function uploadFiles(me: string, selected: File[]) {
    setBusy("upload");
    try {
      for (const file of selected) {
        if (file.size > 20 * 1024 * 1024) continue; // 20MB
        const path = `${me}/${file.name}`;
        // overwrite si existe
        await supabase.storage.from("clients").upload(path, file, { upsert: true, cacheControl: "3600" });
      }
      await refreshList(me);
    } finally {
      setBusy(null);
    }
  }

  async function download(name: string) {
    if (!uid) return;
    setBusy("download");
    try {
      const { data, error } = await supabase.storage
        .from("clients")
        .createSignedUrl(`${uid}/${name}`, 60); // lien valable 60s
      if (error || !data?.signedUrl) return;
      window.open(data.signedUrl, "_blank");
    } finally {
      setBusy(null);
    }
  }

  async function remove(name: string) {
    if (!uid) return;
    setBusy("delete");
    try {
      await supabase.storage.from("clients").remove([`${uid}/${name}`]);
      await refreshList(uid);
    } finally {
      setBusy(null);
    }
  }

  // Pas connecté
  if (!uid) {
    return (
      <main className="hero">
        <div className="card container">
          <header className="brand" style={{ justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src="/logo-cq.png" alt={t.brand} style={{ height: 40, width: "auto" }} />
              <span className="brand-text">{t.brand}</span>
            </div>
          </header>

          <h1>{t.pageTitle}</h1>
          <p className="lead">{t.loginNeeded}</p>
          <a href="/espace-client" className="btn btn-primary">{t.backToLogin}</a>
        </div>
      </main>
    );
  }

  // Page documents
  return (
    <main className="hero">
      <div className="card container">
        <header className="brand" style={{ justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo-cq.png" alt={t.brand} style={{ height: 40, width: "auto" }} />
            <span className="brand-text">{t.brand}</span>
          </div>
          <a className="btn btn-outline" href={`/formulaire-fiscal`}>←</a>
        </header>

        <h1>{t.pageTitle}</h1>
        <p className="lead">{t.intro}</p>

        {/* Upload zone */}
        <div
          ref={dropRef}
          onDrop={onDrop}
          className="section"
          style={{
            border: "2px dashed #d8deea",
            borderRadius: "14px",
            padding: 16,
            background: "#fbfcff",
            textAlign: "center",
          }}
        >
          <label className="btn btn-primary" style={{ cursor: "pointer" }}>
            {busy === "upload" ? t.uploading : t.uploadBtn}
            <input
              type="file"
              multiple
              onChange={onChooseFiles}
              style={{ display: "none" }}
            />
          </label>
          <div className="note" style={{ marginTop: 8 }}>
            {t.or} <b>{t.dropHere}</b> · {t.maxSize}
          </div>
        </div>

        {/* Liste des fichiers */}
        <div className="section" style={{ paddingTop: 24 }}>
          {loadingList ? (
            <p className="note">…</p>
          ) : files.length === 0 ? (
            <p className="note">{t.empty}</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>{t.table_name}</th>
                    <th style={th}>{t.table_size}</th>
                    <th style={th}>{t.table_updated}</th>
                    <th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f) => (
                    <tr key={f.name} style={{ borderTop: "1px solid #eef2f7" }}>
                      <td style={td}>{f.name}</td>
                      <td style={td}>{fmtBytes(f.size)}</td>
                      <td style={td}>{fmtDate(f.updated_at || undefined)}</td>
                      <td style={{ ...td, whiteSpace: "nowrap", display: "flex", gap: 8 }}>
                        <button
                          className="btn btn-outline"
                          onClick={() => download(f.name)}
                          disabled={busy === "download"}
                          aria-label={t.actions_download}
                        >
                          {busy === "download" ? t.downloading : t.actions_download}
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() => remove(f.name)}
                          disabled={busy === "delete"}
                          aria-label={t.actions_delete}
                        >
                          {busy === "delete" ? t.deleting : t.actions_delete}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ---------- Styles table ---------- */
const th: React.CSSProperties = {
  textAlign: "left",
  fontWeight: 700,
  padding: "10px 8px",
  fontSize: 14,
  color: "#374151",
};
const td: React.CSSProperties = {
  padding: "10px 8px",
  fontSize: 14,
};


