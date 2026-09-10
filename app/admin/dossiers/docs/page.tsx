"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";
import JSZip from "jszip";
import { supabase } from "@/lib/supabaseClient";

const STORAGE_BUCKET = "client-documents";
const DOCS_TABLE = "formulaire_documents";

type DocRow = {
  id: string;
  original_name: string;
  storage_path: string;
  created_at: string | null;
  analyse_ia: string | null;
  analyse_ia_updated_at: string | null;
};

type AnalyseResponse = {
  ok?: boolean;
  analyse?: string;
  error?: string;
};

type SyntheseResponse = {
  ok?: boolean;
  synthese?: string;
  error?: string;
};

function formatDate(iso: string | null): string {
  if (!iso) return "";

  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) {
    return iso;
  }

  return d.toLocaleString("fr-CA");
}

/* =========================================================
   FORMATS
========================================================= */

function isZip(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".zip");
}

function isDirectlyAnalysable(fileName: string): boolean {
  const name = fileName.toLowerCase();

  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    name.endsWith(".pdf") ||
    name.endsWith(".docx") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls")
  );
}

/*
 * Pour l'interface :
 * un ZIP est maintenant considéré comme analysable,
 * puisqu'on va extraire ses documents avant l'analyse.
 */
function canAnalyse(fileName: string): boolean {
  return (
    isDirectlyAnalysable(fileName) ||
    isZip(fileName)
  );
}

