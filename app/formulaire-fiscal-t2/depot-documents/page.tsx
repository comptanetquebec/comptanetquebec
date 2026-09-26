"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import JSZip from "jszip";
import { supabase } from "@/lib/supabaseClient";

import "../formulaire-fiscal.css";
import Steps from "../Steps";
import RequireAuth from "../RequireAuth";

/* =========================================================
   Storage / DB
========================================================= */

const STORAGE_BUCKET = "client-documents";
const DOCS_TABLE = "formulaire_documents";

/* =========================================================
   Route T2
========================================================= */

const DEPOT_ROUTE = "/formulaire-fiscal-t2/depot-documents";

/* =========================================================
   Lang
========================================================= */

type Lang = "fr" | "en" | "es";

function normalizeLang(v?: string | null): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const m = document.cookie.match(
    new RegExp("(^| )" + name + "=([^;]+)")
  );

  return m ? decodeURIComponent(m[2]) : null;
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;

  document.cookie =
    `${name}=${encodeURIComponent(value)}; ` +
    "path=/; max-age=31536000; SameSite=Lax";
}

function resolveLang(urlLang: string | null): Lang {
  if (urlLang) {
    const l = normalizeLang(urlLang);
    setCookie("cq_lang", l);
    return l;
  }

  return normalizeLang(getCookie("cq_lang"));
}

function t(
  lang: Lang,
  fr: string,
  en: string,
  es: string
) {
  return lang === "fr" ? fr : lang === "en" ? en : es;
}

function errMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "string") return err || fallback;
  return fallback;
}

function withLang(
  path: string,
  lang: Lang,
  extra?: Record<string, string>
) {
  const qs = new URLSearchParams();
  qs.set("lang", lang);

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      qs.set(key, value);
    }
  }

  return `${path}?${qs.toString()}`;
}

/* =========================================================
   Types
========================================================= */

type DocRow = {
  id: string;
  original_name: string;
  storage_path: string;
  created_at: string;
};

type DocsSelectRow = {
  id: string;
  original_name: string;
  storage_path: string;
  created_at: string;
};

/* =========================================================
   Fichiers
========================================================= */

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

/*
 * Fichiers acceptés lorsqu'ils sont extraits d'un ZIP.
 * On n'extrait pas un ZIP à l'intérieur d'un autre ZIP.
 */
function isAllowedExtractedFile(name: string) {
  const n = name.toLowerCase();

  return (
    n.endsWith(".pdf") ||
    n.endsWith(".jpg") ||
    n.endsWith(".jpeg") ||
    n.endsWith(".png") ||
    n.endsWith(".doc") ||
    n.endsWith(".docx") ||
    n.endsWith(".xls") ||
    n.endsWith(".xlsx")
  );
}

function getMimeType(name: string) {
  const n = name.toLowerCase();

  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".doc")) return "application/msword";

  if (n.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  if (n.endsWith(".xls")) {
    return "application/vnd.ms-excel";
  }

  if (n.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }

  return "application/octet-stream";
}

function safeFilename(name: string) {
  return name.replace(/[^\w.\-()\s]/g, "_");
}

function uniq6() {
  return Math.random().toString(36).slice(2, 8);
}

/* =========================================================
   Page
========================================================= */

export default function DepotDocumentsT2Page() {
  const params = useSearchParams();

  const fid = (params.get("fid") || "").trim();
  const lang = useMemo(
    () => resolveLang(params.get("lang")),
    [params]
  );

  const nextPath = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("fid", fid);
    qs.set("type", "t2");
    qs.set("lang", lang);

    return `${DEPOT_ROUTE}?${qs.toString()}`;
  }, [fid, lang]);

  return (
    <RequireAuth lang={lang} nextPath={nextPath}>
      {(userId) => (
        <DepotDocumentsT2Inner
          userId={userId}
          fid={fid}
          lang={lang}
        />
      )}
    </RequireAuth>
  );
}

