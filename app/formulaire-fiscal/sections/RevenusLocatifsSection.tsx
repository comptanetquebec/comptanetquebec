"use client";

import React from "react";
import type { ProvinceCode } from "../types";

type BoolChoice = boolean | undefined;

type Props = {
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
}: {
  label: string;
  value: BoolChoice;
  setValue: (v: BoolChoice) => void;
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
  return (
    <section className="ff-card">
      {/* ========================================================
          EN-TÊTE
      ======================================================== */}

      <div>
        <h2 style={{ marginBottom: 4 }}>
          Revenus de location
        </h2>

        <p
          style={{
            margin: 0,
            color: "#6b7280",
            lineHeight: 1.5,
          }}
        >
          Cochez cette section si vous avez reçu des revenus provenant
          d’un immeuble locatif, d’un duplex, d’un triplex, d’un condo
          loué ou d’une autre propriété locative.
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

        J’ai des revenus de location
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
            Ouvrez seulement les catégories qui s’appliquent à votre
            situation.
          </p>

          {/* ====================================================
              IMMEUBLE
          ==================================================== */}

          <Accordion
            title="Immeuble et adresse"
            subtitle="Adresse, type d’immeuble et nombre d’unités"
          >
            <div className="ff-field">
              <label>Adresse de l’immeuble</label>

              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Ex. : 123 rue Principale"
              />
            </div>

            <div className="ff-field">
              <label>Ville</label>

              <input
                type="text"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                placeholder="Ville"
              />
            </div>

            <div className="ff-field">
              <label>Province</label>

              <select
                value={province}
                onChange={(e) =>
                  setProvince(e.target.value as ProvinceCode)
                }
              >
                <option value="QC">Québec</option>
                <option value="ON">Ontario</option>
                <option value="NB">Nouveau-Brunswick</option>
                <option value="NS">Nouvelle-Écosse</option>
                <option value="PE">Île-du-Prince-Édouard</option>
                <option value="NL">Terre-Neuve-et-Labrador</option>
                <option value="MB">Manitoba</option>
                <option value="SK">Saskatchewan</option>
                <option value="AB">Alberta</option>
                <option value="BC">Colombie-Britannique</option>
                <option value="YT">Yukon</option>
                <option value="NT">Territoires du Nord-Ouest</option>
                <option value="NU">Nunavut</option>
              </select>
            </div>

            <div className="ff-field">
              <label>Code postal</label>

              <input
                type="text"
                value={codePostal}
                onChange={(e) => setCodePostal(e.target.value)}
                placeholder="A1A 1A1"
                maxLength={7}
              />
            </div>

            <div className="ff-field">
              <label>Type d’immeuble</label>

              <select
                value={typeImmeuble}
                onChange={(e) => setTypeImmeuble(e.target.value)}
              >
                <option value="">Sélectionner</option>
                <option value="maison">Maison</option>
                <option value="condo">Condo</option>
                <option value="duplex">Duplex</option>
                <option value="triplex">Triplex</option>
                <option value="multiplex">Multiplex</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div className="ff-field">
              <label>Nombre d’unités locatives</label>

              <input
                type="text"
                inputMode="numeric"
                value={nombreUnites}
                onChange={(e) => setNombreUnites(e.target.value)}
                placeholder="Ex. : 2"
              />
            </div>

            <div className="ff-field">
              <label>Date d’acquisition de l’immeuble</label>

              <input
                type="text"
                value={dateAcquisition}
                onChange={(e) => setDateAcquisition(e.target.value)}
                placeholder="JJ/MM/AAAA"
              />
            </div>
          </Accordion>

          {/* ====================================================
              PROPRIÉTÉ
          ==================================================== */}

          <Accordion
            title="Propriété et copropriétaires"
            subtitle="Votre pourcentage de propriété et les autres propriétaires"
          >
            <div className="ff-field">
              <label>Votre pourcentage de propriété</label>

              <input
                type="text"
                inputMode="decimal"
                value={pourcentagePropriete}
                onChange={(e) =>
                  setPourcentagePropriete(e.target.value)
                }
                placeholder="Ex. : 100 % ou 50 %"
              />
            </div>

            <YesNo
              label="Y a-t-il d’autres copropriétaires ?"
              value={coproprietaires}
              setValue={setCoproprietaires}
            />

            {coproprietaires === true ? (
              <div className="ff-field">
                <label>
                  Nom des copropriétaires et pourcentage de chacun
                </label>

                <textarea
                  rows={4}
                  value={detailsCoproprietaires}
                  onChange={(e) =>
                    setDetailsCoproprietaires(e.target.value)
                  }
                  placeholder="Ex. : Jean Tremblay — 50 %"
                />
              </div>
            ) : null}
          </Accordion>

          {/* ====================================================
              UTILISATION PERSONNELLE
          ==================================================== */}

          <Accordion
            title="Utilisation personnelle"
            subtitle="Ouvrez si vous habitez l’immeuble ou utilisez personnellement une partie de la propriété"
          >
            <YesNo
              label="Habitez-vous dans cet immeuble ou en utilisez-vous une partie personnellement ?"
              value={habiteImmeuble}
              setValue={setHabiteImmeuble}
            />

            {habiteImmeuble === true ? (
              <div className="ff-field">
                <label>
                  Pourcentage approximatif utilisé personnellement
                </label>

                <input
                  type="text"
                  inputMode="decimal"
                  value={pourcentagePersonnel}
                  onChange={(e) =>
                    setPourcentagePersonnel(e.target.value)
                  }
                  placeholder="Ex. : 50 %"
                />
              </div>
            ) : null}
          </Accordion>

          {/* ====================================================
              REVENUS
          ==================================================== */}

          <Accordion
            title="Revenus locatifs"
            subtitle="Loyers bruts reçus durant l’année"
          >
            <MoneyField
              label="Revenus locatifs bruts"
              value={revenus}
              setValue={setRevenus}
            />

            <small style={{ color: "#64748b" }}>
              Inscrivez les revenus avant de soustraire les dépenses.
            </small>
          </Accordion>

          {/* ====================================================
              DÉPENSES
          ==================================================== */}

          <Accordion
            title="Dépenses de l’immeuble"
            subtitle="Taxes, assurances, intérêts, réparations, services publics et autres dépenses"
          >
            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: 14,
              }}
            >
              Remplissez uniquement les catégories qui s’appliquent.
            </p>

            <MoneyField
              label="Total approximatif des dépenses"
              value={depenses}
              setValue={setDepenses}
            />

            <MoneyField
              label="Taxes municipales"
              value={taxesMunicipales}
              setValue={setTaxesMunicipales}
            />

            <MoneyField
              label="Taxes scolaires"
              value={taxesScolaires}
              setValue={setTaxesScolaires}
            />

            <MoneyField
              label="Assurances"
              value={assurances}
              setValue={setAssurances}
            />

            <MoneyField
              label="Intérêts hypothécaires"
              value={interetsHypothecaires}
              setValue={setInteretsHypothecaires}
            />

            <MoneyField
              label="Entretien et réparations"
              value={entretienReparations}
              setValue={setEntretienReparations}
            />

            <MoneyField
              label="Électricité"
              value={electricite}
              setValue={setElectricite}
            />

            <MoneyField
              label="Chauffage"
              value={chauffage}
              setValue={setChauffage}
            />

            <MoneyField
              label="Eau"
              value={eau}
              setValue={setEau}
            />

            <MoneyField
              label="Publicité"
              value={publicite}
              setValue={setPublicite}
            />

            <MoneyField
              label="Frais de gestion"
              value={fraisGestion}
              setValue={setFraisGestion}
            />

            <MoneyField
              label="Honoraires professionnels"
              value={honorairesProfessionnels}
              setValue={setHonorairesProfessionnels}
            />

            <MoneyField
              label="Frais bancaires"
              value={fraisBancaires}
              setValue={setFraisBancaires}
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
                    setAutresDepensesDescription(e.target.value)
                  }
                  placeholder="Précisez la nature de ces dépenses"
                />
              </div>
            ) : null}
          </Accordion>

          {/* ====================================================
              RÉNOVATIONS
          ==================================================== */}

          <Accordion
            title="Rénovations importantes"
            subtitle="Ouvrez si vous avez effectué des rénovations ou améliorations importantes"
          >
            <YesNo
              label="Avez-vous effectué des rénovations ou améliorations importantes durant l’année ?"
              value={renovationsImportantes}
              setValue={setRenovationsImportantes}
            />

            {renovationsImportantes === true ? (
              <div className="ff-field">
                <label>
                  Décrivez les travaux et indiquez leur coût
                </label>

                <textarea
                  rows={4}
                  value={detailsRenovations}
                  onChange={(e) =>
                    setDetailsRenovations(e.target.value)
                  }
                  placeholder="Ex. : remplacement des fenêtres — 12 000 $"
                />
              </div>
            ) : null}
          </Accordion>

          {/* ====================================================
              ÉQUIPEMENTS
          ==================================================== */}

          <Accordion
            title="Équipements et achats importants"
            subtitle="Électroménagers, meubles, équipements ou autres biens achetés pour la location"
          >
            <YesNo
              label="Avez-vous acheté des équipements ou des biens importants pour l’immeuble ?"
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
                  placeholder="Ex. : réfrigérateur 1 400 $, laveuse 900 $…"
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
            s’appliquent à votre situation. Conservez vos relevés,
            factures, reçus et autres pièces justificatives.
          </div>
        </div>
      )}
    </section>
  );
}
