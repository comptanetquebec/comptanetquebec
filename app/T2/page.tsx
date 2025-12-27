"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/* ---------- Types ---------- */
type Lang = "fr" | "en" | "es";
type YesNo = "yes" | "no" | ""; // ✅ stable en base (peu importe la langue d'affichage)

interface FormData {
  companyName: string;
  craNumber: string; // BN 9 chiffres (idéalement)
  neq: string;
  incProvince: string;

  addrStreet: string;
  addrCity: string;
  addrProv: string;
  addrPostal: string;

  yearEnd: string; // texte (JJ/MM/AAAA ou DD/MM/YYYY)
  year: number;

  hasRevenue: YesNo;
  operatesInQuebec: YesNo;

  paidSalary: YesNo;
  paidDividends: YesNo;
  hasAssets: YesNo;
  hasLoans: YesNo;

  contactName: string;
  contactPhone: string;
  contactEmail: string;

  revenue: string;
  expenses: string;
  notes: string;
}

interface SaveRow {
  user_id: string;
  year: number;
  payload: FormData;
}

/* ---------- i18n ---------- */
type Dict = {
  title: string;
  intro: string;
  mustLogin: string;

  back: string;

  section_company: string;
  company: string;
  craNumber: string;
  craNumber_hint: string;
  neq: string;
  incProvince: string;
  addrStreet: string;
  addrCity: string;
  addrProv: string;
  addrPostal: string;

  section_year: string;
  year: string;
  yearEnd: string;
  operatesInQuebec: string;
  operatesInQuebec_hint: string;

  section_activity: string;
  hasRevenue: string;
  paidSalary: string;
  paidDividends: string;
  hasAssets: string;
  hasLoans: string;

  section_contact: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;

  section_financials: string;
  revenue: string;
  expenses: string;
  notes: string;
  notes_ph: string;

  yes: string;
  no: string;

  save: string;
  saving: string;
  savedAt: string;

  error_load: string;
  error_save: string;
};

