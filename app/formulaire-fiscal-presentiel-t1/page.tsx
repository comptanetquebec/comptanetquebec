"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// CSS shared (tu peux même l’enlever si tu veux, mais tu l’as déjà)
import "@/app/formulaire-fiscal-presentiel/formulaire-fiscal-presentiel.css";

// UI shared
import { Field, YesNoField, SelectField } from "@/app/formulaire-fiscal-presentiel/ui";

import {
  FORMS_TABLE,
  PROVINCES,
  normalizeLang,
  titleFromType,
  supaErr,
  updatePeriode,
  formatNASInput,
  formatDateInput,
  formatPhoneInput,
  formatPostalInput,
  normalizeNAS,
  normalizePhone,
  normalizePostal,
  type Lang,
  type FormTypeDb,
  type InsertIdRow,
  type FormRow,
  type ProvinceCode,
  type EtatCivil,
  type AssuranceMeds,
  type CopieImpots,
  type Periode,
  type Child,
  type YesNo,
  type Formdata,
  type FormConjointdata,
  type FormMedsdata,
} from "@/app/formulaire-fiscal-presentiel/shared";

// Checkbox ultra basic (local)
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
        className="ff-checkbox"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

export default function FormulaireFiscalPresentielT1Page() {
  const params = useSearchParams();
  const type: FormTypeDb = "T1";
  const lang = normalizeLang(params.get("lang") || "fr");

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  if (!userId) return null;

  return <PresentielT1Inner userId={userId} lang={lang} type={type} />;
}

