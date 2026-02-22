// app/formulaire-fiscal/sections/ClientSection.tsx
"use client";

import React, { useMemo } from "react";
import { Field, CheckboxField, SelectField } from "../ui";
import type { ProvinceCode, EtatCivil } from "../types";
import type { CopyPack } from "../copy";
import {
  formatNASInput,
  formatDateInput,
  formatPhoneInput,
  formatPostalInput,
} from "../formatters";
import { firstNonEmpty } from "../helpers";

/** ======== mini validation locale (pour ✓ vert / ✕ rouge) ======== */
type Mark = "ok" | "bad" | "todo";

function MarkIcon({ mark }: { mark: Mark }) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    lineHeight: 1,
    border: "1px solid rgba(0,0,0,.18)",
    flex: "0 0 auto",
  };

  if (mark === "ok") {
    return (
      <span
        aria-label="ok"
        title="OK"
        style={{
          ...base,
          color: "#14532d",
          background: "#dcfce7",
          borderColor: "#16a34a",
        }}
      >
        ✓
      </span>
    );
  }

  if (mark === "bad") {
    return (
      <span
        aria-label="à corriger"
        title="À corriger"
        style={{
          ...base,
          color: "#7f1d1d",
          background: "#fee2e2",
          borderColor: "#dc2626",
        }}
      >
        ✕
      </span>
    );
  }

  return (
    <span
      aria-label="à faire"
      title="À faire"
      style={{
        ...base,
        color: "#1f2937",
        background: "#f3f4f6",
        borderColor: "rgba(0,0,0,.18)",
      }}
    >
      →
    </span>
  );
}

