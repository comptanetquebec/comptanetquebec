"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import "./formulaire-fiscal.css";

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

function titleFromType(type: string) {
  if (type === "autonome") return "Travailleur autonome (T1)";
  if (type === "t2") return "Société (T2)";
  return "Particulier (T1)";
}

function normalizeType(v: string) {
  const x = (v || "").toLowerCase();
  if (x === "t1" || x === "autonome" || x === "t2") return x;
  return "t1";
}

function normalizeLang(v: string) {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? x : "fr";
}

// petites normalisations “qualité”
function normalizeNAS(v: string) {
  return (v || "").replace(/\D+/g, "").slice(0, 9);
}
function normalizePostal(v: string) {
  return (v || "").trim().toUpperCase();
}
function normalizePhone(v: string) {
  return (v || "").trim();
}

export default function FormulaireFiscalPage() {
  const router = useRouter();
  const params = useSearchParams();

  const type = normalizeType(params.get("type") || "t1");
  const lang = normalizeLang(params.get("lang") || "fr");

  const formTitle = useMemo(() => titleFromType(type), [type]);

  const [booting, setBooting] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const redirected = useRef(false);

  // --- Infos client principal ---
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [nas, setNas] = useState("");
  const [dob, setDob] = useState("");
  const [etatCivil, setEtatCivil] = useState<
    "celibataire" | "conjointDefait" | "marie" | "separe" | "divorce" | "veuf" | ""
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
  const [adresseConjointeIdentique, setAdresseConjointeIdentique] = useState(true);
  const [adresseConjoint, setAdresseConjoint] = useState("");
  const [appConjoint, setAppConjoint] = useState("");
  const [villeConjoint, setVilleConjoint] = useState("");
  const [provinceConjoint, setProvinceConjoint] = useState<ProvinceCode>("QC");
  const [codePostalConjoint, setCodePostalConjoint] = useState("");
  const [revenuNetConjoint, setRevenuNetConjoint] = useState("");

  // --- Assurance médicaments (Québec uniquement) ---
  const [assuranceMedsClient, setAssuranceMedsClient] = useState<"ramq" | "prive" | "conjoint" | "">(
    ""
  );
  const [assuranceMedsClientPeriodes, setAssuranceMedsClientPeriodes] = useState([{ debut: "", fin: "" }]);

  const [assuranceMedsConjoint, setAssuranceMedsConjoint] = useState<"ramq" | "prive" | "conjoint" | "">(
    ""
  );
  const [assuranceMedsConjointPeriodes, setAssuranceMedsConjointPeriodes] = useState([{ debut: "", fin: "" }]);

  // --- Enfants / personnes à charge ---
  const [enfants, setEnfants] = useState<Child[]>([]);

  function ajouterEnfant() {
    setEnfants((prev) => [...prev, { prenom: "", nom: "", dob: "", nas: "", sexe: "" }]);
  }
  function updateEnfant(i: number, field: keyof Child, value: string) {
    setEnfants((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };
      return copy;
    });
  }
  function removeEnfant(i: number) {
    setEnfants((prev) => prev.filter((_, idx) => idx !== i));
  }

  // --- Questions générales ---
  const [habiteSeulTouteAnnee, setHabiteSeulTouteAnnee] = useState<"oui" | "non" | "">("");
  const [nbPersonnesMaison3112, setNbPersonnesMaison3112] = useState("");
  const [biensEtranger100k, setBiensEtranger100k] = useState<"oui" | "non" | "">("");
  const [citoyenCanadien, setCitoyenCanadien] = useState<"oui" | "non" | "">("");
  const [nonResident, setNonResident] = useState<"oui" | "non" | "">("");
  const [maisonAcheteeOuVendue, setMaisonAcheteeOuVendue] = useState<"oui" | "non" | "">("");
  const [appelerTechnicien, setAppelerTechnicien] = useState<"oui" | "non" | "">("");

  const [copieImpots, setCopieImpots] = useState<"espaceClient" | "courriel" | "">("");
  const [paiement, setPaiement] = useState<"interac" | "carte" | "">("");

  // ✅ Auth guard
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!alive) return;

      if (error || !data.user) {
        if (!redirected.current) {
          redirected.current = true;

          // IMPORTANT: stop booting avant de naviguer
          setBooting(false);

          const next = `/formulaire-fiscal?type=${encodeURIComponent(type)}&lang=${encodeURIComponent(lang)}`;
          router.replace(`/espace-client?lang=${encodeURIComponent(lang)}&next=${encodeURIComponent(next)}`);
        }
        return;
      }

      setUserId(data.user.id);
      setBooting(false);
    })();

    return () => {
      alive = false;
    };
  }, [router, lang, type]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace(`/espace-client?lang=${encodeURIComponent(lang)}`);
  };

  // --- Soumission ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!userId) {
      setMsg("Veuillez vous reconnecter.");
      router.replace(`/espace-client?lang=${encodeURIComponent(lang)}`);
      return;
    }

    const payload = {
      dossierType: type,
      client: {
        prenom: prenom.trim(),
        nom: nom.trim(),
        nas: normalizeNAS(nas),
        dob: dob.trim(),
        etatCivil,
        etatCivilChange,
        ancienEtatCivil: ancienEtatCivil.trim(),
        dateChangementEtatCivil: dateChangementEtatCivil.trim(),
        tel: normalizePhone(tel),
        telCell: normalizePhone(telCell),
        adresse: adresse.trim(),
        app: app.trim(),
        ville: ville.trim(),
        province,
        codePostal: normalizePostal(codePostal),
        courriel: courriel.trim().toLowerCase(),
      },
      conjoint: aUnConjoint
        ? {
            traiterConjoint,
            prenomConjoint: prenomConjoint.trim(),
            nomConjoint: nomConjoint.trim(),
            nasConjoint: normalizeNAS(nasConjoint),
            dobConjoint: dobConjoint.trim(),
            telConjoint: normalizePhone(telConjoint),
            telCellConjoint: normalizePhone(telCellConjoint),
            courrielConjoint: courrielConjoint.trim().toLowerCase(),
            adresseConjointeIdentique,
            adresseConjoint: (adresseConjointeIdentique ? adresse : adresseConjoint).trim(),
            appConjoint: (adresseConjointeIdentique ? app : appConjoint).trim(),
            villeConjoint: (adresseConjointeIdentique ? ville : villeConjoint).trim(),
            provinceConjoint: adresseConjointeIdentique ? province : provinceConjoint,
            codePostalConjoint: normalizePostal(adresseConjointeIdentique ? codePostal : codePostalConjoint),
            revenuNetConjoint: traiterConjoint ? "" : revenuNetConjoint.trim(),
          }
        : null,
      assuranceMedicamenteuse:
        province === "QC"
          ? {
              client: { regime: assuranceMedsClient, periodes: assuranceMedsClientPeriodes },
              conjoint: aUnConjoint
                ? { regime: assuranceMedsConjoint, periodes: assuranceMedsConjointPeriodes }
                : null,
            }
          : null,
      personnesACharge: enfants.map((e) => ({
        prenom: e.prenom.trim(),
        nom: e.nom.trim(),
        dob: e.dob.trim(),
        nas: normalizeNAS(e.nas),
        sexe: e.sexe,
      })),
      questionsGenerales: {
        habiteSeulTouteAnnee,
        nbPersonnesMaison3112: nbPersonnesMaison3112.trim(),
        biensEtranger100k,
        citoyenCanadien,
        nonResident,
        maisonAcheteeOuVendue,
        appelerTechnicien,
        copieImpots,
        paiement,
      },
    };

    setSubmitting(true);

    const { error } = await supabase.from("formulaires_fiscaux").insert({
      user_id: userId,
      dossier_type: type,
      lang,
      payload,
    });

    setSubmitting(false);

    if (error) {
      setMsg(`Erreur: ${error.message}`);
      return;
    }

    router.push(`/merci?lang=${encodeURIComponent(lang)}`);
  }

  if (booting) {
    return (
      <main className="ff-bg">
        <div className="ff-container">
          <div style={{ padding: 24 }}>Chargement…</div>
        </div>
      </main>
    );
  }

  return (
    <main className="ff-bg">
      <div className="ff-container">
        {/* Header */}
        <header className="ff-header">
          <div className="ff-brand">
            <Image
              src="/logo-cq.png"
              alt="ComptaNet Québec"
              width={120}
              height={40}
              priority
              style={{ height: 40, width: "auto" }}
            />
            <div className="ff-brand-text">
              <strong>ComptaNet Québec</strong>
              <span>Formulaire fiscal</span>
            </div>
          </div>

          <button className="ff-btn ff-btn-outline" type="button" onClick={logout}>
            Se déconnecter
          </button>
        </header>

        {/* Title */}
        <div className="ff-title">
          <h1>Formulaire – {formTitle}</h1>
          <p>
            Merci de remplir ce formulaire après avoir créé votre compte. Nous utilisons ces informations pour préparer
            vos déclarations d’impôt au Canada (fédéral) et, si applicable, au Québec.
          </p>
        </div>

        {msg && (
          <div className="ff-card" style={{ padding: 14 }}>
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="ff-form">
          {/* SECTION CLIENT */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Informations du client</h2>
              <p>Informations essentielles pour l’ouverture du dossier.</p>
            </div>

            <div className="ff-grid2">
              <Field label="Prénom" value={prenom} onChange={setPrenom} required />
              <Field label="Nom" value={nom} onChange={setNom} required />
              <Field
                label="Numéro d’assurance sociale (NAS)"
                value={nas}
                onChange={setNas}
                placeholder="___-___-___"
                required
              />
              <Field label="Date de naissance (JJ/MM/AAAA)" value={dob} onChange={setDob} placeholder="01/01/1990" required />
            </div>

            <div className="ff-grid2 ff-mt">
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
              <div className="ff-grid2 ff-mt">
                <Field label="Ancien état civil" value={ancienEtatCivil} onChange={setAncienEtatCivil} placeholder="ex.: Célibataire" />
                <Field label="Date du changement (JJ/MM/AAAA)" value={dateChangementEtatCivil} onChange={setDateChangementEtatCivil} placeholder="15/07/2024" />
              </div>
            )}

            <div className="ff-grid2 ff-mt">
              <Field label="Téléphone" value={tel} onChange={setTel} placeholder="(xxx) xxx-xxxx" />
              <Field label="Cellulaire" value={telCell} onChange={setTelCell} placeholder="(xxx) xxx-xxxx" />
              <Field label="Courriel" value={courriel} onChange={setCourriel} type="email" required />
            </div>

            <div className="ff-mt">
              <Field label="Adresse (rue)" value={adresse} onChange={setAdresse} required />

              <div className="ff-grid4 ff-mt-sm">
                <Field label="App." value={app} onChange={setApp} placeholder="#201" />
                <Field label="Ville" value={ville} onChange={setVille} required />
                <SelectField
                  label="Province"
                  value={province}
                  onChange={(v) => setProvince(v as ProvinceCode)}
                  options={PROVINCES as any}
                  required
                />
                <Field label="Code postal" value={codePostal} onChange={setCodePostal} placeholder="A1A 1A1" required />
              </div>
            </div>
          </section>

          {/* SECTION CONJOINT */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Conjoint</h2>
              <p>À remplir seulement si applicable.</p>
            </div>

            <CheckboxField label="J'ai un conjoint / conjointe" checked={aUnConjoint} onChange={setAUnConjoint} />

            {aUnConjoint && (
              <>
                <div className="ff-mt">
                  <CheckboxField
                    label="Traiter aussi la déclaration du conjoint"
                    checked={traiterConjoint}
                    onChange={setTraiterConjoint}
                  />
                </div>

                {!traiterConjoint && (
                  <div className="ff-mt">
                    <Field
                      label="Revenu net approximatif du conjoint ($)"
                      value={revenuNetConjoint}
                      onChange={setRevenuNetConjoint}
                      placeholder="ex.: 42 000"
                    />
                  </div>
                )}

                <div className="ff-grid2 ff-mt">
                  <Field label="Prénom (conjoint)" value={prenomConjoint} onChange={setPrenomConjoint} required />
                  <Field label="Nom (conjoint)" value={nomConjoint} onChange={setNomConjoint} required />
                  <Field label="NAS (conjoint)" value={nasConjoint} onChange={setNasConjoint} placeholder="___-___-___" />
                  <Field label="Date de naissance (JJ/MM/AAAA)" value={dobConjoint} onChange={setDobConjoint} placeholder="01/01/1990" />
                </div>

                <div className="ff-grid2 ff-mt">
                  <Field label="Téléphone (conjoint)" value={telConjoint} onChange={setTelConjoint} placeholder="(xxx) xxx-xxxx" />
                  <Field label="Cellulaire (conjoint)" value={telCellConjoint} onChange={setTelCellConjoint} placeholder="(xxx) xxx-xxxx" />
                  <Field label="Courriel (conjoint)" value={courrielConjoint} onChange={setCourrielConjoint} type="email" />
                </div>

                <div className="ff-mt">
                  <CheckboxField
                    label="L'adresse du conjoint est identique à la mienne"
                    checked={adresseConjointeIdentique}
                    onChange={setAdresseConjointeIdentique}
                  />
                </div>

                {!adresseConjointeIdentique && (
                  <div className="ff-mt">
                    <Field label="Adresse (rue) - conjoint" value={adresseConjoint} onChange={setAdresseConjoint} />

                    <div className="ff-grid4 ff-mt-sm">
                      <Field label="App." value={appConjoint} onChange={setAppConjoint} />
                      <Field label="Ville" value={villeConjoint} onChange={setVilleConjoint} />
                      <SelectField
                        label="Province"
                        value={provinceConjoint}
                        onChange={(v) => setProvinceConjoint(v as ProvinceCode)}
                        options={PROVINCES as any}
                      />
                      <Field label="Code postal" value={codePostalConjoint} onChange={setCodePostalConjoint} placeholder="A1A 1A1" />
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* ASSURANCE MEDS */}
          {province === "QC" && (
            <section className="ff-card">
              <div className="ff-card-head">
                <h2>Assurance médicaments (Québec)</h2>
                <p>RAMQ / régimes privés : indiquez qui vous couvrait et les périodes.</p>
              </div>

              <div className="ff-subtitle">Couverture du client</div>
              <SelectField
                label="Votre couverture médicaments"
                value={assuranceMedsClient}
                onChange={(v) => setAssuranceMedsClient(v as any)}
                options={[
                  { value: "", label: "Sélectionnez..." },
                  { value: "ramq", label: "Régime public (RAMQ)" },
                  { value: "prive", label: "Mon régime collectif privé" },
                  { value: "conjoint", label: "Régime du conjoint / d'un parent" },
                ]}
              />

              <div className="ff-mt-sm ff-stack">
                {assuranceMedsClientPeriodes.map((p, idx) => (
                  <div key={idx} className="ff-rowbox">
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

                <button
                  type="button"
                  className="ff-btn ff-btn-soft"
                  onClick={() => setAssuranceMedsClientPeriodes((prev) => [...prev, { debut: "", fin: "" }])}
                >
                  + Ajouter une période
                </button>
              </div>

              {aUnConjoint && (
                <>
                  <div className="ff-subtitle ff-mt">Couverture du conjoint</div>
                  <SelectField
                    label="Couverture médicaments du conjoint"
                    value={assuranceMedsConjoint}
                    onChange={(v) => setAssuranceMedsConjoint(v as any)}
                    options={[
                      { value: "", label: "Sélectionnez..." },
                      { value: "ramq", label: "Régime public (RAMQ)" },
                      { value: "prive", label: "Régime collectif privé" },
                      { value: "conjoint", label: "Régime du conjoint / d'un parent" },
                    ]}
                  />

                  <div className="ff-mt-sm ff-stack">
                    {assuranceMedsConjointPeriodes.map((p, idx) => (
                      <div key={idx} className="ff-rowbox">
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

                    <button
                      type="button"
                      className="ff-btn ff-btn-soft"
                      onClick={() => setAssuranceMedsConjointPeriodes((prev) => [...prev, { debut: "", fin: "" }])}
                    >
                      + Ajouter une période
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {/* PERSONNES A CHARGE */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Personnes à charge</h2>
              <p>Ajoutez vos enfants / personnes à charge (si applicable).</p>
            </div>

            {enfants.length === 0 ? (
              <div className="ff-empty">Aucune personne à charge ajoutée.</div>
            ) : (
              <div className="ff-stack">
                {enfants.map((enf, i) => (
                  <div key={i} className="ff-childbox">
                    <div className="ff-childhead">
                      <div className="ff-childtitle">Personne à charge #{i + 1}</div>
                      <button type="button" className="ff-btn ff-btn-link" onClick={() => removeEnfant(i)}>
                        Supprimer
                      </button>
                    </div>

                    <div className="ff-grid2">
                      <Field label="Prénom" value={enf.prenom} onChange={(v) => updateEnfant(i, "prenom", v)} />
                      <Field label="Nom" value={enf.nom} onChange={(v) => updateEnfant(i, "nom", v)} />
                      <Field label="Date de naissance (JJ/MM/AAAA)" value={enf.dob} onChange={(v) => updateEnfant(i, "dob", v)} placeholder="01/01/2020" />
                      <Field label="NAS (si attribué)" value={enf.nas} onChange={(v) => updateEnfant(i, "nas", v)} placeholder="___-___-___" />
                    </div>

                    <div className="ff-mt-sm">
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
                  </div>
                ))}
              </div>
            )}

            <div className="ff-mt">
              <button type="button" className="ff-btn ff-btn-primary" onClick={ajouterEnfant}>
                + Ajouter une personne à charge
              </button>
            </div>
          </section>

          {/* QUESTIONS */}
          <section className="ff-card">
            <div className="ff-card-head">
              <h2>Informations fiscales additionnelles</h2>
              <p>Questions générales pour compléter correctement le dossier.</p>
            </div>

            <div className="ff-stack">
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

              <YesNoField label="Êtes-vous citoyen(ne) canadien(ne) ?" value={citoyenCanadien} onChange={setCitoyenCanadien} />

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

              <YesNoField label="Souhaitez-vous qu'un technicien vous appelle ?" value={appelerTechnicien} onChange={setAppelerTechnicien} />

              <SelectField
                label="Comment voulez-vous recevoir votre copie d'impôt ?"
                value={copieImpots}
                onChange={(v) => setCopieImpots(v as any)}
                options={[
                  { value: "", label: "Sélectionnez..." },
                  { value: "espaceClient", label: "Espace client" },
                  { value: "courriel", label: "Courriel" },
                ]}
              />

              <SelectField
                label="Mode de paiement prévu"
                value={paiement}
                onChange={(v) => setPaiement(v as any)}
                options={[
                  { value: "", label: "Sélectionnez..." },
                  { value: "interac", label: "Virement Interac" },
                  { value: "carte", label: "Carte de crédit" },
                ]}
              />
            </div>
          </section>

          {/* SUBMIT */}
          <div className="ff-submit">
            <button type="submit" className="ff-btn ff-btn-primary ff-btn-big" disabled={submitting}>
              {submitting ? "Envoi…" : "Soumettre mes informations fiscales"}
            </button>

            <p className="ff-footnote">
              Vos informations sont traitées de façon confidentielle et servent à préparer vos déclarations T1
              (particulier / travail autonome) et T2 (société) au Canada. Au Québec, nous produisons aussi la
              déclaration provinciale.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}

/* ----------------- Réutilisables ----------------- */

const PROVINCES = [
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
] as const;

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
    <label className="ff-field">
      <span className="ff-label">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        className="ff-input"
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
    <label className="ff-check">
      <input
        type="checkbox"
        className="ff-checkbox"
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
  const name = useMemo(() => `yn_${label.replace(/\W+/g, "_").toLowerCase()}`, [label]);

  return (
    <div className="ff-yn">
      <div className="ff-label">{label}</div>
      <div className="ff-yn-row">
        <label className="ff-radio">
          <input type="radio" name={name} value="oui" checked={value === "oui"} onChange={(e) => onChange(e.target.value)} />
          <span>Oui</span>
        </label>
        <label className="ff-radio">
          <input type="radio" name={name} value="non" checked={value === "non"} onChange={(e) => onChange(e.target.value)} />
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
    <label className="ff-field">
      <span className="ff-label">
        {label}
        {required ? " *" : ""}
      </span>
      <select className="ff-select" value={value} onChange={(e) => onChange(e.target.value)} required={required}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
