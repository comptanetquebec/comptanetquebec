"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "../formulaire-fiscal.css";
import Steps from "../Steps";

/**
 * Tables
 */
const DOCS_TABLE = "formulaire_documents";
const FORMS_TABLE = "formulaires_fiscaux";

/**
 * Lang (toujours suivre la langue de la 1re page via cookie cq_lang)
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
  // 1) Si lang est dans l'URL, on l'utilise et on le persiste en cookie
  if (urlLang) {
    const l = normalizeLang(urlLang);
    setCookie("cq_lang", l);
    return l;
  }
  // 2) Sinon on lit le cookie (lang de la 1re page)
  return normalizeLang(getCookie("cq_lang"));
}

function withLang(path: string, lang: Lang, extra?: Record<string, string>) {
  const u = new URL(path, window.location.origin);
  u.searchParams.set("lang", lang);
  if (extra) for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  return u.pathname + u.search;
}

type DocRow = { id: string; original_name: string; created_at: string };

export default function EnvoyerDossierPage() {
  const router = useRouter();
  const params = useSearchParams();

  const fid = params.get("fid") || "";
  const lang = useMemo(() => resolveLang(params.get("lang")), [params]);

  const [userId, setUserId] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!alive) return;

      if (error || !data.user) {
        setBooting(false);

        // ✅ IMPORTANT: route correcte (dans /formulaire-fiscal)
        const next = `/formulaire-fiscal/envoyer-dossier?fid=${encodeURIComponent(fid)}&lang=${encodeURIComponent(
          lang
        )}`;

        router.replace(
          `/espace-client?lang=${encodeURIComponent(lang)}&next=${encodeURIComponent(next)}`
        );
        return;
      }

      setUserId(data.user.id);
      setBooting(false);

      if (!fid) setMsg("❌ fid manquant");
      else await loadDocs();
    })();

    return () => {
      alive = false;
    };
  }, [router, fid, lang, loadDocs]);

  const submitFinal = useCallback(async () => {
    if (!fid || !userId) return;

    setSubmitting(true);
    setMsg(null);

    try {
      // 1) check docs
      const { data: d, error: e1 } = await supabase
        .from(DOCS_TABLE)
        .select("id")
        .eq("formulaire_id", fid)
        .limit(1);

      if (e1) throw new Error(e1.message);
      if (!d || d.length === 0)
        throw new Error(
          lang === "fr"
            ? "Ajoutez au moins 1 document avant d’envoyer."
            : lang === "en"
            ? "Upload at least 1 document before submitting."
            : "Suba al menos 1 documento antes de enviar."
        );

      // 2) mark submitted
      const { error: e2 } = await supabase
        .from(FORMS_TABLE)
        .update({ status: "submitted" })
        .eq("id", fid)
        .eq("user_id", userId);

      if (e2) throw new Error(e2.message);

      setMsg(lang === "fr" ? "✅ Dossier soumis. Merci !" : lang === "en" ? "✅ Submitted. Thank you!" : "✅ Enviado. ¡Gracias!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur";
      setMsg("❌ " + message);
    } finally {
      setSubmitting(false);
    }
  }, [fid, userId, lang]);

  const docsCount = docs.length;

  if (booting) {
    return (
      <main className="ff-bg">
        <div className="ff-container">
          <div style={{ padding: 24 }}>
            {lang === "fr" ? "Chargement…" : lang === "en" ? "Loading…" : "Cargando…"}
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
            <span>
              {lang === "fr" ? "Envoyer le dossier" : lang === "en" ? "Submit file" : "Enviar expediente"}
            </span>
          </div>

          {/* ✅ IMPORTANT: retour vers la bonne route */}
          <button
            className="ff-btn ff-btn-outline"
            type="button"
            onClick={() =>
              router.push(withLang("/formulaire-fiscal/depot-documents", lang, { fid }))
            }
          >
            ← {lang === "fr" ? "Retour dépôt" : lang === "en" ? "Back to upload" : "Volver a subida"}
          </button>
        </header>

        {msg && (
          <div className="ff-card" style={{ padding: 14 }}>
            {msg}
          </div>
        )}

        <section className="ff-card">
          <div className="ff-card-head">
            <h2>
              {lang === "fr"
                ? "Vérification avant envoi"
                : lang === "en"
                ? "Check before submitting"
                : "Verificación antes de enviar"}
            </h2>
            <p>
              {lang === "fr"
                ? "Vous devez avoir au moins 1 document téléversé."
                : lang === "en"
                ? "You must have at least 1 uploaded document."
                : "Debe tener al menos 1 documento subido."}
            </p>
          </div>

          {loadingDocs ? (
            <div className="ff-empty">
              {lang === "fr"
                ? "Chargement des documents…"
                : lang === "en"
                ? "Loading documents…"
                : "Cargando documentos…"}
            </div>
          ) : docsCount === 0 ? (
            <div className="ff-empty">
              {lang === "fr"
                ? "Aucun document détecté."
                : lang === "en"
                ? "No documents detected."
                : "No se detectaron documentos."}
            </div>
          ) : (
            <div className="ff-empty">
              ✅{" "}
              {lang === "fr"
                ? "Documents détectés"
                : lang === "en"
                ? "Documents found"
                : "Documentos detectados"}{" "}
              : {docsCount}
            </div>
          )}

          <div className="ff-submit">
            <button
              type="button"
              className="ff-btn ff-btn-primary ff-btn-big"
              disabled={!fid || docsCount === 0 || submitting}
              onClick={submitFinal}
            >
              {submitting
                ? lang === "fr"
                  ? "Envoi…"
                  : lang === "en"
                  ? "Submitting…"
                  : "Enviando…"
                : lang === "fr"
                ? "Soumettre mon dossier"
                : lang === "en"
                ? "Submit my file"
                : "Enviar mi expediente"}
            </button>

            {docsCount === 0 && (
              <p className="ff-footnote">
                {lang === "fr"
                  ? "Ajoutez au moins 1 document avant de soumettre."
                  : lang === "en"
                  ? "Upload at least 1 document before submitting."
                  : "Suba al menos 1 documento antes de enviar."}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
