// app/formulaire-fiscal/types.ts
export type Lang = "fr" | "en" | "es";

export type ProvinceCode =
  | "QC" | "ON" | "NB" | "NS" | "PE" | "NL" | "MB" | "SK" | "AB" | "BC" | "YT" | "NT" | "NU";

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

export type Periode = { debut: string; fin: string };

export type Child = { prenom: string; nom: string; dob: string; nas: string; sexe: Sexe };

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
