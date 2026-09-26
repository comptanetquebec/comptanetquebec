"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

// CSS partagé présentiel
import "../formulaire-fiscal-presentiel/formulaire-fiscal-presentiel.css";

// UI partagé présentiel
import {
  Field,
  YesNoField,
  SelectField,
  type YesNo,
} from "../formulaire-fiscal-presentiel/ui";

/**
 * DB
 */
const FORMS_TABLE = "formulaires_fiscaux";
const FORM_TYPE_T2 = "T2" as const;

type Lang = "fr" | "en" | "es";

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

type FilingFrequency =
  | "monthly"
  | "quarterly"
  | "annual"
  | "unknown";

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

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

const FILING_FREQUENCIES: Array<
  SelectOption<FilingFrequency>
> = [
  { value: "monthly", label: "Mensuelle" },
  { value: "quarterly", label: "Trimestrielle" },
  { value: "annual", label: "Annuelle" },
  { value: "unknown", label: "Je ne sais pas" },
];

function supaErr(e: unknown) {
  if (!e || typeof e !== "object") {
    return "Erreur inconnue";
  }

  const err = e as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };

  return [
    err.message,
    err.details,
    err.hint,
    err.code,
  ]
    .filter(Boolean)
    .join(" | ");
}

function formatPhoneInput(v: string) {
  const d = (v || "")
    .replace(/\D+/g, "")
    .slice(0, 10);

  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 10);

  if (d.length === 0) return "";
  if (d.length <= 3) return `(${a}`;
  if (d.length <= 6) return `(${a}) ${b}`;

  return `(${a}) ${b}-${c}`;
}

function normalizePhone(v: string) {
  return (v || "")
    .replace(/\D+/g, "")
    .slice(0, 10);
}

