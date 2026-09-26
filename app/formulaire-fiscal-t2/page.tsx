"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

import "./formulaire-fiscal.css";

import Steps from "./Steps";
import RequireAuth from "./RequireAuth";
import {
  Field,
  YesNoField,
  SelectField,
  type YesNo,
  type SelectOption,
} from "./ui";

import {
  resolveLangFromParamsT2 as resolveLangFromParams,
  type Lang,
} from "./_lib/lang";

/* ===========================
   DB
=========================== */

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

type FilingFrequency = "monthly" | "quarterly" | "annual" | "unknown";

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
  const err = e as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };
  return [err.message, err.details, err.hint, err.code]
    .filter(Boolean)
    .join(" | ");
}

/* ===========================
   Payload T2
=========================== */

type T2Data = {
  anneeImposition: string;

  companyName: string;
  craNumber: string;
  neq: string;
  incProvince: ProvinceCode;
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

  confirmations: {
    exactitude: boolean;
    dossierComplet: boolean;
    fraisVariables: boolean;
    delais: boolean;
    consentement: boolean;
  };
};

type Formdata = {
  dossierType: FormTypeDb;
  t2?: T2Data;
};

type FormRow = {
  id: string;
  data: Formdata | null;
  created_at: string | null;
};

function titleFromType(type: FormTypeDb) {
  return type === "T2" ? "Société (T2)" : "Particulier (T1)";
}

/* ===========================
   Format / normalize
=========================== */

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
  const d = (v || "").replace(/\D+/g, "").slice(0, 8);
  const dd = d.slice(0, 2);
  const mm = d.slice(2, 4);
  const yyyy = d.slice(4, 8);

  if (d.length <= 2) return dd;
  if (d.length <= 4) return `${dd}/${mm}`;
  return `${dd}/${mm}/${yyyy}`;
}

function normalizeCraNumber(v: string) {
  return (v || "").replace(/\D+/g, "").slice(0, 9);
}

/* ===========================
   Validation
=========================== */

function isValidYear(v: string) {
  const y = (v || "").trim();
  if (!/^\d{4}$/.test(y)) return false;
  const n = Number(y);
  return n >= 2000 && n <= 2100;
}

function isValidDateJJMMAAAA(v: string) {
  const s = (v || "").trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return false;

  const [ddStr, mmStr, yyyyStr] = s.split("/");
  const dd = Number(ddStr);
  const mm = Number(mmStr);
  const yyyy = Number(yyyyStr);

  if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy))
    return false;

  if (yyyy < 1900 || yyyy > 2100) return false;
  if (mm < 1 || mm > 12) return false;

  const daysInMonth = new Date(yyyy, mm, 0).getDate();
  return dd >= 1 && dd <= daysInMonth;
}

function isValidPostal(v: string) {
  const postal = normalizePostal(v);
  return /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTVWXYZ]\d[ABCEGHJ-NPRSTVWXYZ]\d$/.test(
    postal
  );
}

function isValidEmail(v: string) {
  const s = (v || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isValidPhone(v: string) {
  return normalizePhone(v).length === 10;
}

function isValidCraNumber(v: string) {
  return normalizeCraNumber(v).length === 9;
}

/* ===========================
   Wrapper
=========================== */

export default function FormulaireFiscalT2Page() {
  const paramsRO = useSearchParams();
  const params = useMemo(
    () => new URLSearchParams(paramsRO.toString()),
    [paramsRO]
  );

  const type: FormTypeDb = "T2";
  const lang: Lang = useMemo(() => resolveLangFromParams(params), [params]);

  const yearParam = (params.get("year") || "").trim();
  const fid = (params.get("fid") || "").trim() || null;

  const nextPath = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("lang", lang);

    if (yearParam) qs.set("year", yearParam);
    if (fid) qs.set("fid", fid);

    return `/formulaire-fiscal-t2?${qs.toString()}`;
  }, [lang, yearParam, fid]);

  return (
    <RequireAuth lang={lang} nextPath={nextPath}>
      {(userId) => (
        <FormulaireFiscalT2Inner
          userId={userId}
          lang={lang}
          type={type}
          initialYear={yearParam}
          initialFid={fid}
        />
      )}
    </RequireAuth>
  );
}

/* ===========================
   Inner
=========================== */

