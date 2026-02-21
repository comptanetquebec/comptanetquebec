// app/formulaire-fiscal/sections/SpouseSection.tsx
"use client";

import React from "react";
import { Field, CheckboxField, SelectField } from "../ui";
import type { ProvinceCode } from "../types";
import type { CopyPack } from "../copy";
import { formatNASInput, formatDateInput, formatPhoneInput, formatPostalInput } from "../formatters";

export default function SpouseSection(props: {
  L: CopyPack;
  PROVINCES: { value: ProvinceCode; label: string }[];

  aUnConjoint: boolean; setAUnConjoint: (v: boolean) => void;
  traiterConjoint: boolean; setTraiterConjoint: (v: boolean) => void;
  revenuNetConjoint: string; setRevenuNetConjoint: (v: string) => void;

  prenomConjoint: string; setPrenomConjoint: (v: string) => void;
  nomConjoint: string; setNomConjoint: (v: string) => void;
  nasConjoint: string; setNasConjoint: (v: string) => void;
  dobConjoint: string; setDobConjoint: (v: string) => void;

  telConjoint: string; setTelConjoint: (v: string) => void;
  telCellConjoint: string; setTelCellConjoint: (v: string) => void;
  courrielConjoint: string; setCourrielConjoint: (v: string) => void;

  adresseConjointeIdentique: boolean; setAdresseConjointeIdentique: (v: boolean) => void;

  adresseConjoint: string; setAdresseConjoint: (v: string) => void;
  appConjoint: string; setAppConjoint: (v: string) => void;
  villeConjoint: string; setVilleConjoint: (v: string) => void;
  provinceConjoint: ProvinceCode; setProvinceConjoint: (v: ProvinceCode) => void;
  codePostalConjoint: string; setCodePostalConjoint: (v: string) => void;
}) {
  const {
    L, PROVINCES,
    aUnConjoint, setAUnConjoint,
    traiterConjoint, setTraiterConjoint,
    revenuNetConjoint, setRevenuNetConjoint,
    prenomConjoint, setPrenomConjoint,
    nomConjoint, setNomConjoint,
    nasConjoint, setNasConjoint,
    dobConjoint, setDobConjoint,
    telConjoint, setTelConjoint,
    telCellConjoint, setTelCellConjoint,
    courrielConjoint, setCourrielConjoint,
    adresseConjointeIdentique, setAdresseConjointeIdentique,
    adresseConjoint, setAdresseConjoint,
    appConjoint, setAppConjoint,
    villeConjoint, setVilleConjoint,
    provinceConjoint, setProvinceConjoint,
    codePostalConjoint, setCodePostalConjoint,
  } = props;

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <h2>{L.sections.spouseTitle}</h2>
        <p>{L.sections.spouseDesc}</p>
      </div>

      <CheckboxField label={L.spouse.hasSpouse} checked={aUnConjoint} onChange={setAUnConjoint} />

      {aUnConjoint && (
        <>
          <div className="ff-mt">
            <CheckboxField
              label={L.spouse.includeSpouse}
              checked={traiterConjoint}
              onChange={setTraiterConjoint}
            />
          </div>

          {!traiterConjoint && (
            <div className="ff-mt">
              <Field
                label={L.spouse.spouseNetIncome}
                value={revenuNetConjoint}
                onChange={setRevenuNetConjoint}
                placeholder={L.spouse.spouseNetIncomePh}
                inputMode="numeric"
                required
              />
            </div>
          )}

          <div className="ff-grid2 ff-mt">
            <Field label={L.spouse.spouseFirstName} value={prenomConjoint} onChange={setPrenomConjoint} required={traiterConjoint} />
            <Field label={L.spouse.spouseLastName} value={nomConjoint} onChange={setNomConjoint} required={traiterConjoint} />
            <Field
              label={L.spouse.spouseSin}
              value={nasConjoint}
              onChange={setNasConjoint}
              placeholder={L.fields.sinPh}
              inputMode="numeric"
              formatter={formatNASInput}
              maxLength={11}
              required={traiterConjoint}
            />
            <Field
              label={L.spouse.spouseDob}
              value={dobConjoint}
              onChange={setDobConjoint}
              placeholder={L.fields.dobPh}
              inputMode="numeric"
              formatter={formatDateInput}
              maxLength={10}
              required={traiterConjoint}
            />
          </div>

          <div className="ff-grid2 ff-mt">
            <Field
              label={L.spouse.spousePhone}
              value={telConjoint}
              onChange={setTelConjoint}
              placeholder="(418) 555-1234"
              inputMode="tel"
              formatter={formatPhoneInput}
              maxLength={14}
            />
            <Field
              label={L.spouse.spouseMobile}
              value={telCellConjoint}
              onChange={setTelCellConjoint}
              placeholder="(418) 555-1234"
              inputMode="tel"
              formatter={formatPhoneInput}
              maxLength={14}
            />
            <Field label={L.spouse.spouseEmail} value={courrielConjoint} onChange={setCourrielConjoint} type="email" />
          </div>

          <div className="ff-mt">
            <CheckboxField
              label={L.spouse.sameAddress}
              checked={adresseConjointeIdentique}
              onChange={setAdresseConjointeIdentique}
            />
          </div>

          {!adresseConjointeIdentique && (
            <div className="ff-mt">
              <Field label={L.spouse.spouseAddress} value={adresseConjoint} onChange={setAdresseConjoint} required />
              <div className="ff-grid4 ff-mt-sm">
                <Field label={L.fields.apt} value={appConjoint} onChange={setAppConjoint} placeholder={L.fields.aptPh} />
                <Field label={L.fields.city} value={villeConjoint} onChange={setVilleConjoint} required />
                <SelectField<ProvinceCode>
                  label={L.fields.province}
                  value={provinceConjoint}
                  onChange={setProvinceConjoint}
                  options={PROVINCES}
                  required
                />
                <Field
                  label={L.fields.postal}
                  value={codePostalConjoint}
                  onChange={setCodePostalConjoint}
                  placeholder={L.fields.postalPh}
                  formatter={formatPostalInput}
                  maxLength={7}
                  autoComplete="postal-code"
                  required
                />
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
