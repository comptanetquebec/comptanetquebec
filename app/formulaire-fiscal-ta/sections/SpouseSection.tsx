// app/formulaire-fiscal-ta/sections/SpouseSection.tsx
"use client";

import React, { useMemo } from "react";
import { Field, CheckboxField, SelectField } from "../ui";
import type { ProvinceCode } from "../types";
import type { CopyPack } from "../copy";
import { formatNASInput, formatDateInput, formatPhoneInput, formatPostalInput } from "../formatters";

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

function LabelWithMark({ label, status }: { label: string; status: FieldStatus }) {
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

/**
 * Flow TA (travailleur autonome)
 * - Même logique que T1 (conjoint optionnel / inclus ou non)
 * - Garde les mêmes libellés via CopyPack pour rester cohérent multi-lang.
 */
export default function SpouseSection(props: {
  L: CopyPack;
  PROVINCES: { value: ProvinceCode; label: string }[];

  // ✅ déclenche les ✕ (ex: après clic "Continuer")
  showErrors: boolean;

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
    showErrors,

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

  const placeholderLabel = "—";

  const status = useMemo(() => {
    // Si pas de conjoint: on n'affiche rien
    if (!aUnConjoint) {
      return {
        revenuNetConjoint: "idle" as FieldStatus,
        prenomConjoint: "idle" as FieldStatus,
        nomConjoint: "idle" as FieldStatus,
        nasConjoint: "idle" as FieldStatus,
        dobConjoint: "idle" as FieldStatus,
        telAny: "idle" as FieldStatus,
        courrielConjoint: "idle" as FieldStatus,
        adresseConjoint: "idle" as FieldStatus,
        villeConjoint: "idle" as FieldStatus,
        provinceConjoint: "idle" as FieldStatus,
        codePostalConjoint: "idle" as FieldStatus,
      };
    }

    const requiredText = (v: string): FieldStatus => {
      const has = !!v.trim();
      if (!has) return showErrors ? "no" : "idle";
      return "ok";
    };

    const netIncomeStatus: FieldStatus = (() => {
      if (traiterConjoint) return "idle";
      if (!revenuNetConjoint.trim()) return showErrors ? "no" : "idle";
      return "ok";
    })();

    const prenomStatus: FieldStatus = (() => {
      if (!traiterConjoint) return "idle";
      return requiredText(prenomConjoint);
    })();

    const nomStatus: FieldStatus = (() => {
      if (!traiterConjoint) return "idle";
      return requiredText(nomConjoint);
    })();

    const nasStatus: FieldStatus = (() => {
      if (!traiterConjoint) return "idle";
      if (!nasConjoint.trim()) return showErrors ? "no" : "idle";
      return isValidNAS(nasConjoint) ? "ok" : "no";
    })();

    const dobStatus: FieldStatus = (() => {
      if (!traiterConjoint) return "idle";
      if (!dobConjoint.trim()) return showErrors ? "no" : "idle";
      return isValidDateJJMMAAAA(dobConjoint) ? "ok" : "no";
    })();

    // Téléphone: au moins 1 des deux valide (si conjoint traité)
    const anyPhoneOk = isValidPhone10(telConjoint) || isValidPhone10(telCellConjoint);
    const telAnyStatus: FieldStatus = (() => {
      if (!traiterConjoint) return "idle";
      const anyTyped = !!telConjoint.trim() || !!telCellConjoint.trim();
      if (!anyTyped) return showErrors ? "no" : "idle";
      return anyPhoneOk ? "ok" : "no";
    })();

    const emailStatus: FieldStatus = (() => {
      // email conjoint: optionnel, mais si rempli, doit être valide
      if (!courrielConjoint.trim()) return "idle";
      return isValidEmail(courrielConjoint) ? "ok" : "no";
    })();

    // Adresse conjoint (si différente)
    const addrStatus: FieldStatus = (() => {
      if (adresseConjointeIdentique) return "idle";
      return requiredText(adresseConjoint);
    })();
    const cityStatus: FieldStatus = (() => {
      if (adresseConjointeIdentique) return "idle";
      return requiredText(villeConjoint);
    })();
    const provStatus: FieldStatus = (() => {
      if (adresseConjointeIdentique) return "idle";
      if (!provinceConjoint) return showErrors ? "no" : "idle";
      return "ok";
    })();
    const postalStatus: FieldStatus = (() => {
      if (adresseConjointeIdentique) return "idle";
      if (!codePostalConjoint.trim()) return showErrors ? "no" : "idle";
      return isValidPostal(codePostalConjoint) ? "ok" : "no";
    })();

    return {
      revenuNetConjoint: netIncomeStatus,
      prenomConjoint: prenomStatus,
      nomConjoint: nomStatus,
      nasConjoint: nasStatus,
      dobConjoint: dobStatus,
      telAny: telAnyStatus,
      courrielConjoint: emailStatus,
      adresseConjoint: addrStatus,
      villeConjoint: cityStatus,
      provinceConjoint: provStatus,
      codePostalConjoint: postalStatus,
    };
  }, [
    aUnConjoint,
    showErrors,
    traiterConjoint,
    revenuNetConjoint,
    prenomConjoint,
    nomConjoint,
    nasConjoint,
    dobConjoint,
    telConjoint,
    telCellConjoint,
    courrielConjoint,
    adresseConjointeIdentique,
    adresseConjoint,
    villeConjoint,
    provinceConjoint,
    codePostalConjoint,
  ]);

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
            <CheckboxField label={L.spouse.includeSpouse} checked={traiterConjoint} onChange={setTraiterConjoint} />
          </div>

          {!traiterConjoint && (
            <div className="ff-mt">
              <Field
                label={(
                  <LabelWithMark label={L.spouse.spouseNetIncome} status={status.revenuNetConjoint} />
                ) as any}
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
              label={(
                <LabelWithMark label={L.spouse.spouseFirstName} status={status.prenomConjoint} />
              ) as any}
              value={prenomConjoint}
              onChange={setPrenomConjoint}
              required={traiterConjoint}
            />
            <Field
              label={(
                <LabelWithMark label={L.spouse.spouseLastName} status={status.nomConjoint} />
              ) as any}
              value={nomConjoint}
              onChange={setNomConjoint}
              required={traiterConjoint}
            />

            <Field
              label={(
                <LabelWithMark label={L.spouse.spouseSin} status={status.nasConjoint} />
              ) as any}
              value={nasConjoint}
              onChange={setNasConjoint}
              placeholder={L.fields.sinPh}
              inputMode="numeric"
              formatter={formatNASInput}
              maxLength={11}
              required={traiterConjoint}
            />

            <Field
              label={(
                <LabelWithMark label={L.spouse.spouseDob} status={status.dobConjoint} />
              ) as any}
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
              label={(
                <LabelWithMark label={L.spouse.spousePhone} status={status.telAny} />
              ) as any}
              value={telConjoint}
              onChange={setTelConjoint}
              placeholder="(418) 555-1234"
              inputMode="tel"
              formatter={formatPhoneInput}
              maxLength={14}
            />
            <Field
              label={(
                <LabelWithMark label={L.spouse.spouseMobile} status={status.telAny} />
              ) as any}
              value={telCellConjoint}
              onChange={setTelCellConjoint}
              placeholder="(418) 555-1234"
              inputMode="tel"
              formatter={formatPhoneInput}
              maxLength={14}
            />

            <Field
              label={(
                <LabelWithMark label={L.spouse.spouseEmail} status={status.courrielConjoint} />
              ) as any}
              value={courrielConjoint}
              onChange={setCourrielConjoint}
              type="email"
            />
          </div>

          <div className="ff-mt">
            <CheckboxField label={L.spouse.sameAddress} checked={adresseConjointeIdentique} onChange={setAdresseConjointeIdentique} />
          </div>

          {!adresseConjointeIdentique && (
            <div className="ff-mt">
              <Field
                label={(
                  <LabelWithMark label={L.spouse.spouseAddress} status={status.adresseConjoint} />
                ) as any}
                value={adresseConjoint}
                onChange={setAdresseConjoint}
                required
              />

              <div className="ff-grid4 ff-mt-sm">
                <Field label={L.fields.apt} value={appConjoint} onChange={setAppConjoint} placeholder={L.fields.aptPh} />

                <Field
                  label={(
                    <LabelWithMark label={L.fields.city} status={status.villeConjoint} />
                  ) as any}
                  value={villeConjoint}
                  onChange={setVilleConjoint}
                  required
                />

                <SelectField<ProvinceCode>
                  label={(
                    <LabelWithMark label={L.fields.province} status={status.provinceConjoint} />
                  ) as any}
                  value={provinceConjoint}
                  onChange={(v) => {
                    if (v === "") return; // ignore le placeholder
                    setProvinceConjoint(v as ProvinceCode);
                  }}
                  options={PROVINCES}
                  required
                  placeholderText={placeholderLabel}
                />

                <Field
                  label={(
                    <LabelWithMark label={L.fields.postal} status={status.codePostalConjoint} />
                  ) as any}
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
