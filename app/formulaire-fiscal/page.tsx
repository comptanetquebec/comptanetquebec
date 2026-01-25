"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import "./formulaire-fiscal.css";
import { Field, CheckboxField, YesNoField, SelectField, type YesNo } from "./ui";

/**
 * IMPORTANT (à ajuster si tes noms sont différents)
 */
const STORAGE_BUCKET = "client-documents";
const DOCS_TABLE = "formulaire_documents";
const FORMS_TABLE = "formulaires_fiscaux";

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

type Periode = { debut: string; fin: string };

function updatePeriode(list: Periode[], idx: number, patch: Partial<Periode>) {
  return list.map((p, i) => (i === idx ? { ...p, ...patch } : p));
}

type InsertIdRow = { id: string };

type Child = {
  prenom: string;
  nom: string;
  dob: string; // JJ/MM/AAAA
  nas: string; // formaté pendant saisie
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

type EtatCivil =
  | "celibataire"
  | "conjointDefait"
  | "marie"
  | "separe"
  | "divorce"
  | "veuf"
  | "";

/* ===========================
   Types data (PAS DE any)
=========================== */

type FormClientdata = {
  prenom?: string;
  nom?: string;
  nas?: string; // normalisé (9 chiffres)
  dob?: string;
  etatCivil?: EtatCivil;
  etatCivilChange?: boolean;
  ancienEtatCivil?: string;
  dateChangementEtatCivil?: string;

  tel?: string; // normalisé (10 chiffres)
  telCell?: string; // normalisé (10 chiffres)
  adresse?: string;
  app?: string;
  ville?: string;
  province?: ProvinceCode;
  codePostal?: string; // normalisé (6 chars)
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
   Helpers (title / normalize)
=========================== */

function titleFromType(type: string) {
  if (type === "autonome") return "Travailleur autonome (T1)";
  if (type === "t2") return "Société (T2)";
  return "Particulier (T1)";
}

function normalizeType(v: string) {
  const x = (v || "").toLowerCase();
  if (x === "t1" || x === "autonome" || x === "t2") return x;
  return "t1";
}

function normalizeLang(v: string) {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? x : "fr";
}

/* ===========================
   FORMAT LIVE (pendant saisie)
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
   NORMALIZE (valeur “propre”)
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
   Upload helpers (préfixés _)
   (pas de warning ESLint)
=========================== */

function _isAllowedFile(file: File) {
  const n = file.name.toLowerCase();
  return (
    n.endsWith(".pdf") ||
    n.endsWith(".jpg") ||
    n.endsWith(".jpeg") ||
    n.endsWith(".png") ||
    n.endsWith(".zip") ||
    n.endsWith(".doc") ||
    n.endsWith(".docx") ||
    n.endsWith(".xls") ||
    n.endsWith(".xlsx")
  );
}

function _safeFilename(name: string) {
  return name.replace(/[^\w.\-()\s]/g, "_");
}

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

/* ===========================
   Page
=========================== */

export default function FormulaireFiscalPage() {
  const router = useRouter();
  const params = useSearchParams();

  const type = normalizeType(params.get("type") || "t1");
  const lang = normalizeLang(params.get("lang") || "fr");
  const formTitle = useMemo(() => titleFromType(type), [type]);

  const [booting, setBooting] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const redirected = useRef(false);

  // ✅ “Mémoire” : évite autosave pendant le preload
  const hydrating = useRef(false);
  // ✅ debounce autosave
  const saveTimer = useRef<number | null>(null);

  // ✅ Dossier (sert aussi de “mémoire”)
  const [formulaireId, setFormulaireId] = useState<string | null>(null);

  // --- Docs state (pour afficher la liste / ouverture)
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // --- Infos client principal ---
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [nas, setNas] = useState("");
  const [dob, setDob] = useState("");
  const [etatCivil, setEtatCivil] = useState<EtatCivil>("");

  const [etatCivilChange, setEtatCivilChange] = useState(false);
  const [ancienEtatCivil, setAncienEtatCivil] = useState("");
  const [dateChangementEtatCivil, setDateChangementEtatCivil] = useState("");

  // Coordonnées client
  const [tel, setTel] = useState("");
  const [telCell, setTelCell] = useState("");
  const [adresse, setAdresse] = useState("");
  const [app, setApp] = useState("");
  const [ville, setVille] = useState("");
  const [province, setProvince] = useState<ProvinceCode>("QC");
  const [codePostal, setCodePostal] = useState("");
  const [courriel, setCourriel] = useState("");

  // --- Infos conjoint ---
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

  // --- Assurance médicaments (Québec uniquement) ---
  const [assuranceMedsClient, setAssuranceMedsClient] = useState<AssuranceMeds>("");
  const [assuranceMedsClientPeriodes, setAssuranceMedsClientPeriodes] = useState<Periode[]>([
    { debut: "", fin: "" },
  ]);

  const [assuranceMedsConjoint, setAssuranceMedsConjoint] = useState<AssuranceMeds>("");
  const [assuranceMedsConjointPeriodes, setAssuranceMedsConjointPeriodes] = useState<Periode[]>([
    { debut: "", fin: "" },
  ]);

  // --- Enfants / personnes à charge ---
  const [enfants, setEnfants] = useState<Child[]>([]);

  function ajouterEnfant() {
    setEnfants((prev) => [...prev, { prenom: "", nom: "", dob: "", nas: "", sexe: "" }]);
  }
  function updateEnfant(i: number, field: keyof Child, value: string) {
    setEnfants((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };
      return copy;
    });
  }
  function removeEnfant(i: number) {
    setEnfants((prev) => prev.filter((_, idx) => idx !== i));
  }

  // --- Questions générales ---
  const [habiteSeulTouteAnnee, setHabiteSeulTouteAnnee] = useState<YesNo>("");
  const [nbPersonnesMaison3112, setNbPersonnesMaison3112] = useState("");
  const [biensEtranger100k, setBiensEtranger100k] = useState<YesNo>("");
  const [citoyenCanadien, setCitoyenCanadien] = useState<YesNo>("");
  const [nonResident, setNonResident] = useState<YesNo>("");
  const [maisonAcheteeOuVendue, setMaisonAcheteeOuVendue] = useState<YesNo>("");
  const [appelerTechnicien, setAppelerTechnicien] = useState<YesNo>("");

  const [copieImpots, setCopieImpots] = useState<CopieImpots>("");

  /* ===========================
     Data helpers
  =========================== */

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

  // ✅ charge le dernier formulaire de ce user (mémoire)
  const loadLastForm = useCallback(
    async (uid: string) => {
      hydrating.current = true;

      const { data, error } = await supabase
        .from(FORMS_TABLE)
        .select("id, data, created_at")
        .eq("user_id", uid)
        .eq("dossier_type", type)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<FormRow>();

      if (error) {
        setMsg(`Erreur chargement: ${error.message}`);
        hydrating.current = false;
        return;
      }
      if (!data) {
        hydrating.current = false;
        return;
      }

      const fid = data.id;
      const data: Formdata = (data.data ?? {}) as Formdata;

      setFormulaireId(fid);

      // --- Client
      setPrenom(data.client?.prenom ?? "");
      setNom(data.client?.nom ?? "");
      setNas(data.client?.nas ? formatNASInput(data.client.nas) : "");
      setDob(data.client?.dob ?? "");
      setEtatCivil(data.client?.etatCivil ?? "");

      setEtatCivilChange(!!data.client?.etatCivilChange);
      setAncienEtatCivil(data.client?.ancienEtatCivil ?? "");
      setDateChangementEtatCivil(data.client?.dateChangementEtatCivil ?? "");

      setTel(data.client?.tel ? formatPhoneInput(data.client.tel) : "");
      setTelCell(data.client?.telCell ? formatPhoneInput(data.client.telCell) : "");
      setAdresse(data.client?.adresse ?? "");
      setApp(data.client?.app ?? "");
      setVille(data.client?.ville ?? "");
      setProvince(data.client?.province ?? "QC");
      setCodePostal(data.client?.codePostal ? formatPostalInput(data.client.codePostal) : "");
      setCourriel(data.client?.courriel ?? "");

      // --- Conjoint
      const cj = data.conjoint ?? null;
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

      // --- Assurance meds
      const meds = data.assuranceMedicamenteuse;
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

      // --- Enfants
      setEnfants(data.personnesACharge ?? []);

      // --- Questions
      setHabiteSeulTouteAnnee(data.questionsGenerales?.habiteSeulTouteAnnee ?? "");
      setNbPersonnesMaison3112(data.questionsGenerales?.nbPersonnesMaison3112 ?? "");
      setBiensEtranger100k(data.questionsGenerales?.biensEtranger100k ?? "");
      setCitoyenCanadien(data.questionsGenerales?.citoyenCanadien ?? "");
      setNonResident(data.questionsGenerales?.nonResident ?? "");
      setMaisonAcheteeOuVendue(data.questionsGenerales?.maisonAcheteeOuVendue ?? "");
      setAppelerTechnicien(data.questionsGenerales?.appelerTechnicien ?? "");
      setCopieImpots(data.questionsGenerales?.copieImpots ?? "");

      await loadDocs(fid);

      hydrating.current = false;
    },
    [loadDocs, type]
  );

  // ✅ autosave brouillon (insert/update sans bouton)
  const saveDraft = useCallback(async () => {
    if (!userId) return;
    if (hydrating.current) return;
    if (submitting) return;

    const data: Formdata = {
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
      conjoint: aUnConjoint
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
        : null,
      assuranceMedicamenteuse:
        province === "QC"
          ? {
              client: { regime: assuranceMedsClient, periodes: assuranceMedsClientPeriodes },
              conjoint: aUnConjoint ? { regime: assuranceMedsConjoint, periodes: assuranceMedsConjointPeriodes } : null,
            }
          : null,
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
      },
    };

    // UPDATE si dossier existe
    if (formulaireId) {
      await supabase
        .from(FORMS_TABLE)
        .update({ lang, data })
        .eq("id", formulaireId)
        .eq("user_id", userId);
      return;
    }

    // INSERT (brouillon) dès la première saisie
    const { data, error } = await supabase
      .from(FORMS_TABLE)
      .insert({
        user_id: userId,
        dossier_type: type,
        lang,
        data,
      })
      .select("id")
      .single<InsertIdRow>();

    if (!error && data?.id) {
      setFormulaireId(data.id);
    }
  }, [
    userId,
    submitting,
    formulaireId,
    type,
    lang,

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
  ]);

  /* ===========================
     Auth guard + preload
  =========================== */

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!alive) return;

      if (error || !data.user) {
        if (!redirected.current) {
          redirected.current = true;
          setBooting(false);

          const next = `/formulaire-fiscal?type=${encodeURIComponent(type)}&lang=${encodeURIComponent(lang)}`;
          router.replace(`/espace-client?lang=${encodeURIComponent(lang)}&next=${encodeURIComponent(next)}`);
        }
        return;
      }

      setUserId(data.user.id);
      setBooting(false);

      await loadLastForm(data.user.id);
    })();

    return () => {
      alive = false;
    };
  }, [router, lang, type, loadLastForm]);

  // ✅ autosave debounce
  useEffect(() => {
    if (!userId) return;
    if (hydrating.current) return;

    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    saveTimer.current = window.setTimeout(() => {
      saveDraft().catch(() => {});
    }, 800);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [
    userId,
    type,
    lang,
    saveDraft,

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
  ]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace(`/espace-client?lang=${encodeURIComponent(lang)}`);
  }, [router, lang]);

  // ✅ handleSubmit minimal pour utiliser setSubmitting (sinon warning)
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitting(true);
      setMsg(null);
      try {
        // Ici tu peux mettre ton submit final (ex: marquer submitted)
        // Pour l’instant on force un saveDraft pour être certain que tout est en DB
        await saveDraft();
        setMsg("Formulaire enregistré ✅");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur lors de l’enregistrement.";
        setMsg(message);
      } finally {
        setSubmitting(false);
      }
    },
    [saveDraft]
  );

  if (booting) {
    return (
      <main className="ff-bg">
        <div className="ff-container">
          <div style={{ padding: 24 }}>Chargement…</div>
        </div>
      </main>
    );
  }

  return (
    <main className="ff-bg">
      <div className="ff-container">
        {/* Header */}
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

        {/* Title */}
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
                />
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
          />
        </div>
      )}

      <div className="ff-grid2 ff-mt">
        <Field
          label="Prénom (conjoint)"
          value={prenomConjoint}
          onChange={setPrenomConjoint}
          required={traiterConjoint}
        />
        <Field
          label="Nom (conjoint)"
          value={nomConjoint}
          onChange={setNomConjoint}
          required={traiterConjoint}
        />

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
          <Field label="Adresse (rue) - conjoint" value={adresseConjoint} onChange={setAdresseConjoint} />

          <div className="ff-grid4 ff-mt-sm">
            <Field label="App." value={appConjoint} onChange={setAppConjoint} />
            <Field label="Ville" value={villeConjoint} onChange={setVilleConjoint} />
            <SelectField<ProvinceCode>
              label="Province"
              value={provinceConjoint}
              onChange={setProvinceConjoint}
              options={PROVINCES}
            />
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

