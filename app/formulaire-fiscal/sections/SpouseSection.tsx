// app/formulaire-fiscal/sections/SpouseSection.tsx
"use client";

import React, { useMemo } from "react";
import { Field, CheckboxField, SelectField } from "../ui";
import type { ProvinceCode } from "../types";
import type { CopyPack } from "../copy";
import { formatNASInput, formatDateInput, formatPhoneInput, formatPostalInput } from "../formatters";

/* ---------- mini validations locales (vert/rouge) ---------- */
function normalizeDigits(v: string) {
  return (v || "").replace(/\D+/g, "");
}
function isValidSIN(v: string) {
  return normalizeDigits(v).slice(0, 9).length === 9;
}
function isValidEmail(v: string) {
  const s = (v || "").trim();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
function isValidDateJJMMAAAA(v: string) {
  const s = (v || "").trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return false;
  const [ddStr, mmStr, yyyyStr] = s.split("/");
  const dd = Number(ddStr);
  const mm = Number(mmStr);
  const yyyy = Number(yyyyStr);
  if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return false;
  if (yyyy < 1900 || yyyy > 2100) return false;
  if (mm < 1 || mm > 12) return false;
  const daysInMonth = new Date(yyyy, mm, 0).getDate();
  return dd >= 1 && dd <= daysInMonth;
}
function normalizePostal(v: string) {
  return (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}
function isValidPostal(v: string) {
  return normalizePostal(v).length === 6;
}
function normalizePhone(v: string) {
  return (v || "").replace(/\D+/g, "").slice(0, 10);
}
function hasAnyPhone(a: string, b: string) {
  return normalizePhone(a).length > 0 || normalizePhone(b).length > 0;
}
function isNumericLike(v: string) {
  const s = (v || "").trim().replace(",", ".");
  if (!s) return false;
  return /^-?\d+(\.\d+)?$/.test(s);
}

function StatusIcon({ ok, show }: { ok: boolean; show: boolean }) {
  if (!show) return null;
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 900,
        marginLeft: 8,
        background: ok ? "#dcfce7" : "#fee2e2",
        color: ok ? "#065f46" : "#7f1d1d",
        border: `1px solid ${ok ? "#16a34a" : "#dc2626"}`,
        flex: "0 0 auto",
      }}
      title={ok ? "OK" : "À corriger"}
    >
      {ok ? "✓" : "✕"}
    </span>
  );
}

function RowWithIcon(props: { children: React.ReactNode; ok: boolean; show: boolean }) {
  const { children, ok, show } = props;
  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>{children}</div>
      <StatusIcon ok={ok} show={show} />
    </div>
  );
}

