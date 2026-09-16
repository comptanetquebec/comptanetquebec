/* ============================================================
   TRAVAILLEUR AUTONOME
============================================================ */

export type FormTravailleurAutonomeData = {
  actif?: boolean;

  /* Activité */
  nomEntreprise?: string;
  descriptionActivite?: string;
  dateDebutActivite?: string;

  /* Revenus */
  revenus?: string;

  /* TPS / TVQ */
  inscritTPS?: boolean;
  inscritTVQ?: boolean;
  numeroTPS?: string;
  numeroTVQ?: string;

  /* Dépenses */
  depenses?: string;

  publicite?: string;
  repasRepresentation?: string;
  assurances?: string;
  interetsFraisBancaires?: string;
  fraisBureau?: string;
  fournitures?: string;
  honorairesProfessionnels?: string;
  telephoneInternet?: string;
  sousTraitance?: string;
  salaires?: string;
  loyers?: string;
  entretienReparations?: string;
  deplacements?: string;
  autresDepenses?: string;
  autresDepensesDescription?: string;

  /* Véhicule */
  utiliseVehicule?: boolean;
  kmTotal?: string;
  kmAffaires?: string;
  carburant?: string;
  assuranceAuto?: string;
  immatriculation?: string;
  entretienAuto?: string;
  interetsAuto?: string;
  locationAuto?: string;

  /* Bureau à domicile */
  bureauDomicile?: boolean;
  superficieBureau?: string;
  superficieResidence?: string;
  loyerResidence?: string;
  interetsHypothecaires?: string;
  taxesMunicipales?: string;
  assuranceHabitation?: string;
  electriciteChauffage?: string;
  entretienResidence?: string;

  /* Informations complémentaires */
  employes?: boolean;
  sousTraitants?: boolean;
  achatsEquipements?: boolean;
  detailsEquipements?: string;
};


/* ============================================================
   REVENUS LOCATIFS
============================================================ */

export type FormRevenusLocatifsData = {
  actif?: boolean;

  /* Immeuble */
  adresse?: string;
  ville?: string;
  province?: ProvinceCode;
  codePostal?: string;
  typeImmeuble?: string;
  nombreUnites?: string;

  /* Propriété */
  pourcentagePropriete?: string;
  coproprietaires?: boolean;
  detailsCoproprietaires?: string;

  /* Usage personnel */
  habiteImmeuble?: boolean;
  pourcentagePersonnel?: string;

  /* Acquisition */
  dateAcquisition?: string;

  /* Revenus */
  revenus?: string;

  /* Dépenses */
  depenses?: string;

  taxesMunicipales?: string;
  taxesScolaires?: string;
  assurances?: string;
  interetsHypothecaires?: string;
  entretienReparations?: string;
  electricite?: string;
  chauffage?: string;
  eau?: string;
  publicite?: string;
  fraisGestion?: string;
  honorairesProfessionnels?: string;
  fraisBancaires?: string;
  autresDepenses?: string;
  autresDepensesDescription?: string;

  /* Travaux / immobilisations */
  renovationsImportantes?: boolean;
  detailsRenovations?: string;
  achatsEquipements?: boolean;
  detailsEquipements?: string;
};
