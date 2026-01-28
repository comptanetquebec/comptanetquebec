"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "../formulaire-fiscal/formulaire-fiscal.css";

const STORAGE_BUCKET = "client-documents";
const DOCS_TABLE = "formulaire_documents";
const FORMS_TABLE = "formulaires_fiscaux"; // optionnel: valider que fid appartient au user

type DocRow = {
  id: string;
  formulaire_id: string;
  user_id: string;
  file_name: string | null;
  file_path: string;
  created_at: string;
};

function titleFromType(type: string) {
  const t = (type || "").toLowerCase();
  if (t === "autonome") return "Travailleur autonome (T1)";
  if (t === "t2") return "Société (T2)";
  return "Particulier (T1)";
}

function safeFilename(name: string) {
  return name.replace(/[^\w.\-()\s]/g, "_").trim();
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

export default function DepotDocumentsPage() {
  const router = useRouter();
  const params = useSearchParams();

  const fid = useMemo(() => (params.get("fid") || "").trim(), [params]);
  const type = useMemo(() => (params.get("type") || "t1").trim(), [params]);
  const lang = useMemo(() => (params.get("lang") || "fr").trim(), [params]);

  const [booting, setBooting] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [msg, setMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docs, setDocs] = useState<DocRow[]>([]);

  const title = useMemo(() => titleFromType(type), [type]);

  const loadDocs = useCallback(async (formulaireId: string) => {
    if (!formulaireId) return;

    setDocsLoading(true);
    setMsg(null);

    const { data, error } = await supabase
      .from(DOCS_TABLE)
      .select("id, formulaire_id, user_id, file_name, file_path, created_at")
      .eq("formulaire_id", formulaireId)
      .order("created_at", { ascending: false });

    setDocsLoading(false);

    if (error) {
      setMsg(`Erreur docs: ${error.message}`);
      return;
    }

    setDocs(((data ?? []) as DocRow[]) || []);
  }, []);

  const ensureFidBelongsToUser = useCallback(async (uid: string, formulaireId: string) => {
    const { data, error } = await supabase
      .from(FORMS_TABLE)
      .select("id, user_id")
      .eq("id", formulaireId)
      .maybeSingle<{ id: string; user_id: string }>();

    if (error) throw new Error(error.message);
    if (!data?.id) throw new Error("Dossier introuvable.");
    if (data.user_id !== uid) throw new Error("Accès refusé à ce dossier.");
  }, []);

  const uploadOne = useCallback(
    async (file: File) => {
      if (!userId) throw new Error("Veuillez vous reconnecter.");
      if (!fid) throw new Error("ID dossier manquant.");
      if (!isAllowedFile(file)) throw new Error("Format non accepté (PDF, JPG, PNG, ZIP, Word, Excel).");
      if (file.size > 50 * 1024 * 1024) throw new Error("Fichier trop lourd (max 50 MB).");

      const safe = safeFilename(file.name);
      const file_path = `${userId}/${fid}/${Date.now()}-${safe}`;

      // 1) Upload storage
      const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(file_path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

      if (upErr) throw new Error(`Upload: ${upErr.message}`);

      // 2) Insert DB (aligné avec ta table)
      const { error: dbErr } = await supabase.from(DOCS_TABLE).insert({
        formulaire_id: fid,
        user_id: userId,
        file_path,
        file_name: file.name,
      });

      if (dbErr) {
        // nettoyage: si DB échoue, on retire le fichier pour éviter les orphans
        await supabase.storage.from(STORAGE_BUCKET).remove([file_path]);
        throw new Error(`DB: ${dbErr.message}`);
      }
    },
    [userId, fid]
  );

  const handleUploadFiles = useCallback(
    async (fileList: FileList | null) => {
      setMsg(null);
      if (!fileList || fileList.length === 0) return;

      setUploading(true);
      try {
        const files = Array.from(fileList);
        for (const f of files) {
          await uploadOne(f);
        }
        await loadDocs(fid);
        setMsg("✅ Documents téléversés.");
      } catch (err: unknown) {
        setMsg(err instanceof Error ? err.message : "Erreur upload.");
      } finally {
        setUploading(false);
      }
    },
    [fid, loadDocs, uploadOne]
  );

  const getSignedUrl = useCallback(async (path: string) => {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 10);
    if (error || !data?.signedUrl) throw new Error(error?.message || "Impossible d’ouvrir le fichier.");
    return data.signedUrl;
  }, []);

  const openDoc = useCallback(
    async (doc: DocRow) => {
      try {
        const url = await getSignedUrl(doc.file_path);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (e: unknown) {
        setMsg(e instanceof Error ? e.message : "Impossible d’ouvrir le fichier.");
      }
    },
    [getSignedUrl]
  );

  // Auth guard + init
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!fid) {
          if (!alive) return;
          setBooting(false);
          return;
        }

        const { data, error } = await supabase.auth.getUser();
        if (!alive) return;

        if (error || !data.user) {
          const next = `/depot-documents?fid=${encodeURIComponent(fid)}&type=${encodeURIComponent(
            type
          )}&lang=${encodeURIComponent(lang)}`;
          setBooting(false);
          router.replace(`/espace-client?lang=${encodeURIComponent(lang)}&next=${encodeURIComponent(next)}`);
          return;
        }

        const uid = data.user.id;
        setUserId(uid);

        await ensureFidBelongsToUser(uid, fid);
        await loadDocs(fid);

        if (!alive) return;
        setBooting(false);
      } catch (e: unknown) {
        if (!alive) return;
        setMsg(e instanceof Error ? e.message : "Erreur.");
        setBooting(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, fid, type, lang, loadDocs, ensureFidBelongsToUser]);

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
                      <div
                        style={{
                          fontWeight: 700,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {d.file_name ?? d.file_path}
                      </div>
                      <div style={{ opacity: 0.8, fontSize: 13 }}>
                        {new Date(d.created_at).toLocaleString()}
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

  const openPicker = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOver(false);
      if (disabled) return;
      await onFiles(e.dataTransfer.files);
    },
    [disabled, onFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
  }, []);

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
      aria-disabled={disabled ? "true" : "false"}
    >
      <div className="ff-dropzone__title">Déposer ici</div>
      <div className="ff-dropzone__hint">Glissez-déposez ou cliquez pour sélectionner des fichiers</div>

      <div className="ff-mt-sm" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="ff-btn ff-btn-soft" disabled={disabled} onClick={openPicker}>
          Choisir des fichiers
        </button>
      </div>

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
