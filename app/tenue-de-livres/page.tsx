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
      .select(
        "entry_type, subtotal, gst, qst"
      )
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

    let income = 0;
    let expenses = 0;

    for (const row of (transactions ?? []) as TransactionRow[]) {
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
      creditsTitle: "Analyses disponibles",
      monthlyCredits: "Forfait mensuel",
      essentialCurrentPlan: "Forfait Essentiel — 19,99 $ / mois",
      taxCurrentPlan: "Forfait TPS / TVQ — 29,99 $ / mois",
      monthlyRemaining: "restantes",
      bonusCredits: "Crédits supplémentaires",
      buyCredits: "Besoin de plus d’analyses ?",
      buyCreditsDesc:
        "Les analyses supplémentaires achetées restent disponibles jusqu’à leur utilisation.",
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
      creditsTitle: "Available analyses",
      monthlyCredits: "Monthly plan",
      essentialCurrentPlan: "Essential plan — $19.99 / month",
      taxCurrentPlan: "GST / QST plan — $29.99 / month",
      monthlyRemaining: "remaining",
      bonusCredits: "Extra credits",
      buyCredits: "Need more analyses?",
      buyCreditsDesc:
        "Extra analyses you purchase remain available until they are used.",
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
      creditsTitle: "Análisis disponibles",
      monthlyCredits: "Plan mensual",
      essentialCurrentPlan: "Plan Esencial — 19,99 $ / mes",
      taxCurrentPlan: "Plan GST / QST — 29,99 $ / mes",
      monthlyRemaining: "disponibles",
      bonusCredits: "Créditos adicionales",
      buyCredits: "¿Necesita más análisis?",
      buyCreditsDesc:
        "Los análisis adicionales comprados permanecen disponibles hasta que se utilicen.",
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
   * tableau de bord.
   */
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
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 20px 60px",
        }}
      >
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 26,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "flex-start",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color: "#004aad",
                  fontWeight: 900,
                  marginBottom: 6,
                }}
              >
                💼 ComptaNet Québec
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize:
                    "clamp(28px, 5vw, 42px)",
                }}
              >
                {text.title}
              </h1>

              <p
                style={{
                  margin: "10px 0 0",
                  color: "#64748b",
                  maxWidth: 700,
                  lineHeight: 1.5,
                }}
              >
                {text.subtitle}
              </p>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#eef6ff",
                border: "1px solid #cfe3ff",
                color: "#004aad",
                padding: "8px 10px 8px 14px",
                borderRadius: 10,
                fontWeight: 900,
              }}
            >
              <span>
                {lang === "fr"
                  ? "Année"
                  : lang === "es"
                    ? "Año"
                    : "Year"}
              </span>

              <select
                value={selectedYear}
                onChange={(event) =>
                  void changeYear(Number(event.target.value))
                }
                aria-label={text.year}
                style={{
                  border: "1px solid #b9d5fb",
                  background: "#ffffff",
                  color: "#004aad",
                  borderRadius: 8,
                  padding: "7px 30px 7px 10px",
                  fontWeight: 900,
                  fontSize: 16,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section
          style={{
            marginBottom: 28,
          }}
        >
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: 21,
            }}
          >
            {text.summary}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 14,
            }}
          >
            <SummaryCard
              title={text.incomeTotal}
              value={money(totals.income)}
              icon="💰"
              href={`/tenue-de-livres/revenus?lang=${lang}&year=${selectedYear}`}
            />

            <SummaryCard
              title={text.expensesTotal}
              value={money(totals.expenses)}
              icon="🧾"
              href={`/tenue-de-livres/depenses?lang=${lang}&year=${selectedYear}`}
            />

            <SummaryCard
              title={text.profit}
              value={money(profit)}
              icon="📈"
            />

            <SummaryCard
              title={text.documentsTotal}
              value={String(totals.documents)}
              icon="📁"
              href={`/tenue-de-livres/documents?lang=${lang}&year=${selectedYear}`}
            />
          </div>
        </section>

        <section
          style={{
            marginBottom: 18,
            background: "#ffffff",
            border: "1px solid #dbe5f1",
            borderRadius: 16,
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 19 }}>
                {text.creditsTitle}
              </h2>
              <div style={{ color: "#004aad", fontWeight: 900, fontSize: 14 }}>
                {subscription?.plan === "tax"
                  ? text.taxCurrentPlan
                  : text.essentialCurrentPlan}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 14 }}>
                <span style={{ color: "#64748b", fontWeight: 800 }}>
                  {text.monthlyCredits}:
                </span>{" "}
                <strong style={{ fontSize: 17 }}>
                  {monthlyUsed} / {monthlyLimit}
                </strong>{" "}
                <span style={{ color: "#004aad", fontWeight: 800 }}>
                  — {monthlyRemaining} {text.monthlyRemaining}
                </span>
              </div>

              <div style={{ fontSize: 14 }}>
                <span style={{ color: "#64748b", fontWeight: 800 }}>
                  {text.bonusCredits}:
                </span>{" "}
                <strong style={{ fontSize: 17 }}>{bonusCredits}</strong>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid #e5edf7",
              paddingTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 190, flex: "1 1 220px" }}>
              <div style={{ fontWeight: 900, fontSize: 15 }}>
                {text.buyCredits}
              </div>
              <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                {text.buyCreditsDesc}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flex: "3 1 620px",
                flexWrap: "wrap",
              }}
            >
              <CreditCard credits={25} price="4,99 $" lang={lang} buttonText={text.buy} />
              <CreditCard credits={50} price="7,99 $" lang={lang} buttonText={text.buy} />
              <CreditCard credits={100} price="14,99 $" lang={lang} buttonText={text.buy} />
            </div>
          </div>
        </section>

        <section>
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: 21,
            }}
          >
            {text.dashboard}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {cards.map((card) => (
              <Link
                key={card.href}
                href={`${card.href}?lang=${lang}&year=${selectedYear}`}
                style={{
                  background: "#ffffff",
                  border:
                    "1px solid #e5e7eb",
                  borderRadius: 16,
                  padding: 20,
                  textDecoration: "none",
                  color: "#0f172a",
                  minHeight: 135,
                  display: "flex",
                  flexDirection: "column",
                  boxShadow:
                    "0 4px 14px rgba(15,23,42,.04)",
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    marginBottom: 12,
                  }}
                >
                  {card.icon}
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    marginBottom: 7,
                  }}
                >
                  {card.title}
                </div>

                <div
                  style={{
                    color: "#64748b",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {card.desc}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div
          style={{
            marginTop: 30,
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

      {/* Mini-chat de tenue de livres — visible seulement dans le tableau de bord actif */}
      <BookkeepingChat
        lang={lang}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
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
