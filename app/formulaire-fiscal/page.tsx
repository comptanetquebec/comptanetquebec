"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ProvinceCode =
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

type Child = {
  prenom: string;
  nom: string;
  dob: string; // JJ/MM/AAAA
  nas: string;
  sexe: string;
};

export default function FormulaireFiscalPage() {
  const router = useRouter();
  const params = useSearchParams();
  const type = (params.get("type") || "t1").toLowerCase(); // "t1" ou "autonome" ou "t2"

  // --- Infos client principal ---
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [nas, setNas] = useState("");
  const [dob, setDob] = useState(""); // JJ/MM/AAAA
  const [etatCivil, setEtatCivil] = useState<
    | "celibataire"
    | "conjointDefait"
    | "marie"
    | "separe"
    | "divorce"
    | "veuf"
    | ""
  >("");

  const [etatCivilChange, setEtatCivilChange] = useState(false);
  const [ancienEtatCivil, setAncienEtatCivil] = useState("");
  const [dateChangementEtatCivil, setDateChangementEtatCivil] = useState("");

  // Coordonnées client
  const [tel, setTel] = useState("");
  const [telCell, setTelCell] = useState("");
  const [adresse, setAdresse] = useState("");
  const [app, setApp] = useState("");
  const [ville, setVille] = useState("");
  const [province, setProvince] = useState<ProvinceCode>("QC");
  const [codePostal, setCodePostal] = useState("");
  const [courriel, setCourriel] = useState("");

  // --- Infos conjoint ---
  const [aUnConjoint, setAUnConjoint] = useState(false);
  const [traiterConjoint, setTraiterConjoint] = useState(true);
  const [prenomConjoint, setPrenomConjoint] = useState("");
  const [nomConjoint, setNomConjoint] = useState("");
  const [nasConjoint, setNasConjoint] = useState("");
  const [dobConjoint, setDobConjoint] = useState("");
  const [telConjoint, setTelConjoint] = useState("");
  const [telCellConjoint, setTelCellConjoint] = useState("");
  const [courrielConjoint, setCourrielConjoint] = useState("");
  const [adresseConjointeIdentique, setAdresseConjointeIdentique] =
    useState(true);
  const [adresseConjoint, setAdresseConjoint] = useState("");
  const [appConjoint, setAppConjoint] = useState("");
  const [villeConjoint, setVilleConjoint] = useState("");
  const [provinceConjoint, setProvinceConjoint] = useState<ProvinceCode>("QC");
  const [codePostalConjoint, setCodePostalConjoint] = useState("");
  const [revenuNetConjoint, setRevenuNetConjoint] = useState("");

  // --- Assurance médicaments (Québec uniquement) ---
  // On demande qui couvrait les médicaments et pour quelles périodes
  // RAMQ / Régime privé / Régime du conjoint ou du parent
  const [assuranceMedsClient, setAssuranceMedsClient] = useState<
    "ramq" | "prive" | "conjoint" | ""
  >("");
  const [assuranceMedsClientPeriodes, setAssuranceMedsClientPeriodes] =
    useState([{ debut: "", fin: "" }]);

  const [assuranceMedsConjoint, setAssuranceMedsConjoint] = useState<
    "ramq" | "prive" | "conjoint" | ""
  >("");
  const [assuranceMedsConjointPeriodes, setAssuranceMedsConjointPeriodes] =
    useState([{ debut: "", fin: "" }]);

  // --- Enfants / personnes à charge ---
  const [enfants, setEnfants] = useState<Child[]>([]);

  function ajouterEnfant() {
    setEnfants((prev) => [
      ...prev,
      { prenom: "", nom: "", dob: "", nas: "", sexe: "" },
    ]);
  }

  function updateEnfant(i: number, field: keyof Child, value: string) {
    setEnfants((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };
      return copy;
    });
  }

  // --- Questions générales ---
  const [habiteSeulTouteAnnee, setHabiteSeulTouteAnnee] = useState<
    "oui" | "non" | ""
  >("");
  const [nbPersonnesMaison3112, setNbPersonnesMaison3112] = useState("");
  const [biensEtranger100k, setBiensEtranger100k] = useState<"oui" | "non" | "">(
    ""
  );
  const [citoyenCanadien, setCitoyenCanadien] = useState<
    "oui" | "non" | ""
  >("");
  const [nonResident, setNonResident] = useState<"oui" | "non" | "">("");
  const [maisonAcheteeOuVendue, setMaisonAcheteeOuVendue] = useState<
    "oui" | "non" | ""
  >("");
  const [appelerTechnicien, setAppelerTechnicien] = useState<
    "oui" | "non" | ""
  >("");

  const [copieImpots, setCopieImpots] = useState<
    "espaceClient" | "courriel" | ""
  >("");
  const [paiement, setPaiement] = useState<"interac" | "carte" | "">("");

  // --- Soumission ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Ici tu enverrais vers ton backend / API / sauvegarde BD
    // Pour l’instant on fait juste un résumé console + redirection
    const payload = {
      dossierType: type, // t1 / autonome / t2
      client: {
        prenom,
        nom,
        nas,
        dob,
        etatCivil,
        etatCivilChange,
        ancienEtatCivil,
        dateChangementEtatCivil,
        tel,
        telCell,
        adresse,
        app,
        ville,
        province,
        codePostal,
        courriel,
      },
      conjoint: aUnConjoint
        ? {
            traiterConjoint,
            prenomConjoint,
            nomConjoint,
            nasConjoint,
            dobConjoint,
            telConjoint,
            telCellConjoint,
            courrielConjoint,
            adresseConjointeIdentique,
            adresseConjoint:
              adresseConjointeIdentique ? adresse : adresseConjoint,
            appConjoint: adresseConjointeIdentique ? app : appConjoint,
            villeConjoint: adresseConjointeIdentique ? ville : villeConjoint,
            provinceConjoint: adresseConjointeIdentique
              ? province
              : provinceConjoint,
            codePostalConjoint: adresseConjointeIdentique
              ? codePostal
              : codePostalConjoint,
            revenuNetConjoint: traiterConjoint ? "" : revenuNetConjoint,
          }
        : null,
      assuranceMedicamenteuse:
        province === "QC"
          ? {
              client: {
                regime: assuranceMedsClient,
                periodes: assuranceMedsClientPeriodes,
              },
              conjoint: aUnConjoint
                ? {
                    regime: assuranceMedsConjoint,
                    periodes: assuranceMedsConjointPeriodes,
                  }
                : null,
            }
          : null,
      personnesACharge: enfants,
      questionsGenerales: {
        habiteSeulTouteAnnee,
        nbPersonnesMaison3112,
        biensEtranger100k,
        citoyenCanadien,
        nonResident,
        maisonAcheteeOuVendue,
        appelerTechnicien,
        copieImpots,
        paiement,
      },
    };

    console.log("FORM SUBMIT", payload);

    // Redirection vers "nouveau dossier"
    router.push("/dossiers/nouveau");
  }

  return (
    <main className="max-w-3xl mx-auto p-6 text-gray-800">
      <h1 className="text-2xl font-bold mb-2">
        Formulaire fiscal {type.toUpperCase()}
      </h1>
      <p className="text-sm text-gray-600 mb-8">
        Merci de remplir ce formulaire après avoir créé votre compte. Nous
        utilisons ces informations pour préparer vos déclarations d’impôt au
        Canada (fédéral) et, si applicable, au Québec.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-8">
        {/* --- SECTION CLIENT --- */}
        <section className="border rounded-lg p-4">
          <h2 className="font-semibold text-lg text-blue-800 mb-4">
            Informations du client
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Field
              label="Prénom"
              value={prenom}
              onChange={setPrenom}
              required
            />
            <Field label="Nom" value={nom} onChange={setNom} required />
            <Field
              label="Numéro d’assurance sociale (NAS)"
              value={nas}
              onChange={setNas}
              placeholder="___-___-___"
              required
            />
            <Field
              label="Date de naissance (JJ/MM/AAAA)"
              value={dob}
              onChange={setDob}
              placeholder="01/01/1990"
              required
            />
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <SelectField
              label="État civil"
              value={etatCivil}
              onChange={setEtatCivil}
              options={[
                { value: "", label: "Sélectionnez..." },
                { value: "celibataire", label: "Célibataire" },
                { value: "conjointDefait", label: "Conjoint de fait" },
                { value: "marie", label: "Marié(e)" },
                { value: "separe", label: "Séparé(e)" },
                { value: "divorce", label: "Divorcé(e)" },
                { value: "veuf", label: "Veuf(ve)" },
              ]}
              required
            />

            <CheckboxField
              label="Mon état civil a changé durant l'année"
              checked={etatCivilChange}
              onChange={setEtatCivilChange}
            />
          </div>

          {etatCivilChange && (
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <Field
                label="Ancien état civil"
                value={ancienEtatCivil}
                onChange={setAncienEtatCivil}
                placeholder="ex.: Célibataire"
              />
              <Field
                label="Date du changement (JJ/MM/AAAA)"
                value={dateChangementEtatCivil}
                onChange={setDateChangementEtatCivil}
                placeholder="15/07/2024"
              />
            </div>
          )}

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <Field
              label="Téléphone"
              value={tel}
              onChange={setTel}
              placeholder="(xxx) xxx-xxxx"
            />
            <Field
              label="Cellulaire"
              value={telCell}
              onChange={setTelCell}
              placeholder="(xxx) xxx-xxxx"
            />
            <Field
              label="Courriel"
              value={courriel}
              onChange={setCourriel}
              type="email"
              required
            />
          </div>

          <div className="mt-6 grid gap-4">
            <Field
              label="Adresse (rue)"
              value={adresse}
              onChange={setAdresse}
              required
            />
            <div className="grid md:grid-cols-4 gap-4">
              <Field
                label="App."
                value={app}
                onChange={setApp}
                placeholder="#201"
              />
              <Field label="Ville" value={ville} onChange={setVille} required />
              <SelectField
                label="Province"
                value={province}
                onChange={(v) => setProvince(v as ProvinceCode)}
                options={[
                  { value: "QC", label: "QC" },
                  { value: "ON", label: "ON" },
                  { value: "NB", label: "NB" },
                  { value: "NS", label: "NS" },
                  { value: "PE", label: "PE" },
                  { value: "NL", label: "NL" },
                  { value: "MB", label: "MB" },
                  { value: "SK", label: "SK" },
                  { value: "AB", label: "AB" },
                  { value: "BC", label: "BC" },
                  { value: "YT", label: "YT" },
                  { value: "NT", label: "NT" },
                  { value: "NU", label: "NU" },
                ]}
                required
              />
              <Field
                label="Code postal"
                value={codePostal}
                onChange={setCodePostal}
                placeholder="A1A 1A1"
                required
              />
            </div>
          </div>
        </section>

        {/* --- SECTION CONJOINT --- */}
        <section className="border rounded-lg p-4">
          <h2 className="font-semibold text-lg text-blue-800 mb-4">
            Conjoint
          </h2>

          <CheckboxField
            label="J'ai un conjoint / conjointe"
            checked={aUnConjoint}
            onChange={setAUnConjoint}
          />

          {aUnConjoint && (
            <>
              <CheckboxField
                label="Traiter aussi la déclaration du conjoint"
                checked={traiterConjoint}
                onChange={setTraiterConjoint}
              />

              {!traiterConjoint && (
                <Field
                  label="Revenu net approximatif du conjoint ($)"
                  value={revenuNetConjoint}
                  onChange={setRevenuNetConjoint}
                  placeholder="ex.: 42 000"
                />
              )}

              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <Field
                  label="Prénom (conjoint)"
                  value={prenomConjoint}
                  onChange={setPrenomConjoint}
                  required={aUnConjoint}
                />
                <Field
                  label="Nom (conjoint)"
                  value={nomConjoint}
                  onChange={setNomConjoint}
                  required={aUnConjoint}
                />
                <Field
                  label="NAS (conjoint)"
                  value={nasConjoint}
                  onChange={setNasConjoint}
                  placeholder="___-___-___"
                />
                <Field
                  label="Date de naissance (JJ/MM/AAAA)"
                  value={dobConjoint}
                  onChange={setDobConjoint}
                  placeholder="01/01/1990"
                />
              </div>

              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <Field
                  label="Téléphone (conjoint)"
                  value={telConjoint}
                  onChange={setTelConjoint}
                  placeholder="(xxx) xxx-xxxx"
                />
                <Field
                  label="Cellulaire (conjoint)"
                  value={telCellConjoint}
                  onChange={setTelCellConjoint}
                  placeholder="(xxx) xxx-xxxx"
                />
                <Field
                  label="Courriel (conjoint)"
                  value={courrielConjoint}
                  onChange={setCourrielConjoint}
                  type="email"
                />
              </div>

              <CheckboxField
                label="L'adresse du conjoint est identique à la mienne"
                checked={adresseConjointeIdentique}
                onChange={setAdresseConjointeIdentique}
              />

              {!adresseConjointeIdentique && (
                <div className="mt-4 grid gap-4">
                  <Field
                    label="Adresse (rue) - conjoint"
                    value={adresseConjoint}
                    onChange={setAdresseConjoint}
                  />
                  <div className="grid md:grid-cols-4 gap-4">
                    <Field
                      label="App."
                      value={appConjoint}
                      onChange={setAppConjoint}
                    />
                    <Field
                      label="Ville"
                      value={villeConjoint}
                      onChange={setVilleConjoint}
                    />
                    <SelectField
                      label="Province"
                      value={provinceConjoint}
                      onChange={(v) => setProvinceConjoint(v as ProvinceCode)}
                      options={[
                        { value: "QC", label: "QC" },
                        { value: "ON", label: "ON" },
                        { value: "NB", label: "NB" },
                        { value: "NS", label: "NS" },
                        { value: "PE", label: "PE" },
                        { value: "NL", label: "NL" },
                        { value: "MB", label: "MB" },
                        { value: "SK", label: "SK" },
                        { value: "AB", label: "AB" },
                        { value: "BC", label: "BC" },
                        { value: "YT", label: "YT" },
                        { value: "NT", label: "NT" },
                        { value: "NU", label: "NU" },
                      ]}
                    />
                    <Field
                      label="Code postal"
                      value={codePostalConjoint}
                      onChange={setCodePostalConjoint}
                      placeholder="A1A 1A1"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* --- SECTION ASSURANCE MÉDICAMENTS (QC seulement) --- */}
        {province === "QC" && (
          <section className="border rounded-lg p-4">
            <h2 className="font-semibold text-lg text-blue-800 mb-4">
              Assurance médicaments (Québec)
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Pour la RAMQ et les régimes privés, nous devons savoir qui vous
              couvrait pour vos médicaments et à quelles dates.
            </p>

            <h3 className="font-medium text-gray-800">
              Couverture du client
            </h3>
            <SelectField
              label="Votre couverture médicaments"
              value={assuranceMedsClient}
              onChange={(v) =>
                setAssuranceMedsClient(v as "ramq" | "prive" | "conjoint" | "")
              }
              options={[
                { value: "", label: "Sélectionnez..." },
                { value: "ramq", label: "Régime public (RAMQ)" },
                { value: "prive", label: "Mon régime collectif privé" },
                {
                  value: "conjoint",
                  label: "Régime du conjoint / d'un parent",
                },
              ]}
            />

            {assuranceMedsClientPeriodes.map((p, idx) => (
              <div
                key={idx}
                className="grid md:grid-cols-2 gap-4 mt-2 border p-3 rounded"
              >
                <Field
                  label="De (JJ/MM/AAAA)"
                  value={p.debut}
                  onChange={(val) => {
                    const copy = [...assuranceMedsClientPeriodes];
                    copy[idx].debut = val;
                    setAssuranceMedsClientPeriodes(copy);
                  }}
                  placeholder="01/01/2024"
                />
                <Field
                  label="À (JJ/MM/AAAA)"
                  value={p.fin}
                  onChange={(val) => {
                    const copy = [...assuranceMedsClientPeriodes];
                    copy[idx].fin = val;
                    setAssuranceMedsClientPeriodes(copy);
                  }}
                  placeholder="31/12/2024"
                />
              </div>
            ))}

            {aUnConjoint && (
              <>
                <h3 className="font-medium text-gray-800 mt-6">
                  Couverture du conjoint
                </h3>
                <SelectField
                  label="Couverture médicaments du conjoint"
                  value={assuranceMedsConjoint}
                  onChange={(v) =>
                    setAssuranceMedsConjoint(
                      v as "ramq" | "prive" | "conjoint" | ""
                    )
                  }
                  options={[
                    { value: "", label: "Sélectionnez..." },
                    { value: "ramq", label: "Régime public (RAMQ)" },
                    { value: "prive", label: "Régime collectif privé" },
                    {
                      value: "conjoint",
                      label: "Régime du conjoint / d'un parent",
                    },
                  ]}
                />

                {assuranceMedsConjointPeriodes.map((p, idx) => (
                  <div
                    key={idx}
                    className="grid md:grid-cols-2 gap-4 mt-2 border p-3 rounded"
                  >
                    <Field
                      label="De (JJ/MM/AAAA)"
                      value={p.debut}
                      onChange={(val) => {
                        const copy = [...assuranceMedsConjointPeriodes];
                        copy[idx].debut = val;
                        setAssuranceMedsConjointPeriodes(copy);
                      }}
                      placeholder="01/01/2024"
                    />
                    <Field
                      label="À (JJ/MM/AAAA)"
                      value={p.fin}
                      onChange={(val) => {
                        const copy = [...assuranceMedsConjointPeriodes];
                        copy[idx].fin = val;
                        setAssuranceMedsConjointPeriodes(copy);
                      }}
                      placeholder="31/12/2024"
                    />
                  </div>
                ))}
              </>
            )}
          </section>
        )}

        {/* --- SECTION PERSONNES À CHARGE --- */}
        <section className="border rounded-lg p-4">
          <h2 className="font-semibold text-lg text-blue-800 mb-4">
            Personnes à charge
          </h2>

          {enfants.length === 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Ajoutez vos enfants / personnes à charge (le cas échéant).
            </p>
          )}

          {enfants.map((enf, i) => (
            <div
              key={i}
              className="border rounded p-4 mb-4 bg-gray-50 grid gap-4"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <Field
                  label="Prénom"
                  value={enf.prenom}
                  onChange={(v) => updateEnfant(i, "prenom", v)}
                />
                <Field
                  label="Nom"
                  value={enf.nom}
                  onChange={(v) => updateEnfant(i, "nom", v)}
                />
                <Field
                  label="Date de naissance (JJ/MM/AAAA)"
                  value={enf.dob}
                  onChange={(v) => updateEnfant(i, "dob", v)}
                  placeholder="01/01/2020"
                />
                <Field
                  label="NAS (si attribué)"
                  value={enf.nas}
                  onChange={(v) => updateEnfant(i, "nas", v)}
                  placeholder="___-___-___"
                />
              </div>

              <SelectField
                label="Sexe"
                value={enf.sexe}
                onChange={(v) => updateEnfant(i, "sexe", v)}
                options={[
                  { value: "", label: "Sélectionnez..." },
                  { value: "M", label: "M" },
                  { value: "F", label: "F" },
                  { value: "X", label: "Autre / préfère ne pas dire" },
                ]}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={ajouterEnfant}
            className="inline-block text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded px-3 py-2"
          >
            + Ajouter une personne à charge
          </button>
        </section>

        {/* --- SECTION QUESTIONS GÉNÉRALES --- */}
        <section className="border rounded-lg p-4">
          <h2 className="font-semibold text-lg text-blue-800 mb-4">
            Informations fiscales additionnelles
          </h2>

          <YesNoField
            label="Avez-vous habité seul(e) toute l'année (sans personne à charge)?"
            value={habiteSeulTouteAnnee}
            onChange={setHabiteSeulTouteAnnee}
          />

          <Field
            label="Au 31/12, combien de personnes vivaient avec vous ?"
            value={nbPersonnesMaison3112}
            onChange={setNbPersonnesMaison3112}
            placeholder="ex.: 1, 2, 3..."
          />

          <YesNoField
            label="Avez-vous plus de 100 000 $ de biens à l'étranger ?"
            value={biensEtranger100k}
            onChange={setBiensEtranger100k}
          />

          <YesNoField
            label="Êtes-vous citoyen(ne) canadien(ne) ?"
            value={citoyenCanadien}
            onChange={setCitoyenCanadien}
          />

          <YesNoField
            label="Êtes-vous non-résident(e) du Canada aux fins fiscales ?"
            value={nonResident}
            onChange={setNonResident}
          />

          <YesNoField
            label="Avez-vous acheté une première habitation ou vendu votre résidence principale cette année ?"
            value={maisonAcheteeOuVendue}
            onChange={setMaisonAcheteeOuVendue}
          />

          <YesNoField
            label="Souhaitez-vous qu'un technicien vous appelle ?"
            value={appelerTechnicien}
            onChange={setAppelerTechnicien}
          />

          <SelectField
            label="Comment voulez-vous recevoir votre copie d'impôt ?"
            value={copieImpots}
            onChange={(v) =>
              setCopieImpots(v as "espaceClient" | "courriel" | "")
            }
            options={[
              { value: "", label: "Sélectionnez..." },
              { value: "espaceClient", label: "Espace client" },
              { value: "courriel", label: "Courriel" },
            ]}
          />

          <SelectField
            label="Mode de paiement prévu"
            value={paiement}
            onChange={(v) =>
              setPaiement(v as "interac" | "carte" | "")
            }
            options={[
              { value: "", label: "Sélectionnez..." },
              { value: "interac", label: "Virement Interac" },
              { value: "carte", label: "Carte de crédit" },
            ]}
          />
        </section>

        {/* SUBMIT */}
        <button
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg py-3 text-center"
        >
          Soumettre mes informations fiscales
        </button>
      </form>

      <p className="text-[11px] text-gray-500 mt-6 text-center">
        Vos informations sont traitées de façon confidentielle et servent à
        préparer vos déclarations T1 (particulier / travail autonome) et T2
        (société) au Canada. Au Québec, nous produisons aussi la déclaration
        provinciale.
      </p>
    </main>
  );
}

/* ----------------- Petits sous-composants réutilisables ----------------- */

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="text-sm font-medium text-gray-700 grid gap-1">
      <span>{label}{required ? " *" : ""}</span>
      <input
        className="border rounded px-3 py-2 text-sm w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

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
    <label className="flex items-start gap-2 text-sm font-medium text-gray-700">
      <input
        type="checkbox"
        className="mt-1"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-1 text-sm font-medium text-gray-700">
      <span>{label}</span>
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={label}
            value="oui"
            checked={value === "oui"}
            onChange={(e) => onChange(e.target.value)}
          />
          <span>Oui</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={label}
            value="non"
            checked={value === "non"}
            onChange={(e) => onChange(e.target.value)}
          />
          <span>Non</span>
        </label>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <label className="text-sm font-medium text-gray-700 grid gap-1">
      <span>{label}{required ? " *" : ""}</span>
      <select
        className="border rounded px-3 py-2 text-sm w-full bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