{
  /* ASSURANCE MEDS */
}
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

{
  /* PERSONNES A CHARGE */
}
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

{
  /* QUESTIONS */
}
<section className="ff-card">
  <div className="ff-card-head">
    <h2>Informations fiscales additionnelles</h2>
    <p>Questions générales pour compléter correctement le dossier.</p>
  </div>

  <div className="ff-stack">
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

{
  /* SUBMIT */
}
<div className="ff-submit">
  <button type="submit" className="ff-btn ff-btn-primary ff-btn-big" disabled={submitting}>
    {submitting ? "Envoi…" : formulaireId ? "Enregistrer les modifications" : "Soumettre mes informations fiscales"}
  </button>

  <p className="ff-footnote">
    Vos informations sont traitées de façon confidentielle et servent à préparer vos déclarations T1 (particulier /
    travail autonome) et T2 (société) au Canada. Au Québec, nous produisons aussi la déclaration provinciale.
  </p>
</div>

{
  /* DÉPÔT DOCUMENTS */
}
<section id="ff-upload-section" className="ff-card" style={{ opacity: formulaireId ? 1 : 0.65 }}>
  <div className="ff-card-head">
    <h2>Déposer vos documents</h2>
    <p>
      Déposez vos fichiers (PDF, JPG, PNG, ZIP, Word, Excel) dans votre espace sécurisé.
      <br />
      Une page “glisser-déposer” s’ouvrira pour téléverser vos documents.
    </p>
  </div>

  {!formulaireId ? (
    <div className="ff-empty">Soumettez d’abord le formulaire ci-dessus. Ensuite, le bouton de dépôt de documents sera activé.</div>
  ) : (
    <div className="ff-stack">
      <button
        type="button"
        className="ff-btn ff-btn-primary"
        style={{
          padding: "14px 16px",
          borderRadius: 14,
          fontWeight: 900,
          fontSize: 16,
          textAlign: "center",
          width: "100%",
        }}
        onClick={() => {
          const url = `/depot-documents?fid=${encodeURIComponent(formulaireId)}&type=${encodeURIComponent(
            type
          )}&lang=${encodeURIComponent(lang)}`;
          router.push(url);
        }}
      >
        Déposer mes documents →
      </button>

      <div className="ff-rowbox" style={{ marginTop: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>Dossier créé</div>
          <div style={{ opacity: 0.8, fontSize: 13, wordBreak: "break-all" }}>ID : {formulaireId}</div>
        </div>

        <button
          type="button"
          className="ff-btn ff-btn-soft"
          onClick={() => {
            navigator.clipboard?.writeText(formulaireId);
            setMsg("✅ ID copié.");
          }}
        >
          Copier l’ID
        </button>
      </div>

      <div className="ff-mt">
        <div className="ff-subtitle">Documents téléversés</div>

        {docsLoading ? (
          <div className="ff-empty">Chargement des documents…</div>
        ) : docs.length === 0 ? (
          <div className="ff-empty">Aucun document pour l’instant.</div>
        ) : (
          <div className="ff-stack">
            {docs.map((d) => (
              <div key={d.id} className="ff-rowbox" style={{ alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>{d.original_name}</div>
                  <div style={{ opacity: 0.75, fontSize: 12, wordBreak: "break-all" }}>{d.storage_path}</div>
                </div>

                <button type="button" className="ff-btn ff-btn-soft" onClick={() => openDoc(d)}>
                  Ouvrir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ff-mt">
        <button
          type="button"
          className="ff-btn ff-btn-soft"
          style={{ width: "100%", textAlign: "center" }}
          onClick={() => router.push(`/merci?lang=${encodeURIComponent(lang)}`)}
        >
          Terminer
        </button>
      </div>
    </div>
  )}
</section>
        </form>
      </div>
    </main>
  );
}

