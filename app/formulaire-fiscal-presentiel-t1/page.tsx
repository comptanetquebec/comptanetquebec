"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// ✅ LOCAL uniquement (tu voulais enlever shared)
import "../formulaire-fiscal-presentiel/formulaire-fiscal-presentiel.css";
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
const FORM_TYPE_T1 = "T1" as const;

type Lang = "fr" | "en" | "es";
function normalizeLang(v: string | null | undefined): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

/* ===========================
   Helpers (LOCAL)
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

type EtatCivil =
  | "celibataire"
  | "conjointDefait"
  | "marie"
  | "separe"
  | "divorce"
  | "veuf"
  | "";

type CopieImpots = "espaceClient" | "courriel" | "";
type AssuranceMeds = "ramq" | "prive" | "conjoint" | "";

type Periode = { debut: string; fin: string };

type Child = {
  prenom: string;
  nom: string;
  dob: string;
  nas: string;
  sexe?: "" | "F" | "M" | "X";
};

function asMsg(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Erreur";
  }
}

function digitsOnly(v: string, max: number) {
  return (v || "").replace(/\D+/g, "").slice(0, max);
}

function formatNASInput(v: string) {
  const d = digitsOnly(v, 9);
  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 9);
  if (d.length <= 3) return a;
  if (d.length <= 6) return `${a}-${b}`;
  return `${a}-${b}-${c}`;
}
function normalizeNAS(v: string) {
  return digitsOnly(v, 9);
}

function formatDateInput(v: string) {
  const d = digitsOnly(v, 8);
  const dd = d.slice(0, 2);
  const mm = d.slice(2, 4);
  const yyyy = d.slice(4, 8);
  if (d.length <= 2) return dd;
  if (d.length <= 4) return `${dd}/${mm}`;
  return `${dd}/${mm}/${yyyy}`;
}

function formatPostalInput(v: string) {
  const s = (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (s.length <= 3) return s;
  return `${s.slice(0, 3)} ${s.slice(3, 6)}`;
}
function normalizePostal(v: string) {
  return (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

function normalizePhone(v: string) {
  return digitsOnly(v, 10);
}
function formatPhoneInput(v: string) {
  const d = digitsOnly(v, 10);
  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 10);
  if (d.length <= 3) return a;
  if (d.length <= 6) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
}

function updatePeriode(list: Periode[], idx: number, patch: Partial<Periode>) {
  const copy = [...list];
  copy[idx] = { ...copy[idx], ...patch };
  return copy;
}

// Checkbox ultra basic (local)
function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="ff-check">
      <input
        className="ff-checkbox"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

/* ===========================
   Types DB + Formdata (LOCAL)
=========================== */

type FormConjointdata = {
  traiterConjoint: boolean;
  prenomConjoint: string;
  nomConjoint: string;
  nasConjoint: string;
  dobConjoint: string;
  revenuNetConjoint: string;
};

type FormMedsdata = {
  client: { regime: AssuranceMeds; periodes: Periode[] };
  conjoint: { regime: AssuranceMeds; periodes: Periode[] } | null;
};

type Formdata = {
  dossierType?: "t1";
  canal?: "presentiel";
  client?: {
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
    courriel?: string;

    adresse?: string;
    app?: string;
    ville?: string;
    province?: ProvinceCode;
    codePostal?: string;
  };

  conjoint?: FormConjointdata | null;
  assuranceMedicamenteuse?: FormMedsdata | null;
  personnesACharge?: Child[];

  questionsGenerales?: {
    anneeImposition?: string;
    habiteSeulTouteAnnee?: YesNo;
    nbPersonnesMaison3112?: string;
    biensEtranger100k?: YesNo;
    citoyenCanadien?: YesNo;
    nonResident?: YesNo;
    maisonAcheteeOuVendue?: YesNo;
    copieImpots?: CopieImpots;
  };
};

type InsertIdRow = { id: string };
type FormRow = {
  id: string;
  user_id: string;
  form_type: string;
  lang: Lang | null;
  annee: string | null;
  status?: string | null;
  data: Formdata | null;
  created_at?: string | null;
};

export default function FormulaireFiscalPresentielT1Page() {
  const params = useSearchParams();
  const router = useRouter();

  const lang = normalizeLang(params.get("lang") || "fr");
  const fidUrl = (params.get("fid") || "").trim();

  const [userId, setUserId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        setUserId(null);
        setMsg("❌ Non connecté (auth requise).");
        return;
      }
      setUserId(data.user.id);
    })();
  }, []);

  if (!userId) {
    return (
      <main className="ff-bg">
        <div className="ff-container">
          <div className="ff-card" style={{ padding: 14 }}>
            {msg || "Connexion requise."}
          </div>
        </div>
      </main>
    );
  }

  return <Inner userId={userId} lang={lang} fidUrl={fidUrl} router={router} />;
}

