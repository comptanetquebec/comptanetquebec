"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";

const I18N: Record<
  Lang,
  {
    brand: string;
    pageTitle: string;
    submit: string;
    sending: string;

    // Sections
    s1: string; s1_you: string; s1_spouse: string; treat_spouse: string; spouse_net_if_not: string;
    s2: string; state: string; changed: string; prev: string; change_date: string;
    s3: string; you_info: string; spouse_info: string; same_addr: string;

    s4: string; coverage: string; from: string; to: string; otherLabel: string;
    cov_RAMQ: string; cov_PRIV: string; cov_CONJ: string; cov_AUTRE: string;
    add_period: string; remove_line: string;

    s5: string; child_sex: string; child_first: string; child_last: string; child_dob: string; child_sin: string;
    add_child: string; remove_child: string;

    s6: string; q1: string; q2: string; q3: string; q4: string; q5: string; q6: string; q7: string;

    s7: string;
    s8: string; delivery_email: string; delivery_portal: string;

    // Generic labels
    first: string; last: string; sin: string; dob: string; citizenship: string;
    phone_day: string; phone_evening: string; phone_mobile: string; email: string;
    address: string; apt: string; city: string; province: string; postal: string;

    marital_celib: string; marital_marie: string; marital_conjoint: string;
    marital_separe: string; marital_divorce: string; marital_veuf: string;

    sex_M: string; sex_F: string;

    // Errors / notices
    must_be_logged: string;
    error: string;
  }
