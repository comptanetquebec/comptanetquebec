// app/formulaire-fiscal-t2/depot-documents/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import "../formulaire-fiscal.css";
import Steps from "../Steps";
import RequireAuth from "../RequireAuth";

/**
 * Storage / DB
 */
const STORAGE_BUCKET = "client-documents";
const DOCS_TABLE = "formulaire_documents";

/**
 * ✅ Route réelle T2 (unique)
 */
const DEPOT_ROUTE = "/formulaire-fiscal-t2/depot-documents";

/**
 * Lang
 */
type Lang = "fr" | "en" | "es";

function normalizeLang(v?: string | null): Lang {
  const l = (v || "").toLowerCase();
  return l === "fr" || l === "en" || l === "es" ? (l as Lang) : "fr";
}

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
}

function resolveLang(urlLang: string | null): Lang {
  if (urlLang) {
    const l = normalizeLang(urlLang);
    setCookie("cq_lang", l);
    return l;
  }
  return normalizeLang(getCookie("cq_lang"));
}

function withLang(path: string, lang: Lang, extra?: Record<string, string>) {
  const u = new URL(path, window.location.origin);
  u.searchParams.set("lang", lang);
  if (extra) for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  return u.pathname + u.search;
}

function t(lang: Lang, fr: string, en: string, es: string) {
  return lang === "fr" ? fr : lang === "en" ? en : es;
}

type DocRow = {
  id: string;
  original_name: string;
  storage_path: string;
  created_at: string;
};

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

function safeFilename(name: string) {
  return name.replace(/[^\w.\-()\s]/g, "_");
}

export default function DepotDocumentsT2Page() {
  const params = useSearchParams();

  const fid = (params.get("fid") || "").trim();

  // ✅ type forcé T2
  const type = "t2";

  const lang = useMemo(() => resolveLang(params.get("lang")), [params]);

  const nextPath = useMemo(() => {
    // retour EXACT ici après login
    const u = new URL(DEPOT_ROUTE, window.location.origin);
    u.searchParams.set("fid", fid);
    u.searchParams.set("type", type);
    u.searchParams.set("lang", lang);
    return u.pathname + u.search;
  }, [fid, type, lang]);

  return (
    <RequireAuth lang={lang} nextPath={nextPath}>
      {(userId) => <DepotDocumentsT2Inner userId={userId} fid={fid} lang={lang} />}
    </RequireAuth>
  );
}