const I18N: Record<Lang, Dict> = {
  fr: {
    title: "Déclaration T2 (Société)",
    intro:
      "Ce formulaire nous donne l’information minimale pour préparer la déclaration T2 fédérale et, si requis, la CO-17 au Québec.",
    mustLogin: "Redirection vers l’espace client…",

    back: "Retour aux dossiers",

    section_company: "1. Société",
    company: "Nom légal de l’entreprise",
    craNumber: "Numéro d’entreprise (ARC)",
    craNumber_hint: "9 chiffres (BN)",
    neq: "NEQ (si Québec)",
    incProvince: "Province d’incorporation",
    addrStreet: "Adresse (rue / numéro civique)",
    addrCity: "Ville",
    addrProv: "Province",
    addrPostal: "Code postal",

    section_year: "2. Exercice fiscal",
    year: "Année fiscale (ex.: 2024)",
    yearEnd: "Fin d’exercice (JJ/MM/AAAA)",
    operatesInQuebec: "La société exerce-t-elle au Québec ?",
    operatesInQuebec_hint:
      "Si oui, nous préparerons aussi la déclaration du Québec (CO-17).",

    section_activity: "3. Activité de la société",
    hasRevenue: "Avez-vous eu des revenus durant l’année ?",
    paidSalary: "Avez-vous payé des salaires (T4) aux actionnaires / employés ?",
    paidDividends: "Avez-vous versé des dividendes aux actionnaires (T5) ?",
    hasAssets:
      "Avez-vous des actifs importants (ordinateur, véhicule, équipement) au nom de la société ?",
    hasLoans: "Avez-vous des prêts ou marge de crédit au nom de la société ?",

    section_contact: "4. Personne contact pour ce dossier",
    contactName: "Nom du responsable pour ce dossier",
    contactPhone: "Téléphone",
    contactEmail: "Courriel",

    section_financials: "5. Résumé financier (approx.)",
    revenue: "Revenus ($)",
    expenses: "Dépenses ($)",
    notes: "Notes / précisions",
    notes_ph:
      "Ex.: période différente du calendrier, dépenses perso payées par la cie, etc.",

    yes: "Oui",
    no: "Non",

    save: "Enregistrer",
    saving: "Enregistrement…",
    savedAt: "Sauvegardé à",

    error_load: "Impossible de charger votre brouillon.",
    error_save: "Impossible d’enregistrer. Réessayez.",
  },

  en: {
    title: "T2 Corporate Return",
    intro:
      "This form collects the minimum info we need to prepare the federal T2 return and, if required, the Québec CO-17.",
    mustLogin: "Redirecting to client portal…",

    back: "Back to files",

    section_company: "1. Corporation",
    company: "Legal company name",
    craNumber: "CRA business number",
    craNumber_hint: "9-digit BN",
    neq: "Québec NEQ (if applicable)",
    incProvince: "Province of incorporation",
    addrStreet: "Business address (street)",
    addrCity: "City",
    addrProv: "Province",
    addrPostal: "Postal code",

    section_year: "2. Fiscal year",
    year: "Tax year (e.g. 2024)",
    yearEnd: "Year-end date (DD/MM/YYYY)",
    operatesInQuebec: "Does the company operate in Québec?",
    operatesInQuebec_hint:
      "If yes, we'll also prepare the Québec corporate return (CO-17).",

    section_activity: "3. Company activity",
    hasRevenue: "Did the company earn revenue during the year?",
    paidSalary: "Did you pay salary/T4 to shareholders or employees?",
    paidDividends: "Did you pay dividends (T5) to shareholders?",
    hasAssets: "Does the company own assets (computer, vehicle, equipment)?",
    hasLoans: "Does the company have loans or a line of credit?",

    section_contact: "4. Contact person",
    contactName: "Contact name for this file",
    contactPhone: "Phone",
    contactEmail: "Email",

    section_financials: "5. Financial summary (approx.)",
    revenue: "Revenue ($)",
    expenses: "Expenses ($)",
    notes: "Notes / details",
    notes_ph:
      "Ex.: non-calendar year-end, shareholder personal expenses in books, etc.",

    yes: "Yes",
    no: "No",

    save: "Save",
    saving: "Saving…",
    savedAt: "Saved at",

    error_load: "Could not load your draft.",
    error_save: "Could not save. Please try again.",
  },

  es: {
    title: "Declaración T2 (Sociedad)",
    intro:
      "Este formulario reúne la información mínima para preparar la declaración federal T2 y, si aplica, la CO-17 en Québec.",
    mustLogin: "Redirigiendo al área de cliente…",

    back: "Volver a expedientes",

    section_company: "1. Sociedad",
    company: "Nombre legal de la empresa",
    craNumber: "Número empresarial (ARC)",
    craNumber_hint: "9 dígitos (BN)",
    neq: "NEQ de Québec (si aplica)",
    incProvince: "Provincia de constitución",
    addrStreet: "Dirección comercial (calle)",
    addrCity: "Ciudad",
    addrProv: "Provincia",
    addrPostal: "Código postal",

    section_year: "2. Ejercicio fiscal",
    year: "Año fiscal (ej.: 2024)",
    yearEnd: "Cierre del ejercicio (DD/MM/AAAA)",
    operatesInQuebec: "¿La sociedad opera en Québec?",
    operatesInQuebec_hint:
      "Si es así, también preparamos la declaración provincial CO-17.",

    section_activity: "3. Actividad de la sociedad",
    hasRevenue: "¿La sociedad tuvo ingresos este año?",
    paidSalary: "¿Pagó salarios (T4) a accionistas / empleados?",
    paidDividends: "¿Pagó dividendos (T5) a los accionistas?",
    hasAssets: "¿La sociedad posee activos (computadora, vehículo, equipo)?",
    hasLoans: "¿La sociedad tiene préstamos o línea de crédito?",

    section_contact: "4. Persona de contacto",
    contactName: "Nombre del responsable de este expediente",
    contactPhone: "Teléfono",
    contactEmail: "Correo",

    section_financials: "5. Resumen financiero (aprox.)",
    revenue: "Ingresos ($)",
    expenses: "Gastos ($)",
    notes: "Notas / detalles",
    notes_ph:
      "Ej.: año fiscal no calendario, gastos personales pagados por la empresa, etc.",

    yes: "Sí",
    no: "No",

    save: "Guardar",
    saving: "Guardando…",
    savedAt: "Guardado a las",

    error_load: "No se pudo cargar el borrador.",
    error_save: "No se pudo guardar. Inténtalo de nuevo.",
  },
};

/* ---------- Locale helpers ---------- */
function localeFor(lang: Lang): string {
  if (lang === "fr") return "fr-CA";
  if (lang === "en") return "en-CA";
  return "es-ES";
}

function formatTime(d: Date, lang: Lang): string {
  try {
    return d.toLocaleTimeString(localeFor(lang), {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    // fallback
    return d.toTimeString().slice(0, 5);
  }
}

/* ---------- Champs réutilisables ---------- */
function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  label: string;
  hint?: string;
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-gray-700 flex items-baseline gap-2">
        {label}
        {hint && (
          <span className="text-[11px] font-normal text-gray-500">{hint}</span>
        )}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className="mt-1 w-full rounded border px-3 py-2 text-sm"
      />
    </label>
  );
}

