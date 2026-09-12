// app/formulaire-fiscal/sections/SpouseSection.tsx
"use client";

import React, { useMemo } from "react";

import {
  Field,
  CheckboxField,
  SelectField,
  YesNoField,
} from "../ui";

import type {
  ProvinceCode,
  T2201Statut,
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
type YesNo = "oui" | "non" | "";

type Props = {
  L: CopyPack;

  PROVINCES: {
    value: ProvinceCode;
    label: string;
  }[];

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
  setAdresseConjointeIdentique: (
    v: boolean
  ) => void;

  adresseConjoint: string;
  setAdresseConjoint: (v: string) => void;

  appConjoint: string;
  setAppConjoint: (v: string) => void;

  villeConjoint: string;
  setVilleConjoint: (v: string) => void;

  provinceConjoint: ProvinceCode;
  setProvinceConjoint: (
    v: ProvinceCode
  ) => void;

  codePostalConjoint: string;
  setCodePostalConjoint: (
    v: string
  ) => void;

  /* HANDICAP / T2201 */

  handicapConjoint: boolean | undefined;

  setHandicapConjoint: (
    v: boolean | undefined
  ) => void;

  t2201StatutConjoint: T2201Statut;

  setT2201StatutConjoint: (
    v: T2201Statut
  ) => void;
};

/* ============================================================
   LANGUE
============================================================ */

function getUiLang(L: CopyPack): UiLang {
  if (L.fields.firstName === "First name") {
    return "en";
  }

  if (L.fields.firstName === "Nombre") {
    return "es";
  }

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

    yes: "Oui",
    no: "Non",

    phoneHint:
      "Au moins un numéro de téléphone valide du conjoint est requis.",

    disability:
      "Votre conjoint a-t-il une déficience ou un handicap pouvant donner droit à un crédit ou à une déduction fiscale ?",

    t2201:
      "Statut du formulaire T2201 – Certificat pour le crédit d’impôt pour personnes handicapées",

    t2201Approved:
      "Approuvé par l’ARC",

    t2201Pending:
      "En attente d’une décision",

    t2201No:
      "Non / aucun formulaire T2201",

    t2201Unknown:
      "Je ne sais pas",

    disabilityHint:
      "Si oui, indiquez le statut du formulaire T2201 afin que ComptaNet Québec puisse vérifier les crédits applicables.",
  },

  en: {
    ok: "Valid",
    bad: "Needs correction",
    todo: "To complete",

    choose: "Select…",

    yes: "Yes",
    no: "No",

    phoneHint:
      "At least one valid phone number for the spouse is required.",

    disability:
      "Does your spouse have an impairment or disability that may qualify for a tax credit or deduction?",

    t2201:
      "Status of Form T2201 – Disability Tax Credit Certificate",

    t2201Approved:
      "Approved by the CRA",

    t2201Pending:
      "Awaiting a decision",

    t2201No:
      "No / no T2201 form",

    t2201Unknown:
      "I don't know",

    disabilityHint:
      "If yes, indicate the status of Form T2201 so ComptaNet Québec can review the applicable tax credits.",
  },

  es: {
    ok: "Válido",
    bad: "Debe corregirse",
    todo: "Por completar",

    choose: "Seleccionar…",

    yes: "Sí",
    no: "No",

    phoneHint:
      "Se requiere al menos un número de teléfono válido del cónyuge.",

    disability:
      "¿Su cónyuge tiene una deficiencia o discapacidad que podría dar derecho a un crédito o deducción fiscal?",

    t2201:
      "Estado del formulario T2201 – Certificado para el crédito fiscal por discapacidad",

    t2201Approved:
      "Aprobado por la CRA",

    t2201Pending:
      "En espera de una decisión",

    t2201No:
      "No / ningún formulario T2201",

    t2201Unknown:
      "No lo sé",

    disabilityHint:
      "Si la respuesta es sí, indique el estado del formulario T2201 para que ComptaNet Québec pueda verificar los créditos fiscales aplicables.",
  },
} as const;

