"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";
type FilingFrequency = "monthly" | "quarterly" | "annual";
type Plan = "essential" | "tax";

type SubscriptionInfo = {
  plan: Plan;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

type Business = {
  id: string;
  business_name: string;
  tax_status: string | null;
  filing_frequency: string | null;
  fiscal_year_start_day: number | null;
  fiscal_year_start_month: number | null;
};

type Transaction = {
  id: string;
  transaction_date: string;
  entry_type: string;
  source: string | null;
  description: string | null;
  subtotal: number | string | null;
  gst: number | string | null;
  qst: number | string | null;
  total: number | string | null;
};

type Period = {
  key: string;
  label: string;
  start: string;
  end: string;
};

type Totals = {
  salesBeforeTax: number;
  purchasesBeforeTax: number;
  gstCollected: number;
  qstCollected: number;
  gstPaid: number;
  qstPaid: number;
};

const MONTHS = {
  fr: [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ],
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
  es: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ],
} as const;

function safeNumber(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function isoDate(year: number, monthIndex: number, day: number) {
  const d = new Date(year, monthIndex, day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function lastDayOfMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function normalizeFrequency(value: string | null): FilingFrequency {
  if (value === "monthly" || value === "quarterly" || value === "annual") {
    return value;
  }
  return "annual";
}

function isRegistered(value: string | null) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return (
    normalized === "registered" ||
    normalized === "registrant" ||
    normalized === "inscrit" ||
    normalized === "gst_qst" ||
    normalized === "gst-qst"
  );
}

export default function TaxesPage() {
  const currentYear = new Date().getFullYear();

  const [lang, setLang] = useState<Lang>("fr");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedPeriodKey, setSelectedPeriodKey] = useState("");
  const [initialPeriodKey, setInitialPeriodKey] = useState("");

  const [business, setBusiness] = useState<Business | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [error, setError] = useState("");
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [changingPlan, setChangingPlan] = useState(false);
  const [planMessage, setPlanMessage] = useState("");

  const text = {
    fr: {
      title: "TPS / TVQ",
      subtitle:
        "Suivez automatiquement les taxes perçues sur vos revenus et les taxes payées sur vos dépenses.",
      heroAdTitle: "Simplifiez votre TPS/TVQ",
      heroAdText:
        "Suivez vos taxes perçues et payées, vos périodes et vos remises au même endroit.",
      back: "Retour à la tenue de livres",
      year: "Année",
      period: "Période",
      frequency: "Fréquence",
      monthly: "Mensuelle",
      quarterly: "Trimestrielle",
      annual: "Annuelle",
      registered: "Inscrit à la TPS/TVQ",
      notRegistered: "Non inscrit à la TPS/TVQ",
      notRegisteredTitle: "Entreprise non inscrite à la TPS/TVQ",
      notRegisteredText:
        "Aucune remise de TPS/TVQ n’est calculée pour ce profil. Les taxes inscrites dans les transactions demeurent visibles dans la tenue de livres.",
      collected: "Taxes facturées aux clients",
      paid: "Taxes payées sur vos dépenses",
      gstCollected: "TPS facturée à vos clients",
      qstCollected: "TVQ facturée à vos clients",
      gstPaid: "TPS payée sur vos dépenses",
      qstPaid: "TVQ payée sur vos dépenses",
      netGst: "TPS à remettre",
      netQst: "TVQ à remettre",
      balance: "Montant estimé à remettre",
      toRemit: "À remettre",
      refund: "Crédit / remboursement estimé",
      sales: "Ventes avant taxes",
      purchases: "Dépenses avant taxes",
      detail: "Détail des transactions",
      date: "Date",
      type: "Type",
      source: "Source",
      beforeTax: "Avant taxes",
      gst: "TPS",
      qst: "TVQ",
      total: "Total",
      income: "Revenu",
      expense: "Dépense",
      noTransactions: "Aucune transaction confirmée pour cette période.",
      loading: "Chargement de la TPS/TVQ…",
      error: "Impossible de charger la TPS/TVQ.",
      profile: "Profil fiscal",
      plan: "Forfait",
      essentialPlan: "Essentiel",
      taxPlan: "TPS/TVQ",
      upgradeTitle: "Passez au forfait TPS/TVQ",
      upgradeText:
        "Activez le forfait TPS/TVQ lorsque votre entreprise est inscrite à la TPS/TVQ.",
      upgradeButton: "Passer au forfait TPS/TVQ",
      downgradeButton: "Passer au forfait Essentiel",
      downgradeConfirm:
        "Votre forfait Taxes restera actif jusqu’à la fin de la période déjà payée. Voulez-vous programmer le passage au forfait Essentiel?",
      upgradeConfirm:
        "Le passage au forfait TPS/TVQ sera effectué maintenant. Stripe calculera le prorata applicable. Continuer?",
      planChanging: "Modification du forfait…",
      upgradeSuccess: "Votre forfait TPS/TVQ est maintenant actif.",
      downgradeSuccess: "Le passage au forfait Essentiel est programmé pour le",
      planError: "Impossible de modifier le forfait.",
      calculationNote:
        "Calcul de suivi basé sur les transactions confirmées enregistrées dans ComptaNet Québec.",
      eligibilityNote:
        "Les taxes payées affichées proviennent des montants saisis dans les dépenses. L’admissibilité réelle aux CTI/RTI peut dépendre de la nature de la dépense et de votre situation.",
      all: "Toute l’année",
      quarter: "Trimestre",
    },
    en: {
      title: "GST / QST",
      subtitle:
        "Automatically track taxes collected on income and taxes paid on expenses.",
      heroAdTitle: "Simplify your GST/QST",
      heroAdText:
        "Track taxes collected and paid, filing periods and remittances in one place.",
      back: "Back to bookkeeping",
      year: "Year",
      period: "Period",
      frequency: "Frequency",
      monthly: "Monthly",
      quarterly: "Quarterly",
      annual: "Annual",
      registered: "Registered for GST/QST",
      notRegistered: "Not registered for GST/QST",
      notRegisteredTitle: "Business not registered for GST/QST",
      notRegisteredText:
        "No GST/QST remittance is calculated for this profile. Taxes recorded in transactions remain visible in your bookkeeping.",
      collected: "Taxes charged to your customers",
      paid: "Taxes paid on your expenses",
      gstCollected: "GST charged to your customers",
      qstCollected: "QST charged to your customers",
      gstPaid: "GST paid on your expenses",
      qstPaid: "QST paid on your expenses",
      netGst: "GST to remit",
      netQst: "QST to remit",
      balance: "Estimated amount to remit",
      toRemit: "To remit",
      refund: "Estimated credit / refund",
      sales: "Sales before tax",
      purchases: "Expenses before tax",
      detail: "Transaction details",
      date: "Date",
      type: "Type",
      source: "Source",
      beforeTax: "Before tax",
      gst: "GST",
      qst: "QST",
      total: "Total",
      income: "Income",
      expense: "Expense",
      noTransactions: "No confirmed transactions for this period.",
      loading: "Loading GST/QST…",
      error: "Unable to load GST/QST.",
      profile: "Tax profile",
      plan: "Plan",
      essentialPlan: "Essential",
      taxPlan: "GST/QST",
      upgradeTitle: "Switch to the GST/QST plan",
      upgradeText:
        "Activate the GST/QST plan when your business is registered for GST/QST.",
      upgradeButton: "Switch to GST/QST plan",
      downgradeButton: "Switch to Essential plan",
      downgradeConfirm:
        "Your Tax plan will remain active until the end of the period already paid. Schedule the switch to Essential?",
      upgradeConfirm:
        "The GST/QST plan upgrade will take effect now. Stripe will calculate the applicable proration. Continue?",
      planChanging: "Changing plan…",
      upgradeSuccess: "Your GST/QST plan is now active.",
      downgradeSuccess: "The switch to Essential is scheduled for",
      planError: "Unable to change plan.",
      calculationNote:
        "Tracking calculation based on confirmed transactions recorded in ComptaNet Québec.",
      eligibilityNote:
        "Taxes paid shown here come from amounts entered on expenses. Actual ITC/ITR eligibility can depend on the nature of the expense and your situation.",
      all: "Full year",
      quarter: "Quarter",
    },
    es: {
      title: "GST / QST",
      subtitle:
        "Controle automáticamente los impuestos cobrados sobre ingresos y los impuestos pagados sobre gastos.",
      heroAdTitle: "Simplifique su GST/QST",
      heroAdText:
        "Controle los impuestos cobrados y pagados, los períodos y las remesas en un solo lugar.",
      back: "Volver a contabilidad",
      year: "Año",
      period: "Período",
      frequency: "Frecuencia",
      monthly: "Mensual",
      quarterly: "Trimestral",
      annual: "Anual",
      registered: "Registrado para GST/QST",
      notRegistered: "No registrado para GST/QST",
      notRegisteredTitle: "Empresa no registrada para GST/QST",
      notRegisteredText:
        "No se calcula una remesa de GST/QST para este perfil. Los impuestos registrados en las transacciones siguen visibles en la contabilidad.",
      collected: "Impuestos cobrados a sus clientes",
      paid: "Impuestos pagados en sus gastos",
      gstCollected: "GST cobrado a sus clientes",
      qstCollected: "QST cobrado a sus clientes",
      gstPaid: "GST pagado en sus gastos",
      qstPaid: "QST pagado en sus gastos",
      netGst: "GST a remitir",
      netQst: "QST a remitir",
      balance: "Importe estimado a remitir",
      toRemit: "A remitir",
      refund: "Crédito / reembolso estimado",
      sales: "Ventas antes de impuestos",
      purchases: "Gastos antes de impuestos",
      detail: "Detalle de transacciones",
      date: "Fecha",
      type: "Tipo",
      source: "Fuente",
      beforeTax: "Antes de impuestos",
      gst: "GST",
      qst: "QST",
      total: "Total",
      income: "Ingreso",
      expense: "Gasto",
      noTransactions: "No hay transacciones confirmadas para este período.",
      loading: "Cargando GST/QST…",
      error: "No se puede cargar GST/QST.",
      profile: "Perfil fiscal",
      plan: "Plan",
      essentialPlan: "Esencial",
      taxPlan: "GST/QST",
      upgradeTitle: "Cambiar al plan GST/QST",
      upgradeText:
        "Active el plan GST/QST cuando su empresa esté registrada para GST/QST.",
      upgradeButton: "Cambiar al plan GST/QST",
      downgradeButton: "Cambiar al plan Esencial",
      downgradeConfirm:
        "Su plan Impuestos seguirá activo hasta el final del período ya pagado. ¿Programar el cambio al plan Esencial?",
      upgradeConfirm:
        "El cambio al plan GST/QST se realizará ahora. Stripe calculará el prorrateo aplicable. ¿Continuar?",
      planChanging: "Modificando el plan…",
      upgradeSuccess: "Su plan GST/QST ya está activo.",
      downgradeSuccess: "El cambio al plan Esencial está programado para el",
      planError: "No se puede modificar el plan.",
      calculationNote:
        "Cálculo de seguimiento basado en transacciones confirmadas registradas en ComptaNet Québec.",
      eligibilityNote:
        "Los impuestos pagados mostrados provienen de los importes ingresados en los gastos. La elegibilidad real para créditos puede depender del tipo de gasto y de su situación.",
      all: "Todo el año",
      quarter: "Trimestre",
    },
  }[lang];

  const frequency = normalizeFrequency(business?.filing_frequency ?? null);
  const registered = isRegistered(business?.tax_status ?? null);
  const taxPlanActive = subscription?.plan === "tax";

  const availableYears = useMemo(
    () =>
      Array.from(
        { length: currentYear - 2020 + 6 },
        (_, index) => 2020 + index
      ).reverse(),
    [currentYear]
  );

  const periods = useMemo<Period[]>(() => {
    if (frequency === "monthly") {
      return MONTHS[lang].map((month, index) => ({
        key: `m-${index + 1}`,
        label: `${month} ${selectedYear}`,
        start: isoDate(selectedYear, index, 1),
        end: isoDate(
          selectedYear,
          index,
          lastDayOfMonth(selectedYear, index)
        ),
      }));
    }

    if (frequency === "quarterly") {
      return [0, 1, 2, 3].map((quarter) => {
        const startMonth = quarter * 3;
        const endMonth = startMonth + 2;

        return {
          key: `q-${quarter + 1}`,
          label: `${text.quarter} ${quarter + 1} — ${selectedYear}`,
          start: isoDate(selectedYear, startMonth, 1),
          end: isoDate(
            selectedYear,
            endMonth,
            lastDayOfMonth(selectedYear, endMonth)
          ),
        };
      });
    }

    return [
      {
        key: `y-${selectedYear}`,
        label: `${text.all} — ${selectedYear}`,
        start: `${selectedYear}-01-01`,
        end: `${selectedYear}-12-31`,
      },
    ];
  }, [frequency, lang, selectedYear, text.all, text.quarter]);

  const selectedPeriod =
    periods.find((period) => period.key === selectedPeriodKey) ?? periods[0];

  useEffect(() => {
    let selectedLang: Lang = "fr";
    let initialYear = currentYear;

    try {
      const params = new URLSearchParams(window.location.search);
      const langValue = params.get("lang");
      const yearValue = Number(params.get("year"));
      const periodValue = params.get("period") ?? "";

      setInitialPeriodKey(periodValue);

      if (
        langValue === "fr" ||
        langValue === "en" ||
        langValue === "es"
      ) {
        selectedLang = langValue;
      }

      if (
        Number.isInteger(yearValue) &&
        yearValue >= 2020 &&
        yearValue <= currentYear + 5
      ) {
        initialYear = yearValue;
      }
    } catch {
      selectedLang = "fr";
      initialYear = currentYear;
    }

    setLang(selectedLang);
    setSelectedYear(initialYear);
    void loadBusiness(selectedLang, initialYear);
  }, []);

  useEffect(() => {
    if (!periods.length) return;

    const requestedPeriodExists =
      initialPeriodKey &&
      periods.some((period) => period.key === initialPeriodKey);

    if (requestedPeriodExists && selectedPeriodKey !== initialPeriodKey) {
      setSelectedPeriodKey(initialPeriodKey);
      setInitialPeriodKey("");
      return;
    }

    const stillExists = periods.some(
      (period) => period.key === selectedPeriodKey
    );

    if (!stillExists) {
      setSelectedPeriodKey(periods[0].key);
    }

    if (initialPeriodKey) {
      setInitialPeriodKey("");
    }
  }, [periods, selectedPeriodKey, initialPeriodKey]);

  useEffect(() => {
    if (!business || !selectedPeriod) return;
    void loadTransactions(business.id, selectedPeriod);
  }, [business?.id, selectedPeriod?.start, selectedPeriod?.end]);

  async function loadBusiness(selectedLang: Lang, year: number) {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        const next = encodeURIComponent(
          `/tenue-de-livres/taxes?lang=${selectedLang}&year=${year}`
        );

        window.location.replace(
          `/espace-client?lang=${selectedLang}&next=${next}`
        );
        return;
      }

      const { data, error: businessError } = await supabase
        .from("bookkeeping_businesses")
        .select(
          "id, business_name, tax_status, filing_frequency, fiscal_year_start_day, fiscal_year_start_month"
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (businessError) {
        throw new Error(businessError.message);
      }

      if (!data) {
        window.location.replace(
          `/tenue-de-livres/configuration?lang=${selectedLang}&year=${year}`
        );
        return;
      }

      setBusiness(data as Business);
      await loadSubscription();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : text.error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubscription() {
    const response = await fetch(
      "/api/tenue-de-livres/subscription-status",
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.active || !payload?.subscription) {
      setSubscription(null);
      return;
    }

    const plan = payload.subscription.plan;

    if (plan !== "essential" && plan !== "tax") {
      setSubscription(null);
      return;
    }

    setSubscription({
      plan,
      status: String(payload.subscription.status ?? ""),
      currentPeriodEnd: payload.subscription.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: Boolean(payload.subscription.cancelAtPeriodEnd),
    });
  }

  async function changePlan(targetPlan: Plan) {
    if (changingPlan) return;

    const confirmation =
      targetPlan === "tax"
        ? text.upgradeConfirm
        : text.downgradeConfirm;

    if (!window.confirm(confirmation)) {
      return;
    }

    try {
      setChangingPlan(true);
      setPlanMessage("");
      setError("");

      const response = await fetch(
        "/api/tenue-de-livres/change-plan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: targetPlan,
          }),
        }
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || text.planError);
      }

      if (payload.action === "upgraded") {
        setPlanMessage(text.upgradeSuccess);

        /*
         * Le webhook Stripe met Supabase à jour.
         * On recharge aussi l'état serveur pour refléter
         * le nouveau forfait dans l'interface.
         */
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        await loadSubscription();
        return;
      }

      if (payload.action === "downgrade_scheduled") {
        const effectiveAt =
          typeof payload.effectiveAt === "string"
            ? payload.effectiveAt
            : null;

        const formattedDate = effectiveAt
          ? new Intl.DateTimeFormat(
              lang === "fr" ? "fr-CA" : lang === "es" ? "es-CA" : "en-CA",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            ).format(new Date(effectiveAt))
          : "";

        setPlanMessage(
          formattedDate
            ? `${text.downgradeSuccess} ${formattedDate}.`
            : `${text.downgradeSuccess}.`
        );

        /*
         * Le plan courant demeure Taxes jusqu'à
         * l'échéance. On ne le remplace donc pas
         * visuellement par Essential tout de suite.
         */
        return;
      }

      await loadSubscription();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : text.planError
      );
    } finally {
      setChangingPlan(false);
    }
  }

  async function loadTransactions(businessId: string, period: Period) {
    try {
      setLoadingTransactions(true);
      setError("");

      const { data, error: transactionError } = await supabase
        .from("bookkeeping_transactions")
        .select(
          "id, transaction_date, entry_type, source, description, subtotal, gst, qst, total"
        )
        .eq("business_id", businessId)
        .eq("status", "confirmed")
        .gte("transaction_date", period.start)
        .lte("transaction_date", period.end)
        .order("transaction_date", { ascending: false });

      if (transactionError) {
        throw new Error(transactionError.message);
      }

      setTransactions((data ?? []) as Transaction[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : text.error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  }

  function changeLang(nextLang: Lang) {
    setLang(nextLang);

    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLang);
    window.history.replaceState({}, "", url.toString());
  }

  function changeYear(nextYear: number) {
    setSelectedYear(nextYear);
    setSelectedPeriodKey("");

    const url = new URL(window.location.href);
    url.searchParams.set("year", String(nextYear));
    url.searchParams.delete("period");
    window.history.replaceState({}, "", url.toString());
  }

  function money(value: number) {
    const locale =
      lang === "fr" ? "fr-CA" : lang === "es" ? "es-CA" : "en-CA";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function displayDate(value: string) {
    const [year, month, day] = value.split("-").map(Number);

    return new Intl.DateTimeFormat(
      lang === "fr" ? "fr-CA" : lang === "es" ? "es-CA" : "en-CA",
      { year: "numeric", month: "2-digit", day: "2-digit" }
    ).format(new Date(year, month - 1, day));
  }

  const totals = useMemo<Totals>(() => {
    const result: Totals = {
      salesBeforeTax: 0,
      purchasesBeforeTax: 0,
      gstCollected: 0,
      qstCollected: 0,
      gstPaid: 0,
      qstPaid: 0,
    };

    for (const transaction of transactions) {
      const subtotal = safeNumber(transaction.subtotal);
      const gst = safeNumber(transaction.gst);
      const qst = safeNumber(transaction.qst);

      if (transaction.entry_type === "income") {
        result.salesBeforeTax += subtotal;
        result.gstCollected += gst;
        result.qstCollected += qst;
      }

      if (transaction.entry_type === "expense") {
        result.purchasesBeforeTax += subtotal;
        result.gstPaid += gst;
        result.qstPaid += qst;
      }
    }

    return result;
  }, [transactions]);

  const netGst = totals.gstCollected - totals.gstPaid;
  const netQst = totals.qstCollected - totals.qstPaid;
  const netBalance = netGst + netQst;

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingStyle}>🧮 {text.loading}</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <Link
            href={`/tenue-de-livres?lang=${lang}&year=${selectedYear}`}
            style={brandStyle}
          >
            ComptaNet Québec
          </Link>

          <div style={{ display: "flex", gap: 6 }}>
            {(["fr", "en", "es"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => changeLang(item)}
                style={{
                  ...langButtonStyle,
                  background: lang === item ? "#004aad" : "#ffffff",
                  color: lang === item ? "#ffffff" : "#334155",
                  borderColor: lang === item ? "#004aad" : "#dbe3ef",
                }}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={containerStyle}>
        <Link
          href={`/tenue-de-livres?lang=${lang}&year=${selectedYear}`}
          style={backStyle}
        >
          ← {text.back}
        </Link>

        <section
          style={{
            ...heroStyle,
            borderColor: !registered ? "#bfdbfe" : "#e5e7eb",
            background: !registered
              ? "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)"
              : "#ffffff",
          }}
        >
          <div style={{ flex: "1 1 560px" }}>
            <div style={eyebrowStyle}>🧮 ComptaNet Québec</div>

            <h1 style={titleStyle}>
              {!registered ? text.heroAdTitle : text.title}
            </h1>

            <p style={subtitleStyle}>
              {!registered ? text.heroAdText : text.subtitle}
            </p>

            {!registered && subscription && (
              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    `/tenue-de-livres/configuration?lang=${lang}&year=${selectedYear}&activateTaxes=1`;
                }}
                style={{
                  ...heroButtonStyle,
                  opacity: 1,
                  cursor: "pointer",
                }}
              >
                {text.upgradeButton}
              </button>
            )}

            {!registered && planMessage && (
              <div style={planMessageStyle}>{planMessage}</div>
            )}
          </div>

          <div style={controlsStyle}>
            <label style={controlLabelStyle}>
              <span>{text.year}</span>
              <select
                value={selectedYear}
                onChange={(event) => changeYear(Number(event.target.value))}
                style={selectStyle}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label style={controlLabelStyle}>
              <span>{text.period}</span>
              <select
                value={selectedPeriod?.key ?? ""}
                onChange={(event) => {
                  const nextPeriod = event.target.value;
                  setSelectedPeriodKey(nextPeriod);

                  const url = new URL(window.location.href);
                  url.searchParams.set("period", nextPeriod);
                  window.history.replaceState({}, "", url.toString());
                }}
                style={selectStyle}
              >
                {periods.map((period) => (
                  <option key={period.key} value={period.key}>
                    {period.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {error && (
          <div style={errorStyle}>
            <strong>{text.error}</strong>
            <div style={{ marginTop: 5 }}>{error}</div>
          </div>
        )}

        <section style={profileStyle}>
          <div>
            <div style={smallLabelStyle}>{text.profile}</div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>
              {business?.business_name}
            </div>
          </div>

          <div style={profileBadgesStyle}>
            <span
              style={{
                ...badgeStyle,
                background: registered ? "#ecfdf5" : "#fff7ed",
                color: registered ? "#047857" : "#c2410c",
                borderColor: registered ? "#a7f3d0" : "#fed7aa",
              }}
            >
              {registered ? text.registered : text.notRegistered}
            </span>

            {registered && (
              <span style={badgeStyle}>
                {text.frequency}:{" "}
                {frequency === "monthly"
                  ? text.monthly
                  : frequency === "quarterly"
                    ? text.quarterly
                    : text.annual}
              </span>
            )}
          </div>
        </section>

        {subscription && registered && (
          <section
            style={{
              ...planStyle,
              borderColor: !registered || !taxPlanActive ? "#bfdbfe" : "#a7f3d0",
              background: !registered || !taxPlanActive ? "#eff6ff" : "#f0fdf4",
            }}
          >
            <div style={{ flex: "1 1 520px" }}>
              <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 5 }}>
                {!registered
                  ? text.notRegistered
                  : taxPlanActive
                    ? `${text.plan}: ${text.taxPlan}`
                    : text.upgradeTitle}
              </div>

              <div style={{ lineHeight: 1.55, color: "#475569" }}>
                {!registered
                  ? text.upgradeText
                  : taxPlanActive
                    ? text.subtitle
                    : text.upgradeText}
              </div>

              {planMessage && (
                <div style={planMessageStyle}>{planMessage}</div>
              )}
            </div>

            <button
              type="button"
              disabled={changingPlan || (!registered && taxPlanActive)}
              onClick={() =>
                void changePlan(
                  !registered
                    ? "tax"
                    : taxPlanActive
                      ? "essential"
                      : "tax"
                )
              }
              style={{
                ...planButtonStyle,
                opacity:
                  changingPlan || (!registered && taxPlanActive) ? 0.65 : 1,
                cursor:
                  changingPlan || (!registered && taxPlanActive)
                    ? "default"
                    : "pointer",
                background:
                  !registered || !taxPlanActive ? "#004aad" : "#ffffff",
                color:
                  !registered || !taxPlanActive ? "#ffffff" : "#004aad",
              }}
            >
              {changingPlan
                ? text.planChanging
                : !registered
                  ? text.upgradeButton
                  : taxPlanActive
                    ? text.downgradeButton
                    : text.upgradeButton}
            </button>
          </section>
        )}

        {!registered && (
          <section style={warningStyle}>
            <div style={{ fontSize: 26 }}>ℹ️</div>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 5 }}>
                {text.notRegisteredTitle}
              </div>
              <div style={{ lineHeight: 1.55 }}>
                {text.notRegisteredText}
              </div>
            </div>
          </section>
        )}

        {registered && (
          <>
        <section style={summaryGridStyle}>
          <SummaryCard
            title={text.sales}
            value={money(totals.salesBeforeTax)}
            icon="💰"
          />
          <SummaryCard
            title={text.purchases}
            value={money(totals.purchasesBeforeTax)}
            icon="🧾"
          />
          <SummaryCard
            title={text.collected}
            value={money(totals.gstCollected + totals.qstCollected)}
            icon="⬆️"
          />
          <SummaryCard
            title={text.paid}
            value={money(totals.gstPaid + totals.qstPaid)}
            icon="⬇️"
          />
        </section>

        {registered && taxPlanActive && (
          <>
            <section style={taxGridStyle}>
              <TaxBox
                title={text.gstCollected}
                collected={totals.gstCollected}
                paidLabel={text.gstPaid}
                paid={totals.gstPaid}
                netLabel={text.netGst}
                net={netGst}
                money={money}
              />

              <TaxBox
                title={text.qstCollected}
                collected={totals.qstCollected}
                paidLabel={text.qstPaid}
                paid={totals.qstPaid}
                netLabel={text.netQst}
                net={netQst}
                money={money}
              />

              <section style={balanceStyle}>
                <div style={smallLabelStyle}>{text.balance}</div>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 900,
                    margin: "8px 0",
                    color: netBalance >= 0 ? "#0f172a" : "#047857",
                  }}
                >
                  {money(Math.abs(netBalance))}
                </div>
                <div
                  style={{
                    fontWeight: 900,
                    color: netBalance >= 0 ? "#b45309" : "#047857",
                  }}
                >
                  {netBalance >= 0 ? text.toRemit : text.refund}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1px solid #dbe5f1",
                    color: "#64748b",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  TPS / GST: {money(Math.abs(netGst))} + TVQ / QST: {money(Math.abs(netQst))}
                </div>
              </section>
            </section>

            <div style={noteStyle}>
              <strong>Note :</strong> {text.eligibilityNote}
            </div>
          </>
        )}

        <section style={tableSectionStyle}>
          <div style={tableHeaderStyle}>
            <div>
              <h2 style={{ margin: 0, fontSize: 21 }}>{text.detail}</h2>
              <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: 14 }}>
                {selectedPeriod?.label} — {text.calculationNote}
              </p>
            </div>
          </div>

          {loadingTransactions ? (
            <div style={emptyStyle}>{text.loading}</div>
          ) : transactions.length === 0 ? (
            <div style={emptyStyle}>{text.noTransactions}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>{text.date}</th>
                    <th style={thStyle}>{text.type}</th>
                    <th style={thStyle}>{text.source}</th>
                    <th style={thRightStyle}>{text.beforeTax}</th>
                    <th style={thRightStyle}>{text.gst}</th>
                    <th style={thRightStyle}>{text.qst}</th>
                    <th style={thRightStyle}>{text.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => {
                    const subtotal = safeNumber(transaction.subtotal);
                    const gst = safeNumber(transaction.gst);
                    const qst = safeNumber(transaction.qst);
                    const total =
                      safeNumber(transaction.total) || subtotal + gst + qst;

                    return (
                      <tr key={transaction.id}>
                        <td style={tdStyle}>
                          {displayDate(transaction.transaction_date)}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              ...typeBadgeStyle,
                              background:
                                transaction.entry_type === "income"
                                  ? "#ecfdf5"
                                  : "#fff7ed",
                              color:
                                transaction.entry_type === "income"
                                  ? "#047857"
                                  : "#c2410c",
                            }}
                          >
                            {transaction.entry_type === "income"
                              ? text.income
                              : text.expense}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 800 }}>
                            {transaction.source || "—"}
                          </div>
                          {transaction.description && (
                            <div
                              style={{
                                color: "#64748b",
                                fontSize: 13,
                                marginTop: 3,
                              }}
                            >
                              {transaction.description}
                            </div>
                          )}
                        </td>
                        <td style={tdRightStyle}>{money(subtotal)}</td>
                        <td style={tdRightStyle}>{money(gst)}</td>
                        <td style={tdRightStyle}>{money(qst)}</td>
                        <td style={{ ...tdRightStyle, fontWeight: 900 }}>
                          {money(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
          </>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <section style={summaryCardStyle}>
      <div style={summaryTopStyle}>
        <span style={summaryLabelStyle}>{title}</span>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={summaryValueStyle}>{value}</div>
    </section>
  );
}

function TaxBox({
  title,
  collected,
  paidLabel,
  paid,
  netLabel,
  net,
  money,
}: {
  title: string;
  collected: number;
  paidLabel: string;
  paid: number;
  netLabel: string;
  net: number;
  money: (value: number) => string;
}) {
  return (
    <section style={taxBoxStyle}>
      <div style={taxLineStyle}>
        <span>{title}</span>
        <strong>{money(collected)}</strong>
      </div>
      <div style={taxLineStyle}>
        <span>− {paidLabel}</span>
        <strong>{money(paid)}</strong>
      </div>
      <div style={taxNetStyle}>
        <span>= {netLabel}</span>
        <strong>{money(Math.abs(net))}</strong>
      </div>
    </section>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f9ff",
  color: "#0f172a",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const headerStyle: React.CSSProperties = {
  background: "#ffffff",
  borderBottom: "1px solid #e5e7eb",
  position: "sticky",
  top: 0,
  zIndex: 20,
};

const headerInnerStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "14px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};

const brandStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "#0f172a",
  fontWeight: 900,
  fontSize: 19,
};

const langButtonStyle: React.CSSProperties = {
  border: "1px solid #dbe3ef",
  borderRadius: 8,
  padding: "7px 10px",
  fontWeight: 800,
  cursor: "pointer",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "26px 20px 60px",
};

const backStyle: React.CSSProperties = {
  display: "inline-block",
  color: "#004aad",
  fontWeight: 800,
  textDecoration: "none",
  marginBottom: 18,
};

const heroStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 26,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 22,
  flexWrap: "wrap",
  marginBottom: 18,
};

const eyebrowStyle: React.CSSProperties = {
  color: "#004aad",
  fontWeight: 900,
  marginBottom: 7,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(30px, 5vw, 42px)",
};

const subtitleStyle: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#64748b",
  lineHeight: 1.55,
  maxWidth: 700,
};

