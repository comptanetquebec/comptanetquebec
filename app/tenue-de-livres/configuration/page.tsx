"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";

type TaxStatus =
  | "not_registered"
  | "gst_only"
  | "gst_qst";

type Frequency =
  | "monthly"
  | "quarterly"
  | "annual";

type Business = {
  id: string;
  business_name: string;
  tax_status: TaxStatus;
  filing_frequency: Frequency;
  fiscal_year_start_month: number;
  fiscal_year_start_day: number;
  tax_registration_date?: string | null;
};

export default function ConfigurationTenueLivresPage() {
  const [lang, setLang] = useState<Lang>("fr");

  const [userId, setUserId] = useState("");

  const [business, setBusiness] =
    useState<Business | null>(null);

  const [name, setName] = useState("");

  const [taxStatus, setTaxStatus] =
    useState<TaxStatus>("not_registered");

  const [frequency, setFrequency] =
    useState<Frequency>("annual");

  const [taxRegistrationDate, setTaxRegistrationDate] =
    useState("");

  const [startDay, setStartDay] =
    useState("1");

  const [startMonth, setStartMonth] =
    useState("1");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [taxActivationMode, setTaxActivationMode] =
    useState(false);

  const [companyLogo, setCompanyLogo] =
    useState<string | null>(null);

  const [logoError, setLogoError] =
    useState("");

  const [selectedYear, setSelectedYear] =
    useState(new Date().getFullYear());

  const copy = {
    fr: {
      brand: "ComptaNet Québec",

      back: "Retour à la tenue de livres",

      newTitle:
        "Configuration de votre entreprise",

      editTitle:
        "Profil de l’entreprise",

      newIntro:
        "Quelques renseignements suffisent pour préparer votre espace de tenue de livres.",

      editIntro:
        "Consultez ou modifiez les renseignements utilisés pour votre tenue de livres.",

      step1: "1",
      step1Title: "Votre entreprise",

      step1Desc:
        "Indiquez le nom qui doit apparaître dans votre dossier.",

      name:
        "Nom de l’entreprise ou du travailleur autonome",

      namePlaceholder:
        "Ex. Entreprise ABC ou Jean Tremblay",

      step2: "2",
      step2Title: "TPS / TVQ",

      step2Desc:
        "Indiquez votre situation actuelle concernant les taxes.",

      taxes: "Inscription aux taxes",

      none:
        "Non inscrit à la TPS/TVQ",

      gst:
        "TPS seulement",

      both:
        "TPS et TVQ",

      noTaxInfo:
        "Vous avez indiqué que vous n’êtes pas inscrit à la TPS/TVQ. Aucune fréquence de production n’est nécessaire.",

      registrationDate:
        "Date d’inscription à la TPS/TVQ",

      registrationDateHelp:
        "Indiquez la date officielle à partir de laquelle votre entreprise est inscrite.",

      activationTitle:
        "Activer la TPS/TVQ",

      activationIntro:
        "Confirmez votre inscription fiscale et votre fréquence de production avant d’activer le forfait TPS/TVQ.",

      activationSave:
        "Payer et activer le forfait TPS/TVQ",

      paymentRequired:
        "Le paiement Stripe doit être complété avant d’activer la TPS/TVQ.",

      paymentOpening:
        "Ouverture du paiement sécurisé Stripe…",

      registrationRequired:
        "Pour continuer, indiquez que votre entreprise est inscrite à la TPS ou à la TPS/TVQ.",

      registrationDateRequired:
        "Veuillez indiquer votre date officielle d’inscription aux taxes.",

      frequency:
        "Fréquence de production TPS/TVQ",

      monthly: "Mensuelle",
      quarterly: "Trimestrielle",
      annual: "Annuelle",

      step3: "3",
      step3Title: "Exercice financier",

      step3Desc:
        "Indiquez la date de début de votre exercice financier.",

      yearStart:
        "Début de l’exercice financier",

      day: "Jour",
      month: "Mois",

      month1: "Janvier",
      month2: "Février",
      month3: "Mars",
      month4: "Avril",
      month5: "Mai",
      month6: "Juin",
      month7: "Juillet",
      month8: "Août",
      month9: "Septembre",
      month10: "Octobre",
      month11: "Novembre",
      month12: "Décembre",

      standardYear:
        "Pour la plupart des travailleurs autonomes utilisant l’année civile, le début est le 1er janvier.",

      save:
        "Créer mon dossier",

      update:
        "Enregistrer les modifications",

      saving:
        "Enregistrement…",

      saved:
        "Profil enregistré.",

      updated:
        "Modifications enregistrées.",

      redirecting:
        "Votre dossier est prêt. Ouverture de votre tableau de bord…",

      loading:
        "Chargement de votre profil…",

      required:
        "Veuillez inscrire le nom de l’entreprise ou du travailleur autonome.",

      invalidDate:
        "Veuillez vérifier la date de début de l’exercice financier.",

      secure:
        "Vos renseignements sont enregistrés dans votre espace ComptaNet Québec.",

      existing:
        "Votre dossier est déjà configuré.",

      logoTitle: "Logo de l’entreprise",
      logoDesc:
        "Ajoutez votre logo pour personnaliser votre espace de tenue de livres. Cette étape est facultative.",
      logoAdd: "Ajouter un logo",
      logoChange: "Changer le logo",
      logoRemove: "Retirer le logo",
      logoHelp: "PNG, JPG ou WebP — maximum 1,5 Mo.",
      logoTooLarge: "Le logo ne doit pas dépasser 1,5 Mo.",
      logoInvalid: "Utilisez une image PNG, JPG ou WebP.",

      dashboard:
        "Retourner au tableau de bord",
    },

    en: {
      brand: "ComptaNet Québec",

      back: "Back to bookkeeping",

      newTitle:
        "Set up your business",

      editTitle:
        "Business profile",

      newIntro:
        "A few details are all we need to prepare your bookkeeping workspace.",

      editIntro:
        "Review or update the information used for your bookkeeping.",

      step1: "1",
      step1Title: "Your business",

      step1Desc:
        "Enter the name that should appear in your bookkeeping file.",

      name:
        "Business or self-employed name",

      namePlaceholder:
        "Ex. ABC Company or John Smith",

      step2: "2",
      step2Title: "GST / QST",

      step2Desc:
        "Tell us about your current tax registration status.",

      taxes: "Tax registration",

      none:
        "Not registered for GST/QST",

      gst:
        "GST only",

      both:
        "GST and QST",

      noTaxInfo:
        "You indicated that you are not registered for GST/QST. No filing frequency is required.",

      registrationDate:
        "GST/QST registration date",

      registrationDateHelp:
        "Enter the official date from which your business is registered.",

      activationTitle:
        "Activate GST/QST",

      activationIntro:
        "Confirm your tax registration and filing frequency before activating the GST/QST plan.",

      activationSave:
        "Pay and activate the GST/QST plan",

      paymentRequired:
        "Stripe payment must be completed before GST/QST is activated.",

      paymentOpening:
        "Opening secure Stripe payment…",

      registrationRequired:
        "To continue, indicate that your business is registered for GST or GST/QST.",

      registrationDateRequired:
        "Please enter your official tax registration date.",

      frequency:
        "GST/QST filing frequency",

      monthly: "Monthly",
      quarterly: "Quarterly",
      annual: "Annual",

      step3: "3",
      step3Title: "Fiscal year",

      step3Desc:
        "Enter the starting date of your fiscal year.",

      yearStart:
        "Fiscal year start",

      day: "Day",
      month: "Month",

      month1: "January",
      month2: "February",
      month3: "March",
      month4: "April",
      month5: "May",
      month6: "June",
      month7: "July",
      month8: "August",
      month9: "September",
      month10: "October",
      month11: "November",
      month12: "December",

      standardYear:
        "For most self-employed individuals using the calendar year, the starting date is January 1.",

      save:
        "Create my file",

      update:
        "Save changes",

      saving:
        "Saving…",

      saved:
        "Profile saved.",

      updated:
        "Changes saved.",

      redirecting:
        "Your file is ready. Opening your dashboard…",

      loading:
        "Loading your profile…",

      required:
        "Please enter the business or self-employed name.",

      invalidDate:
        "Please verify the fiscal year starting date.",

      secure:
        "Your information is saved in your ComptaNet Québec workspace.",

      existing:
        "Your file is already configured.",

      logoTitle: "Business logo",
      logoDesc:
        "Add your logo to personalize your bookkeeping workspace. This step is optional.",
      logoAdd: "Add a logo",
      logoChange: "Change logo",
      logoRemove: "Remove logo",
      logoHelp: "PNG, JPG or WebP — maximum 1.5 MB.",
      logoTooLarge: "The logo must not exceed 1.5 MB.",
      logoInvalid: "Use a PNG, JPG or WebP image.",

      dashboard:
        "Return to dashboard",
    },

    es: {
      brand: "ComptaNet Québec",

      back: "Volver a contabilidad",

      newTitle:
        "Configure su empresa",

      editTitle:
        "Perfil de la empresa",

      newIntro:
        "Solo necesitamos algunos datos para preparar su espacio de contabilidad.",

      editIntro:
        "Consulte o modifique la información utilizada para su contabilidad.",

      step1: "1",
      step1Title: "Su empresa",

      step1Desc:
        "Indique el nombre que debe aparecer en su expediente.",

      name:
        "Nombre de la empresa o trabajador autónomo",

      namePlaceholder:
        "Ej. Empresa ABC o Juan Pérez",

      step2: "2",
      step2Title: "GST / QST",

      step2Desc:
        "Indique su situación actual respecto a los impuestos.",

      taxes: "Registro de impuestos",

      none:
        "No registrado para GST/QST",

      gst:
        "Solo GST",

      both:
        "GST y QST",

      noTaxInfo:
        "Ha indicado que no está registrado para GST/QST. No se requiere una frecuencia de declaración.",

      registrationDate:
        "Fecha de registro GST/QST",

      registrationDateHelp:
        "Indique la fecha oficial desde la que su empresa está registrada.",

      activationTitle:
        "Activar GST/QST",

      activationIntro:
        "Confirme su registro fiscal y la frecuencia de declaración antes de activar el plan GST/QST.",

      activationSave:
        "Pagar y activar el plan GST/QST",

      paymentRequired:
        "El pago de Stripe debe completarse antes de activar GST/QST.",

      paymentOpening:
        "Abriendo el pago seguro de Stripe…",

      registrationRequired:
        "Para continuar, indique que su empresa está registrada para GST o GST/QST.",

      registrationDateRequired:
        "Indique la fecha oficial de registro de impuestos.",

      frequency:
        "Frecuencia de declaración GST/QST",

      monthly: "Mensual",
      quarterly: "Trimestral",
      annual: "Anual",

      step3: "3",
      step3Title: "Año fiscal",

      step3Desc:
        "Indique la fecha de inicio de su año fiscal.",

      yearStart:
        "Inicio del año fiscal",

      day: "Día",
      month: "Mes",

      month1: "Enero",
      month2: "Febrero",
      month3: "Marzo",
      month4: "Abril",
      month5: "Mayo",
      month6: "Junio",
      month7: "Julio",
      month8: "Agosto",
      month9: "Septiembre",
      month10: "Octubre",
      month11: "Noviembre",
      month12: "Diciembre",

      standardYear:
        "Para la mayoría de los trabajadores autónomos que utilizan el año calendario, la fecha de inicio es el 1 de enero.",

      save:
        "Crear mi expediente",

      update:
        "Guardar cambios",

      saving:
        "Guardando…",

      saved:
        "Perfil guardado.",

      updated:
        "Cambios guardados.",

      redirecting:
        "Su expediente está listo. Abriendo su panel…",

      loading:
        "Cargando su perfil…",

      required:
        "Ingrese el nombre de la empresa o trabajador autónomo.",

      invalidDate:
        "Verifique la fecha de inicio del año fiscal.",

      secure:
        "Su información se guarda en su espacio ComptaNet Québec.",

      existing:
        "Su expediente ya está configurado.",

      logoTitle: "Logo de la empresa",
      logoDesc:
        "Añada su logo para personalizar su espacio de contabilidad. Este paso es opcional.",
      logoAdd: "Añadir un logo",
      logoChange: "Cambiar logo",
      logoRemove: "Eliminar logo",
      logoHelp: "PNG, JPG o WebP — máximo 1,5 MB.",
      logoTooLarge: "El logo no debe superar 1,5 MB.",
      logoInvalid: "Utilice una imagen PNG, JPG o WebP.",

      dashboard:
        "Volver al panel",
    },
  }[lang];

  useEffect(() => {
    const queryLang =
      new URLSearchParams(
        window.location.search
      ).get("lang");

    const selected: Lang =
      queryLang === "en" ||
      queryLang === "es"
        ? queryLang
        : "fr";

    setLang(selected);

    try {
      setCompanyLogo(localStorage.getItem("comptanet_company_logo"));
    } catch {
      setCompanyLogo(null);
    }

    const params =
      new URLSearchParams(window.location.search);

    const activateTaxes =
      params.get("activateTaxes") === "1";

    const yearValue = Number(params.get("year"));
    const initialYear =
      Number.isInteger(yearValue) &&
      yearValue >= 2020 &&
      yearValue <= new Date().getFullYear() + 5
        ? yearValue
        : new Date().getFullYear();

    setTaxActivationMode(activateTaxes);
    setSelectedYear(initialYear);

    void load(selected, activateTaxes, initialYear);
  }, []);

  async function load(
    selected: Lang,
    activateTaxes: boolean,
    year: number
  ) {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const {
        data: auth,
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !auth.user) {
        const next = encodeURIComponent(
          `/tenue-de-livres/configuration?lang=${selected}&year=${year}${activateTaxes ? "&activateTaxes=1" : ""}`
        );

        window.location.replace(
          `/espace-client?lang=${selected}&next=${next}`
        );

        return;
      }

      setUserId(auth.user.id);

      const {
        data,
        error: businessError,
      } = await supabase
        .from("bookkeeping_businesses")
        .select(
          "id, business_name, tax_status, filing_frequency, fiscal_year_start_month, fiscal_year_start_day, tax_registration_date"
        )
        .eq("owner_id", auth.user.id)
        .order("created_at", {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

      if (businessError) {
        throw new Error(
          businessError.message
        );
      }

      if (data) {
        const current =
          data as Business;

        setBusiness(current);

        setName(
          current.business_name ?? ""
        );

        const currentTaxStatus =
          current.tax_status ??
            "not_registered";

        setTaxStatus(
          activateTaxes &&
          currentTaxStatus === "not_registered"
            ? "gst_qst"
            : currentTaxStatus
        );

        setFrequency(
          current.filing_frequency ??
            "annual"
        );

        setTaxRegistrationDate(
          current.tax_registration_date ?? ""
        );

        setStartDay(
          String(
            current.fiscal_year_start_day ??
              1
          )
        );

        setStartMonth(
          String(
            current.fiscal_year_start_month ??
              1
          )
        );
      } else {
        const metadataName =
          auth.user.user_metadata
            ?.business_name ||
          auth.user.user_metadata
            ?.full_name ||
          "";

        setName(
          String(metadataName)
        );
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  function chooseCompanyLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setLogoError("");

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setLogoError(copy.logoInvalid);
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setLogoError(copy.logoTooLarge);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;

      if (!result) return;

      setCompanyLogo(result);

      try {
        localStorage.setItem("comptanet_company_logo", result);
      } catch {
        // Le logo reste affiché pour la session même si le navigateur
        // refuse le stockage local.
      }
    };

    reader.readAsDataURL(file);
  }

  function removeCompanyLogo() {
    setCompanyLogo(null);
    setLogoError("");

    try {
      localStorage.removeItem("comptanet_company_logo");
    } catch {
      // Rien à faire.
    }
  }

  function changeLang(
    nextLang: Lang
  ) {
    setLang(nextLang);

    const url = new URL(
      window.location.href
    );

    url.searchParams.set(
      "lang",
      nextLang
    );

    window.history.replaceState(
      {},
      "",
      url.toString()
    );
  }

  function isValidFiscalDate() {
    const day = Number(startDay);
    const month = Number(startMonth);

    if (
      !Number.isInteger(day) ||
      !Number.isInteger(month)
    ) {
      return false;
    }

    if (
      month < 1 ||
      month > 12 ||
      day < 1
    ) {
      return false;
    }

    const daysInMonth =
      new Date(
        2024,
        month,
        0
      ).getDate();

    return day <= daysInMonth;
  }

  async function save(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !userId ||
      saving
    ) {
      return;
    }

    if (!name.trim()) {
      setError(copy.required);
      return;
    }

    if (!isValidFiscalDate()) {
      setError(copy.invalidDate);
      return;
    }

    if (
      taxActivationMode &&
      taxStatus === "not_registered"
    ) {
      setError(copy.registrationRequired);
      return;
    }

    if (
      taxStatus !== "not_registered" &&
      !taxRegistrationDate
    ) {
      setError(copy.registrationDateRequired);
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const wasExisting =
        Boolean(business);

      const filingFrequency:
        Frequency =
        taxStatus === "not_registered"
          ? "annual"
          : frequency;

      const values = {
        business_name:
          name.trim(),

        tax_status:
          taxStatus,

        filing_frequency:
          filingFrequency,

        tax_registration_date:
          taxStatus === "not_registered"
            ? null
            : taxRegistrationDate,

        fiscal_year_start_day:
          Number(startDay),

        fiscal_year_start_month:
          Number(startMonth),
      };

      /*
       * MODE ACTIVATION TPS/TVQ
       *
       * IMPORTANT :
       * on fait l'upgrade Stripe AVANT d'enregistrer
       * le profil comme inscrit à la TPS/TVQ.
       *
       * Donc aucun accès TPS/TVQ n'est accordé si
       * le paiement n'est pas complété.
       */
      if (taxActivationMode) {
        if (!business) {
          throw new Error(
            "Le dossier de tenue de livres doit exister avant l’activation du forfait TPS/TVQ."
          );
        }

        setMessage(copy.paymentOpening);

        const response = await fetch(
          "/api/tenue-de-livres/change-plan",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              plan: "tax",
            }),
          }
        );

        const result =
          await response.json().catch(() => null);

        if (!response.ok || !result?.ok) {
          throw new Error(
            result?.error ||
              "Impossible d’activer le forfait TPS/TVQ."
          );
        }

        /*
         * Si Stripe exige encore un paiement/action,
         * on ouvre la facture Stripe et on n'enregistre
         * PAS encore le profil TPS/TVQ.
         */
        if (result.action === "payment_required") {
          if (result.hostedInvoiceUrl) {
            window.location.assign(
              result.hostedInvoiceUrl
            );
            return;
          }

          throw new Error(
            copy.paymentRequired
          );
        }

        /*
         * "upgraded" = paiement accepté.
         * "unchanged" = le forfait TPS/TVQ était déjà actif.
         *
         * Seulement maintenant on enregistre les
         * informations fiscales.
         */
        if (
          result.action !== "upgraded" &&
          result.action !== "unchanged"
        ) {
          throw new Error(
            copy.paymentRequired
          );
        }

        const {
          data,
          error: updateError,
        } = await supabase
          .from(
            "bookkeeping_businesses"
          )
          .update(values)
          .eq(
            "id",
            business.id
          )
          .eq(
            "owner_id",
            userId
          )
          .select(
            "id, business_name, tax_status, filing_frequency, fiscal_year_start_month, fiscal_year_start_day, tax_registration_date"
          )
          .single();

        if (updateError) {
          throw new Error(
            updateError.message
          );
        }

        setBusiness(
          data as Business
        );

        window.location.replace(
          `/tenue-de-livres/taxes?lang=${lang}&year=${selectedYear}`
        );
        return;
      }

      /*
       * CONFIGURATION NORMALE
       */
      if (business) {
        const {
          data,
          error: updateError,
        } = await supabase
          .from(
            "bookkeeping_businesses"
          )
          .update(values)
          .eq(
            "id",
            business.id
          )
          .eq(
            "owner_id",
            userId
          )
          .select(
            "id, business_name, tax_status, filing_frequency, fiscal_year_start_month, fiscal_year_start_day, tax_registration_date"
          )
          .single();

        if (updateError) {
          throw new Error(
            updateError.message
          );
        }

        setBusiness(
          data as Business
        );

        setMessage(
          copy.updated
        );
      } else {
        const {
          data,
          error: insertError,
        } = await supabase
          .from(
            "bookkeeping_businesses"
          )
          .insert({
            ...values,
            owner_id:
              userId,
          })
          .select(
            "id, business_name, tax_status, filing_frequency, fiscal_year_start_month, fiscal_year_start_day, tax_registration_date"
          )
          .single();

        if (insertError) {
          throw new Error(
            insertError.message
          );
        }

        setBusiness(
          data as Business
        );

        setMessage(
          copy.redirecting
        );
      }

      if (!wasExisting) {
        window.setTimeout(() => {
          window.location.replace(
            `/tenue-de-livres?lang=${lang}&year=${selectedYear}`
          );
        }, 700);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    boxSizing:
      "border-box" as const,
    border:
      "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "12px 13px",
    fontSize: 15,
    background: "#ffffff",
    color: "#0f172a",
    outline: "none",
  };

  const labelStyle = {
    display: "grid",
    gap: 8,
    fontWeight: 800,
    color: "#334155",
    fontSize: 14,
  } as const;

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "#f5f9ff",
          fontFamily:
            "Arial, Helvetica, sans-serif",
          padding: 20,
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: 460,
            background: "#ffffff",
            border:
              "1px solid #dbe5f1",
            borderRadius: 18,
            padding: 30,
            textAlign: "center",
            boxShadow:
              "0 8px 24px rgba(15,23,42,.05)",
          }}
        >
          <div
            style={{
              fontSize: 34,
              marginBottom: 12,
            }}
          >
            💼
          </div>

          <strong>
            {copy.loading}
          </strong>
        </section>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f7fbff 0%, #edf6ff 100%)",
        color: "#0f172a",
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: "#ffffff",
          borderBottom:
            "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            padding:
              "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Link
            href={
              taxActivationMode
                ? `/tenue-de-livres/taxes?lang=${lang}&year=${selectedYear}`
                : `/tenue-de-livres?lang=${lang}&year=${selectedYear}`
            }
            style={{
              color: "#0f172a",
              fontWeight: 900,
              fontSize: 19,
              textDecoration:
                "none",
            }}
          >
            ComptaNet Québec
          </Link>

          <div
            style={{
              display: "flex",
              gap: 6,
            }}
          >
            {(
              [
                "fr",
                "en",
                "es",
              ] as const
            ).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  changeLang(
                    item
                  )
                }
                style={{
                  border:
                    lang === item
                      ? "1px solid #004aad"
                      : "1px solid #dbe3ef",

                  background:
                    lang === item
                      ? "#004aad"
                      : "#ffffff",

                  color:
                    lang === item
                      ? "#ffffff"
                      : "#334155",

                  borderRadius: 8,
                  padding:
                    "7px 10px",
                  fontWeight: 800,
                  cursor:
                    "pointer",
                }}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding:
            "32px 20px 70px",
        }}
      >
        {/* RETOUR */}
        <Link
          href={
            taxActivationMode
              ? `/tenue-de-livres/taxes?lang=${lang}&year=${selectedYear}`
              : `/tenue-de-livres?lang=${lang}&year=${selectedYear}`
          }
          style={{
            display:
              "inline-block",
            color: "#004aad",
            fontWeight: 800,
            textDecoration:
              "none",
            marginBottom: 20,
          }}
        >
          ← {copy.back}
        </Link>

        {/* INTRODUCTION */}
        <section
          style={{
            background: "#ffffff",
            border:
              "1px solid #dbe5f1",
            borderRadius: 20,
            padding: 28,
            marginBottom: 18,
            boxShadow:
              "0 8px 24px rgba(15,23,42,.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background:
                  "#eef6ff",
                display: "grid",
                placeItems:
                  "center",
                fontSize: 24,
              }}
            >
              💼
            </div>

            <div>
              <div
                style={{
                  color:
                    "#004aad",
                  fontWeight: 900,
                  fontSize: 14,
                  marginBottom: 3,
                }}
              >
                {copy.brand}
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize:
                    "clamp(27px, 5vw, 36px)",
                }}
              >
                {taxActivationMode
                  ? copy.activationTitle
                  : business
                    ? copy.editTitle
                    : copy.newTitle}
              </h1>
            </div>
          </div>

          <p
            style={{
              color: "#64748b",
              lineHeight: 1.6,
              margin:
                "14px 0 0",
              maxWidth: 680,
            }}
          >
            {taxActivationMode
              ? copy.activationIntro
              : business
                ? copy.editIntro
                : copy.newIntro}
          </p>
        </section>

        {/* MESSAGES */}
        {error && (
          <div
            style={{
              background:
                "#fef2f2",
              border:
                "1px solid #fecaca",
              color:
                "#991b1b",
              padding: 14,
              borderRadius: 12,
              marginBottom: 18,
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              background:
                "#ecfdf5",
              border:
                "1px solid #bbf7d0",
              color:
                "#166534",
              padding: 14,
              borderRadius: 12,
              marginBottom: 18,
              fontWeight: 700,
            }}
          >
            ✓ {message}
          </div>
        )}

        <form
          onSubmit={save}
          style={{
            display: "grid",
            gap: 18,
          }}
        >
          {/* ÉTAPE 1 */}
          <section
            style={{
              background:
                "#ffffff",
              border:
                "1px solid #dbe5f1",
              borderRadius: 18,
              padding: 24,
              boxShadow:
                "0 6px 20px rgba(15,23,42,.04)",
            }}
          >
            <StepHeader
              number={
                copy.step1
              }
              title={
                copy.step1Title
              }
              description={
                copy.step1Desc
              }
            />

            <label
              style={
                labelStyle
              }
            >
              {copy.name}

              <input
                required
                maxLength={
                  120
                }
                value={name}
                placeholder={
                  copy.namePlaceholder
                }
                onChange={(
                  event
                ) =>
                  setName(
                    event
                      .target
                      .value
                  )
                }
                style={
                  inputStyle
                }
              />
            </label>
          </section>

          {/* LOGO DE L’ENTREPRISE — FACULTATIF */}
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #dbe5f1",
              borderRadius: 18,
              padding: 24,
              boxShadow: "0 6px 20px rgba(15,23,42,.04)",
            }}
          >
            <StepHeader
              number="✓"
              title={copy.logoTitle}
              description={copy.logoDesc}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 18,
                  border: "1px solid #dbe5f1",
                  background: "#f8fafc",
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                  flex: "0 0 96px",
                }}
              >
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt={copy.logoTitle}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      padding: 8,
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: "50%",
                      background: "#1264d5",
                      color: "#ffffff",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 900,
                      fontSize: 17,
                    }}
                  >
                    CQ
                  </span>
                )}
              </div>

              <div style={{ flex: "1 1 300px" }}>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 10,
                      padding: "11px 16px",
                      background: "#004aad",
                      color: "#ffffff",
                      fontWeight: 900,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    {companyLogo ? copy.logoChange : copy.logoAdd}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={chooseCompanyLogo}
                      style={{ display: "none" }}
                    />
                  </label>

                  {companyLogo && (
                    <button
                      type="button"
                      onClick={removeCompanyLogo}
                      style={{
                        border: "1px solid #fecaca",
                        borderRadius: 10,
                        padding: "10px 15px",
                        background: "#ffffff",
                        color: "#b91c1c",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {copy.logoRemove}
                    </button>
                  )}
                </div>

                <p
                  style={{
                    margin: "10px 0 0",
                    color: "#64748b",
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                >
                  {copy.logoHelp}
                </p>

                {logoError && (
                  <p
                    style={{
                      margin: "9px 0 0",
                      color: "#b91c1c",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {logoError}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ÉTAPE 2 */}
          <section
            style={{
              background:
                "#ffffff",
              border:
                "1px solid #dbe5f1",
              borderRadius: 18,
              padding: 24,
              boxShadow:
                "0 6px 20px rgba(15,23,42,.04)",
            }}
          >
            <StepHeader
              number={
                copy.step2
              }
              title={
                copy.step2Title
              }
              description={
                copy.step2Desc
              }
            />

            <label
              style={
                labelStyle
              }
            >
              {copy.taxes}

              <select
                value={
                  taxStatus
                }
                onChange={(
                  event
                ) =>
                  setTaxStatus(
                    event
                      .target
                      .value as TaxStatus
                  )
                }
                style={
                  inputStyle
                }
              >
                {!taxActivationMode && (
                  <option value="not_registered">
                    {copy.none}
                  </option>
                )}

                <option value="gst_only">
                  {copy.gst}
                </option>

                <option value="gst_qst">
                  {copy.both}
                </option>
              </select>
            </label>

            {taxStatus ===
            "not_registered" ? (
              <div
                style={{
                  marginTop: 14,
                  background:
                    "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: 13,
                  color:
                    "#64748b",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                ℹ️{" "}
                {
                  copy.noTaxInfo
                }
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 16,
                  marginTop: 16,
                }}
              >
                <label style={labelStyle}>
                  {copy.registrationDate}

                  <input
                    type="date"
                    required
                    value={taxRegistrationDate}
                    onChange={(event) =>
                      setTaxRegistrationDate(event.target.value)
                    }
                    style={inputStyle}
                  />

                  <span
                    style={{
                      color: "#64748b",
                      fontSize: 13,
                      fontWeight: 500,
                      lineHeight: 1.45,
                    }}
                  >
                    {copy.registrationDateHelp}
                  </span>
                </label>

              <label
                style={{
                  ...labelStyle,
                }}
              >
                {
                  copy.frequency
                }

                <select
                  value={
                    frequency
                  }
                  onChange={(
                    event
                  ) =>
                    setFrequency(
                      event
                        .target
                        .value as Frequency
                    )
                  }
                  style={
                    inputStyle
                  }
                >
                  <option value="monthly">
                    {
                      copy.monthly
                    }
                  </option>

                  <option value="quarterly">
                    {
                      copy.quarterly
                    }
                  </option>

                  <option value="annual">
                    {
                      copy.annual
                    }
                  </option>
                </select>
              </label>
              </div>
            )}
          </section>

          {/* ÉTAPE 3 */}
          <section
            style={{
              background:
                "#ffffff",
              border:
                "1px solid #dbe5f1",
              borderRadius: 18,
              padding: 24,
              boxShadow:
                "0 6px 20px rgba(15,23,42,.04)",
            }}
          >
            <StepHeader
              number={
                copy.step3
              }
              title={
                copy.step3Title
              }
              description={
                copy.step3Desc
              }
            />

            <fieldset
              style={{
                border: 0,
                padding: 0,
                margin: 0,
              }}
            >
              <legend
                style={{
                  fontWeight: 900,
                  marginBottom: 12,
                  color:
                    "#334155",
                }}
              >
                {
                  copy.yearStart
                }
              </legend>

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "minmax(100px, 1fr) minmax(180px, 2fr)",
                  gap: 12,
                }}
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  {copy.day}

                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={
                      startDay
                    }
                    onChange={(
                      event
                    ) =>
                      setStartDay(
                        event
                          .target
                          .value
                      )
                    }
                    style={
                      inputStyle
                    }
                  />
                </label>

                <label
                  style={
                    labelStyle
                  }
                >
                  {copy.month}

                  <select
                    value={
                      startMonth
                    }
                    onChange={(
                      event
                    ) =>
                      setStartMonth(
                        event
                          .target
                          .value
                      )
                    }
                    style={
                      inputStyle
                    }
                  >
                    {[
                      copy.month1,
                      copy.month2,
                      copy.month3,
                      copy.month4,
                      copy.month5,
                      copy.month6,
                      copy.month7,
                      copy.month8,
                      copy.month9,
                      copy.month10,
                      copy.month11,
                      copy.month12,
                    ].map(
                      (
                        month,
                        index
                      ) => (
                        <option
                          key={
                            index +
                            1
                          }
                          value={
                            index +
                            1
                          }
                        >
                          {
                            month
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>
            </fieldset>

            <div
              style={{
                marginTop: 14,
                background:
                  "#eff6ff",
                border:
                  "1px solid #bfdbfe",
                borderRadius: 10,
                padding: 13,
                color:
                  "#1e3a8a",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              💡{" "}
              {
                copy.standardYear
              }
            </div>
          </section>

          {/* ENREGISTRER */}
          <section
            style={{
              background:
                "#ffffff",
              border:
                "1px solid #dbe5f1",
              borderRadius: 18,
              padding: 24,
              boxShadow:
                "0 6px 20px rgba(15,23,42,.04)",
            }}
          >
            <button
              disabled={
                saving
              }
              type="submit"
              style={{
                width: "100%",
                border: 0,
                borderRadius: 11,
                padding:
                  "14px 20px",
                background:
                  "#004aad",
                color:
                  "#ffffff",
                fontWeight: 900,
                cursor:
                  saving
                    ? "default"
                    : "pointer",
                opacity:
                  saving
                    ? 0.65
                    : 1,
                fontSize: 16,
              }}
            >
              {saving
                ? copy.saving
                : taxActivationMode
                  ? copy.activationSave
                  : business
                    ? copy.update
                    : copy.save}
            </button>

            <div
              style={{
                marginTop: 13,
                color:
                  "#64748b",
                textAlign:
                  "center",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              🔒 {copy.secure}
            </div>

            {business && (
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 18,
                  borderTop:
                    "1px solid #e5e7eb",
                  textAlign:
                    "center",
                }}
              >
                <Link
                  href={`/tenue-de-livres?lang=${lang}&year=${selectedYear}`}
                  style={{
                    color:
                      "#004aad",
                    fontWeight: 900,
                    textDecoration:
                      "none",
                  }}
                >
                  ←{" "}
                  {
                    copy.dashboard
                  }
                </Link>
              </div>
            )}
          </section>
        </form>
      </div>
    </main>
  );
}

function StepHeader({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 13,
        alignItems:
          "flex-start",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          flex:
            "0 0 34px",
          borderRadius:
            "50%",
          background:
            "#004aad",
          color: "#ffffff",
          display: "grid",
          placeItems:
            "center",
          fontWeight: 900,
        }}
      >
        {number}
      </div>

      <div>
        <h2
          style={{
            margin:
              "1px 0 5px",
            fontSize: 19,
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin: 0,
            color:
              "#64748b",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
