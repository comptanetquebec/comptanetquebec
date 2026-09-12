// app/formulaire-fiscal/sections/ClientSection.tsx
"use client";

import React, { useMemo } from "react";

import {
  Field,
  CheckboxField,
  SelectField,
} from "../ui";

import type {
  ProvinceCode,
  EtatCivil,
} from "../types";

import type { CopyPack } from "../copy";

import {
  formatNASInput,
  formatDateInput,
  formatPhoneInput,
  formatPostalInput,
} from "../formatters";

import {
  normalizeNAS,
  normalizePostal,
  normalizePhone,
} from "../helpers";

/* ============================================================
   TYPES
============================================================ */

type Mark = "ok" | "bad" | "todo";

type UiLang = "fr" | "en" | "es";

/* ============================================================
   LANGUE
============================================================ */

function getUiLang(L: CopyPack): UiLang {
  if (L.fields.firstName === "First name") return "en";
  if (L.fields.firstName === "Nombre") return "es";
  return "fr";
}

/* ============================================================
   TEXTES LOCAUX
============================================================ */

const LOCAL_TEXT = {
  fr: {
    ok: "Valide",
    bad: "À corriger",
    todo: "À compléter",

    choose: "Choisir…",

    phoneHint:
      "Au moins un numéro de téléphone valide est requis.",

    marital: {
      celibataire: "Célibataire",
      conjointDefait: "Conjoint de fait",
      marie: "Marié(e)",
      separe: "Séparé(e)",
      divorce: "Divorcé(e)",
      veuf: "Veuf / veuve",
    },
  },

  en: {
    ok: "Valid",
    bad: "Needs correction",
    todo: "To complete",

    choose: "Select…",

    phoneHint:
      "At least one valid phone number is required.",

    marital: {
      celibataire: "Single",
      conjointDefait: "Common-law",
      marie: "Married",
      separe: "Separated",
      divorce: "Divorced",
      veuf: "Widowed",
    },
  },

  es: {
    ok: "Válido",
    bad: "Debe corregirse",
    todo: "Por completar",

    choose: "Seleccionar…",

    phoneHint:
      "Se requiere al menos un número de teléfono válido.",

    marital: {
      celibataire: "Soltero(a)",
      conjointDefait: "Unión de hecho",
      marie: "Casado(a)",
      separe: "Separado(a)",
      divorce: "Divorciado(a)",
      veuf: "Viudo(a)",
    },
  },
} as const;

/* ============================================================
   ICÔNES DE VALIDATION
============================================================ */

function MarkIcon({
  mark,
  lang,
}: {
  mark: Mark;
  lang: UiLang;
}) {
  const T = LOCAL_TEXT[lang];

  const cls =
    mark === "ok"
      ? "mark-icon mark-icon--ok"
      : mark === "bad"
      ? "mark-icon mark-icon--bad"
      : "mark-icon mark-icon--todo";

  const title =
    mark === "ok"
      ? T.ok
      : mark === "bad"
      ? T.bad
      : T.todo;

  const symbol =
    mark === "ok"
      ? "✓"
      : mark === "bad"
      ? "✕"
      : "→";

  return (
    <span
      className={cls}
      aria-hidden="true"
      title={title}
    >
      {symbol}
    </span>
  );
}

function LabelWithMark({
  text,
  mark,
  lang,
  required = false,
}: {
  text: React.ReactNode;
  mark: Mark;
  lang: UiLang;
  required?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minWidth: 0,
      }}
    >
      <span style={{ minWidth: 0 }}>
        {text}
      </span>

      {required && mark !== "ok" ? (
        <span
          aria-hidden="true"
          style={{
            color: "#dc2626",
            fontWeight: 800,
          }}
        >
          *
        </span>
      ) : null}

      <MarkIcon
        mark={mark}
        lang={lang}
      />
    </span>
  );
}

/* ============================================================
   VALIDATION
============================================================ */

