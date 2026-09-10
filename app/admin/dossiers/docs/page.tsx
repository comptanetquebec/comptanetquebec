"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

type AnalyseResponse = {
  ok?: boolean;
  analyse?: string;
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

function canAnalyse(fileName: string): boolean {
  const name = fileName.toLowerCase();

  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    name.endsWith(".pdf")
  );
}

export default function AdminDossierDocsPage() {
  const sp = useSearchParams();

  const fid = useMemo(
    () => (sp.get("fid") ?? "").trim(),
    [sp]
  );

  const [msg, setMsg] = useState<string | null>(null);

  const [docs, setDocs] = useState<DocRow[]>([]);

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
        "id, original_name, storage_path, created_at"
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

    setDocs((data ?? []) as DocRow[]);
  }, [fid]);

  useEffect(() => {
    setDocs([]);
    setMsg(null);
    setAnalyses({});
    setAnalyseErrors({});

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
        const signedUrl =
          await getSignedUrl(
            doc.storage_path
          );

        const response = await fetch(
          "/api/admin/analyse-document",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              fileUrl: signedUrl,
              fileName: doc.original_name,
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

        setAnalyses((prev) => ({
          ...prev,
          [doc.id]: result.analyse as string,
        }));

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
    [getSignedUrl]
  );

  // ==========================================
  // ANALYSER TOUS LES DOCUMENTS
  // ==========================================

  const analyseAll = useCallback(
    async () => {
      if (analysingAll) return;

      const analysables =
        docs.filter((doc) =>
          canAnalyse(doc.original_name)
        );

      if (analysables.length === 0) {
        setMsg(
          "Aucun JPG, PNG, WEBP ou PDF à analyser."
        );
        return;
      }

      setMsg(null);
      setAnalysingAll(true);

      try {
        /*
         * On les analyse un par un.
         * C'est volontaire :
         * - moins de risque de surcharge;
         * - plus simple à suivre;
         * - une erreur n'arrête pas les autres.
         */
        for (const doc of analysables) {
          await analyseDoc(doc);
        }
      } finally {
        setAnalysingAll(false);
      }
    },
    [docs, analyseDoc, analysingAll]
  );

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
          justifyContent: "space-between",
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
          <button
            type="button"
            onClick={() =>
              void analyseAll()
            }
            disabled={analysingAll}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #1d4ed8",
              background: analysingAll
                ? "#dbeafe"
                : "#1d4ed8",
              color: analysingAll
                ? "#1e40af"
                : "white",
              fontWeight: 700,
              cursor: analysingAll
                ? "wait"
                : "pointer",
            }}
          >
            {analysingAll
              ? "Analyse en cours…"
              : `✨ Analyser tous (${analysableCount})`}
          </button>
        )}
      </div>

      {/* MESSAGE GLOBAL */}

      {msg && (
        <div
          style={{
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {msg}
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
                      flex: "1 1 400px",
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
                          ? "Analyse…"
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
                        IA bientôt pour ce
                        format
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
                      ✨ Analyse IA
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