/* ===========================
   Inner
=========================== */

function Inner({
  userId,
  lang,
  fidUrl,
  router,
}: {
  userId: string;
  lang: Lang;
  fidUrl: string;
  router: ReturnType<typeof useRouter>;
}) {
  const params = useSearchParams();

  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [formulaireId, setFormulaireId] = useState<string | null>(fidUrl || null);

  const hydrating = useRef(false);
  const saveTimer = useRef<number | null>(null);

  // ====== Client
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
  const [courriel, setCourriel] = useState("");

  const [adresse, setAdresse] = useState("");
  const [app, setApp] = useState("");
  const [ville, setVille] = useState("");
  const [province, setProvince] = useState<ProvinceCode>("QC");
  const [codePostal, setCodePostal] = useState("");

  // ====== Conjoint
  const [aUnConjoint, setAUnConjoint] = useState(false);
  const [traiterConjoint, setTraiterConjoint] = useState(true);

  const [prenomConjoint, setPrenomConjoint] = useState("");
  const [nomConjoint, setNomConjoint] = useState("");
  const [nasConjoint, setNasConjoint] = useState("");
  const [dobConjoint, setDobConjoint] = useState("");
  const [revenuNetConjoint, setRevenuNetConjoint] = useState("");

  // ====== Assurance meds (QC)
  const [assuranceMedsClient, setAssuranceMedsClient] = useState<AssuranceMeds>("");
  const [assuranceMedsClientPeriodes, setAssuranceMedsClientPeriodes] = useState<Periode[]>([
    { debut: "", fin: "" },
  ]);

  const [assuranceMedsConjoint, setAssuranceMedsConjoint] = useState<AssuranceMeds>("");
  const [assuranceMedsConjointPeriodes, setAssuranceMedsConjointPeriodes] = useState<Periode[]>([
    { debut: "", fin: "" },
  ]);

  // ====== Enfants
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

  // ====== Questions
  const [anneeImposition, setAnneeImposition] = useState("");
  const [habiteSeulTouteAnnee, setHabiteSeulTouteAnnee] = useState<YesNo>("");
  const [nbPersonnesMaison3112, setNbPersonnesMaison3112] = useState("");
  const [biensEtranger100k, setBiensEtranger100k] = useState<YesNo>("");
  const [citoyenCanadien, setCitoyenCanadien] = useState<YesNo>("");
  const [nonResident, setNonResident] = useState<YesNo>("");
  const [maisonAcheteeOuVendue, setMaisonAcheteeOuVendue] = useState<YesNo>("");
  const [copieImpots, setCopieImpots] = useState<CopieImpots>("");

  const draftData: Formdata = useMemo(() => {
    const conjointData: FormConjointdata | null = aUnConjoint
      ? {
          traiterConjoint,
          prenomConjoint: prenomConjoint.trim(),
          nomConjoint: nomConjoint.trim(),
          nasConjoint: normalizeNAS(nasConjoint),
          dobConjoint: dobConjoint.trim(),
          revenuNetConjoint: traiterConjoint ? "" : revenuNetConjoint.trim(),
        }
      : null;

    const medsData: FormMedsdata | null =
      province === "QC"
        ? {
            client: { regime: assuranceMedsClient, periodes: assuranceMedsClientPeriodes },
            conjoint: aUnConjoint
              ? { regime: assuranceMedsConjoint, periodes: assuranceMedsConjointPeriodes }
              : null,
          }
        : null;

    return {
      dossierType: "t1",
      canal: "presentiel",
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
        courriel: courriel.trim().toLowerCase(),

        adresse: adresse.trim(),
        app: app.trim(),
        ville: ville.trim(),
        province,
        codePostal: normalizePostal(codePostal),
      },
      conjoint: conjointData,
      assuranceMedicamenteuse: medsData,
      personnesACharge: enfants.map((x) => ({
        prenom: x.prenom.trim(),
        nom: x.nom.trim(),
        dob: x.dob.trim(),
        nas: normalizeNAS(x.nas),
        sexe: x.sexe ?? "",
      })),
      questionsGenerales: {
        anneeImposition: anneeImposition.trim(),
        habiteSeulTouteAnnee,
        nbPersonnesMaison3112: nbPersonnesMaison3112.trim(),
        biensEtranger100k,
        citoyenCanadien,
        nonResident,
        maisonAcheteeOuVendue,
        copieImpots,
      },
    };
  }, [
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
    courriel,
    adresse,
    app,
    ville,
    province,
    codePostal,
    aUnConjoint,
    traiterConjoint,
    prenomConjoint,
    nomConjoint,
    nasConjoint,
    dobConjoint,
    revenuNetConjoint,
    assuranceMedsClient,
    assuranceMedsClientPeriodes,
    assuranceMedsConjoint,
    assuranceMedsConjointPeriodes,
    enfants,
    anneeImposition,
    habiteSeulTouteAnnee,
    nbPersonnesMaison3112,
    biensEtranger100k,
    citoyenCanadien,
    nonResident,
    maisonAcheteeOuVendue,
    copieImpots,
  ]);

  const saveDraft = useCallback(async (): Promise<string | null> => {
    if (hydrating.current) return formulaireId ?? null;
    if (submitting) return formulaireId ?? null;

    const fid = formulaireId;

    // UPDATE
    if (fid) {
      const { error } = await supabase
        .from(FORMS_TABLE)
        .update({
          lang,
          annee: anneeImposition || null,
          data: draftData,
        })
        .eq("id", fid)

      if (error) throw new Error(error.message);
      return fid;
    }

    // INSERT
    const { data: dataInsert, error: errorInsert } = await supabase
      .from(FORMS_TABLE)
      .insert({
        user_id: userId,
        form_type: FORM_TYPE_T1,
        lang,
        status: "draft", // si colonne existe
        annee: anneeImposition || null,
        data: draftData,
      })
      .select("id")
      .single<InsertIdRow>();

    if (errorInsert) throw new Error(errorInsert.message);

    const newFid = dataInsert?.id ?? null;
    if (newFid) {
      setFormulaireId(newFid);
      // met fid dans l’URL (utile si refresh)
      router.replace(
        `/formulaire-fiscal-presentiel-t1?fid=${encodeURIComponent(newFid)}&lang=${encodeURIComponent(lang)}`
      );
    }
    return newFid;
  }, [anneeImposition, draftData, formulaireId, lang, router, submitting, userId]);

  const loadByFid = useCallback(async (fidToLoad: string) => {
    setLoading(true);
    hydrating.current = true;
    setMsg(null);

    try {
      const { data: row, error } = await supabase
        .from(FORMS_TABLE)
        .select("id, data, annee, lang, user_id, form_type")
        .eq("id", fidToLoad)
        .maybeSingle<FormRow>();

      if (error) throw error;
      if (!row) {
        setMsg("❌ Dossier introuvable (fid invalide).");
        return;
      }

      setFormulaireId(row.id);

      const form = row.data ?? {};
      const client = form.client ?? {};

      setPrenom(client.prenom ?? "");
      setNom(client.nom ?? "");
      setNas(client.nas ? formatNASInput(client.nas) : "");
      setDob(client.dob ?? "");
      setEtatCivil((client.etatCivil as EtatCivil) ?? "");

      setEtatCivilChange(!!client.etatCivilChange);
      setAncienEtatCivil(client.ancienEtatCivil ?? "");
      setDateChangementEtatCivil(client.dateChangementEtatCivil ?? "");

      setTel(client.tel ? formatPhoneInput(client.tel) : "");
      setTelCell(client.telCell ? formatPhoneInput(client.telCell) : "");
      setCourriel(client.courriel ?? "");

      setAdresse(client.adresse ?? "");
      setApp(client.app ?? "");
      setVille(client.ville ?? "");
      setProvince((client.province as ProvinceCode) ?? "QC");
      setCodePostal(client.codePostal ? formatPostalInput(client.codePostal) : "");

      const cj = form.conjoint ?? null;
      setAUnConjoint(!!cj);

      if (cj) {
        setTraiterConjoint(!!cj.traiterConjoint);
        setPrenomConjoint(cj.prenomConjoint ?? "");
        setNomConjoint(cj.nomConjoint ?? "");
        setNasConjoint(cj.nasConjoint ? formatNASInput(cj.nasConjoint) : "");
        setDobConjoint(cj.dobConjoint ?? "");
        setRevenuNetConjoint(cj.revenuNetConjoint ?? "");
      } else {
        setTraiterConjoint(true);
        setPrenomConjoint("");
        setNomConjoint("");
        setNasConjoint("");
        setDobConjoint("");
        setRevenuNetConjoint("");
      }

      const meds = form.assuranceMedicamenteuse ?? null;
      if (meds?.client) {
        setAssuranceMedsClient((meds.client.regime ?? "") as AssuranceMeds);
        setAssuranceMedsClientPeriodes(meds.client.periodes ?? [{ debut: "", fin: "" }]);
      } else {
        setAssuranceMedsClient("");
        setAssuranceMedsClientPeriodes([{ debut: "", fin: "" }]);
      }

      if (meds?.conjoint) {
        setAssuranceMedsConjoint((meds.conjoint.regime ?? "") as AssuranceMeds);
        setAssuranceMedsConjointPeriodes(meds.conjoint.periodes ?? [{ debut: "", fin: "" }]);
      } else {
        setAssuranceMedsConjoint("");
        setAssuranceMedsConjointPeriodes([{ debut: "", fin: "" }]);
      }

      setEnfants(form.personnesACharge ?? []);

      const q = form.questionsGenerales ?? {};
      setAnneeImposition(q.anneeImposition ?? "");
      setHabiteSeulTouteAnnee(q.habiteSeulTouteAnnee ?? "");
      setNbPersonnesMaison3112(q.nbPersonnesMaison3112 ?? "");
      setBiensEtranger100k(q.biensEtranger100k ?? "");
      setCitoyenCanadien(q.citoyenCanadien ?? "");
      setNonResident(q.nonResident ?? "");
      setMaisonAcheteeOuVendue(q.maisonAcheteeOuVendue ?? "");
      setCopieImpots((q.copieImpots as CopieImpots) ?? "");
    } catch (e: unknown) {
      setMsg("❌ Erreur chargement: " + asMsg(e));
    } finally {
      hydrating.current = false;
      setLoading(false);
    }
  }, [userId]);

  const loadLastForm = useCallback(async () => {
    setLoading(true);
    hydrating.current = true;
    setMsg(null);

    try {
      const { data: row, error } = await supabase
        .from(FORMS_TABLE)
        .select("id, data, created_at")
        .eq("user_id", userId)
        .eq("form_type", FORM_TYPE_T1)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<FormRow>();

      if (error) throw error;
      if (!row) return;

      await loadByFid(row.id);
    } catch (e: unknown) {
      setMsg("❌ Erreur chargement: " + asMsg(e));
    } finally {
      hydrating.current = false;
      setLoading(false);
    }
  }, [loadByFid, userId]);

  // init: si fid dans url -> load, sinon load last
  useEffect(() => {
    const fidFromUrl = (params.get("fid") || "").trim();
    if (fidFromUrl) {
      void loadByFid(fidFromUrl);
      return;
    }
    void loadLastForm();
  }, [loadByFid, loadLastForm, params]);

  // autosave
  useEffect(() => {
    if (hydrating.current) return;

    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveDraft().catch(() => {});
    }, 800);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [draftData, lang, saveDraft]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace(`/espace-client?lang=${encodeURIComponent(lang)}`);
  }, [router, lang]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitting(true);
      setMsg(null);

      try {
        setSaving(true);
        const fidFromSave = await saveDraft();
        const realFid = fidFromSave || formulaireId;
        if (!realFid) throw new Error("Impossible d'envoyer (fid manquant).");

        const { error } = await supabase
          .from(FORMS_TABLE)
          .update({
            status: "recu",
            annee: anneeImposition || null,
            data: draftData,
            lang,
          })
          .eq("id", realFid)

        if (error) throw error;

        setMsg("✅ Dossier présentiel envoyé.");
        // option: retour admin
        router.push(`/admin/presentiel?flow=t1&lang=${encodeURIComponent(lang)}`);
      } catch (err: unknown) {
        setMsg("❌ " + asMsg(err));
      } finally {
        setSaving(false);
        setSubmitting(false);
      }
    },
    [anneeImposition, draftData, formulaireId, lang, router, saveDraft, userId]
  );

  return (
    <main className="ff-bg">
      <div className="ff-container">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <h1 style={{ margin: 0 }}>Présentiel — T1</h1>
          <button className="ff-btn ff-btn-outline" type="button" onClick={logout}>
            Déconnexion
          </button>
        </div>

        <p style={{ marginTop: 6, opacity: 0.8 }}>
          Interne seulement (présentiel). Pas de paiement. Pas de dépôt de documents côté client.
        </p>

        {msg && (
          <div className="ff-card" style={{ padding: 12 }}>
            {msg}
          </div>
        )}

        {loading && (
          <div className="ff-card" style={{ padding: 12 }}>
            Chargement…
          </div>
        )}

        <form onSubmit={handleSubmit} className="ff-form">
          <section className="ff-card">
            <h2 style={{ marginTop: 0 }}>Client</h2>

            <div className="ff-grid2">
              <Field label="Prénom" value={prenom} onChange={setPrenom} required />
              <Field label="Nom" value={nom} onChange={setNom} required />
              <Field
                label="NAS"
                value={nas}
                onChange={setNas}
                placeholder="123-456-789"
                required
                inputMode="numeric"
                formatter={formatNASInput}
                maxLength={11}
              />
              <Field
                label="Date de naissance"
                value={dob}
                onChange={setDob}
                placeholder="JJ/MM/AAAA"
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
                label="État civil changé durant l'année"
                checked={etatCivilChange}
                onChange={setEtatCivilChange}
              />
            </div>

            {etatCivilChange && (
              <div className="ff-grid2 ff-mt">
                <Field label="Ancien état civil" value={ancienEtatCivil} onChange={setAncienEtatCivil} />
                <Field
                  label="Date du changement"
                  value={dateChangementEtatCivil}
                  onChange={setDateChangementEtatCivil}
                  placeholder="JJ/MM/AAAA"
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
              <div />
            </div>

            <div className="ff-mt">
              <Field label="Adresse" value={adresse} onChange={setAdresse} required />
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
                />
              </div>
            </div>
          </section>

          <section className="ff-card">
            <h2 style={{ marginTop: 0 }}>Conjoint (si applicable)</h2>

            <CheckboxField label="A un conjoint / conjointe" checked={aUnConjoint} onChange={setAUnConjoint} />

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
                      inputMode="numeric"
                    />
                  </div>
                )}

                <div className="ff-grid2 ff-mt">
                  <Field label="Prénom" value={prenomConjoint} onChange={setPrenomConjoint} required={traiterConjoint} />
                  <Field label="Nom" value={nomConjoint} onChange={setNomConjoint} required={traiterConjoint} />
                  <Field
                    label="NAS"
                    value={nasConjoint}
                    onChange={setNasConjoint}
                    placeholder="123-456-789"
                    inputMode="numeric"
                    formatter={formatNASInput}
                    maxLength={11}
                  />
                  <Field
                    label="Date de naissance"
                    value={dobConjoint}
                    onChange={setDobConjoint}
                    placeholder="JJ/MM/AAAA"
                    inputMode="numeric"
                    formatter={formatDateInput}
                    maxLength={10}
                  />
                </div>
              </>
            )}
          </section>

          {province === "QC" && (
            <section className="ff-card">
              <h2 style={{ marginTop: 0 }}>Assurance médicaments (QC)</h2>

              <SelectField<AssuranceMeds>
                label="Couverture client"
                value={assuranceMedsClient}
                onChange={setAssuranceMedsClient}
                options={[
                  { value: "ramq", label: "RAMQ" },
                  { value: "prive", label: "Régime privé" },
                  { value: "conjoint", label: "Régime du conjoint / parent" },
                ]}
              />

              <div className="ff-mt-sm ff-stack">
                {assuranceMedsClientPeriodes.map((p, idx) => (
                  <div key={`cli-${idx}`} className="ff-rowbox">
                    <Field
                      label="De"
                      value={p.debut}
                      onChange={(val) =>
                        setAssuranceMedsClientPeriodes((prev) =>
                          updatePeriode(prev, idx, { debut: formatDateInput(val) })
                        )
                      }
                      placeholder="JJ/MM/AAAA"
                      inputMode="numeric"
                      maxLength={10}
                    />
                    <Field
                      label="À"
                      value={p.fin}
                      onChange={(val) =>
                        setAssuranceMedsClientPeriodes((prev) =>
                          updatePeriode(prev, idx, { fin: formatDateInput(val) })
                        )
                      }
                      placeholder="JJ/MM/AAAA"
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
                  + Période client
                </button>
              </div>

              {aUnConjoint && (
                <>
                  <div className="ff-mt" />

                  <SelectField<AssuranceMeds>
                    label="Couverture conjoint"
                    value={assuranceMedsConjoint}
                    onChange={setAssuranceMedsConjoint}
                    options={[
                      { value: "ramq", label: "RAMQ" },
                      { value: "prive", label: "Régime privé" },
                      { value: "conjoint", label: "Régime du conjoint / parent" },
                    ]}
                  />

                  <div className="ff-mt-sm ff-stack">
                    {assuranceMedsConjointPeriodes.map((p, idx) => (
                      <div key={`cj-${idx}`} className="ff-rowbox">
                        <Field
                          label="De"
                          value={p.debut}
                          onChange={(val) =>
                            setAssuranceMedsConjointPeriodes((prev) =>
                              updatePeriode(prev, idx, { debut: formatDateInput(val) })
                            )
                          }
                          placeholder="JJ/MM/AAAA"
                          inputMode="numeric"
                          maxLength={10}
                        />
                        <Field
                          label="À"
                          value={p.fin}
                          onChange={(val) =>
                            setAssuranceMedsConjointPeriodes((prev) =>
                              updatePeriode(prev, idx, { fin: formatDateInput(val) })
                            )
                          }
                          placeholder="JJ/MM/AAAA"
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
                      + Période conjoint
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          <section className="ff-card">
            <h2 style={{ marginTop: 0 }}>Personnes à charge</h2>

            {enfants.length === 0 ? (
              <div className="ff-empty">Aucune</div>
            ) : (
              <div className="ff-stack">
                {enfants.map((enf, i) => (
                  <div key={`enf-${i}`} className="ff-childbox">
                    <div className="ff-childhead">
                      <strong>#{i + 1}</strong>
                      <button type="button" className="ff-btn ff-btn-link" onClick={() => removeEnfant(i)}>
                        Supprimer
                      </button>
                    </div>

                    <div className="ff-grid2">
                      <Field label="Prénom" value={enf.prenom} onChange={(v) => updateEnfant(i, "prenom", v)} />
                      <Field label="Nom" value={enf.nom} onChange={(v) => updateEnfant(i, "nom", v)} />
                      <Field
                        label="Naissance"
                        value={enf.dob}
                        onChange={(v) => updateEnfant(i, "dob", formatDateInput(v))}
                        placeholder="JJ/MM/AAAA"
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
                  </div>
                ))}
              </div>
            )}

            <div className="ff-mt">
              <button type="button" className="ff-btn ff-btn-primary" onClick={ajouterEnfant}>
                + Ajouter
              </button>
            </div>
          </section>

          <section className="ff-card">
            <h2 style={{ marginTop: 0 }}>Questions</h2>

            <Field
              label="Année d’imposition"
              value={anneeImposition}
              onChange={setAnneeImposition}
              placeholder="ex.: 2025"
              inputMode="numeric"
            />

            <div className="ff-mt-sm" />

            <YesNoField
              name="habiteSeulTouteAnnee"
              label="Habité seul(e) toute l'année (sans personne à charge) ?"
              value={habiteSeulTouteAnnee}
              onChange={setHabiteSeulTouteAnnee}
            />

            <Field
              label="Au 31/12, nb de personnes dans la maison"
              value={nbPersonnesMaison3112}
              onChange={setNbPersonnesMaison3112}
              inputMode="numeric"
            />

            <YesNoField
              name="biensEtranger100k"
              label="Biens à l'étranger > 100 000 $ ?"
              value={biensEtranger100k}
              onChange={setBiensEtranger100k}
            />

            <YesNoField
              name="citoyenCanadien"
              label="Citoyen(ne) canadien(ne) ?"
              value={citoyenCanadien}
              onChange={setCitoyenCanadien}
            />

            <YesNoField
              name="nonResident"
              label="Non-résident(e) aux fins fiscales ?"
              value={nonResident}
              onChange={setNonResident}
            />

            <YesNoField
              name="maisonAcheteeOuVendue"
              label="Achat 1re habitation ou vente résidence principale ?"
              value={maisonAcheteeOuVendue}
              onChange={setMaisonAcheteeOuVendue}
            />

            <SelectField<CopieImpots>
              label="Copie d'impôt"
              value={copieImpots}
              onChange={setCopieImpots}
              required
              options={[
                { value: "espaceClient", label: "Espace client" },
                { value: "courriel", label: "Courriel" },
              ]}
            />
          </section>

          <div className="ff-submit">
            <button type="submit" className="ff-btn ff-btn-primary ff-btn-big" disabled={submitting || saving}>
              {submitting ? "Envoi…" : "Envoyer le dossier"}
            </button>

            <div className="ff-muted" style={{ marginTop: 10 }}>
              {formulaireId ? `Dossier: ${formulaireId}` : "Dossier: (nouveau)"}
              {saving ? " — sauvegarde…" : ""}
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