function isValidNAS(v: string) {
  const nas = normalizeNAS(v);

  if (nas.length !== 9) {
    return false;
  }

  let sum = 0;

  for (let i = 0; i < nas.length; i++) {
    let digit = Number(nas[i]);

    if (i % 2 === 1) {
      digit *= 2;

      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
  }

  return sum % 10 === 0;
}

function isValidEmail(v: string) {
  const value = (v || "").trim();

  if (!value) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidDateJJMMAAAA(v: string) {
  const value = (v || "").trim();

  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return false;
  }

  const [ddText, mmText, yyyyText] =
    value.split("/");

  const dd = Number(ddText);
  const mm = Number(mmText);
  const yyyy = Number(yyyyText);

  if (
    !Number.isFinite(dd) ||
    !Number.isFinite(mm) ||
    !Number.isFinite(yyyy)
  ) {
    return false;
  }

  if (yyyy < 1900 || yyyy > 2100) {
    return false;
  }

  if (mm < 1 || mm > 12) {
    return false;
  }

  const daysInMonth =
    new Date(yyyy, mm, 0).getDate();

  return dd >= 1 && dd <= daysInMonth;
}

function isValidPostal(v: string) {
  const postal = normalizePostal(v);

  /*
    Format canadien :
    A1A 1A1

    Les lettres D, F, I, O, Q et U
    ne sont pas utilisées dans les
    positions alphabétiques.
  */
  return /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTVWXYZ]\d[ABCEGHJ-NPRSTVWXYZ]\d$/.test(
    postal
  );
}

function isValidPhone(v: string) {
  return normalizePhone(v).length === 10;
}

function markRequired(v: string): Mark {
  return (v || "").trim()
    ? "ok"
    : "bad";
}

function markNAS(v: string): Mark {
  return isValidNAS(v)
    ? "ok"
    : "bad";
}

function markDate(v: string): Mark {
  return isValidDateJJMMAAAA(v)
    ? "ok"
    : "bad";
}

function markEmail(v: string): Mark {
  return isValidEmail(v)
    ? "ok"
    : "bad";
}

function markPostal(v: string): Mark {
  return isValidPostal(v)
    ? "ok"
    : "bad";
}

/* ============================================================
   COMPOSANT
============================================================ */

