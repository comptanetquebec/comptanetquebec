"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

import "../formulaire-fiscal.css";
import Steps from "../Steps";
import RequireAuth from "../RequireAuth";
import { Field, YesNoField, SelectField, type YesNo, type SelectOption } from "../ui";

import { resolveLangFromParams, type Lang } from "../_lib/lang";

/**
 * DB
 */
const FORMS_TABLE = "formulaires_fiscaux";

type FormTypeDb = "T1" | "T2";
type InsertIdRow = { id: string };

type ProvinceCode =
  | "QC"
  | "ON"
  | "NB"
  | "NS"
  | "PE"
  | "NL"
  | "MB"
  | "SK"
  | "AB"
  | "BC"
  | "YT"
  | "NT"
  | "NU";

const PROVINCES: Array<SelectOption<ProvinceCode | "">> = [
  { value: "QC", label: "QC" },
  { value: "ON", label: "ON" },
  { value: "NB", label: "NB" },
  { value: "NS", label: "NS" },
  { value: "PE", label: "PE" },
  { value: "NL", label: "NL" },
  { value: "MB", label: "MB" },
  { value: "SK", label: "SK" },
  { value: "AB", label: "AB" },
  { value: "BC", label: "BC" },
  { value: "YT", label: "YT" },
  { value: "NT", label: "NT" },
  { value: "NU", label: "NU" },
];

function supaErr(e: unknown) {
  if (!e || typeof e !== "object") return "Erreur inconnue";
  const err = e as { message?: string; details?: string; hint?: string; code?: string };
  return [err.message, err.details, err.hint, err.code].filter(Boolean).join(" | ");
}

/**
 * Types payload T2
 */
type T2Data = {
  anneeImposition: string;

  companyName: string;
  craNumber: string;
  neq: string;
  incProvince: string;

  addrStreet: string;
  addrCity: string;
  addrProv: ProvinceCode | "";
  addrPostal: string;

  yearEnd: string;

  operatesInQuebec: YesNo;
  hasRevenue: YesNo;
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
};

type Formdata = {
  dossierType: FormTypeDb;
  t2?: T2Data;
};

type FormRow = {
  id: string;
  data: Formdata | null;
  created_at: string;
};

function titleFromType(type: FormTypeDb) {
  return type === "T2" ? "Société (T2)" : "Particulier (T1)";
}

