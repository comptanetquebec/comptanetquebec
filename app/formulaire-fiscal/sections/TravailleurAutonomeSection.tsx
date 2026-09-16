"use client";

import React from "react";

type BoolChoice = boolean | undefined;

type Props = {
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
}: {
  label: string;
  value: BoolChoice;
  setValue: (v: BoolChoice) => void;
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
          Oui
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
          Non
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
  return (
    <section className="ff-card">
      {/* ========================================================
          EN-TÊTE
      ======================================================== */}

      <div>
        <h2 style={{ marginBottom: 4 }}>
          Travailleur autonome
        </h2>

        <p
          style={{
            margin: 0,
            color: "#6b7280",
            lineHeight: 1.5,
          }}
        >
          Cochez cette section si vous avez gagné des revenus comme
          travailleur autonome, pigiste, contractuel ou propriétaire
          d’une petite entreprise.
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

        J’ai gagné des revenus de travail autonome
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
            Ouvrez seulement les catégories qui s’appliquent à votre
            situation.
          </p>

          {/* ====================================================
              ACTIVITÉ + REVENUS
          ==================================================== */}

          <Accordion
            title="Activité et revenus"
            subtitle="Informations sur votre entreprise et vos revenus bruts"
          >
            <div className="ff-field">
              <label>Nom de l’entreprise ou de l’activité</label>

              <input
                type="text"
                value={nomEntreprise}
                onChange={(e) =>
                  setNomEntreprise(e.target.value)
                }
                placeholder="Ex. : Services ABC"
              />
            </div>

            <div className="ff-field">
              <label>Description de votre activité principale</label>

              <input
                type="text"
                value={descriptionActivite}
                onChange={(e) =>
                  setDescriptionActivite(e.target.value)
                }
                placeholder="Ex. : consultation, livraison, construction…"
              />
            </div>

            <div className="ff-field">
              <label>Date de début de l’activité</label>

              <input
                type="text"
                value={dateDebutActivite}
                onChange={(e) =>
                  setDateDebutActivite(e.target.value)
                }
                placeholder="JJ/MM/AAAA"
              />
            </div>

            <MoneyField
              label="Revenus bruts de travail autonome"
              value={revenus}
              setValue={setRevenus}
            />

            <small style={{ color: "#64748b" }}>
              Inscrivez vos revenus avant de soustraire vos dépenses.
            </small>
          </Accordion>

          {/* ====================================================
              TPS / TVQ
          ==================================================== */}

          <Accordion
            title="TPS / TVQ"
            subtitle="Ouvrez cette section si vous êtes inscrit aux taxes"
          >
            <YesNo
              label="Êtes-vous inscrit à la TPS ?"
              value={inscritTPS}
              setValue={setInscritTPS}
            />

            {inscritTPS === true ? (
              <div className="ff-field">
                <label>Numéro de TPS</label>

                <input
                  type="text"
                  value={numeroTPS}
                  onChange={(e) =>
                    setNumeroTPS(e.target.value)
                  }
                  placeholder="Numéro de TPS"
                />
              </div>
            ) : null}

            <YesNo
              label="Êtes-vous inscrit à la TVQ ?"
              value={inscritTVQ}
              setValue={setInscritTVQ}
            />

            {inscritTVQ === true ? (
              <div className="ff-field">
                <label>Numéro de TVQ</label>

                <input
                  type="text"
                  value={numeroTVQ}
                  onChange={(e) =>
                    setNumeroTVQ(e.target.value)
                  }
                  placeholder="Numéro de TVQ"
                />
              </div>
            ) : null}
          </Accordion>

          {/* ====================================================
              DÉPENSES
          ==================================================== */}

          <Accordion
            title="Dépenses d’entreprise"
            subtitle="Publicité, fournitures, assurances, téléphone, loyer et autres dépenses"
          >
            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: 14,
              }}
            >
              Remplissez seulement les dépenses qui s’appliquent à
              votre entreprise.
            </p>

            <MoneyField
              label="Total approximatif des dépenses"
              value={depenses}
              setValue={setDepenses}
            />

            <MoneyField
              label="Publicité"
              value={publicite}
              setValue={setPublicite}
            />

            <MoneyField
              label="Repas et représentation"
              value={repasRepresentation}
              setValue={setRepasRepresentation}
            />

            <MoneyField
              label="Assurances d’entreprise"
              value={assurances}
              setValue={setAssurances}
            />

            <MoneyField
              label="Intérêts et frais bancaires"
              value={interetsFraisBancaires}
              setValue={setInteretsFraisBancaires}
            />

            <MoneyField
              label="Frais de bureau"
              value={fraisBureau}
              setValue={setFraisBureau}
            />

            <MoneyField
              label="Fournitures"
              value={fournitures}
              setValue={setFournitures}
            />

            <MoneyField
              label="Honoraires professionnels"
              value={honorairesProfessionnels}
              setValue={setHonorairesProfessionnels}
            />

            <MoneyField
              label="Téléphone et Internet — portion affaires"
              value={telephoneInternet}
              setValue={setTelephoneInternet}
            />

            <MoneyField
              label="Sous-traitance"
              value={sousTraitance}
              setValue={setSousTraitance}
            />

            <MoneyField
              label="Salaires"
              value={salaires}
              setValue={setSalaires}
            />

            <MoneyField
              label="Loyer commercial"
              value={loyers}
              setValue={setLoyers}
            />

            <MoneyField
              label="Entretien et réparations"
              value={entretienReparations}
              setValue={setEntretienReparations}
            />

            <MoneyField
              label="Déplacements"
              value={deplacements}
              setValue={setDeplacements}
            />

            <MoneyField
              label="Autres dépenses"
              value={autresDepenses}
              setValue={setAutresDepenses}
            />

            {autresDepenses.trim() ? (
              <div className="ff-field">
                <label>Description des autres dépenses</label>

                <textarea
                  rows={3}
                  value={autresDepensesDescription}
                  onChange={(e) =>
                    setAutresDepensesDescription(
                      e.target.value
                    )
                  }
                  placeholder="Décrivez ces dépenses"
                />
              </div>
            ) : null}
          </Accordion>

          {/* ====================================================
              VÉHICULE
          ==================================================== */}

          <Accordion
            title="Véhicule"
            subtitle="Ouvrez seulement si vous avez utilisé un véhicule pour votre entreprise"
          >
            <YesNo
              label="Avez-vous utilisé un véhicule pour votre travail autonome ?"
              value={utiliseVehicule}
              setValue={setUtiliseVehicule}
            />

            {utiliseVehicule === true ? (
              <>
                <div className="ff-field">
                  <label>Kilométrage total pour l’année</label>

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
                  <label>Kilométrage pour affaires</label>

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
                  label="Essence / carburant"
                  value={carburant}
                  setValue={setCarburant}
                />

                <MoneyField
                  label="Assurance automobile"
                  value={assuranceAuto}
                  setValue={setAssuranceAuto}
                />

                <MoneyField
                  label="Immatriculation"
                  value={immatriculation}
                  setValue={setImmatriculation}
                />

                <MoneyField
                  label="Entretien et réparations"
                  value={entretienAuto}
                  setValue={setEntretienAuto}
                />

                <MoneyField
                  label="Intérêts sur financement automobile"
                  value={interetsAuto}
                  setValue={setInteretsAuto}
                />

                <MoneyField
                  label="Location du véhicule"
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
            title="Bureau à domicile"
            subtitle="Ouvrez seulement si vous utilisez votre résidence pour votre entreprise"
          >
            <YesNo
              label="Utilisez-vous une partie de votre domicile pour votre entreprise ?"
              value={bureauDomicile}
              setValue={setBureauDomicile}
            />

            {bureauDomicile === true ? (
              <>
                <div className="ff-field">
                  <label>
                    Superficie utilisée pour l’entreprise
                  </label>

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
                  <label>
                    Superficie totale de la résidence
                  </label>

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
                  label="Loyer de la résidence"
                  value={loyerResidence}
                  setValue={setLoyerResidence}
                />

                <MoneyField
                  label="Intérêts hypothécaires"
                  value={interetsHypothecaires}
                  setValue={setInteretsHypothecaires}
                />

                <MoneyField
                  label="Taxes municipales"
                  value={taxesMunicipales}
                  setValue={setTaxesMunicipales}
                />

                <MoneyField
                  label="Assurance habitation"
                  value={assuranceHabitation}
                  setValue={setAssuranceHabitation}
                />

                <MoneyField
                  label="Électricité et chauffage"
                  value={electriciteChauffage}
                  setValue={setElectriciteChauffage}
                />

                <MoneyField
                  label="Entretien de la résidence"
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
            title="Employés et sous-traitants"
            subtitle="Ouvrez seulement si vous avez payé des employés ou des sous-traitants"
          >
            <YesNo
              label="Avez-vous eu des employés ?"
              value={employes}
              setValue={setEmployes}
            />

            <YesNo
              label="Avez-vous payé des sous-traitants ?"
              value={sousTraitants}
              setValue={setSousTraitants}
            />
          </Accordion>

          {/* ====================================================
              ÉQUIPEMENTS
          ==================================================== */}

          <Accordion
            title="Équipements et achats importants"
            subtitle="Ordinateur, outils, mobilier, machinerie ou autres équipements"
          >
            <YesNo
              label="Avez-vous acheté de l’équipement ou des biens importants pour votre entreprise ?"
              value={achatsEquipements}
              setValue={setAchatsEquipements}
            />

            {achatsEquipements === true ? (
              <div className="ff-field">
                <label>
                  Décrivez les achats et indiquez leur coût
                </label>

                <textarea
                  rows={4}
                  value={detailsEquipements}
                  onChange={(e) =>
                    setDetailsEquipements(e.target.value)
                  }
                  placeholder="Ex. : ordinateur 1 800 $, outils 950 $, mobilier 600 $…"
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
            Ouvrez et remplissez uniquement les catégories qui
            s’appliquent à votre situation. Conservez vos factures,
            reçus et pièces justificatives.
          </div>
        </div>
      )}
    </section>
  );
}