function normalizeNAS(v: string) {
  return (v || "").replace(/\D+/g, "").slice(0, 9);
}
function normalizePostal(v: string) {
  return (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}
function normalizePhone(v: string) {
  return (v || "").replace(/\D+/g, "").slice(0, 10);
}

function isValidNAS(v: string) {
  return normalizeNAS(v).length === 9;
}
function isValidPostal(v: string) {
  return normalizePostal(v).length === 6;
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

function markTextRequired(v: string): Mark {
  return v.trim() ? "ok" : "bad";
}
function markEmail(v: string): Mark {
  return isValidEmail(v) ? "ok" : "bad";
}
function markNAS(v: string): Mark {
  return isValidNAS(v) ? "ok" : "bad";
}
function markDOB(v: string): Mark {
  return isValidDateJJMMAAAA(v) ? "ok" : "bad";
}
function markPostal(v: string): Mark {
  return isValidPostal(v) ? "ok" : "bad";
}
function markPhoneAny(tel: string, cell: string): Mark {
  const any = firstNonEmpty(normalizePhone(tel), normalizePhone(cell));
  return any ? "ok" : "bad";
}

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

  const marks = useMemo(() => {
    const mPrenom = markTextRequired(prenom);
    const mNom = markTextRequired(nom);
    const mNAS = markNAS(nas);
    const mDOB = markDOB(dob);
    const mEtat = etatCivil ? ("ok" as Mark) : ("bad" as Mark);
    const mEmail = markEmail(courriel);

    const mAdresse = markTextRequired(adresse);
    const mVille = markTextRequired(ville);
    const mProvince = province ? ("ok" as Mark) : ("bad" as Mark);
    const mPostal = markPostal(codePostal);

    const mPhone = markPhoneAny(tel, telCell);

    const mPrevEtat = !etatCivilChange ? ("ok" as Mark) : markTextRequired(ancienEtatCivil);
    const mDateChange = !etatCivilChange ? ("ok" as Mark) : markDOB(dateChangementEtatCivil);

    const blockOk =
      mPrenom === "ok" &&
      mNom === "ok" &&
      mNAS === "ok" &&
      mDOB === "ok" &&
      mEtat === "ok" &&
      mEmail === "ok" &&
      mAdresse === "ok" &&
      mVille === "ok" &&
      mProvince === "ok" &&
      mPostal === "ok" &&
      mPhone === "ok" &&
      mPrevEtat === "ok" &&
      mDateChange === "ok";

    return {
      prenom: mPrenom,
      nom: mNom,
      nas: mNAS,
      dob: mDOB,
      etatCivil: mEtat,
      etatCivilPrev: mPrevEtat,
      etatCivilDate: mDateChange,
      phoneAny: mPhone,
      email: mEmail,
      adresse: mAdresse,
      ville: mVille,
      province: mProvince,
      postal: mPostal,
      block: blockOk ? ("ok" as Mark) : ("bad" as Mark),
    };
  }, [
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
    courriel,
    adresse,
    ville,
    province,
    codePostal,
  ]);

  return (
    <section className="ff-card">
      <div className="ff-card-head">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <h2 style={{ margin: 0 }}>{L.sections.clientTitle}</h2>
          <MarkIcon mark={marks.block} />
        </div>
        <p style={{ marginTop: 8 }}>{L.sections.clientDesc}</p>
      </div>

      <div className="ff-grid2">
        <Field
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {L.fields.firstName} <MarkIcon mark={marks.prenom} />
            </span>
          }
          value={prenom}
          onChange={setPrenom}
          required
        />
        <Field
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {L.fields.lastName} <MarkIcon mark={marks.nom} />
            </span>
          }
          value={nom}
          onChange={setNom}
          required
        />
        <Field
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {L.fields.sin} <MarkIcon mark={marks.nas} />
            </span>
          }
          value={nas}
          onChange={setNas}
          placeholder={L.fields.sinPh}
          required
          inputMode="numeric"
          formatter={formatNASInput}
          maxLength={11}
        />
        <Field
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {L.fields.dob} <MarkIcon mark={marks.dob} />
            </span>
          }
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
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {L.fields.marital} <MarkIcon mark={marks.etatCivil} />
            </span>
          }
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
        <CheckboxField label={L.fields.maritalChanged} checked={etatCivilChange} onChange={setEtatCivilChange} />
      </div>

      {etatCivilChange && (
        <div className="ff-grid2 ff-mt">
          <Field
            label={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {L.fields.prevMarital} <MarkIcon mark={marks.etatCivilPrev} />
              </span>
            }
            value={ancienEtatCivil}
            onChange={setAncienEtatCivil}
            placeholder={L.fields.prevMaritalPh}
            required
          />
          <Field
            label={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {L.fields.changeDate} <MarkIcon mark={marks.etatCivilDate} />
              </span>
            }
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
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {L.fields.phone} <MarkIcon mark={marks.phoneAny} />
            </span>
          }
          value={tel}
          onChange={setTel}
          placeholder="(418) 555-1234"
          inputMode="tel"
          formatter={formatPhoneInput}
          maxLength={14}
        />
        <Field
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {L.fields.mobile} <MarkIcon mark={marks.phoneAny} />
            </span>
          }
          value={telCell}
          onChange={setTelCell}
          placeholder="(418) 555-1234"
          inputMode="tel"
          formatter={formatPhoneInput}
          maxLength={14}
        />
        <Field
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {L.fields.email} <MarkIcon mark={marks.email} />
            </span>
          }
          value={courriel}
          onChange={setCourriel}
          type="email"
          required
        />
      </div>

      <div className="ff-mt">
        <Field
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {L.fields.address} <MarkIcon mark={marks.adresse} />
            </span>
          }
          value={adresse}
          onChange={setAdresse}
          required
        />

        <div className="ff-grid4 ff-mt-sm">
          <Field label={L.fields.apt} value={app} onChange={setApp} placeholder={L.fields.aptPh} />

          <Field
            label={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {L.fields.city} <MarkIcon mark={marks.ville} />
              </span>
            }
            value={ville}
            onChange={setVille}
            required
          />

          <SelectField<ProvinceCode>
            label={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {L.fields.province} <MarkIcon mark={marks.province} />
              </span>
            }
            value={province}
            onChange={setProvince}
            options={PROVINCES}
            required
          />

          <Field
            label={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {L.fields.postal} <MarkIcon mark={marks.postal} />
              </span>
            }
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