export default function SpouseSection(props: {
  L: CopyPack;
  PROVINCES: { value: ProvinceCode; label: string }[];

  aUnConjoint: boolean;
  setAUnConjoint: (v: boolean) => void;
  traiterConjoint: boolean;
  setTraiterConjoint: (v: boolean) => void;
  revenuNetConjoint: string;
  setRevenuNetConjoint: (v: string) => void;

  prenomConjoint: string;
  setPrenomConjoint: (v: string) => void;
  nomConjoint: string;
  setNomConjoint: (v: string) => void;
  nasConjoint: string;
  setNasConjoint: (v: string) => void;
  dobConjoint: string;
  setDobConjoint: (v: string) => void;

  telConjoint: string;
  setTelConjoint: (v: string) => void;
  telCellConjoint: string;
  setTelCellConjoint: (v: string) => void;
  courrielConjoint: string;
  setCourrielConjoint: (v: string) => void;

  adresseConjointeIdentique: boolean;
  setAdresseConjointeIdentique: (v: boolean) => void;

  adresseConjoint: string;
  setAdresseConjoint: (v: string) => void;
  appConjoint: string;
  setAppConjoint: (v: string) => void;
  villeConjoint: string;
  setVilleConjoint: (v: string) => void;
  provinceConjoint: ProvinceCode;
  setProvinceConjoint: (v: ProvinceCode) => void;
  codePostalConjoint: string;
  setCodePostalConjoint: (v: string) => void;
}) {
  const {
    L,
    PROVINCES,
    aUnConjoint,
    setAUnConjoint,
    traiterConjoint,
    setTraiterConjoint,
    revenuNetConjoint,
    setRevenuNetConjoint,
    prenomConjoint,
    setPrenomConjoint,
    nomConjoint,
    setNomConjoint,
    nasConjoint,
    setNasConjoint,
    dobConjoint,
    setDobConjoint,
    telConjoint,
    setTelConjoint,
    telCellConjoint,
    setTelCellConjoint,
    courrielConjoint,
    setCourrielConjoint,
    adresseConjointeIdentique,
    setAdresseConjointeIdentique,
    adresseConjoint,
    setAdresseConjoint,
    appConjoint,
    setAppConjoint,
    villeConjoint,
    setVilleConjoint,
    provinceConjoint,
    setProvinceConjoint,
    codePostalConjoint,
    setCodePostalConjoint,
  } = props;

  // ------------------- état vert/rouge -------------------
  const showNetIncome = useMemo(() => aUnConjoint && !traiterConjoint, [aUnConjoint, traiterConjoint]);
  const netIncomeShow = showNetIncome && (revenuNetConjoint || "").trim().length > 0;
  const netIncomeOk = showNetIncome ? isNumericLike(revenuNetConjoint) : true;

  const showIncludedFields = useMemo(() => aUnConjoint && traiterConjoint, [aUnConjoint, traiterConjoint]);

  const fnShow = showIncludedFields && prenomConjoint.trim().length > 0;
  const fnOk = showIncludedFields ? prenomConjoint.trim().length > 0 : true;

  const lnShow = showIncludedFields && nomConjoint.trim().length > 0;
  const lnOk = showIncludedFields ? nomConjoint.trim().length > 0 : true;

  const sinShow = showIncludedFields && normalizeDigits(nasConjoint).length > 0;
  const sinOk = showIncludedFields ? isValidSIN(nasConjoint) : true;

  const dobShow = showIncludedFields && dobConjoint.trim().length > 0;
  const dobOk = showIncludedFields ? isValidDateJJMMAAAA(dobConjoint) : true;

  const phoneShow = showIncludedFields && (normalizePhone(telConjoint).length > 0 || normalizePhone(telCellConjoint).length > 0);
  const phoneOk = showIncludedFields ? hasAnyPhone(telConjoint, telCellConjoint) : true;

  const emailShow = showIncludedFields && courrielConjoint.trim().length > 0;
  const emailOk = showIncludedFields ? (courrielConjoint.trim() ? isValidEmail(courrielConjoint) : true) : true;

  const showAddrFields = useMemo(() => aUnConjoint && !adresseConjointeIdentique, [aUnConjoint, adresseConjointeIdentique]);

  const addrShow = showAddrFields && adresseConjoint.trim().length > 0;
  const addrOk = showAddrFields ? adresseConjoint.trim().length > 0 : true;

  const cityShow = showAddrFields && villeConjoint.trim().length > 0;
  const cityOk = showAddrFields ? villeConjoint.trim().length > 0 : true;

  const provShow = showAddrFields; // select toujours visible si section visible
  const provOk = showAddrFields ? !!provinceConjoint : true;

  const postalShow = showAddrFields && normalizePostal(codePostalConjoint).length > 0;
  const postalOk = showAddrFields ? isValidPostal(codePostalConjoint) : true;

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
              <RowWithIcon ok={netIncomeOk} show={netIncomeShow}>
                <Field
                  label={L.spouse.spouseNetIncome}
                  value={revenuNetConjoint}
                  onChange={setRevenuNetConjoint}
                  placeholder={L.spouse.spouseNetIncomePh}
                  inputMode="numeric"
                  required
                />
              </RowWithIcon>
            </div>
          )}

          <div className="ff-grid2 ff-mt">
            <RowWithIcon ok={fnOk} show={fnShow}>
              <Field
                label={L.spouse.spouseFirstName}
                value={prenomConjoint}
                onChange={setPrenomConjoint}
                required={traiterConjoint}
              />
            </RowWithIcon>

            <RowWithIcon ok={lnOk} show={lnShow}>
              <Field
                label={L.spouse.spouseLastName}
                value={nomConjoint}
                onChange={setNomConjoint}
                required={traiterConjoint}
              />
            </RowWithIcon>

            <RowWithIcon ok={sinOk} show={sinShow}>
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
            </RowWithIcon>

            <RowWithIcon ok={dobOk} show={dobShow}>
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
            </RowWithIcon>
          </div>

          <div className="ff-grid2 ff-mt">
            {/* téléphone: vert/rouge sur la paire */}
            <RowWithIcon ok={phoneOk} show={phoneShow}>
              <div className="ff-grid2" style={{ gap: 12 }}>
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
              </div>
            </RowWithIcon>

            <RowWithIcon ok={emailOk} show={emailShow}>
              <Field
                label={L.spouse.spouseEmail}
                value={courrielConjoint}
                onChange={setCourrielConjoint}
                type="email"
              />
            </RowWithIcon>
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
              <RowWithIcon ok={addrOk} show={addrShow}>
                <Field
                  label={L.spouse.spouseAddress}
                  value={adresseConjoint}
                  onChange={setAdresseConjoint}
                  required
                />
              </RowWithIcon>

              <div className="ff-grid4 ff-mt-sm">
                <Field label={L.fields.apt} value={appConjoint} onChange={setAppConjoint} placeholder={L.fields.aptPh} />

                <RowWithIcon ok={cityOk} show={cityShow}>
                  <Field label={L.fields.city} value={villeConjoint} onChange={setVilleConjoint} required />
                </RowWithIcon>

                <RowWithIcon ok={provOk} show={provShow}>
                  <SelectField<ProvinceCode>
                    label={L.fields.province}
                    value={provinceConjoint}
                    onChange={setProvinceConjoint}
                    options={PROVINCES}
                    required
                  />
                </RowWithIcon>

                <RowWithIcon ok={postalOk} show={postalShow}>
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
                </RowWithIcon>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
