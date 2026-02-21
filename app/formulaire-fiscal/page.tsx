"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

import "./formulaire-fiscal.css";
import Steps from "./Steps";
import RequireAuth from "./RequireAuth";
import { Field, CheckboxField, YesNoField, SelectField, type YesNo } from "./ui";

/**
 * Storage / DB
 */
const STORAGE_BUCKET = "client-documents";
const DOCS_TABLE = "formulaire_documents";
const FORMS_TABLE = "formulaires_fiscaux";

/**
 * Lang
 */
type Lang = "fr" | "en" | "es";
function normalizeLang(v: string | null | undefined): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

/* =========================== Types =========================== */
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

type Sexe = "M" | "F" | "X" | "";
type AssuranceMeds = "ramq" | "prive" | "conjoint" | "";
type CopieImpots = "espaceClient" | "courriel" | "";

type EtatCivil =
  | "celibataire"
  | "conjointDefait"
  | "marie"
  | "separe"
  | "divorce"
  | "veuf"
  | "";

type Periode = { debut: string; fin: string };
type FormTypeDb = "T1" | "T2";
type InsertIdRow = { id: string };

type Child = {
  prenom: string;
  nom: string;
  dob: string;
  nas: string;
  sexe: Sexe;
};

type DocRow = {
  id: string;
  formulaire_id: string;
  user_id: string;
  original_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

type FormClientdata = {
  prenom?: string;
  nom?: string;
  nas?: string;
  dob?: string;
  etatCivil?: EtatCivil;
  etatCivilChange?: boolean;
  ancienEtatCivil?: string;
  dateChangementEtatCivil?: string;
  tel?: string;
  telCell?: string;
  adresse?: string;
  app?: string;
  ville?: string;
  province?: ProvinceCode;
  codePostal?: string;
  courriel?: string;
};

type FormConjointdata = {
  traiterConjoint?: boolean;
  prenomConjoint?: string;
  nomConjoint?: string;
  nasConjoint?: string;
  dobConjoint?: string;
  telConjoint?: string;
  telCellConjoint?: string;
  courrielConjoint?: string;
  adresseConjointeIdentique?: boolean;
  adresseConjoint?: string;
  appConjoint?: string;
  villeConjoint?: string;
  provinceConjoint?: ProvinceCode;
  codePostalConjoint?: string;
  revenuNetConjoint?: string;
};

type FormMedsdata = {
  client?: { regime?: AssuranceMeds; periodes?: Periode[] };
  conjoint?: { regime?: AssuranceMeds; periodes?: Periode[] } | null;
};

type FormQuestionsdata = {
  habiteSeulTouteAnnee?: YesNo;
  nbPersonnesMaison3112?: string;
  biensEtranger100k?: YesNo;
  citoyenCanadien?: YesNo;
  nonResident?: YesNo;
  maisonAcheteeOuVendue?: YesNo;
  appelerTechnicien?: YesNo;
  copieImpots?: CopieImpots;
  anneeImposition?: string;
};

type Formdata = {
  dossierType?: string;
  client?: FormClientdata;
  conjoint?: FormConjointdata | null;
  assuranceMedicamenteuse?: FormMedsdata | null;
  personnesACharge?: Child[];
  questionsGenerales?: FormQuestionsdata;
  validations?: {
    exactitudeInfo?: boolean;
    dossierComplet?: boolean;
    fraisVariables?: boolean;
    delaisSiManquant?: boolean;
  };
};

type FormRow = {
  id: string;
  user_id?: string;
  form_type?: FormTypeDb;
  lang?: string;
  status?: string;
  annee?: string | null;
  data: Formdata | null;
  created_at: string;
};

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

function firstNonEmpty(...vals: string[]) {
  for (const v of vals) {
    if ((v || "").trim()) return v;
  }
  return "";
}

/* =========================== PAGE WRAPPER (RequireAuth) =========================== */
export default function FormulaireFiscalPage() {
  const params = useSearchParams();

  // figé à T1 ici
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
  const [habiteSeulTouteAnnee, setHabiteSeulTouteAnnee] = useState<YesNo>("");
  const [nbPersonnesMaison3112, setNbPersonnesMaison3112] = useState("");
  const [biensEtranger100k, setBiensEtranger100k] = useState<YesNo>("");
  const [citoyenCanadien, setCitoyenCanadien] = useState<YesNo>("");
  const [nonResident, setNonResident] = useState<YesNo>("");
  const [maisonAcheteeOuVendue, setMaisonAcheteeOuVendue] = useState<YesNo>("");
  const [appelerTechnicien, setAppelerTechnicien] = useState<YesNo>("");
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
      .select("id, formulaire_id, user_id, original_name, storage_path, mime_type, size_bytes, created_at")
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
    const conjointData: FormConjointdata | null = aUnConjoint
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
            conjoint: aUnConjoint ? { regime: assuranceMedsConjoint, periodes: assuranceMedsConjointPeriodes } : null,
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
        sexe: x.sexe,
      })),
      questionsGenerales: {
        habiteSeulTouteAnnee,
        nbPersonnesMaison3112: nbPersonnesMaison3112.trim(),
        biensEtranger100k,
        citoyenCanadien,
        nonResident,
        maisonAcheteeOuVendue,
        appelerTechnicien,
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

 // Helper traduction (à mettre dans FormulaireFiscalInner, avant step1Errors)
const t = useCallback(
  (fr: string, en: string, es: string) => (lang === "fr" ? fr : lang === "en" ? en : es),
  [lang]
);

// ===================== Step 1 validation (bloquant) =====================
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
      t(
        "NAS : 9 chiffres obligatoires.",
        "SIN: 9 digits required.",
        "NAS/SIN: se requieren 9 dígitos."
      )
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
    errors.push(
      t(
        "État civil : obligatoire.",
        "Marital status: required.",
        "Estado civil: obligatorio."
      )
    );
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
  if (!province)
    errors.push(
      t(
        "Province : obligatoire.",
        "Province: required.",
        "Provincia: obligatorio."
      )
    );
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

  // Conjoint : logique obligatoire
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
        errors.push(
          t(
            "Prénom (conjoint) : obligatoire.",
            "Spouse first name: required.",
            "Nombre (cónyuge): obligatorio."
          )
        );
      if (!nomConjoint.trim())
        errors.push(
          t(
            "Nom (conjoint) : obligatoire.",
            "Spouse last name: required.",
            "Apellido (cónyuge): obligatorio."
          )
        );
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

      // au moins un contact (conjoint)
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

  // ✅ correction: showEnfantsSection (utilisé dans le rendu)
  const showEnfantsSection = useMemo(() => {
    const nb = Number((nbPersonnesMaison3112 || "").trim() || "0");
    return nb > 0;
  }, [nbPersonnesMaison3112]);

  // ✅ optionnel mais utile: si nb = 0, on vide la liste enfants
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
    setHabiteSeulTouteAnnee(q.habiteSeulTouteAnnee ?? "");
    setNbPersonnesMaison3112(q.nbPersonnesMaison3112 ?? "");
    setBiensEtranger100k(q.biensEtranger100k ?? "");
    setCitoyenCanadien(q.citoyenCanadien ?? "");
    setNonResident(q.nonResident ?? "");
    setMaisonAcheteeOuVendue(q.maisonAcheteeOuVendue ?? "");
    setAppelerTechnicien(q.appelerTechnicien ?? "");
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
        setMsg("❌ Certaines informations obligatoires manquent. Corrigez la liste ci-dessous.");
        document.getElementById("ff-errors")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      setMsg("⏳ Préparation du dossier…");

      const fidFromSave = await saveDraft();
      const fid = fidFromSave || fidDisplay;

      if (!fid) throw new Error("Impossible de créer le dossier (fid manquant).");

      setCurrentFid(fid);
      await loadDocs(fid);

      setMsg("✅ Redirection vers le dépôt…");

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
  }, [canContinue, saveDraft, fidDisplay, loadDocs, router, lang, type]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitting(true);
      setMsg(null);

      try {
        if (!canContinue) {
          setMsg("❌ Certaines informations obligatoires manquent. Corrigez la liste ci-dessous.");
          document.getElementById("ff-errors")?.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }

        const fidFromSave = await saveDraft();
        const realFid = fidFromSave || fidDisplay;

        if (!realFid) throw new Error("Impossible de soumettre (dossier introuvable).");

        const { data: docsData, error: docsErr } = await supabase
          .from(DOCS_TABLE)
          .select("id")
          .eq("formulaire_id", realFid)
          .limit(1);

        if (docsErr) throw new Error(supaErr(docsErr));
        if (!docsData || docsData.length === 0) throw new Error("Ajoutez au moins 1 document avant de soumettre.");

        const { error } = await supabase
          .from(FORMS_TABLE)
          .update({ status: "submitted" })
          .eq("id", realFid)
          .eq("user_id", userId);

        if (error) throw new Error(supaErr(error));

        setMsg("✅ Dossier soumis. Merci !");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur lors de la soumission.";
        setMsg("❌ " + message);
      } finally {
        setSubmitting(false);
      }
    },
    [canContinue, saveDraft, fidDisplay, userId]
  );

  /* =========================== Render =========================== */
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
          <p>
            Merci de remplir ce formulaire après avoir créé votre compte. Nous utilisons ces informations pour préparer
            vos déclarations d’impôt au Canada (fédéral) et, si applicable, au Québec.
          </p>
        </div>

        {msg && (
          <div className="ff-card" style={{ padding: 14 }}>
            {msg}
          </div>
        )}

        {step1Errors.length > 0 && (
          <section id="ff-errors" className="ff-card" style={{ padding: 14, border: "1px solid #ffd0d0" }}>
            <strong>À corriger avant de continuer</strong>
            <ul style={{ marginTop: 10, paddingLeft: 18 }}>
              {step1Errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </section>
        )}

        <Steps step={1} lang={lang} />

        <form onSubmit={handleSubmit} className="ff-form">
          {/* SECTION CLIENT */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Informations du client</h2>
              <p>Informations essentielles pour l’ouverture du dossier.</p>
            </div>

            <div className="ff-grid2">
              <Field label="Prénom" value={prenom} onChange={setPrenom} required />
              <Field label="Nom" value={nom} onChange={setNom} required />
              <Field
                label="Numéro d’assurance sociale (NAS)"
                value={nas}
                onChange={setNas}
                placeholder="123-456-789"
                required
                inputMode="numeric"
                formatter={formatNASInput}
                maxLength={11}
              />
              <Field
                label="Date de naissance (JJ/MM/AAAA)"
                value={dob}
                onChange={setDob}
                placeholder="01/01/1990"
                required
                inputMode="numeric"
                formatter={formatDateInput}
                maxLength={10}
              />
            </div>

            <div className="ff-grid2 ff-mt">
              <SelectField<EtatCivil>
                label="État civil"
                value={etatCivil}
                onChange={setEtatCivil}
                options={[
                  { value: "celibataire", label: "Célibataire" },
                  { value: "conjointDefait", label: "Conjoint de fait" },
                  { value: "marie", label: "Marié(e)" },
                  { value: "separe", label: "Séparé(e)" },
                  { value: "divorce", label: "Divorcé(e)" },
                  { value: "veuf", label: "Veuf(ve)" },
                ]}
                required
              />
              <CheckboxField
                label="Mon état civil a changé durant l'année"
                checked={etatCivilChange}
                onChange={setEtatCivilChange}
              />
            </div>

            {etatCivilChange && (
              <div className="ff-grid2 ff-mt">
                <Field
                  label="Ancien état civil"
                  value={ancienEtatCivil}
                  onChange={setAncienEtatCivil}
                  placeholder="ex.: Célibataire"
                  required
                />
                <Field
                  label="Date du changement (JJ/MM/AAAA)"
                  value={dateChangementEtatCivil}
                  onChange={setDateChangementEtatCivil}
                  placeholder="15/07/2024"
                  inputMode="numeric"
                  formatter={formatDateInput}
                  maxLength={10}
                  required
                />
              </div>
            )}

            <div className="ff-grid2 ff-mt">
              <Field
                label="Téléphone"
                value={tel}
                onChange={setTel}
                placeholder="(418) 555-1234"
                inputMode="tel"
                formatter={formatPhoneInput}
                maxLength={14}
              />
              <Field
                label="Cellulaire"
                value={telCell}
                onChange={setTelCell}
                placeholder="(418) 555-1234"
                inputMode="tel"
                formatter={formatPhoneInput}
                maxLength={14}
              />
              <Field label="Courriel" value={courriel} onChange={setCourriel} type="email" required />
            </div>

            <div className="ff-mt">
              <Field label="Adresse (rue)" value={adresse} onChange={setAdresse} required />
              <div className="ff-grid4 ff-mt-sm">
                <Field label="App." value={app} onChange={setApp} placeholder="#201" />
                <Field label="Ville" value={ville} onChange={setVille} required />
                <SelectField<ProvinceCode>
                  label="Province"
                  value={province}
                  onChange={setProvince}
                  options={PROVINCES}
                  required
                />
                <Field
                  label="Code postal"
                  value={codePostal}
                  onChange={setCodePostal}
                  placeholder="G1V 0A6"
                  required
                  formatter={formatPostalInput}
                  maxLength={7}
                  autoComplete="postal-code"
                />
              </div>
            </div>
          </section>

          {/* SECTION CONJOINT */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Conjoint</h2>
              <p>À remplir seulement si applicable.</p>
            </div>

            <CheckboxField label="J'ai un conjoint / conjointe" checked={aUnConjoint} onChange={setAUnConjoint} />

            {aUnConjoint && (
              <>
                <div className="ff-mt">
                  <CheckboxField
                    label="Traiter aussi la déclaration du conjoint"
                    checked={traiterConjoint}
                    onChange={setTraiterConjoint}
                  />
                </div>

                {!traiterConjoint && (
                  <div className="ff-mt">
                    <Field
                      label="Revenu net approximatif du conjoint ($)"
                      value={revenuNetConjoint}
                      onChange={setRevenuNetConjoint}
                      placeholder="ex.: 42 000"
                      inputMode="numeric"
                      required
                    />
                  </div>
                )}

                <div className="ff-grid2 ff-mt">
                  <Field label="Prénom (conjoint)" value={prenomConjoint} onChange={setPrenomConjoint} required={traiterConjoint} />
                  <Field label="Nom (conjoint)" value={nomConjoint} onChange={setNomConjoint} required={traiterConjoint} />
                  <Field
                    label="NAS (conjoint)"
                    value={nasConjoint}
                    onChange={setNasConjoint}
                    placeholder="123-456-789"
                    inputMode="numeric"
                    formatter={formatNASInput}
                    maxLength={11}
                    required={traiterConjoint}
                  />
                  <Field
                    label="Date de naissance (JJ/MM/AAAA)"
                    value={dobConjoint}
                    onChange={setDobConjoint}
                    placeholder="01/01/1990"
                    inputMode="numeric"
                    formatter={formatDateInput}
                    maxLength={10}
                    required={traiterConjoint}
                  />
                </div>

                <div className="ff-grid2 ff-mt">
                  <Field
                    label="Téléphone (conjoint)"
                    value={telConjoint}
                    onChange={setTelConjoint}
                    placeholder="(418) 555-1234"
                    inputMode="tel"
                    formatter={formatPhoneInput}
                    maxLength={14}
                  />
                  <Field
                    label="Cellulaire (conjoint)"
                    value={telCellConjoint}
                    onChange={setTelCellConjoint}
                    placeholder="(418) 555-1234"
                    inputMode="tel"
                    formatter={formatPhoneInput}
                    maxLength={14}
                  />
                  <Field
                    label="Courriel (conjoint)"
                    value={courrielConjoint}
                    onChange={setCourrielConjoint}
                    type="email"
                  />
                </div>

                <div className="ff-mt">
                  <CheckboxField
                    label="L'adresse du conjoint est identique à la mienne"
                    checked={adresseConjointeIdentique}
                    onChange={setAdresseConjointeIdentique}
                  />
                </div>

                {!adresseConjointeIdentique && (
                  <div className="ff-mt">
                    <Field label="Adresse (rue) - conjoint" value={adresseConjoint} onChange={setAdresseConjoint} required />
                    <div className="ff-grid4 ff-mt-sm">
                      <Field label="App." value={appConjoint} onChange={setAppConjoint} />
                      <Field label="Ville" value={villeConjoint} onChange={setVilleConjoint} required />
                      <SelectField<ProvinceCode>
                        label="Province"
                        value={provinceConjoint}
                        onChange={setProvinceConjoint}
                        options={PROVINCES}
                        required
                      />
                      <Field
                        label="Code postal"
                        value={codePostalConjoint}
                        onChange={setCodePostalConjoint}
                        placeholder="G1V 0A6"
                        formatter={formatPostalInput}
                        maxLength={7}
                        autoComplete="postal-code"
                        required
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* ASSURANCE MEDS */}
          {province === "QC" && (
            <section className="ff-card">
              <div className="ff-card-head">
                <h2>Assurance médicaments (Québec)</h2>
                <p>RAMQ / régimes privés : indiquez qui vous couvrait et les périodes.</p>
              </div>

              <div className="ff-subtitle">Couverture du client</div>

              <SelectField<AssuranceMeds>
                label="Votre couverture médicaments"
                value={assuranceMedsClient}
                onChange={setAssuranceMedsClient}
                required
                options={[
                  { value: "ramq", label: "Régime public (RAMQ)" },
                  { value: "prive", label: "Mon régime collectif privé" },
                  { value: "conjoint", label: "Régime du conjoint / d'un parent" },
                ]}
              />

              <div className="ff-mt-sm ff-stack">
                {assuranceMedsClientPeriodes.map((p, idx) => (
                  <div key={`cli-${idx}`} className="ff-rowbox">
                    <Field
                      label="De (JJ/MM/AAAA)"
                      value={p.debut}
                      onChange={(val) =>
                        setAssuranceMedsClientPeriodes((prev) =>
                          updatePeriode(prev, idx, { debut: formatDateInput(val) })
                        )
                      }
                      placeholder="01/01/2024"
                      inputMode="numeric"
                      maxLength={10}
                      required
                    />
                    <Field
                      label="À (JJ/MM/AAAA)"
                      value={p.fin}
                      onChange={(val) =>
                        setAssuranceMedsClientPeriodes((prev) => updatePeriode(prev, idx, { fin: formatDateInput(val) }))
                      }
                      placeholder="31/12/2024"
                      inputMode="numeric"
                      maxLength={10}
                      required
                    />
                  </div>
                ))}

                <button
                  type="button"
                  className="ff-btn ff-btn-soft"
                  onClick={() => setAssuranceMedsClientPeriodes((prev) => [...prev, { debut: "", fin: "" }])}
                >
                  + Ajouter une période
                </button>
              </div>

              {aUnConjoint && (
                <>
                  <div className="ff-subtitle ff-mt">Couverture du conjoint</div>

                  <SelectField<AssuranceMeds>
                    label="Couverture médicaments du conjoint"
                    value={assuranceMedsConjoint}
                    onChange={setAssuranceMedsConjoint}
                    required
                    options={[
                      { value: "ramq", label: "Régime public (RAMQ)" },
                      { value: "prive", label: "Régime collectif privé" },
                      { value: "conjoint", label: "Régime du conjoint / d'un parent" },
                    ]}
                  />

                  <div className="ff-mt-sm ff-stack">
                    {assuranceMedsConjointPeriodes.map((p, idx) => (
                      <div key={`cj-${idx}`} className="ff-rowbox">
                        <Field
                          label="De (JJ/MM/AAAA)"
                          value={p.debut}
                          onChange={(val) =>
                            setAssuranceMedsConjointPeriodes((prev) =>
                              updatePeriode(prev, idx, { debut: formatDateInput(val) })
                            )
                          }
                          placeholder="01/01/2024"
                          inputMode="numeric"
                          maxLength={10}
                          required
                        />
                        <Field
                          label="À (JJ/MM/AAAA)"
                          value={p.fin}
                          onChange={(val) =>
                            setAssuranceMedsConjointPeriodes((prev) => updatePeriode(prev, idx, { fin: formatDateInput(val) }))
                          }
                          placeholder="31/12/2024"
                          inputMode="numeric"
                          maxLength={10}
                          required
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      className="ff-btn ff-btn-soft"
                      onClick={() => setAssuranceMedsConjointPeriodes((prev) => [...prev, { debut: "", fin: "" }])}
                    >
                      + Ajouter une période
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {/* PERSONNES A CHARGE */}
          {showEnfantsSection && (
            <section className="ff-card">
              <div className="ff-card-head">
                <h2>Personnes à charge</h2>
                <p>Ajoutez vos enfants / personnes à charge.</p>
              </div>

              {enfants.length === 0 ? (
                <div className="ff-empty">Aucune personne à charge ajoutée.</div>
              ) : (
                <div className="ff-stack">
                  {enfants.map((enf, i) => (
                    <div key={`enf-${i}`} className="ff-childbox">
                      <div className="ff-childhead">
                        <div className="ff-childtitle">Personne à charge #{i + 1}</div>
                        <button type="button" className="ff-btn ff-btn-link" onClick={() => removeEnfant(i)}>
                          Supprimer
                        </button>
                      </div>

                      <div className="ff-grid2">
                        <Field label="Prénom" value={enf.prenom} onChange={(v) => updateEnfant(i, "prenom", v)} required />
                        <Field label="Nom" value={enf.nom} onChange={(v) => updateEnfant(i, "nom", v)} required />
                        <Field
                          label="Date de naissance (JJ/MM/AAAA)"
                          value={enf.dob}
                          onChange={(v) => updateEnfant(i, "dob", formatDateInput(v))}
                          placeholder="01/01/2020"
                          inputMode="numeric"
                          maxLength={10}
                          required
                        />
                        <Field
                          label="NAS (si attribué)"
                          value={enf.nas}
                          onChange={(v) => updateEnfant(i, "nas", formatNASInput(v))}
                          placeholder="123-456-789"
                          inputMode="numeric"
                          maxLength={11}
                        />
                      </div>

                      <div className="ff-mt-sm">
                        <SelectField<Sexe>
                          label="Sexe"
                          value={enf.sexe}
                          onChange={(v) => updateEnfant(i, "sexe", v)}
                          options={[
                            { value: "M", label: "M" },
                            { value: "F", label: "F" },
                            { value: "X", label: "Autre / préfère ne pas dire" },
                          ]}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="ff-mt">
                <button type="button" className="ff-btn ff-btn-primary" onClick={ajouterEnfant}>
                  + Ajouter une personne à charge
                </button>
              </div>
            </section>
          )}

          {/* QUESTIONS */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Informations fiscales additionnelles</h2>
              <p>Questions générales pour compléter correctement le dossier.</p>
            </div>

            <div className="ff-stack">
              <Field
                label="Année d’imposition (ex.: 2025)"
                value={anneeImposition}
                onChange={setAnneeImposition}
                placeholder="ex.: 2025"
                inputMode="numeric"
                required
              />

              <YesNoField
                name="habiteSeulTouteAnnee"
                label="Avez-vous habité seul(e) toute l'année (sans personne à charge) ?"
                value={habiteSeulTouteAnnee}
                onChange={setHabiteSeulTouteAnnee}
              />

              <Field
                label="Au 31/12, combien de personnes vivaient avec vous ?"
                value={nbPersonnesMaison3112}
                // ✅ optionnel: évite les caractères non numériques
                onChange={(v) => setNbPersonnesMaison3112(v.replace(/[^\d]/g, ""))}
                placeholder="ex.: 1"
                inputMode="numeric"
                required
              />

              <YesNoField
                name="biensEtranger100k"
                label="Avez-vous plus de 100 000 $ de biens à l'étranger ?"
                value={biensEtranger100k}
                onChange={setBiensEtranger100k}
              />

              <YesNoField
                name="citoyenCanadien"
                label="Êtes-vous citoyen(ne) canadien(ne) ?"
                value={citoyenCanadien}
                onChange={setCitoyenCanadien}
              />

              <YesNoField
                name="nonResident"
                label="Êtes-vous non-résident(e) du Canada aux fins fiscales ?"
                value={nonResident}
                onChange={setNonResident}
              />

              <YesNoField
                name="maisonAcheteeOuVendue"
                label="Avez-vous acheté une première habitation ou vendu votre résidence principale cette année ?"
                value={maisonAcheteeOuVendue}
                onChange={setMaisonAcheteeOuVendue}
              />

              <YesNoField
                name="appelerTechnicien"
                label="Souhaitez-vous qu'un technicien vous appelle ?"
                value={appelerTechnicien}
                onChange={setAppelerTechnicien}
              />

              <SelectField<CopieImpots>
                label="Comment voulez-vous recevoir votre copie d'impôt ?"
                value={copieImpots}
                onChange={setCopieImpots}
                required
                options={[
                  { value: "espaceClient", label: "Espace client" },
                  { value: "courriel", label: "Courriel" },
                ]}
              />
            </div>
          </section>

          {/* VALIDATIONS FINALES */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Confirmations obligatoires</h2>
              <p>Sans ces confirmations, le dossier ne peut pas continuer.</p>
            </div>

            <div className="ff-stack">
              <CheckboxField
                label="Je confirme que toutes les informations fournies sont exactes."
                checked={vExactitude}
                onChange={setVExactitude}
              />
              <CheckboxField
                label="Je confirme avoir fourni toutes les informations requises pour le traitement."
                checked={vDossierComplet}
                onChange={setVDossierComplet}
              />
              <CheckboxField
                label="Je comprends que les frais peuvent varier selon la complexité du dossier."
                checked={vFraisVariables}
                onChange={setVFraisVariables}
              />
              <CheckboxField
                label="Je comprends qu’un dossier incomplet peut retarder le traitement."
                checked={vDelais}
                onChange={setVDelais}
              />
            </div>
          </section>

          {/* ACTION — CONTINUER */}
          <div className="ff-submit">
            <button
              type="button"
              className="ff-btn ff-btn-primary ff-btn-big"
              disabled={submitting || !canContinue}
              onClick={goToDepotDocuments}
              title={!canContinue ? "Corrigez les champs obligatoires avant de continuer." : ""}
            >
              {lang === "fr" ? "Continuer →" : lang === "en" ? "Continue →" : "Continuar →"}
            </button>

            <div className="ff-muted" style={{ marginTop: 10 }}>
              {docsLoading
                ? "Chargement des documents…"
                : docsCount > 0
                ? `${docsCount} document(s) déjà au dossier.`
                : canContinue
                ? "Étape suivante : dépôt des documents."
                : "Complétez les champs obligatoires pour continuer."}
            </div>

            {docsCount > 0 && (
              <div className="ff-mt">
                <div className="ff-subtitle">Documents au dossier</div>
                <div className="ff-stack">
                  {docs.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className="ff-btn ff-btn-outline"
                      onClick={() => openDoc(d)}
                      title={d.original_name}
                    >
                      Ouvrir — {d.original_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