const heroButtonStyle: React.CSSProperties = {
  marginTop: 18,
  border: "1px solid #004aad",
  borderRadius: 10,
  padding: "12px 18px",
  background: "#004aad",
  color: "#ffffff",
  fontWeight: 900,
  fontSize: 14,
};

const controlsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const controlLabelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 5,
  color: "#475569",
  fontWeight: 800,
  fontSize: 13,
};

const selectStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 9,
  background: "#ffffff",
  color: "#0f172a",
  padding: "9px 34px 9px 10px",
  fontWeight: 800,
  minWidth: 145,
};

const profileStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 18,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 15,
  flexWrap: "wrap",
  marginBottom: 18,
};

const profileBadgesStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  border: "1px solid #cfe3ff",
  background: "#eef6ff",
  color: "#004aad",
  borderRadius: 999,
  padding: "7px 11px",
  fontSize: 13,
  fontWeight: 900,
};

const warningStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  color: "#9a3412",
  borderRadius: 14,
  padding: 17,
  marginBottom: 18,
};

const planStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap",
  border: "1px solid #bfdbfe",
  borderRadius: 14,
  padding: 18,
  marginBottom: 18,
};

const planButtonStyle: React.CSSProperties = {
  border: "1px solid #004aad",
  borderRadius: 10,
  padding: "11px 16px",
  fontWeight: 900,
  fontSize: 14,
  whiteSpace: "nowrap",
};

