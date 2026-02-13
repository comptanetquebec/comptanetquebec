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
 * IMPORTANT: valeur EXACTE dans ta colonne `form_type` pour TA
 */
const FORM_TYPE_TA = "autonome" as const;

/**
 * Lang
 */
type Lang = "fr" | "en" | "es";
function normalizeLang(v: string | null | undefined): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

/* ===========================
   Types
=========================== */

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
};

type FormRow = {
  id: string;
  data: Formdata | null;
  created_at: string;
};

/* ===========================
   Helpers
=========================== */

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

function supaErr(e: unknown) {
  if (!e || typeof e !== "object") return "Erreur inconnue";
  const err = e as { message?: string; details?: string; hint?: string; code?: string };
  return [err.message, err.details, err.hint, err.code].filter(Boolean).join(" | ");
}

function updatePeriode(list: Periode[], idx: number, patch: Partial<Periode>) {
  return list.map((p, i) => (i === idx ? { ...p, ...patch } : p));
}

/* ===========================
   Format LIVE
=========================== */

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

/* ===========================
   Normalize
=========================== */

function normalizeNAS(v: string) {
  return (v || "").replace(/\D+/g, "").slice(0, 9);
}
function normalizePostal(v: string) {
  return (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}
function normalizePhone(v: string) {
  return (v || "").replace(/\D+/g, "").slice(0, 10);
}

/* ===========================
   PAGE WRAPPER (RequireAuth)
=========================== */

export default function FormulaireFiscalTAPage() {
  const params = useSearchParams();
  const lang = normalizeLang(params.get("lang") || "fr");
  const fid = params.get("fid"); // ✅ garder le dossier si présent

  // ✅ revenir sur TA après login EN GARDANT fid si présent
  const nextPath = useMemo(() => {
    const base = `/formulaire-fiscal-ta?lang=${encodeURIComponent(lang)}`;
    return fid ? `${base}&fid=${encodeURIComponent(fid)}` : base;
  }, [lang, fid]);

  return (
    <RequireAuth lang={lang} nextPath={nextPath}>
      {(userId) => <FormulaireFiscalTAInner userId={userId} lang={lang} initialFid={fid} />}
    </RequireAuth>
  );
}

/* ===========================
   INNER
=========================== */

function FormulaireFiscalTAInner({
  userId,
  lang,
  initialFid,
}: {
  userId: string;
  lang: Lang;
  initialFid: string | null;
}) {
  const router = useRouter();
  const formTitle = "Travailleur autonome (T1)";

  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // dossier courant
  const [formulaireId, setFormulaireId] = useState<string | null>(initialFid);
  const [currentFid, setCurrentFid] = useState<string | null>(initialFid);
  const fidDisplay = currentFid || formulaireId;

  // évite autosave pendant le preload
  const hydrating = useRef(false);

  // debounce autosave
  const saveTimer = useRef<number | null>(null);

  // docs
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const docsCount = docs.length;

  /* ===========================
     States - Client
  =========================== */
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

  /* ===========================
     Conjoint
  =========================== */
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

  /* ===========================
     Assurance meds
  =========================== */
  const [assuranceMedsClient, setAssuranceMedsClient] = useState<AssuranceMeds>("");
  const [assuranceMedsClientPeriodes, setAssuranceMedsClientPeriodes] = useState<Periode[]>([
    { debut: "", fin: "" },
  ]);

  const [assuranceMedsConjoint, setAssuranceMedsConjoint] = useState<AssuranceMeds>("");
  const [assuranceMedsConjointPeriodes, setAssuranceMedsConjointPeriodes] = useState<Periode[]>([
    { debut: "", fin: "" },
  ]);

  /* ===========================
     Enfants
  =========================== */
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

  /* ===========================
     Questions
  =========================== */
  const [habiteSeulTouteAnnee, setHabiteSeulTouteAnnee] = useState<YesNo>("");
  const [nbPersonnesMaison3112, setNbPersonnesMaison3112] = useState("");
  const [biensEtranger100k, setBiensEtranger100k] = useState<YesNo>("");
  const [citoyenCanadien, setCitoyenCanadien] = useState<YesNo>("");
  const [nonResident, setNonResident] = useState<YesNo>("");
  const [maisonAcheteeOuVendue, setMaisonAcheteeOuVendue] = useState<YesNo>("");
  const [appelerTechnicien, setAppelerTechnicien] = useState<YesNo>("");
  const [copieImpots, setCopieImpots] = useState<CopieImpots>("");
  const [anneeImposition, setAnneeImposition] = useState<string>("");

  /* ===========================
     Docs helpers
  =========================== */
  const loadDocs = useCallback(
    async (fid: string) => {
      setDocsLoading(true);

      const { data, error } = await supabase
        .from(DOCS_TABLE)
        .select("id, formulaire_id, user_id, original_name, storage_path, mime_type, size_bytes, created_at")
        .eq("formulaire_id", fid)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setDocsLoading(false);

      if (error) {
        setMsg(`Erreur docs: ${error.message}`);
        return;
      }
      setDocs((data as DocRow[]) || []);
    },
    [userId]
  );

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

  /* ===========================
     Build data (memo)
  =========================== */
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
            conjoint: aUnConjoint
              ? { regime: assuranceMedsConjoint, periodes: assuranceMedsConjointPeriodes }
              : null,
          }
        : null;

    return {
      dossierType: "autonome",
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
    };
  }, [
    aUnConjoint,
    adresse,
    adresseConjointeIdentique,
    adresseConjoint,
    ancienEtatCivil,
    anneeImposition,
    app,
    appConjoint,
    appelerTechnicien,
    assuranceMedsClient,
    assuranceMedsClientPeriodes,
    assuranceMedsConjoint,
    assuranceMedsConjointPeriodes,
    biensEtranger100k,
    citoyenCanadien,
    codePostal,
    codePostalConjoint,
    courriel,
    courrielConjoint,
    dateChangementEtatCivil,
    dob,
    dobConjoint,
    enfants,
    etatCivil,
    etatCivilChange,
    habiteSeulTouteAnnee,
    maisonAcheteeOuVendue,
    nas,
    nasConjoint,
    nbPersonnesMaison3112,
    nom,
    nomConjoint,
    nonResident,
    prenom,
    prenomConjoint,
    province,
    provinceConjoint,
    revenuNetConjoint,
    tel,
    telCell,
    telCellConjoint,
    telConjoint,
    traiterConjoint,
    ville,
    villeConjoint,
    copieImpots,
  ]);

  /* ===========================
     Save draft (insert/update)
  =========================== */
  const saveDraft = useCallback(async (): Promise<string | null> => {
    if (hydrating.current) return fidDisplay ?? null;
    if (submitting) return fidDisplay ?? null;

    const targetId = fidDisplay ?? null;

    // UPDATE (si on a déjà un fid)
    if (targetId) {
      const { error } = await supabase
        .from(FORMS_TABLE)
        .update({
          lang,
          annee: anneeImposition.trim() || null,
          data: draftData,
        })
        .eq("id", targetId)
        .eq("user_id", userId);

      if (error) throw new Error(supaErr(error));

      // garder les states cohérents
      setFormulaireId(targetId);
      setCurrentFid(targetId);
      return targetId;
    }

    // INSERT (nouveau dossier)
    const { data: dataInsert, error: errorInsert } = await supabase
      .from(FORMS_TABLE)
      .insert({
        user_id: userId,
        form_type: FORM_TYPE_TA,
        lang,
        status: "draft",
        annee: anneeImposition.trim() || null,
        data: draftData,
      })
      .select("id")
      .single<InsertIdRow>();

    if (errorInsert) throw new Error(supaErr(errorInsert));

    const fid = dataInsert?.id ?? null;
    if (fid) {
      setFormulaireId(fid);
      setCurrentFid(fid);
    }
    return fid;
  }, [anneeImposition, draftData, fidDisplay, lang, submitting, userId]);

  /* ===========================
     Load form (preload)
     - si fid dans l'URL : charge CE dossier
     - sinon : charge le dernier dossier TA
  =========================== */
  const loadFormById = useCallback(
    async (fid: string) => {
      const { data: row, error } = await supabase
        .from(FORMS_TABLE)
        .select("id, data, created_at")
        .eq("id", fid)
        .eq("user_id", userId)
        .eq("form_type", FORM_TYPE_TA)
        .maybeSingle<FormRow>();

      if (error) throw new Error(error.message);
      if (!row) return null;
      return row;
    },
    [userId]
  );

  const loadLastForm = useCallback(async () => {
    hydrating.current = true;

    try {
      setMsg(null);

      let row: FormRow | null = null;

      // 1) priorité au fid de l'URL (initialFid)
      if (initialFid) {
        try {
          row = await loadFormById(initialFid);
        } catch (e) {
          // si fid invalide, on retombe sur "dernier"
          row = null;
        }
      }

      // 2) sinon: dernier dossier TA
      if (!row) {
        const { data: last, error } = await supabase
          .from(FORMS_TABLE)
          .select("id, data, created_at")
          .eq("user_id", userId)
          .eq("form_type", FORM_TYPE_TA)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<FormRow>();

        if (error) {
          setMsg(`Erreur chargement: ${error.message}`);
          return;
        }
        row = last ?? null;
      }

      if (!row) return;

      const fid = row.id;
      setFormulaireId(fid);
      setCurrentFid(fid);

      const form = row.data ?? {};

      const client = form.client ?? {};
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
      setProvince((client.province as ProvinceCode) ?? "QC");
      setCodePostal(client.codePostal ? formatPostalInput(client.codePostal) : "");
      setCourriel(client.courriel ?? "");

      const cj = form.conjoint ?? null;
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
        setProvinceConjoint((cj.provinceConjoint as ProvinceCode) ?? "QC");
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

      const meds = form.assuranceMedicamenteuse ?? null;
      if (meds?.client) {
        setAssuranceMedsClient((meds.client.regime as AssuranceMeds) ?? "");
        setAssuranceMedsClientPeriodes(meds.client.periodes ?? [{ debut: "", fin: "" }]);
      } else {
        setAssuranceMedsClient("");
        setAssuranceMedsClientPeriodes([{ debut: "", fin: "" }]);
      }

      if (meds?.conjoint) {
        setAssuranceMedsConjoint((meds.conjoint.regime as AssuranceMeds) ?? "");
        setAssuranceMedsConjointPeriodes(meds.conjoint.periodes ?? [{ debut: "", fin: "" }]);
      } else {
        setAssuranceMedsConjoint("");
        setAssuranceMedsConjointPeriodes([{ debut: "", fin: "" }]);
      }

      setEnfants(form.personnesACharge ?? []);

      const questions = form.questionsGenerales ?? {};
      setHabiteSeulTouteAnnee((questions.habiteSeulTouteAnnee as YesNo) ?? "");
      setNbPersonnesMaison3112(questions.nbPersonnesMaison3112 ?? "");
      setBiensEtranger100k((questions.biensEtranger100k as YesNo) ?? "");
      setCitoyenCanadien((questions.citoyenCanadien as YesNo) ?? "");
      setNonResident((questions.nonResident as YesNo) ?? "");
      setMaisonAcheteeOuVendue((questions.maisonAcheteeOuVendue as YesNo) ?? "");
      setAppelerTechnicien((questions.appelerTechnicien as YesNo) ?? "");
      setCopieImpots((questions.copieImpots as CopieImpots) ?? "");
      setAnneeImposition(questions.anneeImposition ?? "");

      await loadDocs(fid);
    } finally {
      hydrating.current = false;
    }
  }, [initialFid, loadDocs, loadFormById, userId]);

  useEffect(() => {
    void loadLastForm();
  }, [loadLastForm]);

  /* ===========================
     Autosave debounce
  =========================== */
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

  /* ===========================
     Actions
  =========================== */
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace(`/espace-client?lang=${encodeURIComponent(lang)}`);
  }, [router, lang]);

  // ✅ Étape 1 → Étape 2 (revenus & dépenses)
  const goToDepotDocuments = useCallback(async () => {
    try {
      setMsg("⏳ Préparation du dossier…");

      const fidFromSave = await saveDraft();
      const fid = fidFromSave || fidDisplay;

      if (!fid) throw new Error("Impossible de créer le dossier (fid manquant).");

      setCurrentFid(fid);
      await loadDocs(fid);

      setMsg(null);

      router.push(`/formulaire-fiscal-ta/revenus-depenses?fid=${encodeURIComponent(fid)}&lang=${encodeURIComponent(lang)}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erreur redirection.";
      setMsg("❌ " + message);
    }
  }, [fidDisplay, lang, loadDocs, router, saveDraft]);

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
              <span>Formulaire fiscal — Travailleur autonome</span>
            </div>
          </div>

          <button className="ff-btn ff-btn-outline" type="button" onClick={logout}>
            Se déconnecter
          </button>
        </header>

        <div className="ff-title">
          <h1>Formulaire – {formTitle}</h1>
          <p>
            Merci de remplir ce formulaire après avoir créé votre compte. Nous utilisons ces informations pour préparer vos
            déclarations d’impôt.
          </p>
        </div>

        {msg && (
          <div className="ff-card" style={{ padding: 14 }}>
            {msg}
          </div>
        )}

        <Steps step={1} lang={lang} flow="ta" />

        {/* Étape 1 = FORM ONLY */}
        <div className="ff-form">
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
                <Field label="Ancien état civil" value={ancienEtatCivil} onChange={setAncienEtatCivil} placeholder="ex.: Célibataire" />
                <Field
                  label="Date du changement (JJ/MM/AAAA)"
                  value={dateChangementEtatCivil}
                  onChange={setDateChangementEtatCivil}
                  placeholder="15/07/2024"
                  inputMode="numeric"
                  formatter={formatDateInput}
                  maxLength={10}
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
                <SelectField<ProvinceCode> label="Province" value={province} onChange={setProvince} options={PROVINCES} required />
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
                  />

                  <Field
                    label="Date de naissance (JJ/MM/AAAA)"
                    value={dobConjoint}
                    onChange={setDobConjoint}
                    placeholder="01/01/1990"
                    inputMode="numeric"
                    formatter={formatDateInput}
                    maxLength={10}
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
                  <Field label="Courriel (conjoint)" value={courrielConjoint} onChange={setCourrielConjoint} type="email" />
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
                    <Field label="Adresse (rue) - conjoint" value={adresseConjoint} onChange={setAdresseConjoint} />

                    <div className="ff-grid4 ff-mt-sm">
                      <Field label="App." value={appConjoint} onChange={setAppConjoint} />
                      <Field label="Ville" value={villeConjoint} onChange={setVilleConjoint} />
                      <SelectField<ProvinceCode> label="Province" value={provinceConjoint} onChange={setProvinceConjoint} options={PROVINCES} />
                      <Field
                        label="Code postal"
                        value={codePostalConjoint}
                        onChange={setCodePostalConjoint}
                        placeholder="G1V 0A6"
                        formatter={formatPostalInput}
                        maxLength={7}
                        autoComplete="postal-code"
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
                        setAssuranceMedsClientPeriodes((prev) => updatePeriode(prev, idx, { debut: formatDateInput(val) }))
                      }
                      placeholder="01/01/2024"
                      inputMode="numeric"
                      maxLength={10}
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
                            setAssuranceMedsConjointPeriodes((prev) => updatePeriode(prev, idx, { debut: formatDateInput(val) }))
                          }
                          placeholder="01/01/2024"
                          inputMode="numeric"
                          maxLength={10}
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
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Personnes à charge</h2>
              <p>Ajoutez vos enfants / personnes à charge (si applicable).</p>
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
                      <Field label="Prénom" value={enf.prenom} onChange={(v) => updateEnfant(i, "prenom", v)} />
                      <Field label="Nom" value={enf.nom} onChange={(v) => updateEnfant(i, "nom", v)} />

                      <Field
                        label="Date de naissance (JJ/MM/AAAA)"
                        value={enf.dob}
                        onChange={(v) => updateEnfant(i, "dob", formatDateInput(v))}
                        placeholder="01/01/2020"
                        inputMode="numeric"
                        maxLength={10}
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
                onChange={setNbPersonnesMaison3112}
                placeholder="ex.: 1"
                inputMode="numeric"
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

          {/* ACTION — CONTINUER (étape 1) */}
          <div className="ff-submit">
            <button type="button" className="ff-btn ff-btn-primary ff-btn-big" onClick={goToDepotDocuments}>
              {lang === "fr" ? "Continuer →" : lang === "en" ? "Continue →" : "Continuar →"}
            </button>

            <div className="ff-muted" style={{ marginTop: 10 }}>
              {docsLoading ? "Chargement des documents…" : docsCount > 0 ? `${docsCount} document(s) déjà au dossier.` : ""}
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
        </div>
      </div>
    </main>
  );
}
