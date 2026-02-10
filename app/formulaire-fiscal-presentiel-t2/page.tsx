"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

// ✅ CSS présentiel (global)
import "../formulaire-fiscal/formulaire-fiscal-presentiel.css";

import { Field, YesNoField, SelectField, type YesNo } from "@/app/formulaire-fiscal-presentiel/ui";

/**
 * DB
 */
const FORMS_TABLE = "formulaires_fiscaux";

type Lang = "fr" | "en" | "es";
type FormTypeDb = "T2";
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

type SelectOption<T extends string> = { value: T; label: string };

const PROVINCES: Array<SelectOption<ProvinceCode>> = [
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

type T2Data = {
  anneeImposition: string;

  companyName: string;
  craNumber: string;
  neq: string;
  incProvince: string;

  addrStreet: string;
  addrCity: string;
  addrProv: ProvinceCode;
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
  canal?: "presentiel";
  t2?: T2Data;
};

type FormRow = {
  id: string;
  data: Formdata | null;
  created_at: string | null;
};

export default function PresentielT2Client({
  userId,
  lang,
  fid,
}: {
  userId: string;
  lang: Lang;
  fid: string; // ✅ dossier existant (présentiel)
}) {
  const router = useRouter();
  const type: FormTypeDb = "T2";

  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ✅ présentiel: on prend fid comme dossier courant
  const [formulaireId, setFormulaireId] = useState<string | null>(fid || null);

  const hydrating = useRef(false);
  const saveTimer = useRef<number | null>(null);

  // ---- champs T2
  const [anneeImposition, setAnneeImposition] = useState<string>("");

  const [companyName, setCompanyName] = useState("");
  const [craNumber, setCraNumber] = useState("");
  const [neq, setNeq] = useState("");
  const [incProvince, setIncProvince] = useState("");

  const [addrStreet, setAddrStreet] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrProv, setAddrProv] = useState<ProvinceCode>("QC");
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

    return { dossierType: type, canal: "presentiel", t2 };
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

  // ✅ présentiel: UPDATE si formulaireId existe (fid), sinon INSERT (fallback)
  const saveDraft = useCallback(async (): Promise<string | null> => {
    if (hydrating.current) return formulaireId ?? null;
    if (submitting) return formulaireId ?? null;

    const annee = anneeImposition.trim() || null;

    if (formulaireId) {
      const { error } = await supabase
        .from(FORMS_TABLE)
        .update({ lang, annee, data: draftData })
        .eq("id", formulaireId);

      if (error) throw new Error(supaErr(error));
      return formulaireId;
    }

    // fallback (si tu ouvres sans fid)
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
    const newId = dataInsert?.id ?? null;
    if (newId) setFormulaireId(newId);
    return newId;
  }, [anneeImposition, draftData, formulaireId, lang, submitting, type, userId]);

  // ✅ présentiel: charge le dossier par ID (fid)
  const loadForm = useCallback(async () => {
    if (!formulaireId) return;

    hydrating.current = true;
    setMsg(null);

    try {
      const { data: row, error } = await supabase
        .from(FORMS_TABLE)
        .select("id, data, created_at")
        .eq("id", formulaireId)
        .maybeSingle<FormRow>();

      if (error) throw new Error(supaErr(error));
      if (!row?.data?.t2) return;

      const t2 = row.data.t2;

      setAnneeImposition(t2.anneeImposition ?? "");
      setCompanyName(t2.companyName ?? "");
      setCraNumber(t2.craNumber ?? "");
      setNeq(t2.neq ?? "");
      setIncProvince(t2.incProvince ?? "");

      setAddrStreet(t2.addrStreet ?? "");
      setAddrCity(t2.addrCity ?? "");
      setAddrProv(((t2.addrProv ?? "QC") as ProvinceCode));
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
    } catch (e: unknown) {
      setMsg("❌ " + (e instanceof Error ? e.message : "Erreur chargement"));
    } finally {
      hydrating.current = false;
    }
  }, [formulaireId]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

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
  }, [draftData, saveDraft]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace(`/espace-client?lang=${encodeURIComponent(lang)}`);
  }, [router, lang]);

  // ✅ bouton “Terminer” (met le dossier en recu)
  const terminer = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setMsg(null);

    try {
      setMsg("⏳ Sauvegarde…");
      const id = await saveDraft();
      if (!id) throw new Error("fid manquant");

      const annee = anneeImposition.trim() || null;

      const { error } = await supabase
        .from(FORMS_TABLE)
        .update({ status: "recu", annee, data: draftData, lang })
        .eq("id", id);

      if (error) throw new Error(supaErr(error));

      setMsg("✅ Dossier présentiel T2 enregistré.");
    } catch (e: unknown) {
      setMsg("❌ " + (e instanceof Error ? e.message : "Erreur"));
    } finally {
      setSubmitting(false);
    }
  }, [anneeImposition, draftData, saveDraft, submitting, lang]);

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
              <span>Présentiel — Société (T2)</span>
            </div>
          </div>

          <button className="ff-btn ff-btn-outline" type="button" onClick={logout}>
            Se déconnecter
          </button>
        </header>

        {msg && (
          <div className="ff-card" style={{ padding: 14 }}>
            {msg}
          </div>
        )}

        <form className="ff-form">
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Informations société</h2>
              <p>Ouverture du dossier T2 (présentiel).</p>
            </div>

            <div className="ff-stack">
              <Field
                label="Année d’imposition (ex.: 2025)"
                value={anneeImposition}
                onChange={setAnneeImposition}
                inputMode="numeric"
              />

              <div className="ff-grid2">
                <Field label="Nom légal de l’entreprise" value={companyName} onChange={setCompanyName} required />
                <Field label="Numéro d’entreprise (ARC) – BN" value={craNumber} onChange={setCraNumber} />
              </div>

              <div className="ff-grid2">
                <Field label="NEQ (si Québec)" value={neq} onChange={setNeq} />
                <Field
                  label="Province d’incorporation"
                  value={incProvince}
                  onChange={setIncProvince}
                  placeholder="QC / ON / ..."
                />
              </div>

              <Field
                label="Fin d’exercice (JJ/MM/AAAA)"
                value={yearEnd}
                onChange={setYearEnd}
                placeholder="31/12/2025"
              />

              <Field label="Adresse (rue)" value={addrStreet} onChange={setAddrStreet} />
              <div className="ff-grid2 ff-mt-sm">
                <Field label="Ville" value={addrCity} onChange={setAddrCity} />
                <SelectField<ProvinceCode>
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

          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Questions</h2>
              <p>Pour orienter la préparation.</p>
            </div>

            <div className="ff-stack">
              <YesNoField
                name="operatesInQuebec"
                label="La société exerce-t-elle au Québec ? (CO-17)"
                value={operatesInQuebec}
                onChange={setOperatesInQuebec}
              />
              <YesNoField name="hasRevenue" label="Revenus durant l’année ?" value={hasRevenue} onChange={setHasRevenue} />
              <YesNoField name="paidSalary" label="Salaires payés (T4) ?" value={paidSalary} onChange={setPaidSalary} />
              <YesNoField
                name="paidDividends"
                label="Dividendes versés (T5) ?"
                value={paidDividends}
                onChange={setPaidDividends}
              />
              <YesNoField
                name="hasAssets"
                label="Actifs importants (ordi, véhicule, équipement) ?"
                value={hasAssets}
                onChange={setHasAssets}
              />
              <YesNoField name="hasLoans" label="Prêts / marge de crédit ?" value={hasLoans} onChange={setHasLoans} />
            </div>
          </section>

          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Contact</h2>
              <p>Responsable du dossier.</p>
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

          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Résumé financier (approx.)</h2>
              <p>On validera avec les pièces.</p>
            </div>

            <div className="ff-grid2">
              <Field label="Revenus ($)" value={revenue} onChange={setRevenue} inputMode="numeric" />
              <Field label="Dépenses ($)" value={expenses} onChange={setExpenses} inputMode="numeric" />
            </div>

            <div className="ff-mt">
              <Field label="Notes / précisions" value={notes} onChange={setNotes} />
            </div>
          </section>

          <div className="ff-submit">
            <button
              type="button"
              className="ff-btn ff-btn-primary ff-btn-big"
              disabled={submitting}
              onClick={terminer}
            >
              Enregistrer (présentiel)
            </button>

            <div className="ff-muted" style={{ marginTop: 10 }}>
              {formulaireId ? `Dossier: ${formulaireId}` : "fid manquant"}
              {submitting ? " — enregistrement…" : ""}
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