> = {
  fr: {
    brand: "ComptaNet Québec",
    pageTitle: "Formulaire fiscal",
    submit: "Envoyer",
    sending: "Envoi…",

    s1: "1) Identification – Contribuable",
    s1_you: "Identification – Contribuable",
    s1_spouse: "Identification – Conjoint(e)",
    treat_spouse: "Traiter la déclaration du conjoint",
    spouse_net_if_not: "Revenu net approximatif (si déclaration non traitée)",

    s2: "2) État civil",
    state: "État civil",
    changed: "Changement d’état civil en cours d’année",
    prev: "Ancien état civil",
    change_date: "Date du changement",

    s3: "3) Coordonnées",
    you_info: "Coordonnées – Contribuable",
    spouse_info: "Coordonnées – Conjoint(e)",
    same_addr: "Adresse identique au contribuable",

    s4: "4) Assurance médicaments",
    coverage: "Régime",
    from: "De",
    to: "À",
    otherLabel: "Libellé (si Autre)",
    cov_RAMQ: "RAMQ",
    cov_PRIV: "Assurance privée (employeur)",
    cov_CONJ: "Régime du conjoint",
    cov_AUTRE: "Autre",
    add_period: "+ Ajouter une période",
    remove_line: "Supprimer cette ligne",

    s5: "5) Personnes à charge (enfants)",
    child_sex: "Sexe",
    child_first: "Prénom",
    child_last: "Nom",
    child_dob: "Date de naissance",
    child_sin: "NAS (si attribué)",
    add_child: "+ Ajouter un enfant",
    remove_child: "Supprimer",

    s6: "6) Questions – Oui / Non",
    q1: "Habité seul(e) au 31/12",
    q2: "Nb de personnes au domicile au 31/12",
    q3: "Biens à l’étranger > 100 000 $",
    q4: "Non-résident pour fins d’impôt",
    q5: "Première habitation (année courante)",
    q6: "Vente d’une résidence",
    q7: "Être rappelé(e) par un(e) technicien(ne)",

    s7: "7) Commentaires",
    s8: "8) Réception de la déclaration",
    delivery_email: "Courriel",
    delivery_portal: "Espace client",

    first: "Prénom",
    last: "Nom",
    sin: "NAS",
    dob: "Date de naissance",
    citizenship: "Citoyenneté",
    phone_day: "Tél. (jour)",
    phone_evening: "Tél. (soir)",
    phone_mobile: "Cellulaire",
    email: "Courriel",
    address: "Adresse",
    apt: "Appartement",
    city: "Ville",
    province: "Province",
    postal: "Code postal",

    marital_celib: "Célibataire",
    marital_marie: "Marié(e)",
    marital_conjoint: "Conjoint(e) de fait",
    marital_separe: "Séparé(e)",
    marital_divorce: "Divorcé(e)",
    marital_veuf: "Veuf(ve)",

    sex_M: "M",
    sex_F: "F",

    must_be_logged: "Vous devez être connecté. Redirection…",
    error: "Erreur : réessayez plus tard.",
  },
  en: {
    brand: "ComptaNet Québec",
    pageTitle: "Tax Information Form",
    submit: "Submit",
    sending: "Submitting…",

    s1: "1) Identification – Taxpayer",
    s1_you: "Identification – Taxpayer",
    s1_spouse: "Identification – Spouse",
    treat_spouse: "Process spouse’s return",
    spouse_net_if_not: "Approx. net income (if spouse’s return not processed)",

    s2: "2) Marital status",
    state: "Status",
    changed: "Status changed during the year",
    prev: "Previous status",
    change_date: "Change date",

    s3: "3) Contact information",
    you_info: "Contact – Taxpayer",
    spouse_info: "Contact – Spouse",
    same_addr: "Same address as taxpayer",

    s4: "4) Prescription drug insurance",
    coverage: "Plan",
    from: "From",
    to: "To",
    otherLabel: "Label (if Other)",
    cov_RAMQ: "RAMQ",
    cov_PRIV: "Private (employer)",
    cov_CONJ: "Spouse’s plan",
    cov_AUTRE: "Other",
    add_period: "+ Add a period",
    remove_line: "Remove this line",

    s5: "5) Dependants (children)",
    child_sex: "Sex",
    child_first: "First name",
    child_last: "Last name",
    child_dob: "Date of birth",
    child_sin: "SIN (if assigned)",
    add_child: "+ Add a child",
    remove_child: "Remove",

    s6: "6) Questions – Yes / No",
    q1: "Lived alone on Dec 31",
    q2: "People in household on Dec 31",
    q3: "Foreign assets > $100,000",
    q4: "Non-resident for tax purposes",
    q5: "First home purchase (current year)",
    q6: "Sold a residence",
    q7: "Request a callback by a technician",

    s7: "7) Comments",
    s8: "8) Return delivery",
    delivery_email: "Email",
    delivery_portal: "Client portal",

    first: "First name",
    last: "Last name",
    sin: "SIN",
    dob: "Date of birth",
    citizenship: "Citizenship",
    phone_day: "Phone (day)",
    phone_evening: "Phone (evening)",
    phone_mobile: "Mobile phone",
    email: "Email",
    address: "Address",
    apt: "Apt",
    city: "City",
    province: "Province",
    postal: "Postal code",

    marital_celib: "Single",
    marital_marie: "Married",
    marital_conjoint: "Common-law partner",
    marital_separe: "Separated",
    marital_divorce: "Divorced",
    marital_veuf: "Widowed",

    sex_M: "M",
    sex_F: "F",

    must_be_logged: "You must be logged in. Redirecting…",
    error: "Error: please try again later.",
  },
  es: {
    brand: "ComptaNet Québec",
    pageTitle: "Formulario fiscal",
    submit: "Enviar",
    sending: "Enviando…",

    s1: "1) Identificación – Contribuyente",
    s1_you: "Identificación – Contribuyente",
    s1_spouse: "Identificación – Cónyuge",
    treat_spouse: "Tramitar la declaración del cónyuge",
    spouse_net_if_not: "Ingreso neto aprox. (si no se tramita la del cónyuge)",

    s2: "2) Estado civil",
    state: "Estado",
    changed: "Cambio de estado durante el año",
    prev: "Estado anterior",
    change_date: "Fecha del cambio",

    s3: "3) Datos de contacto",
    you_info: "Contacto – Contribuyente",
    spouse_info: "Contacto – Cónyuge",
    same_addr: "Dirección igual que la del contribuyente",

    s4: "4) Seguro de medicamentos",
    coverage: "Régimen",
    from: "Desde",
    to: "Hasta",
    otherLabel: "Etiqueta (si Otro)",
    cov_RAMQ: "RAMQ",
    cov_PRIV: "Privado (empleador)",
    cov_CONJ: "Régimen del cónyuge",
    cov_AUTRE: "Otro",
    add_period: "+ Añadir período",
    remove_line: "Eliminar esta línea",

    s5: "5) Personas a cargo (hijos)",
    child_sex: "Sexo",
    child_first: "Nombre",
    child_last: "Apellido",
    child_dob: "Fecha de nacimiento",
    child_sin: "NSS (si asignado)",
    add_child: "+ Añadir hijo",
    remove_child: "Eliminar",

    s6: "6) Preguntas – Sí / No",
    q1: "¿Vivió solo(a) al 31/12?",
    q2: "Personas en el hogar al 31/12",
    q3: "Bienes en el extranjero > 100 000 $",
    q4: "No residente a efectos fiscales",
    q5: "Primera vivienda (año actual)",
    q6: "Venta de una vivienda",
    q7: "¿Desea ser llamado(a) por un técnico?",

    s7: "7) Comentarios",
    s8: "8) Entrega de la declaración",
    delivery_email: "Correo",
    delivery_portal: "Portal cliente",

    first: "Nombre",
    last: "Apellido",
    sin: "NSS",
    dob: "Fecha de nacimiento",
    citizenship: "Ciudadanía",
    phone_day: "Tel. (día)",
    phone_evening: "Tel. (tarde)",
    phone_mobile: "Celular",
    email: "Correo",
    address: "Dirección",
    apt: "Depto",
    city: "Ciudad",
    province: "Provincia",
    postal: "Código postal",

    marital_celib: "Soltero(a)",
    marital_marie: "Casado(a)",
    marital_conjoint: "Unión libre",
    marital_separe: "Separado(a)",
    marital_divorce: "Divorciado(a)",
    marital_veuf: "Viudo(a)",

    sex_M: "M",
    sex_F: "F",

    must_be_logged: "Debe iniciar sesión. Redirigiendo…",
    error: "Error: intente nuevamente.",
  },
};

