"use client";

import React from "react";

type BoolChoice = boolean | undefined;

type Lang = "fr" | "en" | "es";

type Props = {
  lang: Lang;
  actif: boolean;
  setActif: (v: boolean) => void;

  nomEntreprise: string;
  setNomEntreprise: (v: string) => void;
  descriptionActivite: string;
  setDescriptionActivite: (v: string) => void;
  dateDebutActivite: string;
  setDateDebutActivite: (v: string) => void;

  revenus: string;
  setRevenus: (v: string) => void;

  inscritTPS: BoolChoice;
  setInscritTPS: (v: BoolChoice) => void;
  inscritTVQ: BoolChoice;
  setInscritTVQ: (v: BoolChoice) => void;
  numeroTPS: string;
  setNumeroTPS: (v: string) => void;
  numeroTVQ: string;
  setNumeroTVQ: (v: string) => void;

  depenses: string;
  setDepenses: (v: string) => void;
  publicite: string;
  setPublicite: (v: string) => void;
  repasRepresentation: string;
  setRepasRepresentation: (v: string) => void;
  assurances: string;
  setAssurances: (v: string) => void;
  interetsFraisBancaires: string;
  setInteretsFraisBancaires: (v: string) => void;
  fraisBureau: string;
  setFraisBureau: (v: string) => void;
  fournitures: string;
  setFournitures: (v: string) => void;
  honorairesProfessionnels: string;
  setHonorairesProfessionnels: (v: string) => void;
  telephoneInternet: string;
  setTelephoneInternet: (v: string) => void;
  sousTraitance: string;
  setSousTraitance: (v: string) => void;
  salaires: string;
  setSalaires: (v: string) => void;
  loyers: string;
  setLoyers: (v: string) => void;
  entretienReparations: string;
  setEntretienReparations: (v: string) => void;
  deplacements: string;
  setDeplacements: (v: string) => void;
  autresDepenses: string;
  setAutresDepenses: (v: string) => void;
  autresDepensesDescription: string;
  setAutresDepensesDescription: (v: string) => void;

  utiliseVehicule: BoolChoice;
  setUtiliseVehicule: (v: BoolChoice) => void;
  kmTotal: string;
  setKmTotal: (v: string) => void;
  kmAffaires: string;
  setKmAffaires: (v: string) => void;
  carburant: string;
  setCarburant: (v: string) => void;
  assuranceAuto: string;
  setAssuranceAuto: (v: string) => void;
  immatriculation: string;
  setImmatriculation: (v: string) => void;
  entretienAuto: string;
  setEntretienAuto: (v: string) => void;
  interetsAuto: string;
  setInteretsAuto: (v: string) => void;
  locationAuto: string;
  setLocationAuto: (v: string) => void;

  bureauDomicile: BoolChoice;
  setBureauDomicile: (v: BoolChoice) => void;
  superficieBureau: string;
  setSuperficieBureau: (v: string) => void;
  superficieResidence: string;
  setSuperficieResidence: (v: string) => void;
  loyerResidence: string;
  setLoyerResidence: (v: string) => void;
  interetsHypothecaires: string;
  setInteretsHypothecaires: (v: string) => void;
  taxesMunicipales: string;
  setTaxesMunicipales: (v: string) => void;
  assuranceHabitation: string;
  setAssuranceHabitation: (v: string) => void;
  electriciteChauffage: string;
  setElectriciteChauffage: (v: string) => void;
  entretienResidence: string;
  setEntretienResidence: (v: string) => void;

  employes: BoolChoice;
  setEmployes: (v: BoolChoice) => void;
  sousTraitants: BoolChoice;
  setSousTraitants: (v: BoolChoice) => void;

  achatsEquipements: BoolChoice;
  setAchatsEquipements: (v: BoolChoice) => void;
  detailsEquipements: string;
  setDetailsEquipements: (v: string) => void;
};

