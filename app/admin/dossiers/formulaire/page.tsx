"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type PersonneNas = {
  prenom: string;
  nom: string;
  nas: string | null;
};

type IdentiteNas = {
  client: string | null;
  conjoint: string | null;
  personnesACharge: PersonneNas[];
};

type AnalyseResponse = {
  ok?: boolean;
  analyse?: string;
  identiteNas?: IdentiteNas;
  error?: string;
};

function routeForFormPresentiel(formType: string | null) {
  const t = (formType ?? "").toLowerCase();

  if (t === "t1" || t.includes("t1")) return "/formulaire-fiscal-presentiel-t1";
  if (t === "ta" || t.includes("autonome") || t.includes("travailleur")) {
    return "/formulaire-fiscal-presentiel-ta";
  }
  if (t === "t2" || t.includes("t2")) return "/formulaire-fiscal-presentiel-t2";

  return "/formulaire-fiscal-presentiel-t1";
}

function formatNas(nas: string | null | undefined) {
  const digits = (nas ?? "").replace(/\D+/g, "").slice(0, 9);
  if (!digits) return "Non fourni";
  if (digits.length !== 9) return nas ?? "Non fourni";
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`;
}

export default function AdminDossierFormulairePage() {
  const sp = useSearchParams();

  const fid = useMemo(() => (sp.get("fid") ?? "").trim(), [sp]);
  const formType = useMemo(() => (sp.get("type") ?? "t1").trim(), [sp]);
  const lang = useMemo(() => (sp.get("lang") ?? "fr").trim(), [sp]);

  const [analysing, setAnalysing] = useState(false);
  const [analyse, setAnalyse] = useState<string | null>(null);
  const [identiteNas, setIdentiteNas] = useState<IdentiteNas | null>(null);
  const [analyseError, setAnalyseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const formUrl = useMemo(() => {
    const base = routeForFormPresentiel(formType);
    return `${base}?fid=${encodeURIComponent(fid)}&lang=${encodeURIComponent(lang)}`;
  }, [fid, formType, lang]);

  const analyseFormulaire = useCallback(async () => {
    if (!fid || analysing) return;

    setAnalysing(true);
    setAnalyseError(null);

    try {
      const response = await fetch("/api/admin/analyse-formulaire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fid }),
      });

      let result: AnalyseResponse;

      try {
        result = (await response.json()) as AnalyseResponse;
      } catch {
        throw new Error("Réponse invalide du serveur IA.");
      }

      if (!response.ok || !result.ok || !result.analyse) {
        throw new Error(
          result.error ?? "Impossible d'analyser le formulaire."
        );
      }

      setAnalyse(result.analyse);
      setIdentiteNas(result.identiteNas ?? null);
    } catch (error: unknown) {
      setAnalyseError(
        error instanceof Error
          ? error.message
          : "Erreur pendant l'analyse IA du formulaire."
      );
    } finally {
      setAnalysing(false);
    }
  }, [fid, analysing]);

  const nasText = useMemo(() => {
    if (!identiteNas) return "";

    const lines: string[] = [
      "NAS — INFORMATIONS D'IDENTIFICATION",
      `Client : ${formatNas(identiteNas.client)}`,
    ];

    if (identiteNas.conjoint) {
      lines.push(`Conjoint : ${formatNas(identiteNas.conjoint)}`);
    }

    identiteNas.personnesACharge.forEach((personne, index) => {
      if (!personne.nas) return;
      const nom =
        [personne.prenom, personne.nom].filter(Boolean).join(" ").trim() ||
        `Personne à charge ${index + 1}`;
      lines.push(`${nom} : ${formatNas(personne.nas)}`);
    });

    return lines.join("\n");
  }, [identiteNas]);

  const copyAnalyse = useCallback(async () => {
    if (!analyse) return;

    const texteComplet = nasText
      ? `${nasText}\n\n${analyse}`
      : analyse;

    try {
      await navigator.clipboard.writeText(texteComplet);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setAnalyseError("Impossible de copier l'analyse.");
    }
  }, [analyse, nasText]);

  if (!fid) {
    return (
      <div style={{ padding: 16 }}>
        ❌ fid manquant
        (ex: /admin/dossiers/formulaire?fid=...)
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
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
            Formulaire du dossier
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

        <Link
          href={`/admin/dossiers/docs?fid=${encodeURIComponent(fid)}`}
          style={{
            padding: "9px 13px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            background: "white",
            color: "#334155",
            fontWeight: 700,
            textDecoration: "none",
            fontSize: 13,
          }}
        >
          📄 Voir les documents
        </Link>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          overflow: "hidden",
          background: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
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
                wordBreak: "break-word",
              }}
            >
              📋 Formulaire fiscal du client
            </div>

            <div
              style={{
                opacity: 0.6,
                fontSize: 12,
                marginTop: 5,
              }}
            >
              Type : {formType.toUpperCase()}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <Link
              href={formUrl}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #ccc",
                background: "white",
                color: "#111827",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Ouvrir
            </Link>

            <button
              type="button"
              onClick={() => void analyseFormulaire()}
              disabled={analysing}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #2563eb",
                background: analysing ? "#dbeafe" : "#eff6ff",
                color: "#1d4ed8",
                fontWeight: 700,
                cursor: analysing ? "wait" : "pointer",
              }}
            >
              {analysing
                ? "Analyse…"
                : analyse
                ? "↻ Réanalyser"
                : "✨ Analyser avec l'IA"}
            </button>
          </div>
        </div>

        {analyseError && (
          <div
            style={{
              margin: "0 14px 14px",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: 14,
              whiteSpace: "pre-wrap",
            }}
          >
            ❌ {analyseError}
          </div>
        )}

        {analyse && (
          <div
            style={{
              borderTop: "1px solid #dbeafe",
              background: "#f8fbff",
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  color: "#1e3a8a",
                }}
              >
                ✨ Analyse IA du formulaire
              </div>

              <button
                type="button"
                onClick={() => void copyAnalyse()}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #2563eb",
                  background: "white",
                  color: "#1d4ed8",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {copied ? "✓ Copiée" : "📋 Copier l'analyse"}
              </button>
            </div>

            {identiteNas && (
              <div
                style={{
                  marginBottom: 14,
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "white",
                  color: "#111827",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 6 }}>
                  🔒 NAS — affiché depuis le formulaire
                </div>

                <div>
                  <strong>Client :</strong> {formatNas(identiteNas.client)}
                </div>

                {identiteNas.conjoint && (
                  <div>
                    <strong>Conjoint :</strong>{" "}
                    {formatNas(identiteNas.conjoint)}
                  </div>
                )}

                {identiteNas.personnesACharge.map((personne, index) => {
                  if (!personne.nas) return null;

                  const nom =
                    [personne.prenom, personne.nom]
                      .filter(Boolean)
                      .join(" ")
                      .trim() || `Personne à charge ${index + 1}`;

                  return (
                    <div key={`${nom}-${index}`}>
                      <strong>{nom} :</strong> {formatNas(personne.nas)}
                    </div>
                  );
                })}

                <div
                  style={{
                    marginTop: 7,
                    fontSize: 11,
                    color: "#64748b",
                  }}
                >
                  Ces NAS proviennent directement du formulaire et ne sont pas
                  envoyés à l'IA.
                </div>
              </div>
            )}

            <div
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
                fontSize: 14,
                color: "#1f2937",
              }}
            >
              {analyse}
            </div>

            <div
              style={{
                marginTop: 12,
                fontSize: 11,
                color: "#64748b",
              }}
            >
              À valider avant d'utiliser les informations dans le dossier fiscal.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
