"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const DOCS_TABLE = "formulaire_documents";
const FORMS_TABLE = "formulaires_fiscaux";

type DocRow = { id: string; original_name: string; created_at: string };

/* ===========================
   i18n (FR / EN / ES)
=========================== */

type Lang = "fr" | "en" | "es";

function normalizeLang(v: string): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? x : "fr";
}

const I18N = {
  fr: {
    pageTitle: "Envoyer le dossier",
    backToUpload: "← Retour dépôt",
    checkingTitle: "Vérification avant envoi",
    checkingDesc: "Vous devez avoir au moins 1 document téléversé.",
    loading: "Chargement…",
    docsLoading: "Chargement des documents…",
    noDocs: "Aucun document détecté.",
    docsDetected: (n: number) => `✅ Documents détectés : ${n}`,
    submitting: "Envoi…",
    submit: "Soumettre mon dossier",
    needOneDocBeforeSend: "Ajoutez au moins 1 document avant d’envoyer.",
    needOneDocBeforeSubmit: "Ajoutez au moins 1 document avant de soumettre.",
    submittedOk: "✅ Dossier soumis. Merci !",
    submitError: "Erreur lors de la soumission.",
    docsError: "❌ Erreur docs: ",
    missingFid: "❌ Dossier introuvable (fid manquant).",
  },
  en: {
    pageTitle: "Submit your file",
    backToUpload: "← Back to upload",
    checkingTitle: "Review before submitting",
    checkingDesc: "You must have at least 1 uploaded document.",
    loading: "Loading…",
    docsLoading: "Loading documents…",
    noDocs: "No documents detected.",
    docsDetected: (n: number) => `✅ Documents detected: ${n}`,
    submitting: "Submitting…",
    submit: "Submit my file",
    needOneDocBeforeSend: "Please upload at least 1 document before submitting.",
    needOneDocBeforeSubmit: "Please upload at least 1 document before submitting.",
    submittedOk: "✅ Submitted. Thank you!",
    submitError: "Submission error.",
    docsError: "❌ Docs error: ",
    missingFid: "❌ File not found (missing ID).",
  },
  es: {
    pageTitle: "Enviar el expediente",
    backToUpload: "← Volver a subida",
    checkingTitle: "Revisión antes de enviar",
    checkingDesc: "Debe haber al menos 1 documento subido.",
    loading: "Cargando…",
    docsLoading: "Cargando documentos…",
    noDocs: "No se detectaron documentos.",
    docsDetected: (n: number) => `✅ Documentos detectados: ${n}`,
    submitting: "Enviando…",
    submit: "Enviar mi expediente",
    needOneDocBeforeSend: "Sube al menos 1 documento antes de enviar.",
    needOneDocBeforeSubmit: "Sube al menos 1 documento antes de enviar.",
    submittedOk: "✅ Enviado. ¡Gracias!",
    submitError: "Error al enviar.",
    docsError: "❌ Error de documentos: ",
    missingFid: "❌ Expediente no encontrado (falta el ID).",
  },
} as const;

export default function EnvoyerDossierPage() {
  const router = useRouter();
  const params = useSearchParams();

  const fid = params.get("fid") || "";
  const lang = normalizeLang(params.get("lang") || "fr");
  const L = I18N[lang];

  const [userId, setUserId] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const docsCount = docs.length;

  const canSubmit = useMemo(
    () => !!fid && docsCount > 0 && !!userId && !submitting,
    [fid, docsCount, userId, submitting]
  );

  const loadDocs = useCallback(async (formulaireId: string) => {
    setLoadingDocs(true);

    const { data, error } = await supabase
      .from(DOCS_TABLE)
      .select("id, original_name, created_at")
      .eq("formulaire_id", formulaireId)
      .order("created_at", { ascending: false });

    setLoadingDocs(false);

    if (error) {
      setMsg(L.docsError + error.message);
      return;
    }

    setDocs((data as DocRow[]) || []);
  }, [L.docsError]);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!alive) return;

      if (error || !data.user) {
        setBooting(false);

        const next = `/envoyer-dossier?fid=${encodeURIComponent(fid)}&lang=${encodeURIComponent(lang)}`;
        router.replace(`/espace-client?lang=${encodeURIComponent(lang)}&next=${encodeURIComponent(next)}`);
        return;
      }

      setUserId(data.user.id);
      setBooting(false);

      if (fid) await loadDocs(fid);
      else setMsg(L.missingFid);
    })();

    return () => {
      alive = false;
    };
  }, [router, fid, lang, loadDocs, L.missingFid]);

  const submitFinal = useCallback(async () => {
    if (!fid || !userId) return;

    setSubmitting(true);
    setMsg(null);

    try {
      // re-check docs
      const { data: d, error: e1 } = await supabase
        .from(DOCS_TABLE)
        .select("id")
        .eq("formulaire_id", fid)
        .limit(1);

      if (e1) throw new Error(e1.message);
      if (!d || d.length === 0) throw new Error(L.needOneDocBeforeSend);

      const { error: e2 } = await supabase
        .from(FORMS_TABLE)
        .update({ status: "submitted" })
        .eq("id", fid)
        .eq("user_id", userId);

      if (e2) throw new Error(e2.message);

      setMsg(L.submittedOk);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : L.submitError;
      setMsg("❌ " + message);
    } finally {
      setSubmitting(false);
    }
  }, [fid, userId, L.needOneDocBeforeSend, L.submittedOk, L.submitError]);

  if (booting) {
    return (
      <main className="ff-bg">
        <div className="ff-container">
          <div style={{ padding: 24 }}>{L.loading}</div>
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
            <span>{L.pageTitle}</span>
          </div>

          <button
            className="ff-btn ff-btn-outline"
            type="button"
            onClick={() =>
              router.push(
                `/depot-documents?fid=${encodeURIComponent(fid)}&lang=${encodeURIComponent(lang)}`
              )
            }
          >
            {L.backToUpload}
          </button>
        </header>

        {msg && (
          <div className="ff-card" style={{ padding: 14 }}>
            {msg}
          </div>
        )}

        <section className="ff-card">
          <div className="ff-card-head">
            <h2>{L.checkingTitle}</h2>
            <p>{L.checkingDesc}</p>
          </div>

          {loadingDocs ? (
            <div className="ff-empty">{L.docsLoading}</div>
          ) : docsCount === 0 ? (
            <div className="ff-empty">{L.noDocs}</div>
          ) : (
            <div className="ff-empty">{L.docsDetected(docsCount)}</div>
          )}

          <div className="ff-submit">
            <button
              type="button"
              className="ff-btn ff-btn-primary ff-btn-big"
              disabled={!canSubmit}
              onClick={submitFinal}
            >
              {submitting ? L.submitting : L.submit}
            </button>

            {docsCount === 0 && <p className="ff-footnote">{L.needOneDocBeforeSubmit}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