/* ============================================================
   MARQUES
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

function isValidSIN(v: string) {
  const sin = normalizeNAS(v);

  if (sin.length !== 9) {
    return false;
  }

  let sum = 0;

  for (let i = 0; i < sin.length; i++) {
    let digit = Number(sin[i]);

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

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function isValidDateJJMMAAAA(v: string) {
  const value = (v || "").trim();

  if (
    !/^\d{2}\/\d{2}\/\d{4}$/.test(value)
  ) {
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

  return /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTVWXYZ]\d[ABCEGHJ-NPRSTVWXYZ]\d$/.test(
    postal
  );
}

function isValidPhone(v: string) {
  return normalizePhone(v).length === 10;
}

function isNumericLike(v: string) {
  const value = (v || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(",", ".");

  if (!value) {
    return false;
  }

  return /^\d+(\.\d{1,2})?$/.test(value);
}

function markRequired(v: string): Mark {
  return (v || "").trim()
    ? "ok"
    : "bad";
}

function markSIN(v: string): Mark {
  if (!normalizeNAS(v)) {
    return "todo";
  }

  return isValidSIN(v)
    ? "ok"
    : "bad";
}

function markDOB(v: string): Mark {
  if (!(v || "").trim()) {
    return "todo";
  }

  return isValidDateJJMMAAAA(v)
    ? "ok"
    : "bad";
}

function markEmail(v: string): Mark {
  if (!(v || "").trim()) {
    return "todo";
  }

  return isValidEmail(v)
    ? "ok"
    : "bad";
}

function markPostal(v: string): Mark {
  if (!normalizePostal(v)) {
    return "todo";
  }

  return isValidPostal(v)
    ? "ok"
    : "bad";
}

function markNumeric(v: string): Mark {
  if (!(v || "").trim()) {
    return "todo";
  }

  return isNumericLike(v)
    ? "ok"
    : "bad";
}

/* ============================================================
   COMPOSANT
============================================================ */