/* =========================================================
   Inner
========================================================= */

function DepotDocumentsT2Inner({
  userId,
  fid,
  lang,
}: {
  userId: string;
  fid: string;
  lang: Lang;
}) {
  const router = useRouter();

  const [msg, setMsg] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);

  const docsCount = docs.length;

  const disabledUpload =
    uploading || !userId || !fid;

  /* =======================================================
     Charger les documents
  ======================================================= */

  const loadDocs = useCallback(async () => {
    if (!fid) return;

    setLoadingDocs(true);
    setMsg(null);

    const { data, error } = await supabase
      .from(DOCS_TABLE)
      .select(
        "id, original_name, storage_path, created_at"
      )
      .eq("formulaire_id", fid)
      .order("created_at", { ascending: false });

    setLoadingDocs(false);

    if (error) {
      setMsg("❌ " + error.message);
      return;
    }

    const rows = (data ?? []) as DocsSelectRow[];

    setDocs(
      rows.map((r) => ({
        id: String(r.id),
        original_name: String(r.original_name),
        storage_path: String(r.storage_path),
        created_at: String(r.created_at),
      }))
    );
  }, [fid]);

  useEffect(() => {
    void loadDocs();
  }, [loadDocs]);

  /* =======================================================
     URL signée
  ======================================================= */

  const getSignedUrl = useCallback(
    async (path: string) => {
      const { data, error } =
        await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(path, 60 * 10);

      if (error || !data?.signedUrl) {
        throw new Error(
          error?.message ||
            t(
              lang,
              "Impossible d’ouvrir le fichier.",
              "Cannot open file.",
              "No se puede abrir el archivo."
            )
        );
      }

      return data.signedUrl;
    },
    [lang]
  );

  /* =======================================================
     Ouvrir document
  ======================================================= */

  const openDoc = useCallback(
    async (doc: DocRow) => {
      try {
        const url = await getSignedUrl(
          doc.storage_path
        );

        window.open(
          url,
          "_blank",
          "noopener,noreferrer"
        );
      } catch (e: unknown) {
        setMsg(
          "❌ " +
            errMessage(
              e,
              t(
                lang,
                "Impossible d’ouvrir le fichier.",
                "Cannot open file.",
                "No se puede abrir el archivo."
              )
            )
        );
      }
    },
    [getSignedUrl, lang]
  );

  /* =======================================================
     Upload
  ======================================================= */

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (!fid || !userId) return;

      setUploading(true);
      setMsg(null);

      try {
        let uploadedCount = 0;
        let ignoredCount = 0;

        /*
         * Upload d'un document individuel.
         * Utilisé pour les fichiers normaux et
         * pour les fichiers extraits d'un ZIP.
         */
        const uploadOneFile = async (
          file: File,
          originalName?: string
        ) => {
          const finalName =
            originalName || file.name;

          const clean =
            safeFilename(finalName);

          /*
           * On garde la structure T2 déjà utilisée :
           * userId / fid / fichier
           */
          const storagePath =
            `${userId}/${fid}/` +
            `${Date.now()}-` +
            `${uniq6()}-` +
            `${clean}`;

          const mimeType =
            file.type ||
            getMimeType(finalName);

          const {
            data: upData,
            error: upErr,
          } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: mimeType,
            });

          if (upErr) {
            throw new Error(upErr.message);
          }

          if (!upData?.path) {
            throw new Error(
              "Upload: path manquant."
            );
          }

          const { error: insErr } =
            await supabase
              .from(DOCS_TABLE)
              .insert({
                formulaire_id: fid,
                user_id: userId,
                original_name: finalName,
                storage_path: upData.path,
                mime_type: mimeType,
                size_bytes:
                  file.size || null,
              });

          /*
           * Si le fichier est dans Storage mais que
           * l'insertion DB échoue, on nettoie Storage.
           */
          if (insErr) {
            await supabase.storage
              .from(STORAGE_BUCKET)
              .remove([upData.path]);

            throw new Error(
              insErr.message
            );
          }

          uploadedCount++;
        };

        /* =================================================
           Parcourir les fichiers choisis
        ================================================= */

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

          const lowerName =
            file.name.toLowerCase();

          /* ===============================================
             ZIP
          =============================================== */

          if (lowerName.endsWith(".zip")) {
            let zip: JSZip;

            try {
              zip = await JSZip.loadAsync(file);
            } catch {
              throw new Error(
                t(
                  lang,
                  `Impossible d’ouvrir le fichier ZIP : ${file.name}`,
                  `Cannot open ZIP file: ${file.name}`,
                  `No se puede abrir el archivo ZIP: ${file.name}`
                )
              );
            }

            const entries =
              Object.values(zip.files);

            for (const entry of entries) {
              if (entry.dir) {
                continue;
              }

              /*
               * Fichiers système macOS.
               */
              if (
                entry.name.includes(
                  "__MACOSX/"
                )
              ) {
                continue;
              }

              const parts =
                entry.name.split("/");

              const extractedName =
                parts[parts.length - 1];

              if (!extractedName) {
                continue;
              }

              if (
                extractedName ===
                  ".DS_Store" ||
                extractedName.startsWith(
                  "._"
                )
              ) {
                continue;
              }

              if (
                !isAllowedExtractedFile(
                  extractedName
                )
              ) {
                ignoredCount++;
                continue;
              }

              const blob =
                await entry.async("blob");

              const extractedFile =
                new File(
                  [blob],
                  extractedName,
                  {
                    type: getMimeType(
                      extractedName
                    ),
                  }
                );

              await uploadOneFile(
                extractedFile,
                extractedName
              );
            }

            /*
             * Le ZIP original n'est pas envoyé :
             * seuls les documents qu'il contient
             * sont ajoutés au dossier.
             */
            continue;
          }

          /* ===============================================
             Fichier normal
          =============================================== */

          await uploadOneFile(file);
        }

        await loadDocs();

        /* =================================================
           Message résultat
        ================================================= */

        if (uploadedCount === 0) {
          setMsg(
            t(
              lang,
              "❌ Aucun fichier compatible trouvé.",
              "❌ No compatible files found.",
              "❌ No se encontraron archivos compatibles."
            )
          );

          return;
        }

        if (ignoredCount > 0) {
          setMsg(
            t(
              lang,
              `✅ ${uploadedCount} document(s) ajouté(s). ${ignoredCount} fichier(s) non compatible(s) ignoré(s).`,
              `✅ ${uploadedCount} document(s) uploaded. ${ignoredCount} unsupported file(s) ignored.`,
              `✅ ${uploadedCount} documento(s) subido(s). ${ignoredCount} archivo(s) no compatible(s) ignorado(s).`
            )
          );
        } else {
          setMsg(
            t(
              lang,
              `✅ ${uploadedCount} document(s) ajouté(s).`,
              `✅ ${uploadedCount} document(s) uploaded.`,
              `✅ ${uploadedCount} documento(s) subido(s).`
            )
          );
        }
      } catch (e: unknown) {
        setMsg(
          "❌ " +
            errMessage(
              e,
              t(
                lang,
                "Erreur lors du téléversement.",
                "Upload error.",
                "Error de subida."
              )
            )
        );
      } finally {
        setUploading(false);
      }
    },
    [
      fid,
      userId,
      loadDocs,
      lang,
    ]
  );

  /* =======================================================
     FID manquant
  ======================================================= */

  if (!fid) {
    return (
      <main className="ff-bg">
        <div className="ff-container">
          <div
            className="ff-card"
            style={{ padding: 14 }}
          >
            ❌{" "}
            {t(
              lang,
              "fid manquant",
              "missing fid",
              "fid faltante"
            )}
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="ff-bg">
      <div className="ff-container">

        {/* HEADER */}

        <header className="ff-header">
          <div className="ff-brand">
            <Image
              src="/logo-cq.png"
              alt="ComptaNet Québec"
              width={120}
              height={40}
              priority
              style={{
                height: 40,
                width: "auto",
              }}
            />

            <div className="ff-brand-text">
              <strong>
                ComptaNet Québec
              </strong>

              <span>
                {t(
                  lang,
                  "Étape 2/3 — Dépôt de documents T2",
                  "Step 2/3 — T2 document upload",
                  "Paso 2/3 — Documentos T2"
                )}
              </span>
            </div>
          </div>

          <div />
        </header>

        {/* STEPS */}

        <Steps
          step={2}
          lang={lang}
          flow="t2"
          fid={fid}
          type="t2"
        />

        {/* TITRE */}

        <div className="ff-title">
          <h1>
            {t(
              lang,
              "Dépôt de documents — Société (T2)",
              "Document upload — Corporation (T2)",
              "Carga de documentos — Empresa (T2)"
            )}
          </h1>

          <p>
            {t(
              lang,
              "Ajoutez les documents nécessaires à la préparation de votre déclaration de société. Vous pouvez envoyer plusieurs fichiers ou un fichier ZIP.",
              "Upload the documents required to prepare your corporate return. You may upload several files or one ZIP file.",
              "Suba los documentos necesarios para preparar la declaración de la empresa. Puede subir varios archivos o un archivo ZIP."
            )}
          </p>
        </div>

        {/* AIDE */}

        <section
          className="ff-card"
          style={{
            padding: 16,
            background: "#f8fafc",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 8 }}>
            {t(
              lang,
              "Documents utiles selon votre situation",
              "Useful documents depending on your situation",
              "Documentos útiles según su situación"
            )}
          </div>

          <div style={{ lineHeight: 1.7 }}>
            {t(
              lang,
              "Exemples : états financiers ou rapports comptables disponibles, relevés bancaires, factures de revenus et dépenses, informations sur les immobilisations, prêts et marges de crédit, T4/RL-1 et sommaires si salaires, T5/RL-3 si dividendes, ainsi que les documents TPS/TVQ lorsque applicable.",
              "Examples: available financial statements or accounting reports, bank statements, revenue and expense invoices, capital asset information, loans and lines of credit, T4/RL-1 slips and summaries if salaries were paid, T5/RL-3 slips if dividends were paid, and GST/QST documents when applicable.",
              "Ejemplos: estados financieros o informes contables disponibles, estados bancarios, facturas de ingresos y gastos, información sobre activos, préstamos y líneas de crédito, T4/RL-1 y resúmenes si hubo salarios, T5/RL-3 si hubo dividendos y documentos GST/QST cuando corresponda."
            )}
          </div>
        </section>

        {/* MESSAGE */}

        {msg && (
          <div
            className="ff-card"
            style={{ padding: 14 }}
          >
            {msg}
          </div>
        )}

        {/* CARTE */}

        <section className="ff-card">

          <div className="ff-card-head">
            <h2>
              {t(
                lang,
                "Téléverser vos documents",
                "Upload your documents",
                "Suba sus documentos"
              )}
            </h2>

            <p>
              {t(
                lang,
                "Formats acceptés : PDF, images, Word, Excel et ZIP.",
                "Accepted formats: PDF, images, Word, Excel and ZIP.",
                "Formatos aceptados: PDF, imágenes, Word, Excel y ZIP."
              )}
            </p>
          </div>

          {/* DROP */}

          <div className="ff-docs">
            <div
              className={`ff-drop ${
                disabledUpload
                  ? "ff-drop--disabled"
                  : ""
              }`}
            >
              <div className="ff-drop__text">

                <p className="ff-drop__title">
                  {t(
                    lang,
                    "Déposez vos fichiers ici",
                    "Drop your files here",
                    "Suelte sus archivos aquí"
                  )}
                </p>

                <p className="ff-drop__hint">
                  {t(
                    lang,
                    "PDF, JPG, PNG, Word, Excel ou ZIP.",
                    "PDF, JPG, PNG, Word, Excel or ZIP.",
                    "PDF, JPG, PNG, Word, Excel o ZIP."
                  )}
                </p>

              </div>

              <div className="ff-doc-actions">

                <label
                  className="ff-btn ff-btn-primary"
                  style={{
                    cursor:
                      disabledUpload
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {t(
                    lang,
                    "Choisir des fichiers",
                    "Choose files",
                    "Elegir archivos"
                  )}

                  <input
                    className="ff-file-input"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.zip,.doc,.docx,.xls,.xlsx"
                    disabled={disabledUpload}
                    onChange={(e) => {
                      void handleFiles(
                        e.target.files
                      );

                      e.currentTarget.value =
                        "";
                    }}
                  />
                </label>

                {uploading && (
                  <div className="ff-progress">
                    {t(
                      lang,
                      "Téléversement et traitement…",
                      "Uploading and processing…",
                      "Subiendo y procesando…"
                    )}
                  </div>
                )}

              </div>
            </div>

            <p className="ff-doc-note">
              {t(
                lang,
                "Astuce : si vous avez beaucoup de documents, vous pouvez les mettre dans un ZIP. Le système extrait automatiquement les documents compatibles.",
                "Tip: if you have many documents, you can place them in a ZIP file. Compatible documents are extracted automatically.",
                "Consejo: si tiene muchos documentos, puede ponerlos en un archivo ZIP. Los documentos compatibles se extraen automáticamente."
              )}
            </p>
          </div>

          {/* DOCUMENTS */}

          <div className="ff-mt">

            <div className="ff-subtitle">
              {t(
                lang,
                "Documents envoyés",
                "Uploaded documents",
                "Documentos subidos"
              )}

              {docsCount > 0
                ? ` (${docsCount})`
                : ""}
            </div>

            {loadingDocs ? (
              <div className="ff-empty">
                {t(
                  lang,
                  "Chargement…",
                  "Loading…",
                  "Cargando…"
                )}
              </div>
            ) : docsCount === 0 ? (
              <div className="ff-empty">
                {t(
                  lang,
                  "Aucun document.",
                  "No documents yet.",
                  "Aún no hay documentos."
                )}
              </div>
            ) : (
              <div className="ff-files">

                {docs.map((d) => (
                  <div
                    key={d.id}
                    className="ff-file"
                  >
                    <div className="ff-file__left">

                      <p className="ff-file__name">
                        {d.original_name}
                      </p>

                      <p className="ff-file__meta">
                        {t(
                          lang,
                          "Document reçu",
                          "Document received",
                          "Documento recibido"
                        )}
                      </p>

                    </div>

                    <div className="ff-file__right">

                      <button
                        type="button"
                        className="ff-btn ff-btn-soft"
                        onClick={() =>
                          void openDoc(d)
                        }
                      >
                        {t(
                          lang,
                          "Ouvrir",
                          "Open",
                          "Abrir"
                        )}
                      </button>

                    </div>
                  </div>
                ))}

              </div>
            )}

          </div>

          {/* SUIVANT */}

          <div className="ff-submit">

            <button
              type="button"
              className="ff-btn ff-btn-primary ff-btn-big"
              disabled={
                !fid ||
                docsCount === 0 ||
                uploading
              }
              onClick={() =>
                router.push(
                  withLang(
                    "/formulaire-fiscal-t2/envoyer-dossier",
                    lang,
                    {
                      fid,
                      type: "t2",
                    }
                  )
                )
              }
            >
              {t(
                lang,
                "Suivant : vérifier et envoyer →",
                "Next: review and submit →",
                "Siguiente: revisar y enviar →"
              )}
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