function DepotDocumentsT2Inner({ userId, fid, lang }: { userId: string; fid: string; lang: Lang }) {
  const router = useRouter();

  const [msg, setMsg] = useState<string | null>(null);

  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);

  const docsCount = docs.length;
  const disabledUpload = uploading || !userId || !fid;

  const loadDocs = useCallback(async () => {
    if (!fid) return;

    setLoadingDocs(true);

    const { data, error } = await supabase
      .from(DOCS_TABLE)
      .select("id, original_name, storage_path, created_at")
      .eq("formulaire_id", fid)
      .order("created_at", { ascending: false });

    setLoadingDocs(false);

    if (error) {
      setMsg("❌ " + error.message);
      return;
    }

    setDocs((data as DocRow[]) || []);
  }, [fid]);

  useEffect(() => {
    void loadDocs();
  }, [loadDocs]);

  const getSignedUrl = useCallback(
    async (path: string) => {
      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 10);
      if (error || !data?.signedUrl) {
        throw new Error(
          error?.message ||
            t(lang, "Impossible d’ouvrir le fichier.", "Cannot open file.", "No se puede abrir el archivo.")
        );
      }
      return data.signedUrl;
    },
    [lang]
  );

  const openDoc = useCallback(
    async (doc: DocRow) => {
      try {
        const url = await getSignedUrl(doc.storage_path);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (e: unknown) {
        const message =
          e instanceof Error
            ? e.message
            : t(lang, "Impossible d’ouvrir le fichier.", "Cannot open file.", "No se puede abrir el archivo.");
        setMsg("❌ " + message);
      }
    },
    [getSignedUrl, lang]
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (!fid || !userId) return;

      setUploading(true);
      setMsg(null);

      try {
        for (const file of Array.from(files)) {
          if (!isAllowedFile(file)) {
            throw new Error(
              t(
                lang,
                `Type de fichier refusé: ${file.name}`,
                `File type not allowed: ${file.name}`,
                `Tipo de archivo no permitido: ${file.name}`
              )
            );
          }

          const clean = safeFilename(file.name);
          const uniq = Math.random().toString(36).slice(2, 8);
          const storagePath = `${userId}/${fid}/${Date.now()}-${uniq}-${clean}`;

          const up = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });
          if (up.error) throw new Error(up.error.message);

          const ins = await supabase.from(DOCS_TABLE).insert({
            formulaire_id: fid,
            user_id: userId,
            original_name: file.name,
            storage_path: storagePath,
            mime_type: file.type || null,
            size_bytes: file.size || null,
          });
          if (ins.error) throw new Error(ins.error.message);
        }

        setMsg(t(lang, "✅ Upload terminé.", "✅ Upload complete.", "✅ Subida completada."));
        await loadDocs();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : t(lang, "Erreur upload.", "Upload error.", "Error de subida.");
        setMsg("❌ " + message);
      } finally {
        setUploading(false);
      }
    },
    [fid, userId, loadDocs, lang]
  );

  if (!fid) {
    return (
      <main className="ff-bg">
        <div className="ff-container">
          <div className="ff-card" style={{ padding: 14 }}>
            ❌ {t(lang, "fid manquant", "missing fid", "fid faltante")}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="ff-bg">
      <div className="ff-container">
        {/* Header identique */}
        <header className="ff-header">
          <div className="ff-brand">
            <Image
              src="/logo-cq.png"
              alt="ComptaNet Québec"
              width={120}
              height={40}
              priority
              style={{ height: 40, width: "auto" }}
            />
            <div className="ff-brand-text">
              <strong>ComptaNet Québec</strong>
              <span>
                {t(
                  lang,
                  "Étape 2/3 — Dépôt de documents (T2)",
                  "Step 2/3 — Upload documents (T2)",
                  "Paso 2/3 — Subir documentos (T2)"
                )}
              </span>
            </div>
          </div>
          <div />
        </header>

        <Steps step={2} lang={lang} />

        <div className="ff-title">
          <h1>{t(lang, "Dépôt de documents (T2)", "Document upload (T2)", "Subida de documentos (T2)")}</h1>
          <p>
            {t(
              lang,
              "Ajoutez ici tous les documents nécessaires à la préparation de votre déclaration de société (T2).",
              "Upload all documents required to prepare your corporate return (T2).",
              "Suba los documentos necesarios para preparar la declaración de sociedad (T2)."
            )}
          </p>
        </div>

        {msg && (
          <div className="ff-card" style={{ padding: 14 }}>
            {msg}
          </div>
        )}

        <section className="ff-card">
          <div className="ff-card-head">
            <h2>{t(lang, "Téléverser vos documents", "Upload your documents", "Suba sus documentos")}</h2>
            <p>
              {t(
                lang,
                "Formats acceptés: PDF, images, Office, ZIP.",
                "Accepted formats: PDF, images, Office, ZIP.",
                "Formatos: PDF, imágenes, Office, ZIP."
              )}
            </p>
          </div>

          {/* Upload stylé */}
          <div className="ff-docs">
            <div className={`ff-drop ${disabledUpload ? "ff-drop--disabled" : ""}`}>
              <div className="ff-drop__text">
                <p className="ff-drop__title">
                  {t(lang, "Déposez vos fichiers ici", "Drop your files here", "Suelte sus archivos aquí")}
                </p>
                <p className="ff-drop__hint">
                  {t(lang, "PDF, images, Office, ZIP.", "PDF, images, Office, ZIP.", "PDF, imágenes, Office, ZIP.")}
                </p>
              </div>

              <div className="ff-doc-actions">
                <label className="ff-btn ff-btn-primary" style={{ cursor: disabledUpload ? "not-allowed" : "pointer" }}>
                  {t(lang, "Choisir des fichiers", "Choose files", "Elegir archivos")}
                  <input
                    className="ff-file-input"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.zip,.doc,.docx,.xls,.xlsx"
                    disabled={disabledUpload}
                    onChange={(e) => {
                      void handleFiles(e.target.files);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>

                {uploading && <div className="ff-progress">{t(lang, "Téléversement…", "Uploading…", "Subiendo…")}</div>}
              </div>
            </div>

            <p className="ff-doc-note">
              {t(
                lang,
                "Astuce: vous pouvez téléverser plusieurs fichiers d’un coup.",
                "Tip: you can upload multiple files at once.",
                "Consejo: puede subir varios archivos a la vez."
              )}
            </p>
          </div>

          <div className="ff-mt">
            <div className="ff-subtitle">
              {t(lang, "Documents envoyés", "Uploaded documents", "Documentos subidos")}
              {docsCount > 0 ? ` (${docsCount})` : ""}
            </div>

            {loadingDocs ? (
              <div className="ff-empty">{t(lang, "Chargement…", "Loading…", "Cargando…")}</div>
            ) : docsCount === 0 ? (
              <div className="ff-empty">{t(lang, "Aucun document.", "No documents yet.", "Aún no hay documentos.")}</div>
            ) : (
              <div className="ff-files">
                {docs.map((d) => (
                  <div key={d.id} className="ff-file">
                    <div className="ff-file__left">
                      <p className="ff-file__name">{d.original_name}</p>
                      <p className="ff-file__meta">{d.storage_path}</p>
                    </div>

                    <div className="ff-file__right">
                      <button type="button" className="ff-btn ff-btn-soft" onClick={() => void openDoc(d)}>
                        {t(lang, "Ouvrir", "Open", "Abrir")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ff-submit">
            <button
              type="button"
              className="ff-btn ff-btn-primary ff-btn-big"
              disabled={!fid || docsCount === 0}
              onClick={() => router.push(withLang("/formulaire-fiscal-t2/envoyer-dossier", lang, { fid, type: "t2" }))}
            >
              {t(lang, "Suivant : envoyer →", "Next: submit →", "Siguiente: enviar →")}
            </button>

            {docsCount === 0 && (
              <p className="ff-footnote">
                {t(
                  lang,
                  "Ajoutez au moins 1 document pour continuer.",
                  "Upload at least 1 document to continue.",
                  "Suba al menos 1 documento para continuar."
                )}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