export default function FormulaireFiscal() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("fr");
  const t = I18N[lang];
  const [loading, setLoading] = useState(false);

  // Exige d'être connecté
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        alert(t.must_be_logged);
        router.replace("/espace-client?next=/formulaire-fiscal");
      }
    })();
  }, [router, t.must_be_logged]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const form = e.currentTarget;
      const fd = new FormData(form);

      // 1) tout en string
      const payload: Record<string, string> = {};
      for (const [k, v] of fd.entries()) {
        payload[k] = typeof v === "string" ? v : "";
      }

      // 2) cases à cocher → "true"/"false"
      const checkboxKeys = [
        "treat_spouse",
        "status_changed",
        "spouse_same_address",
        "lived_alone",
        "foreign_assets_over_100k",
        "non_resident",
        "first_home_purchase",
        "sold_residence",
        "call_back",
      ] as const;
      checkboxKeys.forEach((key) => {
        payload[key] = fd.has(key) ? "true" : "false";
      });

      const res = await fetch("/api/submit-formulaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(t.error);
        return;
      }
      router.push("/merci");
    } catch {
      alert(t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="hero">
      <div className="card container">
        {/* Header */}
        <div className="brand" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo-cq.png" alt={t.brand} style={{ height: 40, width: "auto" }} />
            <span className="brand-text">{t.pageTitle}</span>
          </div>
          <div className="nav">
            <button
              type="button"
              className={`btn ${lang === "fr" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setLang("fr")}
              aria-pressed={lang === "fr"}
            >
              FR
            </button>
            <button
              type="button"
              className={`btn ${lang === "en" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
            <button
              type="button"
              className={`btn ${lang === "es" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setLang("es")}
              aria-pressed={lang === "es"}
            >
              ES
            </button>
          </div>
        </div>

        {/* FORM */}
        <form className="form" onSubmit={onSubmit}>
          {/* 1) Identification – contribuable & conjoint */}
          <h2>{t.s1}</h2>

          <h3>{t.s1_you}</h3>
          <div className="grid">
            <label>{t.first}<input name="you_firstName" required /></label>
            <label>{t.last}<input name="you_lastName" required /></label>
            <label>{t.sin}<input name="you_sin" placeholder="123 456 789" /></label>
            <label>{t.dob}<input type="date" name="you_dob" /></label>
            <label>{t.citizenship}<input name="you_citizenship" /></label>
          </div>

          <h3>{t.s1_spouse}</h3>
          <label><input type="checkbox" name="treat_spouse" /> {t.treat_spouse}</label>
          <div className="grid">
            <label>{t.first}<input name="spouse_firstName" /></label>
            <label>{t.last}<input name="spouse_lastName" /></label>
            <label>{t.sin}<input name="spouse_sin" /></label>
            <label>{t.dob}<input type="date" name="spouse_dob" /></label>
            <label>{t.citizenship}<input name="spouse_citizenship" /></label>
          </div>
          <label>{t.spouse_net_if_not}<input name="spouse_net_income_if_not_treated" placeholder="ex. 25 000 $" /></label>

          {/* 2) État civil */}
          <hr />
          <h2>{t.s2}</h2>
          <div className="grid">
            <label>{t.state}
              <select name="marital_status" defaultValue="celib">
                <option value="celib">{t.marital_celib}</option>
                <option value="marie">{t.marital_marie}</option>
                <option value="conjoint">{t.marital_conjoint}</option>
                <option value="separe">{t.marital_separe}</option>
                <option value="divorce">{t.marital_divorce}</option>
                <option value="veuf">{t.marital_veuf}</option>
              </select>
            </label>
            <label><input type="checkbox" name="status_changed" /> {t.changed}</label>
          </div>
          <div className="grid">
            <label>{t.prev}<input name="status_prev" /></label>
            <label>{t.change_date}<input type="date" name="status_change_date" /></label>
          </div>

          {/* 3) Coordonnées */}
          <hr />
          <h2>{t.s3}</h2>

          <h3>{t.you_info}</h3>
          <div className="grid">
            <label>{t.phone_day}<input name="you_phone_day" /></label>
            <label>{t.phone_evening}<input name="you_phone_evening" /></label>
            <label>{t.phone_mobile}<input name="you_phone_mobile" /></label>
            <label>{t.email}<input type="email" name="you_email" /></label>
            <label>{t.address}<input name="you_address" /></label>
            <label>{t.apt}<input name="you_apt" /></label>
            <label>{t.city}<input name="you_city" /></label>
            <label>{t.province}<input name="you_province" defaultValue="QC" /></label>
            <label>{t.postal}<input name="you_postal" /></label>
          </div>

          <h3>{t.spouse_info}</h3>
          <label><input type="checkbox" name="spouse_same_address" defaultChecked /> {t.same_addr}</label>
          <div className="grid">
            <label>{t.email}<input type="email" name="spouse_email" /></label>
            <label>{t.phone_mobile}<input name="spouse_phone" /></label>
            <label>{t.address}<input name="spouse_address" /></label>
            <label>{t.apt}<input name="spouse_apt" /></label>
            <label>{t.city}<input name="spouse_city" /></label>
            <label>{t.province}<input name="spouse_province" defaultValue="QC" /></label>
            <label>{t.postal}<input name="spouse_postal" /></label>
          </div>

          {/* 4) Assurance médicaments */}
          <hr />
          <h2>{t.s4}</h2>
          {/* Ligne 1 */}
          <div className="grid">
            <label>{t.coverage}
              <select name="cov1_type" defaultValue="RAMQ">
                <option value="RAMQ">{t.cov_RAMQ}</option>
                <option value="PRIV">{t.cov_PRIV}</option>
                <option value="CONJ">{t.cov_CONJ}</option>
                <option value="AUTRE">{t.cov_AUTRE}</option>
              </select>
            </label>
            <label>{t.from}<input type="date" name="cov1_from" /></label>
            <label>{t.to}<input type="date" name="cov1_to" /></label>
            <label>{t.otherLabel}<input name="cov1_other" /></label>
          </div>
          {/* Ligne 2 (optionnelle) */}
          <div className="grid">
            <label>{t.coverage}
              <select name="cov2_type" defaultValue="">
                <option value=""></option>
                <option value="RAMQ">{t.cov_RAMQ}</option>
                <option value="PRIV">{t.cov_PRIV}</option>
                <option value="CONJ">{t.cov_CONJ}</option>
                <option value="AUTRE">{t.cov_AUTRE}</option>
              </select>
            </label>
            <label>{t.from}<input type="date" name="cov2_from" /></label>
            <label>{t.to}<input type="date" name="cov2_to" /></label>
            <label>{t.otherLabel}<input name="cov2_other" /></label>
          </div>

          {/* 5) Personnes à charge */}
          <hr />
          <h2>{t.s5}</h2>
          {/* Enfant 1 */}
          <div className="grid">
            <label>{t.child_sex}
              <select name="child1_sex" defaultValue="">
                <option value=""></option>
                <option value="M">{t.sex_M}</option>
                <option value="F">{t.sex_F}</option>
              </select>
            </label>
            <label>{t.child_first}<input name="child1_firstName" /></label>
            <label>{t.child_last}<input name="child1_lastName" /></label>
            <label>{t.child_dob}<input type="date" name="child1_dob" /></label>
            <label>{t.child_sin}<input name="child1_sin" /></label>
          </div>
          {/* Enfant 2 (optionnel) */}
          <div className="grid">
            <label>{t.child_sex}
              <select name="child2_sex" defaultValue="">
                <option value=""></option>
                <option value="M">{t.sex_M}</option>
                <option value="F">{t.sex_F}</option>
              </select>
            </label>
            <label>{t.child_first}<input name="child2_firstName" /></label>
            <label>{t.child_last}<input name="child2_lastName" /></label>
            <label>{t.child_dob}<input type="date" name="child2_dob" /></label>
            <label>{t.child_sin}<input name="child2_sin" /></label>
          </div>

          {/* 6) Questions */}
          <hr />
          <h2>{t.s6}</h2>
          <div className="grid">
            <label><input type="checkbox" name="lived_alone" /> {t.q1}</label>
            <label>{t.q2}<input name="people_at_home_3112" placeholder="ex. 2" /></label>
            <label><input type="checkbox" name="foreign_assets_over_100k" /> {t.q3}</label>
            <label><input type="checkbox" name="non_resident" /> {t.q4}</label>
            <label><input type="checkbox" name="first_home_purchase" /> {t.q5}</label>
            <label><input type="checkbox" name="sold_residence" /> {t.q6}</label>
            <label><input type="checkbox" name="call_back" /> {t.q7}</label>
          </div>

          {/* 7) Commentaires */}
          <hr />
          <h2>{t.s7}</h2>
          <textarea rows={5} name="comments" />

          {/* 8) Réception */}
          <hr />
          <h2>{t.s8}</h2>
          <label>
            <select name="delivery" defaultValue="espace">
              <option value="email">{t.delivery_email}</option>
              <option value="espace">{t.delivery_portal}</option>
            </select>
          </label>

          {/* Bouton */}
          <div className="cta-row">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t.sending : t.submit}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
