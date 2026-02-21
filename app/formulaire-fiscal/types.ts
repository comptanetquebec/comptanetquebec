// =============================
// LANG
// =============================
export type Lang = "fr" | "en" | "es";

// =============================
// BASE
// =============================
export type ProvinceCode =
  | "QC" | "ON" | "NB" | "NS" | "PE" | "NL"
  | "MB" | "SK" | "AB" | "BC" | "YT" | "NT" | "NU";

export type Sexe = "M" | "F" | "X" | "";

export type AssuranceMeds = "ramq" | "prive" | "conjoint" | "";

export type CopieImpots = "espaceClient" | "courriel" | "";

export type EtatCivil =
  | "celibataire"
  | "conjointDefait"
  | "marie"
  | "separe"
  | "divorce"
  | "veuf"
  | "";

// YES / NO
export type YesNo = "yes" | "no" | "";

// =============================
// STRUCTURES
// =============================
export type Periode = {
  debut: string;
  fin: string;
};

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

// =============================
// DATABASE TYPES
// =============================
export type FormTypeDb = "T1" | "T2";

export type InsertIdRow = {
  id: string;
};

// =============================
// FORM DATA (STRUCTURÉ)
// =============================
export type FormClientdata = {
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

export type FormConjointdata = {
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

export type FormMedsdata = {
  client?: {
    regime?: AssuranceMeds;
    periodes?: Periode[];
  };
  conjoint?: {
    regime?: AssuranceMeds;
    periodes?: Periode[];
  } | null;
};

export type FormQuestionsdata = {
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

export type FormValidations = {
  exactitudeInfo?: boolean;
  dossierComplet?: boolean;
  fraisVariables?: boolean;
  delaisSiManquant?: boolean;
};

// =============================
// GLOBAL FORM
// =============================
export type Formdata = {
  dossierType?: string;

  client?: FormClientdata;

  conjoint?: FormConjointdata | null;

  assuranceMedicamenteuse?: FormMedsdata | null;

  personnesACharge?: Child[];

  questionsGenerales?: FormQuestionsdata;

  validations?: FormValidations;
};

// =============================
// TABLE ROW
// =============================
export type FormRow = {
  id: string;
  user_id?: string;

  form_type?: FormTypeDb;

  lang?: string;
  status?: string;

  annee?: string | null;

  data: Formdata | null;

  created_at: string;
};
