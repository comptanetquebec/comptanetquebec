// app/formulaire-fiscal/sections/SpouseSection.tsx
"use client";

import React, { useMemo } from "react";
import { Field, CheckboxField, SelectField } from "../ui";
import type { ProvinceCode } from "../types";
import type { CopyPack } from "../copy";
import {
  formatNASInput,
  formatDateInput,
  formatPhoneInput,
  formatPostalInput,
} from "../formatters";
import { firstNonEmpty } from "../helpers";

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

/* ---------- marks (dans le label, comme ClientSection) ---------- */
type Mark = "ok" | "bad" | "todo";

function MarkIcon({ mark }: { mark: Mark }) {
  const cls =
    mark === "ok"
      ? "mark-icon mark-icon--ok"
      : mark === "bad"
      ? "mark-icon mark-icon--bad"
      : "mark-icon mark-icon--todo";

  const title = mark === "ok" ? "OK" : mark === "bad" ? "À corriger" : "À faire";
  const symbol = mark === "ok" ? "✓" : mark === "bad" ? "✕" : "→";

  return (
    <span className={cls} aria-hidden title={title}>
      {symbol}
    </span>
  );
}

function LabelWithMark({ text, mark }: { text: React.ReactNode; mark: Mark }) {
  return (
    <>
      {text} <MarkIcon mark={mark} />
    </>
  );
}

