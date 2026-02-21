// app/formulaire-fiscal-ta/sections/ClientSection.tsx
"use client";

import React from "react";
import { Field, CheckboxField, SelectField } from "../ui";
import type { ProvinceCode, EtatCivil } from "../types";
import type { CopyPack } from "../copy";
import {
  formatNASInput,
  formatDateInput,
  formatPhoneInput,
  formatPostalInput,
} from "../formatters";

export default function ClientSection(props: {
  L: CopyPack;
  PROVINCES: { value: ProvinceCode; label: string }[];

  prenom: string;
  setPrenom: (v: string) => void;
  nom: string;
  setNom: (v: string) => void;
  nas: string;
  setNas: (v: string) => void;
  dob: string;
  setDob: (v: string) => void;

  etatCivil: EtatCivil;
  setEtatCivil: (v: EtatCivil) => void;
  etatCivilChange: boolean;
  setEtatCivilChange: (v: boolean) => void;
  ancienEtatCivil: string;
  setAncienEtatCivil: (v: string) => void;
  dateChangementEtatCivil: string;
  setDateChangementEtatCivil: (v: string) => void;

  tel: string;
  setTel: (v: string) => void;
  telCell: string;
  setTelCell: (v: string) => void;
  courriel: string;
  setCourriel: (v: string) => void;

  adresse: string;
  setAdresse: (v: string) => void;
  app: string;
  setApp: (v: string) => void;
  ville: string;
  setVille: (v: string) => void;
  province: ProvinceCode;
  setProvince: (v: ProvinceCode) => void;
  codePostal: string;
  setCodePostal: (v: string) => void;
}) {
  const {
    L,
    PROVINCES,
    prenom,
    setPrenom,
    nom,
    setNom,
    nas,
    setNas,
    dob,
    setDob,
    etatCivil,
    setEtatCivil,
    etatCivilChange,
    setEtatCivilChange,
    ancienEtatCivil,
    setAncienEtatCivil,
    dateChangementEtatCivil,
    setDateChangementEtatCivil,
    tel,
    setTel,
    telCell,
    setTelCell,
    courriel,
    setCourriel,
    adresse,
    setAdresse,
    app,
    setApp,
    ville,
    setVille,
    province,
    setProvince,
    codePostal,
    setCodePostal,
  } = props;

  // Placeholder (pas dans COPY pour l’instant, donc simple et neutre)
  const placeholderLabel = "—";

  // ✅ Options état civil traduites via COPY
  // Important : EtatCivil inclut "" (vide) donc on ajoute une option "" pour satisfaire le typage
  const maritalOptions: Array<{ value: Exclude<EtatCivil, "">; label: string }> = [
    { value: "", label: placeholderLabel },
    { value: "celibataire", label: L.fields.maritalOpts.celibataire },
    { value: "conjointDefait", label: L.fields.maritalOpts.conjointDefait },
    { value: "marie", label: L.fields.maritalOpts.marie },
    { value: "separe", label: L.fields.maritalOpts.separe },
    { value: "divorce", label: L.fields.maritalOpts.divorce },
    { value: "veuf", label: L.fields.maritalOpts.veuf },
  ];

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <h2>{L.sections.clientTitle}</h2>
        <p>{L.sections.clientDesc}</p>
      </div>

      <div className="ff-grid2">
        <Field
          label={L.fields.firstName}
          value={prenom}
          onChange={setPrenom}
          required
        />
        <Field
          label={L.fields.lastName}
          value={nom}
          onChange={setNom}
          required
        />

        <Field
          label={L.fields.sin}
          value={nas}
          onChange={setNas}
          placeholder={L.fields.sinPh}
          required
          inputMode="numeric"
          formatter={formatNASInput}
          maxLength={11}
        />

        <Field
          label={L.fields.dob}
          value={dob}
          onChange={setDob}
          placeholder={L.fields.dobPh}
          required
          inputMode="numeric"
          formatter={formatDateInput}
          maxLength={10}
        />
      </div>

      <div className="ff-grid2 ff-mt">
        <SelectField<EtatCivil>
          label={L.fields.marital}
          value={etatCivil}
          onChange={setEtatCivil}
          options={maritalOptions}
          required
        />

        <CheckboxField
          label={L.fields.maritalChanged}
          checked={etatCivilChange}
          onChange={setEtatCivilChange}
        />
      </div>

      {etatCivilChange && (
        <div className="ff-grid2 ff-mt">
          <Field
            label={L.fields.prevMarital}
            value={ancienEtatCivil}
            onChange={setAncienEtatCivil}
            placeholder={L.fields.prevMaritalPh}
            required
          />

          <Field
            label={L.fields.changeDate}
            value={dateChangementEtatCivil}
            onChange={setDateChangementEtatCivil}
            placeholder={L.fields.changeDatePh}
            inputMode="numeric"
            formatter={formatDateInput}
            maxLength={10}
            required
          />
        </div>
      )}

      <div className="ff-grid2 ff-mt">
        <Field
          label={L.fields.phone}
          value={tel}
          onChange={setTel}
          placeholder={L.fields.phonePh ?? "(418) 555-1234"}
          inputMode="tel"
          formatter={formatPhoneInput}
          maxLength={14}
        />

        <Field
          label={L.fields.mobile}
          value={telCell}
          onChange={setTelCell}
          placeholder={L.fields.mobilePh ?? "(418) 555-1234"}
          inputMode="tel"
          formatter={formatPhoneInput}
          maxLength={14}
        />

        <Field
          label={L.fields.email}
          value={courriel}
          onChange={setCourriel}
          type="email"
          required
        />
      </div>

      <div className="ff-mt">
        <Field
          label={L.fields.address}
          value={adresse}
          onChange={setAdresse}
          required
        />

        <div className="ff-grid4 ff-mt-sm">
          <Field
            label={L.fields.apt}
            value={app}
            onChange={setApp}
            placeholder={L.fields.aptPh}
          />

          <Field
            label={L.fields.city}
            value={ville}
            onChange={setVille}
            required
          />

          <SelectField<ProvinceCode>
            label={L.fields.province}
            value={province}
            onChange={setProvince}
            options={PROVINCES}
            required
          />

          <Field
            label={L.fields.postal}
            value={codePostal}
            onChange={setCodePostal}
            placeholder={L.fields.postalPh}
            required
            formatter={formatPostalInput}
            maxLength={7}
            autoComplete="postal-code"
          />
        </div>
      </div>
    </section>
  );
}