function YesNoField({
  label,
  value,
  onChange,
  hint,
  yesLabel,
  noLabel,
}: {
  label: string;
  value: YesNo;
  onChange: (val: YesNo) => void;
  hint?: string;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <div>
      <span className="text-sm font-medium text-gray-700 flex items-baseline gap-2">
        {label}
        {hint && (
          <span className="text-[11px] font-normal text-gray-500">{hint}</span>
        )}
      </span>
      <div className="mt-1 flex gap-6 text-sm text-gray-700">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="yes"
            checked={value === "yes"}
            onChange={() => onChange("yes")}
          />
          <span>{yesLabel}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="no"
            checked={value === "no"}
            onChange={() => onChange("no")}
          />
          <span>{noLabel}</span>
        </label>
      </div>
    </div>
  );
}

/* ---------- Page principale ---------- */
export default function T2Page() {
  const router = useRouter();
  const params = useSearchParams();

  // Langue via ?lang=fr|en|es
  const urlLang = (params.get("lang") || "fr").toLowerCase();
  const lang: Lang = (["fr", "en", "es"] as const).includes(urlLang as Lang)
    ? (urlLang as Lang)
    : "fr";
  const t = I18N[lang];

  // Auth
  const [uid, setUid] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<FormData>({
    companyName: "",
    craNumber: "",
    neq: "",
    incProvince: "",
    addrStreet: "",
    addrCity: "",
    addrProv: "",
    addrPostal: "",

    yearEnd: "",
    year: new Date().getFullYear() - 1,
    operatesInQuebec: "",

    hasRevenue: "",
    paidSalary: "",
    paidDividends: "",
    hasAssets: "",
    hasLoans: "",

    contactName: "",
    contactPhone: "",
    contactEmail: "",

    revenue: "",
    expenses: "",
    notes: "",
  });

  const [loadingDraft, setLoadingDraft] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  /* --- charger user + brouillon pour l’année sélectionnée --- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingDraft(true);

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        // ✅ conserve la langue + indique la page de retour
        router.replace(`/espace-client?lang=${lang}&next=/T2`);
        return;
      }

      if (cancelled) return;
      setUid(user.id);

      try {
        const { data: rows, error } = await supabase
          .from("t2_forms")
          .select("payload, year, updated_at")
          .eq("user_id", user.id)
          .eq("year", form.year)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (error) throw error;

        if (!cancelled && rows && rows[0]?.payload) {
          setForm(rows[0].payload as FormData);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) alert(t.error_load);
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // ✅ recharge quand lang change OU quand l’année change
  }, [router, lang, form.year, t.error_load]);

  /* --- helpers pour set --- */
  const setField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const save = useCallback(async () => {
    if (!uid) return;

    setSaving(true);
    try {
      const row: SaveRow = {
        user_id: uid,
        year: form.year,
        payload: form,
      };

      const { error } = await supabase.from("t2_forms").upsert(row);
      if (error) throw error;

      setSavedAt(new Date());
    } catch (e) {
      console.error(e);
      alert(t.error_save);
    } finally {
      setSaving(false);
    }
  }, [uid, form, t.error_save]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{t.title}</h1>
            <p className="text-sm text-gray-600">{t.intro}</p>
          </div>

          <button
            className="btn btn-outline text-sm border border-gray-300 rounded px-3 py-2 hover:bg-gray-100"
            onClick={() => router.push(`/dossiers/nouveau?lang=${lang}`)}
          >
            {t.back}
          </button>
        </header>

        {!uid && <p className="text-sm text-gray-600 mb-4">{t.mustLogin}</p>}

        {loadingDraft && uid && (
          <p className="text-sm text-gray-600 mb-4">…</p>
        )}

        {/* SECTION 1 - Société */}
        <section className="bg-white border rounded shadow-sm p-5 mb-6">
          <h2 className="text-lg font-medium text-blue-800 mb-4">
            {t.section_company}
          </h2>

          <div className="grid gap-4">
            <TextField
              label={t.company}
              value={form.companyName}
              onChange={(v) => setField("companyName", v)}
              placeholder="Ex.: 1234-5678 Québec inc."
            />

            <div className="grid md:grid-cols-2 gap-4">
              <TextField
                label={t.craNumber}
                hint={t.craNumber_hint}
                value={form.craNumber}
                onChange={(v) => setField("craNumber", v)}
                placeholder="123456789"
              />
              <TextField
                label={t.neq}
                value={form.neq}
                onChange={(v) => setField("neq", v)}
                placeholder="NEQ (ex.: 12#######)"
              />
            </div>

            <TextField
              label={t.incProvince}
              value={form.incProvince}
              onChange={(v) => setField("incProvince", v)}
              placeholder="QC, ON, AB, etc."
            />

            <div className="grid md:grid-cols-2 gap-4">
              <TextField
                label={t.addrStreet}
                value={form.addrStreet}
                onChange={(v) => setField("addrStreet", v)}
                placeholder="123 Rue Principale, Suite 200"
              />
              <TextField
                label={t.addrCity}
                value={form.addrCity}
                onChange={(v) => setField("addrCity", v)}
                placeholder="Montréal"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <TextField
                label={t.addrProv}
                value={form.addrProv}
                onChange={(v) => setField("addrProv", v)}
                placeholder="QC"
              />
              <TextField
                label={t.addrPostal}
                value={form.addrPostal}
                onChange={(v) => setField("addrPostal", v)}
                placeholder="H1A 1A1"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2 - Exercice fiscal */}
        <section className="bg-white border rounded shadow-sm p-5 mb-6">
          <h2 className="text-lg font-medium text-blue-800 mb-4">
            {t.section_year}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <TextField
              label={t.year}
              value={form.year}
              onChange={(v) =>
                setField("year", parseInt(v || "0", 10) || form.year)
              }
              type="number"
              placeholder="2024"
            />

            <TextField
              label={t.yearEnd}
              value={form.yearEnd}
              onChange={(v) => setField("yearEnd", v)}
              placeholder={lang === "en" ? "31/12/2024" : "31/12/2024"}
            />
          </div>

          <div className="mt-4">
            <YesNoField
              label={t.operatesInQuebec}
              hint={t.operatesInQuebec_hint}
              value={form.operatesInQuebec}
              onChange={(v) => setField("operatesInQuebec", v)}
              yesLabel={t.yes}
              noLabel={t.no}
            />
          </div>
        </section>

        {/* SECTION 3 - Activité */}
        <section className="bg-white border rounded shadow-sm p-5 mb-6">
          <h2 className="text-lg font-medium text-blue-800 mb-4">
            {t.section_activity}
          </h2>

          <div className="grid gap-6">
            <YesNoField
              label={t.hasRevenue}
              value={form.hasRevenue}
              onChange={(v) => setField("hasRevenue", v)}
              yesLabel={t.yes}
              noLabel={t.no}
            />

            <YesNoField
              label={t.paidSalary}
              value={form.paidSalary}
              onChange={(v) => setField("paidSalary", v)}
              yesLabel={t.yes}
              noLabel={t.no}
            />

            <YesNoField
              label={t.paidDividends}
              value={form.paidDividends}
              onChange={(v) => setField("paidDividends", v)}
              yesLabel={t.yes}
              noLabel={t.no}
            />

            <YesNoField
              label={t.hasAssets}
              value={form.hasAssets}
              onChange={(v) => setField("hasAssets", v)}
              yesLabel={t.yes}
              noLabel={t.no}
            />

            <YesNoField
              label={t.hasLoans}
              value={form.hasLoans}
              onChange={(v) => setField("hasLoans", v)}
              yesLabel={t.yes}
              noLabel={t.no}
            />
          </div>
        </section>

        {/* SECTION 4 - Contact */}
        <section className="bg-white border rounded shadow-sm p-5 mb-6">
          <h2 className="text-lg font-medium text-blue-800 mb-4">
            {t.section_contact}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <TextField
              label={t.contactName}
              value={form.contactName}
              onChange={(v) => setField("contactName", v)}
              placeholder={
                lang === "en"
                  ? "Owner / internal accountant"
                  : lang === "es"
                  ? "Responsable / contable interno"
                  : "Nom du dirigeant ou comptable interne"
              }
            />
            <TextField
              label={t.contactPhone}
              value={form.contactPhone}
              onChange={(v) => setField("contactPhone", v)}
              placeholder="(xxx) xxx-xxxx"
            />
          </div>

          <TextField
            className="mt-4"
            label={t.contactEmail}
            value={form.contactEmail}
            onChange={(v) => setField("contactEmail", v)}
            placeholder="exemple@entreprise.com"
            type="email"
          />
        </section>

        {/* SECTION 5 - Résumé financier */}
        <section className="bg-white border rounded shadow-sm p-5 mb-6">
          <h2 className="text-lg font-medium text-blue-800 mb-4">
            {t.section_financials}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <TextField
              label={t.revenue}
              value={form.revenue}
              onChange={(v) => setField("revenue", v)}
              placeholder="250000"
              type="number"
            />
            <TextField
              label={t.expenses}
              value={form.expenses}
              onChange={(v) => setField("expenses", v)}
              placeholder="120000"
              type="number"
            />
          </div>

          <label className="block mt-4">
            <span className="text-sm font-medium text-gray-700">{t.notes}</span>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={4}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              placeholder={t.notes_ph}
            />
          </label>
        </section>

        {/* SAVE / STATUS */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            disabled={saving || !uid}
            className="btn btn-primary bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded px-4 py-2 text-sm disabled:opacity-50"
          >
            {saving ? t.saving : t.save}
          </button>

          {savedAt && (
            <span className="text-sm text-green-700">
              {t.savedAt} {formatTime(savedAt, lang)}
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