export default function SpouseSection(
  props: Props
) {
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

    handicapConjoint,
    setHandicapConjoint,

    t2201StatutConjoint,
    setT2201StatutConjoint,
  } = props;

  const lang = getUiLang(L);
  const T = LOCAL_TEXT[lang];

  const showNetIncome =
    aUnConjoint && !traiterConjoint;

  const showIncludedFields =
    aUnConjoint && traiterConjoint;

  const showAddrFields =
    aUnConjoint &&
    !adresseConjointeIdentique;

  /* ==========================================================
     VALIDATION DU BLOC
  ========================================================== */

  const marks = useMemo(() => {
    const mNet: Mark =
      showNetIncome
        ? markNumeric(
            revenuNetConjoint
          )
        : "ok";

    const mFirstName: Mark =
      showIncludedFields
        ? markRequired(
            prenomConjoint
          )
        : "ok";

    const mLastName: Mark =
      showIncludedFields
        ? markRequired(
            nomConjoint
          )
        : "ok";

    const mSIN: Mark =
      showIncludedFields
        ? markSIN(nasConjoint)
        : "ok";

    const mDOB: Mark =
      showIncludedFields
        ? markDOB(dobConjoint)
        : "ok";

    const phoneEntered =
      normalizePhone(telConjoint)
        .length > 0;

    const mobileEntered =
      normalizePhone(
        telCellConjoint
      ).length > 0;

    const phoneValid =
      isValidPhone(telConjoint);

    const mobileValid =
      isValidPhone(
        telCellConjoint
      );

    const phoneAnyValid =
      !showIncludedFields ||
      phoneValid ||
      mobileValid;

    const mPhone: Mark =
      !showIncludedFields
        ? "ok"
        : phoneEntered
        ? phoneValid
          ? "ok"
          : "bad"
        : phoneAnyValid
        ? "todo"
        : "bad";

    const mMobile: Mark =
      !showIncludedFields
        ? "ok"
        : mobileEntered
        ? mobileValid
          ? "ok"
          : "bad"
        : phoneAnyValid
        ? "todo"
        : "bad";

    const mEmail: Mark =
      showIncludedFields
        ? markEmail(
            courrielConjoint
          )
        : "ok";

    const mAddress: Mark =
      showAddrFields
        ? markRequired(
            adresseConjoint
          )
        : "ok";

    const mCity: Mark =
      showAddrFields
        ? markRequired(
            villeConjoint
          )
        : "ok";

    const mProvince: Mark =
      showAddrFields
        ? provinceConjoint
          ? "ok"
          : "bad"
        : "ok";

    const mPostal: Mark =
      showAddrFields
        ? markPostal(
            codePostalConjoint
          )
        : "ok";

    /*
      Si le client n'a pas de conjoint,
      cette question ne s'applique pas.

      S'il a un conjoint, une réponse
      Oui ou Non est requise.
    */
    const mHandicap: Mark =
      !aUnConjoint
        ? "ok"
        : typeof handicapConjoint ===
          "boolean"
        ? "ok"
        : "bad";

    /*
      Si handicap = Oui,
      le statut T2201 est requis.
    */
    const mT2201: Mark =
      !aUnConjoint ||
      handicapConjoint !== true
        ? "ok"
        : t2201StatutConjoint
        ? "ok"
        : "bad";

    const blockOk =
      !aUnConjoint ||
      (
        (!showNetIncome ||
          mNet === "ok") &&

        (
          !showIncludedFields ||
          (
            mFirstName === "ok" &&
            mLastName === "ok" &&
            mSIN === "ok" &&
            mDOB === "ok" &&
            phoneAnyValid &&
            mEmail === "ok"
          )
        ) &&

        (
          !showAddrFields ||
          (
            mAddress === "ok" &&
            mCity === "ok" &&
            mProvince === "ok" &&
            mPostal === "ok"
          )
        ) &&

        mHandicap === "ok" &&
        mT2201 === "ok"
      );

    return {
      net: mNet,

      firstName: mFirstName,
      lastName: mLastName,
      sin: mSIN,
      dob: mDOB,

      phone: mPhone,
      mobile: mMobile,
      phoneAnyValid,

      email: mEmail,

      address: mAddress,
      city: mCity,
      province: mProvince,
      postal: mPostal,

      handicap: mHandicap,
      t2201: mT2201,

      block: blockOk
        ? ("ok" as Mark)
        : ("bad" as Mark),
    };
  }, [
    aUnConjoint,
    showNetIncome,
    showIncludedFields,
    showAddrFields,

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

    handicapConjoint,
    t2201StatutConjoint,
  ]);

  const handicapValue: YesNo =
    handicapConjoint === true
      ? "oui"
      : handicapConjoint === false
      ? "non"
      : "";

  /* ==========================================================
     AFFICHAGE
  ========================================================== */

  return (
    <section className="ff-card">
      {/* EN-TÊTE */}

      <div className="ff-card-head">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 10,
          }}
        >
          <h2 style={{ margin: 0 }}>
            {L.sections.spouseTitle}
          </h2>

          <MarkIcon
            mark={marks.block}
            lang={lang}
          />
        </div>

        <p style={{ marginTop: 8 }}>
          {L.sections.spouseDesc}
        </p>
      </div>

      {/* A UN CONJOINT */}

      <CheckboxField
        label={L.spouse.hasSpouse}
        checked={aUnConjoint}
        onChange={(value) => {
          setAUnConjoint(value);

          if (!value) {
            setHandicapConjoint(
              undefined
            );

            setT2201StatutConjoint(
              ""
            );
          }
        }}
      />

      {aUnConjoint ? (
        <>
          {/* TRAITER LA DÉCLARATION */}

          <div className="ff-mt">
            <CheckboxField
              label={
                L.spouse.includeSpouse
              }
              checked={traiterConjoint}
              onChange={
                setTraiterConjoint
              }
            />
          </div>

          {/* REVENU NET */}

          {showNetIncome ? (
            <div className="ff-mt">
              <Field
                label={
                  <LabelWithMark
                    text={
                      L.spouse
                        .spouseNetIncome
                    }
                    mark={marks.net}
                    lang={lang}
                    required
                  />
                }
                value={
                  revenuNetConjoint
                }
                onChange={
                  setRevenuNetConjoint
                }
                placeholder={
                  L.spouse
                    .spouseNetIncomePh
                }
                inputMode="decimal"
                required
                status={
                  marks.net === "ok"
                    ? "valid"
                    : "invalid"
                }
              />
            </div>
          ) : null}

          {/* INFORMATIONS DU CONJOINT */}

          {showIncludedFields ? (
            <>
              <div className="ff-grid2 ff-mt">
                <Field
                  label={
                    <LabelWithMark
                      text={
                        L.spouse
                          .spouseFirstName
                      }
                      mark={
                        marks.firstName
                      }
                      lang={lang}
                      required
                    />
                  }
                  value={
                    prenomConjoint
                  }
                  onChange={
                    setPrenomConjoint
                  }
                  required
                  status={
                    marks.firstName ===
                    "ok"
                      ? "valid"
                      : "invalid"
                  }
                  autoComplete="off"
                />

                <Field
                  label={
                    <LabelWithMark
                      text={
                        L.spouse
                          .spouseLastName
                      }
                      mark={
                        marks.lastName
                      }
                      lang={lang}
                      required
                    />
                  }
                  value={
                    nomConjoint
                  }
                  onChange={
                    setNomConjoint
                  }
                  required
                  status={
                    marks.lastName ===
                    "ok"
                      ? "valid"
                      : "invalid"
                  }
                  autoComplete="off"
                />

                <Field
                  label={
                    <LabelWithMark
                      text={
                        L.spouse
                          .spouseSin
                      }
                      mark={marks.sin}
                      lang={lang}
                      required
                    />
                  }
                  value={nasConjoint}
                  onChange={
                    setNasConjoint
                  }
                  placeholder={
                    L.fields.sinPh
                  }
                  inputMode="numeric"
                  formatter={
                    formatNASInput
                  }
                  maxLength={11}
                  required
                  status={
                    marks.sin === "ok"
                      ? "valid"
                      : "invalid"
                  }
                  autoComplete="off"
                />

                <Field
                  label={
                    <LabelWithMark
                      text={
                        L.spouse
                          .spouseDob
                      }
                      mark={marks.dob}
                      lang={lang}
                      required
                    />
                  }
                  value={dobConjoint}
                  onChange={
                    setDobConjoint
                  }
                  placeholder={
                    L.fields.dobPh
                  }
                  inputMode="numeric"
                  formatter={
                    formatDateInput
                  }
                  maxLength={10}
                  required
                  status={
                    marks.dob === "ok"
                      ? "valid"
                      : "invalid"
                  }
                  autoComplete="off"
                />
              </div>

              {/* TÉLÉPHONE */}

              <div className="ff-grid2 ff-mt">
                <Field
                  label={
                    <LabelWithMark
                      text={
                        L.spouse
                          .spousePhone
                      }
                      mark={
                        marks.phone
                      }
                      lang={lang}
                    />
                  }
                  value={
                    telConjoint
                  }
                  onChange={
                    setTelConjoint
                  }
                  placeholder="(418) 555-1234"
                  inputMode="tel"
                  formatter={
                    formatPhoneInput
                  }
                  maxLength={14}
                  status={
                    normalizePhone(
                      telConjoint
                    ).length > 0
                      ? marks.phone ===
                        "ok"
                        ? "valid"
                        : "invalid"
                      : null
                  }
                  autoComplete="off"
                />

                <Field
                  label={
                    <LabelWithMark
                      text={
                        L.spouse
                          .spouseMobile
                      }
                      mark={
                        marks.mobile
                      }
                      lang={lang}
                    />
                  }
                  value={
                    telCellConjoint
                  }
                  onChange={
                    setTelCellConjoint
                  }
                  placeholder="(418) 555-1234"
                  inputMode="tel"
                  formatter={
                    formatPhoneInput
                  }
                  maxLength={14}
                  status={
                    normalizePhone(
                      telCellConjoint
                    ).length > 0
                      ? marks.mobile ===
                        "ok"
                        ? "valid"
                        : "invalid"
                      : null
                  }
                  autoComplete="off"
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

              {/* COURRIEL */}

              <div className="ff-mt">
                <Field
                  label={
                    <LabelWithMark
                      text={
                        L.spouse
                          .spouseEmail
                      }
                      mark={
                        marks.email
                      }
                      lang={lang}
                      required
                    />
                  }
                  value={
                    courrielConjoint
                  }
                  onChange={
                    setCourrielConjoint
                  }
                  type="email"
                  placeholder="nom@exemple.com"
                  required
                  status={
                    marks.email === "ok"
                      ? "valid"
                      : "invalid"
                  }
                  autoComplete="off"
                />
              </div>
            </>
          ) : null}

          {/* ADRESSE */}

          <div className="ff-mt">
            <CheckboxField
              label={
                L.spouse.sameAddress
              }
              checked={
                adresseConjointeIdentique
              }
              onChange={
                setAdresseConjointeIdentique
              }
            />
          </div>

          {showAddrFields ? (
            <div className="ff-mt">
              <Field
                label={
                  <LabelWithMark
                    text={
                      L.spouse
                        .spouseAddress
                    }
                    mark={
                      marks.address
                    }
                    lang={lang}
                    required
                  />
                }
                value={
                  adresseConjoint
                }
                onChange={
                  setAdresseConjoint
                }
                required
                status={
                  marks.address === "ok"
                    ? "valid"
                    : "invalid"
                }
                autoComplete="off"
              />

              <div className="ff-grid4 ff-mt-sm">
                <Field
                  label={L.fields.apt}
                  value={
                    appConjoint
                  }
                  onChange={
                    setAppConjoint
                  }
                  placeholder={
                    L.fields.aptPh
                  }
                  autoComplete="off"
                />

                <Field
                  label={
                    <LabelWithMark
                      text={
                        L.fields.city
                      }
                      mark={marks.city}
                      lang={lang}
                      required
                    />
                  }
                  value={
                    villeConjoint
                  }
                  onChange={
                    setVilleConjoint
                  }
                  required
                  status={
                    marks.city === "ok"
                      ? "valid"
                      : "invalid"
                  }
                  autoComplete="off"
                />

                <SelectField<ProvinceCode>
                  label={
                    <LabelWithMark
                      text={
                        L.fields.province
                      }
                      mark={
                        marks.province
                      }
                      lang={lang}
                      required
                    />
                  }
                  value={
                    provinceConjoint
                  }
                  onChange={
                    setProvinceConjoint
                  }
                  options={PROVINCES}
                  required
                  placeholderText={
                    T.choose
                  }
                  status={
                    marks.province ===
                    "ok"
                      ? "valid"
                      : "invalid"
                  }
                />

                <Field
                  label={
                    <LabelWithMark
                      text={
                        L.fields.postal
                      }
                      mark={
                        marks.postal
                      }
                      lang={lang}
                      required
                    />
                  }
                  value={
                    codePostalConjoint
                  }
                  onChange={
                    setCodePostalConjoint
                  }
                  placeholder={
                    L.fields.postalPh
                  }
                  formatter={
                    formatPostalInput
                  }
                  maxLength={7}
                  required
                  status={
                    marks.postal === "ok"
                      ? "valid"
                      : "invalid"
                  }
                  autoComplete="off"
                />
              </div>
            </div>
          ) : null}

          {/* ================================================
              HANDICAP / DÉFICIENCE
          ================================================ */}

          <div
            className="ff-mt"
            style={{
              paddingTop: 16,
              borderTop:
                "1px solid rgba(0,0,0,.08)",
            }}
          >
            <YesNoField
              label={
                <LabelWithMark
                  text={T.disability}
                  mark={
                    marks.handicap
                  }
                  lang={lang}
                  required
                />
              }
              value={handicapValue}
              onChange={(value) => {
                if (
                  value === "oui"
                ) {
                  setHandicapConjoint(
                    true
                  );
                }

                if (
                  value === "non"
                ) {
                  setHandicapConjoint(
                    false
                  );

                  setT2201StatutConjoint(
                    ""
                  );
                }
              }}
              required
              labels={{
                yes: T.yes,
                no: T.no,
              }}
              status={
                marks.handicap === "ok"
                  ? "valid"
                  : "invalid"
              }
            />

            {handicapConjoint ===
            true ? (
              <div className="ff-mt-sm">
                <SelectField<T2201Statut>
                  label={
                    <LabelWithMark
                      text={T.t2201}
                      mark={
                        marks.t2201
                      }
                      lang={lang}
                      required
                    />
                  }
                  value={
                    t2201StatutConjoint
                  }
                  onChange={
                    setT2201StatutConjoint
                  }
                  options={[
                    {
                      value:
                        "approuve",
                      label:
                        T.t2201Approved,
                    },
                    {
                      value:
                        "attente",
                      label:
                        T.t2201Pending,
                    },
                    {
                      value: "non",
                      label:
                        T.t2201No,
                    },
                    {
                      value:
                        "inconnu",
                      label:
                        T.t2201Unknown,
                    },
                  ]}
                  required
                  placeholderText={
                    T.choose
                  }
                  status={
                    marks.t2201 === "ok"
                      ? "valid"
                      : "invalid"
                  }
                  hint={
                    T.disabilityHint
                  }
                />
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