function formatPostalInput(v: string) {
  const s = (v || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

  if (s.length <= 3) return s;

  return `${s.slice(0, 3)} ${s.slice(3, 6)}`;
}

function normalizePostal(v: string) {
  return (v || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

function formatDateInput(v: string) {
  const d = (v || "")
    .replace(/\D+/g, "")
    .slice(0, 8);

  const dd = d.slice(0, 2);
  const mm = d.slice(2, 4);
  const yyyy = d.slice(4, 8);

  if (d.length <= 2) return dd;
  if (d.length <= 4) return `${dd}/${mm}`;

  return `${dd}/${mm}/${yyyy}`;
}

function formatCraNumber(v: string) {
  return (v || "")
    .replace(/\D+/g, "")
    .slice(0, 9);
}

/**
 * Données T2.
 *
 * IMPORTANT : les anciens dossiers restent compatibles.
 * Les nouveaux champs sont simplement vides lorsqu'ils
 * n'existaient pas encore dans le JSON du dossier.
 */
type T2Data = {
  anneeImposition: string;

  companyName: string;
  craNumber: string;
  neq: string;
  incProvince: ProvinceCode | "";
  incorporationDate: string;
  yearEnd: string;

  addrStreet: string;
  addrCity: string;
  addrProv: ProvinceCode;
  addrPostal: string;

  businessActivity: string;
  operatesInQuebec: YesNo;
  firstT2: YesNo;

  shareholders: string;
  paidSalary: YesNo;
  paidDividends: YesNo;
  hasAssets: YesNo;
  hasLoans: YesNo;
  hasShareholderAmounts: YesNo;

  gstRegistered: YesNo;
  qstRegistered: YesNo;
  gstNumber: string;
  qstNumber: string;
  filingFrequency: FilingFrequency | "";

  financialReady: YesNo;
  hasRevenue: YesNo;
  revenue: string;
  expenses: string;

  contactName: string;
  contactPhone: string;
  contactEmail: string;

  notes: string;
};

type Formdata = {
  dossierType: typeof FORM_TYPE_T2;
  canal?: "presentiel";
  t2?: Partial<T2Data>;
};

type FormRow = {
  id: string;
  user_id: string | null;
  form_type: string | null;
  lang: Lang | null;
  annee: string | null;
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
  fid: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  /*
   * Présentiel :
   * on conserve le fid reçu en prop si présent,
   * sinon on récupère le fid dans l'URL.
   */
  const fidFromUrl =
    (searchParams.get("fid") ?? "").trim();

  const formulaireId =
    (fid || fidFromUrl).trim();
  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const hydrating = useRef(false);
  const saveTimer = useRef<number | null>(null);

  // -------------------------------------------------------------------------
  // 1. Société
  // -------------------------------------------------------------------------

  const [anneeImposition, setAnneeImposition] =
    useState("");

  const [companyName, setCompanyName] =
    useState("");

  const [craNumber, setCraNumber] =
    useState("");

  const [neq, setNeq] = useState("");

  const [incProvince, setIncProvince] =
    useState<ProvinceCode | "">("");

  const [incorporationDate, setIncorporationDate] =
    useState("");

  const [yearEnd, setYearEnd] =
    useState("");

  const [addrStreet, setAddrStreet] =
    useState("");

  const [addrCity, setAddrCity] =
    useState("");

  const [addrProv, setAddrProv] =
    useState<ProvinceCode>("QC");

  const [addrPostal, setAddrPostal] =
    useState("");

  // -------------------------------------------------------------------------
  // 2. Activité
  // -------------------------------------------------------------------------

  const [businessActivity, setBusinessActivity] =
    useState("");

  const [operatesInQuebec, setOperatesInQuebec] =
    useState<YesNo>("");

  const [firstT2, setFirstT2] =
    useState<YesNo>("");

  // -------------------------------------------------------------------------
  // 3. Actionnaires et opérations
  // -------------------------------------------------------------------------

  const [shareholders, setShareholders] =
    useState("");

  const [paidSalary, setPaidSalary] =
    useState<YesNo>("");

  const [paidDividends, setPaidDividends] =
    useState<YesNo>("");

  const [hasAssets, setHasAssets] =
    useState<YesNo>("");

  const [hasLoans, setHasLoans] =
    useState<YesNo>("");

  const [hasShareholderAmounts, setHasShareholderAmounts] =
    useState<YesNo>("");

  // -------------------------------------------------------------------------
  // 4. TPS / TVQ
  // -------------------------------------------------------------------------

  const [gstRegistered, setGstRegistered] =
    useState<YesNo>("");

  const [qstRegistered, setQstRegistered] =
    useState<YesNo>("");

  const [gstNumber, setGstNumber] =
    useState("");

  const [qstNumber, setQstNumber] =
    useState("");

  const [filingFrequency, setFilingFrequency] =
    useState<FilingFrequency | "">("");

  // -------------------------------------------------------------------------
  // 5. Finances
  // -------------------------------------------------------------------------

  const [financialReady, setFinancialReady] =
    useState<YesNo>("");

  const [hasRevenue, setHasRevenue] =
    useState<YesNo>("");

  const [revenue, setRevenue] =
    useState("");

  const [expenses, setExpenses] =
    useState("");

  // -------------------------------------------------------------------------
  // 6. Contact / notes
  // -------------------------------------------------------------------------

  const [contactName, setContactName] =
    useState("");

  const [contactPhone, setContactPhone] =
    useState("");

  const [contactEmail, setContactEmail] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const draftData: Formdata = useMemo(() => {
    const t2: T2Data = {
      anneeImposition: anneeImposition.trim(),

      companyName: companyName.trim(),
      craNumber: formatCraNumber(craNumber),
      neq: neq.trim(),
      incProvince,
      incorporationDate: incorporationDate.trim(),
      yearEnd: yearEnd.trim(),

      addrStreet: addrStreet.trim(),
      addrCity: addrCity.trim(),
      addrProv,
      addrPostal: normalizePostal(addrPostal),

      businessActivity: businessActivity.trim(),
      operatesInQuebec,
      firstT2,

      shareholders: shareholders.trim(),
      paidSalary,
      paidDividends,
      hasAssets,
      hasLoans,
      hasShareholderAmounts,

      gstRegistered,
      qstRegistered,
      gstNumber:
        gstRegistered === "oui"
          ? gstNumber.trim()
          : "",
      qstNumber:
        qstRegistered === "oui"
          ? qstNumber.trim()
          : "",
      filingFrequency:
        gstRegistered === "oui" ||
        qstRegistered === "oui"
          ? filingFrequency
          : "",

      financialReady,
      hasRevenue,
      revenue:
        financialReady === "oui" &&
        hasRevenue === "oui"
          ? revenue.trim()
          : "",
      expenses:
        financialReady === "oui"
          ? expenses.trim()
          : "",

      contactName: contactName.trim(),
      contactPhone: normalizePhone(contactPhone),
      contactEmail: contactEmail
        .trim()
        .toLowerCase(),

      notes: notes.trim(),
    };

    return {
      dossierType: FORM_TYPE_T2,
      canal: "presentiel",
      t2,
    };
  }, [
    anneeImposition,
    companyName,
    craNumber,
    neq,
    incProvince,
    incorporationDate,
    yearEnd,
    addrStreet,
    addrCity,
    addrProv,
    addrPostal,
    businessActivity,
    operatesInQuebec,
    firstT2,
    shareholders,
    paidSalary,
    paidDividends,
    hasAssets,
    hasLoans,
    hasShareholderAmounts,
    gstRegistered,
    qstRegistered,
    gstNumber,
    qstNumber,
    filingFrequency,
    financialReady,
    hasRevenue,
    revenue,
    expenses,
    contactName,
    contactPhone,
    contactEmail,
    notes,
  ]);

  // -------------------------------------------------------------------------
  // Sauvegarde automatique — UPDATE ONLY
  // -------------------------------------------------------------------------

  const saveDraft = useCallback(
    async (): Promise<string> => {
      if (!formulaireId) {
        throw new Error("fid manquant");
      }

      if (hydrating.current) {
        return formulaireId;
      }

      if (submitting) {
        return formulaireId;
      }

      const annee =
        anneeImposition.trim() || null;

      const { error } = await supabase
        .from(FORMS_TABLE)
        .update({
          lang,
          annee,
          data: draftData,
          status: "en_cours",
        })
        .eq("id", formulaireId)
        .eq("form_type", FORM_TYPE_T2);

      if (error) {
        throw new Error(supaErr(error));
      }

      return formulaireId;
    },
    [
      anneeImposition,
      draftData,
      formulaireId,
      lang,
      submitting,
      userId,
    ]
  );

  // -------------------------------------------------------------------------
  // Chargement du dossier existant
  // -------------------------------------------------------------------------

  const loadForm = useCallback(async () => {
    if (!formulaireId) {
      setMsg("❌ fid manquant.");
      return;
    }

    setLoading(true);
    hydrating.current = true;
    setMsg(null);

    try {
      const { data: row, error } = await supabase
        .from(FORMS_TABLE)
        .select(
          "id, user_id, form_type, lang, annee, data, created_at"
        )
        .eq("id", formulaireId)
        .eq("form_type", FORM_TYPE_T2)
        .maybeSingle<FormRow>();

      if (error) {
        throw new Error(supaErr(error));
      }

      if (!row?.data?.t2) {
        return;
      }

      const t2 = row.data.t2;

      setAnneeImposition(
        t2.anneeImposition ?? row.annee ?? ""
      );

      setCompanyName(t2.companyName ?? "");
      setCraNumber(t2.craNumber ?? "");
      setNeq(t2.neq ?? "");
      setIncProvince(
        (t2.incProvince ?? "") as
          | ProvinceCode
          | ""
      );
      setIncorporationDate(
        t2.incorporationDate ?? ""
      );
      setYearEnd(t2.yearEnd ?? "");

      setAddrStreet(t2.addrStreet ?? "");
      setAddrCity(t2.addrCity ?? "");
      setAddrProv(
        (t2.addrProv ?? "QC") as ProvinceCode
      );
      setAddrPostal(
        t2.addrPostal
          ? formatPostalInput(t2.addrPostal)
          : ""
      );

      setBusinessActivity(
        t2.businessActivity ?? ""
      );
      setOperatesInQuebec(
        t2.operatesInQuebec ?? ""
      );
      setFirstT2(t2.firstT2 ?? "");

      setShareholders(t2.shareholders ?? "");
      setPaidSalary(t2.paidSalary ?? "");
      setPaidDividends(t2.paidDividends ?? "");
      setHasAssets(t2.hasAssets ?? "");
      setHasLoans(t2.hasLoans ?? "");
      setHasShareholderAmounts(
        t2.hasShareholderAmounts ?? ""
      );

      setGstRegistered(t2.gstRegistered ?? "");
      setQstRegistered(t2.qstRegistered ?? "");
      setGstNumber(t2.gstNumber ?? "");
      setQstNumber(t2.qstNumber ?? "");
      setFilingFrequency(
        (t2.filingFrequency ?? "") as
          | FilingFrequency
          | ""
      );

      setFinancialReady(t2.financialReady ?? "");
      setHasRevenue(t2.hasRevenue ?? "");
      setRevenue(t2.revenue ?? "");
      setExpenses(t2.expenses ?? "");

      setContactName(t2.contactName ?? "");
      setContactPhone(
        t2.contactPhone
          ? formatPhoneInput(t2.contactPhone)
          : ""
      );
      setContactEmail(t2.contactEmail ?? "");

      setNotes(t2.notes ?? "");
    } catch (e: unknown) {
      setMsg(
        "❌ " +
          (e instanceof Error
            ? e.message
            : "Erreur chargement")
      );
    } finally {
      hydrating.current = false;
      setLoading(false);
    }
  }, [formulaireId, userId]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  // -------------------------------------------------------------------------
  // Autosave 800 ms
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!formulaireId) return;
    if (hydrating.current) return;

    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(
      () => {
        saveDraft().catch(() => {});
      },
      800
    );

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(
          saveTimer.current
        );
      }
    };
  }, [draftData, saveDraft, formulaireId]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();

    router.replace(
      `/espace-client?lang=${encodeURIComponent(
        lang
      )}`
    );
  }, [router, lang]);

  // -------------------------------------------------------------------------
  // Enregistrer = dossier reçu
  // -------------------------------------------------------------------------

  const enregistrer = useCallback(async () => {
    if (!formulaireId) {
      setMsg("❌ fid manquant.");
      return;
    }

    if (submitting) return;

    setSubmitting(true);
    setMsg(null);

    try {
      setMsg("⏳ Sauvegarde…");

      const id = await saveDraft();

      const annee =
        anneeImposition.trim() || null;

      const { error } = await supabase
        .from(FORMS_TABLE)
        .update({
          status: "recu",
          annee,
          data: draftData,
          lang,
        })
        .eq("id", id)
        .eq("form_type", FORM_TYPE_T2);

      if (error) {
        throw new Error(supaErr(error));
      }

      setMsg(
        "✅ Dossier présentiel T2 enregistré."
      );
    } catch (e: unknown) {
      setMsg(
        "❌ " +
          (e instanceof Error
            ? e.message
            : "Erreur")
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    anneeImposition,
    draftData,
    formulaireId,
    saveDraft,
    submitting,
    lang,
    userId,
  ]);

  if (!formulaireId) {
    return (
      <main className="ff-bg">
        <div className="ff-container">
          <div
            className="ff-card"
            style={{ padding: 14 }}
          >
            ❌ fid manquant (présentiel).
          </div>
        </div>
      </main>
    );
  }

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
              style={{
                height: 40,
                width: "auto",
              }}
            />

            <div className="ff-brand-text">
              <strong>ComptaNet Québec</strong>
              <span>
                Présentiel — Société (T2)
              </span>
            </div>
          </div>

          <button
            className="ff-btn ff-btn-outline"
            type="button"
            onClick={logout}
          >
            Se déconnecter
          </button>
        </header>

        <div className="ff-title">
          <h1>Dossier société — T2</h1>
          <p>
            Renseignements utiles pour préparer le
            dossier de la société. Les modifications
            sont sauvegardées automatiquement.
          </p>
        </div>

        {msg && (
          <div
            className="ff-card"
            style={{ padding: 14 }}
          >
            {msg}
          </div>
        )}

        {loading && (
          <div
            className="ff-card"
            style={{ padding: 14 }}
          >
            Chargement…
          </div>
        )}

        <form className="ff-form">
          {/* --------------------------------------------------------------- */}
          {/* 1 — Société                                                    */}
          {/* --------------------------------------------------------------- */}

          <section className="ff-card">
            <div className="ff-card-head">
              <h2>1. Informations société</h2>
              <p>
                Identification de la société et période
                fiscale.
              </p>
            </div>

            <div className="ff-stack">
              <Field
                label="Année d’imposition (ex. : 2025)"
                value={anneeImposition}
                onChange={setAnneeImposition}
                inputMode="numeric"
              />

              <div className="ff-grid2">
                <Field
                  label="Nom légal de l’entreprise"
                  value={companyName}
                  onChange={setCompanyName}
                  required
                />

                <Field
                  label="Numéro d’entreprise ARC (9 chiffres)"
                  value={craNumber}
                  onChange={setCraNumber}
                  inputMode="numeric"
                  formatter={formatCraNumber}
                  maxLength={9}
                />
              </div>

              <div className="ff-grid2">
                <Field
                  label="NEQ (si Québec)"
                  value={neq}
                  onChange={setNeq}
                />

                <SelectField<ProvinceCode>
                  label="Province d’incorporation"
                  value={incProvince as ProvinceCode}
                  onChange={setIncProvince}
                  options={PROVINCES}
                />
              </div>

              <div className="ff-grid2">
                <Field
                  label="Date d’incorporation (JJ/MM/AAAA)"
                  value={incorporationDate}
                  onChange={setIncorporationDate}
                  placeholder="01/05/2024"
                  inputMode="numeric"
                  formatter={formatDateInput}
                  maxLength={10}
                />

                <Field
                  label="Fin d’exercice (JJ/MM/AAAA)"
                  value={yearEnd}
                  onChange={setYearEnd}
                  placeholder="30/04/2026"
                  inputMode="numeric"
                  formatter={formatDateInput}
                  maxLength={10}
                />
              </div>

              <Field
                label="Adresse (rue)"
                value={addrStreet}
                onChange={setAddrStreet}
              />

              <div className="ff-grid2 ff-mt-sm">
                <Field
                  label="Ville"
                  value={addrCity}
                  onChange={setAddrCity}
                />

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

          {/* --------------------------------------------------------------- */}
          {/* 2 — Activité                                                    */}
          {/* --------------------------------------------------------------- */}

          <section className="ff-card">
            <div className="ff-card-head">
              <h2>2. Activité de la société</h2>
              <p>
                Informations générales pour orienter la
                préparation de la T2 et du CO-17.
              </p>
            </div>

            <div className="ff-stack">
              <Field
                label="Activité principale de la société"
                value={businessActivity}
                onChange={setBusinessActivity}
                placeholder="Ex. : déneigement, construction, consultation…"
              />

              <YesNoField
                name="operatesInQuebec"
                label="La société exerce-t-elle des activités au Québec ?"
                value={operatesInQuebec}
                onChange={setOperatesInQuebec}
              />

              <YesNoField
                name="firstT2"
                label="S’agit-il de la première déclaration T2 de la société ?"
                value={firstT2}
                onChange={setFirstT2}
              />
            </div>
          </section>

          {/* --------------------------------------------------------------- */}
          {/* 3 — Actionnaires / opérations                                   */}
          {/* --------------------------------------------------------------- */}

          <section className="ff-card">
            <div className="ff-card-head">
              <h2>3. Actionnaires et opérations</h2>
              <p>
                Éléments importants à vérifier dans un
                dossier de société.
              </p>
            </div>

            <div className="ff-stack">
              <Field
                label="Actionnaire(s) et pourcentage(s)"
                value={shareholders}
                onChange={setShareholders}
                placeholder="Ex. : Martine Moreau — 100 %"
              />

              <YesNoField
                name="paidSalary"
                label="La société a-t-elle versé des salaires ou produit des T4 / RL-1 ?"
                value={paidSalary}
                onChange={setPaidSalary}
              />

              <YesNoField
                name="paidDividends"
                label="La société a-t-elle versé des dividendes ou produit des T5 / RL-3 ?"
                value={paidDividends}
                onChange={setPaidDividends}
              />

              <YesNoField
                name="hasAssets"
                label="La société possède-t-elle des véhicules, équipements, ordinateurs, immeubles ou autres immobilisations ?"
                value={hasAssets}
                onChange={setHasAssets}
              />

              <YesNoField
                name="hasLoans"
                label="La société a-t-elle un prêt bancaire ou une marge de crédit ?"
                value={hasLoans}
                onChange={setHasLoans}
              />

              <YesNoField
                name="hasShareholderAmounts"
                label="Y a-t-il des sommes dues à un actionnaire ou dues par un actionnaire ?"
                value={hasShareholderAmounts}
                onChange={setHasShareholderAmounts}
              />
            </div>
          </section>

          {/* --------------------------------------------------------------- */}
          {/* 4 — TPS / TVQ                                                   */}
          {/* --------------------------------------------------------------- */}

          <section className="ff-card">
            <div className="ff-card-head">
              <h2>4. TPS / TVQ</h2>
              <p>
                Inscription et fréquence de remise de la
                société.
              </p>
            </div>

            <div className="ff-stack">
              <YesNoField
                name="gstRegistered"
                label="La société est-elle inscrite à la TPS ?"
                value={gstRegistered}
                onChange={setGstRegistered}
              />

              {gstRegistered === "oui" && (
                <Field
                  label="Numéro TPS"
                  value={gstNumber}
                  onChange={setGstNumber}
                />
              )}

              <YesNoField
                name="qstRegistered"
                label="La société est-elle inscrite à la TVQ ?"
                value={qstRegistered}
                onChange={setQstRegistered}
              />

              {qstRegistered === "oui" && (
                <Field
                  label="Numéro TVQ"
                  value={qstNumber}
                  onChange={setQstNumber}
                />
              )}

              {(gstRegistered === "oui" ||
                qstRegistered === "oui") && (
                <SelectField<FilingFrequency>
                  label="Fréquence de remise TPS / TVQ"
                  value={
                    filingFrequency as FilingFrequency
                  }
                  onChange={setFilingFrequency}
                  options={FILING_FREQUENCIES}
                />
              )}
            </div>
          </section>

          {/* --------------------------------------------------------------- */}
          {/* 5 — Finances                                                    */}
          {/* --------------------------------------------------------------- */}

          <section className="ff-card">
            <div className="ff-card-head">
              <h2>5. Informations financières</h2>
              <p>
                Permet de savoir si les chiffres sont déjà
                prêts ou s’il reste de la compilation à
                faire.
              </p>
            </div>

            <div className="ff-stack">
              <YesNoField
                name="financialReady"
                label="Les revenus et dépenses sont-ils déjà compilés et organisés ?"
                value={financialReady}
                onChange={setFinancialReady}
              />

              {financialReady === "non" && (
                <div
                  className="ff-card"
                  style={{
                    padding: 12,
                    boxShadow: "none",
                  }}
                >
                  Données financières à compiler.
                </div>
              )}

              <YesNoField
                name="hasRevenue"
                label="La société a-t-elle eu des revenus durant l’exercice ?"
                value={hasRevenue}
                onChange={setHasRevenue}
              />

              {financialReady === "oui" && (
                <div className="ff-grid2">
                  <Field
                    label="Revenus totaux ($)"
                    value={
                      hasRevenue === "non"
                        ? "0"
                        : revenue
                    }
                    onChange={
                      hasRevenue === "non"
                        ? () => {}
                        : setRevenue
                    }
                    inputMode="decimal"
                  />

                  <Field
                    label="Dépenses totales ($)"
                    value={expenses}
                    onChange={setExpenses}
                    inputMode="decimal"
                  />
                </div>
              )}
            </div>
          </section>

          {/* --------------------------------------------------------------- */}
          {/* 6 — Contact                                                     */}
          {/* --------------------------------------------------------------- */}

          <section className="ff-card">
            <div className="ff-card-head">
              <h2>6. Personne responsable du dossier</h2>
              <p>
                Personne à contacter si une information ou
                un document manque.
              </p>
            </div>

            <div className="ff-grid2">
              <Field
                label="Nom du responsable"
                value={contactName}
                onChange={setContactName}
              />

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
              <Field
                label="Courriel"
                value={contactEmail}
                onChange={setContactEmail}
                type="email"
              />
            </div>
          </section>

          {/* --------------------------------------------------------------- */}
          {/* 7 — Notes                                                       */}
          {/* --------------------------------------------------------------- */}

          <section className="ff-card">
            <div className="ff-card-head">
              <h2>7. Notes / précisions</h2>
              <p>
                Tout renseignement utile pour la préparation
                du dossier T2.
              </p>
            </div>

            <Field
              label="Notes / précisions"
              value={notes}
              onChange={setNotes}
            />
          </section>

          <div className="ff-submit">
            <button
              type="button"
              className="ff-btn ff-btn-primary ff-btn-big"
              disabled={submitting || loading}
              onClick={enregistrer}
            >
              {submitting
                ? "Enregistrement…"
                : "Enregistrer (présentiel)"}
            </button>

            <div
              className="ff-muted"
              style={{ marginTop: 10 }}
            >
              Dossier : <strong>{formulaireId}</strong>
              {submitting
                ? " — enregistrement…"
                : ""}
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
