"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";
type Business = { id: string; business_name: string };
type Extraction = {
  relevant: boolean;
  entry_type: "income" | "expense" | "unknown";
  transaction_date: string | null;
  source: string | null;
  description: string | null;
  subtotal: number | null;
  gst: number | null;
  qst: number | null;
  total: number | null;
  payment_method: "transfer" | "card" | "cash" | "cheque" | "platform" | "other" | "unknown";
  confidence: number;
  notes: string[];
};
type Doc = {
  id: string;
  storage_path: string;
  original_file_name: string;
  mime_type: string;
  size_bytes: number;
  status: "uploaded" | "analyzing" | "ready" | "confirmed" | "error";
  extraction: Extraction | null;
  error_message: string | null;
  transaction_id: string | null;
  created_at: string;
};

const MAX_SIZE = 20 * 1024 * 1024;
const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const currency = (value: number | null, lang: Lang) =>
  value === null
    ? "—"
    : new Intl.NumberFormat(lang === "fr" ? "fr-CA" : lang === "es" ? "es-CA" : "en-CA", { style: "currency", currency: "CAD" }).format(value);
const dateDisplay = (value: string | null) => value ? value.split("-").reverse().join("/") : "—";
const safeName = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");

export default function DocumentsTenueLivresPage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [userId, setUserId] = useState("");
  const [business, setBusiness] = useState<Business | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const t = {
    fr: { title: "Documents", subtitle: "Importez une photo ou un PDF. L’IA prépare la transaction, puis vous la vérifiez avant de la confirmer.", back: "Retour à la tenue de livres", upload: "Importer une photo ou un PDF", formats: "PDF, JPG, PNG ou WebP — maximum 20 Mo", loading: "Chargement…", analysing: "Analyse en cours…", analyze: "Analyser", confirm: "Confirmer la transaction", open: "Ouvrir", remove: "Supprimer", empty: "Aucun document pour le moment.", ready: "À vérifier", confirmed: "Confirmé", error: "Erreur", uploaded: "Prêt à analyser", income: "Revenu", expense: "Dépense", unknown: "Type incertain", date: "Date", source: "Source ou fournisseur", subtotal: "Avant taxes", gst: "TPS", qst: "TVQ", total: "Total", confidence: "Confiance IA", notes: "À vérifier", badFile: "Utilisez un PDF, JPG, PNG ou WebP de 20 Mo maximum.", saved: "Transaction confirmée.", needBusiness: "Créez d’abord votre profil d’entreprise dans la page Revenus.", deleteConfirm: "Supprimer ce document?", incomplete: "L’analyse est incomplète. Entrez cette transaction manuellement ou analysez un document plus lisible." },
    en: { title: "Documents", subtitle: "Upload a photo or PDF. AI prepares the transaction, then you review it before confirming.", back: "Back to bookkeeping", upload: "Upload a photo or PDF", formats: "PDF, JPG, PNG or WebP — maximum 20 MB", loading: "Loading…", analysing: "Analyzing…", analyze: "Analyze", confirm: "Confirm transaction", open: "Open", remove: "Delete", empty: "No documents yet.", ready: "Review", confirmed: "Confirmed", error: "Error", uploaded: "Ready to analyze", income: "Income", expense: "Expense", unknown: "Uncertain type", date: "Date", source: "Source or supplier", subtotal: "Before tax", gst: "GST", qst: "QST", total: "Total", confidence: "AI confidence", notes: "Review", badFile: "Use a PDF, JPG, PNG or WebP file up to 20 MB.", saved: "Transaction confirmed.", needBusiness: "Create your business profile on the Income page first.", deleteConfirm: "Delete this document?", incomplete: "The analysis is incomplete. Enter this transaction manually or analyze a clearer document." },
    es: { title: "Documentos", subtitle: "Suba una foto o un PDF. La IA prepara la transacción y usted la revisa antes de confirmarla.", back: "Volver a contabilidad", upload: "Subir una foto o un PDF", formats: "PDF, JPG, PNG o WebP — máximo 20 MB", loading: "Cargando…", analysing: "Analizando…", analyze: "Analizar", confirm: "Confirmar transacción", open: "Abrir", remove: "Eliminar", empty: "Todavía no hay documentos.", ready: "Por verificar", confirmed: "Confirmado", error: "Error", uploaded: "Listo para analizar", income: "Ingreso", expense: "Gasto", unknown: "Tipo incierto", date: "Fecha", source: "Fuente o proveedor", subtotal: "Antes de impuestos", gst: "GST", qst: "QST", total: "Total", confidence: "Confianza IA", notes: "Por verificar", badFile: "Use un PDF, JPG, PNG o WebP de hasta 20 MB.", saved: "Transacción confirmada.", needBusiness: "Primero cree su perfil de empresa en la página Ingresos.", deleteConfirm: "¿Eliminar este documento?", incomplete: "El análisis está incompleto. Introduzca la transacción manualmente o analice un documento más claro." },
  }[lang];

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("lang");
    const selected: Lang = q === "en" || q === "es" ? q : "fr";
    setLang(selected);
    void boot(selected);
  }, []);

  async function boot(selected: Lang) {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      const next = encodeURIComponent(`/tenue-de-livres/documents?lang=${selected}`);
      window.location.href = `/espace-client?lang=${selected}&next=${next}`;
      return;
    }
    setUserId(auth.user.id);
    const { data: businessData, error } = await supabase.from("bookkeeping_businesses").select("id, business_name").eq("owner_id", auth.user.id).order("created_at").limit(1).maybeSingle();
    if (error) setMessage(error.message);
    if (businessData) {
      setBusiness(businessData as Business);
      await loadDocs(businessData.id);
    }
    setLoading(false);
  }

  async function loadDocs(businessId: string) {
    const { data, error } = await supabase.from("bookkeeping_documents").select("id, storage_path, original_file_name, mime_type, size_bytes, status, extraction, error_message, transaction_id, created_at").eq("business_id", businessId).order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else setDocs((data ?? []) as Doc[]);
  }

  async function analyze(documentId: string) {
    setBusyId(documentId);
    setMessage("");
    const response = await fetch("/api/tenue-de-livres/analyser-document", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId }) });
    const result = await response.json() as { ok?: boolean; error?: string };
    if (!response.ok || !result.ok) setMessage(result.error ?? t.error);
    if (business) await loadDocs(business.id);
    setBusyId("");
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !business || !userId) return;
    if (!allowed.includes(file.type) || file.size > MAX_SIZE) { setMessage(t.badFile); return; }
    setUploading(true);
    setMessage("");
    const path = `${userId}/${business.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("bookkeeping-documents").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) { setMessage(uploadError.message); setUploading(false); return; }
    const { data: doc, error: rowError } = await supabase.from("bookkeeping_documents").insert({ business_id: business.id, storage_path: path, original_file_name: file.name, mime_type: file.type, size_bytes: file.size }).select("id").single();
    if (rowError || !doc) {
      await supabase.storage.from("bookkeeping-documents").remove([path]);
      setMessage(rowError?.message ?? t.error);
    } else {
      await loadDocs(business.id);
      await analyze(doc.id);
    }
    setUploading(false);
  }

  async function openDoc(path: string) {
    const { data, error } = await supabase.storage.from("bookkeeping-documents").createSignedUrl(path, 600);
    if (error || !data?.signedUrl) setMessage(error?.message ?? t.error);
    else window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function confirm(doc: Doc) {
    const x = doc.extraction;
    if (!business || !x || !x.relevant || x.entry_type === "unknown" || !x.transaction_date || !x.source || x.subtotal === null) { setMessage(t.incomplete); return; }
    setBusyId(doc.id);
    setMessage("");
    const gst = x.gst ?? 0;
    const qst = x.qst ?? 0;
    const taxMode = qst > 0 ? "gst_qst" : gst > 0 ? "gst" : "none";
    const paymentMethod = x.payment_method === "unknown" ? "other" : x.payment_method;
    const { data: transaction, error } = await supabase.from("bookkeeping_transactions").insert({ business_id: business.id, entry_type: x.entry_type, transaction_date: x.transaction_date, source: x.source, description: x.description, subtotal: x.subtotal, tax_mode: taxMode, gst, qst, payment_method: paymentMethod, status: "confirmed", document_path: doc.storage_path, original_file_name: doc.original_file_name, document_mime_type: doc.mime_type, entered_by: "document_ai", ai_confidence: x.confidence, ai_extraction: x }).select("id").single();
    if (error || !transaction) setMessage(error?.message ?? t.error);
    else {
      const { error: updateError } = await supabase.from("bookkeeping_documents").update({ status: "confirmed", transaction_id: transaction.id }).eq("id", doc.id);
      if (updateError) {
        await supabase.from("bookkeeping_transactions").delete().eq("id", transaction.id);
        setMessage(updateError.message);
      } else setMessage(t.saved);
      await loadDocs(business.id);
    }
    setBusyId("");
  }

  async function remove(doc: Doc) {
    if (!business || doc.status === "confirmed" || !window.confirm(t.deleteConfirm)) return;
    setBusyId(doc.id);
    const { error } = await supabase.from("bookkeeping_documents").delete().eq("id", doc.id);
    if (error) setMessage(error.message);
    else {
      await supabase.storage.from("bookkeeping-documents").remove([doc.storage_path]);
      await loadDocs(business.id);
    }
    setBusyId("");
  }

  const button = { border: "1px solid #bfdbfe", borderRadius: 9, background: "#fff", color: "#004aad", padding: "8px 11px", fontWeight: 800, cursor: "pointer" } as const;
  if (loading) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f5f9ff", fontFamily: "Arial" }}><strong style={{ color: "#004aad" }}>{t.loading}</strong></main>;

  return (
    <main style={{ minHeight: "100vh", background: "#f5f9ff", color: "#0f172a", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0" }}><div style={{ maxWidth: 1100, margin: "auto", padding: "14px 20px", display: "flex", justifyContent: "space-between", gap: 15, flexWrap: "wrap" }}><Link href={`/tenue-de-livres?lang=${lang}`} style={{ color: "#004aad", textDecoration: "none", fontWeight: 900 }}>← {t.back}</Link><div style={{ display: "flex", gap: 6 }}>{(["fr", "en", "es"] as const).map((x) => <button key={x} onClick={() => setLang(x)} style={{ ...button, background: lang === x ? "#004aad" : "#fff", color: lang === x ? "#fff" : "#004aad" }}>{x.toUpperCase()}</button>)}</div></div></header>
      <div style={{ maxWidth: 1100, margin: "auto", padding: "30px 20px 60px" }}>
        <h1 style={{ marginBottom: 8 }}>{t.title}</h1><p style={{ color: "#64748b", maxWidth: 760 }}>{t.subtitle}</p>
        {business ? <p style={{ fontWeight: 900 }}>{business.business_name}</p> : <p style={{ background: "#fff7ed", border: "1px solid #fed7aa", padding: 14, borderRadius: 10 }}>{t.needBusiness} <Link href={`/tenue-de-livres/revenus?lang=${lang}`}>→</Link></p>}
        {message && <p style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e3a8a", padding: 12, borderRadius: 10 }}>{message}</p>}
        {business && <label style={{ display: "grid", placeItems: "center", background: "#004aad", color: "#fff", padding: 25, borderRadius: 16, fontWeight: 900, cursor: uploading ? "wait" : "pointer", margin: "22px 0" }}><span style={{ fontSize: 30 }}>📷</span><span>{uploading ? t.analysing : t.upload}</span><small style={{ marginTop: 7, opacity: .85 }}>{t.formats}</small><input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={upload} disabled={uploading} hidden /></label>}
        <div style={{ display: "grid", gap: 15 }}>
          {docs.length === 0 && <div style={{ background: "#fff", padding: 22, borderRadius: 14, color: "#64748b" }}>{t.empty}</div>}
          {docs.map((doc) => {
            const x = doc.extraction;
            const status = doc.status === "ready" ? t.ready : doc.status === "confirmed" ? t.confirmed : doc.status === "error" ? t.error : doc.status === "analyzing" ? t.analysing : t.uploaded;
            const complete = Boolean(x?.relevant && x.entry_type !== "unknown" && x.transaction_date && x.source && x.subtotal !== null);
            return <article key={doc.id} style={{ background: "#fff", border: "1px solid #dbe5f1", borderRadius: 15, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><strong>{doc.original_file_name}</strong><div style={{ color: "#64748b", fontSize: 13, marginTop: 5 }}>{status}</div></div><div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}><button onClick={() => openDoc(doc.storage_path)} style={button}>{t.open}</button>{doc.status !== "confirmed" && <button disabled={busyId === doc.id} onClick={() => analyze(doc.id)} style={button}>{busyId === doc.id ? t.analysing : t.analyze}</button>}{doc.status !== "confirmed" && <button disabled={busyId === doc.id} onClick={() => remove(doc)} style={{ ...button, color: "#b91c1c" }}>{t.remove}</button>}</div></div>
              {doc.error_message && <p style={{ color: "#b91c1c" }}>{doc.error_message}</p>}
              {x && <div style={{ marginTop: 15 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}><Field label="Type" value={x.entry_type === "income" ? t.income : x.entry_type === "expense" ? t.expense : t.unknown} /><Field label={t.date} value={dateDisplay(x.transaction_date)} /><Field label={t.source} value={x.source ?? "—"} /><Field label={t.subtotal} value={currency(x.subtotal, lang)} /><Field label={t.gst} value={currency(x.gst, lang)} /><Field label={t.qst} value={currency(x.qst, lang)} /><Field label={t.total} value={currency(x.total, lang)} /><Field label={t.confidence} value={`${Math.round(x.confidence * 100)} %`} /></div>{x.notes.length > 0 && <p style={{ color: "#92400e" }}><strong>{t.notes} :</strong> {x.notes.join(" • ")}</p>}{doc.status === "ready" && <button disabled={!complete || busyId === doc.id} onClick={() => confirm(doc)} style={{ border: 0, borderRadius: 10, background: complete ? "#15803d" : "#94a3b8", color: "#fff", padding: "11px 16px", fontWeight: 900, cursor: complete ? "pointer" : "not-allowed" }}>{t.confirm}</button>}</div>}
            </article>;
          })}
        </div>
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div style={{ background: "#f8fafc", borderRadius: 9, padding: 10 }}><div style={{ color: "#64748b", fontSize: 12, fontWeight: 800 }}>{label}</div><div style={{ fontWeight: 900, marginTop: 5, overflowWrap: "anywhere" }}>{value}</div></div>;
}
