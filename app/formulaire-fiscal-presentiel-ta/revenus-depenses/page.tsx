"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

// ✅ CSS présentiel shared (stable)
import "@/app/formulaire-fiscal-presentiel/formulaire-fiscal-presentiel.css";

// ✅ Steps TA présentiel (dossier parent)
import Steps from "../Steps";

// ✅ UI shared présentiel (stable)
import {
  Field,
  YesNoField,
  SelectField,
  type YesNo,
} from "@/app/formulaire-fiscal-presentiel/ui";

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
  const err = e as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };
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

function formatMoneyInput(v: string) {
  const x = (v || "").replace(/[^\d.,]/g, "");
  return x.slice(0, 14);
}

function formatPercentInput(v: string) {
  const x = (v || "").replace(/[^\d]/g, "").slice(0, 3);
  return x;
}

/** ✅ CheckboxField local (tu l’utilises partout) */
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
   Types data (TA)
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

type Money = string;

type TAGeneralExpenses = {
  publicitePromotion?: Money;
  fraisJuridiques?: Money;
  fraisComptables?: Money;
  repasRepresentation?: Money;
  hebergement?: Money;
  voyage?: Money;
  stationnement?: Money;
  fournitures?: Money;
  assuranceResponsabilitePro?: Money;
  permisLicences?: Money;
  locationBureau?: Money;
  salairesSousTraitants?: Money;
  fraisFormationCongres?: Money;
  internetPartieAffaires?: Money;
  telephoneCellulairePartieAffaires?: Money;

  autres1Label?: string;
  autres1Montant?: Money;
  autres2Label?: string;
  autres2Montant?: Money;
  autres3Label?: string;
  autres3Montant?: Money;
};

type TAVehicule = {
  pctUtilisationAffaires?: string;
  marqueModele?: string;
  prixAchatAvantTaxes?: Money;
  valeurMarchande?: Money;
  prixDetailSuggere?: Money;

  carburant?: Money;
  assurances?: Money;
  entretienReparation?: Money;
  immatriculationPermis?: Money;
  interetsPretAuto?: Money;
  fraisLocation?: Money;
};

type TABureauDomicile = {
  pctUtilisationDomicile?: string;
  chauffageElectricite?: Money;
  assuranceHabitation?: Money;

  interetHypothecaire?: Money;
  amortissement?: Money;
  fraisCondo?: Money;
  taxesMunicipales?: Money;
  taxesScolaires?: Money;

  loyer?: Money;
};

type TAProfil = {
  nomCommercial?: string;
  neq?: string;
  dateDebut?: string;
  activitePrincipale?: string;

  inscritTPS?: YesNo;
  noTPS?: string;
  inscritTVQ?: YesNo;
  noTVQ?: string;
  aFactureTaxes?: YesNo;
  verifierObligation?: YesNo;

  typesRevenus?: RevenueType[];
  autresRevenusTexte?: string;
  modesPaiement?: PayMethod[];
  autresPaiementTexte?: string;

  inventaire?: boolean;
  immobilisations?: boolean;
  sousTraitants?: boolean;
  employes?: boolean;

  bureauDomicile?: boolean;
  vehicule?: boolean;
  depensesGenerales?: TAGeneralExpenses;
  vehiculeDetails?: TAVehicule;
  bureauDomicileDetails?: TABureauDomicile;

  methodeComptable?: AccountingMethod;
  outilComptable?: AccountingTool;
  compteBancaireSepare?: YesNo;
};