function markRequired(v: string): Mark {
  return (v || "").trim() ? "ok" : "bad";
}
function markSIN(v: string): Mark {
  const d = normalizeDigits(v);
  if (!d) return "todo";
  return isValidSIN(v) ? "ok" : "bad";
}
function markDOB(v: string): Mark {
  const t = (v || "").trim();
  if (!t) return "todo";
  return isValidDateJJMMAAAA(t) ? "ok" : "bad";
}
function markEmail(v: string): Mark {
  const t = (v || "").trim();
  if (!t) return "todo";
  return isValidEmail(t) ? "ok" : "bad";
}
function markPhonePair(tel: string, cell: string): Mark {
  const any = firstNonEmpty(normalizePhone(tel), normalizePhone(cell));
  return any ? "ok" : "bad";
}
function markPostal(v: string): Mark {
  const t = normalizePostal(v);
  if (!t) return "todo";
  return isValidPostal(v) ? "ok" : "bad";
}
function markNumeric(v: string): Mark {
  const t = (v || "").trim();
  if (!t) return "todo";
  return isNumericLike(t) ? "ok" : "bad";
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

  const showNetIncome = aUnConjoint && !traiterConjoint;
  const showIncludedFields = aUnConjoint && traiterConjoint;
  const showAddrFields = aUnConjoint && !adresseConjointeIdentique;

  const marks = useMemo(() => {
    const mNet = showNetIncome ? markNumeric(revenuNetConjoint) : ("ok" as Mark);

    const mFN = showIncludedFields ? markRequired(prenomConjoint) : ("ok" as Mark);
    const mLN = showIncludedFields ? markRequired(nomConjoint) : ("ok" as Mark);
    const mSIN = showIncludedFields ? markSIN(nasConjoint) : ("ok" as Mark);
    const mDOB = showIncludedFields ? markDOB(dobConjoint) : ("ok" as Mark);
    const mPhone = showIncludedFields ? markPhonePair(telConjoint, telCellConjoint) : ("ok" as Mark);
    const mEmail = showIncludedFields
      ? ((courrielConjoint || "").trim() ? markEmail(courrielConjoint) : ("todo" as Mark))
      : ("ok" as Mark);

    const mAddr = showAddrFields ? markRequired(adresseConjoint) : ("ok" as Mark);
    const mCity = showAddrFields ? markRequired(villeConjoint) : ("ok" as Mark);
    const mProv = showAddrFields ? (provinceConjoint ? ("ok" as Mark) : ("bad" as Mark)) : ("ok" as Mark);
    const mPostal = showAddrFields ? markPostal(codePostalConjoint) : ("ok" as Mark);

    const blockOk =
      (!aUnConjoint ||
        ((showNetIncome ? mNet === "ok" : true) &&
          (showIncludedFields
            ? mFN === "ok" &&
              mLN === "ok" &&
              mSIN === "ok" &&
              mDOB === "ok" &&
              mPhone === "ok"
            : true) &&
          (showAddrFields ? mAddr === "ok" && mCity === "ok" && mProv === "ok" && mPostal === "ok" : true)));

    return {
      net: mNet,
      fn: mFN,
      ln: mLN,
      sin: mSIN,
      dob: mDOB,
      phone: mPhone,
      email: mEmail,
      addr: mAddr,
      city: mCity,
      prov: mProv,
      postal: mPostal,
      block: blockOk ? ("ok" as Mark) : ("bad" as Mark),
    };
  }, [
    aUnConjoint,
    traiterConjoint,
    adresseConjointeIdentique,
    revenuNetConjoint,
    prenomConjoint,
    nomConjoint,
    nasConjoint,
    dobConjoint,
    telConjoint,
    telCellConjoint,
    courrielConjoint,
    adresseConjoint,
    villeConjoint,
    provinceConjoint,
    codePostalConjoint,
    showNetIncome,
    showIncludedFields,
    showAddrFields,
  ]);

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <h2 style={{ margin: 0 }}>{L.sections.spouseTitle}</h2>
          <MarkIcon mark={marks.block} />
        </div>
        <p style={{ marginTop: 8 }}>{L.sections.spouseDesc}</p>
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

          {showNetIncome && (
            <div className="ff-mt">
              <Field
                label={<LabelWithMark text={L.spouse.spouseNetIncome} mark={marks.net} />}
                value={revenuNetConjoint}
                onChange={setRevenuNetConjoint}
                placeholder={L.spouse.spouseNetIncomePh}
                inputMode="numeric"
                required
              />
            </div>
          )}

          <div className="ff-grid2 ff-mt">
            <Field
              label={<LabelWithMark text={L.spouse.spouseFirstName} mark={marks.fn} />}
              value={prenomConjoint}
              onChange={setPrenomConjoint}
              required={traiterConjoint}
            />

            <Field
              label={<LabelWithMark text={L.spouse.spouseLastName} mark={marks.ln} />}
              value={nomConjoint}
              onChange={setNomConjoint}
              required={traiterConjoint}
            />

            <Field
              label={<LabelWithMark text={L.spouse.spouseSin} mark={marks.sin} />}
              value={nasConjoint}
              onChange={setNasConjoint}
              placeholder={L.fields.sinPh}
              inputMode="numeric"
              formatter={formatNASInput}
              maxLength={11}
              required={traiterConjoint}
            />

            <Field
              label={<LabelWithMark text={L.spouse.spouseDob} mark={marks.dob} />}
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
            {/* téléphone: un seul mark pour la paire */}
            <div className="ff-grid2" style={{ gap: 12 }}>
              <Field
                label={<LabelWithMark text={L.spouse.spousePhone} mark={marks.phone} />}
                value={telConjoint}
                onChange={setTelConjoint}
                placeholder="(418) 555-1234"
                inputMode="tel"
                formatter={formatPhoneInput}
                maxLength={14}
              />
              <Field
                label={<LabelWithMark text={L.spouse.spouseMobile} mark={marks.phone} />}
                value={telCellConjoint}
                onChange={setTelCellConjoint}
                placeholder="(418) 555-1234"
                inputMode="tel"
                formatter={formatPhoneInput}
                maxLength={14}
              />
            </div>

            <Field
              label={<LabelWithMark text={L.spouse.spouseEmail} mark={marks.email} />}
              value={courrielConjoint}
              onChange={setCourrielConjoint}
              type="email"
            />
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
              <Field
                label={<LabelWithMark text={L.spouse.spouseAddress} mark={marks.addr} />}
                value={adresseConjoint}
                onChange={setAdresseConjoint}
                required
              />

              <div className="ff-grid4 ff-mt-sm">
                <Field
                  label={L.fields.apt}
                  value={appConjoint}
                  onChange={setAppConjoint}
                  placeholder={L.fields.aptPh}
                />

                <Field
                  label={<LabelWithMark text={L.fields.city} mark={marks.city} />}
                  value={villeConjoint}
                  onChange={setVilleConjoint}
                  required
                />

                <SelectField<ProvinceCode>
                  label={<LabelWithMark text={L.fields.province} mark={marks.prov} />}
                  value={provinceConjoint}
                  onChange={setProvinceConjoint}
                  options={PROVINCES}
                  required
                />

                <Field
                  label={<LabelWithMark text={L.fields.postal} mark={marks.postal} />}
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