function PresentielT1Inner({ userId, lang, type }: { userId: string; lang: Lang; type: FormTypeDb }) {
  const router = useRouter();
  const formTitle = titleFromType(type);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [formulaireId, setFormulaireId] = useState<string | null>(null);

  const hydrating = useRef(false);
  const saveTimer = useRef<number | null>(null);

  // ====== Client
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [nas, setNas] = useState("");
  const [dob, setDob] = useState("");
  const [etatCivil, setEtatCivil] = useState<EtatCivil>("");

  const [etatCivilChange, setEtatCivilChange] = useState(false);
  const [ancienEtatCivil, setAncienEtatCivil] = useState("");
  const [dateChangementEtatCivil, setDateChangementEtatCivil] = useState("");

  const [tel, setTel] = useState("");
  const [telCell, setTelCell] = useState("");
  const [courriel, setCourriel] = useState("");

  const [adresse, setAdresse] = useState("");
  const [app, setApp] = useState("");
  const [ville, setVille] = useState("");
  const [province, setProvince] = useState<ProvinceCode>("QC");
  const [codePostal, setCodePostal] = useState("");

  // ====== Conjoint
  const [aUnConjoint, setAUnConjoint] = useState(false);
  const [traiterConjoint, setTraiterConjoint] = useState(true);

  const [prenomConjoint, setPrenomConjoint] = useState("");
  const [nomConjoint, setNomConjoint] = useState("");
  const [nasConjoint, setNasConjoint] = useState("");
  const [dobConjoint, setDobConjoint] = useState("");

  const [revenuNetConjoint, setRevenuNetConjoint] = useState("");

  // ====== Assurance meds (QC)
  const [assuranceMedsClient, setAssuranceMedsClient] = useState<AssuranceMeds>("");
  const [assuranceMedsClientPeriodes, setAssuranceMedsClientPeriodes] = useState<Periode[]>([
    { debut: "", fin: "" },
  ]);

  const [assuranceMedsConjoint, setAssuranceMedsConjoint] = useState<AssuranceMeds>("");
  const [assuranceMedsConjointPeriodes, setAssuranceMedsConjointPeriodes] = useState<Periode[]>([
    { debut: "", fin: "" },
  ]);

  // ====== Enfants
  const [enfants, setEnfants] = useState<Child[]>([]);
  const ajouterEnfant = useCallback(() => {
    setEnfants((prev) => [...prev, { prenom: "", nom: "", dob: "", nas: "", sexe: "" }]);
  }, []);
  const updateEnfant = useCallback((i: number, field: keyof Child, value: string) => {
    setEnfants((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };
      return copy;
    });
  }, []);
  const removeEnfant = useCallback((i: number) => {
    setEnfants((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  // ====== Questions
  const [anneeImposition, setAnneeImposition] = useState("");
  const [habiteSeulTouteAnnee, setHabiteSeulTouteAnnee] = useState<YesNo>("");
  const [nbPersonnesMaison3112, setNbPersonnesMaison3112] = useState("");
  const [biensEtranger100k, setBiensEtranger100k] = useState<YesNo>("");
  const [citoyenCanadien, setCitoyenCanadien] = useState<YesNo>("");
  const [nonResident, setNonResident] = useState<YesNo>("");
  const [maisonAcheteeOuVendue, setMaisonAcheteeOuVendue] = useState<YesNo>("");
  const [copieImpots, setCopieImpots] = useState<CopieImpots>("");

  const draftData: Formdata = useMemo(() => {
    const conjointData: FormConjointdata | null = aUnConjoint
      ? {
          traiterConjoint,
          prenomConjoint: prenomConjoint.trim(),
          nomConjoint: nomConjoint.trim(),
          nasConjoint: normalizeNAS(nasConjoint),
          dobConjoint: dobConjoint.trim(),
          revenuNetConjoint: traiterConjoint ? "" : revenuNetConjoint.trim(),
        }
      : null;

    const medsData: FormMedsdata | null =
      province === "QC"
        ? {
            client: { regime: assuranceMedsClient, periodes: assuranceMedsClientPeriodes },
            conjoint: aUnConjoint
              ? { regime: assuranceMedsConjoint, periodes: assuranceMedsConjointPeriodes }
              : null,
          }
        : null;

    return {
      dossierType: type,
      canal: "presentiel",
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
      conjoint: conjointData,
      assuranceMedicamenteuse: medsData,
      personnesACharge: enfants.map((x) => ({
        prenom: x.prenom.trim(),
        nom: x.nom.trim(),
        dob: x.dob.trim(),
        nas: normalizeNAS(x.nas),
        sexe: x.sexe,
      })),
      questionsGenerales: {
        anneeImposition: anneeImposition.trim(),
        habiteSeulTouteAnnee,
        nbPersonnesMaison3112: nbPersonnesMaison3112.trim(),
        biensEtranger100k,
        citoyenCanadien,
        nonResident,
        maisonAcheteeOuVendue,
        copieImpots,
      },
    };
  }, [
    type,
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
    aUnConjoint,
    traiterConjoint,
    prenomConjoint,
    nomConjoint,
    nasConjoint,
    dobConjoint,
    revenuNetConjoint,
    assuranceMedsClient,
    assuranceMedsClientPeriodes,
    assuranceMedsConjoint,
    assuranceMedsConjointPeriodes,
    enfants,
    anneeImposition,
    habiteSeulTouteAnnee,
    nbPersonnesMaison3112,
    biensEtranger100k,
    citoyenCanadien,
    nonResident,
    maisonAcheteeOuVendue,
    copieImpots,
  ]);

  const saveDraft = useCallback(async (): Promise<string | null> => {
    if (hydrating.current) return formulaireId ?? null;
    if (submitting) return formulaireId ?? null;

    if (formulaireId) {
      const { error } = await supabase
        .from(FORMS_TABLE)
        .update({ lang, annee: anneeImposition || null, data: draftData })
        .eq("id", formulaireId)
        .eq("user_id", userId);

      if (error) throw new Error(supaErr(error));
      return formulaireId;
    }

    const { data: dataInsert, error: errorInsert } = await supabase
      .from(FORMS_TABLE)
      .insert({
        user_id: userId,
        form_type: type,
        lang,
        status: "draft",
        annee: anneeImposition || null,
        data: draftData,
      })
      .select("id")
      .single<InsertIdRow>();

    if (errorInsert) throw new Error(supaErr(errorInsert));

    const fid = dataInsert?.id ?? null;
    if (fid) setFormulaireId(fid);
    return fid;
  }, [userId, submitting, formulaireId, type, lang, draftData, anneeImposition]);

  const loadLastForm = useCallback(async () => {
    hydrating.current = true;

    const { data: row, error } = await supabase
      .from(FORMS_TABLE)
      .select("id, data, created_at, annee")
      .eq("user_id", userId)
      .eq("form_type", type)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<FormRow>();

    if (error) {
      setMsg(`Erreur chargement: ${error.message}`);
      hydrating.current = false;
      return;
    }
    if (!row) {
      hydrating.current = false;
      return;
    }

    setFormulaireId(row.id);

    const form = row.data;
    const client = form?.client ?? {};
    setPrenom(client.prenom ?? "");
    setNom(client.nom ?? "");
    setNas(client.nas ? formatNASInput(client.nas) : "");
    setDob(client.dob ?? "");
    setEtatCivil(client.etatCivil ?? "");

    setEtatCivilChange(!!client.etatCivilChange);
    setAncienEtatCivil(client.ancienEtatCivil ?? "");
    setDateChangementEtatCivil(client.dateChangementEtatCivil ?? "");

    setTel(client.tel ? formatPhoneInput(client.tel) : "");
    setTelCell(client.telCell ? formatPhoneInput(client.telCell) : "");
    setCourriel(client.courriel ?? "");

    setAdresse(client.adresse ?? "");
    setApp(client.app ?? "");
    setVille(client.ville ?? "");
    setProvince(client.province ?? "QC");
    setCodePostal(client.codePostal ? formatPostalInput(client.codePostal) : "");

    const cj = form?.conjoint ?? null;
    setAUnConjoint(!!cj);
    if (cj) {
      setTraiterConjoint(!!cj.traiterConjoint);
      setPrenomConjoint(cj.prenomConjoint ?? "");
      setNomConjoint(cj.nomConjoint ?? "");
      setNasConjoint(cj.nasConjoint ? formatNASInput(cj.nasConjoint) : "");
      setDobConjoint(cj.dobConjoint ?? "");
      setRevenuNetConjoint(cj.revenuNetConjoint ?? "");
    } else {
      setTraiterConjoint(true);
      setPrenomConjoint("");
      setNomConjoint("");
      setNasConjoint("");
      setDobConjoint("");
      setRevenuNetConjoint("");
    }

    const meds = form?.assuranceMedicamenteuse ?? null;
    if (meds?.client) {
      setAssuranceMedsClient(meds.client.regime ?? "");
      setAssuranceMedsClientPeriodes(meds.client.periodes ?? [{ debut: "", fin: "" }]);
    } else {
      setAssuranceMedsClient("");
      setAssuranceMedsClientPeriodes([{ debut: "", fin: "" }]);
    }

    if (meds?.conjoint) {
      setAssuranceMedsConjoint(meds.conjoint?.regime ?? "");
      setAssuranceMedsConjointPeriodes(meds.conjoint?.periodes ?? [{ debut: "", fin: "" }]);
    } else {
      setAssuranceMedsConjoint("");
      setAssuranceMedsConjointPeriodes([{ debut: "", fin: "" }]);
    }

    setEnfants(form?.personnesACharge ?? []);

    const q = form?.questionsGenerales ?? {};
    setAnneeImposition(q.anneeImposition ?? "");
    setHabiteSeulTouteAnnee(q.habiteSeulTouteAnnee ?? "");
    setNbPersonnesMaison3112(q.nbPersonnesMaison3112 ?? "");
    setBiensEtranger100k(q.biensEtranger100k ?? "");
    setCitoyenCanadien(q.citoyenCanadien ?? "");
    setNonResident(q.nonResident ?? "");
    setMaisonAcheteeOuVendue(q.maisonAcheteeOuVendue ?? "");
    setCopieImpots(q.copieImpots ?? "");

    hydrating.current = false;
  }, [userId, type]);

  useEffect(() => {
    void loadLastForm();
  }, [loadLastForm]);

  useEffect(() => {
    if (hydrating.current) return;

    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveDraft().catch(() => {});
    }, 800);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [lang, draftData, saveDraft]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace(`/espace-client?lang=${encodeURIComponent(lang)}`);
  }, [router, lang]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitting(true);
      setMsg(null);

      try {
        const fidFromSave = await saveDraft();
        const realFid = fidFromSave || formulaireId;
        if (!realFid) throw new Error("Impossible d'envoyer (dossier introuvable).");

        const { error } = await supabase
          .from(FORMS_TABLE)
          .update({ status: "recu", annee: anneeImposition || null, data: draftData })
          .eq("id", realFid)
          .eq("user_id", userId);

        if (error) throw new Error(supaErr(error));
        setMsg("✅ Dossier présentiel envoyé.");
      } catch (err: unknown) {
        setMsg("❌ " + (err instanceof Error ? err.message : "Erreur lors de l'envoi."));
      } finally {
        setSubmitting(false);
      }
    },
    [saveDraft, formulaireId, userId, anneeImposition, draftData]
  );

  return (
    <main className="ff-bg">
      <div className="ff-container">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <h1 style={{ margin: 0 }}>{formTitle}</h1>
          <button className="ff-btn ff-btn-outline" type="button" onClick={logout}>
            Déconnexion
          </button>
        </div>

        <p style={{ marginTop: 6, opacity: 0.8 }}>
          Interne seulement (présentiel). Pas de paiement. Pas de dépôt de documents côté client.
        </p>

        {msg && (
          <div className="ff-card" style={{ padding: 12 }}>
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="ff-form">
          <section className="ff-card">
            <h2 style={{ marginTop: 0 }}>Client</h2>

            <div className="ff-grid2">
              <Field label="Prénom" value={prenom} onChange={setPrenom} required />
              <Field label="Nom" value={nom} onChange={setNom} required />
              <Field
                label="NAS"
                value={nas}
                onChange={setNas}
                placeholder="123-456-789"
                required
                inputMode="numeric"
                formatter={formatNASInput}
                maxLength={11}
              />
              <Field
                label="Date de naissance"
                value={dob}
                onChange={setDob}
                placeholder="JJ/MM/AAAA"
                required
                inputMode="numeric"
                formatter={formatDateInput}
                maxLength={10}
              />
            </div>

            <div className="ff-grid2 ff-mt">
              <SelectField<EtatCivil>
                label="État civil"
                value={etatCivil}
                onChange={setEtatCivil}
                options={[
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
                label="État civil changé durant l'année"
                checked={etatCivilChange}
                onChange={setEtatCivilChange}
              />
            </div>

            {etatCivilChange && (
              <div className="ff-grid2 ff-mt">
                <Field label="Ancien état civil" value={ancienEtatCivil} onChange={setAncienEtatCivil} />
                <Field
                  label="Date du changement"
                  value={dateChangementEtatCivil}
                  onChange={setDateChangementEtatCivil}
                  placeholder="JJ/MM/AAAA"
                  inputMode="numeric"
                  formatter={formatDateInput}
                  maxLength={10}
                />
              </div>
            )}

            <div className="ff-grid2 ff-mt">
              <Field
                label="Téléphone"
                value={tel}
                onChange={setTel}
                placeholder="(418) 555-1234"
                inputMode="tel"
                formatter={formatPhoneInput}
                maxLength={14}
              />
              <Field
                label="Cellulaire"
                value={telCell}
                onChange={setTelCell}
                placeholder="(418) 555-1234"
                inputMode="tel"
                formatter={formatPhoneInput}
                maxLength={14}
              />
              <Field label="Courriel" value={courriel} onChange={setCourriel} type="email" required />
            </div>

            <div className="ff-mt">
              <Field label="Adresse" value={adresse} onChange={setAdresse} required />
              <div className="ff-grid4 ff-mt-sm">
                <Field label="App." value={app} onChange={setApp} placeholder="#201" />
                <Field label="Ville" value={ville} onChange={setVille} required />
                <SelectField<ProvinceCode label="Province" value={province} onChange={setProvince} options={PROVINCES} required />
                <Field
                  label="Code postal"
                  value={codePostal}
                  onChange={setCodePostal}
                  placeholder="G1V 0A6"
                  required
                  formatter={formatPostalInput}
                  maxLength={7}
                />
              </div>
            </div>
          </section>

          <section className="ff-card">
            <h2 style={{ marginTop: 0 }}>Conjoint (si applicable)</h2>

            <CheckboxField label="A un conjoint / conjointe" checked={aUnConjoint} onChange={setAUnConjoint} />

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
                      inputMode="numeric"
                    />
                  </div>
                )}

                <div className="ff-grid2 ff-mt">
                  <Field label="Prénom" value={prenomConjoint} onChange={setPrenomConjoint} required={traiterConjoint} />
                  <Field label="Nom" value={nomConjoint} onChange={setNomConjoint} required={traiterConjoint} />
                  <Field
                    label="NAS"
                    value={nasConjoint}
                    onChange={setNasConjoint}
                    placeholder="123-456-789"
                    inputMode="numeric"
                    formatter={formatNASInput}
                    maxLength={11}
                  />
                  <Field
                    label="Date de naissance"
                    value={dobConjoint}
                    onChange={setDobConjoint}
                    placeholder="JJ/MM/AAAA"
                    inputMode="numeric"
                    formatter={formatDateInput}
                    maxLength={10}
                  />
                </div>
              </>
            )}
          </section>

          {province === "QC" && (
            <section className="ff-card">
              <h2 style={{ marginTop: 0 }}>Assurance médicaments (QC)</h2>

              <SelectField<AssuranceMeds>
                label="Couverture client"
                value={assuranceMedsClient}
                onChange={setAssuranceMedsClient}
                options={[
                  { value: "ramq", label: "RAMQ" },
                  { value: "prive", label: "Régime privé" },
                  { value: "conjoint", label: "Régime du conjoint / parent" },
                ]}
              />

              <div className="ff-mt-sm ff-stack">
                {assuranceMedsClientPeriodes.map((p, idx) => (
                  <div key={`cli-${idx}`} className="ff-rowbox">
                    <Field
                      label="De"
                      value={p.debut}
                      onChange={(val) =>
                        setAssuranceMedsClientPeriodes((prev) =>
                          updatePeriode(prev, idx, { debut: formatDateInput(val) })
                        )
                      }
                      placeholder="JJ/MM/AAAA"
                      inputMode="numeric"
                      maxLength={10}
                    />
                    <Field
                      label="À"
                      value={p.fin}
                      onChange={(val) =>
                        setAssuranceMedsClientPeriodes((prev) =>
                          updatePeriode(prev, idx, { fin: formatDateInput(val) })
                        )
                      }
                      placeholder="JJ/MM/AAAA"
                      inputMode="numeric"
                      maxLength={10}
                    />
                  </div>
                ))}

                <button
                  type="button"
                  className="ff-btn ff-btn-soft"
                  onClick={() => setAssuranceMedsClientPeriodes((prev) => [...prev, { debut: "", fin: "" }])}
                >
                  + Période client
                </button>
              </div>

              {aUnConjoint && (
                <>
                  <div className="ff-mt" />

                  <SelectField<AssuranceMeds>
                    label="Couverture conjoint"
                    value={assuranceMedsConjoint}
                    onChange={setAssuranceMedsConjoint}
                    options={[
                      { value: "ramq", label: "RAMQ" },
                      { value: "prive", label: "Régime privé" },
                      { value: "conjoint", label: "Régime du conjoint / parent" },
                    ]}
                  />

                  <div className="ff-mt-sm ff-stack">
                    {assuranceMedsConjointPeriodes.map((p, idx) => (
                      <div key={`cj-${idx}`} className="ff-rowbox">
                        <Field
                          label="De"
                          value={p.debut}
                          onChange={(val) =>
                            setAssuranceMedsConjointPeriodes((prev) =>
                              updatePeriode(prev, idx, { debut: formatDateInput(val) })
                            )
                          }
                          placeholder="JJ/MM/AAAA"
                          inputMode="numeric"
                          maxLength={10}
                        />
                        <Field
                          label="À"
                          value={p.fin}
                          onChange={(val) =>
                            setAssuranceMedsConjointPeriodes((prev) =>
                              updatePeriode(prev, idx, { fin: formatDateInput(val) })
                            )
                          }
                          placeholder="JJ/MM/AAAA"
                          inputMode="numeric"
                          maxLength={10}
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      className="ff-btn ff-btn-soft"
                      onClick={() => setAssuranceMedsConjointPeriodes((prev) => [...prev, { debut: "", fin: "" }])}
                    >
                      + Période conjoint
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          <section className="ff-card">
            <h2 style={{ marginTop: 0 }}>Personnes à charge</h2>

            {enfants.length === 0 ? (
              <div className="ff-empty">Aucune</div>
            ) : (
              <div className="ff-stack">
                {enfants.map((enf, i) => (
                  <div key={`enf-${i}`} className="ff-childbox">
                    <div className="ff-childhead">
                      <strong>#{i + 1}</strong>
                      <button type="button" className="ff-btn ff-btn-link" onClick={() => removeEnfant(i)}>
                        Supprimer
                      </button>
                    </div>

                    <div className="ff-grid2">
                      <Field label="Prénom" value={enf.prenom} onChange={(v) => updateEnfant(i, "prenom", v)} />
                      <Field label="Nom" value={enf.nom} onChange={(v) => updateEnfant(i, "nom", v)} />
                      <Field
                        label="Naissance"
                        value={enf.dob}
                        onChange={(v) => updateEnfant(i, "dob", formatDateInput(v))}
                        placeholder="JJ/MM/AAAA"
                        inputMode="numeric"
                        maxLength={10}
                      />
                      <Field
                        label="NAS (si attribué)"
                        value={enf.nas}
                        onChange={(v) => updateEnfant(i, "nas", formatNASInput(v))}
                        placeholder="123-456-789"
                        inputMode="numeric"
                        maxLength={11}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="ff-mt">
              <button type="button" className="ff-btn ff-btn-primary" onClick={ajouterEnfant}>
                + Ajouter
              </button>
            </div>
          </section>

          <section className="ff-card">
            <h2 style={{ marginTop: 0 }}>Questions</h2>

            <Field
              label="Année d’imposition"
              value={anneeImposition}
              onChange={setAnneeImposition}
              placeholder="ex.: 2025"
              inputMode="numeric"
            />

            <div className="ff-mt-sm" />

            <YesNoField
              name="habiteSeulTouteAnnee"
              label="Habité seul(e) toute l'année (sans personne à charge) ?"
              value={habiteSeulTouteAnnee}
              onChange={setHabiteSeulTouteAnnee}
            />

            <Field
              label="Au 31/12, nb de personnes dans la maison"
              value={nbPersonnesMaison3112}
              onChange={setNbPersonnesMaison3112}
              inputMode="numeric"
            />

            <YesNoField
              name="biensEtranger100k"
              label="Biens à l'étranger > 100 000 $ ?"
              value={biensEtranger100k}
              onChange={setBiensEtranger100k}
            />

            <YesNoField
              name="citoyenCanadien"
              label="Citoyen(ne) canadien(ne) ?"
              value={citoyenCanadien}
              onChange={setCitoyenCanadien}
            />

            <YesNoField
              name="nonResident"
              label="Non-résident(e) aux fins fiscales ?"
              value={nonResident}
              onChange={setNonResident}
            />

            <YesNoField
              name="maisonAcheteeOuVendue"
              label="Achat 1re habitation ou vente résidence principale ?"
              value={maisonAcheteeOuVendue}
              onChange={setMaisonAcheteeOuVendue}
            />

            <SelectField<CopieImpots>
              label="Copie d'impôt"
              value={copieImpots}
              onChange={setCopieImpots}
              required
              options={[
                { value: "espaceClient", label: "Espace client" },
                { value: "courriel", label: "Courriel" },
              ]}
            />
          </section>

          <div className="ff-submit">
            <button type="submit" className="ff-btn ff-btn-primary ff-btn-big" disabled={submitting}>
              Envoyer le dossier
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
