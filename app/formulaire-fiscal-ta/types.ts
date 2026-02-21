// app/formulaire-fiscal-ta/types.ts

export type Lang = "fr" | "en" | "es";

export type ProvinceCode =
  | "QC" | "ON" | "NB" | "NS" | "PE" | "NL" | "MB" | "SK" | "AB" | "BC" | "YT" | "NT" | "NU";

export type Sexe = "M" | "F" | "X" | "";
export type AssuranceMeds = "ramq" | "prive" | "conjoint" | "";
export type CopieImpots = "espaceClient" | "courriel" | "";

// ✅ Yes/No standardisé (comme ton YesNoField)
export type YesNo = "yes" | "no" | "";

export type EtatCivil =
  | "celibataire"
  | "conjointDefait"
  | "marie"
  | "separe"
  | "divorce"
  | "veuf"
  | "";

export type Periode = { debut: string; fin: string };

export type Child = {
  prenom: string;
  nom: string;
  dob: string;
  nas: string;
  sexe: Sexe;
};

export type DocRow = {
  id: string;
  formulaire_id: string;
  user_id: string;
  original_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

/* ===================== DONNÉES FORMULAIRES ===================== */

export type FormClientData = {
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

export type FormConjointData = {
  // ✅ IMPORTANT: tu l’as dans SpouseSection
  aUnConjoint?: boolean;

  traiterConjoint?: boolean;
  revenuNetConjoint?: string;

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
};

export type FormMedsData = {
  client?: { regime?: AssuranceMeds; periodes?: Periode[] };
  conjoint?: { regime?: AssuranceMeds; periodes?: Periode[] } | null;
};

export type FormQuestionsData = {
  anneeImposition?: string;

  habiteSeulTouteAnnee?: YesNo;
  nbPersonnesMaison3112?: string;

  biensEtranger100k?: YesNo;
  citoyenCanadien?: YesNo;
  nonResident?: YesNo;
  maisonAcheteeOuVendue?: YesNo;
  appelerTechnicien?: YesNo;

  copieImpots?: CopieImpots;
};

/* ===================== TA - STEP 2 (REVENU & DÉPENSES) ===================== */

// ✅ Simple version (comme ton copy.ts TA). Tu peux étendre après.
export type TravailAutonomeData = {
  activiteDesc?: string;

  nomEntreprise?: string;
  numeroEntreprise?: string; // NEQ/BN si tu veux
  secteur?: string;

  inscritTpsTvq?: YesNo;

  revenusTotalApprox?: string;
  depensesTotalApprox?: string;

  // Optionnel si tu veux ventiler plus tard :
  // revenus?: { categorie: string; montant: string }[];
  // depenses?: { categorie: string; montant: string }[];
};

/* ===================== CONFIRMATIONS ===================== */

export type ValidationsData = {
  exactitudeInfo?: boolean;
  dossierComplet?: boolean;
  fraisVariables?: boolean;
  delaisSiManquant?: boolean;
};

export type FormDataTA = {
  dossierType?: "ta" | string;

  client?: FormClientData;
  conjoint?: FormConjointData | null;

  assuranceMedicamenteuse?: FormMedsData | null;

  personnesACharge?: Child[];

  questionsGenerales?: FormQuestionsData;

  travailAutonome?: TravailAutonomeData;

  validations?: ValidationsData;
};

export type FormRow = {
  id: string;
  user_id?: string;
  form_type?: string; // ex: "ta"
  lang?: Lang | string;
  status?: string;
  annee?: string | null;
  data: FormDataTA | null;
  created_at: string;
};

export type InsertIdRow = { id: string };