type Formdata = {
  dossierType?: string;
  taProfil?: TAProfil;
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

export default function FormulaireFiscalPresentielTAPage() {
  const params = useSearchParams();

  const lang = normalizeLang(params.get("lang"));
  const uid = params.get("uid"); // ✅ présentiel: on reçoit le userId via l’URL

  return <Inner userId={uid} lang={lang} />;
}

/* ===========================
   Inner (PRÉSENTIEL ADMIN)
   - ne filtre PAS sur user_id
   - charge/sauvegarde avec fid seulement
=========================== */

function Inner({ lang }: { lang: Lang }) {
  const router = useRouter();
  const params = useSearchParams();

  const fid = params.get("fid") || "";
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hydrating = useRef(false);
  const saveTimer = useRef<number | null>(null);

  // ---- states TA profil (profil de base)
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

  // ---- déclencheurs
  const [inventaire, setInventaire] = useState(false);
  const [immobilisations, setImmobilisations] = useState(false);
  const [sousTraitants, setSousTraitants] = useState(false);
  const [employes, setEmployes] = useState(false);

  // ---- sections détaillées (PDF)
  const [bureauDomicile, setBureauDomicile] = useState(false);
  const [vehicule, setVehicule] = useState(false);

  type DepenseSection = "bureau" | "vehicule";
  const [openDepense, setOpenDepense] = useState<DepenseSection | null>(null);

  useEffect(() => {
    if (!bureauDomicile && openDepense === "bureau") setOpenDepense(null);
    if (!vehicule && openDepense === "vehicule") setOpenDepense(null);
  }, [bureauDomicile, vehicule, openDepense]);

  // ---- Dépenses générales (PDF)
  const [gxPublicite, setGxPublicite] = useState("");
  const [gxJuridique, setGxJuridique] = useState("");
  const [gxComptables, setGxComptables] = useState("");
  const [gxRepas, setGxRepas] = useState("");
  const [gxHebergement, setGxHebergement] = useState("");
  const [gxVoyage, setGxVoyage] = useState("");
  const [gxStationnement, setGxStationnement] = useState("");
  const [gxFournitures, setGxFournitures] = useState("");
  const [gxAssPro, setGxAssPro] = useState("");
  const [gxPermis, setGxPermis] = useState("");
  const [gxLocationBureau, setGxLocationBureau] = useState("");
  const [gxSalairesSousTraitants, setGxSalairesSousTraitants] = useState("");
  const [gxFormationCongres, setGxFormationCongres] = useState("");
  const [gxInternet, setGxInternet] = useState("");
  const [gxCellulaire, setGxCellulaire] = useState("");
  const [gxAutre1Label, setGxAutre1Label] = useState("");
  const [gxAutre1Montant, setGxAutre1Montant] = useState("");
  const [gxAutre2Label, setGxAutre2Label] = useState("");
  const [gxAutre2Montant, setGxAutre2Montant] = useState("");
  const [gxAutre3Label, setGxAutre3Label] = useState("");
  const [gxAutre3Montant, setGxAutre3Montant] = useState("");

  // ---- Véhicule (PDF)
  const [vehPct, setVehPct] = useState("");
  const [vehMarqueModele, setVehMarqueModele] = useState("");
  const [vehPrixAchat, setVehPrixAchat] = useState("");
  const [vehValeurMarchande, setVehValeurMarchande] = useState("");
  const [vehPrixDetail, setVehPrixDetail] = useState("");
  const [vehCarburant, setVehCarburant] = useState("");
  const [vehAssurances, setVehAssurances] = useState("");
  const [vehEntretien, setVehEntretien] = useState("");
  const [vehImmat, setVehImmat] = useState("");
  const [vehInterets, setVehInterets] = useState("");
  const [vehLocation, setVehLocation] = useState("");

  // ---- Bureau à domicile (PDF)
  const [bdPct, setBdPct] = useState("");
  const [bdChauffElec, setBdChauffElec] = useState("");
  const [bdAssHab, setBdAssHab] = useState("");
  const [bdInteretHyp, setBdInteretHyp] = useState("");
  const [bdAmort, setBdAmort] = useState("");
  const [bdCondo, setBdCondo] = useState("");
  const [bdTaxMun, setBdTaxMun] = useState("");
  const [bdTaxSco, setBdTaxSco] = useState("");
  const [bdLoyer, setBdLoyer] = useState("");

  // ---- Comptabilité
  const [methodeComptable, setMethodeComptable] = useState<AccountingMethod>("");
  const [outilComptable, setOutilComptable] = useState<AccountingTool>("");
  const [compteBancaireSepare, setCompteBancaireSepare] = useState<YesNo>("");

  // ✅ si fid absent, on affiche un message (après hooks)
  if (!fid) {
    return (
      <main className="ff-bg">
        <div className="ff-container">
          <div className="ff-card" style={{ padding: 14 }}>
            ❌ fid manquant dans l’URL. Ouvre ce dossier depuis l’admin.
          </div>
        </div>
      </main>
    );
  }

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

      inventaire,
      immobilisations,
      sousTraitants,
      employes,

      bureauDomicile,
      vehicule,

      depensesGenerales: {
        publicitePromotion: gxPublicite.trim(),
        fraisJuridiques: gxJuridique.trim(),
        fraisComptables: gxComptables.trim(),
        repasRepresentation: gxRepas.trim(),
        hebergement: gxHebergement.trim(),
        voyage: gxVoyage.trim(),
        stationnement: gxStationnement.trim(),
        fournitures: gxFournitures.trim(),
        assuranceResponsabilitePro: gxAssPro.trim(),
        permisLicences: gxPermis.trim(),
        locationBureau: gxLocationBureau.trim(),
        salairesSousTraitants: gxSalairesSousTraitants.trim(),
        fraisFormationCongres: gxFormationCongres.trim(),
        internetPartieAffaires: gxInternet.trim(),
        telephoneCellulairePartieAffaires: gxCellulaire.trim(),
        autres1Label: gxAutre1Label.trim(),
        autres1Montant: gxAutre1Montant.trim(),
        autres2Label: gxAutre2Label.trim(),
        autres2Montant: gxAutre2Montant.trim(),
        autres3Label: gxAutre3Label.trim(),
        autres3Montant: gxAutre3Montant.trim(),
      },

      vehiculeDetails: {
        pctUtilisationAffaires: vehPct.trim(),
        marqueModele: vehMarqueModele.trim(),
        prixAchatAvantTaxes: vehPrixAchat.trim(),
        valeurMarchande: vehValeurMarchande.trim(),
        prixDetailSuggere: vehPrixDetail.trim(),
        carburant: vehCarburant.trim(),
        assurances: vehAssurances.trim(),
        entretienReparation: vehEntretien.trim(),
        immatriculationPermis: vehImmat.trim(),
        interetsPretAuto: vehInterets.trim(),
        fraisLocation: vehLocation.trim(),
      },

      bureauDomicileDetails: {
        pctUtilisationDomicile: bdPct.trim(),
        chauffageElectricite: bdChauffElec.trim(),
        assuranceHabitation: bdAssHab.trim(),
        interetHypothecaire: bdInteretHyp.trim(),
        amortissement: bdAmort.trim(),
        fraisCondo: bdCondo.trim(),
        taxesMunicipales: bdTaxMun.trim(),
        taxesScolaires: bdTaxSco.trim(),
        loyer: bdLoyer.trim(),
      },

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
      inventaire,
      immobilisations,
      sousTraitants,
      employes,
      bureauDomicile,
      vehicule,
      gxPublicite,
      gxJuridique,
      gxComptables,
      gxRepas,
      gxHebergement,
      gxVoyage,
      gxStationnement,
      gxFournitures,
      gxAssPro,
      gxPermis,
      gxLocationBureau,
      gxSalairesSousTraitants,
      gxFormationCongres,
      gxInternet,
      gxCellulaire,
      gxAutre1Label,
      gxAutre1Montant,
      gxAutre2Label,
      gxAutre2Montant,
      gxAutre3Label,
      gxAutre3Montant,
      vehPct,
      vehMarqueModele,
      vehPrixAchat,
      vehValeurMarchande,
      vehPrixDetail,
      vehCarburant,
      vehAssurances,
      vehEntretien,
      vehImmat,
      vehInterets,
      vehLocation,
      bdPct,
      bdChauffElec,
      bdAssHab,
      bdInteretHyp,
      bdAmort,
      bdCondo,
      bdTaxMun,
      bdTaxSco,
      bdLoyer,
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

      setInventaire(!!ta.inventaire);
      setImmobilisations(!!ta.immobilisations);
      setSousTraitants(!!ta.sousTraitants);
      setEmployes(!!ta.employes);

      setBureauDomicile(!!ta.bureauDomicile);
      setVehicule(!!ta.vehicule);

      const gx = ta.depensesGenerales ?? {};
      setGxPublicite(gx.publicitePromotion ?? "");
      setGxJuridique(gx.fraisJuridiques ?? "");
      setGxComptables(gx.fraisComptables ?? "");
      setGxRepas(gx.repasRepresentation ?? "");
      setGxHebergement(gx.hebergement ?? "");
      setGxVoyage(gx.voyage ?? "");
      setGxStationnement(gx.stationnement ?? "");
      setGxFournitures(gx.fournitures ?? "");
      setGxAssPro(gx.assuranceResponsabilitePro ?? "");
      setGxPermis(gx.permisLicences ?? "");
      setGxLocationBureau(gx.locationBureau ?? "");
      setGxSalairesSousTraitants(gx.salairesSousTraitants ?? "");
      setGxFormationCongres(gx.fraisFormationCongres ?? "");
      setGxInternet(gx.internetPartieAffaires ?? "");
      setGxCellulaire(gx.telephoneCellulairePartieAffaires ?? "");
      setGxAutre1Label(gx.autres1Label ?? "");
      setGxAutre1Montant(gx.autres1Montant ?? "");
      setGxAutre2Label(gx.autres2Label ?? "");
      setGxAutre2Montant(gx.autres2Montant ?? "");
      setGxAutre3Label(gx.autres3Label ?? "");
      setGxAutre3Montant(gx.autres3Montant ?? "");

      const vv = ta.vehiculeDetails ?? {};
      setVehPct(vv.pctUtilisationAffaires ?? "");
      setVehMarqueModele(vv.marqueModele ?? "");
      setVehPrixAchat(vv.prixAchatAvantTaxes ?? "");
      setVehValeurMarchande(vv.valeurMarchande ?? "");
      setVehPrixDetail(vv.prixDetailSuggere ?? "");
      setVehCarburant(vv.carburant ?? "");
      setVehAssurances(vv.assurances ?? "");
      setVehEntretien(vv.entretienReparation ?? "");
      setVehImmat(vv.immatriculationPermis ?? "");
      setVehInterets(vv.interetsPretAuto ?? "");
      setVehLocation(vv.fraisLocation ?? "");

      const bd = ta.bureauDomicileDetails ?? {};
      setBdPct(bd.pctUtilisationDomicile ?? "");
      setBdChauffElec(bd.chauffageElectricite ?? "");
      setBdAssHab(bd.assuranceHabitation ?? "");
      setBdInteretHyp(bd.interetHypothecaire ?? "");
      setBdAmort(bd.amortissement ?? "");
      setBdCondo(bd.fraisCondo ?? "");
      setBdTaxMun(bd.taxesMunicipales ?? "");
      setBdTaxSco(bd.taxesScolaires ?? "");
      setBdLoyer(bd.loyer ?? "");

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
      const { data: row, error: e1 } = await supabase
        .from(FORMS_TABLE)
        .select("data")
        .eq("id", fid)
        .eq("user_id", userId)
        .maybeSingle<{ data: Formdata | null }>();

      if (e1) throw new Error(supaErr(e1));

      const current = (row?.data ?? {}) as Formdata;

      // ✅ on garde le reste de "data" intact
      const merged: Formdata = {
        ...current,
        dossierType: current.dossierType ?? "autonome",
        taProfil: taProfilDraft,
      };

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

  // ✅ PRÉSENTIEL: on saute directement à /envoyer
  const goNext = useCallback(async () => {
    try {
      setMsg("⏳ Enregistrement…");
      await saveDraft();
      setMsg(null);

      router.push(
        `/formulaire-fiscal-presentiel-ta/envoyer?fid=${encodeURIComponent(
          fid
        )}&lang=${encodeURIComponent(lang)}`
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erreur.";
      setMsg("❌ " + message);
    }
  }, [fid, lang, router, saveDraft]);

  // ✅ PRÉSENTIEL: retour sur ta page admin
  const backToAdmin = useCallback(() => {
    router.push(`/admin/presentiel?flow=ta&lang=${encodeURIComponent(lang)}`);
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
              <span>Formulaire fiscal — Travailleur autonome (présentiel)</span>
            </div>
          </div>

          <button className="ff-btn ff-btn-outline" type="button" onClick={logout}>
            Se déconnecter
          </button>
        </header>

        <div className="ff-title">
          <h1>Profil & activité — Travailleur autonome</h1>
          <p>Présentiel : on remplit ici, puis on passe directement à “Envoyer”.</p>
        </div>

        {msg && (
          <div className="ff-card" style={{ padding: 14 }}>
            {msg}
          </div>
        )}

        {/* ✅ PRÉSENTIEL : 2 étapes seulement */}
        <Steps step={1} lang={lang} flow="ta" />

        <div className="ff-form">
          {/* IDENTITÉ ACTIVITÉ */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Identification de l’activité</h2>
              <p>Décris ton activité de travailleur autonome.</p>
            </div>

            <div className="ff-grid2">
              <Field
                label="Nom commercial (si applicable)"
                value={nomCommercial}
                onChange={setNomCommercial}
              />
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
                <Field
                  label="Numéro TPS"
                  value={noTPS}
                  onChange={setNoTPS}
                  placeholder="ex.: 12345 6789 RT0001"
                />
              )}

              <YesNoField
                name="inscritTVQ"
                label="Êtes-vous inscrit(e) à la TVQ ?"
                value={inscritTVQ}
                onChange={setInscritTVQ}
              />
              {inscritTVQ === "oui" && (
                <Field
                  label="Numéro TVQ"
                  value={noTVQ}
                  onChange={setNoTVQ}
                  placeholder="ex.: 1234567890 TQ0001"
                />
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
                <Field label="Précisez" value={autresPaiementTexte} onChange={setAutresPaiementTexte} />
              )}
            </div>
          </section>

          {/* DÉPENSES */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Dépenses</h2>
              <p>Montants totaux payés dans l’année (d’après le questionnaire).</p>
            </div>

            <div className="ff-card" style={{ padding: 12, marginBottom: 12 }}>
              <div className="ff-muted" style={{ marginBottom: 10 }}>
                Dépenses générales
              </div>

              <div className="ff-grid2">
                <Field
                  label="Publicité et promotion ($)"
                  value={gxPublicite}
                  onChange={(v) => setGxPublicite(formatMoneyInput(v))}
                  inputMode="decimal"
                />
                <Field
                  label="Frais juridiques et autres honoraires professionnels ($)"
                  value={gxJuridique}
                  onChange={(v) => setGxJuridique(formatMoneyInput(v))}
                  inputMode="decimal"
                />
                <Field
                  label="Frais comptables ($)"
                  value={gxComptables}
                  onChange={(v) => setGxComptables(formatMoneyInput(v))}
                  inputMode="decimal"
                />
                <Field
                  label="Frais de repas et de représentation ($)"
                  value={gxRepas}
                  onChange={(v) => setGxRepas(formatMoneyInput(v))}
                  inputMode="decimal"
                />
                <Field
                  label="Hébergement (ex.: chambre d'hôtel) ($)"
                  value={gxHebergement}
                  onChange={(v) => setGxHebergement(formatMoneyInput(v))}
                  inputMode="decimal"
                />
                <Field
                  label="Frais de voyage (avion/autocar/train) ($)"
                  value={gxVoyage}
                  onChange={(v) => setGxVoyage(formatMoneyInput(v))}
                  inputMode="decimal"
                />
                <Field
                  label="Frais de stationnement ($)"
                  value={gxStationnement}
                  onChange={(v) => setGxStationnement(formatMoneyInput(v))}
                  inputMode="decimal"
                />
                <Field
                  label="Fournitures (poste/papeterie/encre, etc.) ($)"
                  value={gxFournitures}
                  onChange={(v) => setGxFournitures(formatMoneyInput(v))}
                  inputMode="decimal"
                />
                <Field
                  label="Assurance responsabilité professionnelle ($)"
                  value={gxAssPro}
                  onChange={(v) => setGxAssPro(formatMoneyInput(v))}
                  inputMode="decimal"
                />
                <Field
                  label="Permis et licence ($)"
                  value={gxPermis}
                  onChange={(v) => setGxPermis(formatMoneyInput(v))}
                  inputMode="decimal"
                />
                <Field
                  label="Location de bureau (loyer commercial) ($)"
                  value={gxLocationBureau}
                  onChange={(v) => setGxLocationBureau(formatMoneyInput(v))}
                  inputMode="decimal"
                />
                <Field
                  label="Salaires et sous-traitants ($)"
                  value={gxSalairesSousTraitants}
                  onChange={(v) => setGxSalairesSousTraitants(formatMoneyInput(v))}
                  inputMode="decimal"
                />
                <Field
                  label="Frais de formation et de congrès ($)"
                  value={gxFormationCongres}
                  onChange={(v) => setGxFormationCongres(formatMoneyInput(v))}
                  inputMode="decimal"
                />
                <Field
                  label="Internet (partie affaires seulement) ($)"
                  value={gxInternet}
                  onChange={(v) => setGxInternet(formatMoneyInput(v))}
                  inputMode="decimal"
                />
                <Field
                  label="Téléphone cellulaire (partie affaires seulement) ($)"
                  value={gxCellulaire}
                  onChange={(v) => setGxCellulaire(formatMoneyInput(v))}
                  inputMode="decimal"
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <div className="ff-muted" style={{ marginBottom: 8 }}>
                  Autres (précisez)
                </div>

                <div className="ff-grid2">
                  <Field label="Autre 1 — libellé" value={gxAutre1Label} onChange={setGxAutre1Label} />
                  <Field
                    label="Autre 1 — montant ($)"
                    value={gxAutre1Montant}
                    onChange={(v) => setGxAutre1Montant(formatMoneyInput(v))}
                    inputMode="decimal"
                  />
                  <Field label="Autre 2 — libellé" value={gxAutre2Label} onChange={setGxAutre2Label} />
                  <Field
                    label="Autre 2 — montant ($)"
                    value={gxAutre2Montant}
                    onChange={(v) => setGxAutre2Montant(formatMoneyInput(v))}
                    inputMode="decimal"
                  />
                  <Field label="Autre 3 — libellé" value={gxAutre3Label} onChange={setGxAutre3Label} />
                  <Field
                    label="Autre 3 — montant ($)"
                    value={gxAutre3Montant}
                    onChange={(v) => setGxAutre3Montant(formatMoneyInput(v))}
                    inputMode="decimal"
                  />
                </div>
              </div>
            </div>

            <div className="ff-stack">
              <div>
                <CheckboxField label="Bureau à domicile" checked={bureauDomicile} onChange={setBureauDomicile} />

                {bureauDomicile && (
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="ff-btn ff-btn-outline"
                      style={{
                        width: "100%",
                        justifyContent: "space-between",
                        display: "flex",
                      }}
                      onClick={() => setOpenDepense((p) => (p === "bureau" ? null : "bureau"))}
                    >
                      <span>Bureau à domicile</span>
                      <span>{openDepense === "bureau" ? "▲" : "▼"}</span>
                    </button>

                    {openDepense === "bureau" && (
                      <div className="ff-card" style={{ marginTop: 10, padding: 12 }}>
                        <div className="ff-grid2">
                          <Field
                            label="% utilisation du domicile (affaires)"
                            value={bdPct}
                            onChange={(v) => setBdPct(formatPercentInput(v))}
                            inputMode="numeric"
                          />
                          <div />

                          <Field
                            label="Chauffage et électricité ($)"
                            value={bdChauffElec}
                            onChange={(v) => setBdChauffElec(formatMoneyInput(v))}
                            inputMode="decimal"
                          />
                          <Field
                            label="Assurance habitation ($)"
                            value={bdAssHab}
                            onChange={(v) => setBdAssHab(formatMoneyInput(v))}
                            inputMode="decimal"
                          />
                          <Field
                            label="Intérêt hypothécaire ($)"
                            value={bdInteretHyp}
                            onChange={(v) => setBdInteretHyp(formatMoneyInput(v))}
                            inputMode="decimal"
                          />
                          <Field
                            label="Amortissement ($)"
                            value={bdAmort}
                            onChange={(v) => setBdAmort(formatMoneyInput(v))}
                            inputMode="decimal"
                          />
                          <Field
                            label="Frais de condo ($)"
                            value={bdCondo}
                            onChange={(v) => setBdCondo(formatMoneyInput(v))}
                            inputMode="decimal"
                          />
                          <Field
                            label="Taxes municipales ($)"
                            value={bdTaxMun}
                            onChange={(v) => setBdTaxMun(formatMoneyInput(v))}
                            inputMode="decimal"
                          />
                          <Field
                            label="Taxes scolaires ($)"
                            value={bdTaxSco}
                            onChange={(v) => setBdTaxSco(formatMoneyInput(v))}
                            inputMode="decimal"
                          />
                          <Field
                            label="Loyer ($) (si locataire)"
                            value={bdLoyer}
                            onChange={(v) => setBdLoyer(formatMoneyInput(v))}
                            inputMode="decimal"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <CheckboxField label="Véhicule (usage affaires)" checked={vehicule} onChange={setVehicule} />

                {vehicule && (
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="ff-btn ff-btn-outline"
                      style={{
                        width: "100%",
                        justifyContent: "space-between",
                        display: "flex",
                      }}
                      onClick={() => setOpenDepense((p) => (p === "vehicule" ? null : "vehicule"))}
                    >
                      <span>Frais de véhicule</span>
                      <span>{openDepense === "vehicule" ? "▲" : "▼"}</span>
                    </button>

                    {openDepense === "vehicule" && (
                      <div className="ff-card" style={{ marginTop: 10, padding: 12 }}>
                        <div className="ff-grid2">
                          <Field
                            label="% utilisation du véhicule (affaires)"
                            value={vehPct}
                            onChange={(v) => setVehPct(formatPercentInput(v))}
                            inputMode="numeric"
                          />
                          <Field label="Marque et modèle" value={vehMarqueModele} onChange={setVehMarqueModele} />

                          <Field
                            label="Prix d’achat avant taxes ($) (si acheté)"
                            value={vehPrixAchat}
                            onChange={(v) => setVehPrixAchat(formatMoneyInput(v))}
                            inputMode="decimal"
                          />
                          <Field
                            label="Valeur marchande approx ($) (sinon)"
                            value={vehValeurMarchande}
                            onChange={(v) => setVehValeurMarchande(formatMoneyInput(v))}
                            inputMode="decimal"
                          />

                          <Field
                            label="Prix de détail suggéré (approx) ($) (si loué)"
                            value={vehPrixDetail}
                            onChange={(v) => setVehPrixDetail(formatMoneyInput(v))}
                            inputMode="decimal"
                          />
                          <div />

                          <Field
                            label="Frais de carburant ($)"
                            value={vehCarburant}
                            onChange={(v) => setVehCarburant(formatMoneyInput(v))}
                            inputMode="decimal"
                          />
                          <Field
                            label="Assurances ($)"
                            value={vehAssurances}
                            onChange={(v) => setVehAssurances(formatMoneyInput(v))}
                            inputMode="decimal"
                          />
                          <Field
                            label="Entretien et réparation ($)"
                            value={vehEntretien}
                            onChange={(v) => setVehEntretien(formatMoneyInput(v))}
                            inputMode="decimal"
                          />
                          <Field
                            label="Immatriculation et permis ($)"
                            value={vehImmat}
                            onChange={(v) => setVehImmat(formatMoneyInput(v))}
                            inputMode="decimal"
                          />
                          <Field
                            label="Intérêts prêt auto ($) (pas les mensualités)"
                            value={vehInterets}
                            onChange={(v) => setVehInterets(formatMoneyInput(v))}
                            inputMode="decimal"
                          />
                          <Field
                            label="Frais de location ($)"
                            value={vehLocation}
                            onChange={(v) => setVehLocation(formatMoneyInput(v))}
                            inputMode="decimal"
                          />
                          <div />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <CheckboxField label="Inventaire (produits)" checked={inventaire} onChange={setInventaire} />
              <CheckboxField
                label="Immobilisations (équipement)"
                checked={immobilisations}
                onChange={setImmobilisations}
              />
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
              <button type="button" className="ff-btn ff-btn-outline" onClick={backToAdmin}>
                ← Retour admin
              </button>

              <button
                type="button"
                className="ff-btn ff-btn-primary ff-btn-big"
                onClick={goNext}
                disabled={!fid || saving}
              >
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
