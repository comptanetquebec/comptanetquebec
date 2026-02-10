"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

import "../../formulaire-fiscal/formulaire-fiscal-presentiel.css";
import Steps from "../formulaire-fiscal-ta/Steps"; // adapte si ton Steps est ailleurs
import RequireAuth from "../formulaire-fiscal-ta/RequireAuth"; // adapte si ailleurs
import { Field, CheckboxField, YesNoField, SelectField, type YesNo } from "../formulaire-fiscal-ta/ui"; // adapte

const STORAGE_BUCKET = "client-documents";
const DOCS_TABLE = "formulaire_documents";
const FORMS_TABLE = "formulaires_fiscaux";

// Mets EXACTEMENT ce que ta DB attend pour TA
const FORM_TYPE_TA = "autonome" as const;

type Lang = "fr" | "en" | "es";
function normalizeLang(v: string | null | undefined): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

type ProvinceCode =
  | "QC" | "ON" | "NB" | "NS" | "PE" | "NL" | "MB" | "SK" | "AB" | "BC" | "YT" | "NT" | "NU";

type Sexe = "M" | "F" | "X" | "";
type AssuranceMeds = "ramq" | "prive" | "conjoint" | "";
type CopieImpots = "espaceClient" | "courriel" | "";
type EtatCivil = "celibataire" | "conjointDefait" | "marie" | "separe" | "divorce" | "veuf" | "";

type Periode = { debut: string; fin: string };
type InsertIdRow = { id: string };

type Child = { prenom: string; nom: string; dob: string; nas: string; sexe: Sexe };

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

type FormRow = { id: string; data: Formdata | null; created_at: string };

