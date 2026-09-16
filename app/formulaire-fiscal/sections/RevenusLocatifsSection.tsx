"use client";

import React from "react";
import type { ProvinceCode } from "../types";

type BoolChoice = boolean | undefined;

type Lang = "fr" | "en" | "es";

type Props = {
  lang: Lang;
  actif: boolean;
  setActif: (v: boolean) => void;

  /* IMMEUBLE */
  adresse: string;
  setAdresse: (v: string) => void;

  ville: string;
  setVille: (v: string) => void;

  province: ProvinceCode;
  setProvince: (v: ProvinceCode) => void;

  codePostal: string;
  setCodePostal: (v: string) => void;

  typeImmeuble: string;
  setTypeImmeuble: (v: string) => void;

  nombreUnites: string;
  setNombreUnites: (v: string) => void;

  /* PROPRIÉTÉ */
  pourcentagePropriete: string;
  setPourcentagePropriete: (v: string) => void;

  coproprietaires: BoolChoice;
  setCoproprietaires: (v: BoolChoice) => void;

  detailsCoproprietaires: string;
  setDetailsCoproprietaires: (v: string) => void;

  /* UTILISATION PERSONNELLE */
  habiteImmeuble: BoolChoice;
  setHabiteImmeuble: (v: BoolChoice) => void;

  pourcentagePersonnel: string;
  setPourcentagePersonnel: (v: string) => void;

  /* ACQUISITION */
  dateAcquisition: string;
  setDateAcquisition: (v: string) => void;

  /* REVENUS */
  revenus: string;
  setRevenus: (v: string) => void;

  /* DÉPENSES */
  depenses: string;
  setDepenses: (v: string) => void;

  taxesMunicipales: string;
  setTaxesMunicipales: (v: string) => void;

  taxesScolaires: string;
  setTaxesScolaires: (v: string) => void;

  assurances: string;
  setAssurances: (v: string) => void;

  interetsHypothecaires: string;
  setInteretsHypothecaires: (v: string) => void;

  entretienReparations: string;
  setEntretienReparations: (v: string) => void;

  electricite: string;
  setElectricite: (v: string) => void;

  chauffage: string;
  setChauffage: (v: string) => void;

  eau: string;
  setEau: (v: string) => void;

  publicite: string;
  setPublicite: (v: string) => void;

  fraisGestion: string;
  setFraisGestion: (v: string) => void;

  honorairesProfessionnels: string;
  setHonorairesProfessionnels: (v: string) => void;

  fraisBancaires: string;
  setFraisBancaires: (v: string) => void;

  autresDepenses: string;
  setAutresDepenses: (v: string) => void;

  autresDepensesDescription: string;
  setAutresDepensesDescription: (v: string) => void;

  /* RÉNOVATIONS */
  renovationsImportantes: BoolChoice;
  setRenovationsImportantes: (v: BoolChoice) => void;

  detailsRenovations: string;
  setDetailsRenovations: (v: string) => void;

  /* ÉQUIPEMENTS */
  achatsEquipements: BoolChoice;
  setAchatsEquipements: (v: BoolChoice) => void;

  detailsEquipements: string;
  setDetailsEquipements: (v: string) => void;
};

/* ============================================================
   CHAMP MONTANT
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

/* ============================================================
   OUI / NON
============================================================ */

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
      <label
        style={{
          display: "block",
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
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
          padding: "14px 16px 18px",
          borderTop: "1px solid #eef2f7",
        }}
      >
        {children}
      </div>
    </details>
  );
}

/* ============================================================
   SECTION REVENUS LOCATIFS
============================================================ */

