"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "../formulaire-fiscal/formulaire-fiscal.css"; // ajuste si ton chemin est différent

const STORAGE_BUCKET = "client-documents";
const DOCS_TABLE = "formulaire_documents";

type DocRow = {
  id: string;
  formulaire_id: string;
  user_id: string;
  original_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

function titleFromType(type: string) {
  if (type === "autonome") return "Travailleur autonome (T1)";
  if (type === "t2") return "Société (T2)";
  return "Particulier (T1)";
}

function safeFilename(name: string) {
  return name.replace(/[^\w.\-()\s]/g, "_");
}

function isAllowedFile(file: File) {
  const n = file.name.toLowerCase();
  return (
    n.endsWith(".pdf") ||
    n.endsWith(".jpg") ||
    n.endsWith(".jpeg") ||
    n.endsWith(".png") ||
    n.endsWith(".zip") ||
    n.endsWith(".doc") ||
    n.endsWith(".docx") ||
    n.endsWith(".xls") ||
    n.endsWith(".xlsx")
  );
}

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export default function DepotDocumentsPage() {
  const router = useRouter();
  const params = useSearchParams();

  const fid = params.get("fid") || "";
  const type = params.get("type") || "t1";
  const lang = params.get("lang") || "fr";

  const [booting, setBooting] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [msg, setMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docs, setDocs] = useState<DocRow[]>([]);

  // Auth guard
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!alive) return;

      if (error || !data.user) {
        const next = `/depot-documents?fid=${encodeURIComponent(fid)}&type=${encodeURIComponent(type)}&lang=${encodeURIComponent(lang)}`;
        router.replace(`/espace-client?lang=${encodeURIComponent(lang)}&next=${encodeURIComponent(next)}`);
        return;
      }

      setUserId(data.user.id);
      setBooting(false);
    })();

    return () => {
      alive = false;
    };
  }, [router, fid, type, lang]);

  async function loadDocs(formulaireId: string) {
    if (!formulaireId) return;
    setDocsLoading(true);

    const { data, error } = await supabase
      .from(DOCS_TABLE)
      .select("id, formulaire_id, user_id, original_name, storage_path, mime_type, size_bytes, created_at")
      .eq("formulaire_id", formulaireId)
      .order("created_at", { ascending: false });

    setDocsLoading(false);

    if (error) {
      setMsg(`Erreur docs: ${error.message}`);
      return;
    }
    setDocs((data as DocRow[]) || []);
  }

  useEffect(() => {
    if (fid) loadDocs(fid);
  }, [fid]);

  async function uploadOne(file: File) {
    if (!userId) throw new Error("Veuillez vous reconnecter.");
    if (!fid) throw new Error("ID dossier manquant.");
    if (!isAllowedFile(file)) throw new Error("Format non accepté (PDF, JPG, PNG, ZIP, Word, Excel).");
    if (file.size > 50 * 1024 * 1024) throw new Error("Fichier trop lourd (max 50 MB).");

    const safe = safeFilename(file.name);
    const storage_path = `${userId}/${fid}/${Date.now()}-${safe}`;

    const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(storage_path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (upErr) throw upErr;

    const { error: dbErr } = await supabase.from(DOCS_TABLE).insert({
      formulaire_id: fid,
      user_id: userId,
      original_name: file.name,
      storage_path,
      mime_type: file.type || null,
      size_bytes: file.size,
    });

    if (dbErr) throw dbErr;
  }

  async function handleUploadFiles(fileList: FileList | null) {
    setMsg(null);
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    try {
      const files = Array.from(fileList);
      for (const f of files) await uploadOne(f);
      await loadDocs(fid);
      setMsg("✅ Documents téléversés.");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Erreur upload.");
    } finally {
      setUploading(false);
    }
  }

  async function getSignedUrl(path: string) {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 10);
    if (error || !data?.signedUrl) throw new Error(error?.message || "Impossible d’ouvrir le fichier.");
    return data.signedUrl;
  }

  async function openDoc(doc: DocRow) {
    try {
      const url = await getSignedUrl(doc.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Impossible d’ouvrir le fichier.");
    }
  }

  if (booting) {
    return (
      <main className="ff-bg">
        <div className="ff-container">
          <div className="ff-card" style={{ padding: 18 }}>
            Chargement…
          </div>
        </div>
      </main>
    );
  }

  const title = titleFromType(type);

  return (
    <main className="ff-bg">
      <div className="ff-container">
        <header className="ff-header">
          <div className="ff-brand-text">
            <strong>ComptaNet Québec</strong>
            <span>Dépôt de documents</span>
          </div>

          <button className="ff-btn ff-btn-outline" type="button" onClick={() => router.back()}>
            Retour
          </button>
        </header>

        <div className="ff-title">
          <h1>Déposer vos documents – {title}</h1>
          <p>Glissez-déposez vos fichiers dans le carré ci-dessous. Vous pouvez en envoyer plusieurs.</p>
        </div>

        {msg && (
          <div className="ff-card" style={{ padding: 14 }}>
            {msg}
          </div>
        )}

        {!fid ? (
          <div className="ff-card" style={{ padding: 14 }}>
            Erreur : dossier introuvable (fid manquant).
          </div>
        ) : (
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Zone de dépôt</h2>
              <p>PDF, JPG, PNG, ZIP, Word, Excel (max 50 MB).</p>
            </div>

            <Dropzone disabled={uploading} onFiles={handleUploadFiles} />

            {uploading && <div className="ff-empty">Téléversement en cours…</div>}

            <div className="ff-subtitle" style={{ marginTop: 16 }}>
              Documents envoyés
            </div>

            {docsLoading ? (
              <div className="ff-empty">Chargement…</div>
            ) : docs.length === 0 ? (
              <div className="ff-empty">Aucun document pour l’instant.</div>
            ) : (
              <div className="ff-stack">
                {docs.map((d) => (
                  <div key={d.id} className="ff-rowbox" style={{ alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {d.original_name}
                      </div>
                      <div style={{ opacity: 0.8, fontSize: 13 }}>
                        {new Date(d.created_at).toLocaleString()}
                        {d.size_bytes ? ` • ${formatBytes(d.size_bytes)}` : ""}
                      </div>
                    </div>

                    <button type="button" className="ff-btn ff-btn-soft" onClick={() => openDoc(d)}>
                      Voir / Télécharger
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="ff-mt">
              <button
                type="button"
                className="ff-btn ff-btn-primary"
                onClick={() => router.push(`/merci?lang=${encodeURIComponent(lang)}`)}
              >
                Terminer
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Dropzone({
  disabled,
  onFiles,
}: {
  disabled?: boolean;
  onFiles: (files: FileList | null) => Promise<void> | void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOver, setIsOver] = useState(false);

  function openPicker() {
    if (disabled) return;
    inputRef.current?.click();
  }

  async function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    if (disabled) return;
    await onFiles(e.dataTransfer.files);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsOver(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
  }

  return (
    <div
      className={`ff-dropzone ${isOver ? "ff-dropzone--over" : ""} ${disabled ? "ff-dropzone--disabled" : ""}`}
      role="button"
      tabIndex={0}
      onClick={openPicker}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") openPicker();
      }}
      style={{ marginTop: 10 }}
    >
      <div className="ff-dropzone__title">Déposer ici</div>
      <div className="ff-dropzone__hint">Glissez-déposez ou cliquez pour sélectionner des fichiers</div>

      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        disabled={disabled}
        onChange={async (e) => {
          await onFiles(e.currentTarget.files);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