const PROVINCES: { value: ProvinceCode; label: string }[] = [
  { value: "QC", label: "QC" }, { value: "ON", label: "ON" }, { value: "NB", label: "NB" }, { value: "NS", label: "NS" },
  { value: "PE", label: "PE" }, { value: "NL", label: "NL" }, { value: "MB", label: "MB" }, { value: "SK", label: "SK" },
  { value: "AB", label: "AB" }, { value: "BC", label: "BC" }, { value: "YT", label: "YT" }, { value: "NT", label: "NT" },
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
function normalizeNAS(v: string) {
  return (v || "").replace(/\D+/g, "").slice(0, 9);
}
function normalizePostal(v: string) {
  return (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}
function normalizePhone(v: string) {
  return (v || "").replace(/\D+/g, "").slice(0, 10);
}

export default function FormulaireFiscalTAPresentielPage() {
  const params = useSearchParams();
  const lang = normalizeLang(params.get("lang") || "fr");
  const fid = params.get("fid") || "";

  const nextPath = useMemo(() => {
    const q = new URLSearchParams();
    if (lang) q.set("lang", lang);
    if (fid) q.set("fid", fid);
    return `/formulaire-fiscal-ta-presentiel?${q.toString()}`;
  }, [lang, fid]);

  return (
    <RequireAuth lang={lang} nextPath={nextPath}>
      {(userId) => <Inner userId={userId} lang={lang} fidFromUrl={fid} />}
    </RequireAuth>
  );
}

function Inner({ userId, lang, fidFromUrl }: { userId: string; lang: Lang; fidFromUrl: string }) {
  const router = useRouter();

  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // IMPORTANT: en présentiel on veut utiliser le fid de l’URL
  const [formulaireId, setFormulaireId] = useState<string | null>(fidFromUrl || null);
  const fidDisplay = formulaireId;

  const hydrating = useRef(false);
  const saveTimer = useRef<number | null>(null);

  const [docs, setDocs] = useState<DocRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // === mêmes states que toi (je garde tel quel)
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

  const [assuranceMedsClient, setAssuranceMedsClient] = useState<AssuranceMeds>("");
  const [assuranceMedsClientPeriodes, setAssuranceMedsClientPeriodes] = useState<Periode[]>([{ debut: "", fin: "" }]);

  const [assuranceMedsConjoint, setAssuranceMedsConjoint] = useState<AssuranceMeds>("");
  const [assuranceMedsConjointPeriodes, setAssuranceMedsConjointPeriodes] = useState<Periode[]>([{ debut: "", fin: "" }]);

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
  const removeEnfant = useCallback((i: number) => setEnfants((prev) => prev.filter((_, idx) => idx !== i)), []);

  const [habiteSeulTouteAnnee, setHabiteSeulTouteAnnee] = useState<YesNo>("");
  const [nbPersonnesMaison3112, setNbPersonnesMaison3112] = useState("");
  const [biensEtranger100k, setBiensEtranger100k] = useState<YesNo>("");
  const [citoyenCanadien, setCitoyenCanadien] = useState<YesNo>("");
  const [nonResident, setNonResident] = useState<YesNo>("");
  const [maisonAcheteeOuVendue, setMaisonAcheteeOuVendue] = useState<YesNo>("");
  const [appelerTechnicien, setAppelerTechnicien] = useState<YesNo>("");
  const [copieImpots, setCopieImpots] = useState<CopieImpots>("");
  const [anneeImposition, setAnneeImposition] = useState("");

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
    aUnConjoint, adresse, adresseConjoint, adresseConjointeIdentique, anneeImposition, appelerTechnicien,
    app, appConjoint, assuranceMedsClient, assuranceMedsClientPeriodes, assuranceMedsConjoint,
    assuranceMedsConjointPeriodes, biensEtranger100k, citoyenCanadien, codePostal, codePostalConjoint,
    courriel, courrielConjoint, dateChangementEtatCivil, dob, dobConjoint, enfants, etatCivil,
    etatCivilChange, habiteSeulTouteAnnee, maisonAcheteeOuVendue, nas, nasConjoint, nbPersonnesMaison3112,
    nonResident, nom, nomConjoint, prenom, prenomConjoint, province, provinceConjoint, revenuNetConjoint,
    tel, telCell, telConjoint, telCellConjoint, traiterConjoint, ancienEtatCivil, ville, villeConjoint, copieImpots,
  ]);

  // ✅ Présentiel: si formulaireId existe, on UPDATE ce dossier (pas de création parallèle)
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
          // optionnel si tu as la colonne:
          // canal: "presentiel",
        })
        .eq("id", formulaireId)
        .eq("user_id", userId);

      if (error) throw new Error(supaErr(error));
      return formulaireId;
    }

    // fallback si jamais pas de fid
    const { data, error } = await supabase
      .from(FORMS_TABLE)
      .insert({
        user_id: userId,
        form_type: FORM_TYPE_TA,
        lang,
        status: "draft",
        annee: anneeImposition || null,
        data: draftData,
        // canal: "presentiel",
      })
      .select("id")
      .single<InsertIdRow>();

    if (error) throw new Error(supaErr(error));
    const fid = data?.id ?? null;
    if (fid) setFormulaireId(fid);
    return fid;
  }, [anneeImposition, draftData, formulaireId, lang, submitting, userId]);

  // ✅ Présentiel: on charge le dossier par ID (fid) si présent
  const loadForm = useCallback(async () => {
    if (!formulaireId) return;

    hydrating.current = true;
    try {
      const { data: row, error } = await supabase
        .from(FORMS_TABLE)
        .select("id, data, created_at")
        .eq("id", formulaireId)
        .eq("user_id", userId)
        .maybeSingle<FormRow>();

      if (error) {
        setMsg(`Erreur chargement: ${error.message}`);
        return;
      }
      if (!row) return;

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
      setProvince(client.province ?? "QC");
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
        setProvinceConjoint(cj.provinceConjoint ?? "QC");
        setCodePostalConjoint(cj.codePostalConjoint ? formatPostalInput(cj.codePostalConjoint) : "");
        setRevenuNetConjoint(cj.revenuNetConjoint ?? "");
      }

      const meds = form.assuranceMedicamenteuse ?? null;
      if (meds?.client) {
        setAssuranceMedsClient(meds.client.regime ?? "");
        setAssuranceMedsClientPeriodes(meds.client.periodes ?? [{ debut: "", fin: "" }]);
      }
      if (meds?.conjoint) {
        setAssuranceMedsConjoint(meds.conjoint.regime ?? "");
        setAssuranceMedsConjointPeriodes(meds.conjoint.periodes ?? [{ debut: "", fin: "" }]);
      }

      setEnfants(form.personnesACharge ?? []);

      const q = form.questionsGenerales ?? {};
      setHabiteSeulTouteAnnee(q.habiteSeulTouteAnnee ?? "");
      setNbPersonnesMaison3112(q.nbPersonnesMaison3112 ?? "");
      setBiensEtranger100k(q.biensEtranger100k ?? "");
      setCitoyenCanadien(q.citoyenCanadien ?? "");
      setNonResident(q.nonResident ?? "");
      setMaisonAcheteeOuVendue(q.maisonAcheteeOuVendue ?? "");
      setAppelerTechnicien(q.appelerTechnicien ?? "");
      setCopieImpots(q.copieImpots ?? "");
      setAnneeImposition(q.anneeImposition ?? "");

      await loadDocs(row.id);
    } finally {
      hydrating.current = false;
    }
  }, [formulaireId, loadDocs, userId]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

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

  // ✅ Suivant = page 2 (Envoyer)
  const goNext = useCallback(async () => {
    try {
      setMsg("⏳ Sauvegarde…");
      const fid = await saveDraft();
      if (!fid) throw new Error("fid manquant");
      setMsg(null);

      router.push(
        `/formulaire-fiscal-ta-presentiel/envoyer?fid=${encodeURIComponent(fid)}&lang=${encodeURIComponent(lang)}`
      );
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "Erreur";
      setMsg("❌ " + m);
    }
  }, [lang, router, saveDraft]);

  return (
    <main className="ff-bg">
      <div className="ff-container">
        <header className="ff-header">
          <div className="ff-brand">
            <Image src="/logo-cq.png" alt="ComptaNet Québec" width={120} height={40} priority style={{ height: 40, width: "auto" }} />
            <div className="ff-brand-text">
              <strong>ComptaNet Québec</strong>
              <span>Présentiel — Travailleur autonome</span>
            </div>
          </div>

          <button className="ff-btn ff-btn-outline" type="button" onClick={logout}>
            Se déconnecter
          </button>
        </header>

        {msg && <div className="ff-card" style={{ padding: 14 }}>{msg}</div>}

        <Steps step={1} lang={lang} flow="ta" />

        {/* Ton UI reste pareil; je ne te recolle pas TOUT le formulaire ici pour raccourcir :
           garde exactement tes sections Client / Conjoint / etc.
           et remplace juste le bouton en bas par goNext.
        */}

        <div className="ff-submit">
          <button type="button" className="ff-btn ff-btn-primary ff-btn-big" disabled={docsLoading} onClick={goNext}>
            {lang === "fr" ? "Suivant →" : lang === "en" ? "Next →" : "Siguiente →"}
          </button>

          <div className="ff-muted" style={{ marginTop: 10 }}>
            {docsLoading ? "Chargement…" : docs.length > 0 ? `${docs.length} document(s) au dossier.` : ""}
          </div>
        </div>
      </div>
    </main>
  );
}