/* ============================================================
   PETITS COMPOSANTS
============================================================ */

function MoneyField({
  label,
  value,
  setValue,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <div className="ff-field">
      <label>{label}</label>

      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0.00"
      />
    </div>
  );
}

function YesNo({
  label,
  value,
  setValue,
  yes,
  no,
}: {
  label: string;
  value: BoolChoice;
  setValue: (v: BoolChoice) => void;
  yes: string;
  no: string;
}) {
  return (
    <div className="ff-field">
      <label style={{ display: "block", marginBottom: 8 }}>
        {label}
      </label>

      <div
        style={{
          display: "flex",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <input
            type="radio"
            checked={value === true}
            onChange={() => setValue(true)}
          />
          {yes}
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <input
            type="radio"
            checked={value === false}
            onChange={() => setValue(false)}
          />
          {no}
        </label>
      </div>
    </div>
  );
}

/* ============================================================
   MENU DÉROULANT
============================================================ */

function Accordion({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <details
      style={{
        border: "1px solid #dbe3ea",
        borderRadius: 12,
        background: "#ffffff",
        overflow: "hidden",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          padding: "15px 16px",
          fontWeight: 800,
          listStylePosition: "inside",
          userSelect: "none",
        }}
      >
        {title}

        {subtitle ? (
          <div
            style={{
              marginTop: 4,
              marginLeft: 22,
              fontSize: 13,
              fontWeight: 400,
              color: "#64748b",
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </summary>

      <div
        style={{
          display: "grid",
          gap: 14,
          padding: "4px 16px 18px",
          borderTop: "1px solid #eef2f7",
        }}
      >
        {children}
      </div>
    </details>
  );
}

/* ============================================================
   SECTION PRINCIPALE
============================================================ */

export default function TravailleurAutonomeSection({
  lang,
  actif,
  setActif,

  nomEntreprise,
  setNomEntreprise,
  descriptionActivite,
  setDescriptionActivite,
  dateDebutActivite,
  setDateDebutActivite,

  revenus,
  setRevenus,

  inscritTPS,
  setInscritTPS,
  inscritTVQ,
  setInscritTVQ,
  numeroTPS,
  setNumeroTPS,
  numeroTVQ,
  setNumeroTVQ,

  depenses,
  setDepenses,
  publicite,
  setPublicite,
  repasRepresentation,
  setRepasRepresentation,
  assurances,
  setAssurances,
  interetsFraisBancaires,
  setInteretsFraisBancaires,
  fraisBureau,
  setFraisBureau,
  fournitures,
  setFournitures,
  honorairesProfessionnels,
  setHonorairesProfessionnels,
  telephoneInternet,
  setTelephoneInternet,
  sousTraitance,
  setSousTraitance,
  salaires,
  setSalaires,
  loyers,
  setLoyers,
  entretienReparations,
  setEntretienReparations,
  deplacements,
  setDeplacements,
  autresDepenses,
  setAutresDepenses,
  autresDepensesDescription,
  setAutresDepensesDescription,

  utiliseVehicule,
  setUtiliseVehicule,
  kmTotal,
  setKmTotal,
  kmAffaires,
  setKmAffaires,
  carburant,
  setCarburant,
  assuranceAuto,
  setAssuranceAuto,
  immatriculation,
  setImmatriculation,
  entretienAuto,
  setEntretienAuto,
  interetsAuto,
  setInteretsAuto,
  locationAuto,
  setLocationAuto,

  bureauDomicile,
  setBureauDomicile,
  superficieBureau,
  setSuperficieBureau,
  superficieResidence,
  setSuperficieResidence,
  loyerResidence,
  setLoyerResidence,
  interetsHypothecaires,
  setInteretsHypothecaires,
  taxesMunicipales,
  setTaxesMunicipales,
  assuranceHabitation,
  setAssuranceHabitation,
  electriciteChauffage,
  setElectriciteChauffage,
  entretienResidence,
  setEntretienResidence,

  employes,
  setEmployes,
  sousTraitants,
  setSousTraitants,

  achatsEquipements,
  setAchatsEquipements,
  detailsEquipements,
  setDetailsEquipements,
}: Props) {
  const TXT = {
    fr: {
      title: "Travailleur autonome",
      intro: "Cochez cette section si vous avez gagné des revenus comme travailleur autonome, pigiste, contractuel ou propriétaire d’une petite entreprise.",
      active: "J’ai gagné des revenus de travail autonome",
      instruction: "Ouvrez seulement les catégories qui s’appliquent à votre situation.",
      yes: "Oui", no: "Non",
      activityTitle: "Activité et revenus",
      activitySub: "Informations sur votre entreprise et vos revenus bruts",
      businessName: "Nom de l’entreprise ou de l’activité",
      businessNamePh: "Ex. : Services ABC",
      activityDesc: "Description de votre activité principale",
      activityDescPh: "Ex. : consultation, livraison, construction…",
      startDate: "Date de début de l’activité",
      datePh: "JJ/MM/AAAA",
      grossIncome: "Revenus bruts de travail autonome",
      incomeNote: "Inscrivez vos revenus avant de soustraire vos dépenses.",
      taxTitle: "TPS / TVQ",
      taxSub: "Ouvrez cette section si vous êtes inscrit aux taxes",
      gstQ: "Êtes-vous inscrit à la TPS ?",
      gstNumber: "Numéro de TPS",
      qstQ: "Êtes-vous inscrit à la TVQ ?",
      qstNumber: "Numéro de TVQ",
      expensesTitle: "Dépenses d’entreprise",
      expensesSub: "Publicité, fournitures, assurances, téléphone, loyer et autres dépenses",
      expensesNote: "Remplissez seulement les dépenses qui s’appliquent à votre entreprise.",
      totalExpenses: "Total approximatif des dépenses",
      advertising: "Publicité",
      meals: "Repas et représentation",
      businessInsurance: "Assurances d’entreprise",
      bankInterest: "Intérêts et frais bancaires",
      office: "Frais de bureau",
      supplies: "Fournitures",
      professionalFees: "Honoraires professionnels",
      phoneInternet: "Téléphone et Internet — portion affaires",
      subcontracting: "Sous-traitance",
      wages: "Salaires",
      commercialRent: "Loyer commercial",
      maintenance: "Entretien et réparations",
      travel: "Déplacements",
      otherExpenses: "Autres dépenses",
      otherExpensesDesc: "Description des autres dépenses",
      otherExpensesPh: "Décrivez ces dépenses",
      vehicleTitle: "Véhicule",
      vehicleSub: "Ouvrez seulement si vous avez utilisé un véhicule pour votre entreprise",
      vehicleQ: "Avez-vous utilisé un véhicule pour votre travail autonome ?",
      totalKm: "Kilométrage total pour l’année",
      businessKm: "Kilométrage pour affaires",
      fuel: "Essence / carburant",
      autoInsurance: "Assurance automobile",
      registration: "Immatriculation",
      autoMaintenance: "Entretien et réparations",
      autoInterest: "Intérêts sur financement automobile",
      autoLease: "Location du véhicule",
      homeTitle: "Bureau à domicile",
      homeSub: "Ouvrez seulement si vous utilisez votre résidence pour votre entreprise",
      homeQ: "Utilisez-vous une partie de votre domicile pour votre entreprise ?",
      officeArea: "Superficie utilisée pour l’entreprise",
      homeArea: "Superficie totale de la résidence",
      homeRent: "Loyer de la résidence",
      mortgageInterest: "Intérêts hypothécaires",
      municipalTaxes: "Taxes municipales",
      homeInsurance: "Assurance habitation",
      utilities: "Électricité et chauffage",
      homeMaintenance: "Entretien de la résidence",
      workersTitle: "Employés et sous-traitants",
      workersSub: "Ouvrez seulement si vous avez payé des employés ou des sous-traitants",
      employeesQ: "Avez-vous eu des employés ?",
      contractorsQ: "Avez-vous payé des sous-traitants ?",
      equipmentTitle: "Équipements et achats importants",
      equipmentSub: "Ordinateur, outils, mobilier, machinerie ou autres équipements",
      equipmentQ: "Avez-vous acheté de l’équipement ou des biens importants pour votre entreprise ?",
      equipmentDesc: "Décrivez les achats et indiquez leur coût",
      equipmentPh: "Ex. : ordinateur 1 800 $, outils 950 $, mobilier 600 $…",
      finalNote: "Ouvrez et remplissez uniquement les catégories qui s’appliquent à votre situation. Conservez vos factures, reçus et pièces justificatives.",
    },
    en: {
      title: "Self-employment",
      intro: "Check this section if you earned income as a self-employed worker, freelancer, contractor or small business owner.",
      active: "I earned self-employment income",
      instruction: "Open only the categories that apply to your situation.",
      yes: "Yes", no: "No",
      activityTitle: "Business activity and income",
      activitySub: "Information about your business and gross income",
      businessName: "Business or activity name",
      businessNamePh: "Example: ABC Services",
      activityDesc: "Description of your main business activity",
      activityDescPh: "Example: consulting, delivery, construction…",
      startDate: "Business start date",
      datePh: "YYYY-MM-DD",
      grossIncome: "Gross self-employment income",
      incomeNote: "Enter your income before subtracting expenses.",
      taxTitle: "GST / QST",
      taxSub: "Open this section if you are registered for sales taxes",
      gstQ: "Are you registered for GST?",
      gstNumber: "GST number",
      qstQ: "Are you registered for QST?",
      qstNumber: "QST number",
      expensesTitle: "Business expenses",
      expensesSub: "Advertising, supplies, insurance, telephone, rent and other expenses",
      expensesNote: "Complete only the expense categories that apply to your business.",
      totalExpenses: "Approximate total expenses",
      advertising: "Advertising",
      meals: "Meals and entertainment",
      businessInsurance: "Business insurance",
      bankInterest: "Interest and bank charges",
      office: "Office expenses",
      supplies: "Supplies",
      professionalFees: "Professional fees",
      phoneInternet: "Telephone and Internet — business portion",
      subcontracting: "Subcontracting",
      wages: "Wages",
      commercialRent: "Commercial rent",
      maintenance: "Maintenance and repairs",
      travel: "Travel",
      otherExpenses: "Other expenses",
      otherExpensesDesc: "Description of other expenses",
      otherExpensesPh: "Describe these expenses",
      vehicleTitle: "Vehicle",
      vehicleSub: "Open only if you used a vehicle for your business",
      vehicleQ: "Did you use a vehicle for your self-employment activity?",
      totalKm: "Total kilometres for the year",
      businessKm: "Business kilometres",
      fuel: "Fuel",
      autoInsurance: "Automobile insurance",
      registration: "Vehicle registration",
      autoMaintenance: "Maintenance and repairs",
      autoInterest: "Interest on vehicle financing",
      autoLease: "Vehicle lease",
      homeTitle: "Business use of home",
      homeSub: "Open only if you use part of your home for your business",
      homeQ: "Do you use part of your home for your business?",
      officeArea: "Area used for business",
      homeArea: "Total area of the residence",
      homeRent: "Home rent",
      mortgageInterest: "Mortgage interest",
      municipalTaxes: "Municipal taxes",
      homeInsurance: "Home insurance",
      utilities: "Electricity and heating",
      homeMaintenance: "Home maintenance",
      workersTitle: "Employees and subcontractors",
      workersSub: "Open only if you paid employees or subcontractors",
      employeesQ: "Did you have employees?",
      contractorsQ: "Did you pay subcontractors?",
      equipmentTitle: "Equipment and major purchases",
      equipmentSub: "Computer, tools, furniture, machinery or other equipment",
      equipmentQ: "Did you purchase equipment or other major assets for your business?",
      equipmentDesc: "Describe the purchases and indicate their cost",
      equipmentPh: "Example: computer $1,800, tools $950, furniture $600…",
      finalNote: "Open and complete only the categories that apply to your situation. Keep your invoices, receipts and supporting documents.",
    },
    es: {
      title: "Trabajo por cuenta propia",
      intro: "Marque esta sección si obtuvo ingresos como trabajador autónomo, profesional independiente, contratista o propietario de una pequeña empresa.",
      active: "Obtuve ingresos por trabajo por cuenta propia",
      instruction: "Abra únicamente las categorías que correspondan a su situación.",
      yes: "Sí", no: "No",
      activityTitle: "Actividad e ingresos",
      activitySub: "Información sobre su actividad e ingresos brutos",
      businessName: "Nombre de la empresa o actividad",
      businessNamePh: "Ej.: Servicios ABC",
      activityDesc: "Descripción de su actividad principal",
      activityDescPh: "Ej.: consultoría, reparto, construcción…",
      startDate: "Fecha de inicio de la actividad",
      datePh: "AAAA-MM-DD",
      grossIncome: "Ingresos brutos por trabajo por cuenta propia",
      incomeNote: "Indique sus ingresos antes de restar los gastos.",
      taxTitle: "GST / QST",
      taxSub: "Abra esta sección si está registrado para los impuestos sobre las ventas",
      gstQ: "¿Está registrado para el GST?",
      gstNumber: "Número de GST",
      qstQ: "¿Está registrado para el QST?",
      qstNumber: "Número de QST",
      expensesTitle: "Gastos del negocio",
      expensesSub: "Publicidad, suministros, seguros, teléfono, alquiler y otros gastos",
      expensesNote: "Complete únicamente las categorías de gastos que correspondan a su negocio.",
      totalExpenses: "Total aproximado de gastos",
      advertising: "Publicidad",
      meals: "Comidas y representación",
      businessInsurance: "Seguros del negocio",
      bankInterest: "Intereses y cargos bancarios",
      office: "Gastos de oficina",
      supplies: "Suministros",
      professionalFees: "Honorarios profesionales",
      phoneInternet: "Teléfono e Internet — parte correspondiente al negocio",
      subcontracting: "Subcontratación",
      wages: "Salarios",
      commercialRent: "Alquiler comercial",
      maintenance: "Mantenimiento y reparaciones",
      travel: "Desplazamientos",
      otherExpenses: "Otros gastos",
      otherExpensesDesc: "Descripción de otros gastos",
      otherExpensesPh: "Describa estos gastos",
      vehicleTitle: "Vehículo",
      vehicleSub: "Abra únicamente si utilizó un vehículo para su negocio",
      vehicleQ: "¿Utilizó un vehículo para su actividad por cuenta propia?",
      totalKm: "Kilometraje total del año",
      businessKm: "Kilometraje de negocios",
      fuel: "Combustible",
      autoInsurance: "Seguro del automóvil",
      registration: "Matriculación",
      autoMaintenance: "Mantenimiento y reparaciones",
      autoInterest: "Intereses de financiación del vehículo",
      autoLease: "Arrendamiento del vehículo",
      homeTitle: "Oficina en casa",
      homeSub: "Abra únicamente si utiliza parte de su vivienda para su negocio",
      homeQ: "¿Utiliza parte de su vivienda para su negocio?",
      officeArea: "Superficie utilizada para el negocio",
      homeArea: "Superficie total de la vivienda",
      homeRent: "Alquiler de la vivienda",
      mortgageInterest: "Intereses hipotecarios",
      municipalTaxes: "Impuestos municipales",
      homeInsurance: "Seguro de la vivienda",
      utilities: "Electricidad y calefacción",
      homeMaintenance: "Mantenimiento de la vivienda",
      workersTitle: "Empleados y subcontratistas",
      workersSub: "Abra únicamente si pagó a empleados o subcontratistas",
      employeesQ: "¿Tuvo empleados?",
      contractorsQ: "¿Pagó a subcontratistas?",
      equipmentTitle: "Equipos y compras importantes",
      equipmentSub: "Computadora, herramientas, mobiliario, maquinaria u otros equipos",
      equipmentQ: "¿Compró equipos u otros bienes importantes para su negocio?",
      equipmentDesc: "Describa las compras e indique su costo",
      equipmentPh: "Ej.: computadora 1.800 $, herramientas 950 $, mobiliario 600 $…",
      finalNote: "Abra y complete únicamente las categorías que correspondan a su situación. Conserve sus facturas, recibos y documentos justificativos.",
    },
  } as const;

  const t = TXT[lang] ?? TXT.fr;

  return (
    <section className="ff-card">
      {/* ========================================================
          EN-TÊTE
      ======================================================== */}

      <div>
        <h2 style={{ marginBottom: 4 }}>
          {t.title}
        </h2>

        <p
          style={{
            margin: 0,
            color: "#6b7280",
            lineHeight: 1.5,
          }}
        >
          {t.intro}
        </p>
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 16,
          fontWeight: 800,
        }}
      >
        <input
          type="checkbox"
          checked={actif}
          onChange={(e) => setActif(e.target.checked)}
        />

        {t.active}
      </label>

      {/* ========================================================
          RIEN N'APPARAÎT SI TA NON COCHÉ
      ======================================================== */}

      {!actif ? null : (
        <div
          style={{
            display: "grid",
            gap: 10,
            marginTop: 20,
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              color: "#475569",
              fontSize: 14,
            }}
          >
            {t.instruction}
          </p>

          {/* ====================================================
              ACTIVITÉ + REVENUS
          ==================================================== */}

          <Accordion
            title={t.activityTitle}
            subtitle={t.activitySub}
          >
            <div className="ff-field">
              <label>{t.businessName}</label>

              <input
                type="text"
                value={nomEntreprise}
                onChange={(e) =>
                  setNomEntreprise(e.target.value)
                }
                placeholder={t.businessNamePh}
              />
            </div>

            <div className="ff-field">
              <label>{t.activityDesc}</label>

              <input
                type="text"
                value={descriptionActivite}
                onChange={(e) =>
                  setDescriptionActivite(e.target.value)
                }
                placeholder={t.activityDescPh}
              />
            </div>

            <div className="ff-field">
              <label>{t.startDate}</label>

              <input
                type="text"
                value={dateDebutActivite}
                onChange={(e) =>
                  setDateDebutActivite(e.target.value)
                }
                placeholder={t.datePh}
              />
            </div>

            <MoneyField
              label={t.grossIncome}
              value={revenus}
              setValue={setRevenus}
            />

            <small style={{ color: "#64748b" }}>
              {t.incomeNote}
            </small>
          </Accordion>

          {/* ====================================================
              TPS / TVQ
          ==================================================== */}

          <Accordion
            title={t.taxTitle}
            subtitle={t.taxSub}
          >
            <YesNo
              label={t.gstQ}
              value={inscritTPS}
              setValue={setInscritTPS}
              yes={t.yes}
              no={t.no}
            />

            {inscritTPS === true ? (
              <div className="ff-field">
                <label>{t.gstNumber}</label>

                <input
                  type="text"
                  value={numeroTPS}
                  onChange={(e) =>
                    setNumeroTPS(e.target.value)
                  }
                  placeholder={t.gstNumber}
                />
              </div>
            ) : null}

            <YesNo
              label={t.qstQ}
              value={inscritTVQ}
              setValue={setInscritTVQ}
              yes={t.yes}
              no={t.no}
            />

            {inscritTVQ === true ? (
              <div className="ff-field">
                <label>{t.qstNumber}</label>

                <input
                  type="text"
                  value={numeroTVQ}
                  onChange={(e) =>
                    setNumeroTVQ(e.target.value)
                  }
                  placeholder={t.qstNumber}
                />
              </div>
            ) : null}
          </Accordion>

          {/* ====================================================
              DÉPENSES
          ==================================================== */}

          <Accordion
            title={t.expensesTitle}
            subtitle={t.expensesSub}
          >
            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: 14,
              }}
            >
              {t.expensesNote}
            </p>

            <MoneyField
              label={t.totalExpenses}
              value={depenses}
              setValue={setDepenses}
            />

            <MoneyField
              label={t.advertising}
              value={publicite}
              setValue={setPublicite}
            />

            <MoneyField
              label={t.meals}
              value={repasRepresentation}
              setValue={setRepasRepresentation}
            />

            <MoneyField
              label={t.businessInsurance}
              value={assurances}
              setValue={setAssurances}
            />

            <MoneyField
              label={t.bankInterest}
              value={interetsFraisBancaires}
              setValue={setInteretsFraisBancaires}
            />

            <MoneyField
              label={t.office}
              value={fraisBureau}
              setValue={setFraisBureau}
            />

            <MoneyField
              label={t.supplies}
              value={fournitures}
              setValue={setFournitures}
            />

            <MoneyField
              label={t.professionalFees}
              value={honorairesProfessionnels}
              setValue={setHonorairesProfessionnels}
            />

            <MoneyField
              label={t.phoneInternet}
              value={telephoneInternet}
              setValue={setTelephoneInternet}
            />

            <MoneyField
              label={t.subcontracting}
              value={sousTraitance}
              setValue={setSousTraitance}
            />

            <MoneyField
              label={t.wages}
              value={salaires}
              setValue={setSalaires}
            />

            <MoneyField
              label={t.commercialRent}
              value={loyers}
              setValue={setLoyers}
            />

            <MoneyField
              label={t.maintenance}
              value={entretienReparations}
              setValue={setEntretienReparations}
            />

            <MoneyField
              label={t.travel}
              value={deplacements}
              setValue={setDeplacements}
            />

            <MoneyField
              label={t.otherExpenses}
              value={autresDepenses}
              setValue={setAutresDepenses}
            />

            {autresDepenses.trim() ? (
              <div className="ff-field">
                <label>{t.otherExpensesDesc}</label>

                <textarea
                  rows={3}
                  value={autresDepensesDescription}
                  onChange={(e) =>
                    setAutresDepensesDescription(
                      e.target.value
                    )
                  }
                  placeholder={t.otherExpensesPh}
                />
              </div>
            ) : null}
          </Accordion>

          {/* ====================================================
              VÉHICULE
          ==================================================== */}

          <Accordion
            title={t.vehicleTitle}
            subtitle={t.vehicleSub}
          >
            <YesNo
              label={t.vehicleQ}
              value={utiliseVehicule}
              setValue={setUtiliseVehicule}
              yes={t.yes}
              no={t.no}
            />

            {utiliseVehicule === true ? (
              <>
                <div className="ff-field">
                  <label>{t.totalKm}</label>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={kmTotal}
                    onChange={(e) =>
                      setKmTotal(e.target.value)
                    }
                    placeholder="Ex. : 22000"
                  />
                </div>

                <div className="ff-field">
                  <label>{t.businessKm}</label>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={kmAffaires}
                    onChange={(e) =>
                      setKmAffaires(e.target.value)
                    }
                    placeholder="Ex. : 8500"
                  />
                </div>

                <MoneyField
                  label={t.fuel}
                  value={carburant}
                  setValue={setCarburant}
                />

                <MoneyField
                  label={t.autoInsurance}
                  value={assuranceAuto}
                  setValue={setAssuranceAuto}
                />

                <MoneyField
                  label={t.registration}
                  value={immatriculation}
                  setValue={setImmatriculation}
                />

                <MoneyField
                  label={t.autoMaintenance}
                  value={entretienAuto}
                  setValue={setEntretienAuto}
                />

                <MoneyField
                  label={t.autoInterest}
                  value={interetsAuto}
                  setValue={setInteretsAuto}
                />

                <MoneyField
                  label={t.autoLease}
                  value={locationAuto}
                  setValue={setLocationAuto}
                />
              </>
            ) : null}
          </Accordion>

          {/* ====================================================
              BUREAU À DOMICILE
          ==================================================== */}

          <Accordion
            title={t.homeTitle}
            subtitle={t.homeSub}
          >
            <YesNo
              label={t.homeQ}
              value={bureauDomicile}
              setValue={setBureauDomicile}
              yes={t.yes}
              no={t.no}
            />

            {bureauDomicile === true ? (
              <>
                <div className="ff-field">
                  <label>{t.officeArea}</label>

                  <input
                    type="text"
                    value={superficieBureau}
                    onChange={(e) =>
                      setSuperficieBureau(e.target.value)
                    }
                    placeholder="Ex. : 150 pi²"
                  />
                </div>

                <div className="ff-field">
                  <label>{t.homeArea}</label>

                  <input
                    type="text"
                    value={superficieResidence}
                    onChange={(e) =>
                      setSuperficieResidence(e.target.value)
                    }
                    placeholder="Ex. : 1500 pi²"
                  />
                </div>

                <MoneyField
                  label={t.homeRent}
                  value={loyerResidence}
                  setValue={setLoyerResidence}
                />

                <MoneyField
                  label={t.mortgageInterest}
                  value={interetsHypothecaires}
                  setValue={setInteretsHypothecaires}
                />

                <MoneyField
                  label={t.municipalTaxes}
                  value={taxesMunicipales}
                  setValue={setTaxesMunicipales}
                />

                <MoneyField
                  label={t.homeInsurance}
                  value={assuranceHabitation}
                  setValue={setAssuranceHabitation}
                />

                <MoneyField
                  label={t.utilities}
                  value={electriciteChauffage}
                  setValue={setElectriciteChauffage}
                />

                <MoneyField
                  label={t.homeMaintenance}
                  value={entretienResidence}
                  setValue={setEntretienResidence}
                />
              </>
            ) : null}
          </Accordion>

          {/* ====================================================
              EMPLOYÉS / SOUS-TRAITANTS
          ==================================================== */}

          <Accordion
            title={t.workersTitle}
            subtitle={t.workersSub}
          >
            <YesNo
              label={t.employeesQ}
              value={employes}
              setValue={setEmployes}
              yes={t.yes}
              no={t.no}
            />

            <YesNo
              label={t.contractorsQ}
              value={sousTraitants}
              setValue={setSousTraitants}
              yes={t.yes}
              no={t.no}
            />
          </Accordion>

          {/* ====================================================
              ÉQUIPEMENTS
          ==================================================== */}

          <Accordion
            title={t.equipmentTitle}
            subtitle={t.equipmentSub}
          >
            <YesNo
              label={t.equipmentQ}
              value={achatsEquipements}
              setValue={setAchatsEquipements}
              yes={t.yes}
              no={t.no}
            />

            {achatsEquipements === true ? (
              <div className="ff-field">
                <label>{t.equipmentDesc}</label>

                <textarea
                  rows={4}
                  value={detailsEquipements}
                  onChange={(e) =>
                    setDetailsEquipements(e.target.value)
                  }
                  placeholder={t.equipmentPh}
                />
              </div>
            ) : null}
          </Accordion>

          {/* ====================================================
              NOTE
          ==================================================== */}

          <div
            style={{
              marginTop: 4,
              padding: 14,
              borderRadius: 10,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#475569",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {t.finalNote}
          </div>
        </div>
      )}
       </section>
  );
}