function FormulaireFiscalT2Inner({
  userId,
  lang,
  type,
  initialYear,
  initialFid,
}: {
  userId: string;
  lang: Lang;
  type: FormTypeDb;
  initialYear: string;
  initialFid: string | null;
}) {
  const router = useRouter();
  const formTitle = titleFromType(type);

  const t = useCallback(
    (fr: string, en: string, es: string) =>
      lang === "fr" ? fr : lang === "en" ? en : es,
    [lang]
  );

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [formulaireId, setFormulaireId] = useState<string | null>(initialFid);
  const [currentFid, setCurrentFid] = useState<string | null>(initialFid);
  const fidDisplay = currentFid || formulaireId;

  const hydrating = useRef(false);
  const saveTimer = useRef<number | null>(null);

  /* ===========================
     States
  =========================== */

  const [anneeImposition, setAnneeImposition] = useState(initialYear || "");

  const [companyName, setCompanyName] = useState("");
  const [craNumber, setCraNumber] = useState("");
  const [neq, setNeq] = useState("");
  const [incProvince, setIncProvince] = useState<ProvinceCode>("QC");
  const [incorporationDate, setIncorporationDate] = useState("");
  const [yearEnd, setYearEnd] = useState("");

  const [addrStreet, setAddrStreet] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrProv, setAddrProv] = useState<ProvinceCode>("QC");
  const [addrPostal, setAddrPostal] = useState("");

  const [businessActivity, setBusinessActivity] = useState("");
  const [operatesInQuebec, setOperatesInQuebec] = useState<YesNo>("");
  const [firstT2, setFirstT2] = useState<YesNo>("");

  const [shareholders, setShareholders] = useState("");
  const [paidSalary, setPaidSalary] = useState<YesNo>("");
  const [paidDividends, setPaidDividends] = useState<YesNo>("");
  const [hasAssets, setHasAssets] = useState<YesNo>("");
  const [hasLoans, setHasLoans] = useState<YesNo>("");
  const [hasShareholderAmounts, setHasShareholderAmounts] =
    useState<YesNo>("");

  const [gstRegistered, setGstRegistered] = useState<YesNo>("");
  const [qstRegistered, setQstRegistered] = useState<YesNo>("");
  const [gstNumber, setGstNumber] = useState("");
  const [qstNumber, setQstNumber] = useState("");
  const [filingFrequency, setFilingFrequency] =
    useState<FilingFrequency | "">("");

  const [financialReady, setFinancialReady] = useState<YesNo>("");
  const [hasRevenue, setHasRevenue] = useState<YesNo>("");
  const [revenue, setRevenue] = useState("");
  const [expenses, setExpenses] = useState("");

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [notes, setNotes] = useState("");

  const [vExactitude, setVExactitude] = useState(false);
  const [vDossierComplet, setVDossierComplet] = useState(false);
  const [vFraisVariables, setVFraisVariables] = useState(false);
  const [vDelais, setVDelais] = useState(false);
  const [vConsentement, setVConsentement] = useState(false);

  const frequencyOptions = useMemo<Array<SelectOption<FilingFrequency>>>(
    () => [
      {
        value: "monthly",
        label: t("Mensuelle", "Monthly", "Mensual"),
      },
      {
        value: "quarterly",
        label: t("Trimestrielle", "Quarterly", "Trimestral"),
      },
      {
        value: "annual",
        label: t("Annuelle", "Annual", "Anual"),
      },
      {
        value: "unknown",
        label: t("Je ne sais pas", "I don't know", "No lo sé"),
      },
    ],
    [t]
  );

  /* ===========================
     Build draft
  =========================== */

  const draftData: Formdata = useMemo(() => {
    const t2: T2Data = {
      anneeImposition: anneeImposition.trim(),

      companyName: companyName.trim(),
      craNumber: normalizeCraNumber(craNumber),
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
      gstNumber: gstRegistered === "oui" ? gstNumber.trim() : "",
      qstNumber: qstRegistered === "oui" ? qstNumber.trim() : "",
      filingFrequency:
        gstRegistered === "oui" || qstRegistered === "oui"
          ? filingFrequency
          : "",

      financialReady,
      hasRevenue,
      revenue:
        financialReady === "oui" && hasRevenue === "oui"
          ? revenue.trim()
          : "",
      expenses: financialReady === "oui" ? expenses.trim() : "",

      contactName: contactName.trim(),
      contactPhone: normalizePhone(contactPhone),
      contactEmail: contactEmail.trim().toLowerCase(),

      notes: notes.trim(),

      confirmations: {
        exactitude: vExactitude,
        dossierComplet: vDossierComplet,
        fraisVariables: vFraisVariables,
        delais: vDelais,
        consentement: vConsentement,
      },
    };

    return { dossierType: type, t2 };
  }, [
    type,
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
    vExactitude,
    vDossierComplet,
    vFraisVariables,
    vDelais,
    vConsentement,
  ]);

  /* ===========================
     Validation
  =========================== */

  const step1Errors = useMemo(() => {
    const errors: string[] = [];

    if (!isValidYear(anneeImposition)) {
      errors.push(
        t(
          "Année d’imposition : entrez une année valide (ex. : 2025).",
          "Tax year: enter a valid year (e.g. 2025).",
          "Año fiscal: ingrese un año válido (ej.: 2025)."
        )
      );
    }

    if (!companyName.trim()) {
      errors.push(
        t(
          "Nom légal de l’entreprise : obligatoire.",
          "Legal business name: required.",
          "Nombre legal de la empresa: obligatorio."
        )
      );
    }

    if (!isValidCraNumber(craNumber)) {
      errors.push(
        t(
          "Numéro d’entreprise ARC : 9 chiffres obligatoires.",
          "CRA business number: 9 digits required.",
          "Número de empresa CRA: se requieren 9 dígitos."
        )
      );
    }

    if (!incProvince) {
      errors.push(
        t(
          "Province d’incorporation : obligatoire.",
          "Province of incorporation: required.",
          "Provincia de incorporación: obligatoria."
        )
      );
    }

    if (!isValidDateJJMMAAAA(incorporationDate)) {
      errors.push(
        t(
          "Date d’incorporation : format JJ/MM/AAAA valide obligatoire.",
          "Date of incorporation: valid DD/MM/YYYY required.",
          "Fecha de incorporación: se requiere DD/MM/AAAA válido."
        )
      );
    }

    if (!isValidDateJJMMAAAA(yearEnd)) {
      errors.push(
        t(
          "Fin d’exercice : format JJ/MM/AAAA valide obligatoire.",
          "Fiscal year-end: valid DD/MM/YYYY required.",
          "Cierre del ejercicio: se requiere DD/MM/AAAA válido."
        )
      );
    }

    if (!addrStreet.trim()) {
      errors.push(
        t("Adresse : obligatoire.", "Address: required.", "Dirección: obligatoria.")
      );
    }

    if (!addrCity.trim()) {
      errors.push(
        t("Ville : obligatoire.", "City: required.", "Ciudad: obligatoria.")
      );
    }

    if (!addrProv) {
      errors.push(
        t(
          "Province de l’adresse : obligatoire.",
          "Address province: required.",
          "Provincia de la dirección: obligatoria."
        )
      );
    }

    if (!isValidPostal(addrPostal)) {
      errors.push(
        t(
          "Code postal : entrez un code postal canadien valide.",
          "Postal code: enter a valid Canadian postal code.",
          "Código postal: ingrese un código postal canadiense válido."
        )
      );
    }

    if (!businessActivity.trim()) {
      errors.push(
        t(
          "Activité principale : obligatoire.",
          "Main business activity: required.",
          "Actividad principal: obligatoria."
        )
      );
    }

    if (!operatesInQuebec) {
      errors.push(
        t(
          "Indiquez si la société exerce des activités au Québec.",
          "Indicate whether the corporation operates in Québec.",
          "Indique si la empresa opera en Québec."
        )
      );
    }

    if (!firstT2) {
      errors.push(
        t(
          "Indiquez s’il s’agit de la première déclaration T2.",
          "Indicate whether this is the corporation's first T2 return.",
          "Indique si esta es la primera declaración T2."
        )
      );
    }

    if (!shareholders.trim()) {
      errors.push(
        t(
          "Actionnaire(s) et pourcentage(s) : obligatoire.",
          "Shareholder(s) and percentage(s): required.",
          "Accionista(s) y porcentaje(s): obligatorio."
        )
      );
    }

    if (!paidSalary) {
      errors.push(
        t(
          "Salaires/T4 : répondez Oui ou Non.",
          "Salaries/T4: answer Yes or No.",
          "Salarios/T4: responda Sí o No."
        )
      );
    }

    if (!paidDividends) {
      errors.push(
        t(
          "Dividendes/T5 : répondez Oui ou Non.",
          "Dividends/T5: answer Yes or No.",
          "Dividendos/T5: responda Sí o No."
        )
      );
    }

    if (!hasAssets) {
      errors.push(
        t(
          "Actifs/immobilisations : répondez Oui ou Non.",
          "Assets/capital property: answer Yes or No.",
          "Activos/bienes de capital: responda Sí o No."
        )
      );
    }

    if (!hasLoans) {
      errors.push(
        t(
          "Prêts ou marge de crédit : répondez Oui ou Non.",
          "Loans or line of credit: answer Yes or No.",
          "Préstamos o línea de crédito: responda Sí o No."
        )
      );
    }

    if (!hasShareholderAmounts) {
      errors.push(
        t(
          "Sommes dues à/par un actionnaire : répondez Oui ou Non.",
          "Amounts due to/from a shareholder: answer Yes or No.",
          "Montos adeudados a/por un accionista: responda Sí o No."
        )
      );
    }

    if (!gstRegistered) {
      errors.push(
        t(
          "Inscription TPS : répondez Oui ou Non.",
          "GST registration: answer Yes or No.",
          "Registro GST/TPS: responda Sí o No."
        )
      );
    }

    if (!qstRegistered) {
      errors.push(
        t(
          "Inscription TVQ : répondez Oui ou Non.",
          "QST registration: answer Yes or No.",
          "Registro QST/TVQ: responda Sí o No."
        )
      );
    }

    if (gstRegistered === "oui" && !gstNumber.trim()) {
      errors.push(
        t(
          "Numéro TPS : obligatoire si la société est inscrite.",
          "GST number: required if the corporation is registered.",
          "Número GST/TPS: obligatorio si la empresa está registrada."
        )
      );
    }

    if (qstRegistered === "oui" && !qstNumber.trim()) {
      errors.push(
        t(
          "Numéro TVQ : obligatoire si la société est inscrite.",
          "QST number: required if the corporation is registered.",
          "Número QST/TVQ: obligatorio si la empresa está registrada."
        )
      );
    }

    if (
      (gstRegistered === "oui" || qstRegistered === "oui") &&
      !filingFrequency
    ) {
      errors.push(
        t(
          "Fréquence de remise TPS/TVQ : choisissez une option.",
          "GST/QST filing frequency: choose an option.",
          "Frecuencia de declaración GST/QST: elija una opción."
        )
      );
    }

    if (!financialReady) {
      errors.push(
        t(
          "Indiquez si les revenus et dépenses sont déjà compilés.",
          "Indicate whether income and expenses are already compiled.",
          "Indique si los ingresos y gastos ya están compilados."
        )
      );
    }

    if (!hasRevenue) {
      errors.push(
        t(
          "Indiquez si la société a eu des revenus durant l’exercice.",
          "Indicate whether the corporation had revenue during the fiscal year.",
          "Indique si la empresa tuvo ingresos durante el ejercicio."
        )
      );
    }

    if (
      financialReady === "oui" &&
      hasRevenue === "oui" &&
      !revenue.trim()
    ) {
      errors.push(
        t(
          "Revenus : entrez le total si les chiffres sont déjà compilés.",
          "Revenue: enter the total if the figures are already compiled.",
          "Ingresos: ingrese el total si las cifras ya están compiladas."
        )
      );
    }

    if (financialReady === "oui" && !expenses.trim()) {
      errors.push(
        t(
          "Dépenses : entrez le total si les chiffres sont déjà compilés.",
          "Expenses: enter the total if the figures are already compiled.",
          "Gastos: ingrese el total si las cifras ya están compiladas."
        )
      );
    }

    if (!contactName.trim()) {
      errors.push(
        t(
          "Nom du responsable : obligatoire.",
          "Contact name: required.",
          "Nombre del responsable: obligatorio."
        )
      );
    }

    if (!isValidPhone(contactPhone)) {
      errors.push(
        t(
          "Téléphone : entrez un numéro à 10 chiffres.",
          "Phone: enter a 10-digit number.",
          "Teléfono: ingrese un número de 10 dígitos."
        )
      );
    }

    if (!isValidEmail(contactEmail)) {
      errors.push(
        t(
          "Courriel : entrez une adresse valide.",
          "Email: enter a valid address.",
          "Correo electrónico: ingrese una dirección válida."
        )
      );
    }

    if (!vExactitude) {
      errors.push(
        t(
          "Confirmation : vous devez confirmer l’exactitude des renseignements.",
          "Confirmation: you must confirm the information is accurate.",
          "Confirmación: debe confirmar que la información es correcta."
        )
      );
    }

    if (!vDossierComplet) {
      errors.push(
        t(
          "Confirmation : vous devez confirmer avoir fourni les renseignements disponibles.",
          "Confirmation: you must confirm you provided the available information.",
          "Confirmación: debe confirmar que proporcionó la información disponible."
        )
      );
    }

    if (!vFraisVariables) {
      errors.push(
        t(
          "Confirmation : vous devez accepter que des frais supplémentaires puissent s’appliquer.",
          "Confirmation: you must accept that additional fees may apply.",
          "Confirmación: debe aceptar que pueden aplicarse cargos adicionales."
        )
      );
    }

    if (!vDelais) {
      errors.push(
        t(
          "Confirmation : vous devez accepter qu’un dossier incomplet puisse retarder le traitement.",
          "Confirmation: you must accept that an incomplete file may delay processing.",
          "Confirmación: debe aceptar que un expediente incompleto puede retrasar el procesamiento."
        )
      );
    }

    if (!vConsentement) {
      errors.push(
        t(
          "Consentement : vous devez accepter l’utilisation de vos renseignements pour le traitement du dossier.",
          "Consent: you must accept the use of your information to process the file.",
          "Consentimiento: debe aceptar el uso de su información para procesar el expediente."
        )
      );
    }

    return errors;
  }, [
    anneeImposition,
    companyName,
    craNumber,
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
    vExactitude,
    vDossierComplet,
    vFraisVariables,
    vDelais,
    vConsentement,
    t,
  ]);

  const canContinue = step1Errors.length === 0;

  /* ===========================
     Save draft
  =========================== */

  const saveDraft = useCallback(async (): Promise<string | null> => {
    if (hydrating.current) return fidDisplay ?? null;

    const annee = anneeImposition.trim() || null;
    const targetId = fidDisplay ?? null;

    if (targetId) {
      const { error } = await supabase
        .from(FORMS_TABLE)
        .update({
          lang,
          annee,
          data: draftData,
        })
        .eq("id", targetId)
        .eq("user_id", userId);

      if (error) throw new Error(supaErr(error));

      setFormulaireId(targetId);
      setCurrentFid(targetId);
      return targetId;
    }

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

    const newFid = dataInsert?.id ?? null;

    if (newFid) {
      setFormulaireId(newFid);
      setCurrentFid(newFid);
    }

    return newFid;
  }, [
    anneeImposition,
    draftData,
    fidDisplay,
    lang,
    type,
    userId,
  ]);

  /* ===========================
     Load form
  =========================== */

  const loadFormById = useCallback(
    async (fid: string) => {
      const { data: row, error } = await supabase
        .from(FORMS_TABLE)
        .select("id, data, created_at")
        .eq("id", fid)
        .eq("user_id", userId)
        .eq("form_type", type)
        .maybeSingle<FormRow>();

      if (error) throw new Error(error.message);
      return row ?? null;
    },
    [type, userId]
  );

  const loadLastForm = useCallback(async () => {
    hydrating.current = true;

    try {
      setMsg(null);

      let row: FormRow | null = null;

      if (initialFid) {
        try {
          row = await loadFormById(initialFid);
        } catch {
          row = null;
        }
      }

      if (!row) {
        let query = supabase
          .from(FORMS_TABLE)
          .select("id, data, created_at")
          .eq("user_id", userId)
          .eq("form_type", type);

        if (initialYear) {
          query = query.eq("annee", initialYear);
        }

        const { data: last, error } = await query
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<FormRow>();

        if (error) {
          setMsg(
            t(
              `Erreur chargement : ${error.message}`,
              `Loading error: ${error.message}`,
              `Error de carga: ${error.message}`
            )
          );
          return;
        }

        row = last ?? null;
      }

      if (!row?.data?.t2) return;

      const loaded = row.data.t2;

      setFormulaireId(row.id);
      setCurrentFid(row.id);

      setAnneeImposition(loaded.anneeImposition ?? initialYear ?? "");

      setCompanyName(loaded.companyName ?? "");
      setCraNumber(loaded.craNumber ?? "");
      setNeq(loaded.neq ?? "");
      setIncProvince((loaded.incProvince ?? "QC") as ProvinceCode);
      setIncorporationDate(loaded.incorporationDate ?? "");
      setYearEnd(loaded.yearEnd ?? "");

      setAddrStreet(loaded.addrStreet ?? "");
      setAddrCity(loaded.addrCity ?? "");
      setAddrProv((loaded.addrProv ?? "QC") as ProvinceCode);
      setAddrPostal(
        loaded.addrPostal ? formatPostalInput(loaded.addrPostal) : ""
      );

      setBusinessActivity(loaded.businessActivity ?? "");
      setOperatesInQuebec(loaded.operatesInQuebec ?? "");
      setFirstT2(loaded.firstT2 ?? "");

      setShareholders(loaded.shareholders ?? "");
      setPaidSalary(loaded.paidSalary ?? "");
      setPaidDividends(loaded.paidDividends ?? "");
      setHasAssets(loaded.hasAssets ?? "");
      setHasLoans(loaded.hasLoans ?? "");
      setHasShareholderAmounts(loaded.hasShareholderAmounts ?? "");

      setGstRegistered(loaded.gstRegistered ?? "");
      setQstRegistered(loaded.qstRegistered ?? "");
      setGstNumber(loaded.gstNumber ?? "");
      setQstNumber(loaded.qstNumber ?? "");
      setFilingFrequency(loaded.filingFrequency ?? "");

      setFinancialReady(loaded.financialReady ?? "");
      setHasRevenue(loaded.hasRevenue ?? "");
      setRevenue(loaded.revenue ?? "");
      setExpenses(loaded.expenses ?? "");

      setContactName(loaded.contactName ?? "");
      setContactPhone(
        loaded.contactPhone ? formatPhoneInput(loaded.contactPhone) : ""
      );
      setContactEmail(loaded.contactEmail ?? "");

      setNotes(loaded.notes ?? "");

      setVExactitude(loaded.confirmations?.exactitude ?? false);
      setVDossierComplet(loaded.confirmations?.dossierComplet ?? false);
      setVFraisVariables(loaded.confirmations?.fraisVariables ?? false);
      setVDelais(loaded.confirmations?.delais ?? false);
      setVConsentement(loaded.confirmations?.consentement ?? false);
    } finally {
      hydrating.current = false;
    }
  }, [
    initialFid,
    initialYear,
    loadFormById,
    t,
    type,
    userId,
  ]);

  useEffect(() => {
    void loadLastForm();
  }, [loadLastForm]);

  /* ===========================
     Autosave
  =========================== */

  useEffect(() => {
    if (hydrating.current) return;

    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(() => {
      saveDraft().catch(() => {});
    }, 800);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [draftData, saveDraft]);

  /* ===========================
     Actions
  =========================== */

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace(`/espace-client?lang=${encodeURIComponent(lang)}`);
  }, [router, lang]);

  const goToDepotDocuments = useCallback(async () => {
    try {
      setMsg(null);

      if (!canContinue) {
        setMsg(
          t(
            "❌ Certaines informations obligatoires manquent. Vérifiez la liste ci-dessous.",
            "❌ Some required information is missing. Review the list below.",
            "❌ Faltan datos obligatorios. Revise la lista a continuación."
          )
        );

        document
          .getElementById("ff-inline-errors")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });

        return;
      }

      setSubmitting(true);

      const fidFromSave = await saveDraft();
      const fid = fidFromSave || fidDisplay;

      if (!fid) {
        throw new Error(
          t(
            "Impossible de créer le dossier.",
            "Unable to create the file.",
            "No se pudo crear el expediente."
          )
        );
      }

      setCurrentFid(fid);

      router.push(
        `/formulaire-fiscal-t2/depot-documents?fid=${encodeURIComponent(
          fid
        )}&lang=${encodeURIComponent(lang)}`
      );
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : t(
              "Erreur dépôt documents.",
              "Document upload error.",
              "Error al cargar documentos."
            );

      setMsg("❌ " + message);

      document
        .getElementById("ff-inline-errors")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setSubmitting(false);
    }
  }, [
    canContinue,
    fidDisplay,
    lang,
    router,
    saveDraft,
    t,
  ]);

  const btnContinue = t(
    "Continuer vers les documents →",
    "Continue to documents →",
    "Continuar a los documentos →"
  );

  /* ===========================
     Render
  =========================== */

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
              <span>
                {t(
                  "Formulaire fiscal",
                  "Tax form",
                  "Formulario fiscal"
                )}
              </span>
            </div>
          </div>

          <button
            className="ff-btn ff-btn-outline"
            type="button"
            onClick={logout}
          >
            {t(
              "Se déconnecter",
              "Sign out",
              "Cerrar sesión"
            )}
          </button>
        </header>

        <div className="ff-title">
          <h1>
            {t("Formulaire", "Form", "Formulario")} – {formTitle}
          </h1>

          <p>
            {t(
              "Remplissez les renseignements sur la société. Le formulaire est sauvegardé automatiquement pendant que vous le complétez.",
              "Complete the corporation information. The form is saved automatically as you fill it out.",
              "Complete la información de la empresa. El formulario se guarda automáticamente mientras lo completa."
            )}
          </p>
        </div>

        {msg && (
          <div className="ff-card" style={{ padding: 14 }}>
            {msg}
          </div>
        )}

        <Steps step={1} lang={lang} flow="t2" />

        {step1Errors.length > 0 && (
          <div
            id="ff-inline-errors"
            className="ff-card"
            style={{
              padding: 16,
              border: "1px solid #fecaca",
              background: "#fff1f2",
            }}
          >
            <div
              style={{
                fontWeight: 800,
                color: "#7f1d1d",
                marginBottom: 8,
              }}
            >
              {t(
                "À compléter avant de continuer",
                "Complete before continuing",
                "Complete antes de continuar"
              )}
            </div>

            <ul
              style={{
                margin: "0 0 0 18px",
                color: "#7f1d1d",
              }}
            >
              {step1Errors.slice(0, 15).map((error, index) => (
                <li key={index} style={{ marginBottom: 5 }}>
                  {error}
                </li>
              ))}

              {step1Errors.length > 15 && <li>…</li>}
            </ul>
          </div>
        )}

        <form className="ff-form">
          {/* 1 — Société */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>
                {t(
                  "1. Informations de la société",
                  "1. Corporation information",
                  "1. Información de la empresa"
                )}
              </h2>

              <p>
                {t(
                  "Renseignements de base pour identifier la société et son exercice fiscal.",
                  "Basic information used to identify the corporation and its fiscal year.",
                  "Información básica para identificar la empresa y su ejercicio fiscal."
                )}
              </p>
            </div>

            <div className="ff-stack">
              <Field
                label={t(
                  "Année d’imposition",
                  "Tax year",
                  "Año fiscal"
                )}
                value={anneeImposition}
                onChange={setAnneeImposition}
                placeholder="2025"
                inputMode="numeric"
                required
              />

              <div className="ff-grid2">
                <Field
                  label={t(
                    "Nom légal de l’entreprise",
                    "Legal business name",
                    "Nombre legal de la empresa"
                  )}
                  value={companyName}
                  onChange={setCompanyName}
                  required
                />

                <Field
                  label={t(
                    "Numéro d’entreprise ARC — 9 chiffres",
                    "CRA business number — 9 digits",
                    "Número de empresa CRA — 9 dígitos"
                  )}
                  value={craNumber}
                  onChange={setCraNumber}
                  inputMode="numeric"
                  maxLength={9}
                  required
                />
              </div>

              <div className="ff-grid2">
                <Field
                  label={t(
                    "NEQ (si applicable)",
                    "NEQ (if applicable)",
                    "NEQ (si corresponde)"
                  )}
                  value={neq}
                  onChange={setNeq}
                />

                <SelectField<ProvinceCode>
                  label={t(
                    "Province d’incorporation",
                    "Province of incorporation",
                    "Provincia de incorporación"
                  )}
                  value={incProvince}
                  onChange={setIncProvince}
                  options={PROVINCES}
                  required
                />
              </div>

              <div className="ff-grid2">
                <Field
                  label={t(
                    "Date d’incorporation (JJ/MM/AAAA)",
                    "Date of incorporation (DD/MM/YYYY)",
                    "Fecha de incorporación (DD/MM/AAAA)"
                  )}
                  value={incorporationDate}
                  onChange={setIncorporationDate}
                  placeholder="01/05/2024"
                  formatter={formatDateInput}
                  maxLength={10}
                  inputMode="numeric"
                  required
                />

                <Field
                  label={t(
                    "Fin d’exercice (JJ/MM/AAAA)",
                    "Fiscal year-end (DD/MM/YYYY)",
                    "Cierre del ejercicio (DD/MM/AAAA)"
                  )}
                  value={yearEnd}
                  onChange={setYearEnd}
                  placeholder="31/12/2025"
                  formatter={formatDateInput}
                  maxLength={10}
                  inputMode="numeric"
                  required
                />
              </div>

              <Field
                label={t(
                  "Adresse de la société",
                  "Corporation address",
                  "Dirección de la empresa"
                )}
                value={addrStreet}
                onChange={setAddrStreet}
                required
              />

              <div className="ff-grid2 ff-mt-sm">
                <Field
                  label={t("Ville", "City", "Ciudad")}
                  value={addrCity}
                  onChange={setAddrCity}
                  required
                />

                <SelectField<ProvinceCode>
                  label={t("Province", "Province", "Provincia")}
                  value={addrProv}
                  onChange={setAddrProv}
                  options={PROVINCES}
                  required
                />
              </div>

              <Field
                label={t("Code postal", "Postal code", "Código postal")}
                value={addrPostal}
                onChange={setAddrPostal}
                placeholder="G1V 0A6"
                formatter={formatPostalInput}
                maxLength={7}
                autoComplete="postal-code"
                required
              />
            </div>
          </section>

          {/* 2 — Activité */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>
                {t(
                  "2. Activité de l’entreprise",
                  "2. Business activity",
                  "2. Actividad de la empresa"
                )}
              </h2>

              <p>
                {t(
                  "Quelques renseignements pour comprendre le type d’activité de la société.",
                  "A few details to understand the corporation's business activity.",
                  "Algunos datos para comprender la actividad de la empresa."
                )}
              </p>
            </div>

            <div className="ff-stack">
              <Field
                label={t(
                  "Activité principale de l’entreprise",
                  "Main business activity",
                  "Actividad principal de la empresa"
                )}
                value={businessActivity}
                onChange={setBusinessActivity}
                placeholder={t(
                  "Ex. : déneigement, construction, consultation, location...",
                  "E.g. snow removal, construction, consulting, rental...",
                  "Ej.: remoción de nieve, construcción, consultoría, alquiler..."
                )}
                required
              />

              <YesNoField
                name="operatesInQuebec"
                label={t(
                  "La société exerce-t-elle des activités au Québec ?",
                  "Does the corporation operate in Québec?",
                  "¿La empresa opera en Québec?"
                )}
                value={operatesInQuebec}
                onChange={setOperatesInQuebec}
              />

              <YesNoField
                name="firstT2"
                label={t(
                  "Est-ce la première déclaration T2 de cette société ?",
                  "Is this the corporation's first T2 return?",
                  "¿Es esta la primera declaración T2 de la empresa?"
                )}
                value={firstT2}
                onChange={setFirstT2}
              />
            </div>
          </section>

          {/* 3 — Actionnaires et opérations */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>
                {t(
                  "3. Actionnaires et opérations",
                  "3. Shareholders and transactions",
                  "3. Accionistas y operaciones"
                )}
              </h2>

              <p>
                {t(
                  "Indiquez les principales opérations de la société durant l’exercice.",
                  "Indicate the corporation's main transactions during the fiscal year.",
                  "Indique las principales operaciones de la empresa durante el ejercicio."
                )}
              </p>
            </div>

            <div className="ff-stack">
              <Field
                label={t(
                  "Actionnaire(s) et pourcentage de participation",
                  "Shareholder(s) and ownership percentage",
                  "Accionista(s) y porcentaje de participación"
                )}
                value={shareholders}
                onChange={setShareholders}
                placeholder={t(
                  "Ex. : Marie Tremblay 100 % ou Marie 60 %, Jean 40 %",
                  "E.g. Marie Tremblay 100% or Marie 60%, Jean 40%",
                  "Ej.: Marie Tremblay 100 % o Marie 60 %, Jean 40 %"
                )}
                required
              />

              <YesNoField
                name="paidSalary"
                label={t(
                  "La société a-t-elle payé des salaires ou produit des T4/RL-1 ?",
                  "Did the corporation pay salaries or issue T4/RL-1 slips?",
                  "¿La empresa pagó salarios o emitió T4/RL-1?"
                )}
                value={paidSalary}
                onChange={setPaidSalary}
              />

              {paidSalary === "oui" && (
                <div
                  className="ff-card"
                  style={{
                    padding: 12,
                    background: "#f8fafc",
                    boxShadow: "none",
                  }}
                >
                  {t(
                    "Vous pourrez joindre les T4, RL-1 et sommaires à l’étape suivante.",
                    "You can upload the T4, RL-1 and summaries in the next step.",
                    "Podrá adjuntar los T4, RL-1 y resúmenes en el siguiente paso."
                  )}
                </div>
              )}

              <YesNoField
                name="paidDividends"
                label={t(
                  "La société a-t-elle versé des dividendes ou produit des T5/RL-3 ?",
                  "Did the corporation pay dividends or issue T5/RL-3 slips?",
                  "¿La empresa pagó dividendos o emitió T5/RL-3?"
                )}
                value={paidDividends}
                onChange={setPaidDividends}
              />

              {paidDividends === "oui" && (
                <div
                  className="ff-card"
                  style={{
                    padding: 12,
                    background: "#f8fafc",
                    boxShadow: "none",
                  }}
                >
                  {t(
                    "Vous pourrez joindre les documents liés aux dividendes à l’étape suivante.",
                    "You can upload the dividend-related documents in the next step.",
                    "Podrá adjuntar los documentos relacionados con dividendos en el siguiente paso."
                  )}
                </div>
              )}

              <YesNoField
                name="hasAssets"
                label={t(
                  "La société possède-t-elle des véhicules, équipements, ordinateurs, immeubles ou autres immobilisations ?",
                  "Does the corporation own vehicles, equipment, computers, real estate or other capital assets?",
                  "¿La empresa posee vehículos, equipos, computadoras, inmuebles u otros activos de capital?"
                )}
                value={hasAssets}
                onChange={setHasAssets}
              />

              <YesNoField
                name="hasLoans"
                label={t(
                  "La société a-t-elle un prêt bancaire ou une marge de crédit ?",
                  "Does the corporation have a bank loan or line of credit?",
                  "¿La empresa tiene un préstamo bancario o una línea de crédito?"
                )}
                value={hasLoans}
                onChange={setHasLoans}
              />

              <YesNoField
                name="hasShareholderAmounts"
                label={t(
                  "Y a-t-il des sommes dues à un actionnaire ou dues par un actionnaire ?",
                  "Are there amounts due to or from a shareholder?",
                  "¿Hay montos adeudados a un accionista o por un accionista?"
                )}
                value={hasShareholderAmounts}
                onChange={setHasShareholderAmounts}
              />
            </div>
          </section>

          {/* 4 — TPS / TVQ */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>
                {t(
                  "4. TPS / TVQ",
                  "4. GST / QST",
                  "4. GST / QST"
                )}
              </h2>

              <p>
                {t(
                  "Indiquez si la société est inscrite aux taxes de vente.",
                  "Indicate whether the corporation is registered for sales taxes.",
                  "Indique si la empresa está registrada para impuestos sobre ventas."
                )}
              </p>
            </div>

            <div className="ff-stack">
              <YesNoField
                name="gstRegistered"
                label={t(
                  "La société est-elle inscrite à la TPS ?",
                  "Is the corporation registered for GST?",
                  "¿La empresa está registrada para GST/TPS?"
                )}
                value={gstRegistered}
                onChange={setGstRegistered}
              />

              {gstRegistered === "oui" && (
                <Field
                  label={t(
                    "Numéro TPS",
                    "GST number",
                    "Número GST/TPS"
                  )}
                  value={gstNumber}
                  onChange={setGstNumber}
                  required
                />
              )}

              <YesNoField
                name="qstRegistered"
                label={t(
                  "La société est-elle inscrite à la TVQ ?",
                  "Is the corporation registered for QST?",
                  "¿La empresa está registrada para QST/TVQ?"
                )}
                value={qstRegistered}
                onChange={setQstRegistered}
              />

              {qstRegistered === "oui" && (
                <Field
                  label={t(
                    "Numéro TVQ",
                    "QST number",
                    "Número QST/TVQ"
                  )}
                  value={qstNumber}
                  onChange={setQstNumber}
                  required
                />
              )}

              {(gstRegistered === "oui" || qstRegistered === "oui") && (
                <SelectField<FilingFrequency>
                  label={t(
                    "Fréquence de remise",
                    "Filing frequency",
                    "Frecuencia de presentación"
                  )}
                  value={filingFrequency as FilingFrequency}
                  onChange={setFilingFrequency}
                  options={frequencyOptions}
                  required
                />
              )}
            </div>
          </section>

          {/* 5 — Finances */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>
                {t(
                  "5. Informations financières",
                  "5. Financial information",
                  "5. Información financiera"
                )}
              </h2>

              <p>
                {t(
                  "Si vos revenus et dépenses sont déjà compilés, inscrivez les totaux. Sinon, indiquez-le et joignez les documents à l’étape suivante.",
                  "If income and expenses are already compiled, enter the totals. Otherwise, indicate this and upload the documents in the next step.",
                  "Si los ingresos y gastos ya están compilados, ingrese los totales. De lo contrario, indíquelo y adjunte los documentos en el siguiente paso."
                )}
              </p>
            </div>

            <div className="ff-stack">
              <YesNoField
                name="financialReady"
                label={t(
                  "Les revenus et dépenses sont-ils déjà compilés et organisés ?",
                  "Are income and expenses already compiled and organized?",
                  "¿Los ingresos y gastos ya están compilados y organizados?"
                )}
                value={financialReady}
                onChange={setFinancialReady}
              />

              {financialReady === "non" && (
                <div
                  className="ff-card"
                  style={{
                    padding: 14,
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    boxShadow: "none",
                  }}
                >
                  <strong>
                    {t(
                      "Documents non compilés",
                      "Uncompiled documents",
                      "Documentos no compilados"
                    )}
                  </strong>
                  <div style={{ marginTop: 4 }}>
                    {t(
                      "Le tri, les calculs, la classification ou la compilation supplémentaire peuvent être facturés à 94,99 $ / heure.",
                      "Additional sorting, calculations, classification or compilation may be billed at $94.99 / hour.",
                      "La clasificación, los cálculos, la organización o la compilación adicional pueden facturarse a 94,99 $ / hora."
                    )}
                  </div>
                </div>
              )}

              <YesNoField
                name="hasRevenue"
                label={t(
                  "La société a-t-elle eu des revenus durant l’exercice ?",
                  "Did the corporation have revenue during the fiscal year?",
                  "¿La empresa tuvo ingresos durante el ejercicio?"
                )}
                value={hasRevenue}
                onChange={setHasRevenue}
              />

              {financialReady === "oui" && (
                <div className="ff-grid2">
                  {hasRevenue === "oui" ? (
                    <Field
                      label={t(
                        "Revenus totaux ($)",
                        "Total revenue ($)",
                        "Ingresos totales ($)"
                      )}
                      value={revenue}
                      onChange={setRevenue}
                      inputMode="decimal"
                      required
                    />
                  ) : (
                    <Field
                      label={t(
                        "Revenus totaux ($)",
                        "Total revenue ($)",
                        "Ingresos totales ($)"
                      )}
                      value="0"
                      onChange={() => {}}
                      inputMode="decimal"
                    />
                  )}

                  <Field
                    label={t(
                      "Dépenses totales ($)",
                      "Total expenses ($)",
                      "Gastos totales ($)"
                    )}
                    value={expenses}
                    onChange={setExpenses}
                    inputMode="decimal"
                    required
                  />
                </div>
              )}
            </div>
          </section>

          {/* 6 — Contact */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>
                {t(
                  "6. Personne responsable du dossier",
                  "6. File contact",
                  "6. Responsable del expediente"
                )}
              </h2>

              <p>
                {t(
                  "Personne à contacter si une information ou un document manque.",
                  "Person to contact if information or documents are missing.",
                  "Persona de contacto si falta información o documentos."
                )}
              </p>
            </div>

            <div className="ff-grid2">
              <Field
                label={t(
                  "Nom du responsable",
                  "Contact name",
                  "Nombre del responsable"
                )}
                value={contactName}
                onChange={setContactName}
                required
              />

              <Field
                label={t("Téléphone", "Phone", "Teléfono")}
                value={contactPhone}
                onChange={setContactPhone}
                placeholder="(418) 555-1234"
                inputMode="tel"
                formatter={formatPhoneInput}
                maxLength={14}
                required
              />
            </div>

            <div className="ff-mt">
              <Field
                label={t("Courriel", "Email", "Correo electrónico")}
                value={contactEmail}
                onChange={setContactEmail}
                type="email"
                required
              />
            </div>

            <div className="ff-mt">
              <Field
                label={t(
                  "Notes / précisions",
                  "Notes / details",
                  "Notas / detalles"
                )}
                value={notes}
                onChange={setNotes}
                placeholder={t(
                  "Ex. : changement important, transaction particulière, information à nous signaler...",
                  "E.g. major change, special transaction, information we should know...",
                  "Ej.: cambio importante, operación especial, información que debemos conocer..."
                )}
              />
            </div>
          </section>

          {/* 7 — Confirmations */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>
                {t(
                  "7. Confirmations",
                  "7. Confirmations",
                  "7. Confirmaciones"
                )}
              </h2>

              <p>
                {t(
                  "Confirmez les éléments suivants avant de passer au dépôt des documents.",
                  "Confirm the following before proceeding to document upload.",
                  "Confirme lo siguiente antes de continuar con la carga de documentos."
                )}
              </p>
            </div>

            <div className="ff-stack">
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={vExactitude}
                  onChange={(e) => setVExactitude(e.target.checked)}
                />
                <span>
                  {t(
                    "Je confirme que les renseignements fournis sont exacts au meilleur de ma connaissance.",
                    "I confirm that the information provided is accurate to the best of my knowledge.",
                    "Confirmo que la información proporcionada es correcta según mi leal saber y entender."
                  )}
                </span>
              </label>

              <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={vDossierComplet}
                  onChange={(e) => setVDossierComplet(e.target.checked)}
                />
                <span>
                  {t(
                    "J’ai fourni les renseignements disponibles et je joindrai les documents nécessaires à l’étape suivante.",
                    "I provided the available information and will upload the required documents in the next step.",
                    "He proporcionado la información disponible y adjuntaré los documentos necesarios en el siguiente paso."
                  )}
                </span>
              </label>

              <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={vFraisVariables}
                  onChange={(e) => setVFraisVariables(e.target.checked)}
                />
                <span>
                  {t(
                    "Je comprends que le prix peut varier selon la complexité du dossier et le travail supplémentaire requis.",
                    "I understand that pricing may vary depending on file complexity and additional work required.",
                    "Entiendo que el precio puede variar según la complejidad del expediente y el trabajo adicional requerido."
                  )}
                </span>
              </label>

              <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={vDelais}
                  onChange={(e) => setVDelais(e.target.checked)}
                />
                <span>
                  {t(
                    "Je comprends qu’un dossier incomplet peut retarder le traitement.",
                    "I understand that an incomplete file may delay processing.",
                    "Entiendo que un expediente incompleto puede retrasar el procesamiento."
                  )}
                </span>
              </label>

              <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={vConsentement}
                  onChange={(e) => setVConsentement(e.target.checked)}
                />
                <span>
                  {t(
                    "J’autorise l’utilisation de ces renseignements pour le traitement de mon dossier fiscal.",
                    "I authorize the use of this information to process my tax file.",
                    "Autorizo el uso de esta información para procesar mi expediente fiscal."
                  )}
                </span>
              </label>
            </div>
          </section>

          {/* Action */}
          <div className="ff-submit">
            <button
              type="button"
              className="ff-btn ff-btn-primary ff-btn-big"
              disabled={submitting}
              onClick={goToDepotDocuments}
            >
              {submitting
                ? t(
                    "Préparation…",
                    "Preparing…",
                    "Preparando…"
                  )
                : btnContinue}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