function mimeTypeFromName(fileName: string): string {
  const name = fileName.toLowerCase();

  if (name.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg")
  ) {
    return "image/jpeg";
  }

  if (name.endsWith(".png")) {
    return "image/png";
  }

  if (name.endsWith(".webp")) {
    return "image/webp";
  }

  if (name.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  if (name.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }

  if (name.endsWith(".xls")) {
    return "application/vnd.ms-excel";
  }

  return "application/octet-stream";
}

function cleanZipEntryName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

export default function AdminDossierDocsPage() {
  const sp = useSearchParams();

  const fid = useMemo(
    () => (sp.get("fid") ?? "").trim(),
    [sp]
  );

  const [msg, setMsg] =
    useState<string | null>(null);

  const [docs, setDocs] =
    useState<DocRow[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [analysingIds, setAnalysingIds] =
    useState<Record<string, boolean>>({});

  const [analyses, setAnalyses] =
    useState<Record<string, string>>({});

  const [analyseErrors, setAnalyseErrors] =
    useState<Record<string, string>>({});

  const [analysingAll, setAnalysingAll] =
    useState(false);

  const [synthesizing, setSynthesizing] =
    useState(false);

  const [synthese, setSynthese] =
    useState<string | null>(null);

  const [syntheseError, setSyntheseError] =
    useState<string | null>(null);

  const loadToken = useRef(0);

  // ==========================================
  // CHARGER LES DOCUMENTS
  // ==========================================

  const loadDocs = useCallback(async () => {
    if (!fid) return;

    const token = ++loadToken.current;

    setLoading(true);
    setMsg(null);

    const { data, error } = await supabase
      .from(DOCS_TABLE)
      .select(
        "id, original_name, storage_path, created_at, analyse_ia, analyse_ia_updated_at"
      )
      .eq("formulaire_id", fid)
      .order("created_at", {
        ascending: false,
      });

    if (token !== loadToken.current) {
      return;
    }

    setLoading(false);

    if (error) {
      setMsg("❌ " + error.message);
      setDocs([]);
      return;
    }

    const loadedDocs = (data ?? []) as DocRow[];

    setDocs(loadedDocs);

    // Recharger les analyses IA sauvegardées.
    const savedAnalyses: Record<string, string> = {};

    for (const doc of loadedDocs) {
      if (doc.analyse_ia?.trim()) {
        savedAnalyses[doc.id] = doc.analyse_ia;
      }
    }

    setAnalyses(savedAnalyses);
  }, [fid]);

  useEffect(() => {
    setDocs([]);
    setMsg(null);
    setAnalyses({});
    setAnalyseErrors({});
    setSynthese(null);
    setSyntheseError(null);

    if (!fid) return;

    void loadDocs();
  }, [fid, loadDocs]);

  // ==========================================
  // CRÉER UN LIEN SIGNÉ
  // ==========================================

  const getSignedUrl = useCallback(
    async (storagePath: string) => {
      const { data, error } =
        await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(
            storagePath,
            60 * 10
          );

      if (error || !data?.signedUrl) {
        throw new Error(
          error?.message ??
            "Impossible de créer le lien sécurisé."
        );
      }

      return data.signedUrl;
    },
    []
  );

  // ==========================================
  // OUVRIR UN DOCUMENT
  // ==========================================

  const openDoc = useCallback(
    async (storagePath: string) => {
      setMsg(null);

      try {
        const signedUrl =
          await getSignedUrl(storagePath);

        window.open(
          signedUrl,
          "_blank",
          "noopener,noreferrer"
        );
      } catch (error: unknown) {
        setMsg(
          "❌ " +
            (error instanceof Error
              ? error.message
              : "Impossible d'ouvrir le fichier.")
        );
      }
    },
    [getSignedUrl]
  );

  // ==========================================
  // APPELER L'API IA POUR UN DOCUMENT
  // ==========================================

  const callAnalyseApi = useCallback(
    async (
      fileUrl: string,
      fileName: string
    ): Promise<string> => {
      const response = await fetch(
        "/api/admin/analyse-document",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            fileUrl,
            fileName,
            fileType: mimeTypeFromName(fileName),
          }),
        }
      );

      let result: AnalyseResponse;

      try {
        result =
          (await response.json()) as AnalyseResponse;
      } catch {
        throw new Error(
          "Réponse invalide du serveur IA."
        );
      }

      if (
        !response.ok ||
        !result.ok ||
        !result.analyse
      ) {
        throw new Error(
          result.error ??
            "Impossible d'analyser ce document."
        );
      }

      return result.analyse;
    },
    []
  );

  // ==========================================
  // ANALYSER UN FICHIER NORMAL
  // ==========================================

  const analyseDirectFile = useCallback(
    async (doc: DocRow): Promise<string> => {
      const signedUrl =
        await getSignedUrl(
          doc.storage_path
        );

      return await callAnalyseApi(
        signedUrl,
        doc.original_name
      );
    },
    [getSignedUrl, callAnalyseApi]
  );

  // ==========================================
  // ANALYSER UN ZIP
  // ==========================================

  const analyseZip = useCallback(
    async (doc: DocRow): Promise<string> => {
      /*
       * 1. Télécharger le ZIP depuis Supabase.
       */
      const signedUrl =
        await getSignedUrl(
          doc.storage_path
        );

      const zipResponse =
        await fetch(signedUrl);

      if (!zipResponse.ok) {
        throw new Error(
          "Impossible de télécharger le fichier ZIP."
        );
      }

      const zipBuffer =
        await zipResponse.arrayBuffer();

      /*
       * 2. Ouvrir le ZIP.
       */
      let zip: JSZip;

      try {
        zip =
          await JSZip.loadAsync(
            zipBuffer
          );
      } catch {
        throw new Error(
          "Impossible d'ouvrir ce fichier ZIP."
        );
      }

      /*
       * 3. Chercher les PDF/images/DOCX/Excel analysables.
       */
      const entries =
        Object.values(zip.files).filter(
          (entry) => {
            if (entry.dir) {
              return false;
            }

            if (
              entry.name.includes(
                "__MACOSX/"
              )
            ) {
              return false;
            }

            const name =
              cleanZipEntryName(
                entry.name
              );

            if (
              name === ".DS_Store" ||
              name.startsWith("._")
            ) {
              return false;
            }

            return isDirectlyAnalysable(
              name
            );
          }
        );

      if (entries.length === 0) {
        throw new Error(
          "Ce ZIP ne contient aucun PDF, image, DOCX ou fichier Excel compatible avec l'analyse IA."
        );
      }

      const results: string[] = [];
      const errors: string[] = [];

      /*
       * 4. Analyser chaque document du ZIP.
       *
       * On les traite un par un pour éviter
       * de lancer trop d'appels IA simultanément.
       */
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        const fileName =
          cleanZipEntryName(
            entry.name
          );

        try {
          /*
           * Extraire le fichier.
           */
          const blob =
            await entry.async("blob");

          const typedBlob =
            new Blob(
              [blob],
              {
                type:
                  mimeTypeFromName(
                    fileName
                  ),
              }
            );

          /*
           * L'API actuelle travaille avec une URL.
           *
           * Une blob URL locale n'est pas accessible
           * par le serveur. On enregistre donc
           * temporairement le fichier extrait dans
           * Supabase Storage.
           */
          const safeName =
            fileName.replace(
              /[^\w.\-()\s]/g,
              "_"
            );

          const tempPath =
            `${fid}/__zip_ai_temp__/` +
            `${Date.now()}-` +
            `${Math.random()
              .toString(36)
              .slice(2, 8)}-` +
            `${safeName}`;

          const {
            data: uploadData,
            error: uploadError,
          } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(
              tempPath,
              typedBlob,
              {
                cacheControl: "3600",
                upsert: false,
                contentType:
                  mimeTypeFromName(
                    fileName
                  ),
              }
            );

          if (
            uploadError ||
            !uploadData?.path
          ) {
            throw new Error(
              uploadError?.message ??
                "Impossible de préparer ce document pour l'analyse."
            );
          }

          try {
            /*
             * Créer une URL signée du document extrait.
             */
            const extractedUrl =
              await getSignedUrl(
                uploadData.path
              );

            /*
             * Envoyer à l'API IA existante.
             */
            const analyse =
              await callAnalyseApi(
                extractedUrl,
                fileName
              );

            results.push(
              [
                "========================================",
                `DOCUMENT ${i + 1}/${entries.length}`,
                fileName,
                "========================================",
                "",
                analyse,
              ].join("\n")
            );
          } finally {
            /*
             * Supprimer le fichier temporaire,
             * même si l'analyse échoue.
             */
            await supabase.storage
              .from(STORAGE_BUCKET)
              .remove([
                uploadData.path,
              ]);
          }
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : "Erreur inconnue.";

          errors.push(
            `${fileName}: ${message}`
          );
        }
      }

      /*
       * Aucun fichier n'a pu être analysé.
       */
      if (results.length === 0) {
        throw new Error(
          errors.length > 0
            ? `Aucun document du ZIP n'a pu être analysé.\n${errors.join(
                "\n"
              )}`
            : "Aucun document du ZIP n'a pu être analysé."
        );
      }

      /*
       * 5. Construire le résultat complet du ZIP.
       */
      const header = [
        `📦 ZIP : ${doc.original_name}`,
        `Documents compatibles trouvés : ${entries.length}`,
        `Documents analysés : ${results.length}`,
      ];

      if (errors.length > 0) {
        header.push(
          `Documents en erreur : ${errors.length}`
        );
      }

      const output = [
        header.join("\n"),
        "",
        ...results,
      ];

      if (errors.length > 0) {
        output.push(
          "",
          "========================================",
          "DOCUMENTS NON ANALYSÉS",
          "========================================",
          ...errors
        );
      }

      return output.join("\n");
    },
    [
      fid,
      getSignedUrl,
      callAnalyseApi,
    ]
  );

  // ==========================================
  // ANALYSER UN DOCUMENT
  // ==========================================

  const analyseDoc = useCallback(
    async (doc: DocRow): Promise<boolean> => {
      if (!canAnalyse(doc.original_name)) {
        setAnalyseErrors((prev) => ({
          ...prev,
          [doc.id]:
            "Format non pris en charge pour le moment.",
        }));

        return false;
      }

      setAnalysingIds((prev) => ({
        ...prev,
        [doc.id]: true,
      }));

      setAnalyseErrors((prev) => {
        const next = { ...prev };
        delete next[doc.id];
        return next;
      });

      try {
        let analyse: string;

        if (isZip(doc.original_name)) {
          analyse =
            await analyseZip(doc);
        } else {
          analyse =
            await analyseDirectFile(
              doc
            );
        }

        // Sauvegarder l'analyse dans Supabase pour qu'elle survive à F5.
        const analysedAt = new Date().toISOString();

        const { error: saveError } = await supabase
          .from(DOCS_TABLE)
          .update({
            analyse_ia: analyse,
            analyse_ia_updated_at: analysedAt,
          })
          .eq("id", doc.id)
          .eq("formulaire_id", fid);

        if (saveError) {
          throw new Error(
            `Analyse terminée, mais impossible de la sauvegarder : ${saveError.message}`
          );
        }

        setAnalyses((prev) => ({
          ...prev,
          [doc.id]: analyse,
        }));

        setDocs((prev) =>
          prev.map((item) =>
            item.id === doc.id
              ? {
                  ...item,
                  analyse_ia: analyse,
                  analyse_ia_updated_at: analysedAt,
                }
              : item
          )
        );

        return true;
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erreur pendant l'analyse.";

        setAnalyseErrors((prev) => ({
          ...prev,
          [doc.id]: message,
        }));

        return false;
      } finally {
        setAnalysingIds((prev) => ({
          ...prev,
          [doc.id]: false,
        }));
      }
    },
    [
      fid,
      analyseDirectFile,
      analyseZip,
    ]
  );

  // ==========================================
  // ANALYSER TOUS LES DOCUMENTS
  // ==========================================

  const analyseAll = useCallback(
    async () => {
      if (analysingAll) return;

      const analysables =
        docs.filter((doc) =>
          canAnalyse(
            doc.original_name
          )
        );

      if (analysables.length === 0) {
        setMsg(
          "Aucun JPG, PNG, WEBP, PDF, DOCX, XLS, XLSX ou ZIP à analyser."
        );
        return;
      }

      setMsg(null);
      setAnalysingAll(true);

      let successCount = 0;

      try {
        /*
         * Toujours un par un.
         *
         * Cela évite de lancer plusieurs
         * dizaines d'appels IA en même temps.
         */
        for (const doc of analysables) {
          const ok =
            await analyseDoc(doc);

          if (ok) {
            successCount++;
          }
        }

        setMsg(
          `Analyse terminée : ${successCount}/${analysables.length} document(s) traité(s).`
        );
      } finally {
        setAnalysingAll(false);
      }
    },
    [
      docs,
      analyseDoc,
      analysingAll,
    ]
  );

  // ==========================================
  // SYNTHÈSE FINALE DU DOSSIER
  // ==========================================

  const syntheseFinale = useCallback(async () => {
    if (synthesizing || analysingAll) return;

    const documents = docs
      .map((doc) => ({
        id: doc.id,
        fileName: doc.original_name,
        analyse: analyses[doc.id] ?? "",
        error: analyseErrors[doc.id] ?? "",
      }))
      .filter((item) => item.analyse || item.error);

    if (documents.length === 0) {
      setSyntheseError(
        "Analysez d'abord les documents du dossier avant de produire la synthèse finale."
      );
      return;
    }

    setSynthesizing(true);
    setSyntheseError(null);
    setSynthese(null);

    try {
      const response = await fetch(
        "/api/admin/synthese-dossier",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fid, documents }),
        }
      );

      let result: SyntheseResponse;

      try {
        result = (await response.json()) as SyntheseResponse;
      } catch {
        throw new Error(
          "Réponse invalide du serveur pour la synthèse."
        );
      }

      if (!response.ok || !result.ok || !result.synthese) {
        throw new Error(
          result.error ??
            "Impossible de produire la synthèse finale."
        );
      }

      setSynthese(result.synthese);
    } catch (error: unknown) {
      setSyntheseError(
        error instanceof Error
          ? error.message
          : "Erreur pendant la synthèse finale."
      );
    } finally {
      setSynthesizing(false);
    }
  }, [
    fid,
    docs,
    analyses,
    analyseErrors,
    synthesizing,
    analysingAll,
  ]);

  // ==========================================
  // FID MANQUANT
  // ==========================================

  if (!fid) {
    return (
      <div style={{ padding: 16 }}>
        ❌ fid manquant
        (ex: /admin/dossiers/docs?fid=...)
      </div>
    );
  }

  const analysableCount =
    docs.filter((doc) =>
      canAnalyse(doc.original_name)
    ).length;

  // ==========================================
  // AFFICHAGE
  // ==========================================

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
      {/* EN-TÊTE */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Docs du dossier
          </h1>

          <div
            style={{
              opacity: 0.7,
              fontSize: 13,
            }}
          >
            fid: {fid}
          </div>
        </div>

        {analysableCount > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() =>
              void analyseAll()
            }
            disabled={analysingAll}
            style={{
              padding:
                "10px 16px",
              borderRadius: 10,
              border:
                "1px solid #1d4ed8",
              background:
                analysingAll
                  ? "#dbeafe"
                  : "#1d4ed8",
              color:
                analysingAll
                  ? "#1e40af"
                  : "white",
              fontWeight: 700,
              cursor:
                analysingAll
                  ? "wait"
                  : "pointer",
            }}
          >
            {analysingAll
              ? "Analyse en cours…"
              : `✨ Analyser tous (${analysableCount})`}
          </button>

          <button
            type="button"
            onClick={() => void syntheseFinale()}
            disabled={
              analysingAll ||
              synthesizing ||
              Object.keys(analyses).length === 0
            }
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #047857",
              background: synthesizing ? "#d1fae5" : "#059669",
              color: synthesizing ? "#065f46" : "white",
              fontWeight: 700,
              cursor:
                analysingAll || synthesizing || Object.keys(analyses).length === 0
                  ? "not-allowed"
                  : "pointer",
              opacity: Object.keys(analyses).length === 0 ? 0.55 : 1,
            }}
          >
            {synthesizing
              ? "Synthèse en cours…"
              : "🧾 Synthèse finale"}
          </button>
          </div>
        )}
      </div>

      {/* MESSAGE GLOBAL */}

      {msg && (
        <div
          style={{
            padding: 12,
            border:
              "1px solid #ddd",
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {msg}
        </div>
      )}

      {/* SYNTHÈSE FINALE */}

      {syntheseError && (
        <div
          style={{
            padding: 14,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
            borderRadius: 10,
            marginBottom: 14,
            whiteSpace: "pre-wrap",
          }}
        >
          ❌ {syntheseError}
        </div>
      )}

      {synthese && (
        <div
          style={{
            padding: 18,
            border: "2px solid #10b981",
            background: "#f0fdf4",
            borderRadius: 12,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: 18,
              color: "#065f46",
              marginBottom: 12,
            }}
          >
            🧾 Synthèse finale du dossier
          </div>

          <div
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.65,
              fontSize: 14,
              color: "#1f2937",
            }}
          >
            {synthese}
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 11,
              color: "#64748b",
            }}
          >
            Synthèse de travail à valider avant la production de la déclaration fiscale.
          </div>
        </div>
      )}

      {/* DOCUMENTS */}

      {loading ? (
        <div>Chargement…</div>
      ) : docs.length === 0 ? (
        <div>
          Aucun document pour ce dossier.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 14,
          }}
        >
          {docs.map((doc) => {
            const analysable =
              canAnalyse(
                doc.original_name
              );

            const analysing =
              Boolean(
                analysingIds[doc.id]
              );

            const analyse =
              analyses[doc.id];

            const analyseError =
              analyseErrors[doc.id];

            const zip =
              isZip(
                doc.original_name
              );

            return (
              <div
                key={doc.id}
                style={{
                  border:
                    "1px solid #ddd",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "white",
                }}
              >
                {/* DOCUMENT */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "flex-start",
                    gap: 16,
                    padding: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      minWidth: 0,
                      flex:
                        "1 1 400px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        wordBreak:
                          "break-word",
                      }}
                    >
                      {doc.original_name}
                    </div>

                    <div
                      style={{
                        opacity: 0.6,
                        fontSize: 12,
                        wordBreak:
                          "break-word",
                        marginTop: 3,
                      }}
                    >
                      {doc.storage_path}
                    </div>

                    {doc.created_at && (
                      <div
                        style={{
                          opacity: 0.6,
                          fontSize: 12,
                          marginTop: 5,
                        }}
                      >
                        {formatDate(
                          doc.created_at
                        )}
                      </div>
                    )}
                  </div>

                  {/* BOUTONS */}

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        void openDoc(
                          doc.storage_path
                        )
                      }
                      style={{
                        padding:
                          "8px 12px",
                        borderRadius: 8,
                        border:
                          "1px solid #ccc",
                        background:
                          "white",
                        cursor:
                          "pointer",
                      }}
                    >
                      Ouvrir
                    </button>

                    {analysable ? (
                      <button
                        type="button"
                        onClick={() =>
                          void analyseDoc(
                            doc
                          )
                        }
                        disabled={
                          analysing ||
                          analysingAll
                        }
                        style={{
                          padding:
                            "8px 12px",
                          borderRadius: 8,
                          border:
                            "1px solid #2563eb",
                          background:
                            analysing
                              ? "#dbeafe"
                              : "#eff6ff",
                          color:
                            "#1d4ed8",
                          fontWeight: 700,
                          cursor:
                            analysing ||
                            analysingAll
                              ? "wait"
                              : "pointer",
                        }}
                      >
                        {analysing
                          ? zip
                            ? "Décompression et analyse…"
                            : "Analyse…"
                          : analyse
                          ? "↻ Réanalyser"
                          : "✨ Analyser avec l'IA"}
                      </button>
                    ) : (
                      <div
                        style={{
                          padding:
                            "8px 10px",
                          fontSize: 12,
                          color:
                            "#64748b",
                        }}
                      >
                        IA bientôt pour ce format
                      </div>
                    )}
                  </div>
                </div>

                {/* ERREUR IA */}

                {analyseError && (
                  <div
                    style={{
                      margin:
                        "0 14px 14px",
                      padding: 12,
                      borderRadius: 8,
                      border:
                        "1px solid #fecaca",
                      background:
                        "#fef2f2",
                      color:
                        "#b91c1c",
                      fontSize: 14,
                      whiteSpace:
                        "pre-wrap",
                    }}
                  >
                    ❌ {analyseError}
                  </div>
                )}

                {/* RÉSULTAT IA */}

                {analyse && (
                  <div
                    style={{
                      borderTop:
                        "1px solid #dbeafe",
                      background:
                        "#f8fbff",
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        color:
                          "#1e3a8a",
                        marginBottom: 10,
                      }}
                    >
                      {zip
                        ? "✨ Analyse IA du ZIP"
                        : "✨ Analyse IA"}
                    </div>

                    <div
                      style={{
                        whiteSpace:
                          "pre-wrap",
                        lineHeight: 1.6,
                        fontSize: 14,
                        color:
                          "#1f2937",
                      }}
                    >
                      {analyse}
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        fontSize: 11,
                        color:
                          "#64748b",
                      }}
                    >
                      À valider avant
                      d'utiliser les
                      informations dans le
                      dossier fiscal.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
