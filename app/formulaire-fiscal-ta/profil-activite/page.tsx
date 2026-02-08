"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

import "../formulaire-fiscal.css"; // si ton css est dans /formulaire-fiscal-ta/ sinon ajuste
import Steps from "../Steps";
import RequireAuth from "../RequireAuth";
import { Field, CheckboxField, YesNoField, SelectField, type YesNo } from "../ui";

/**
 * DB
 */
const FORMS_TABLE = "formulaires_fiscaux";
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
   Helpers
=========================== */

function supaErr(e: unknown) {
  if (!e || typeof e !== "object") return "Erreur inconnue";
  const err = e as { message?: string; details?: string; hint?: string; code?: string };
  return [err.message, err.details, err.hint, err.code].filter(Boolean).join(" | ");
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

/* ===========================
   Types data (ajout TA)
=========================== */

type RevenueType =
  | "services"
  | "honoraires"
  | "produits_physiques"
  | "produits_numeriques"
  | "affiliation"
  | "pourboires"
  | "plateformes"
  | "devises"
  | "autres";

type PayMethod =
  | "comptant"
  | "virements"
  | "cartes"
  | "paypal"
  | "stripe"
  | "plateformes"
  | "autre";

type AccountingMethod = "encaisse" | "exercice" | "";
type AccountingTool = "aucun" | "excel" | "quickbooks" | "autre" | "";

type TAProfil = {
  // identité activité
  nomCommercial?: string;
  neq?: string;
  dateDebut?: string; // JJ/MM/AAAA
  activitePrincipale?: string;

  // taxes
  inscritTPS?: YesNo;
  noTPS?: string;
  inscritTVQ?: YesNo;
  noTVQ?: string;
  aFactureTaxes?: YesNo;
  verifierObligation?: YesNo;

  // revenus / encaissements
  typesRevenus?: RevenueType[];
  autresRevenusTexte?: string;
  modesPaiement?: PayMethod[];
  autresPaiementTexte?: string;

  // dépenses / déclencheurs pages suivantes
  bureauDomicile?: boolean;
  vehicule?: boolean;
  inventaire?: boolean;
  immobilisations?: boolean;
  sousTraitants?: boolean;
  employes?: boolean;

  // compta
  methodeComptable?: AccountingMethod;
  outilComptable?: AccountingTool;
  compteBancaireSepare?: YesNo;
};

type Formdata = {
  dossierType?: string;
  taProfil?: TAProfil; // <— on ajoute ici
  // ... le reste de tes sections existantes
};

type FormRow = {
  id: string;
  user_id: string;
  form_type: string;
  data: Formdata | null;
  lang: Lang | null;
  annee: string | null;
  created_at: string;
};

/* ===========================
   Page wrapper
=========================== */

export default function FormulaireFiscalTAProfilActivitePage() {
  const params = useSearchParams();
  const lang = normalizeLang(params.get("lang") || "fr");
  const nextPath = useMemo(
    () => `/formulaire-fiscal-ta/profil-activite?lang=${encodeURIComponent(lang)}`,
    [lang]
  );

  return (
    <RequireAuth lang={lang} nextPath={nextPath}>
      {(userId) => <Inner userId={userId} lang={lang} />}
    </RequireAuth>
  );
}

/* ===========================
   Inner
=========================== */

function Inner({ userId, lang }: { userId: string; lang: Lang }) {
  const router = useRouter();
  const params = useSearchParams();

  const fid = params.get("fid") || "";
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hydrating = useRef(false);
  const saveTimer = useRef<number | null>(null);

  // ---- states TA profil
  const [nomCommercial, setNomCommercial] = useState("");
  const [neq, setNeq] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [activitePrincipale, setActivitePrincipale] = useState("");

  const [inscritTPS, setInscritTPS] = useState<YesNo>("");
  const [noTPS, setNoTPS] = useState("");
  const [inscritTVQ, setInscritTVQ] = useState<YesNo>("");
  const [noTVQ, setNoTVQ] = useState("");
  const [aFactureTaxes, setAFactureTaxes] = useState<YesNo>("");
  const [verifierObligation, setVerifierObligation] = useState<YesNo>("");

  const [typesRevenus, setTypesRevenus] = useState<RevenueType[]>([]);
  const [autresRevenusTexte, setAutresRevenusTexte] = useState("");

  const [modesPaiement, setModesPaiement] = useState<PayMethod[]>([]);
  const [autresPaiementTexte, setAutresPaiementTexte] = useState("");

  const [bureauDomicile, setBureauDomicile] = useState(false);
  const [vehicule, setVehicule] = useState(false);
  const [inventaire, setInventaire] = useState(false);
  const [immobilisations, setImmobilisations] = useState(false);
  const [sousTraitants, setSousTraitants] = useState(false);
  const [employes, setEmployes] = useState(false);

  const [methodeComptable, setMethodeComptable] = useState<AccountingMethod>("");
  const [outilComptable, setOutilComptable] = useState<AccountingTool>("");
  const [compteBancaireSepare, setCompteBancaireSepare] = useState<YesNo>("");

  const toggleInArray = useCallback(<T,>(arr: T[], val: T) => {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }, []);

  const taProfilDraft: TAProfil = useMemo(
    () => ({
      nomCommercial: nomCommercial.trim(),
      neq: neq.trim(),
      dateDebut: dateDebut.trim(),
      activitePrincipale: activitePrincipale.trim(),

      inscritTPS,
      noTPS: noTPS.trim(),
      inscritTVQ,
      noTVQ: noTVQ.trim(),
      aFactureTaxes,
      verifierObligation,

      typesRevenus,
      autresRevenusTexte: autresRevenusTexte.trim(),
      modesPaiement,
      autresPaiementTexte: autresPaiementTexte.trim(),

      bureauDomicile,
      vehicule,
      inventaire,
      immobilisations,
      sousTraitants,
      employes,

      methodeComptable,
      outilComptable,
      compteBancaireSepare,
    }),
    [
      nomCommercial,
      neq,
      dateDebut,
      activitePrincipale,
      inscritTPS,
      noTPS,
      inscritTVQ,
      noTVQ,
      aFactureTaxes,
      verifierObligation,
      typesRevenus,
      autresRevenusTexte,
      modesPaiement,
      autresPaiementTexte,
      bureauDomicile,
      vehicule,
      inventaire,
      immobilisations,
      sousTraitants,
      employes,
      methodeComptable,
      outilComptable,
      compteBancaireSepare,
    ]
  );

  const loadForm = useCallback(async () => {
    if (!fid) {
      setMsg("❌ fid manquant dans l’URL.");
      return;
    }

    hydrating.current = true;
    setMsg(null);

    try {
      const { data, error } = await supabase
        .from(FORMS_TABLE)
        .select("id, user_id, form_type, data, lang, annee, created_at")
        .eq("id", fid)
        .eq("user_id", userId)
        .eq("form_type", FORM_TYPE_TA)
        .maybeSingle<FormRow>();

      if (error) throw new Error(supaErr(error));
      if (!data) {
        setMsg("❌ Dossier introuvable (fid invalide).");
        return;
      }

      const form = (data.data ?? {}) as Formdata;
      const ta = form.taProfil ?? {};

      setNomCommercial(ta.nomCommercial ?? "");
      setNeq(ta.neq ?? "");
      setDateDebut(ta.dateDebut ?? "");
      setActivitePrincipale(ta.activitePrincipale ?? "");

      setInscritTPS(ta.inscritTPS ?? "");
      setNoTPS(ta.noTPS ?? "");
      setInscritTVQ(ta.inscritTVQ ?? "");
      setNoTVQ(ta.noTVQ ?? "");
      setAFactureTaxes(ta.aFactureTaxes ?? "");
      setVerifierObligation(ta.verifierObligation ?? "");

      setTypesRevenus((ta.typesRevenus ?? []) as RevenueType[]);
      setAutresRevenusTexte(ta.autresRevenusTexte ?? "");

      setModesPaiement((ta.modesPaiement ?? []) as PayMethod[]);
      setAutresPaiementTexte(ta.autresPaiementTexte ?? "");

      setBureauDomicile(!!ta.bureauDomicile);
      setVehicule(!!ta.vehicule);
      setInventaire(!!ta.inventaire);
      setImmobilisations(!!ta.immobilisations);
      setSousTraitants(!!ta.sousTraitants);
      setEmployes(!!ta.employes);

      setMethodeComptable((ta.methodeComptable ?? "") as AccountingMethod);
      setOutilComptable((ta.outilComptable ?? "") as AccountingTool);
      setCompteBancaireSepare((ta.compteBancaireSepare ?? "") as YesNo);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erreur chargement.";
      setMsg("❌ " + message);
    } finally {
      hydrating.current = false;
    }
  }, [fid, userId]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  const saveDraft = useCallback(async () => {
    if (!fid) return;
    if (hydrating.current) return;

    setSaving(true);
    try {
      // on récupère la data actuelle pour merger sans écraser le reste
      const { data: row, error: e1 } = await supabase
        .from(FORMS_TABLE)
        .select("data")
        .eq("id", fid)
        .eq("user_id", userId)
        .maybeSingle<{ data: Formdata | null }>();

      if (e1) throw new Error(supaErr(e1));

      const current = (row?.data ?? {}) as Formdata;
      const merged: Formdata = { ...current, taProfil: taProfilDraft };

      const { error: e2 } = await supabase
        .from(FORMS_TABLE)
        .update({ data: merged, lang })
        .eq("id", fid)
        .eq("user_id", userId);

      if (e2) throw new Error(supaErr(e2));
    } finally {
      setSaving(false);
    }
  }, [fid, userId, taProfilDraft, lang]);

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
  }, [taProfilDraft, saveDraft]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace(`/espace-client?lang=${encodeURIComponent(lang)}`);
  }, [router, lang]);

  const goNext = useCallback(async () => {
    try {
      setMsg("⏳ Enregistrement…");
      await saveDraft();
      setMsg(null);
      router.push(
        `/formulaire-fiscal-ta/depot-documents?fid=${encodeURIComponent(fid)}&lang=${encodeURIComponent(lang)}`
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erreur.";
      setMsg("❌ " + message);
    }
  }, [fid, lang, router, saveDraft]);

  const backToStep1 = useCallback(() => {
    router.push(`/formulaire-fiscal-ta?lang=${encodeURIComponent(lang)}`);
  }, [router, lang]);

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
          <h1>Profil & activité — Travailleur autonome</h1>
          <p>Cette section sert à adapter automatiquement les pages suivantes (revenus, dépenses, taxes, etc.).</p>
        </div>

        {msg && (
          <div className="ff-card" style={{ padding: 14 }}>
            {msg}
          </div>
        )}

        <Steps step={2} lang={lang} flow="ta" />

        <div className="ff-form">
          {/* IDENTITÉ ACTIVITÉ */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Identification de l’activité</h2>
              <p>Décris ton activité de travailleur autonome.</p>
            </div>

            <div className="ff-grid2">
              <Field label="Nom commercial (si applicable)" value={nomCommercial} onChange={setNomCommercial} />
              <Field label="NEQ (si applicable)" value={neq} onChange={setNeq} placeholder="1234567890" />
              <Field
                label="Date de début (JJ/MM/AAAA)"
                value={dateDebut}
                onChange={(v) => setDateDebut(formatDateInput(v))}
                placeholder="01/01/2025"
                inputMode="numeric"
                maxLength={10}
              />
              <Field
                label="Activité principale (description)"
                value={activitePrincipale}
                onChange={setActivitePrincipale}
                placeholder="ex.: services de consultation, vente en ligne, etc."
              />
            </div>
          </section>

          {/* TAXES */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>TPS / TVQ</h2>
              <p>Ces infos déterminent si on doit couvrir la partie taxes.</p>
            </div>

            <div className="ff-stack">
              <YesNoField
                name="inscritTPS"
                label="Êtes-vous inscrit(e) à la TPS ?"
                value={inscritTPS}
                onChange={setInscritTPS}
              />
              {inscritTPS === "oui" && (
                <Field label="Numéro TPS" value={noTPS} onChange={setNoTPS} placeholder="ex.: 12345 6789 RT0001" />
              )}

              <YesNoField
                name="inscritTVQ"
                label="Êtes-vous inscrit(e) à la TVQ ?"
                value={inscritTVQ}
                onChange={setInscritTVQ}
              />
              {inscritTVQ === "oui" && (
                <Field label="Numéro TVQ" value={noTVQ} onChange={setNoTVQ} placeholder="ex.: 1234567890 TQ0001" />
              )}

              <YesNoField
                name="aFactureTaxes"
                label="Avez-vous facturé des taxes durant l’année ?"
                value={aFactureTaxes}
                onChange={setAFactureTaxes}
              />

              <YesNoField
                name="verifierObligation"
                label="Souhaitez-vous qu’on vérifie l’obligation d’inscription TPS/TVQ ?"
                value={verifierObligation}
                onChange={setVerifierObligation}
              />
            </div>
          </section>

          {/* REVENUS */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Types de revenus</h2>
              <p>Cochez tout ce qui s’applique.</p>
            </div>

            <div className="ff-stack">
              <CheckboxField
                label="Services professionnels"
                checked={typesRevenus.includes("services")}
                onChange={() => setTypesRevenus((p) => toggleInArray(p, "services"))}
              />
              <CheckboxField
                label="Honoraires"
                checked={typesRevenus.includes("honoraires")}
                onChange={() => setTypesRevenus((p) => toggleInArray(p, "honoraires"))}
              />
              <CheckboxField
                label="Vente de produits physiques"
                checked={typesRevenus.includes("produits_physiques")}
                onChange={() => setTypesRevenus((p) => toggleInArray(p, "produits_physiques"))}
              />
              <CheckboxField
                label="Vente de produits numériques"
                checked={typesRevenus.includes("produits_numeriques")}
                onChange={() => setTypesRevenus((p) => toggleInArray(p, "produits_numeriques"))}
              />
              <CheckboxField
                label="Commissions / affiliation"
                checked={typesRevenus.includes("affiliation")}
                onChange={() => setTypesRevenus((p) => toggleInArray(p, "affiliation"))}
              />
              <CheckboxField
                label="Pourboires"
                checked={typesRevenus.includes("pourboires")}
                onChange={() => setTypesRevenus((p) => toggleInArray(p, "pourboires"))}
              />
              <CheckboxField
                label="Revenus de plateformes (Etsy, Amazon, Shopify, etc.)"
                checked={typesRevenus.includes("plateformes")}
                onChange={() => setTypesRevenus((p) => toggleInArray(p, "plateformes"))}
              />
              <CheckboxField
                label="Revenus en devises étrangères"
                checked={typesRevenus.includes("devises")}
                onChange={() => setTypesRevenus((p) => toggleInArray(p, "devises"))}
              />
              <CheckboxField
                label="Autres"
                checked={typesRevenus.includes("autres")}
                onChange={() => setTypesRevenus((p) => toggleInArray(p, "autres"))}
              />

              {typesRevenus.includes("autres") && (
                <Field
                  label="Précisez"
                  value={autresRevenusTexte}
                  onChange={setAutresRevenusTexte}
                  placeholder="Décrivez les autres revenus"
                />
              )}
            </div>
          </section>

          {/* MODES DE PAIEMENT */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Modes d’encaissement</h2>
              <p>Comment vos clients vous paient ?</p>
            </div>

            <div className="ff-stack">
              <CheckboxField
                label="Comptant"
                checked={modesPaiement.includes("comptant")}
                onChange={() => setModesPaiement((p) => toggleInArray(p, "comptant"))}
              />
              <CheckboxField
                label="Virements bancaires"
                checked={modesPaiement.includes("virements")}
                onChange={() => setModesPaiement((p) => toggleInArray(p, "virements"))}
              />
              <CheckboxField
                label="Cartes de crédit"
                checked={modesPaiement.includes("cartes")}
                onChange={() => setModesPaiement((p) => toggleInArray(p, "cartes"))}
              />
              <CheckboxField
                label="PayPal"
                checked={modesPaiement.includes("paypal")}
                onChange={() => setModesPaiement((p) => toggleInArray(p, "paypal"))}
              />
              <CheckboxField
                label="Stripe"
                checked={modesPaiement.includes("stripe")}
                onChange={() => setModesPaiement((p) => toggleInArray(p, "stripe"))}
              />
              <CheckboxField
                label="Plateformes (Shopify, Etsy, Amazon, etc.)"
                checked={modesPaiement.includes("plateformes")}
                onChange={() => setModesPaiement((p) => toggleInArray(p, "plateformes"))}
              />
              <CheckboxField
                label="Autre"
                checked={modesPaiement.includes("autre")}
                onChange={() => setModesPaiement((p) => toggleInArray(p, "autre"))}
              />

              {modesPaiement.includes("autre") && (
                <Field
                  label="Précisez"
                  value={autresPaiementTexte}
                  onChange={setAutresPaiementTexte}
                  placeholder="ex.: Interac, etc."
                />
              )}
            </div>
          </section>

          {/* DÉPENSES / DÉCLENCHEURS */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Sections de dépenses utilisées</h2>
              <p>Ça sert à afficher uniquement les sections nécessaires.</p>
            </div>

            <div className="ff-stack">
              <CheckboxField label="Bureau à domicile" checked={bureauDomicile} onChange={setBureauDomicile} />
              <CheckboxField label="Véhicule (usage affaires)" checked={vehicule} onChange={setVehicule} />
              <CheckboxField label="Inventaire (produits)" checked={inventaire} onChange={setInventaire} />
              <CheckboxField label="Immobilisations (équipement)" checked={immobilisations} onChange={setImmobilisations} />
              <CheckboxField label="Sous-traitants" checked={sousTraitants} onChange={setSousTraitants} />
              <CheckboxField label="Employés" checked={employes} onChange={setEmployes} />
            </div>
          </section>

          {/* COMPTA */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Comptabilité</h2>
              <p>Info utile pour la préparation (et l’automatisation).</p>
            </div>

            <div className="ff-grid2">
              <SelectField<AccountingMethod>
                label="Méthode comptable"
                value={methodeComptable}
                onChange={setMethodeComptable}
                options={[
                  { value: "encaisse", label: "Encaisse" },
                  { value: "exercice", label: "Exercice" },
                ]}
              />

              <SelectField<AccountingTool>
                label="Outil utilisé"
                value={outilComptable}
                onChange={setOutilComptable}
                options={[
                  { value: "aucun", label: "Aucun" },
                  { value: "excel", label: "Excel" },
                  { value: "quickbooks", label: "QuickBooks" },
                  { value: "autre", label: "Autre" },
                ]}
              />

              <YesNoField
                name="compteBancaireSepare"
                label="Avez-vous un compte bancaire séparé pour l’activité ?"
                value={compteBancaireSepare}
                onChange={setCompteBancaireSepare}
              />
            </div>
          </section>

          {/* ACTIONS */}
          <div className="ff-submit">
            <div className="ff-row" style={{ gap: 10 }}>
              <button type="button" className="ff-btn ff-btn-outline" onClick={backToStep1}>
                ← Retour
              </button>

              <button type="button" className="ff-btn ff-btn-primary ff-btn-big" onClick={goNext} disabled={!fid || saving}>
                {lang === "fr" ? "Continuer →" : lang === "en" ? "Continue →" : "Continuar →"}
              </button>
            </div>

            <div className="ff-muted" style={{ marginTop: 10 }}>
              {fid ? `Dossier: ${fid}` : "fid manquant"}
              {saving ? " — sauvegarde…" : ""}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
