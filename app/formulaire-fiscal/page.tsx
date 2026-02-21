"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

import "./formulaire-fiscal.css";
import Steps from "./Steps";
import RequireAuth from "./RequireAuth";

import { COPY, pickCopy, type CopyLang } from "./copy";
import type {
  Lang,
  ProvinceCode,
  Sexe,
  AssuranceMeds,
  CopieImpots,
  EtatCivil,
  Periode,
  Child,
  DocRow,
  FormTypeDb,
  Formdata,
  FormRow,
  InsertIdRow,
} from "./types";

import { firstNonEmpty } from "./helpers";

// Sections (dossier divisé)
import ErrorsPanel from "./sections/ErrorsPanel";
import ClientSection from "./sections/ClientSection";
import SpouseSection from "./sections/SpouseSection";
import MedsSection from "./sections/MedsSection";
import DependantsSection from "./sections/DependantsSection";
import QuestionsSection from "./sections/QuestionsSection";
import ConfirmationsSection from "./sections/ConfirmationsSection";
import DocsSummary from "./sections/DocsSummary";

/**
 * Storage / DB
 */
const STORAGE_BUCKET = "client-documents";
const DOCS_TABLE = "formulaire_documents";
const FORMS_TABLE = "formulaires_fiscaux";

/**
 * Lang
 */
function normalizeLang(v: string | null | undefined): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