const planMessageStyle: React.CSSProperties = {
  marginTop: 10,
  fontWeight: 900,
  color: "#047857",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 14,
  marginBottom: 18,
};

const summaryCardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 18,
};

const summaryTopStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  marginBottom: 11,
};

const summaryLabelStyle: React.CSSProperties = {
  color: "#64748b",
  fontWeight: 800,
  fontSize: 14,
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: 25,
  fontWeight: 900,
};

const taxGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 14,
  marginBottom: 12,
};

const taxBoxStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dbe5f1",
  borderRadius: 14,
  padding: 18,
};

const taxLineStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 15,
  padding: "8px 0",
  color: "#475569",
};

const taxNetStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 15,
  paddingTop: 13,
  marginTop: 6,
  borderTop: "1px solid #e5e7eb",
  fontWeight: 900,
};

const balanceStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "2px solid #cfe3ff",
  borderRadius: 14,
  padding: 18,
};

const smallLabelStyle: React.CSSProperties = {
  color: "#64748b",
  fontWeight: 800,
  fontSize: 13,
  marginBottom: 4,
};

const noteStyle: React.CSSProperties = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  color: "#1e3a8a",
  borderRadius: 12,
  padding: 14,
  lineHeight: 1.5,
  fontSize: 13,
  marginBottom: 18,
};

const tableSectionStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  overflow: "hidden",
};

const tableHeaderStyle: React.CSSProperties = {
  padding: 20,
  borderBottom: "1px solid #e5e7eb",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 850,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 14px",
  background: "#f8fafc",
  color: "#475569",
  fontSize: 12,
  fontWeight: 900,
  borderBottom: "1px solid #e5e7eb",
};

const thRightStyle: React.CSSProperties = {
  ...thStyle,
  textAlign: "right",
};

const tdStyle: React.CSSProperties = {
  padding: "13px 14px",
  borderBottom: "1px solid #eef2f7",
  verticalAlign: "top",
  fontSize: 14,
};

const tdRightStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: "right",
  whiteSpace: "nowrap",
};

const typeBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const emptyStyle: React.CSSProperties = {
  padding: 32,
  textAlign: "center",
  color: "#64748b",
};

const errorStyle: React.CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  borderRadius: 12,
  padding: 14,
  marginBottom: 18,
};

const loadingStyle: React.CSSProperties = {
  width: "calc(100% - 40px)",
  maxWidth: 520,
  margin: "80px auto",
  background: "#ffffff",
  border: "1px solid #dbe5f1",
  borderRadius: 16,
  padding: 28,
  textAlign: "center",
  fontWeight: 900,
};