export default function ClientSection(props: {
  L: CopyPack;

  PROVINCES: {
    value: ProvinceCode;
    label: string;
  }[];

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

  const lang = getUiLang(L);
  const T = LOCAL_TEXT[lang];

  const maritalOptions = useMemo(
    () => [
      {
        value: "celibataire" as const,
        label: T.marital.celibataire,
      },
      {
        value: "conjointDefait" as const,
        label: T.marital.conjointDefait,
      },
      {
        value: "marie" as const,
        label: T.marital.marie,
      },
      {
        value: "separe" as const,
        label: T.marital.separe,
      },
      {
        value: "divorce" as const,
        label: T.marital.divorce,
      },
      {
        value: "veuf" as const,
        label: T.marital.veuf,
      },
    ],
    [T]
  );

  const marks = useMemo(() => {
    const mPrenom =
      markRequired(prenom);

    const mNom =
      markRequired(nom);

    const mNAS =
      markNAS(nas);

    const mDOB =
      markDate(dob);

    const mEtatCivil: Mark =
      etatCivil ? "ok" : "bad";

    const mEmail =
      markEmail(courriel);

    const mAdresse =
      markRequired(adresse);

    const mVille =
      markRequired(ville);

    const mProvince: Mark =
      province ? "ok" : "bad";

    const mPostal =
      markPostal(codePostal);

    /*
      Un seul numéro est obligatoire.

      Si un numéro est inscrit, il doit
      cependant contenir 10 chiffres.
    */
    const telEntered =
      normalizePhone(tel).length > 0;

    const cellEntered =
      normalizePhone(telCell).length > 0;

    const telValid =
      isValidPhone(tel);

    const cellValid =
      isValidPhone(telCell);

    const phoneAnyValid =
      telValid || cellValid;

    const mPhone: Mark =
      telEntered
        ? telValid
          ? "ok"
          : "bad"
        : phoneAnyValid
        ? "todo"
        : "bad";

    const mMobile: Mark =
      cellEntered
        ? cellValid
          ? "ok"
          : "bad"
        : phoneAnyValid
        ? "todo"
        : "bad";

    const mPrevEtat: Mark =
      !etatCivilChange
        ? "ok"
        : ancienEtatCivil
        ? "ok"
        : "bad";

    const mDateChange: Mark =
      !etatCivilChange
        ? "ok"
        : markDate(
            dateChangementEtatCivil
          );

    const blockOk =
      mPrenom === "ok" &&
      mNom === "ok" &&
      mNAS === "ok" &&
      mDOB === "ok" &&
      mEtatCivil === "ok" &&
      mEmail === "ok" &&
      mAdresse === "ok" &&
      mVille === "ok" &&
      mProvince === "ok" &&
      mPostal === "ok" &&
      phoneAnyValid &&
      mPrevEtat === "ok" &&
      mDateChange === "ok";

    return {
      prenom: mPrenom,
      nom: mNom,
      nas: mNAS,
      dob: mDOB,
      etatCivil: mEtatCivil,
      etatCivilPrev: mPrevEtat,
      etatCivilDate: mDateChange,

      phone: mPhone,
      mobile: mMobile,
      phoneAnyValid,

      email: mEmail,

      adresse: mAdresse,
      ville: mVille,
      province: mProvince,
      postal: mPostal,

      block: blockOk
        ? ("ok" as Mark)
        : ("bad" as Mark),
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
      {/* ======================================================
          EN-TÊTE
      ====================================================== */}

      <div className="ff-card-head">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <h2 style={{ margin: 0 }}>
            {L.sections.clientTitle}
          </h2>

          <MarkIcon
            mark={marks.block}
            lang={lang}
          />
        </div>

        <p style={{ marginTop: 8 }}>
          {L.sections.clientDesc}
        </p>
      </div>

      {/* ======================================================
          IDENTITÉ
      ====================================================== */}

      <div className="ff-grid2">
        <Field
          label={
            <LabelWithMark
              text={L.fields.firstName}
              mark={marks.prenom}
              lang={lang}
              required
            />
          }
          value={prenom}
          onChange={setPrenom}
          required
          status={
            marks.prenom === "ok"
              ? "valid"
              : "invalid"
          }
          autoComplete="given-name"
        />

        <Field
          label={
            <LabelWithMark
              text={L.fields.lastName}
              mark={marks.nom}
              lang={lang}
              required
            />
          }
          value={nom}
          onChange={setNom}
          required
          status={
            marks.nom === "ok"
              ? "valid"
              : "invalid"
          }
          autoComplete="family-name"
        />

        <Field
          label={
            <LabelWithMark
              text={L.fields.sin}
              mark={marks.nas}
              lang={lang}
              required
            />
          }
          value={nas}
          onChange={setNas}
          placeholder={L.fields.sinPh}
          inputMode="numeric"
          formatter={formatNASInput}
          maxLength={11}
          required
          status={
            marks.nas === "ok"
              ? "valid"
              : "invalid"
          }
          autoComplete="off"
        />

        <Field
          label={
            <LabelWithMark
              text={L.fields.dob}
              mark={marks.dob}
              lang={lang}
              required
            />
          }
          value={dob}
          onChange={setDob}
          placeholder={L.fields.dobPh}
          inputMode="numeric"
          formatter={formatDateInput}
          maxLength={10}
          required
          status={
            marks.dob === "ok"
              ? "valid"
              : "invalid"
          }
          autoComplete="bday"
        />
      </div>

      {/* ======================================================
          ÉTAT CIVIL
      ====================================================== */}

      <div className="ff-grid2 ff-mt">
        <SelectField<EtatCivil>
          label={
            <LabelWithMark
              text={L.fields.marital}
              mark={marks.etatCivil}
              lang={lang}
              required
            />
          }
          value={etatCivil}
          onChange={setEtatCivil}
          options={maritalOptions}
          required
          placeholderText={T.choose}
          status={
            marks.etatCivil === "ok"
              ? "valid"
              : "invalid"
          }
        />

        <CheckboxField
          label={L.fields.maritalChanged}
          checked={etatCivilChange}
          onChange={setEtatCivilChange}
        />
      </div>

      {/* ======================================================
          CHANGEMENT D'ÉTAT CIVIL
      ====================================================== */}

      {etatCivilChange ? (
        <div className="ff-grid2 ff-mt">
          <SelectField<EtatCivil>
            label={
              <LabelWithMark
                text={L.fields.prevMarital}
                mark={marks.etatCivilPrev}
                lang={lang}
                required
              />
            }
            value={
              ancienEtatCivil as EtatCivil
            }
            onChange={(v) =>
              setAncienEtatCivil(v)
            }
            options={maritalOptions}
            required
            placeholderText={T.choose}
            status={
              marks.etatCivilPrev === "ok"
                ? "valid"
                : "invalid"
            }
          />

          <Field
            label={
              <LabelWithMark
                text={L.fields.changeDate}
                mark={marks.etatCivilDate}
                lang={lang}
                required
              />
            }
            value={
              dateChangementEtatCivil
            }
            onChange={
              setDateChangementEtatCivil
            }
            placeholder={
              L.fields.changeDatePh
            }
            inputMode="numeric"
            formatter={formatDateInput}
            maxLength={10}
            required
            status={
              marks.etatCivilDate === "ok"
                ? "valid"
                : "invalid"
            }
          />
        </div>
      ) : null}

      {/* ======================================================
          TÉLÉPHONE
      ====================================================== */}

      <div className="ff-grid2 ff-mt">
        <Field
          label={
            <LabelWithMark
              text={L.fields.phone}
              mark={marks.phone}
              lang={lang}
            />
          }
          value={tel}
          onChange={setTel}
          placeholder="(418) 555-1234"
          inputMode="tel"
          formatter={formatPhoneInput}
          maxLength={14}
          status={
            normalizePhone(tel).length > 0
              ? marks.phone === "ok"
                ? "valid"
                : "invalid"
              : null
          }
          autoComplete="tel"
        />

        <Field
          label={
            <LabelWithMark
              text={L.fields.mobile}
              mark={marks.mobile}
              lang={lang}
            />
          }
          value={telCell}
          onChange={setTelCell}
          placeholder="(418) 555-1234"
          inputMode="tel"
          formatter={formatPhoneInput}
          maxLength={14}
          status={
            normalizePhone(telCell).length > 0
              ? marks.mobile === "ok"
                ? "valid"
                : "invalid"
              : null
          }
          autoComplete="tel"
        />
      </div>

      <p
        style={{
          marginTop: 6,
          marginBottom: 0,
          fontSize: 13,
          opacity: 0.75,
        }}
      >
        {marks.phoneAnyValid
          ? "✓ "
          : ""}
        {T.phoneHint}
      </p>

      {/* ======================================================
          COURRIEL
      ====================================================== */}

      <div className="ff-mt">
        <Field
          label={
            <LabelWithMark
              text={L.fields.email}
              mark={marks.email}
              lang={lang}
              required
            />
          }
          value={courriel}
          onChange={setCourriel}
          type="email"
          required
          status={
            marks.email === "ok"
              ? "valid"
              : "invalid"
          }
          autoComplete="email"
        />
      </div>

      {/* ======================================================
          ADRESSE
      ====================================================== */}

      <div className="ff-mt">
        <Field
          label={
            <LabelWithMark
              text={L.fields.address}
              mark={marks.adresse}
              lang={lang}
              required
            />
          }
          value={adresse}
          onChange={setAdresse}
          required
          status={
            marks.adresse === "ok"
              ? "valid"
              : "invalid"
          }
          autoComplete="street-address"
        />

        <div className="ff-grid4 ff-mt-sm">
          <Field
            label={L.fields.apt}
            value={app}
            onChange={setApp}
            placeholder={L.fields.aptPh}
            autoComplete="address-line2"
          />

          <Field
            label={
              <LabelWithMark
                text={L.fields.city}
                mark={marks.ville}
                lang={lang}
                required
              />
            }
            value={ville}
            onChange={setVille}
            required
            status={
              marks.ville === "ok"
                ? "valid"
                : "invalid"
            }
            autoComplete="address-level2"
          />

          <SelectField<ProvinceCode>
            label={
              <LabelWithMark
                text={L.fields.province}
                mark={marks.province}
                lang={lang}
                required
              />
            }
            value={province}
            onChange={setProvince}
            options={PROVINCES}
            required
            placeholderText={T.choose}
            status={
              marks.province === "ok"
                ? "valid"
                : "invalid"
            }
            autoComplete="address-level1"
          />

          <Field
            label={
              <LabelWithMark
                text={L.fields.postal}
                mark={marks.postal}
                lang={lang}
                required
              />
            }
            value={codePostal}
            onChange={setCodePostal}
            placeholder={L.fields.postalPh}
            formatter={formatPostalInput}
            maxLength={7}
            required
            status={
              marks.postal === "ok"
                ? "valid"
                : "invalid"
            }
            autoComplete="postal-code"
          />
        </div>
      </div>
    </section>
  );
}
