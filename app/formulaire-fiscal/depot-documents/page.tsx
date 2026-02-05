"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "../formulaire-fiscal.css";

const STORAGE_BUCKET = "client-documents";
const DOCS_TABLE = "formulaire_documents";

// ✅ Ta route réelle
const DEPOT_ROUTE = "/formulaire-fiscal/depot-documents";

type Lang = "fr" | "en" | "es";

function normalizeLang(v: string | null | undefined): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
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

function t(lang: Lang, fr: string, en: string, es: string) {
  return lang === "fr" ? fr : lang === "en" ? en : es;
}

export default function DepotDocumentsPage() {
  const router = useRouter();
  const params = useSearchParams();

  const fid = params.get("fid") || "";
  const type = params.get("type") || "T1"; // gardé si tu veux l’utiliser plus tard
  const lang = useMemo(() => resolveLang(params.get("lang")), [params]);

  const [booting, setBooting] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [msg, setMsg] = useState<string | null>(null);

  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    let alive = true;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!alive) return;

      if (error || !data.user) {
        setBooting(false);

        // ✅ retour exactement à la page dépôt (ta route réelle)
        const next = `${DEPOT_ROUTE}?fid=${encodeURIComponent(fid)}&type=${encodeURIComponent(
          type
        )}&lang=${encodeURIComponent(lang)}`;

        router.replace(`/espace-client?lang=${encodeURIComponent(lang)}&next=${encodeURIComponent(next)}`);
        return;
      }

      setUserId(data.user.id);
      setBooting(false);

      if (!fid) {
        setMsg("❌ " + t(lang, "fid manquant", "missing fid", "fid faltante"));
        return;
      }

      await loadDocs();
    })();

    return () => {
      alive = false;
    };
  }, [router, fid, type, lang, loadDocs]);

  const getSignedUrl = useCallback(async (path: string) => {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 10);
    if (error || !data?.signedUrl) throw new Error(error?.message || "Impossible d’ouvrir le fichier.");
    return data.signedUrl;
  }, []);

  const openDoc = useCallback(
    async (doc: DocRow) => {
      try {
        const url = await getSignedUrl(doc.storage_path);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Impossible d’ouvrir le fichier.";
        setMsg("❌ " + message);
      }
    },
    [getSignedUrl]
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
          const storagePath = `${userId}/${fid}/${Date.now()}-${clean}`;

          const up = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });
          if (up.error) throw new Error(up.error.message);

          const ins = await supabase.from(DOCS_TABLE).insert({
            formulaire_id: fid,
            user_id: userId,
            original_name: file.name, // on garde le vrai nom ici
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

  const docsCount = docs.length;

  if (booting) {
    return (
      <main className="ff-bg">
        <div className="ff-container">
          <div style={{ padding: 24 }}>{t(lang, "Chargement…", "Loading…", "Cargando…")}</div>
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
            <span>{t(lang, "Étape 2/3 — Dépôt de documents", "Step 2/3 — Upload documents", "Paso 2/3 — Subir documentos")}</span>
          </div>

          {/* ✅ Flow linéaire: pas de bouton Retour */}
          <div />
        </header>

        {msg && (
          <div className="ff-card" style={{ padding: 14 }}>
            {msg}
          </div>
        )}

        <section className="ff-card">
          <div className="ff-card-head">
            <h2>{t(lang, "Téléverser vos documents", "Upload your documents", "Suba sus documentos")}</h2>
            <p>{t(lang, "Formats acceptés: PDF, images, Office, ZIP.", "Accepted formats: PDF, images, Office, ZIP.", "Formatos: PDF, imágenes, Office, ZIP.")}</p>
          </div>

          <input type="file" multiple disabled={uploading || !userId || !fid} onChange={(e) => handleFiles(e.target.files)} />

          <div className="ff-mt">
            <div className="ff-subtitle">{t(lang, "Documents envoyés", "Uploaded documents", "Documentos subidos")}</div>

            {loadingDocs ? (
              <div className="ff-empty">{t(lang, "Chargement…", "Loading…", "Cargando…")}</div>
            ) : docsCount === 0 ? (
              <div className="ff-empty">{t(lang, "Aucun document.", "No documents yet.", "Aún no hay documentos.")}</div>
            ) : (
              <div className="ff-stack">
                {docs.map((d) => (
                  <div key={d.id} className="ff-rowbox" style={{ alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>{d.original_name}</div>
                      <div style={{ opacity: 0.75, fontSize: 12, wordBreak: "break-all" }}>{d.storage_path}</div>
                    </div>

                    <button type="button" className="ff-btn ff-btn-soft" onClick={() => openDoc(d)}>
                      {t(lang, "Ouvrir", "Open", "Abrir")}
                    </button>
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
              onClick={() => router.push(withLang("/formulaire-fiscal/envoyer-dossier", lang, { fid }))}
            >
              {t(lang, "Suivant : envoyer →", "Next: submit →", "Siguiente: enviar →")}
            </button>

            {docsCount === 0 && (
              <p className="ff-footnote">
                {t(lang, "Ajoutez au moins 1 document pour continuer.", "Upload at least 1 document to continue.", "Suba al menos 1 documento para continuar.")}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