/* =========================== Helpers =========================== */
const PROVINCES: { value: ProvinceCode; label: string }[] = [
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

function titleFromType(type: FormTypeDb) {
  if (type === "T2") return "Société (T2)";
  return "Particulier (T1)";
}

function supaErr(e: unknown) {
  if (!e || typeof e !== "object") return "Erreur inconnue";
  const err = e as { message?: string; details?: string; hint?: string; code?: string };
  return [err.message, err.details, err.hint, err.code].filter(Boolean).join(" | ");
}

function updatePeriode(list: Periode[], idx: number, patch: Partial<Periode>) {
  return list.map((p, i) => (i === idx ? { ...p, ...patch } : p));
}

/* =========================== Format LIVE =========================== */
function formatNASInput(v: string) {
  const d = (v || "").replace(/\D+/g, "").slice(0, 9);
  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 9);
  if (d.length <= 3) return a;
  if (d.length <= 6) return `${a}-${b}`;
  return `${a}-${b}-${c}`;
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

function formatPostalInput(v: string) {
  const s = (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (s.length <= 3) return s;
  return `${s.slice(0, 3)} ${s.slice(3, 6)}`;
}

/* =========================== Normalize =========================== */
function normalizeNAS(v: string) {
  return (v || "").replace(/\D+/g, "").slice(0, 9);
}
function normalizePostal(v: string) {
  return (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}
function normalizePhone(v: string) {
  return (v || "").replace(/\D+/g, "").slice(0, 10);
}

/* =========================== Validation =========================== */
function isValidYear(v: string) {
  const y = (v || "").trim();
  if (!/^\d{4}$/.test(y)) return false;
  const n = Number(y);
  return n >= 2000 && n <= 2100;
}

function isValidNAS(v: string) {
  return normalizeNAS(v).length === 9;
}

function isValidPostal(v: string) {
  return normalizePostal(v).length === 6;
}

function isValidDateJJMMAAAA(v: string) {
  const s = (v || "").trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return false;
  const [ddStr, mmStr, yyyyStr] = s.split("/");
  const dd = Number(ddStr);
  const mm = Number(mmStr);
  const yyyy = Number(yyyyStr);
  if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return false;
  if (yyyy < 1900 || yyyy > 2100) return false;
  if (mm < 1 || mm > 12) return false;

  const daysInMonth = new Date(yyyy, mm, 0).getDate();
  return dd >= 1 && dd <= daysInMonth;
}

function isValidEmail(v: string) {
  const s = (v || "").trim();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/* =========================== PAGE WRAPPER (RequireAuth) =========================== */
export default function FormulaireFiscalPage() {
  const params = useSearchParams();

  // figé à T1 ici (comme ton code)
  const type: FormTypeDb = "T1";
  const lang = normalizeLang(params.get("lang") || "fr");

  const nextPath = useMemo(() => `/formulaire-fiscal?type=${type}&lang=${lang}`, [type, lang]);

  return (
    <RequireAuth lang={lang} nextPath={nextPath}>
      {(userId) => <FormulaireFiscalInner userId={userId} lang={lang} type={type} />}
    </RequireAuth>
  );
}

/* =========================== INNER =========================== */
function FormulaireFiscalInner({
  userId,
  lang,
  type,
}: {
  userId: string;
  lang: Lang;
  type: FormTypeDb;
}) {
  const router = useRouter();
  const formTitle = titleFromType(type);

  const L = COPY[pickCopy(lang) as CopyLang];

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // dossier courant
  const [formulaireId, setFormulaireId] = useState<string | null>(null);
  const [currentFid, setCurrentFid] = useState<string | null>(null);
  const fidDisplay = currentFid || formulaireId;

  // évite autosave pendant le preload
  const hydrating = useRef(false);

  // debounce autosave
  const saveTimer = useRef<number | null>(null);

  // docs
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const docsCount = docs.length;

  /* =========================== States - Client =========================== */
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [nas, setNas] = useState("");
  const [dob, setDob] = useState("");
  const [etatCivil, setEtatCivil] = useState<EtatCivil>("");
  const [etatCivilChange, setEtatCivilChange] = useState(false);
  const [ancienEtatCivil, setAncienEtatCivil] = useState("");
  const [dateChangementEtatCivil, setDateChangementEtatCivil] = useState("");
  const [tel, setTel] = useState("");
  const [telCell, setTelCell] = useState("");
  const [adresse, setAdresse] = useState("");
  const [app, setApp] = useState("");
  const [ville, setVille] = useState("");
  const [province, setProvince] = useState<ProvinceCode>("QC");
  const [codePostal, setCodePostal] = useState("");
  const [courriel, setCourriel] = useState("");

  /* =========================== Conjoint =========================== */
  const [aUnConjoint, setAUnConjoint] = useState(false);
  const [traiterConjoint, setTraiterConjoint] = useState(true);
  const [prenomConjoint, setPrenomConjoint] = useState("");
  const [nomConjoint, setNomConjoint] = useState("");
  const [nasConjoint, setNasConjoint] = useState("");
  const [dobConjoint, setDobConjoint] = useState("");
  const [telConjoint, setTelConjoint] = useState("");
  const [telCellConjoint, setTelCellConjoint] = useState("");
  const [courrielConjoint, setCourrielConjoint] = useState("");
  const [adresseConjointeIdentique, setAdresseConjointeIdentique] = useState(true);
  const [adresseConjoint, setAdresseConjoint] = useState("");
  const [appConjoint, setAppConjoint] = useState("");
  const [villeConjoint, setVilleConjoint] = useState("");
  const [provinceConjoint, setProvinceConjoint] = useState<ProvinceCode>("QC");
  const [codePostalConjoint, setCodePostalConjoint] = useState("");
  const [revenuNetConjoint, setRevenuNetConjoint] = useState("");

  /* =========================== Assurance meds =========================== */
  const [assuranceMedsClient, setAssuranceMedsClient] = useState<AssuranceMeds>("");
  const [assuranceMedsClientPeriodes, setAssuranceMedsClientPeriodes] = useState<Periode[]>([
    { debut: "", fin: "" },
  ]);

  const [assuranceMedsConjoint, setAssuranceMedsConjoint] = useState<AssuranceMeds>("");
  const [assuranceMedsConjointPeriodes, setAssuranceMedsConjointPeriodes] = useState<Periode[]>([
    { debut: "", fin: "" },
  ]);

  /* =========================== Enfants =========================== */
  const [enfants, setEnfants] = useState<Child[]>([]);

  const ajouterEnfant = useCallback(() => {
    setEnfants((prev) => [...prev, { prenom: "", nom: "", dob: "", nas: "", sexe: "" }]);
  }, []);

  const updateEnfant = useCallback((i: number, field: keyof Child, value: string) => {
    setEnfants((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };
      return copy;
    });
  }, []);

  const removeEnfant = useCallback((i: number) => {
    setEnfants((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  /* =========================== Questions =========================== */
  const [habiteSeulTouteAnnee, setHabiteSeulTouteAnnee] = useState<"" | "yes" | "no">("");
  const [nbPersonnesMaison3112, setNbPersonnesMaison3112] = useState("");
  const [biensEtranger100k, setBiensEtranger100k] = useState<"" | "yes" | "no">("");
  const [citoyenCanadien, setCitoyenCanadien] = useState<"" | "yes" | "no">("");
  const [nonResident, setNonResident] = useState<"" | "yes" | "no">("");
  const [maisonAcheteeOuVendue, setMaisonAcheteeOuVendue] = useState<"" | "yes" | "no">("");
  const [appelerTechnicien, setAppelerTechnicien] = useState<"" | "yes" | "no">("");
  const [copieImpots, setCopieImpots] = useState<CopieImpots>("");
  const [anneeImposition, setAnneeImposition] = useState<string>("");

  /* =========================== Validations finales =========================== */
  const [vExactitude, setVExactitude] = useState(false);
  const [vDossierComplet, setVDossierComplet] = useState(false);
  const [vFraisVariables, setVFraisVariables] = useState(false);
  const [vDelais, setVDelais] = useState(false);

  /* =========================== Docs helpers =========================== */
  const loadDocs = useCallback(async (fid: string) => {
    setDocsLoading(true);

    const { data, error } = await supabase
      .from(DOCS_TABLE)
      .select(
        "id, formulaire_id, user_id, original_name, storage_path, mime_type, size_bytes, created_at"
      )
      .eq("formulaire_id", fid)
      .order("created_at", { ascending: false });

    setDocsLoading(false);

    if (error) {
      setMsg(`Erreur docs: ${error.message}`);
      return;
    }

    setDocs((data as DocRow[]) || []);
  }, []);

  const getSignedUrl = useCallback(async (path: string) => {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 10);
    if (error || !data?.signedUrl) throw new Error(error?.message || "Impossible d’ouvrir le fichier.");
    return data.signedUrl;
  }, []);

  const openDoc = useCallback(
    async (doc: DocRow) => {
      try {
        const url = await getSignedUrl(doc.storage_path);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Impossible d’ouvrir le fichier.";
        setMsg(message);
      }
    },
    [getSignedUrl]
  );

  /* =========================== Build data (memo) =========================== */
  const draftData: Formdata = useMemo(() => {
    const conjointData = aUnConjoint
      ? {
          traiterConjoint,
          prenomConjoint: prenomConjoint.trim(),
          nomConjoint: nomConjoint.trim(),
          nasConjoint: normalizeNAS(nasConjoint),
          dobConjoint: dobConjoint.trim(),
          telConjoint: normalizePhone(telConjoint),
          telCellConjoint: normalizePhone(telCellConjoint),
          courrielConjoint: courrielConjoint.trim().toLowerCase(),
          adresseConjointeIdentique,
          adresseConjoint: (adresseConjointeIdentique ? adresse : adresseConjoint).trim(),
          appConjoint: (adresseConjointeIdentique ? app : appConjoint).trim(),
          villeConjoint: (adresseConjointeIdentique ? ville : villeConjoint).trim(),
          provinceConjoint: adresseConjointeIdentique ? province : provinceConjoint,
          codePostalConjoint: normalizePostal(adresseConjointeIdentique ? codePostal : codePostalConjoint),
          revenuNetConjoint: traiterConjoint ? "" : revenuNetConjoint.trim(),
        }
      : null;

    const medsData =
      province === "QC"
        ? {
            client: { regime: assuranceMedsClient, periodes: assuranceMedsClientPeriodes },
            conjoint: aUnConjoint
              ? { regime: assuranceMedsConjoint, periodes: assuranceMedsConjointPeriodes }
              : null,
          }
        : null;

    return {
      dossierType: type,
      client: {
        prenom: prenom.trim(),
        nom: nom.trim(),
        nas: normalizeNAS(nas),
        dob: dob.trim(),
        etatCivil,
        etatCivilChange,
        ancienEtatCivil: ancienEtatCivil.trim(),
        dateChangementEtatCivil: dateChangementEtatCivil.trim(),
        tel: normalizePhone(tel),
        telCell: normalizePhone(telCell),
        adresse: adresse.trim(),
        app: app.trim(),
        ville: ville.trim(),
        province,
        codePostal: normalizePostal(codePostal),
        courriel: courriel.trim().toLowerCase(),
      },
      conjoint: conjointData,
      assuranceMedicamenteuse: medsData,
      personnesACharge: enfants.map((x) => ({
        prenom: x.prenom.trim(),
        nom: x.nom.trim(),
        dob: x.dob.trim(),
        nas: normalizeNAS(x.nas),
        sexe: x.sexe as Sexe,
      })),
      questionsGenerales: {
        habiteSeulTouteAnnee: habiteSeulTouteAnnee as any,
        nbPersonnesMaison3112: nbPersonnesMaison3112.trim(),
        biensEtranger100k: biensEtranger100k as any,
        citoyenCanadien: citoyenCanadien as any,
        nonResident: nonResident as any,
        maisonAcheteeOuVendue: maisonAcheteeOuVendue as any,
        appelerTechnicien: appelerTechnicien as any,
        copieImpots,
        anneeImposition: anneeImposition.trim(),
      },
      validations: {
        exactitudeInfo: vExactitude,
        dossierComplet: vDossierComplet,
        fraisVariables: vFraisVariables,
        delaisSiManquant: vDelais,
      },
    };
  }, [
    type,
    prenom,
    nom,
    nas,
    dob,
    etatCivil,
    etatCivilChange,
    ancienEtatCivil,
    dateChangementEtatCivil,
    tel,
    telCell,
    adresse,
    app,
    ville,
    province,
    codePostal,
    courriel,
    aUnConjoint,
    traiterConjoint,
    prenomConjoint,
    nomConjoint,
    nasConjoint,
    dobConjoint,
    telConjoint,
    telCellConjoint,
    courrielConjoint,
    adresseConjointeIdentique,
    adresseConjoint,
    appConjoint,
    villeConjoint,
    provinceConjoint,
    codePostalConjoint,
    revenuNetConjoint,
    assuranceMedsClient,
    assuranceMedsClientPeriodes,
    assuranceMedsConjoint,
    assuranceMedsConjointPeriodes,
    enfants,
    habiteSeulTouteAnnee,
    nbPersonnesMaison3112,
    biensEtranger100k,
    citoyenCanadien,
    nonResident,
    maisonAcheteeOuVendue,
    appelerTechnicien,
    copieImpots,
    anneeImposition,
    vExactitude,
    vDossierComplet,
    vFraisVariables,
    vDelais,
  ]);

  // Helper traduction court (pour messages d’erreurs custom si tu veux)
  const t = useCallback(
    (fr: string, en: string, es: string) => (lang === "fr" ? fr : lang === "en" ? en : es),
    [lang]
  );

  /* ===================== Step 1 validation (bloquant) ===================== */
  const step1Errors = useMemo(() => {
    const errors: string[] = [];

    // Année
    if (!isValidYear(anneeImposition))
      errors.push(
        t(
          "Année d’imposition : entrez une année valide (ex.: 2025).",
          "Tax year: enter a valid year (e.g., 2025).",
          "Año fiscal: ingrese un año válido (p. ej., 2025)."
        )
      );

    // Client obligatoire
    if (!prenom.trim()) errors.push(t("Prénom : obligatoire.", "First name: required.", "Nombre: obligatorio."));
    if (!nom.trim()) errors.push(t("Nom : obligatoire.", "Last name: required.", "Apellido: obligatorio."));
    if (!isValidNAS(nas))
      errors.push(
        t("NAS : 9 chiffres obligatoires.", "SIN: 9 digits required.", "NAS/SIN: se requieren 9 dígitos.")
      );
    if (!isValidDateJJMMAAAA(dob))
      errors.push(
        t(
          "Date de naissance : format JJ/MM/AAAA valide obligatoire.",
          "Date of birth: a valid DD/MM/YYYY format is required.",
          "Fecha de nacimiento: se requiere un formato válido DD/MM/AAAA."
        )
      );
    if (!etatCivil)
      errors.push(t("État civil : obligatoire.", "Marital status: required.", "Estado civil: obligatorio."));
    if (!isValidEmail(courriel))
      errors.push(
        t(
          "Courriel : adresse valide obligatoire.",
          "Email: a valid address is required.",
          "Correo electrónico: se requiere una dirección válida."
        )
      );
    if (!adresse.trim()) errors.push(t("Adresse : obligatoire.", "Address: required.", "Dirección: obligatorio."));
    if (!ville.trim()) errors.push(t("Ville : obligatoire.", "City: required.", "Ciudad: obligatorio."));
    if (!province) errors.push(t("Province : obligatoire.", "Province: required.", "Provincia: obligatorio."));
    if (!isValidPostal(codePostal))
      errors.push(
        t(
          "Code postal : 6 caractères obligatoires (ex.: G1V0A6).",
          "Postal code: 6 characters required (e.g., G1V0A6).",
          "Código postal: se requieren 6 caracteres (p. ej., G1V0A6)."
        )
      );

    // Téléphone: au moins un des deux
    const telAny = firstNonEmpty(normalizePhone(tel), normalizePhone(telCell));
    if (!telAny)
      errors.push(
        t(
          "Téléphone ou cellulaire : au moins un numéro est obligatoire.",
          "Phone or mobile: at least one number is required.",
          "Teléfono o móvil: se requiere al menos un número."
        )
      );

    // Changement état civil
    if (etatCivilChange) {
      if (!ancienEtatCivil.trim())
        errors.push(
          t(
            "Ancien état civil : obligatoire si changement durant l’année.",
            "Previous marital status: required if it changed during the year.",
            "Estado civil anterior: obligatorio si cambió durante el año."
          )
        );

      if (!isValidDateJJMMAAAA(dateChangementEtatCivil))
        errors.push(
          t(
            "Date du changement : format JJ/MM/AAAA valide obligatoire si changement durant l’année.",
            "Change date: a valid DD/MM/YYYY format is required if it changed during the year.",
            "Fecha del cambio: se requiere un formato válido DD/MM/AAAA si cambió durante el año."
          )
        );
    }

    // Conjoint
    if (aUnConjoint) {
      if (!traiterConjoint) {
        if (!revenuNetConjoint.trim())
          errors.push(
            t(
              "Conjoint non traité : revenu net approximatif du conjoint obligatoire.",
              "Spouse not included: spouse's approximate net income is required.",
              "Cónyuge no incluido: se requiere el ingreso neto aproximado del cónyuge."
            )
          );
      } else {
        if (!prenomConjoint.trim())
          errors.push(t("Prénom (conjoint) : obligatoire.", "Spouse first name: required.", "Nombre (cónyuge): obligatorio."));
        if (!nomConjoint.trim())
          errors.push(t("Nom (conjoint) : obligatoire.", "Spouse last name: required.", "Apellido (cónyuge): obligatorio."));
        if (!isValidNAS(nasConjoint))
          errors.push(
            t(
              "NAS (conjoint) : 9 chiffres obligatoires.",
              "Spouse SIN: 9 digits required.",
              "NAS/SIN (cónyuge): se requieren 9 dígitos."
            )
          );
        if (!isValidDateJJMMAAAA(dobConjoint))
          errors.push(
            t(
              "Date de naissance (conjoint) : JJ/MM/AAAA valide obligatoire.",
              "Spouse date of birth: valid DD/MM/YYYY required.",
              "Fecha de nacimiento (cónyuge): se requiere DD/MM/AAAA válido."
            )
          );

        const telCjAny = firstNonEmpty(normalizePhone(telConjoint), normalizePhone(telCellConjoint));
        if (!telCjAny)
          errors.push(
            t(
              "Téléphone ou cellulaire (conjoint) : au moins un numéro est obligatoire.",
              "Spouse phone or mobile: at least one number is required.",
              "Teléfono o móvil (cónyuge): se requiere al menos un número."
            )
          );
      }

      if (!adresseConjointeIdentique) {
        if (!adresseConjoint.trim())
          errors.push(
            t(
              "Adresse (conjoint) : obligatoire si adresse différente.",
              "Spouse address: required if different.",
              "Dirección (cónyuge): obligatorio si es diferente."
            )
          );
        if (!villeConjoint.trim())
          errors.push(
            t(
              "Ville (conjoint) : obligatoire si adresse différente.",
              "Spouse city: required if different.",
              "Ciudad (cónyuge): obligatorio si es diferente."
            )
          );
        if (!provinceConjoint)
          errors.push(
            t(
              "Province (conjoint) : obligatoire si adresse différente.",
              "Spouse province: required if different.",
              "Provincia (cónyuge): obligatorio si es diferente."
            )
          );
        if (!isValidPostal(codePostalConjoint))
          errors.push(
            t(
              "Code postal (conjoint) : obligatoire si adresse différente.",
              "Spouse postal code: required if different.",
              "Código postal (cónyuge): obligatorio si es diferente."
            )
          );
      }
    }

    // Québec: assurance médicaments
    if (province === "QC") {
      if (!assuranceMedsClient)
        errors.push(
          t(
            "Assurance médicaments (client) : choisissez une option.",
            "Prescription drug insurance (client): choose an option.",
            "Seguro de medicamentos (cliente): elija una opción."
          )
        );

      const okPeriodeClient = assuranceMedsClientPeriodes.some(
        (p) => isValidDateJJMMAAAA(p.debut) && isValidDateJJMMAAAA(p.fin)
      );
      if (!okPeriodeClient)
        errors.push(
          t(
            "Assurance médicaments (client) : au moins 1 période complète (de/à) est obligatoire.",
            "Prescription drug insurance (client): at least 1 complete period (from/to) is required.",
            "Seguro de medicamentos (cliente): se requiere al menos 1 período completo (desde/hasta)."
          )
        );

      if (aUnConjoint) {
        if (!assuranceMedsConjoint)
          errors.push(
            t(
              "Assurance médicaments (conjoint) : choisissez une option.",
              "Prescription drug insurance (spouse): choose an option.",
              "Seguro de medicamentos (cónyuge): elija una opción."
            )
          );

        const okPeriodeCj = assuranceMedsConjointPeriodes.some(
          (p) => isValidDateJJMMAAAA(p.debut) && isValidDateJJMMAAAA(p.fin)
        );
        if (!okPeriodeCj)
          errors.push(
            t(
              "Assurance médicaments (conjoint) : au moins 1 période complète (de/à) est obligatoire.",
              "Prescription drug insurance (spouse): at least 1 complete period (from/to) is required.",
              "Seguro de medicamentos (cónyuge): se requiere al menos 1 período completo (desde/hasta)."
            )
          );
      }
    }

    // Questions générales
    if (!habiteSeulTouteAnnee)
      errors.push(
        t(
          "Question : Habitez-vous seul(e) toute l’année ? obligatoire.",
          "Question: Did you live alone all year? required.",
          "Pregunta: ¿Vivió solo(a) todo el año? obligatorio."
        )
      );

    if (!nbPersonnesMaison3112.trim())
      errors.push(
        t(
          "Question : Nombre de personnes au 31/12 : obligatoire.",
          "Question: Number of people living with you on 12/31: required.",
          "Pregunta: Número de personas que vivían con usted el 31/12: obligatorio."
        )
      );

    const nb = Number((nbPersonnesMaison3112 || "").trim() || "0");
    if (nb > 0 && enfants.length === 0) {
      errors.push(
        t(
          "Personnes à charge : ajoutez au moins 1 personne.",
          "Dependants: add at least 1 dependant.",
          "Dependientes: agregue al menos 1 dependiente."
        )
      );
    }

    if (!biensEtranger100k)
      errors.push(
        t(
          "Question : Biens à l’étranger > 100 000 $ : obligatoire.",
          "Question: Foreign assets over $100,000: required.",
          "Pregunta: Bienes en el extranjero > $100,000: obligatorio."
        )
      );

    if (!citoyenCanadien)
      errors.push(
        t(
          "Question : Citoyen(ne) canadien(ne) : obligatoire.",
          "Question: Canadian citizen: required.",
          "Pregunta: Ciudadano(a) canadiense: obligatorio."
        )
      );

    if (!nonResident)
      errors.push(
        t(
          "Question : Non-résident(e) : obligatoire.",
          "Question: Non-resident for tax purposes: required.",
          "Pregunta: No residente a efectos fiscales: obligatorio."
        )
      );

    if (!maisonAcheteeOuVendue)
      errors.push(
        t(
          "Question : Achat/vente résidence : obligatoire.",
          "Question: Bought/sold a residence this year: required.",
          "Pregunta: Compra/venta de residencia este año: obligatorio."
        )
      );

    if (!appelerTechnicien)
      errors.push(
        t(
          "Question : Appel technicien : obligatoire.",
          "Question: Do you want a technician to call you: required.",
          "Pregunta: ¿Desea que un técnico le llame?: obligatorio."
        )
      );

    if (!copieImpots)
      errors.push(
        t(
          "Copie d’impôts : choisissez une option.",
          "Tax copy: choose an option.",
          "Copia de impuestos: elija una opción."
        )
      );

    // Validations finales
    if (!vExactitude)
      errors.push(
        t(
          "Confirmation : ‘Toutes les informations sont exactes’ obligatoire.",
          "Confirmation: ‘All information is accurate’ is required.",
          "Confirmación: ‘Toda la información es exacta’ es obligatorio."
        )
      );

    if (!vDossierComplet)
      errors.push(
        t(
          "Confirmation : ‘J’ai fourni toutes les informations requises’ obligatoire.",
          "Confirmation: ‘I provided all required information’ is required.",
          "Confirmación: ‘He proporcionado toda la información requerida’ es obligatorio."
        )
      );

    if (!vFraisVariables)
      errors.push(
        t(
          "Confirmation : ‘Des frais supplémentaires peuvent s’appliquer’ obligatoire.",
          "Confirmation: ‘Additional fees may apply’ is required.",
          "Confirmación: ‘Pueden aplicarse cargos adicionales’ es obligatorio."
        )
      );

    if (!vDelais)
      errors.push(
        t(
          "Confirmation : ‘Un dossier incomplet retarde le traitement’ obligatoire.",
          "Confirmation: ‘An incomplete file delays processing’ is required.",
          "Confirmación: ‘Un expediente incompleto retrasa el procesamiento’ es obligatorio."
        )
      );

    return errors;
  }, [
    t,
    anneeImposition,
    prenom,
    nom,
    nas,
    dob,
    etatCivil,
    courriel,
    adresse,
    ville,
    province,
    codePostal,
    tel,
    telCell,
    etatCivilChange,
    ancienEtatCivil,
    dateChangementEtatCivil,
    aUnConjoint,
    traiterConjoint,
    prenomConjoint,
    nomConjoint,
    nasConjoint,
    dobConjoint,
    telConjoint,
    telCellConjoint,
    adresseConjointeIdentique,
    adresseConjoint,
    villeConjoint,
    provinceConjoint,
    codePostalConjoint,
    revenuNetConjoint,
    assuranceMedsClient,
    assuranceMedsClientPeriodes,
    assuranceMedsConjoint,
    assuranceMedsConjointPeriodes,
    habiteSeulTouteAnnee,
    nbPersonnesMaison3112,
    enfants.length,
    biensEtranger100k,
    citoyenCanadien,
    nonResident,
    maisonAcheteeOuVendue,
    appelerTechnicien,
    copieImpots,
    vExactitude,
    vDossierComplet,
    vFraisVariables,
    vDelais,
  ]);

  const canContinue = step1Errors.length === 0;

  // showEnfantsSection (utilisé dans le rendu)
  const showEnfantsSection = useMemo(() => {
    const nb = Number((nbPersonnesMaison3112 || "").trim() || "0");
    return nb > 0;
  }, [nbPersonnesMaison3112]);

  // si nb = 0, vide la liste enfants
  useEffect(() => {
    const nb = Number((nbPersonnesMaison3112 || "").trim() || "0");
    if (nb === 0 && enfants.length > 0) setEnfants([]);
  }, [nbPersonnesMaison3112, enfants.length]);

  /* =========================== Save draft (insert/update) =========================== */
  const saveDraft = useCallback(async (): Promise<string | null> => {
    if (hydrating.current) return formulaireId ?? null;
    if (submitting) return formulaireId ?? null;

    if (formulaireId) {
      const { error } = await supabase
        .from(FORMS_TABLE)
        .update({
          lang,
          annee: anneeImposition || null,
          data: draftData,
        })
        .eq("id", formulaireId)
        .eq("user_id", userId);

      if (error) throw new Error(supaErr(error));
      return formulaireId;
    }

    const { data: dataInsert, error: errorInsert } = await supabase
      .from(FORMS_TABLE)
      .insert({
        user_id: userId,
        form_type: type,
        lang,
        status: "draft",
        annee: anneeImposition || null,
        data: draftData,
      })
      .select("id")
      .single<InsertIdRow>();

    if (errorInsert) throw new Error(supaErr(errorInsert));

    const fid = dataInsert?.id ?? null;
    if (fid) setFormulaireId(fid);
    return fid;
  }, [userId, submitting, formulaireId, type, lang, draftData, anneeImposition]);

  /* =========================== Load last form (preload) =========================== */
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

    if (!row) {
      hydrating.current = false;
      return;
    }

    const fid = row.id;
    setFormulaireId(fid);

    const form = row.data;
    const client = form?.client ?? {};

    setPrenom(client.prenom ?? "");
    setNom(client.nom ?? "");
    setNas(client.nas ? formatNASInput(client.nas) : "");
    setDob(client.dob ?? "");
    setEtatCivil(client.etatCivil ?? "");
    setEtatCivilChange(!!client.etatCivilChange);
    setAncienEtatCivil(client.ancienEtatCivil ?? "");
    setDateChangementEtatCivil(client.dateChangementEtatCivil ?? "");
    setTel(client.tel ? formatPhoneInput(client.tel) : "");
    setTelCell(client.telCell ? formatPhoneInput(client.telCell) : "");
    setAdresse(client.adresse ?? "");
    setApp(client.app ?? "");
    setVille(client.ville ?? "");
    setProvince(client.province ?? "QC");
    setCodePostal(client.codePostal ? formatPostalInput(client.codePostal) : "");
    setCourriel(client.courriel ?? "");

    const cj = form?.conjoint ?? null;
    setAUnConjoint(!!cj);

    if (cj) {
      setTraiterConjoint(!!cj.traiterConjoint);
      setPrenomConjoint(cj.prenomConjoint ?? "");
      setNomConjoint(cj.nomConjoint ?? "");
      setNasConjoint(cj.nasConjoint ? formatNASInput(cj.nasConjoint) : "");
      setDobConjoint(cj.dobConjoint ?? "");
      setTelConjoint(cj.telConjoint ? formatPhoneInput(cj.telConjoint) : "");
      setTelCellConjoint(cj.telCellConjoint ? formatPhoneInput(cj.telCellConjoint) : "");
      setCourrielConjoint(cj.courrielConjoint ?? "");
      setAdresseConjointeIdentique(!!cj.adresseConjointeIdentique);
      setAdresseConjoint(cj.adresseConjoint ?? "");
      setAppConjoint(cj.appConjoint ?? "");
      setVilleConjoint(cj.villeConjoint ?? "");
      setProvinceConjoint(cj.provinceConjoint ?? "QC");
      setCodePostalConjoint(cj.codePostalConjoint ? formatPostalInput(cj.codePostalConjoint) : "");
      setRevenuNetConjoint(cj.revenuNetConjoint ?? "");
    } else {
      setTraiterConjoint(true);
      setPrenomConjoint("");
      setNomConjoint("");
      setNasConjoint("");
      setDobConjoint("");
      setTelConjoint("");
      setTelCellConjoint("");
      setCourrielConjoint("");
      setAdresseConjointeIdentique(true);
      setAdresseConjoint("");
      setAppConjoint("");
      setVilleConjoint("");
      setProvinceConjoint("QC");
      setCodePostalConjoint("");
      setRevenuNetConjoint("");
    }

    const meds = form?.assuranceMedicamenteuse ?? null;
    if (meds?.client) {
      setAssuranceMedsClient(meds.client.regime ?? "");
      setAssuranceMedsClientPeriodes(meds.client.periodes ?? [{ debut: "", fin: "" }]);
    } else {
      setAssuranceMedsClient("");
      setAssuranceMedsClientPeriodes([{ debut: "", fin: "" }]);
    }

    if (meds?.conjoint) {
      setAssuranceMedsConjoint(meds.conjoint?.regime ?? "");
      setAssuranceMedsConjointPeriodes(meds.conjoint?.periodes ?? [{ debut: "", fin: "" }]);
    } else {
      setAssuranceMedsConjoint("");
      setAssuranceMedsConjointPeriodes([{ debut: "", fin: "" }]);
    }

    setEnfants(form?.personnesACharge ?? []);

    const q = form?.questionsGenerales ?? {};
    setHabiteSeulTouteAnnee((q.habiteSeulTouteAnnee as any) ?? "");
    setNbPersonnesMaison3112(q.nbPersonnesMaison3112 ?? "");
    setBiensEtranger100k((q.biensEtranger100k as any) ?? "");
    setCitoyenCanadien((q.citoyenCanadien as any) ?? "");
    setNonResident((q.nonResident as any) ?? "");
    setMaisonAcheteeOuVendue((q.maisonAcheteeOuVendue as any) ?? "");
    setAppelerTechnicien((q.appelerTechnicien as any) ?? "");
    setCopieImpots(q.copieImpots ?? "");
    setAnneeImposition(q.anneeImposition ?? "");

    const v = form?.validations ?? {};
    setVExactitude(!!v.exactitudeInfo);
    setVDossierComplet(!!v.dossierComplet);
    setVFraisVariables(!!v.fraisVariables);
    setVDelais(!!v.delaisSiManquant);

    await loadDocs(fid);

    hydrating.current = false;
  }, [userId, type, loadDocs]);

  useEffect(() => {
    void loadLastForm();
  }, [loadLastForm]);

  /* =========================== Autosave debounce =========================== */
  useEffect(() => {
    if (hydrating.current) return;

    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    saveTimer.current = window.setTimeout(() => {
      saveDraft().catch(() => {});
    }, 800);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [lang, type, draftData, saveDraft]);

  /* =========================== Actions =========================== */
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
            "❌ Certaines informations obligatoires manquent. Corrigez la liste ci-dessous.",
            "❌ Some required information is missing. Please fix the list below.",
            "❌ Faltan datos obligatorios. Corrija la lista a continuación."
          )
        );
        document.getElementById("ff-errors")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      setMsg(t("⏳ Préparation du dossier…", "⏳ Preparing your file…", "⏳ Preparando el expediente…"));

      const fidFromSave = await saveDraft();
      const fid = fidFromSave || fidDisplay;

      if (!fid) throw new Error("Impossible de créer le dossier (fid manquant).");

      setCurrentFid(fid);
      await loadDocs(fid);

      setMsg(t("✅ Redirection vers le dépôt…", "✅ Redirecting to upload…", "✅ Redirigiendo a la carga…"));

      router.push(
        `/formulaire-fiscal/depot-documents?fid=${encodeURIComponent(fid)}&type=${encodeURIComponent(
          type
        )}&lang=${encodeURIComponent(lang)}`
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erreur dépôt documents.";
      setMsg("❌ " + message);
      document.getElementById("ff-errors")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [canContinue, saveDraft, fidDisplay, loadDocs, router, lang, type, t]);

  /* =========================== RENDER =========================== */
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
              <span>{L.formName}</span>
            </div>
          </div>

          <button className="ff-btn ff-btn-outline" type="button" onClick={logout}>
            {L.logout}
          </button>
        </header>

        <div className="ff-title">
          <h1>
            {L.formName} – {formTitle}
          </h1>
          <p>{L.intro}</p>
        </div>

        {msg && (
          <div className="ff-card" style={{ padding: 14 }}>
            {msg}
          </div>
        )}

        {/* Errors (top) */}
        <ErrorsPanel L={L} errors={step1Errors} />

        <Steps step={1} lang={lang} />

        <form className="ff-form" onSubmit={(e) => e.preventDefault()}>
          <ClientSection
            L={L}
            PROVINCES={PROVINCES}
            prenom={prenom}
            setPrenom={setPrenom}
            nom={nom}
            setNom={setNom}
            nas={nas}
            setNas={(v: string) => setNas(formatNASInput(v))}
            dob={dob}
            setDob={(v: string) => setDob(formatDateInput(v))}
            etatCivil={etatCivil}
            setEtatCivil={setEtatCivil}
            etatCivilChange={etatCivilChange}
            setEtatCivilChange={setEtatCivilChange}
            ancienEtatCivil={ancienEtatCivil}
            setAncienEtatCivil={setAncienEtatCivil}
            dateChangementEtatCivil={dateChangementEtatCivil}
            setDateChangementEtatCivil={(v: string) => setDateChangementEtatCivil(formatDateInput(v))}
            tel={tel}
            setTel={(v: string) => setTel(formatPhoneInput(v))}
            telCell={telCell}
            setTelCell={(v: string) => setTelCell(formatPhoneInput(v))}
            courriel={courriel}
            setCourriel={setCourriel}
            adresse={adresse}
            setAdresse={setAdresse}
            app={app}
            setApp={setApp}
            ville={ville}
            setVille={setVille}
            province={province}
            setProvince={setProvince}
            codePostal={codePostal}
            setCodePostal={(v: string) => setCodePostal(formatPostalInput(v))}
          />

          <SpouseSection
            L={L}
            PROVINCES={PROVINCES}
            aUnConjoint={aUnConjoint}
            setAUnConjoint={setAUnConjoint}
            traiterConjoint={traiterConjoint}
            setTraiterConjoint={setTraiterConjoint}
            revenuNetConjoint={revenuNetConjoint}
            setRevenuNetConjoint={setRevenuNetConjoint}
            prenomConjoint={prenomConjoint}
            setPrenomConjoint={setPrenomConjoint}
            nomConjoint={nomConjoint}
            setNomConjoint={setNomConjoint}
            nasConjoint={nasConjoint}
            setNasConjoint={(v: string) => setNasConjoint(formatNASInput(v))}
            dobConjoint={dobConjoint}
            setDobConjoint={(v: string) => setDobConjoint(formatDateInput(v))}
            telConjoint={telConjoint}
            setTelConjoint={(v: string) => setTelConjoint(formatPhoneInput(v))}
            telCellConjoint={telCellConjoint}
            setTelCellConjoint={(v: string) => setTelCellConjoint(formatPhoneInput(v))}
            courrielConjoint={courrielConjoint}
            setCourrielConjoint={setCourrielConjoint}
            adresseConjointeIdentique={adresseConjointeIdentique}
            setAdresseConjointeIdentique={setAdresseConjointeIdentique}
            adresseConjoint={adresseConjoint}
            setAdresseConjoint={setAdresseConjoint}
            appConjoint={appConjoint}
            setAppConjoint={setAppConjoint}
            villeConjoint={villeConjoint}
            setVilleConjoint={setVilleConjoint}
            provinceConjoint={provinceConjoint}
            setProvinceConjoint={setProvinceConjoint}
            codePostalConjoint={codePostalConjoint}
            setCodePostalConjoint={(v: string) => setCodePostalConjoint(formatPostalInput(v))}
          />

          <MedsSection
            L={L}
            show={province === "QC"}
            aUnConjoint={aUnConjoint}
            assuranceMedsClient={assuranceMedsClient}
            setAssuranceMedsClient={setAssuranceMedsClient}
            assuranceMedsClientPeriodes={assuranceMedsClientPeriodes}
            setAssuranceMedsClientPeriodes={(updater: any) => {
              // support setState direct OR callback
              setAssuranceMedsClientPeriodes((prev) =>
                typeof updater === "function" ? updater(prev) : updater
              );
            }}
            assuranceMedsConjoint={assuranceMedsConjoint}
            setAssuranceMedsConjoint={setAssuranceMedsConjoint}
            assuranceMedsConjointPeriodes={assuranceMedsConjointPeriodes}
            setAssuranceMedsConjointPeriodes={(updater: any) => {
              setAssuranceMedsConjointPeriodes((prev) =>
                typeof updater === "function" ? updater(prev) : updater
              );
            }}
            formatDateInput={formatDateInput}
            updatePeriode={updatePeriode}
          />

          <DependantsSection
            L={L}
            show={showEnfantsSection}
            enfants={enfants}
            ajouterEnfant={ajouterEnfant}
            updateEnfant={(i, field, value) => {
              // garde tes format live
              if (field === "dob") return updateEnfant(i, field, formatDateInput(value));
              if (field === "nas") return updateEnfant(i, field, formatNASInput(value));
              return updateEnfant(i, field, value);
            }}
            removeEnfant={removeEnfant}
          />

          <QuestionsSection
            L={L}
            anneeImposition={anneeImposition}
            setAnneeImposition={setAnneeImposition}
            habiteSeulTouteAnnee={habiteSeulTouteAnnee as any}
            setHabiteSeulTouteAnnee={setHabiteSeulTouteAnnee as any}
            nbPersonnesMaison3112={nbPersonnesMaison3112}
            setNbPersonnesMaison3112={(v: string) => setNbPersonnesMaison3112(v.replace(/[^\d]/g, ""))}
            biensEtranger100k={biensEtranger100k as any}
            setBiensEtranger100k={setBiensEtranger100k as any}
            citoyenCanadien={citoyenCanadien as any}
            setCitoyenCanadien={setCitoyenCanadien as any}
            nonResident={nonResident as any}
            setNonResident={setNonResident as any}
            maisonAcheteeOuVendue={maisonAcheteeOuVendue as any}
            setMaisonAcheteeOuVendue={setMaisonAcheteeOuVendue as any}
            appelerTechnicien={appelerTechnicien as any}
            setAppelerTechnicien={setAppelerTechnicien as any}
            copieImpots={copieImpots}
            setCopieImpots={setCopieImpots}
          />

          <ConfirmationsSection
            L={L}
            vExactitude={vExactitude}
            setVExactitude={setVExactitude}
            vDossierComplet={vDossierComplet}
            setVDossierComplet={setVDossierComplet}
            vFraisVariables={vFraisVariables}
            setVFraisVariables={setVFraisVariables}
            vDelais={vDelais}
            setVDelais={setVDelais}
          />

          <DocsSummary
            L={L}
            docsLoading={docsLoading}
            docsCount={docsCount}
            docs={docs}
            openDoc={openDoc}
            canContinue={canContinue}
            submitting={submitting}
            goToDepotDocuments={goToDepotDocuments}
          />
        </form>
      </div>
    </main>
  );
}
