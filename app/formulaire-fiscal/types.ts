// app/formulaire-fiscal/types.ts

export type Lang = "fr" | "en" | "es";

export type ProvinceCode =
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

export type Sexe = "M" | "F" | "X" | "";

export type AssuranceMeds =
  | "ramq"
  | "prive"
  | "conjoint"
  | "";

export type CopieImpots =
  | "espaceClient"
  | "courriel"
  | "";

export type AvisCotisation =
  | "poste"
  | "gouvernement"
  | "";

export type EtatCivil =
  | "celibataire"
  | "conjointDefait"
  | "marie"
  | "separe"
  | "divorce"
  | "veuf"
  | "";

/* ============================================================
   HANDICAP / DÉFICIENCE
============================================================ */

export type T2201Statut =
  | ""
  | "approuve"
  | "attente"
  | "non"
  | "inconnu";

/* ============================================================
   PÉRIODES
============================================================ */

export type Periode = {
  debut: string;
  fin: string;
};

/* ============================================================
   PERSONNES À CHARGE
============================================================ */

export type Child = {
  prenom: string;
  nom: string;
  dob: string;
  nas: string;
  sexe: Sexe;

  /*
    Travail / revenu
    Optionnels pour conserver la compatibilité
    avec les anciens dossiers.
  */
  aTravaille?: boolean;
  revenuTravailEstime?: string;

  /*
    Handicap / déficience
  */
  handicap?: boolean;
  t2201Statut?: T2201Statut;
};

/* ============================================================
   DOCUMENTS
============================================================ */

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

/* ============================================================
   FORM DATA — JSON ENREGISTRÉ EN BASE DE DONNÉES
============================================================ */

/* ---------------- CLIENT ---------------- */

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

  adresse?: string;
  app?: string;
  ville?: string;
  province?: ProvinceCode;
  codePostal?: string;

  courriel?: string;

  /*
    Handicap / déficience
  */
  handicap?: boolean;
  t2201Statut?: T2201Statut;
};

/* ---------------- CONJOINT ---------------- */

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

  /*
    Handicap / déficience
  */
  handicapConjoint?: boolean;
  t2201StatutConjoint?: T2201Statut;
};

/* ---------------- ASSURANCE MÉDICAMENTS ---------------- */

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

/* ---------------- QUESTIONS GÉNÉRALES ---------------- */

export type FormQuestionsdata = {
  habiteSeulTouteAnnee?: string;

  nbPersonnesMaison3112?: string;

  biensEtranger100k?: string;

  citoyenCanadien?: string;

  nonResident?: string;

  maisonAcheteeOuVendue?: string;

  appelerTechnicien?: string;

  copieImpots?: CopieImpots;

  avisCotisation?: AvisCotisation;

  anneeImposition?: string;

  aucunePersonneACharge?: boolean;
};

/* ---------------- VALIDATIONS CLIENT ---------------- */

export type FormValidationsdata = {
  exactitudeInfo?: boolean;

  dossierComplet?: boolean;

  fraisVariables?: boolean;

  delaisSiManquant?: boolean;

  consentement?: boolean;
};

/* ============================================================
   FORMULAIRE COMPLET
============================================================ */

export type Formdata = {
  dossierType?: string;

  client?: FormClientdata;

  conjoint?: FormConjointdata | null;

  assuranceMedicamenteuse?: FormMedsdata | null;

  /*
    Chaque personne à charge peut contenir :
    - travail / revenu estimé
    - handicap / déficience
    - statut T2201
  */
  personnesACharge?: Child[];

  questionsGenerales?: FormQuestionsdata;

  validations?: FormValidationsdata;
};

/* ============================================================
   LIGNE FORMULAIRE — BASE DE DONNÉES
============================================================ */

export type FormRow = {
  id: string;

  user_id?: string;

  form_type?: string;

  lang?: string;

  status?: string;

  annee?: string | null;

  data: Formdata | null;

  created_at: string;
};

export type InsertIdRow = {
  id: string;
};

/* ============================================================
   STATUTS UI
   VERT / ROUGE / ORANGE
============================================================ */

export type Mark =
  | "ok"
  | "bad"
  | "warn";

export type BlockMark = {
  mark: Mark;
  reason?: string;
};

export type FormBlocksStatus = {
  client: BlockMark;

  spouse: BlockMark;

  meds: BlockMark;

  dependants: BlockMark;

  questions: BlockMark;

  confirms: BlockMark;
};
