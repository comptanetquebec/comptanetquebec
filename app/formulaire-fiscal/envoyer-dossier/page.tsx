"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import "../formulaire-fiscal.css";
import Steps from "../Steps";
import RequireAuth from "../RequireAuth";

/**
 * Tables
 */
const DOCS_TABLE = "formulaire_documents";
const FORMS_TABLE = "formulaires_fiscaux";

/**
 * Stripe checkout API (adapte si ton endpoint diffère)
 */
const CHECKOUT_API = "/api/stripe/checkout";

/**
 * Lang
 */
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

function setCookie(name: string, value: Lang) {
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

type DocRow = { id: string; original_name: string; created_at: string };

// ✅ On lit cq_id ici
type FormRowLite = {
  id: string;
  cq_id: string | null;
  status: string | null;
  form_type: string | null;
};

export default function EnvoyerDossierPage() {
  const router = useRouter();
  const params = useSearchParams();

  const fid = params.get("fid") || "";
  const type = params.get("type") || "T1";
  const lang = useMemo(() => resolveLang(params.get("lang")), [params]);

  // IMPORTANT: nextPath doit être EXACT pour revenir ici après login
  const nextPath = useMemo(() => {
    const u = new URL("/formulaire-fiscal/envoyer-dossier", window.location.origin);
    u.searchParams.set("fid", fid);
    u.searchParams.set("type", type);
    u.searchParams.set("lang", lang);
    return u.pathname + u.search;
  }, [fid, type, lang]);

  return (
    <RequireAuth lang={lang} nextPath={nextPath}>
      {(userId) => <EnvoyerDossierInner userId={userId} fid={fid} type={type} lang={lang} />}
    </RequireAuth>
  );
}

function EnvoyerDossierInner({
  userId,
  fid,
  type,
  lang,
}: {
  userId: string;
  fid: string;
  type: string;
  lang: Lang;
}) {
  const router = useRouter();

  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [cqId, setCqId] = useState<string | null>(null);
  const [loadingForm, setLoadingForm] = useState(false);

  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const docsCount = docs.length;

  const loadDocs = useCallback(async () => {
    if (!fid) return;

    setLoadingDocs(true);

    const { data, error } = await supabase
      .from(DOCS_TABLE)
      .select("id, original_name, created_at")
      .eq("formulaire_id", fid)
      .order("created_at", { ascending: false });

    setLoadingDocs(false);

    if (error) {
      setMsg("❌ " + error.message);
      return;
    }

    setDocs((data as DocRow[]) || []);
  }, [fid]);

  // ✅ Charge cq_id depuis le dossier
  const loadForm = useCallback(async () => {
    if (!fid) return;

    setLoadingForm(true);

    const { data, error } = await supabase
      .from(FORMS_TABLE)
      .select("id, cq_id, status, form_type")
      .eq("id", fid)
      .eq("user_id", userId)
      .single<FormRowLite>();

    setLoadingForm(false);

    if (error) {
      setMsg("❌ " + error.message);
      return;
    }

    // cq_id est généré côté DB à l’INSERT
    setCqId(data?.cq_id ?? null);
  }, [fid, userId]);

  useEffect(() => {
    void loadDocs();
    void loadForm();
  }, [loadDocs, loadForm]);

  const startCheckout = useCallback(async () => {
    if (!fid || !userId) return;

    setSubmitting(true);
    setMsg(null);

    try {
      // 1) Vérifier qu'il y a au moins 1 doc (source de vérité DB)
      const { data: d, error: e1 } = await supabase
        .from(DOCS_TABLE)
        .select("id")
        .eq("formulaire_id", fid)
        .limit(1);

      if (e1) throw new Error(e1.message);

      if (!d || d.length === 0) {
        throw new Error(
          t(
            lang,
            "Ajoutez au moins 1 document avant de continuer.",
            "Upload at least 1 document before continuing.",
            "Suba al menos 1 documento antes de continuar."
          )
        );
      }

      // 2) Statut prêt au paiement (PAS submitted)
      const { error: e2 } = await supabase
        .from(FORMS_TABLE)
        .update({ status: "ready_for_payment" })
        .eq("id", fid)
        .eq("user_id", userId);

      if (e2) throw new Error(e2.message);

      // 3) Stripe Checkout (server)
      const res = await fetch(CHECKOUT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ tu peux envoyer cq_id au serveur si tu veux l'afficher dans Stripe metadata (optionnel)
        body: JSON.stringify({ fid, type: type.toLowerCase(), lang, cqId }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Stripe error");
      }

      const json: { url?: string } = await res.json();
      if (!json.url) throw new Error("Missing Stripe URL");

      window.location.href = json.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur";
      setMsg("❌ " + message);
    } finally {
      setSubmitting(false);
    }
  }, [fid, userId, type, lang, cqId]);

  const goBackUpload = useCallback(() => {
    router.push(withLang("/formulaire-fiscal/depot-documents", lang, { fid, type }));
  }, [router, lang, fid, type]);

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
        {/* Header pro identique */}
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
                {t(lang, "Étape 3/3 — Paiement & envoi", "Step 3/3 — Payment & submission", "Paso 3/3 — Pago y envío")}
              </span>
            </div>
          </div>

          <button className="ff-btn ff-btn-outline" type="button" onClick={goBackUpload}>
            ← {t(lang, "Retour dépôt", "Back to upload", "Volver a subida")}
          </button>
        </header>

        <Steps step={3} lang={lang} />

        <div className="ff-title">
          <h1>{t(lang, "Résumé et paiement", "Summary & payment", "Resumen y pago")}</h1>
          <p>
            {t(
              lang,
              "Vérifiez votre dossier, puis procédez au paiement sécurisé pour soumettre.",
              "Review your file, then proceed to secure payment to submit.",
              "Revise su expediente y luego proceda al pago seguro para enviar."
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
            <h2>{t(lang, "Résumé du dossier", "File summary", "Resumen del expediente")}</h2>
            <p>
              {t(
                lang,
                "Vérification automatique des documents.",
                "Automatic document check.",
                "Verificación automática de documentos."
              )}
            </p>
          </div>

          <div className="ff-grid2">
            <div className="ff-field">
              <div className="ff-label">{t(lang, "Numéro de dossier (CQ)", "File number (CQ)", "Número de expediente (CQ)")}</div>
              <div className="ff-empty" style={{ borderStyle: "solid" }}>
                {loadingForm
                  ? t(lang, "Chargement…", "Loading…", "Cargando…")
                  : cqId || t(lang, "Non disponible", "Not available", "No disponible")}
              </div>
            </div>

            <div className="ff-field">
              <div className="ff-label">{t(lang, "Type", "Type", "Tipo")}</div>
              <div className="ff-empty" style={{ borderStyle: "solid" }}>
                {type}
              </div>
            </div>
          </div>

          {/* (Optionnel) garder le fid technique mais discret */}
          <div className="ff-mt">
            <div className="ff-footnote">
              {t(lang, "Identifiant interne :", "Internal id:", "Id interno:")} {fid}
            </div>
          </div>

          <div className="ff-mt">
            {loadingDocs ? (
              <div className="ff-empty">{t(lang, "Chargement des documents…", "Loading documents…", "Cargando documentos…")}</div>
            ) : docsCount === 0 ? (
              <div className="ff-empty">
                {t(
                  lang,
                  "Aucun document détecté. Retournez au dépôt.",
                  "No documents detected. Go back to upload.",
                  "No se detectaron documentos. Vuelva a subir."
                )}
              </div>
            ) : (
              <div className="ff-empty" style={{ borderStyle: "solid" }}>
                ✅ {t(lang, "Documents détectés", "Documents detected", "Documentos detectados")} : {docsCount}
              </div>
            )}
          </div>

          <div className="ff-mt">
            <label className="ff-check">
              <input
                className="ff-checkbox"
                type="checkbox"
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
              />
              {t(
                lang,
                "Je confirme que les informations sont exactes et que les documents sont complets.",
                "I confirm the information is accurate and documents are complete.",
                "Confirmo que la información es correcta y los documentos están completos."
              )}
            </label>
          </div>

          <div className="ff-submit" style={{ marginTop: 14 }}>
            <button
              type="button"
              className="ff-btn ff-btn-primary ff-btn-big"
              disabled={!fid || !userId || docsCount === 0 || submitting || !confirm}
              onClick={() => void startCheckout()}
            >
              {submitting
                ? t(lang, "Redirection vers Stripe…", "Redirecting to Stripe…", "Redirigiendo a Stripe…")
                : t(lang, "Payer et soumettre", "Pay & submit", "Pagar y enviar")}
            </button>

            {!confirm && (
              <p className="ff-footnote">
                {t(
                  lang,
                  "Cochez la confirmation pour continuer.",
                  "Check the confirmation to continue.",
                  "Marque la confirmación para continuar."
                )}
              </p>
            )}

            <p className="ff-footnote" style={{ marginTop: 10 }}>
              {t(
                lang,
                "Paiement sécurisé via Stripe. Reçu envoyé par courriel.",
                "Secure payment via Stripe. Email receipt will be sent.",
                "Pago seguro con Stripe. Recibirá un recibo por correo."
              )}
            </p>
          </div>
        </section>

        <section className="ff-card">
          <div className="ff-card-head">
            <h2>{t(lang, "Après le paiement", "After payment", "Después del pago")}</h2>
            <p>
              {t(
                lang,
                "Votre dossier sera automatiquement soumis et pris en charge.",
                "Your file will be automatically submitted and processed.",
                "Su expediente se enviará automáticamente y será procesado."
              )}
            </p>
          </div>

          <div className="ff-stack">
            <div className="ff-empty" style={{ borderStyle: "solid" }}>
              1) {t(lang, "Paiement confirmé", "Payment confirmed", "Pago confirmado")}
            </div>
            <div className="ff-empty" style={{ borderStyle: "solid" }}>
              2) {t(lang, "Dossier soumis", "File submitted", "Expediente enviado")}
            </div>
            <div className="ff-empty" style={{ borderStyle: "solid" }}>
              3) {t(lang, "Traitement par l’équipe", "Processed by the team", "Procesado por el equipo")}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
