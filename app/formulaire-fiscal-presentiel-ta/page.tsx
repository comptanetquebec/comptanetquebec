"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// ✅ LOCAL uniquement
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
const FORM_TYPE_TA = "autonome" as const;

type Lang = "fr" | "en" | "es";
function normalizeLang(v: string | null | undefined): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

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

type EtatCivil =
  | "celibataire"
  | "conjointDefait"
  | "marie"
  | "separe"
  | "divorce"
  | "veuf"
  | "";

type CopieImpots = "espaceClient" | "courriel" | "";

/** ✅ AJOUT: Revenus & dépenses (présentiel TA) */
type Money = string;
type TARevenusDepenses = {
  revenusVentes?: Money;
  revenusServices?: Money;
  revenusPlateformes?: Money;
  revenusAffiliation?: Money;
  revenusAutres?: Money;
  revenusAutresLabel?: string;

  depensesAchats?: Money;
  depensesFournitures?: Money;
  depensesPub?: Money;
  depensesLogiciels?: Money;
  depensesFraisBancaires?: Money;
  depensesAutres?: Money;
  depensesAutresLabel?: string;

  notes?: string;
};

type Formdata = {
  dossierType?: "autonome";
  canal?: "presentiel";
  client?: {
    prenom?: string;
    nom?: string;
    nas?: string;
    dob?: string;
    etatCivil?: EtatCivil;
    tel?: string;
    courriel?: string;
    adresse?: string;
    ville?: string;
    province?: ProvinceCode;
    codePostal?: string;
  };
  questionsGenerales?: {
    anneeImposition?: string;
    habiteSeulTouteAnnee?: YesNo;
    biensEtranger100k?: YesNo;
    copieImpots?: CopieImpots;
  };

  /** ✅ AJOUT: on met revenus/dépenses directement dans data */
  taRevenusDepenses?: TARevenusDepenses;
};

type FormRow = {
  id: string;
  user_id: string;
  form_type: string;
  lang: Lang | null;
  annee: string | null;
  data: Formdata | null;
};

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