/** format helpers */
function formatPhoneInput(v: string) {
  const d = (v || "").replace(/\D+/g, "").slice(0, 10);
  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${a}`;
  if (d.length <= 6) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
}
function normalizePhone(v: string) {
  return (v || "").replace(/\D+/g, "").slice(0, 10);
}
function formatPostalInput(v: string) {
  const s = (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (s.length <= 3) return s;
  return `${s.slice(0, 3)} ${s.slice(3, 6)}`;
}
function normalizePostal(v: string) {
  return (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

/* ===========================
   WRAPPER (RequireAuth)
=========================== */

export default function FormulaireFiscalT2Page() {
  const paramsRO = useSearchParams();
  const params = useMemo(() => new URLSearchParams(paramsRO.toString()), [paramsRO]);

  const type: FormTypeDb = "T2";
  const lang: Lang = useMemo(() => resolveLangFromParams(params), [params]);

  const yearParam = (params.get("year") || "").trim();

  const nextPath = useMemo(() => {
    const u = new URL("/formulaire-fiscal-t2", window.location.origin);
    u.searchParams.set("lang", lang);
    if (yearParam) u.searchParams.set("year", yearParam);
    return u.pathname + u.search;
  }, [lang, yearParam]);

  return (
    <RequireAuth lang={lang} nextPath={nextPath}>
      {(userId) => (
        <FormulaireFiscalT2Inner userId={userId} lang={lang} type={type} initialYear={yearParam} />
      )}
    </RequireAuth>
  );
}

/* ===========================
   INNER
=========================== */

function FormulaireFiscalT2Inner({
  userId,
  lang,
  type,
  initialYear,
}: {
  userId: string;
  lang: Lang;
  type: FormTypeDb;
  initialYear: string;
}) {
  const router = useRouter();
  const formTitle = titleFromType(type);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [formulaireId, setFormulaireId] = useState<string | null>(null);

  // évite autosave pendant preload
  const hydrating = useRef(false);
  const saveTimer = useRef<number | null>(null);

  // ---- champs T2
  const [anneeImposition, setAnneeImposition] = useState<string>(initialYear || "");

  const [companyName, setCompanyName] = useState("");
  const [craNumber, setCraNumber] = useState("");
  const [neq, setNeq] = useState("");
  const [incProvince, setIncProvince] = useState("");

  const [addrStreet, setAddrStreet] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrProv, setAddrProv] = useState<ProvinceCode | "">("QC");
  const [addrPostal, setAddrPostal] = useState("");

  const [yearEnd, setYearEnd] = useState("");

  const [operatesInQuebec, setOperatesInQuebec] = useState<YesNo>("");
  const [hasRevenue, setHasRevenue] = useState<YesNo>("");
  const [paidSalary, setPaidSalary] = useState<YesNo>("");
  const [paidDividends, setPaidDividends] = useState<YesNo>("");
  const [hasAssets, setHasAssets] = useState<YesNo>("");
  const [hasLoans, setHasLoans] = useState<YesNo>("");

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [revenue, setRevenue] = useState("");
  const [expenses, setExpenses] = useState("");
  const [notes, setNotes] = useState("");

  const draftData: Formdata = useMemo(() => {
    const t2: T2Data = {
      anneeImposition: anneeImposition.trim(),

      companyName: companyName.trim(),
      craNumber: craNumber.trim(),
      neq: neq.trim(),
      incProvince: incProvince.trim(),

      addrStreet: addrStreet.trim(),
      addrCity: addrCity.trim(),
      addrProv,
      addrPostal: normalizePostal(addrPostal),

      yearEnd: yearEnd.trim(),

      operatesInQuebec,
      hasRevenue,
      paidSalary,
      paidDividends,
      hasAssets,
      hasLoans,

      contactName: contactName.trim(),
      contactPhone: normalizePhone(contactPhone),
      contactEmail: contactEmail.trim().toLowerCase(),

      revenue: revenue.trim(),
      expenses: expenses.trim(),
      notes: notes.trim(),
    };

    return { dossierType: type, t2 };
  }, [
    type,
    anneeImposition,
    companyName,
    craNumber,
    neq,
    incProvince,
    addrStreet,
    addrCity,
    addrProv,
    addrPostal,
    yearEnd,
    operatesInQuebec,
    hasRevenue,
    paidSalary,
    paidDividends,
    hasAssets,
    hasLoans,
    contactName,
    contactPhone,
    contactEmail,
    revenue,
    expenses,
    notes,
  ]);

  const saveDraft = useCallback(async (): Promise<string | null> => {
    if (hydrating.current) return formulaireId ?? null;
    if (submitting) return formulaireId ?? null;

    const annee = anneeImposition.trim() || null;

    // UPDATE
    if (formulaireId) {
      const { error } = await supabase
        .from(FORMS_TABLE)
        .update({ lang, annee, data: draftData })
        .eq("id", formulaireId)
        .eq("user_id", userId);

      if (error) throw new Error(supaErr(error));
      return formulaireId;
    }

    // INSERT
    const { data: dataInsert, error: errorInsert } = await supabase
      .from(FORMS_TABLE)
      .insert({
        user_id: userId,
        form_type: type,
        lang,
        status: "draft",
        annee,
        data: draftData,
      })
      .select("id")
      .single<InsertIdRow>();

    if (errorInsert) throw new Error(supaErr(errorInsert));

    const fid = dataInsert?.id ?? null;
    if (fid) setFormulaireId(fid);
    return fid;
  }, [userId, submitting, formulaireId, type, lang, draftData, anneeImposition]);

  // 🔥 Charge le dernier T2 (peu importe l'année) puis hydrate les champs depuis data.t2
  const loadLastForm = useCallback(async () => {
    hydrating.current = true;

    const { data: row, error } = await supabase
      .from(FORMS_TABLE)
      .select("id, data, created_at")
      .eq("user_id", userId)
      .eq("form_type", type)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<FormRow>();

    if (error) {
      setMsg(`Erreur chargement: ${error.message}`);
      hydrating.current = false;
      return;
    }

    if (!row?.data?.t2) {
      hydrating.current = false;
      return;
    }

    setFormulaireId(row.id);

    const t2 = row.data.t2;

    setAnneeImposition(t2.anneeImposition ?? "");

    setCompanyName(t2.companyName ?? "");
    setCraNumber(t2.craNumber ?? "");
    setNeq(t2.neq ?? "");
    setIncProvince(t2.incProvince ?? "");

    setAddrStreet(t2.addrStreet ?? "");
    setAddrCity(t2.addrCity ?? "");
    setAddrProv((t2.addrProv as ProvinceCode) ?? "QC");
    setAddrPostal(t2.addrPostal ? formatPostalInput(t2.addrPostal) : "");

    setYearEnd(t2.yearEnd ?? "");

    setOperatesInQuebec(t2.operatesInQuebec ?? "");
    setHasRevenue(t2.hasRevenue ?? "");
    setPaidSalary(t2.paidSalary ?? "");
    setPaidDividends(t2.paidDividends ?? "");
    setHasAssets(t2.hasAssets ?? "");
    setHasLoans(t2.hasLoans ?? "");

    setContactName(t2.contactName ?? "");
    setContactPhone(t2.contactPhone ? formatPhoneInput(t2.contactPhone) : "");
    setContactEmail(t2.contactEmail ?? "");

    setRevenue(t2.revenue ?? "");
    setExpenses(t2.expenses ?? "");
    setNotes(t2.notes ?? "");

    hydrating.current = false;
  }, [userId, type]);

  useEffect(() => {
    void loadLastForm();
  }, [loadLastForm]);

  // autosave debounce
  useEffect(() => {
    if (hydrating.current) return;

    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveDraft().catch(() => {});
    }, 800);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [lang, draftData, saveDraft]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace(`/espace-client?lang=${encodeURIComponent(lang)}`);
  }, [router, lang]);

  const goToDepotDocuments = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setMsg(null);

    try {
      setMsg("⏳ Préparation du dossier…");
      const fid = await saveDraft();
      if (!fid) throw new Error("Impossible de créer le dossier (fid manquant).");

      setMsg("✅ Redirection vers le dépôt…");
      router.push(
        `/formulaire-fiscal-t2/depot-documents?fid=${encodeURIComponent(fid)}&lang=${encodeURIComponent(lang)}`
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erreur dépôt documents.";
      setMsg("❌ " + message);
      setSubmitting(false);
    }
  }, [saveDraft, router, lang, submitting]);

  const btnContinue =
    lang === "fr" ? "Continuer →" : lang === "en" ? "Continue →" : "Continuar →";

  return (
    <main className="ff-bg">
      <div className="ff-container">
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
              <span>Formulaire fiscal</span>
            </div>
          </div>

          <button className="ff-btn ff-btn-outline" type="button" onClick={logout}>
            Se déconnecter
          </button>
        </header>

        <div className="ff-title">
          <h1>Formulaire – {formTitle}</h1>
          <p>Merci de remplir ce formulaire. Ces informations servent à préparer la déclaration T2 (et CO-17 si requis).</p>
        </div>

        {msg && (
          <div className="ff-card" style={{ padding: 14 }}>
            {msg}
          </div>
        )}

        <Steps step={1} lang={lang} />

        <form className="ff-form">
          {/* SECTION 1 */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Informations société</h2>
              <p>Informations essentielles pour ouvrir le dossier T2.</p>
            </div>

            <div className="ff-stack">
              <Field
                label="Année d’imposition (ex.: 2024)"
                value={anneeImposition}
                onChange={setAnneeImposition}
                placeholder="ex.: 2024"
                inputMode="numeric"
              />

              <div className="ff-grid2">
                <Field label="Nom légal de l’entreprise" value={companyName} onChange={setCompanyName} required />
                <Field label="Numéro d’entreprise (ARC) – BN (9 chiffres)" value={craNumber} onChange={setCraNumber} />
              </div>

              <div className="ff-grid2">
                <Field label="NEQ (si Québec)" value={neq} onChange={setNeq} />
                <Field label="Province d’incorporation" value={incProvince} onChange={setIncProvince} placeholder="QC / ON / ..." />
              </div>

              <Field label="Fin d’exercice (JJ/MM/AAAA)" value={yearEnd} onChange={setYearEnd} placeholder="31/12/2024" />

              <Field label="Adresse (rue)" value={addrStreet} onChange={setAddrStreet} />

              {/* ✅ Remplacé ff-grid4 (4 colonnes) par une structure 2 + 1 (plus stable) */}
              <div className="ff-grid2 ff-mt-sm">
                <Field label="Ville" value={addrCity} onChange={setAddrCity} />

                <SelectField<ProvinceCode | "">
                  label="Province"
                  value={addrProv}
                  onChange={setAddrProv}
                  options={PROVINCES}
                  required
                />
              </div>

              <div className="ff-mt-sm">
                <Field
                  label="Code postal"
                  value={addrPostal}
                  onChange={setAddrPostal}
                  placeholder="G1V 0A6"
                  formatter={formatPostalInput}
                  maxLength={7}
                  autoComplete="postal-code"
                />
              </div>
            </div>
          </section>

          {/* SECTION 2 */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Questions</h2>
              <p>Quelques questions pour orienter la préparation.</p>
            </div>

            <div className="ff-stack">
              <YesNoField
                name="operatesInQuebec"
                label="La société exerce-t-elle au Québec ? (CO-17)"
                value={operatesInQuebec}
                onChange={setOperatesInQuebec}
              />
              <YesNoField
                name="hasRevenue"
                label="Avez-vous eu des revenus durant l’année ?"
                value={hasRevenue}
                onChange={setHasRevenue}
              />
              <YesNoField
                name="paidSalary"
                label="Avez-vous payé des salaires (T4) ?"
                value={paidSalary}
                onChange={setPaidSalary}
              />
              <YesNoField
                name="paidDividends"
                label="Avez-vous versé des dividendes (T5) ?"
                value={paidDividends}
                onChange={setPaidDividends}
              />
              <YesNoField
                name="hasAssets"
                label="La société a-t-elle des actifs importants (ordinateur, véhicule, équipement) ?"
                value={hasAssets}
                onChange={setHasAssets}
              />
              <YesNoField
                name="hasLoans"
                label="La société a-t-elle des prêts / marge de crédit ?"
                value={hasLoans}
                onChange={setHasLoans}
              />
            </div>
          </section>

          {/* SECTION 3 */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Contact</h2>
              <p>Qui est la personne contact pour ce dossier ?</p>
            </div>

            <div className="ff-grid2">
              <Field label="Nom du responsable" value={contactName} onChange={setContactName} />
              <Field
                label="Téléphone"
                value={contactPhone}
                onChange={setContactPhone}
                placeholder="(418) 555-1234"
                inputMode="tel"
                formatter={formatPhoneInput}
                maxLength={14}
              />
            </div>

            <div className="ff-mt">
              <Field label="Courriel" value={contactEmail} onChange={setContactEmail} type="email" />
            </div>
          </section>

          {/* SECTION 4 */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Résumé financier (approx.)</h2>
              <p>Juste un aperçu (on validera avec les pièces et états financiers).</p>
            </div>

            <div className="ff-grid2">
              <Field label="Revenus ($)" value={revenue} onChange={setRevenue} inputMode="numeric" />
              <Field label="Dépenses ($)" value={expenses} onChange={setExpenses} inputMode="numeric" />
            </div>

            <div className="ff-mt">
              <Field
                label="Notes / précisions"
                value={notes}
                onChange={setNotes}
                placeholder="Ex.: année fiscale différente, dépenses perso payées par la cie, etc."
              />
            </div>
          </section>

          {/* ACTION */}
          <div className="ff-submit">
            <button
              type="button"
              className="ff-btn ff-btn-primary ff-btn-big"
              disabled={submitting}
              onClick={goToDepotDocuments}
            >
              {btnContinue}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
