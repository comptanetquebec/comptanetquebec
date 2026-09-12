// app/formulaire-fiscal/sections/ClientSection.tsx
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
  EtatCivil,
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

    yes: "Oui",
    no: "Non",

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

    disability:
      "Avez-vous une déficience ou un handicap pouvant donner droit à un crédit ou à une déduction fiscale ?",

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
      "At least one valid phone number is required.",

    marital: {
      celibataire: "Single",
      conjointDefait: "Common-law",
      marie: "Married",
      separe: "Separated",
      divorce: "Divorced",
      veuf: "Widowed",
    },

    disability:
      "Do you have an impairment or disability that may qualify for a tax credit or deduction?",

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
      "Se requiere al menos un número de teléfono válido.",

    marital: {
      celibataire: "Soltero(a)",
      conjointDefait: "Unión de hecho",
      marie: "Casado(a)",
      separe: "Separado(a)",
      divorce: "Divorciado(a)",
      veuf: "Viudo(a)",
    },

    disability:
      "¿Tiene una deficiencia o discapacidad que podría dar derecho a un crédito o deducción fiscal?",

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
   ICÔNES
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
   VALIDATIONS
============================================================ */

function isValidNAS(v: string) {
  const nas = normalizeNAS(v);

  if (nas.length !== 9) return false;

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

  if (!value) return false;

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

function markRequired(v: string): Mark {
  return (v || "").trim()
    ? "ok"
    : "bad";
}

function markNAS(v: string): Mark {
  return isValidNAS(v) ? "ok" : "bad";
}

function markDate(v: string): Mark {
  return isValidDateJJMMAAAA(v)
    ? "ok"
    : "bad";
}

function markEmail(v: string): Mark {
  return isValidEmail(v) ? "ok" : "bad";
}

function markPostal(v: string): Mark {
  return isValidPostal(v) ? "ok" : "bad";
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
  setDateChangementEtatCivil: (
    v: string
  ) => void;

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
  setProvince: (
    v: ProvinceCode
  ) => void;

  codePostal: string;
  setCodePostal: (v: string) => void;

  /* Handicap / T2201 */
  handicap: boolean | undefined;
  setHandicap: (
    v: boolean | undefined
  ) => void;

  t2201Statut: T2201Statut;
  setT2201Statut: (
    v: T2201Statut
  ) => void;
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

    handicap,
    setHandicap,

    t2201Statut,
    setT2201Statut,
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

    /* Handicap doit avoir une réponse */
    const mHandicap: Mark =
      typeof handicap === "boolean"
        ? "ok"
        : "bad";

    /*
      Le statut T2201 est obligatoire
      seulement si handicap = Oui.
    */
    const mT2201: Mark =
      handicap !== true
        ? "ok"
        : t2201Statut
        ? "ok"
        : "bad";

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
      mDateChange === "ok" &&
      mHandicap === "ok" &&
      mT2201 === "ok";

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

      handicap: mHandicap,
      t2201: mT2201,

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
    handicap,
    t2201Statut,
  ]);

  const handicapValue: YesNo =
    handicap === true
      ? "oui"
      : handicap === false
      ? "non"
      : "";

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
            justifyContent:
              "space-between",
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
                mark={
                  marks.etatCivilPrev
                }
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
                text={
                  L.fields.changeDate
                }
                mark={
                  marks.etatCivilDate
                }
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
            normalizePhone(tel).length >
            0
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
            normalizePhone(telCell)
              .length > 0
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
            autoComplete="postal-code"
          />
        </div>
      </div>

      {/* ======================================================
          HANDICAP / DÉFICIENCE
      ====================================================== */}

      <div
        className="ff-mt"
        style={{
          paddingTop: 16,
          borderTop:
            "1px solid rgba(0,0,0,.08)",
        }}
      >
        <YesNoField
          name="client-disability"
          label={
            <LabelWithMark
              text={T.disability}
              mark={marks.handicap}
              lang={lang}
              required
            />
          }
          value={handicapValue}
          onChange={(value) => {
            if (value === "oui") {
              setHandicap(true);
            }

            if (value === "non") {
              setHandicap(false);

              /*
                On vide le statut T2201
                lorsque la réponse devient Non.
              */
              setT2201Statut("");
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

        {handicap === true ? (
          <div className="ff-mt-sm">
            <SelectField<T2201Statut>
              label={
                <LabelWithMark
                  text={T.t2201}
                  mark={marks.t2201}
                  lang={lang}
                  required
                />
              }
              value={t2201Statut}
              onChange={setT2201Statut}
              options={[
                {
                  value: "approuve",
                  label:
                    T.t2201Approved,
                },
                {
                  value: "attente",
                  label:
                    T.t2201Pending,
                },
                {
                  value: "non",
                  label: T.t2201No,
                },
                {
                  value: "inconnu",
                  label:
                    T.t2201Unknown,
                },
              ]}
              required
              placeholderText={T.choose}
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
    </section>
  );
}