function digitsOnly(v: string, max: number) {
  return (v || "").replace(/\D+/g, "").slice(0, max);
}
function formatNAS(v: string) {
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
function formatDate(v: string) {
  const d = digitsOnly(v, 8);
  const dd = d.slice(0, 2);
  const mm = d.slice(2, 4);
  const yyyy = d.slice(4, 8);
  if (d.length <= 2) return dd;
  if (d.length <= 4) return `${dd}/${mm}`;
  return `${dd}/${mm}/${yyyy}`;
}
function formatPostal(v: string) {
  const s = (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (s.length <= 3) return s;
  return `${s.slice(0, 3)} ${s.slice(3, 6)}`;
}
function normalizePostal(v: string) {
  return (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

/** ✅ AJOUT: format montant (simple, stable) */
function formatMoneyInput(v: string) {
  return (v || "").replace(/[^\d.,]/g, "").slice(0, 16);
}

function asMsg(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Erreur";
  }
}

export default function FormulaireFiscalPresentielTAPage() {
  const router = useRouter();
  const params = useSearchParams();

  const lang = normalizeLang(params.get("lang") || "fr");
  const fidUrl = (params.get("fid") || "").trim();

  const [userId, setUserId] = useState<string | null>(null);
  const [fid, setFid] = useState<string | null>(fidUrl || null);

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ====== champs BASIC
  const [anneeImposition, setAnneeImposition] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [nas, setNas] = useState("");
  const [dob, setDob] = useState("");
  const [etatCivil, setEtatCivil] = useState<EtatCivil>("");

  const [tel, setTel] = useState("");
  const [courriel, setCourriel] = useState("");

  const [adresse, setAdresse] = useState("");
  const [ville, setVille] = useState("");
  const [province, setProvince] = useState<ProvinceCode>("QC");
  const [codePostal, setCodePostal] = useState("");

  const [habiteSeulTouteAnnee, setHabiteSeulTouteAnnee] = useState<YesNo>("");
  const [biensEtranger100k, setBiensEtranger100k] = useState<YesNo>("");
  const [copieImpots, setCopieImpots] = useState<CopieImpots>("");

  // ====== ✅ AJOUT: revenus & dépenses (même page)
  const [revVentes, setRevVentes] = useState("");
  const [revServices, setRevServices] = useState("");
  const [revPlateformes, setRevPlateformes] = useState("");
  const [revAffiliation, setRevAffiliation] = useState("");
  const [revAutres, setRevAutres] = useState("");
  const [revAutresLabel, setRevAutresLabel] = useState("");

  const [depAchats, setDepAchats] = useState("");
  const [depFournitures, setDepFournitures] = useState("");
  const [depPub, setDepPub] = useState("");
  const [depLogiciels, setDepLogiciels] = useState("");
  const [depFraisBancaires, setDepFraisBancaires] = useState("");
  const [depAutres, setDepAutres] = useState("");
  const [depAutresLabel, setDepAutresLabel] = useState("");

  const [rdNotes, setRdNotes] = useState("");

  // ====== auth (présentiel = toi connecté)
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

  // ====== draftData (inclut revenus/dépenses)
  const draftData: Formdata = useMemo(() => {
    return {
      dossierType: "autonome",
      canal: "presentiel",
      client: {
        prenom: prenom.trim(),
        nom: nom.trim(),
        nas: normalizeNAS(nas),
        dob: dob.trim(),
        etatCivil,
        tel: tel.trim(),
        courriel: courriel.trim().toLowerCase(),
        adresse: adresse.trim(),
        ville: ville.trim(),
        province,
        codePostal: normalizePostal(codePostal),
      },
      questionsGenerales: {
        anneeImposition: anneeImposition.trim(),
        habiteSeulTouteAnnee,
        biensEtranger100k,
        copieImpots,
      },
      taRevenusDepenses: {
        revenusVentes: revVentes.trim(),
        revenusServices: revServices.trim(),
        revenusPlateformes: revPlateformes.trim(),
        revenusAffiliation: revAffiliation.trim(),
        revenusAutres: revAutres.trim(),
        revenusAutresLabel: revAutresLabel.trim(),

        depensesAchats: depAchats.trim(),
        depensesFournitures: depFournitures.trim(),
        depensesPub: depPub.trim(),
        depensesLogiciels: depLogiciels.trim(),
        depensesFraisBancaires: depFraisBancaires.trim(),
        depensesAutres: depAutres.trim(),
        depensesAutresLabel: depAutresLabel.trim(),

        notes: rdNotes.trim(),
      },
    };
  }, [
    anneeImposition,
    prenom,
    nom,
    nas,
    dob,
    etatCivil,
    tel,
    courriel,
    adresse,
    ville,
    province,
    codePostal,
    habiteSeulTouteAnnee,
    biensEtranger100k,
    copieImpots,
    revVentes,
    revServices,
    revPlateformes,
    revAffiliation,
    revAutres,
    revAutresLabel,
    depAchats,
    depFournitures,
    depPub,
    depLogiciels,
    depFraisBancaires,
    depAutres,
    depAutresLabel,
    rdNotes,
  ]);

  // ====== load si fid
  useEffect(() => {
    if (!userId) return;
    if (!fid) return;

    (async () => {
      setLoading(true);
      setMsg(null);
      try {
        const { data, error } = await supabase
          .from(FORMS_TABLE)
          .select("id, user_id, form_type, lang, annee, data")
          .eq("id", fid)
          .maybeSingle<FormRow>();

        if (error) throw error;
        if (!data) return;

        const form = data.data ?? {};
        const c = form.client ?? {};
        const q = form.questionsGenerales ?? {};
        const rd = form.taRevenusDepenses ?? {};

        setPrenom(c.prenom ?? "");
        setNom(c.nom ?? "");
        setNas(c.nas ? formatNAS(c.nas) : "");
        setDob(c.dob ?? "");
        setEtatCivil((c.etatCivil as EtatCivil) ?? "");

        setTel(c.tel ?? "");
        setCourriel(c.courriel ?? "");

        setAdresse(c.adresse ?? "");
        setVille(c.ville ?? "");
        setProvince((c.province as ProvinceCode) ?? "QC");
        setCodePostal(c.codePostal ? formatPostal(c.codePostal) : "");

        setAnneeImposition(q.anneeImposition ?? "");
        setHabiteSeulTouteAnnee(q.habiteSeulTouteAnnee ?? "");
        setBiensEtranger100k(q.biensEtranger100k ?? "");
        setCopieImpots((q.copieImpots as CopieImpots) ?? "");

        // ✅ Revenus/dépenses
        setRevVentes(rd.revenusVentes ?? "");
        setRevServices(rd.revenusServices ?? "");
        setRevPlateformes(rd.revenusPlateformes ?? "");
        setRevAffiliation(rd.revenusAffiliation ?? "");
        setRevAutres(rd.revenusAutres ?? "");
        setRevAutresLabel(rd.revenusAutresLabel ?? "");

        setDepAchats(rd.depensesAchats ?? "");
        setDepFournitures(rd.depensesFournitures ?? "");
        setDepPub(rd.depensesPub ?? "");
        setDepLogiciels(rd.depensesLogiciels ?? "");
        setDepFraisBancaires(rd.depensesFraisBancaires ?? "");
        setDepAutres(rd.depensesAutres ?? "");
        setDepAutresLabel(rd.depensesAutresLabel ?? "");

        setRdNotes(rd.notes ?? "");
      } catch (e: unknown) {
        setMsg("❌ Erreur chargement: " + asMsg(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [fid, userId]);

  // ✅ save retourne le fid (FIABLE pour navigation)
  const save = useCallback(async (): Promise<string | null> => {
    if (!userId) {
      setMsg("❌ Non connecté.");
      return null;
    }

    setSaving(true);
    setMsg("⏳ Sauvegarde…");

    try {
     // UPDATE
if (fid) {
  const { error } = await supabase
    .from(FORMS_TABLE)
    .update({
      lang,
      annee: anneeImposition || null,
      data: draftData,
    })
    .eq("id", fid);

  if (error) throw error;

  setMsg("✅ Sauvegardé.");
  return fid;
}
      // INSERT
      const { data, error } = await supabase
        .from(FORMS_TABLE)
        .insert({
          user_id: userId,
          form_type: FORM_TYPE_TA,
          lang,
          status: "draft", // si ta colonne existe
          annee: anneeImposition || null,
          data: draftData,
        })
        .select("id")
        .single<{ id: string }>();

      if (error) throw error;

      const newFid = data?.id ?? null;
      if (newFid) {
        setFid(newFid);

        router.replace(
          `/formulaire-fiscal-presentiel-ta?fid=${encodeURIComponent(newFid)}&lang=${encodeURIComponent(lang)}`
        );
      }

      setMsg("✅ Créé + sauvegardé.");
      return newFid;
    } catch (e: unknown) {
      setMsg("❌ " + asMsg(e));
      return null;
    } finally {
      setSaving(false);
    }
  }, [anneeImposition, draftData, fid, lang, router, userId]);

  // ✅ Plus de Steps: bouton final -> /envoyer
  const goNext = useCallback(async () => {
    const savedFid = await save();
    const useFid = savedFid || fid || fidUrl;

    if (!useFid) {
      setMsg("❌ Impossible de continuer: fid manquant.");
      return;
    }

    router.push(
      `/formulaire-fiscal-presentiel-ta/envoyer?fid=${encodeURIComponent(useFid)}&lang=${encodeURIComponent(lang)}`
    );
  }, [fid, fidUrl, lang, router, save]);

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

  return (
    <main className="ff-bg">
      <div className="ff-container">
        <header className="ff-header">
          <div className="ff-brand-text">
            <strong>ComptaNet Québec</strong>
            <span>Présentiel — Travailleur autonome</span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="ff-btn ff-btn-soft" type="button" disabled={saving} onClick={() => void save()}>
              Enregistrer
            </button>

            <button
              className="ff-btn ff-btn-outline"
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace(`/espace-client?lang=${encodeURIComponent(lang)}`);
              }}
            >
              Se déconnecter
            </button>
          </div>
        </header>

        {msg && (
          <div className="ff-card" style={{ padding: 14 }}>
            {msg}
          </div>
        )}

        {loading && (
          <div className="ff-card" style={{ padding: 14 }}>
            Chargement…
          </div>
        )}

        {/* =======================
            CLIENT
        ======================= */}
        <section className="ff-card">
          <div className="ff-card-head">
            <h2>Client</h2>
            <p>Minimum pour ouvrir un dossier.</p>
          </div>

          <div className="ff-grid2">
            <Field label="Année d’imposition" value={anneeImposition} onChange={setAnneeImposition} inputMode="numeric" />

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
            />

            <Field label="Prénom" value={prenom} onChange={setPrenom} required />
            <Field label="Nom" value={nom} onChange={setNom} required />

            <Field
              label="NAS"
              value={nas}
              onChange={setNas}
              formatter={formatNAS}
              maxLength={11}
              inputMode="numeric"
              placeholder="123-456-789"
            />

            <Field
              label="Date de naissance (JJ/MM/AAAA)"
              value={dob}
              onChange={setDob}
              formatter={formatDate}
              maxLength={10}
              inputMode="numeric"
              placeholder="01/01/1990"
            />

            <Field label="Téléphone" value={tel} onChange={setTel} />
            <Field label="Courriel" value={courriel} onChange={setCourriel} type="email" />
          </div>

          <div className="ff-mt">
            <Field label="Adresse" value={adresse} onChange={setAdresse} />

            <div className="ff-grid4 ff-mt-sm">
              <Field label="Ville" value={ville} onChange={setVille} />

              <SelectField<ProvinceCode> label="Province" value={province} onChange={setProvince} options={PROVINCES} />

              <Field
                label="Code postal"
                value={codePostal}
                onChange={setCodePostal}
                formatter={formatPostal}
                maxLength={7}
                placeholder="G1V 0A6"
              />

              <SelectField<CopieImpots>
                label="Copie d’impôt"
                value={copieImpots}
                onChange={setCopieImpots}
                options={[
                  { value: "espaceClient", label: "Espace client" },
                  { value: "courriel", label: "Courriel" },
                ]}
              />
            </div>
          </div>
        </section>

        {/* =======================
            QUESTIONS
        ======================= */}
        <section className="ff-card">
          <div className="ff-card-head">
            <h2>Questions</h2>
            <p>Juste les 2 questions utiles.</p>
          </div>

          <div className="ff-stack">
            <YesNoField
              name="habiteSeulTouteAnnee"
              label="Habité seul(e) toute l’année (sans personne à charge) ?"
              value={habiteSeulTouteAnnee}
              onChange={setHabiteSeulTouteAnnee}
            />

            <YesNoField
              name="biensEtranger100k"
              label="Plus de 100 000 $ de biens à l’étranger ?"
              value={biensEtranger100k}
              onChange={setBiensEtranger100k}
            />
          </div>
        </section>

        {/* =======================
            ✅ REVENUS & DÉPENSES
        ======================= */}
        <section className="ff-card">
          <div className="ff-card-head">
            <h2>Revenus & dépenses (totaux)</h2>
            <p>Montants totaux approximatifs. (Tu peux laisser vide.)</p>
          </div>

          <div className="ff-card" style={{ padding: 12, marginBottom: 12 }}>
            <div className="ff-muted" style={{ marginBottom: 10 }}>
              Revenus
            </div>

            <div className="ff-grid2">
              <Field label="Ventes ($)" value={revVentes} onChange={(v) => setRevVentes(formatMoneyInput(v))} inputMode="decimal" />
              <Field label="Services ($)" value={revServices} onChange={(v) => setRevServices(formatMoneyInput(v))} inputMode="decimal" />
              <Field label="Plateformes ($)" value={revPlateformes} onChange={(v) => setRevPlateformes(formatMoneyInput(v))} inputMode="decimal" />
              <Field label="Affiliation ($)" value={revAffiliation} onChange={(v) => setRevAffiliation(formatMoneyInput(v))} inputMode="decimal" />
              <Field label="Autres revenus ($)" value={revAutres} onChange={(v) => setRevAutres(formatMoneyInput(v))} inputMode="decimal" />
              <Field label="Autres revenus — préciser" value={revAutresLabel} onChange={setRevAutresLabel} />
            </div>
          </div>

          <div className="ff-card" style={{ padding: 12 }}>
            <div className="ff-muted" style={{ marginBottom: 10 }}>
              Dépenses
            </div>

            <div className="ff-grid2">
              <Field
                label="Achats / coût des marchandises ($)"
                value={depAchats}
                onChange={(v) => setDepAchats(formatMoneyInput(v))}
                inputMode="decimal"
              />
              <Field
                label="Fournitures ($)"
                value={depFournitures}
                onChange={(v) => setDepFournitures(formatMoneyInput(v))}
                inputMode="decimal"
              />
              <Field label="Publicité ($)" value={depPub} onChange={(v) => setDepPub(formatMoneyInput(v))} inputMode="decimal" />
              <Field
                label="Logiciels / abonnements ($)"
                value={depLogiciels}
                onChange={(v) => setDepLogiciels(formatMoneyInput(v))}
                inputMode="decimal"
              />
              <Field
                label="Frais bancaires ($)"
                value={depFraisBancaires}
                onChange={(v) => setDepFraisBancaires(formatMoneyInput(v))}
                inputMode="decimal"
              />
              <Field
                label="Autres dépenses ($)"
                value={depAutres}
                onChange={(v) => setDepAutres(formatMoneyInput(v))}
                inputMode="decimal"
              />
              <Field label="Autres dépenses — préciser" value={depAutresLabel} onChange={setDepAutresLabel} />
              <div />
            </div>

            <div className="ff-mt">
              <Field label="Notes (optionnel)" value={rdNotes} onChange={setRdNotes} />
            </div>
          </div>
        </section>

        {/* =======================
            ACTION
        ======================= */}
        <div className="ff-submit">
          <button type="button" className="ff-btn ff-btn-primary ff-btn-big" disabled={saving} onClick={goNext}>
            Envoyer →
          </button>

          {(fid || fidUrl) && (
            <div className="ff-muted" style={{ marginTop: 10 }}>
              Dossier: <strong>{fid || fidUrl}</strong>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
