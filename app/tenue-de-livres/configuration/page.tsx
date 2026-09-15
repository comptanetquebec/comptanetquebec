"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";
type TaxStatus = "not_registered" | "gst_only" | "gst_qst";
type Frequency = "monthly" | "quarterly" | "annual";

type Business = {
  id: string;
  business_name: string;
  tax_status: TaxStatus;
  filing_frequency: Frequency;
  fiscal_year_start_month: number;
  fiscal_year_start_day: number;
};

export default function ConfigurationTenueLivresPage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [userId, setUserId] = useState("");
  const [business, setBusiness] = useState<Business | null>(null);
  const [name, setName] = useState("");
  const [taxStatus, setTaxStatus] = useState<TaxStatus>("not_registered");
  const [frequency, setFrequency] = useState<Frequency>("annual");
  const [startDay, setStartDay] = useState("1");
  const [startMonth, setStartMonth] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const copy = {
    fr: {
      back: "Retour à la tenue de livres", title: "Profil de l’entreprise",
      intro: "Ces renseignements servent uniquement à votre tenue de livres.",
      name: "Nom de l’entreprise ou du travailleur autonome", taxes: "Inscription aux taxes",
      none: "Non inscrit à la TPS/TVQ", gst: "TPS seulement", both: "TPS et TVQ",
      frequency: "Fréquence de production TPS/TVQ", monthly: "Mensuelle",
      quarterly: "Trimestrielle", annual: "Annuelle", yearStart: "Début de l’exercice financier",
      day: "Jour", month: "Mois", save: "Créer mon profil", update: "Enregistrer les modifications",
      saved: "Profil enregistré.", continue: "Continuer vers les documents", loading: "Chargement…",
    },
    en: {
      back: "Back to bookkeeping", title: "Business profile",
      intro: "This information is used only for your bookkeeping.",
      name: "Business or self-employed name", taxes: "Tax registration",
      none: "Not registered for GST/QST", gst: "GST only", both: "GST and QST",
      frequency: "GST/QST filing frequency", monthly: "Monthly",
      quarterly: "Quarterly", annual: "Annual", yearStart: "Fiscal year start",
      day: "Day", month: "Month", save: "Create my profile", update: "Save changes",
      saved: "Profile saved.", continue: "Continue to documents", loading: "Loading…",
    },
    es: {
      back: "Volver a contabilidad", title: "Perfil de la empresa",
      intro: "Esta información se utiliza únicamente para su contabilidad.",
      name: "Nombre de la empresa o trabajador autónomo", taxes: "Registro de impuestos",
      none: "No registrado para GST/QST", gst: "Solo GST", both: "GST y QST",
      frequency: "Frecuencia de declaración GST/QST", monthly: "Mensual",
      quarterly: "Trimestral", annual: "Anual", yearStart: "Inicio del año fiscal",
      day: "Día", month: "Mes", save: "Crear mi perfil", update: "Guardar cambios",
      saved: "Perfil guardado.", continue: "Continuar a documentos", loading: "Cargando…",
    },
  }[lang];

  useEffect(() => {
    const queryLang = new URLSearchParams(window.location.search).get("lang");
    const selected: Lang = queryLang === "en" || queryLang === "es" ? queryLang : "fr";
    setLang(selected);
    void load(selected);
  }, []);

  async function load(selected: Lang) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      const next = encodeURIComponent(`/tenue-de-livres/configuration?lang=${selected}`);
      window.location.href = `/espace-client?lang=${selected}&next=${next}`;
      return;
    }
    setUserId(auth.user.id);
    const { data, error } = await supabase
      .from("bookkeeping_businesses")
      .select("id, business_name, tax_status, filing_frequency, fiscal_year_start_month, fiscal_year_start_day")
      .eq("owner_id", auth.user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) setMessage(error.message);
    if (data) {
      const current = data as Business;
      setBusiness(current);
      setName(current.business_name);
      setTaxStatus(current.tax_status);
      setFrequency(current.filing_frequency);
      setStartDay(String(current.fiscal_year_start_day));
      setStartMonth(String(current.fiscal_year_start_month));
    } else {
      setName(String(auth.user.user_metadata?.business_name || auth.user.user_metadata?.full_name || ""));
    }
    setLoading(false);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !name.trim()) return;
    setSaving(true);
    setMessage("");
    const values = {
      business_name: name.trim(), tax_status: taxStatus, filing_frequency: frequency,
      fiscal_year_start_day: Number(startDay), fiscal_year_start_month: Number(startMonth),
    };

    const request = business
      ? supabase.from("bookkeeping_businesses").update(values).eq("id", business.id).eq("owner_id", userId)
      : supabase.from("bookkeeping_businesses").insert({ ...values, owner_id: userId });
    const { data, error } = await request
      .select("id, business_name, tax_status, filing_frequency, fiscal_year_start_month, fiscal_year_start_day")
      .single();

    if (error) setMessage(error.message);
    else {
      setBusiness(data as Business);
      setMessage(copy.saved);
    }
    setSaving(false);
  }

  const input = { width: "100%", boxSizing: "border-box" as const, border: "1px solid #cbd5e1", borderRadius: 10, padding: "11px 12px", fontSize: 15, background: "#fff" };
  const label = { display: "grid", gap: 7, fontWeight: 800, color: "#334155" } as const;
  const button = { border: 0, borderRadius: 10, padding: "12px 18px", background: "#004aad", color: "#fff", fontWeight: 900, cursor: "pointer" } as const;

  if (loading) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f5f9ff", fontFamily: "Arial" }}><strong>{copy.loading}</strong></main>;

  return (
    <main style={{ minHeight: "100vh", background: "#f5f9ff", color: "#0f172a", fontFamily: "Arial, Helvetica, sans-serif", padding: "35px 20px" }}>
      <section style={{ maxWidth: 720, margin: "auto", background: "#fff", border: "1px solid #dbe5f1", borderRadius: 18, padding: 26, boxShadow: "0 8px 24px rgba(15,23,42,.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 15, flexWrap: "wrap" }}>
          <Link href={`/tenue-de-livres?lang=${lang}`} style={{ color: "#004aad", fontWeight: 900, textDecoration: "none" }}>← {copy.back}</Link>
          <div style={{ display: "flex", gap: 6 }}>{(["fr", "en", "es"] as const).map((item) => <button key={item} type="button" onClick={() => setLang(item)} style={{ ...button, padding: "7px 10px", background: lang === item ? "#004aad" : "#fff", color: lang === item ? "#fff" : "#004aad", border: "1px solid #004aad" }}>{item.toUpperCase()}</button>)}</div>
        </div>
        <h1 style={{ margin: "26px 0 8px" }}>{copy.title}</h1>
        <p style={{ color: "#64748b" }}>{copy.intro}</p>
        {message && <p style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e3a8a", padding: 12, borderRadius: 10 }}>{message}</p>}
        <form onSubmit={save} style={{ display: "grid", gap: 17, marginTop: 24 }}>
          <label style={label}>{copy.name}<input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} style={input} /></label>
          <label style={label}>{copy.taxes}<select value={taxStatus} onChange={(e) => setTaxStatus(e.target.value as TaxStatus)} style={input}><option value="not_registered">{copy.none}</option><option value="gst_only">{copy.gst}</option><option value="gst_qst">{copy.both}</option></select></label>
          <label style={label}>{copy.frequency}<select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)} style={input}><option value="monthly">{copy.monthly}</option><option value="quarterly">{copy.quarterly}</option><option value="annual">{copy.annual}</option></select></label>
          <fieldset style={{ border: "1px solid #dbe5f1", borderRadius: 12, padding: 15 }}><legend style={{ fontWeight: 900 }}>{copy.yearStart}</legend><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><label style={label}>{copy.day}<input type="number" min="1" max="31" required value={startDay} onChange={(e) => setStartDay(e.target.value)} style={input} /></label><label style={label}>{copy.month}<input type="number" min="1" max="12" required value={startMonth} onChange={(e) => setStartMonth(e.target.value)} style={input} /></label></div></fieldset>
          <button disabled={saving} type="submit" style={{ ...button, opacity: saving ? .6 : 1 }}>{business ? copy.update : copy.save}</button>
        </form>
        {business && <Link href={`/tenue-de-livres/documents?lang=${lang}`} style={{ display: "inline-block", marginTop: 18, color: "#15803d", fontWeight: 900 }}>{copy.continue} →</Link>}
      </section>
    </main>
  );
}
