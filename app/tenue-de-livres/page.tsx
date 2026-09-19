"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Lang = "fr" | "en" | "es";
type Plan = "essential" | "tax";

type AccessState =
  | "loading"
  | "not_authenticated"
  | "no_subscription"
  | "confirming_payment"
  | "checking_business"
  | "ready"
  | "error";

type SubscriptionResponse = {
  authenticated?: boolean;
  active?: boolean;
  subscription?: {
    plan?: string | null;
    status?: string | null;
    monthlyLimit?: number | null;
    monthlyUsed?: number | null;
    bonusCredits?: number | null;
  } | null;
  error?: string;
};

type DashboardTotals = {
  income: number;
  expenses: number;
  documents: number;
};

type TransactionRow = {
  entry_type: "income" | "expense" | string;
  subtotal: number | string | null;
  gst: number | string | null;
  qst: number | string | null;
};

export default function TenueDeLivresPage() {
  const [lang, setLang] = useState<Lang>("fr");

  const [accessState, setAccessState] =
    useState<AccessState>("loading");

  const [errorMessage, setErrorMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Record<string, unknown>[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<Record<string, unknown>[]>([]);
  const [taxTotals, setTaxTotals] = useState({ gstCollected: 0, qstCollected: 0, gstCredits: 0, qstCredits: 0 });

  const [totals, setTotals] = useState<DashboardTotals>({
    income: 0,
    expenses: 0,
    documents: 0,
  });

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [subscription, setSubscription] =
    useState<SubscriptionResponse["subscription"]>(null);

  const availableYears = Array.from(
    { length: currentYear - 2020 + 6 },
    (_, index) => 2020 + index
  ).reverse();

  useEffect(() => {
    let selected: Lang = "fr";

    try {
      const params = new URLSearchParams(
        window.location.search
      );

      const value = params.get("lang");

      if (
        value === "fr" ||
        value === "en" ||
        value === "es"
      ) {
        selected = value;
      }
    } catch {
      selected = "fr";
    }

    let initialYear = currentYear;

    try {
      const params = new URLSearchParams(window.location.search);
      const yearValue = Number(params.get("year"));

      if (
        Number.isInteger(yearValue) &&
        yearValue >= 2020 &&
        yearValue <= currentYear + 5
      ) {
        initialYear = yearValue;
      }
    } catch {
      initialYear = currentYear;
    }

    setLang(selected);
    setSelectedYear(initialYear);

    try {
      const savedLogo = window.localStorage.getItem("comptanet_company_logo");
      if (savedLogo) {
        setCompanyLogo(savedLogo);
      }
    } catch {
      // Le logo reste facultatif.
    }

    void checkAccess(selected, initialYear);
  }, []);

  async function loadDashboard(businessId: string, year: number) {
    /*
     * Tableau de bord de l'année courante.
     *
     * On utilise les transactions CONFIRMÉES seulement.
     */
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const {
      data: transactions,
      error: transactionsError,
    } = await supabase
      .from("bookkeeping_transactions")
      .select("*")
      .eq("business_id", businessId)
      .eq("status", "confirmed")
      .gte("transaction_date", yearStart)
      .lte("transaction_date", yearEnd);

    if (transactionsError) {
      throw new Error(transactionsError.message);
    }

    /*
     * Compter les documents de cette entreprise.
     */
    const {
      count: documentCount,
      error: documentsError,
    } = await supabase
      .from("bookkeeping_documents")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("business_id", businessId);

    if (documentsError) {
      throw new Error(documentsError.message);
    }

    const transactionRows = (transactions ?? []) as Array<Record<string, unknown> & TransactionRow>;

    const sortedTransactions = [...transactionRows]
      .sort((a, b) => String(b.transaction_date ?? b.date ?? "").localeCompare(String(a.transaction_date ?? a.date ?? "")))
      .slice(0, 8);
    setRecentTransactions(sortedTransactions);

    let gstCollected = 0;
    let qstCollected = 0;
    let gstCredits = 0;
    let qstCredits = 0;
    for (const row of transactionRows) {
      const gst = Number(row.gst ?? 0);
      const qst = Number(row.qst ?? 0);
      if (row.entry_type === "income") { gstCollected += gst; qstCollected += qst; }
      if (row.entry_type === "expense") { gstCredits += gst; qstCredits += qst; }
    }
    setTaxTotals({ gstCollected, qstCollected, gstCredits, qstCredits });

    const { data: latestDocuments } = await supabase
      .from("bookkeeping_documents")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(4);
    setRecentDocuments((latestDocuments ?? []) as Record<string, unknown>[]);

    let income = 0;
    let expenses = 0;

    for (const row of transactionRows) {
      const subtotal = Number(row.subtotal ?? 0);
      const gst = Number(row.gst ?? 0);
      const qst = Number(row.qst ?? 0);

      /*
       * Le total réel de la transaction est :
       * avant taxes + TPS + TVQ.
       *
       * C'est ce qui permet à une facture comme :
       *
       * 1 565,00
       * + 78,25 TPS
       * + 156,12 TVQ
       * = 1 799,37 $
       *
       * d'apparaître correctement au tableau de bord.
       */
      const total = subtotal + gst + qst;

      if (row.entry_type === "income") {
        income += total;
      }

      if (row.entry_type === "expense") {
        expenses += total;
      }
    }

    setTotals({
      income,
      expenses,
      documents: documentCount ?? 0,
    });
  }

  async function checkAccess(selected: Lang, year: number = selectedYear) {
    try {
      setAccessState("loading");
      setErrorMessage("");

      /*
       * 1. Vérifier la connexion Supabase.
       */
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setAccessState("not_authenticated");

        const next = encodeURIComponent(
          `/tenue-de-livres?lang=${selected}&year=${year}`
        );

        window.location.replace(
          `/espace-client?lang=${selected}&next=${next}`
        );

        return;
      }

      /*
       * 2. Vérifier si nous revenons d'un paiement Stripe.
       *
       * Stripe peut retourner le client sur ComptaNet
       * quelques secondes avant que le webhook ait terminé
       * d'enregistrer l'abonnement dans Supabase.
       */
      const params = new URLSearchParams(
        window.location.search
      );

      const checkoutSuccess =
        params.get("checkout") === "success";

      /*
       * Navigation normale :
       * une seule vérification.
       *
       * Retour Stripe :
       * jusqu'à 10 vérifications espacées de 1,5 seconde.
       */
      const maxAttempts = checkoutSuccess ? 10 : 1;

      let result: SubscriptionResponse = {};
      let response: Response | null = null;

      for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
      ) {
        response = await fetch(
          "/api/tenue-de-livres/subscription-status",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        result =
          (await response
            .json()
            .catch(() => ({}))) as SubscriptionResponse;

        /*
         * Session serveur non reconnue.
         */
        if (
          response.status === 401 ||
          result.authenticated === false
        ) {
          setAccessState("not_authenticated");

          const next = encodeURIComponent(
            `/tenue-de-livres?lang=${selected}&year=${year}`
          );

          window.location.replace(
            `/espace-client?lang=${selected}&next=${next}`
          );

          return;
        }

        /*
         * Erreur de l'API.
         */
        if (!response.ok) {
          throw new Error(
            result.error ||
              "Impossible de vérifier l’abonnement."
          );
        }

        /*
         * Le webhook a confirmé l'abonnement.
         */
        if (result.active) {
          break;
        }

        /*
         * Ce n'est pas un retour Stripe.
         */
        if (!checkoutSuccess) {
          break;
        }

        /*
         * Retour de Stripe :
         * laisser quelques secondes au webhook.
         */
        if (attempt < maxAttempts) {
          setAccessState("confirming_payment");

          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 1500);
          });
        }
      }

      /*
       * 3. Aucun abonnement actif confirmé.
       */
      if (!result.active) {
        setAccessState("no_subscription");
        return;
      }

      setSubscription(result.subscription ?? null);

      /*
       * 4. L'abonnement est actif.
       */
      try {
        sessionStorage.removeItem(
          "bookkeeping_checkout_client_secret"
        );

        sessionStorage.removeItem(
          "bookkeeping_checkout_plan"
        );
      } catch {
        // Rien à faire.
      }

      /*
       * Nettoyer checkout=success dans l'adresse
       * sans recharger la page.
       */
      if (checkoutSuccess) {
        const cleanUrl = new URL(
          window.location.href
        );

        cleanUrl.searchParams.delete("checkout");

        window.history.replaceState(
          {},
          "",
          cleanUrl.toString()
        );
      }

      /*
       * 5. Vérifier si la compagnie existe.
       */
      setAccessState("checking_business");

      const {
        data: business,
        error: businessError,
      } = await supabase
        .from("bookkeeping_businesses")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

      if (businessError) {
        throw new Error(businessError.message);
      }

      /*
       * 6. Première utilisation.
       */
      if (!business) {
        window.location.replace(
          `/tenue-de-livres/configuration?lang=${selected}&year=${year}`
        );

        return;
      }

      /*
       * 7. Charger les vrais chiffres Supabase.
       */
      setBusinessId(business.id);
      await loadDashboard(business.id, year);

      /*
       * 8. Afficher le tableau de bord.
       */
      setAccessState("ready");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue.";

      setErrorMessage(message);
      setAccessState("error");
    }
  }

  function changeLang(nextLang: Lang) {
    setLang(nextLang);

    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLang);

    window.history.replaceState(
      {},
      "",
      url.toString()
    );
  }

  async function changeYear(nextYear: number) {
    setSelectedYear(nextYear);

    const url = new URL(window.location.href);
    url.searchParams.set("year", String(nextYear));
    window.history.replaceState({}, "", url.toString());

    if (!businessId) {
      return;
    }

    try {
      setErrorMessage("");
      await loadDashboard(businessId, nextYear);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue.";

      setErrorMessage(message);
      setAccessState("error");
    }
  }

  function money(value: number) {
    const locale =
      lang === "fr"
        ? "fr-CA"
        : lang === "es"
          ? "es-CA"
          : "en-CA";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  const profit = totals.income - totals.expenses;

  const text = {
    fr: {
      title: "Tenue de livres",
      subtitle:
        "Gérez simplement vos revenus, vos dépenses, vos documents et vos taxes au même endroit.",

      year: `Année ${selectedYear}`,
      summary: `Résumé ${selectedYear}`,

      dashboard: "Tableau de bord",

      income: "Revenus",
      incomeDesc:
        "Ajoutez et consultez vos revenus d’entreprise.",

      expenses: "Dépenses",
      expensesDesc:
        "Ajoutez vos dépenses et conservez vos pièces justificatives.",

      documents: "Documents",
      documentsDesc:
        "Téléversez vos factures, reçus, relevés et autres documents.",

      taxes: "TPS / TVQ",
      taxesDesc:
        "Suivez les taxes perçues et les crédits de taxes sur vos dépenses.",

      periods: "Périodes",
      periodsDesc:
        "Consultez vos périodes mensuelles, trimestrielles ou annuelles.",

      annual: "Résumé annuel",
      annualDesc:
        "Obtenez le résumé de vos revenus et dépenses pour votre déclaration d’impôt.",

      incomeTotal: "Revenus",
      expensesTotal: "Dépenses",
      profit: "Résultat",
      documentsTotal: "Documents",

      back: "Retour à ComptaNet Québec",

      loading: "Vérification de votre accès…",

      confirming:
        "Paiement reçu. Activation de votre abonnement…",

      confirmingDesc:
        "Veuillez patienter quelques secondes pendant que nous confirmons votre abonnement.",

      plansTitle: "Choisissez votre forfait",

      plansIntro:
        "Activez votre tenue de livres ComptaNet Québec. Vous pourrez ensuite créer votre entreprise et accéder à votre tableau de bord.",

      essential: "Essentiel",
      essentialPrice: "19,99 $",
      essentialPeriod: "/ mois",

      essentialDesc:
        "Pour gérer simplement vos revenus, dépenses et documents.",

      taxPlan: "TPS / TVQ",
      taxPrice: "29,99 $",
      taxPeriod: "/ mois",

      taxDesc:
        "Pour la tenue de livres avec le suivi de la TPS et de la TVQ.",

      choose: "Choisir ce forfait",

      secure:
        "Paiement sécurisé. Votre abonnement sera lié automatiquement à votre compte ComptaNet Québec.",

      errorTitle:
        "Impossible de vérifier votre accès",

      retry: "Réessayer",
      creditsTitle: "Utilisations disponibles",
      monthlyCredits: "Forfait mensuel",
      essentialCurrentPlan: "Forfait Essentiel — 19,99 $ / mois",
      taxCurrentPlan: "Forfait TPS / TVQ — 29,99 $ / mois",
      monthlyRemaining: "restantes",
      bonusCredits: "Crédits supplémentaires",
      buyCredits: "Besoin de plus d’utilisations ?",
      buyCreditsDesc:
        "Les utilisations supplémentaires achetées restent disponibles jusqu’à leur utilisation.",
      buy: "Acheter",
    },

    en: {
      title: "Bookkeeping",

      subtitle:
        "Manage your business income, expenses, documents and taxes in one place.",

      year: `Year ${selectedYear}`,
      summary: `Summary ${selectedYear}`,

      dashboard: "Dashboard",

      income: "Income",

      incomeDesc:
        "Add and review your business income.",

      expenses: "Expenses",

      expensesDesc:
        "Add expenses and keep your supporting documents.",

      documents: "Documents",

      documentsDesc:
        "Upload invoices, receipts, statements and other documents.",

      taxes: "GST / QST",

      taxesDesc:
        "Track taxes collected and input tax credits on expenses.",

      periods: "Periods",

      periodsDesc:
        "View monthly, quarterly or annual periods.",

      annual: "Annual summary",

      annualDesc:
        "Get your income and expense summary for your tax return.",

      incomeTotal: "Income",
      expensesTotal: "Expenses",
      profit: "Net result",
      documentsTotal: "Documents",

      back: "Back to ComptaNet Québec",

      loading: "Checking your access…",

      confirming:
        "Payment received. Activating your subscription…",

      confirmingDesc:
        "Please wait a few seconds while we confirm your subscription.",

      plansTitle: "Choose your plan",

      plansIntro:
        "Activate ComptaNet Québec bookkeeping. You can then create your business profile and access your dashboard.",

      essential: "Essential",
      essentialPrice: "$19.99",
      essentialPeriod: "/ month",

      essentialDesc:
        "For simple management of your income, expenses and documents.",

      taxPlan: "GST / QST",
      taxPrice: "$29.99",
      taxPeriod: "/ month",

      taxDesc:
        "For bookkeeping with GST and QST tracking.",

      choose: "Choose this plan",

      secure:
        "Secure payment. Your subscription will automatically be linked to your ComptaNet Québec account.",

      errorTitle:
        "Unable to verify your access",

      retry: "Try again",
      creditsTitle: "Available uses",
      monthlyCredits: "Monthly plan",
      essentialCurrentPlan: "Essential plan — $19.99 / month",
      taxCurrentPlan: "GST / QST plan — $29.99 / month",
      monthlyRemaining: "remaining",
      bonusCredits: "Extra credits",
      buyCredits: "Need more uses?",
      buyCreditsDesc:
        "Extra uses you purchase remain available until they are used.",
      buy: "Buy",
    },

    es: {
      title: "Contabilidad",

      subtitle:
        "Gestione sus ingresos, gastos, documentos e impuestos en un solo lugar.",

      year: `Año ${selectedYear}`,
      summary: `Resumen ${selectedYear}`,

      dashboard: "Panel",

      income: "Ingresos",

      incomeDesc:
        "Añada y consulte los ingresos de su empresa.",

      expenses: "Gastos",

      expensesDesc:
        "Añada sus gastos y conserve sus comprobantes.",

      documents: "Documentos",

      documentsDesc:
        "Suba facturas, recibos, estados de cuenta y otros documentos.",

      taxes: "GST / QST",

      taxesDesc:
        "Controle los impuestos cobrados y los créditos fiscales de sus gastos.",

      periods: "Períodos",

      periodsDesc:
        "Consulte períodos mensuales, trimestrales o anuales.",

      annual: "Resumen anual",

      annualDesc:
        "Obtenga el resumen de ingresos y gastos para su declaración de impuestos.",

      incomeTotal: "Ingresos",
      expensesTotal: "Gastos",
      profit: "Resultado",
      documentsTotal: "Documentos",

      back: "Volver a ComptaNet Québec",

      loading: "Verificando su acceso…",

      confirming:
        "Pago recibido. Activando su suscripción…",

      confirmingDesc:
        "Espere unos segundos mientras confirmamos su suscripción.",

      plansTitle: "Elija su plan",

      plansIntro:
        "Active la contabilidad de ComptaNet Québec. Después podrá crear su empresa y acceder a su panel.",

      essential: "Esencial",
      essentialPrice: "19,99 $",
      essentialPeriod: "/ mes",

      essentialDesc:
        "Para gestionar fácilmente ingresos, gastos y documentos.",

      taxPlan: "GST / QST",
      taxPrice: "29,99 $",
      taxPeriod: "/ mes",

      taxDesc:
        "Para la contabilidad con seguimiento de GST y QST.",

      choose: "Elegir este plan",

      secure:
        "Pago seguro. Su suscripción se vinculará automáticamente a su cuenta ComptaNet Québec.",

      errorTitle:
        "No se puede verificar su acceso",

      retry: "Intentar de nuevo",
      creditsTitle: "Usos disponibles",
      monthlyCredits: "Plan mensual",
      essentialCurrentPlan: "Plan Esencial — 19,99 $ / mes",
      taxCurrentPlan: "Plan GST / QST — 29,99 $ / mes",
      monthlyRemaining: "disponibles",
      bonusCredits: "Créditos adicionales",
      buyCredits: "¿Necesita más usos?",
      buyCreditsDesc:
        "Los usos adicionales comprados permanecen disponibles hasta que se utilicen.",
      buy: "Comprar",
    },
  }[lang];

  const cards = [
    {
      icon: "💰",
      title: text.income,
      desc: text.incomeDesc,
      href: "/tenue-de-livres/revenus",
    },
    {
      icon: "🧾",
      title: text.expenses,
      desc: text.expensesDesc,
      href: "/tenue-de-livres/depenses",
    },
    {
      icon: "📁",
      title: text.documents,
      desc: text.documentsDesc,
      href: "/tenue-de-livres/documents",
    },
    {
      icon: "🧮",
      title: text.taxes,
      desc: text.taxesDesc,
      href: "/tenue-de-livres/taxes",
    },
    {
      icon: "📅",
      title: text.periods,
      desc: text.periodsDesc,
      href: "/tenue-de-livres/periodes",
    },
    {
      icon: "📊",
      title: text.annual,
      desc: text.annualDesc,
      href: "/tenue-de-livres/resume-annuel",
    },
  ];

  /*
   * Retour de Stripe :
   * écran spécifique pendant que le webhook
   * confirme l'abonnement.
   */
  if (accessState === "confirming_payment") {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "linear-gradient(180deg, #f7fbff 0%, #edf6ff 100%)",
          color: "#0f172a",
          fontFamily:
            "Arial, Helvetica, sans-serif",
          padding: 20,
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: 560,
            background: "#ffffff",
            border: "1px solid #dbe5f1",
            borderRadius: 22,
            padding: "38px 30px",
            textAlign: "center",
            boxShadow:
              "0 14px 40px rgba(15,23,42,.08)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 18px",
              borderRadius: 18,
              background: "#ecfdf5",
              display: "grid",
              placeItems: "center",
              fontSize: 30,
            }}
          >
            ✓
          </div>

          <div
            style={{
              color: "#004aad",
              fontWeight: 900,
              marginBottom: 10,
            }}
          >
            ComptaNet Québec
          </div>

          <h1
            style={{
              margin: "0 0 12px",
              fontSize: 28,
            }}
          >
            {text.confirming}
          </h1>

          <p
            style={{
              color: "#64748b",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {text.confirmingDesc}
          </p>

          <div
            style={{
              margin: "28px auto 0",
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: "4px solid #dbeafe",
              borderTopColor: "#004aad",
              animation:
                "comptanetSpin .8s linear infinite",
            }}
          />

          <style jsx>{`
            @keyframes comptanetSpin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </section>
      </main>
    );
  }

  /*
   * Vérification normale.
   */
  if (
    accessState === "loading" ||
    accessState === "checking_business" ||
    accessState === "not_authenticated"
  ) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f5f9ff",
          color: "#0f172a",
          fontFamily:
            "Arial, Helvetica, sans-serif",
          padding: 20,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #dbe5f1",
            borderRadius: 18,
            padding: 30,
            width: "100%",
            maxWidth: 500,
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

          <strong>{text.loading}</strong>
        </div>
      </main>
    );
  }

  /*
   * Erreur technique.
   */
  if (accessState === "error") {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f5f9ff",
          color: "#0f172a",
          fontFamily:
            "Arial, Helvetica, sans-serif",
          padding: 20,
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: 600,
            background: "#ffffff",
            border: "1px solid #fecaca",
            borderRadius: 18,
            padding: 28,
            textAlign: "center",
          }}
        >
          <h1 style={{ marginTop: 0 }}>
            {text.errorTitle}
          </h1>

          <p style={{ color: "#64748b" }}>
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              void checkAccess(lang, selectedYear)
            }
            style={{
              border: 0,
              borderRadius: 10,
              padding: "12px 18px",
              background: "#004aad",
              color: "#ffffff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {text.retry}
          </button>
        </section>
      </main>
    );
  }

  /*
   * Aucun abonnement actif :
   * afficher les forfaits.
   */
  if (accessState === "no_subscription") {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f5f9ff",
          color: "#0f172a",
          fontFamily:
            "Arial, Helvetica, sans-serif",
        }}
      >
        <Header
          lang={lang}
          onLanguageChange={changeLang}
        />

        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            padding: "45px 20px 70px",
          }}
        >
          <section
            style={{
              textAlign: "center",
              marginBottom: 30,
            }}
          >
            <div
              style={{
                color: "#004aad",
                fontWeight: 900,
                marginBottom: 8,
              }}
            >
              💼 ComptaNet Québec
            </div>

            <h1
              style={{
                fontSize:
                  "clamp(30px, 5vw, 44px)",
                margin: "0 0 12px",
              }}
            >
              {text.plansTitle}
            </h1>

            <p
              style={{
                color: "#64748b",
                maxWidth: 680,
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              {text.plansIntro}
            </p>
          </section>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
              maxWidth: 800,
              margin: "0 auto",
            }}
          >
            <PlanCard
              title={text.essential}
              price={text.essentialPrice}
              period={text.essentialPeriod}
              description={
                text.essentialDesc
              }
              buttonText={text.choose}
              plan="essential"
              lang={lang}
            />

            <PlanCard
              title={text.taxPlan}
              price={text.taxPrice}
              period={text.taxPeriod}
              description={text.taxDesc}
              buttonText={text.choose}
              plan="tax"
              lang={lang}
              featured
            />
          </div>

          <p
            style={{
              maxWidth: 700,
              margin: "24px auto 0",
              textAlign: "center",
              color: "#64748b",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            🔒 {text.secure}
          </p>

          <div
            style={{
              marginTop: 32,
              textAlign: "center",
            }}
          >
            <Link
              href={`/?lang=${lang}`}
              style={{
                color: "#004aad",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              ← {text.back}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const monthlyLimit = Number(subscription?.monthlyLimit ?? 0);
  const monthlyUsed = Number(subscription?.monthlyUsed ?? 0);
  const bonusCredits = Number(subscription?.bonusCredits ?? 0);
  const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);

  /*
   * Abonnement actif + compagnie existante :
   * tableau de bord professionnel.
   */
  const taxBalance = taxTotals.gstCollected + taxTotals.qstCollected - taxTotals.gstCredits - taxTotals.qstCredits;
  const dashboardCopy = {
    fr: { recent: "Dernières transactions", seeAll: "Voir toutes", taxBox: `TPS / TVQ (${selectedYear})`, gstCollected: "TPS perçue", qstCollected: "TVQ perçue", gstCredits: "Crédits de TPS", qstCredits: "Crédits de TVQ", balance: "Solde à remettre", recentDocs: "Documents récents", company: "Mon entreprise", settings: "Paramètres", help: "Aide", logout: "Se déconnecter", addIncome: "Ajouter un revenu", addExpense: "Ajouter une dépense", addDocument: "Ajouter un document", viewTaxes: "Voir la section TPS / TVQ", viewPeriods: "Voir les périodes", generateSummary: "Générer le résumé", date: "Date", type: "Type", description: "Description", category: "Catégorie", amount: "Montant", noTransactions: "Aucune transaction confirmée pour cette année.", noDocuments: "Aucun document récent.", simple: "Comptabilité simple. Résultats clairs." },
    en: { recent: "Latest transactions", seeAll: "View all", taxBox: `GST / QST (${selectedYear})`, gstCollected: "GST collected", qstCollected: "QST collected", gstCredits: "GST credits", qstCredits: "QST credits", balance: "Balance payable", recentDocs: "Recent documents", company: "My business", settings: "Settings", help: "Help", logout: "Sign out", addIncome: "Add income", addExpense: "Add expense", addDocument: "Add document", viewTaxes: "View GST / QST", viewPeriods: "View periods", generateSummary: "Generate summary", date: "Date", type: "Type", description: "Description", category: "Category", amount: "Amount", noTransactions: "No confirmed transactions for this year.", noDocuments: "No recent documents.", simple: "Simple bookkeeping. Clear results." },
    es: { recent: "Últimas transacciones", seeAll: "Ver todas", taxBox: `GST / QST (${selectedYear})`, gstCollected: "GST cobrado", qstCollected: "QST cobrado", gstCredits: "Créditos GST", qstCredits: "Créditos QST", balance: "Saldo a remitir", recentDocs: "Documentos recientes", company: "Mi empresa", settings: "Configuración", help: "Ayuda", logout: "Cerrar sesión", addIncome: "Añadir ingreso", addExpense: "Añadir gasto", addDocument: "Añadir documento", viewTaxes: "Ver GST / QST", viewPeriods: "Ver períodos", generateSummary: "Generar resumen", date: "Fecha", type: "Tipo", description: "Descripción", category: "Categoría", amount: "Importe", noTransactions: "No hay transacciones confirmadas para este año.", noDocuments: "No hay documentos recientes.", simple: "Contabilidad simple. Resultados claros." },
  }[lang];

  function rowText(row: Record<string, unknown>, keys: string[], fallback = "—") {
    for (const key of keys) {
      const value = row[key];
      if (value !== null && value !== undefined && String(value).trim() !== "") return String(value);
    }
    return fallback;
  }

  function rowAmount(row: Record<string, unknown>) {
    const direct = Number(row.total ?? row.amount ?? 0);
    if (Number.isFinite(direct) && direct !== 0) return direct;
    return Number(row.subtotal ?? 0) + Number(row.gst ?? 0) + Number(row.qst ?? 0);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = `/espace-client?lang=${lang}`;
  }

  const navItems = [
    { icon: "▥", label: text.dashboard, href: `/tenue-de-livres?lang=${lang}&year=${selectedYear}`, active: true },
    { icon: "$", label: text.income, href: `/tenue-de-livres/revenus?lang=${lang}&year=${selectedYear}` },
    { icon: "▤", label: text.expenses, href: `/tenue-de-livres/depenses?lang=${lang}&year=${selectedYear}` },
    { icon: "□", label: text.documents, href: `/tenue-de-livres/documents?lang=${lang}&year=${selectedYear}` },
    { icon: "%", label: text.taxes, href: `/tenue-de-livres/taxes?lang=${lang}&year=${selectedYear}` },
    { icon: "▦", label: text.periods, href: `/tenue-de-livres/periodes?lang=${lang}&year=${selectedYear}` },
    { icon: "▥", label: text.annual, href: `/tenue-de-livres/resume-annuel?lang=${lang}&year=${selectedYear}` },
  ];

  return (
    <main className="bk-shell">
      <aside className={`bk-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="bk-brand"><span className="bk-brandmark">▥</span><div><strong>ComptaNet Québec</strong><small>{lang === "fr" ? "Comptabilité simple. Résultats clairs." : lang === "es" ? "Contabilidad simple. Resultados claros." : "Simple bookkeeping. Clear results."}</small></div></div>
        <nav className="bk-nav">
          {navItems.map((item) => <Link key={item.href} href={item.href} className={item.active ? "active" : ""} onClick={() => setMobileMenuOpen(false)}><span>{item.icon}</span>{item.label}</Link>)}
        </nav>
        <div className="bk-sidebottom">
          <Link href={`/tenue-de-livres/configuration?lang=${lang}&year=${selectedYear}`}><span>▣</span>{dashboardCopy.company}</Link>
          <Link href={`/aide?lang=${lang}`}><span>?</span>{dashboardCopy.help}</Link>
          <button type="button" onClick={() => void signOut()}><span>↪</span>{dashboardCopy.logout}</button>
        </div>
      </aside>

      {mobileMenuOpen && <button className="bk-overlay" aria-label="Fermer le menu" onClick={() => setMobileMenuOpen(false)} />}

      <div className="bk-main">
        <header className="bk-topbar">
          <button className="bk-menu" type="button" onClick={() => setMobileMenuOpen(true)}>☰</button>
          <div className="bk-langs">{(["fr","en","es"] as const).map((item) => <button key={item} type="button" onClick={() => changeLang(item)} className={lang === item ? "active" : ""}>{item.toUpperCase()}</button>)}</div>
          <div className="bk-account">
            {companyLogo ? (
              <span className="bk-avatar bk-avatar-logo">
                <img src={companyLogo} alt="" />
              </span>
            ) : (
              <span className="bk-avatar">CQ</span>
            )}
            <div><strong>ComptaNet Québec</strong><small>{dashboardCopy.company}</small></div>
          </div>
        </header>

        <div className="bk-content">
          <section className="bk-heading">
            <div><h1>{text.title}</h1><p>{text.subtitle}</p></div>
            <label className="bk-year"><span>{lang === "fr" ? "Année" : lang === "es" ? "Año" : "Year"}</span><select value={selectedYear} onChange={(e) => void changeYear(Number(e.target.value))}>{availableYears.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
          </section>

          <section className="bk-summarygrid">
            <Link href={`/tenue-de-livres/revenus?lang=${lang}&year=${selectedYear}`} className="bk-summary income"><span className="bk-summaryicon">$</span><div><b>{text.incomeTotal}</b><strong>{money(totals.income)}</strong></div></Link>
            <Link href={`/tenue-de-livres/depenses?lang=${lang}&year=${selectedYear}`} className="bk-summary expense"><span className="bk-summaryicon">▤</span><div><b>{text.expensesTotal}</b><strong>-{money(totals.expenses)}</strong></div></Link>
            <div className="bk-summary result"><span className="bk-summaryicon">▥</span><div><b>{text.profit}</b><strong>{money(profit)}</strong></div></div>
            <Link href={`/tenue-de-livres/documents?lang=${lang}&year=${selectedYear}`} className="bk-summary docs"><span className="bk-summaryicon">▰</span><div><b>{text.documentsTotal}</b><strong>{totals.documents}</strong><small>{lang === "fr" ? "documents ajoutés" : lang === "es" ? "documentos añadidos" : "documents added"}</small></div></Link>
          </section>

          <section className="bk-actiongrid">
            {cards.map((card, index) => {
              const buttons = [dashboardCopy.addIncome, dashboardCopy.addExpense, dashboardCopy.addDocument, dashboardCopy.viewTaxes, dashboardCopy.viewPeriods, dashboardCopy.generateSummary];
              return <Link key={card.href} href={`${card.href}?lang=${lang}&year=${selectedYear}`} className="bk-action"><span className={`bk-actionicon i${index}`}>{card.icon}</span><strong>{card.title}</strong><p>{card.desc}</p><b>{buttons[index]}</b></Link>;
            })}
          </section>

          <section className="bk-lowergrid">
            <div className="bk-panel bk-transactions">
              <div className="bk-panelhead"><h2>▣ {dashboardCopy.recent}</h2><Link href={`/tenue-de-livres/revenus?lang=${lang}&year=${selectedYear}`}>{dashboardCopy.seeAll}</Link></div>
              {recentTransactions.length === 0 ? <div className="bk-empty">{dashboardCopy.noTransactions}</div> : <div className="bk-tablewrap"><table><thead><tr><th>{dashboardCopy.date}</th><th>{dashboardCopy.type}</th><th>{dashboardCopy.description}</th><th>{dashboardCopy.category}</th><th>{dashboardCopy.amount}</th></tr></thead><tbody>{recentTransactions.map((row,index) => { const isIncome = row.entry_type === "income"; const amount=rowAmount(row); return <tr key={String(row.id ?? index)}><td>{rowText(row,["transaction_date","date"])}</td><td><span className={isIncome ? "tag income" : "tag expense"}>{isIncome ? text.income : text.expenses}</span></td><td>{rowText(row,["description","source","reference"])}</td><td>{rowText(row,["tax_category","category","source"])}</td><td className={isIncome ? "amount income" : "amount expense"}>{isIncome ? "" : "-"}{money(Math.abs(amount))}</td></tr>; })}</tbody></table></div>}
            </div>

            <div className="bk-rightcol">
              <div className="bk-panel">
                <div className="bk-panelhead"><h2>% {dashboardCopy.taxBox}</h2><Link href={`/tenue-de-livres/taxes?lang=${lang}&year=${selectedYear}`}>{dashboardCopy.seeAll}</Link></div>
                <div className="bk-taxrows"><div><span>{dashboardCopy.gstCollected}</span><b>{money(taxTotals.gstCollected)}</b></div><div><span>{dashboardCopy.qstCollected}</span><b>{money(taxTotals.qstCollected)}</b></div><div><span>{dashboardCopy.gstCredits}</span><b>-{money(taxTotals.gstCredits)}</b></div><div><span>{dashboardCopy.qstCredits}</span><b>-{money(taxTotals.qstCredits)}</b></div><div className="total"><span>{dashboardCopy.balance}</span><b>{money(taxBalance)}</b></div></div>
              </div>
              <div className="bk-panel">
                <div className="bk-panelhead"><h2>▰ {dashboardCopy.recentDocs}</h2><Link href={`/tenue-de-livres/documents?lang=${lang}&year=${selectedYear}`}>{dashboardCopy.seeAll}</Link></div>
                {recentDocuments.length === 0 ? <div className="bk-empty">{dashboardCopy.noDocuments}</div> : <div className="bk-doclist">{recentDocuments.map((doc,index) => <div key={String(doc.id ?? index)}><span>▣</span><b>{rowText(doc,["file_name","filename","name","original_name"],`Document ${index+1}`)}</b><small>{rowText(doc,["created_at"],"").slice(0,10)}</small></div>)}</div>}
              </div>
            </div>
          </section>

        </div>
      </div>

      <BookkeepingChat lang={lang} open={chatOpen} onOpenChange={setChatOpen} />

      <style jsx global>{`
        .bk-shell{min-height:100vh;background:#f8fafc;color:#0f172a;font-family:Arial,Helvetica,sans-serif;display:flex}.bk-sidebar{width:250px;background:linear-gradient(180deg,#17263a 0%,#142236 100%);color:#fff;position:fixed;inset:0 auto 0 0;padding:24px 14px 14px;display:flex;flex-direction:column;z-index:100}.bk-brand{display:flex;gap:12px;align-items:center;padding:0 10px 24px}.bk-brandmark{font-size:30px}.bk-brand strong{display:block;font-size:18px}.bk-brand small{display:block;color:#cbd5e1;font-size:11px;margin-top:4px}.bk-nav{display:grid;gap:7px}.bk-nav a,.bk-sidebottom a,.bk-sidebottom button{display:flex;align-items:center;gap:13px;color:#fff;text-decoration:none;padding:12px 13px;border-radius:8px;font-size:15px;border:0;background:transparent;width:100%;text-align:left;cursor:pointer}.bk-nav a span,.bk-sidebottom span{width:22px;text-align:center;font-weight:900}.bk-nav a.active{background:#1264d5}.bk-nav a:hover,.bk-sidebottom a:hover,.bk-sidebottom button:hover{background:rgba(255,255,255,.08)}.bk-sidebottom{margin-top:auto;border-top:1px solid rgba(255,255,255,.1);padding-top:12px;display:grid;gap:3px}.bk-sidebottom button{margin-top:12px;background:rgba(255,255,255,.08)}.bk-main{margin-left:250px;width:calc(100% - 250px);min-width:0}.bk-topbar{height:46px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:flex-end;padding:0 24px;gap:18px;position:sticky;top:0;z-index:40}.bk-menu{display:none}.bk-langs{display:flex;gap:5px}.bk-langs button{border:1px solid #dbe3ef;background:#fff;border-radius:6px;padding:5px 8px;font-weight:800;cursor:pointer}.bk-langs button.active{background:#1264d5;color:#fff;border-color:#1264d5}.bk-account{display:flex;align-items:center;gap:9px;padding-left:14px;border-left:1px solid #e2e8f0}.bk-account strong,.bk-account small{display:block}.bk-account strong{font-size:13px}.bk-account small{font-size:11px;color:#64748b}.bk-avatar{width:31px;height:31px;border-radius:50%;background:#1264d5;color:#fff;display:grid;place-items:center;font-size:12px;overflow:hidden}.bk-avatar-logo{background:#fff;border:1px solid #dbe3ef}.bk-avatar-logo img{width:100%;height:100%;object-fit:contain;display:block}.bk-content{padding:20px 26px 24px;max-width:1500px;margin:0 auto}.bk-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:24px}.bk-heading h1{font-size:36px;line-height:1;margin:0 0 8px}.bk-heading p{margin:0;color:#53657f;font-size:15px}.bk-year{display:flex;align-items:center;gap:14px;background:#f8fafc;border:1px solid #dbe3ef;border-radius:9px;padding:9px 12px;font-weight:800}.bk-year select{background:#fff;border:1px solid #cbd5e1;border-radius:7px;padding:8px 34px 8px 12px;font-weight:800;font-size:15px}.bk-summarygrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:20px}.bk-summary{min-height:138px;border:1px solid #dce5ef;border-radius:10px;padding:20px;display:flex;align-items:flex-start;gap:15px;text-decoration:none;color:#0f172a}.bk-summary.income{background:linear-gradient(135deg,#f5fffa,#effcf5)}.bk-summary.expense{background:linear-gradient(135deg,#fff8f8,#fff1f1)}.bk-summary.result{background:linear-gradient(135deg,#f7fbff,#eef6ff)}.bk-summary.docs{background:linear-gradient(135deg,#fffdf7,#fff8ec)}.bk-summaryicon{width:50px;height:50px;border-radius:50%;display:grid;place-items:center;font-size:23px;font-weight:900;flex:0 0 auto}.bk-summary.income .bk-summaryicon{background:#d9f7e7;color:#079447}.bk-summary.expense .bk-summaryicon{background:#ffdede;color:#dc2626}.bk-summary.result .bk-summaryicon{background:#dcecff;color:#1264d5}.bk-summary.docs .bk-summaryicon{background:#fff0cc;color:#e99b00}.bk-summary b{display:block;font-size:15px;margin:4px 0 8px}.bk-summary strong{display:block;font-size:27px;letter-spacing:-.5px}.bk-summary.expense strong{color:#dc2626}.bk-summary small{display:block;color:#64748b;margin-top:8px}.bk-actiongrid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin-bottom:20px}.bk-action{border:1px solid #dce5ef;background:#fff;border-radius:9px;padding:15px;text-decoration:none;color:#0f172a;min-height:165px;display:flex;flex-direction:column}.bk-actionicon{font-size:22px;margin-bottom:8px}.bk-action>strong{font-size:15px}.bk-action p{color:#475569;font-size:12px;line-height:1.5;margin:9px 0 12px;flex:1}.bk-action>b{font-size:11px;text-align:center;border-radius:7px;padding:9px 7px;background:#eef6ff;color:#0756b7}.bk-action:nth-child(1)>b{background:#eafaf2;color:#087a3d}.bk-action:nth-child(2)>b{background:#fff0f0;color:#c81e1e}.bk-action:nth-child(3)>b{background:#fff7e8;color:#a46100}.bk-lowergrid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(300px,.95fr);gap:16px}.bk-panel{background:#fff;border:1px solid #dce5ef;border-radius:9px;overflow:hidden}.bk-panelhead{height:50px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid #e2e8f0}.bk-panelhead h2{font-size:16px;margin:0}.bk-panelhead a{color:#075fcb;text-decoration:none;font-weight:800;font-size:12px}.bk-tablewrap{overflow:auto}.bk-transactions table{width:100%;border-collapse:collapse;font-size:12px}.bk-transactions th,.bk-transactions td{padding:9px 12px;border-bottom:1px solid #e8edf3;text-align:left;white-space:nowrap}.bk-transactions th{background:#f8fafc}.tag{display:inline-block;border-radius:999px;padding:4px 9px;font-weight:800}.tag.income{background:#dff8e9;color:#087a3d}.tag.expense{background:#ffe4e4;color:#c81e1e}.amount{font-weight:900;text-align:right!important}.amount.income{color:#079447}.amount.expense{color:#dc2626}.bk-rightcol{display:grid;gap:16px;align-content:start}.bk-taxrows>div{display:flex;justify-content:space-between;padding:8px 16px;border-bottom:1px solid #edf1f5;font-size:12px}.bk-taxrows .total{background:#e9f3ff;font-size:13px}.bk-taxrows .total b{color:#075fcb}.bk-doclist>div{display:grid;grid-template-columns:20px 1fr auto;align-items:center;gap:8px;padding:9px 16px;border-bottom:1px solid #edf1f5;font-size:12px}.bk-doclist small{color:#64748b}.bk-empty{padding:28px 16px;text-align:center;color:#64748b;font-size:13px}.bk-overlay{display:none}
        @media(max-width:1180px){.bk-actiongrid{grid-template-columns:repeat(3,1fr)}.bk-summarygrid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:820px){.bk-sidebar{transform:translateX(-100%);transition:transform .2s ease;box-shadow:12px 0 35px rgba(15,23,42,.22)}.bk-sidebar.open{transform:translateX(0)}.bk-main{margin-left:0;width:100%}.bk-menu{display:grid;place-items:center;margin-right:auto;border:0;background:#eef6ff;color:#0756b7;border-radius:7px;width:34px;height:34px;font-size:20px}.bk-overlay{display:block;position:fixed;inset:0;border:0;background:rgba(15,23,42,.35);z-index:90}.bk-heading{flex-direction:column}.bk-lowergrid{grid-template-columns:1fr}.bk-content{padding:18px 14px}.bk-account{display:none}}
        @media(max-width:600px){.bk-heading h1{font-size:30px}.bk-summarygrid,.bk-actiongrid{grid-template-columns:1fr}.bk-summary{min-height:auto}.bk-year{width:100%;justify-content:space-between}.bk-topbar{padding:0 14px}}
      `}</style>
    </main>
  );
}

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

function BookkeepingChat({
  lang,
  open,
  onOpenChange,
}: {
  lang: Lang;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const copy = {
    fr: {
      title: "Assistant ComptaNet",
      hello:
        "Bonjour! 👋 Posez-moi votre question sur votre tenue de livres.",
      placeholder: "Écrivez votre question…",
      send: "Envoyer",
      thinking: "Je vérifie…",
      error:
        "Je n’arrive pas à répondre pour le moment. Réessayez dans quelques secondes.",
      close: "Fermer le chat",
      open: "Ouvrir l’assistant ComptaNet",
    },
    en: {
      title: "ComptaNet Assistant",
      hello:
        "Hello! 👋 Ask me your bookkeeping question.",
      placeholder: "Type your question…",
      send: "Send",
      thinking: "Checking…",
      error:
        "I can’t answer right now. Please try again in a few seconds.",
      close: "Close chat",
      open: "Open ComptaNet Assistant",
    },
    es: {
      title: "Asistente ComptaNet",
      hello:
        "¡Hola! 👋 Hágame su pregunta sobre contabilidad.",
      placeholder: "Escriba su pregunta…",
      send: "Enviar",
      thinking: "Verificando…",
      error:
        "No puedo responder en este momento. Inténtelo de nuevo en unos segundos.",
      close: "Cerrar el chat",
      open: "Abrir el asistente ComptaNet",
    },
  }[lang];

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: copy.hello },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setMessages((current) => {
      if (
        current.length === 1 &&
        current[0]?.role === "assistant"
      ) {
        return [{ role: "assistant", content: copy.hello }];
      }
      return current;
    });
  }, [copy.hello]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  async function sendMessage() {
    const message = input.trim();

    if (!message || sending) {
      return;
    }

    const conversationHistory = messages
      .filter(
        (item, index) =>
          !(index === 0 && item.role === "assistant")
      )
      .slice(-10);

    const userMessage: ChatMessage = {
      role: "user",
      content: message,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message,
          lang,
          context: "bookkeeping",
          history: conversationHistory,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.ok || !result?.content) {
        throw new Error(result?.error || "Assistant error");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: String(result.content),
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: copy.error,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-label={copy.title}
          style={{
            position: "fixed",
            right: 20,
            bottom: 90,
            width: "min(370px, calc(100vw - 24px))",
            height: "min(480px, calc(100vh - 120px))",
            background: "#ffffff",
            border: "1px solid #cfe3ff",
            borderRadius: 18,
            boxShadow: "0 18px 50px rgba(15,23,42,.20)",
            zIndex: 1000,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 14px",
              background: "#004aad",
              color: "#ffffff",
              flex: "0 0 auto",
            }}
          >
            <strong>💬 {copy.title}</strong>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={copy.close}
              style={{
                width: 32,
                height: 32,
                border: 0,
                borderRadius: 8,
                background: "rgba(255,255,255,.14)",
                color: "#ffffff",
                fontSize: 21,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: 14,
              background: "#f8fbff",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {messages.map((item, index) => {
              const mine = item.role === "user";

              return (
                <div
                  key={`${item.role}-${index}`}
                  style={{
                    alignSelf: mine ? "flex-end" : "flex-start",
                    maxWidth: "86%",
                    padding: "10px 12px",
                    borderRadius: mine
                      ? "14px 14px 4px 14px"
                      : "14px 14px 14px 4px",
                    background: mine ? "#004aad" : "#ffffff",
                    color: mine ? "#ffffff" : "#0f172a",
                    border: mine ? "none" : "1px solid #dbe5f1",
                    lineHeight: 1.45,
                    fontSize: 14,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {item.content}
                </div>
              );
            })}

            {sending && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "9px 12px",
                  borderRadius: "14px 14px 14px 4px",
                  background: "#ffffff",
                  border: "1px solid #dbe5f1",
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                {copy.thinking}
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
            style={{
              display: "flex",
              gap: 8,
              padding: 10,
              borderTop: "1px solid #e5e7eb",
              background: "#ffffff",
              flex: "0 0 auto",
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={copy.placeholder}
              maxLength={1500}
              disabled={sending}
              autoComplete="off"
              style={{
                flex: 1,
                minWidth: 0,
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: "11px 12px",
                outline: "none",
                fontSize: 14,
              }}
            />

            <button
              type="submit"
              disabled={sending || !input.trim()}
              style={{
                border: 0,
                borderRadius: 10,
                padding: "10px 13px",
                background: "#004aad",
                color: "#ffffff",
                fontWeight: 900,
                cursor:
                  sending || !input.trim() ? "default" : "pointer",
                opacity: sending || !input.trim() ? 0.55 : 1,
              }}
            >
              {copy.send}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label={open ? copy.close : copy.open}
        title={copy.title}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          width: 58,
          height: 58,
          border: 0,
          borderRadius: "50%",
          background: "#004aad",
          color: "#ffffff",
          boxShadow: "0 10px 28px rgba(0,74,173,.32)",
          fontSize: 25,
          cursor: "pointer",
          zIndex: 1001,
          display: "grid",
          placeItems: "center",
        }}
      >
        {open ? "×" : "💬"}
      </button>
    </>
  );
}

function Header({
  lang,
  onLanguageChange,
}: {
  lang: Lang;
  onLanguageChange: (
    lang: Lang
  ) => void;
}) {
  return (
    <header
      style={{
        background: "#ffffff",
        borderBottom:
          "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Link
          href={`/?lang=${lang}`}
          style={{
            textDecoration: "none",
            color: "#0f172a",
            fontWeight: 900,
            fontSize: 19,
          }}
        >
          ComptaNet Québec
        </Link>

        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          {(
            ["fr", "en", "es"] as const
          ).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() =>
                onLanguageChange(item)
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
                padding: "7px 10px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

function PlanCard({
  title,
  price,
  period,
  description,
  buttonText,
  plan,
  lang,
  featured = false,
}: {
  title: string;
  price: string;
  period: string;
  description: string;
  buttonText: string;
  plan: Plan;
  lang: Lang;
  featured?: boolean;
}) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function startCheckout() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/tenue-de-livres/checkout",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            plan,
            lang,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Checkout error"
        );
      }

      if (!result?.clientSecret) {
        throw new Error(
          "Missing Stripe client secret"
        );
      }

      /*
       * Conserver temporairement le clientSecret
       * pour la page Embedded Checkout.
       */
      sessionStorage.setItem(
        "bookkeeping_checkout_client_secret",
        result.clientSecret
      );

      sessionStorage.setItem(
        "bookkeeping_checkout_plan",
        plan
      );

      /*
       * Stripe reste intégré dans ComptaNet.
       */
      window.location.href =
        `/tenue-de-livres/paiement?lang=${lang}`;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Checkout error";

      setError(message);
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        background: "#ffffff",

        border: featured
          ? "2px solid #004aad"
          : "1px solid #dbe5f1",

        borderRadius: 18,
        padding: 26,

        boxShadow: featured
          ? "0 10px 30px rgba(0,74,173,.12)"
          : "0 8px 24px rgba(15,23,42,.05)",
      }}
    >
      <h2
        style={{
          margin: "0 0 10px",
          fontSize: 24,
        }}
      >
        {title}
      </h2>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          marginBottom: 16,
        }}
      >
        <strong
          style={{
            fontSize: 34,
            color: "#004aad",
          }}
        >
          {price}
        </strong>

        <span
          style={{
            color: "#64748b",
          }}
        >
          {period}
        </span>
      </div>

      <p
        style={{
          color: "#64748b",
          lineHeight: 1.6,
          minHeight: 76,
        }}
      >
        {description}
      </p>

      <button
        type="button"
        disabled={loading}
        onClick={() =>
          void startCheckout()
        }
        style={{
          width: "100%",
          border: 0,
          borderRadius: 10,
          padding: "13px 18px",
          background: "#004aad",
          color: "#ffffff",
          fontWeight: 900,
          cursor: loading
            ? "default"
            : "pointer",
          opacity: loading
            ? 0.65
            : 1,
          fontSize: 15,
        }}
      >
        {loading ? "…" : buttonText}
      </button>

      {error && (
        <p
          style={{
            color: "#b91c1c",
            fontSize: 13,
            marginBottom: 0,
          }}
        >
          {error}
        </p>
      )}
    </section>
  );
}

function CreditCard({
  credits,
  price,
  lang,
  buttonText,
}: {
  credits: 25 | 50 | 100;
  price: string;
  lang: Lang;
  buttonText: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/tenue-de-livres/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          credits,
          lang,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Checkout error");
      }

      if (!result?.clientSecret) {
        throw new Error("Missing Stripe client secret");
      }

      sessionStorage.setItem(
        "bookkeeping_checkout_client_secret",
        result.clientSecret
      );
      sessionStorage.setItem(
        "bookkeeping_checkout_plan",
        `credits_${credits}`
      );

      window.location.href = `/tenue-de-livres/paiement?lang=${lang}`;
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Checkout error");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid #cfe3ff",
        borderRadius: 10,
        padding: "8px 9px",
        background: "#f8fbff",
        display: "flex",
        alignItems: "center",
        gap: 8,
        flex: "1 1 190px",
        minWidth: 0,
      }}
    >
      <div style={{ minWidth: 72 }}>
        <div style={{ fontSize: 17, fontWeight: 900, color: "#004aad" }}>
          +{credits}
        </div>
        <div style={{ fontSize: 15, fontWeight: 900, marginTop: 1 }}>
          {price}
        </div>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => void startCheckout()}
        style={{
          flex: 1,
          border: 0,
          borderRadius: 8,
          padding: "9px 10px",
          background: "#004aad",
          color: "#ffffff",
          fontWeight: 900,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.65 : 1,
          whiteSpace: "nowrap",
        }}
      >
        {loading ? "…" : buttonText}
      </button>
      {error && (
        <div style={{ color: "#b91c1c", fontSize: 11, width: "100%" }}>
          {error}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value: string;
  icon: string;
  href?: string;
}) {
  const card = (
    <div
      style={{
        background: "#ffffff",
        border:
          "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 18,
        height: "100%",
        boxSizing: "border-box",
        cursor: href ? "pointer" : "default",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            color: "#64748b",
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          {title}
        </span>

        <span
          style={{
            fontSize: 22,
          }}
        >
          {icon}
        </span>
      </div>

      <div
        style={{
          fontSize: 25,
          fontWeight: 900,
        }}
      >
        {value}
      </div>
    </div>
  );

  if (!href) {
    return card;
  }

  return (
    <Link
      href={href}
      style={{
        display: "block",
        height: "100%",
        color: "#0f172a",
        textDecoration: "none",
      }}
    >
      {card}
    </Link>
  );
}
