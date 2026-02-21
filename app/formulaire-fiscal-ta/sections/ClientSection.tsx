// app/formulaire-fiscal-ta/sections/ClientSection.tsx
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

type FieldStatus = "ok" | "no" | "idle";

function Mark({ status }: { status: FieldStatus }) {
  if (status === "idle") return null;
  const ok = status === "ok";
  return (
    <span
      aria-hidden
      style={{
        marginLeft: 8,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        border: "1px solid rgba(0,0,0,.12)",
        background: ok ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.10)",
        color: ok ? "#16a34a" : "#dc2626",
      }}
      title={ok ? "OK" : "À compléter"}
    >
      {ok ? "✓" : "✕"}
    </span>
  );
}

function LabelWithMark({
  label,
  status,
}: {
  label: string;
  status: FieldStatus;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <span>{label}</span>
      <Mark status={status} />
    </span>
  );
}

// ===== validations locales (sans dépendances externes) =====
function digitsOnly(v: string) {
  return (v || "").replace(/\D+/g, "");
}
function isValidNAS(v: string) {
  return digitsOnly(v).slice(0, 9).length === 9;
}
function isValidPostal(v: string) {
  const s = (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return s.length === 6;
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
function isValidPhone10(v: string) {
  return digitsOnly(v).slice(0, 10).length === 10;
}

export default function ClientSection(props: {
  L: CopyPack;
  PROVINCES: { value: ProvinceCode; label: string }[];

  // ✅ déclenche les ✕ (ex: après clic "Continuer")
  showErrors: boolean;

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
    showErrors,
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

  const placeholderLabel = "—";

  // Options état civil (valeurs NON vides seulement)
  const maritalOptions: Array<{ value: Exclude<EtatCivil, "">; label: string }> = [
    { value: "celibataire", label: L.fields.maritalOpts.celibataire },
    { value: "conjointDefait", label: L.fields.maritalOpts.conjointDefait },
    { value: "marie", label: L.fields.maritalOpts.marie },
    { value: "separe", label: L.fields.maritalOpts.separe },
    { value: "divorce", label: L.fields.maritalOpts.divorce },
    { value: "veuf", label: L.fields.maritalOpts.veuf },
  ];

  // ===== statut pro : rien tant que vide, sauf si showErrors =====
  const status = useMemo(() => {
    const requiredText = (v: string): FieldStatus => {
      const has = !!v.trim();
      if (!has) return showErrors ? "no" : "idle";
      return "ok";
    };

    const nasStatus: FieldStatus = (() => {
      if (!nas.trim()) return showErrors ? "no" : "idle";
      return isValidNAS(nas) ? "ok" : "no";
    })();

    const dobStatus: FieldStatus = (() => {
      if (!dob.trim()) return showErrors ? "no" : "idle";
      return isValidDateJJMMAAAA(dob) ? "ok" : "no";
    })();

    const emailStatus: FieldStatus = (() => {
      if (!courriel.trim()) return showErrors ? "no" : "idle";
      return isValidEmail(courriel) ? "ok" : "no";
    })();

    const postalStatus: FieldStatus = (() => {
      if (!codePostal.trim()) return showErrors ? "no" : "idle";
      return isValidPostal(codePostal) ? "ok" : "no";
    })();

    // Téléphone: au moins 1 des deux valide
    const anyPhoneOk = isValidPhone10(tel) || isValidPhone10(telCell);
    const phoneStatus: FieldStatus = (() => {
      const anyTyped = !!tel.trim() || !!telCell.trim();
      if (!anyTyped) return showErrors ? "no" : "idle";
      return anyPhoneOk ? "ok" : "no";
    })();

    const etatCivilStatus: FieldStatus = etatCivil ? "ok" : showErrors ? "no" : "idle";

    const prevMaritalStatus: FieldStatus = !etatCivilChange
      ? "idle"
      : (!ancienEtatCivil.trim()
          ? (showErrors ? "no" : "idle")
          : "ok");

    const changeDateStatus: FieldStatus = !etatCivilChange
      ? "idle"
      : (!dateChangementEtatCivil.trim()
          ? (showErrors ? "no" : "idle")
          : (isValidDateJJMMAAAA(dateChangementEtatCivil) ? "ok" : "no"));

    return {
      prenom: requiredText(prenom),
      nom: requiredText(nom),
      nas: nasStatus,
      dob: dobStatus,
      etatCivil: etatCivilStatus,
      ancienEtatCivil: prevMaritalStatus,
      dateChangementEtatCivil: changeDateStatus,
      tel: phoneStatus,
      telCell: phoneStatus,
      courriel: emailStatus,
      adresse: requiredText(adresse),
      ville: requiredText(ville),
      province: province ? "ok" : showErrors ? "no" : "idle",
      codePostal: postalStatus,
    };
  }, [
    showErrors,
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
        <h2>{L.sections.clientTitle}</h2>
        <p>{L.sections.clientDesc}</p>
      </div>

      <div className="ff-grid2">
        <Field
          label={(
            <LabelWithMark label={L.fields.firstName} status={status.prenom} />
          ) as any}
          value={prenom}
          onChange={setPrenom}
          required
        />
        <Field
          label={(
            <LabelWithMark label={L.fields.lastName} status={status.nom} />
          ) as any}
          value={nom}
          onChange={setNom}
          required
        />

        <Field
          label={(
            <LabelWithMark label={L.fields.sin} status={status.nas} />
          ) as any}
          value={nas}
          onChange={setNas}
          placeholder={L.fields.sinPh}
          required
          inputMode="numeric"
          formatter={formatNASInput}
          maxLength={11}
        />

        <Field
          label={(
            <LabelWithMark label={L.fields.dob} status={status.dob} />
          ) as any}
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
          label={(
            <LabelWithMark label={L.fields.marital} status={status.etatCivil} />
          ) as any}
          value={etatCivil}
          onChange={(v) => setEtatCivil(v)}
          options={maritalOptions}
          required
          placeholderText={"—"}
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
            label={(
              <LabelWithMark label={L.fields.prevMarital} status={status.ancienEtatCivil} />
            ) as any}
            value={ancienEtatCivil}
            onChange={setAncienEtatCivil}
            placeholder={L.fields.prevMaritalPh}
            required
          />

          <Field
            label={(
              <LabelWithMark label={L.fields.changeDate} status={status.dateChangementEtatCivil} />
            ) as any}
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
          label={(
            <LabelWithMark label={L.fields.phone} status={status.tel} />
          ) as any}
          value={tel}
          onChange={setTel}
          placeholder="(418) 555-1234"
          inputMode="tel"
          formatter={formatPhoneInput}
          maxLength={14}
        />

        <Field
          label={(
            <LabelWithMark label={L.fields.mobile} status={status.telCell} />
          ) as any}
          value={telCell}
          onChange={setTelCell}
          placeholder="(418) 555-1234"
          inputMode="tel"
          formatter={formatPhoneInput}
          maxLength={14}
        />

        <Field
          label={(
            <LabelWithMark label={L.fields.email} status={status.courriel} />
          ) as any}
          value={courriel}
          onChange={setCourriel}
          type="email"
          required
        />
      </div>

      <div className="ff-mt">
        <Field
          label={(
            <LabelWithMark label={L.fields.address} status={status.adresse} />
          ) as any}
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
            label={(
              <LabelWithMark label={L.fields.city} status={status.ville} />
            ) as any}
            value={ville}
            onChange={setVille}
            required
          />

          <SelectField<ProvinceCode>
            label={(
              <LabelWithMark label={L.fields.province} status={status.province} />
            ) as any}
            value={province}
            onChange={(v) => {
              if (v === "") return;
              setProvince(v as ProvinceCode);
            }}
            options={PROVINCES}
            required
            placeholderText={"—"}
          />

          <Field
            label={(
              <LabelWithMark label={L.fields.postal} status={status.codePostal} />
            ) as any}
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