export default function RevenusLocatifsSection({
  lang,
  actif,
  setActif,

  adresse,
  setAdresse,
  ville,
  setVille,
  province,
  setProvince,
  codePostal,
  setCodePostal,
  typeImmeuble,
  setTypeImmeuble,
  nombreUnites,
  setNombreUnites,

  pourcentagePropriete,
  setPourcentagePropriete,
  coproprietaires,
  setCoproprietaires,
  detailsCoproprietaires,
  setDetailsCoproprietaires,

  habiteImmeuble,
  setHabiteImmeuble,
  pourcentagePersonnel,
  setPourcentagePersonnel,

  dateAcquisition,
  setDateAcquisition,

  revenus,
  setRevenus,

  depenses,
  setDepenses,
  taxesMunicipales,
  setTaxesMunicipales,
  taxesScolaires,
  setTaxesScolaires,
  assurances,
  setAssurances,
  interetsHypothecaires,
  setInteretsHypothecaires,
  entretienReparations,
  setEntretienReparations,
  electricite,
  setElectricite,
  chauffage,
  setChauffage,
  eau,
  setEau,
  publicite,
  setPublicite,
  fraisGestion,
  setFraisGestion,
  honorairesProfessionnels,
  setHonorairesProfessionnels,
  fraisBancaires,
  setFraisBancaires,
  autresDepenses,
  setAutresDepenses,
  autresDepensesDescription,
  setAutresDepensesDescription,

  renovationsImportantes,
  setRenovationsImportantes,
  detailsRenovations,
  setDetailsRenovations,

  achatsEquipements,
  setAchatsEquipements,
  detailsEquipements,
  setDetailsEquipements,
}: Props) {
  const TXT = {
    fr: {
      title: "Revenus de location",
      intro: "Cochez cette section si vous avez reçu des revenus provenant d’un immeuble locatif, d’un duplex, d’un triplex, d’un condo loué ou d’une autre propriété locative.",
      active: "J’ai des revenus de location",
      instruction: "Ouvrez seulement les catégories qui s’appliquent à votre situation.",
      yes: "Oui", no: "Non",
      propertyTitle: "Immeuble et adresse",
      propertySub: "Adresse, type d’immeuble et nombre d’unités",
      address: "Adresse de l’immeuble", addressPh: "Ex. : 123 rue Principale",
      city: "Ville", province: "Province", postal: "Code postal",
      propertyType: "Type d’immeuble", select: "Sélectionner",
      house: "Maison", condo: "Condo", duplex: "Duplex", triplex: "Triplex", multiplex: "Multiplex", other: "Autre",
      units: "Nombre d’unités locatives", unitsPh: "Ex. : 2",
      acquisition: "Date d’acquisition de l’immeuble", datePh: "JJ/MM/AAAA",
      ownershipTitle: "Propriété et copropriétaires",
      ownershipSub: "Votre pourcentage de propriété et les autres propriétaires",
      ownershipPct: "Votre pourcentage de propriété", ownershipPctPh: "Ex. : 100 % ou 50 %",
      coownersQ: "Y a-t-il d’autres copropriétaires ?",
      coownersDetails: "Nom des copropriétaires et pourcentage de chacun",
      coownersPh: "Ex. : Jean Tremblay — 50 %",
      personalTitle: "Utilisation personnelle",
      personalSub: "Ouvrez si vous habitez l’immeuble ou utilisez personnellement une partie de la propriété",
      personalQ: "Habitez-vous dans cet immeuble ou en utilisez-vous une partie personnellement ?",
      personalPct: "Pourcentage approximatif utilisé personnellement", personalPctPh: "Ex. : 50 %",
      incomeTitle: "Revenus locatifs", incomeSub: "Loyers bruts reçus durant l’année",
      grossIncome: "Revenus locatifs bruts",
      incomeNote: "Inscrivez les revenus avant de soustraire les dépenses.",
      expensesTitle: "Dépenses de l’immeuble",
      expensesSub: "Taxes, assurances, intérêts, réparations, services publics et autres dépenses",
      expensesNote: "Remplissez uniquement les catégories qui s’appliquent.",
      totalExpenses: "Total approximatif des dépenses",
      municipalTaxes: "Taxes municipales", schoolTaxes: "Taxes scolaires", insurance: "Assurances",
      mortgageInterest: "Intérêts hypothécaires", maintenance: "Entretien et réparations",
      electricity: "Électricité", heating: "Chauffage", water: "Eau", advertising: "Publicité",
      management: "Frais de gestion", professional: "Honoraires professionnels", bank: "Frais bancaires",
      otherExpenses: "Autres dépenses", otherDesc: "Description des autres dépenses",
      otherPh: "Précisez la nature de ces dépenses",
      renovationsTitle: "Rénovations importantes",
      renovationsSub: "Ouvrez si vous avez effectué des rénovations ou améliorations importantes",
      renovationsQ: "Avez-vous effectué des rénovations ou améliorations importantes durant l’année ?",
      renovationsDesc: "Décrivez les travaux et indiquez leur coût",
      renovationsPh: "Ex. : remplacement des fenêtres — 12 000 $",
      equipmentTitle: "Équipements et achats importants",
      equipmentSub: "Électroménagers, meubles, équipements ou autres biens achetés pour la location",
      equipmentQ: "Avez-vous acheté des équipements ou des biens importants pour l’immeuble ?",
      equipmentDesc: "Décrivez les achats et indiquez leur coût",
      equipmentPh: "Ex. : réfrigérateur 1 400 $, laveuse 900 $…",
      finalNote: "Ouvrez et remplissez uniquement les catégories qui s’appliquent à votre situation. Conservez vos relevés, factures, reçus et autres pièces justificatives.",
    },
    en: {
      title: "Rental income",
      intro: "Check this section if you received income from a rental property, duplex, triplex, rented condominium or other rental property.",
      active: "I have rental income",
      instruction: "Open only the categories that apply to your situation.",
      yes: "Yes", no: "No",
      propertyTitle: "Property and address",
      propertySub: "Address, property type and number of units",
      address: "Property address", addressPh: "Example: 123 Main Street",
      city: "City", province: "Province", postal: "Postal code",
      propertyType: "Property type", select: "Select",
      house: "House", condo: "Condo", duplex: "Duplex", triplex: "Triplex", multiplex: "Multiplex", other: "Other",
      units: "Number of rental units", unitsPh: "Example: 2",
      acquisition: "Property acquisition date", datePh: "DD/MM/YYYY",
      ownershipTitle: "Ownership and co-owners",
      ownershipSub: "Your ownership percentage and other owners",
      ownershipPct: "Your ownership percentage", ownershipPctPh: "Example: 100% or 50%",
      coownersQ: "Are there any other co-owners?",
      coownersDetails: "Names of co-owners and each person’s percentage",
      coownersPh: "Example: John Smith — 50%",
      personalTitle: "Personal use",
      personalSub: "Open if you live in the property or personally use part of it",
      personalQ: "Do you live in this property or personally use part of it?",
      personalPct: "Approximate percentage used personally", personalPctPh: "Example: 50%",
      incomeTitle: "Rental income", incomeSub: "Gross rent received during the year",
      grossIncome: "Gross rental income",
      incomeNote: "Enter income before subtracting expenses.",
      expensesTitle: "Property expenses",
      expensesSub: "Taxes, insurance, interest, repairs, utilities and other expenses",
      expensesNote: "Complete only the categories that apply.",
      totalExpenses: "Approximate total expenses",
      municipalTaxes: "Municipal taxes", schoolTaxes: "School taxes", insurance: "Insurance",
      mortgageInterest: "Mortgage interest", maintenance: "Maintenance and repairs",
      electricity: "Electricity", heating: "Heating", water: "Water", advertising: "Advertising",
      management: "Management fees", professional: "Professional fees", bank: "Bank charges",
      otherExpenses: "Other expenses", otherDesc: "Description of other expenses",
      otherPh: "Specify the nature of these expenses",
      renovationsTitle: "Major renovations",
      renovationsSub: "Open if you completed major renovations or improvements",
      renovationsQ: "Did you complete any major renovations or improvements during the year?",
      renovationsDesc: "Describe the work and indicate its cost",
      renovationsPh: "Example: window replacement — $12,000",
      equipmentTitle: "Equipment and major purchases",
      equipmentSub: "Appliances, furniture, equipment or other assets purchased for the rental property",
      equipmentQ: "Did you purchase equipment or other major assets for the property?",
      equipmentDesc: "Describe the purchases and indicate their cost",
      equipmentPh: "Example: refrigerator $1,400, washer $900…",
      finalNote: "Open and complete only the categories that apply to your situation. Keep your statements, invoices, receipts and other supporting documents.",
    },
    es: {
      title: "Ingresos por alquiler",
      intro: "Marque esta sección si recibió ingresos de una propiedad de alquiler, dúplex, tríplex, condominio alquilado u otra propiedad destinada al alquiler.",
      active: "Tengo ingresos por alquiler",
      instruction: "Abra únicamente las categorías que correspondan a su situación.",
      yes: "Sí", no: "No",
      propertyTitle: "Propiedad y dirección",
      propertySub: "Dirección, tipo de propiedad y número de unidades",
      address: "Dirección de la propiedad", addressPh: "Ej.: 123 calle Principal",
      city: "Ciudad", province: "Provincia", postal: "Código postal",
      propertyType: "Tipo de propiedad", select: "Seleccionar",
      house: "Casa", condo: "Condominio", duplex: "Dúplex", triplex: "Tríplex", multiplex: "Edificio multifamiliar", other: "Otro",
      units: "Número de unidades de alquiler", unitsPh: "Ej.: 2",
      acquisition: "Fecha de adquisición de la propiedad", datePh: "DD/MM/AAAA",
      ownershipTitle: "Propiedad y copropietarios",
      ownershipSub: "Su porcentaje de propiedad y los demás propietarios",
      ownershipPct: "Su porcentaje de propiedad", ownershipPctPh: "Ej.: 100 % o 50 %",
      coownersQ: "¿Hay otros copropietarios?",
      coownersDetails: "Nombre de los copropietarios y porcentaje de cada uno",
      coownersPh: "Ej.: Juan Pérez — 50 %",
      personalTitle: "Uso personal",
      personalSub: "Abra si vive en la propiedad o utiliza personalmente una parte de ella",
      personalQ: "¿Vive en esta propiedad o utiliza personalmente una parte de ella?",
      personalPct: "Porcentaje aproximado de uso personal", personalPctPh: "Ej.: 50 %",
      incomeTitle: "Ingresos por alquiler", incomeSub: "Alquileres brutos recibidos durante el año",
      grossIncome: "Ingresos brutos por alquiler",
      incomeNote: "Indique los ingresos antes de restar los gastos.",
      expensesTitle: "Gastos de la propiedad",
      expensesSub: "Impuestos, seguros, intereses, reparaciones, servicios públicos y otros gastos",
      expensesNote: "Complete únicamente las categorías que correspondan.",
      totalExpenses: "Total aproximado de gastos",
      municipalTaxes: "Impuestos municipales", schoolTaxes: "Impuestos escolares", insurance: "Seguros",
      mortgageInterest: "Intereses hipotecarios", maintenance: "Mantenimiento y reparaciones",
      electricity: "Electricidad", heating: "Calefacción", water: "Agua", advertising: "Publicidad",
      management: "Gastos de gestión", professional: "Honorarios profesionales", bank: "Gastos bancarios",
      otherExpenses: "Otros gastos", otherDesc: "Descripción de otros gastos",
      otherPh: "Especifique la naturaleza de estos gastos",
      renovationsTitle: "Renovaciones importantes",
      renovationsSub: "Abra si realizó renovaciones o mejoras importantes",
      renovationsQ: "¿Realizó renovaciones o mejoras importantes durante el año?",
      renovationsDesc: "Describa los trabajos e indique su costo",
      renovationsPh: "Ej.: reemplazo de ventanas — 12.000 $",
      equipmentTitle: "Equipos y compras importantes",
      equipmentSub: "Electrodomésticos, muebles, equipos u otros bienes comprados para la propiedad de alquiler",
      equipmentQ: "¿Compró equipos u otros bienes importantes para la propiedad?",
      equipmentDesc: "Describa las compras e indique su costo",
      equipmentPh: "Ej.: refrigerador 1.400 $, lavadora 900 $…",
      finalNote: "Abra y complete únicamente las categorías que correspondan a su situación. Conserve sus estados de cuenta, facturas, recibos y demás documentos justificativos.",
    },
  } as const;

  const t = TXT[lang] ?? TXT.fr;

  const provinceLabels: Record<ProvinceCode, string> =
    lang === "fr"
      ? { QC:"Québec", ON:"Ontario", NB:"Nouveau-Brunswick", NS:"Nouvelle-Écosse", PE:"Île-du-Prince-Édouard", NL:"Terre-Neuve-et-Labrador", MB:"Manitoba", SK:"Saskatchewan", AB:"Alberta", BC:"Colombie-Britannique", YT:"Yukon", NT:"Territoires du Nord-Ouest", NU:"Nunavut" }
      : lang === "es"
      ? { QC:"Quebec", ON:"Ontario", NB:"Nuevo Brunswick", NS:"Nueva Escocia", PE:"Isla del Príncipe Eduardo", NL:"Terranova y Labrador", MB:"Manitoba", SK:"Saskatchewan", AB:"Alberta", BC:"Columbia Británica", YT:"Yukón", NT:"Territorios del Noroeste", NU:"Nunavut" }
      : { QC:"Quebec", ON:"Ontario", NB:"New Brunswick", NS:"Nova Scotia", PE:"Prince Edward Island", NL:"Newfoundland and Labrador", MB:"Manitoba", SK:"Saskatchewan", AB:"Alberta", BC:"British Columbia", YT:"Yukon", NT:"Northwest Territories", NU:"Nunavut" };

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
              IMMEUBLE
          ==================================================== */}

          <Accordion
            title={t.propertyTitle}
            subtitle={t.propertySub}
          >
            <div className="ff-field">
              <label>{t.address}</label>

              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder={t.addressPh}
              />
            </div>

            <div className="ff-field">
              <label>{t.city}</label>

              <input
                type="text"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                placeholder={t.city}
              />
            </div>

            <div className="ff-field">
              <label>{t.province}</label>

              <select
                value={province}
                onChange={(e) =>
                  setProvince(e.target.value as ProvinceCode)
                }
              >
                <option value="QC">{provinceLabels.QC}</option>
                <option value="ON">{provinceLabels.ON}</option>
                <option value="NB">{provinceLabels.NB}</option>
                <option value="NS">{provinceLabels.NS}</option>
                <option value="PE">{provinceLabels.PE}</option>
                <option value="NL">{provinceLabels.NL}</option>
                <option value="MB">{provinceLabels.MB}</option>
                <option value="SK">{provinceLabels.SK}</option>
                <option value="AB">{provinceLabels.AB}</option>
                <option value="BC">{provinceLabels.BC}</option>
                <option value="YT">{provinceLabels.YT}</option>
                <option value="NT">{provinceLabels.NT}</option>
                <option value="NU">{provinceLabels.NU}</option>
              </select>
            </div>

            <div className="ff-field">
              <label>{t.postal}</label>

              <input
                type="text"
                value={codePostal}
                onChange={(e) => setCodePostal(e.target.value)}
                placeholder="A1A 1A1"
                maxLength={7}
              />
            </div>

            <div className="ff-field">
              <label>{t.propertyType}</label>

              <select
                value={typeImmeuble}
                onChange={(e) => setTypeImmeuble(e.target.value)}
              >
                <option value="">{t.select}</option>
                <option value="maison">{t.house}</option>
                <option value="condo">{t.condo}</option>
                <option value="duplex">{t.duplex}</option>
                <option value="triplex">{t.triplex}</option>
                <option value="multiplex">{t.multiplex}</option>
                <option value="autre">{t.other}</option>
              </select>
            </div>

            <div className="ff-field">
              <label>{t.units}</label>

              <input
                type="text"
                inputMode="numeric"
                value={nombreUnites}
                onChange={(e) => setNombreUnites(e.target.value)}
                placeholder={t.unitsPh}
              />
            </div>

            <div className="ff-field">
              <label>{t.acquisition}</label>

              <input
                type="text"
                value={dateAcquisition}
                onChange={(e) => setDateAcquisition(e.target.value)}
                placeholder={t.datePh}
              />
            </div>
          </Accordion>

          {/* ====================================================
              PROPRIÉTÉ
          ==================================================== */}

          <Accordion
            title={t.ownershipTitle}
            subtitle={t.ownershipSub}
          >
            <div className="ff-field">
              <label>{t.ownershipPct}</label>

              <input
                type="text"
                inputMode="decimal"
                value={pourcentagePropriete}
                onChange={(e) =>
                  setPourcentagePropriete(e.target.value)
                }
                placeholder={t.ownershipPctPh}
              />
            </div>

            <YesNo
              label={t.coownersQ}
              value={coproprietaires}
              setValue={setCoproprietaires}
              yes={t.yes}
              no={t.no}
            />

            {coproprietaires === true ? (
              <div className="ff-field">
                <label>{t.coownersDetails}</label>

                <textarea
                  rows={4}
                  value={detailsCoproprietaires}
                  onChange={(e) =>
                    setDetailsCoproprietaires(e.target.value)
                  }
                  placeholder={t.coownersPh}
                />
              </div>
            ) : null}
          </Accordion>

          {/* ====================================================
              UTILISATION PERSONNELLE
          ==================================================== */}

          <Accordion
            title={t.personalTitle}
            subtitle={t.personalSub}
          >
            <YesNo
              label={t.personalQ}
              value={habiteImmeuble}
              setValue={setHabiteImmeuble}
              yes={t.yes}
              no={t.no}
            />

            {habiteImmeuble === true ? (
              <div className="ff-field">
                <label>{t.personalPct}</label>

                <input
                  type="text"
                  inputMode="decimal"
                  value={pourcentagePersonnel}
                  onChange={(e) =>
                    setPourcentagePersonnel(e.target.value)
                  }
                  placeholder={t.personalPctPh}
                />
              </div>
            ) : null}
          </Accordion>

          {/* ====================================================
              REVENUS
          ==================================================== */}

          <Accordion
            title={t.incomeTitle}
            subtitle={t.incomeSub}
          >
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
              label={t.municipalTaxes}
              value={taxesMunicipales}
              setValue={setTaxesMunicipales}
            />

            <MoneyField
              label={t.schoolTaxes}
              value={taxesScolaires}
              setValue={setTaxesScolaires}
            />

            <MoneyField
              label={t.insurance}
              value={assurances}
              setValue={setAssurances}
            />

            <MoneyField
              label={t.mortgageInterest}
              value={interetsHypothecaires}
              setValue={setInteretsHypothecaires}
            />

            <MoneyField
              label={t.maintenance}
              value={entretienReparations}
              setValue={setEntretienReparations}
            />

            <MoneyField
              label={t.electricity}
              value={electricite}
              setValue={setElectricite}
            />

            <MoneyField
              label={t.heating}
              value={chauffage}
              setValue={setChauffage}
            />

            <MoneyField
              label={t.water}
              value={eau}
              setValue={setEau}
            />

            <MoneyField
              label={t.advertising}
              value={publicite}
              setValue={setPublicite}
            />

            <MoneyField
              label={t.management}
              value={fraisGestion}
              setValue={setFraisGestion}
            />

            <MoneyField
              label={t.professional}
              value={honorairesProfessionnels}
              setValue={setHonorairesProfessionnels}
            />

            <MoneyField
              label={t.bank}
              value={fraisBancaires}
              setValue={setFraisBancaires}
            />

            <MoneyField
              label={t.otherExpenses}
              value={autresDepenses}
              setValue={setAutresDepenses}
            />

            {autresDepenses.trim() ? (
              <div className="ff-field">
                <label>{t.otherDesc}</label>

                <textarea
                  rows={3}
                  value={autresDepensesDescription}
                  onChange={(e) =>
                    setAutresDepensesDescription(e.target.value)
                  }
                  placeholder={t.otherPh}
                />
              </div>
            ) : null}
          </Accordion>

          {/* ====================================================
              RÉNOVATIONS
          ==================================================== */}

          <Accordion
            title={t.renovationsTitle}
            subtitle={t.renovationsSub}
          >
            <YesNo
              label={t.renovationsQ}
              value={renovationsImportantes}
              setValue={setRenovationsImportantes}
              yes={t.yes}
              no={t.no}
            />

            {renovationsImportantes === true ? (
              <div className="ff-field">
                <label>{t.renovationsDesc}</label>

                <textarea
                  rows={4}
                  value={detailsRenovations}
                  onChange={(e) =>
                    setDetailsRenovations(e.target.value)
                  }
                  placeholder={t.renovationsPh}
                />
              </div>
            ) : null}
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
