"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import type { StripeEmbeddedCheckout } from "@stripe/stripe-js";

type Lang = "fr" | "en" | "es";
type CheckoutItem =
  | "essential"
  | "tax"
  | "credits_25"
  | "credits_50"
  | "credits_100";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

export default function PaiementTenueLivresPage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [checkoutItem, setCheckoutItem] =
    useState<CheckoutItem>("essential");
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const checkoutRef = useRef<HTMLDivElement | null>(null);
  const embeddedCheckoutRef =
    useRef<StripeEmbeddedCheckout | null>(null);

  useEffect(() => {
    let selectedLang: Lang = "fr";

    try {
      const params = new URLSearchParams(window.location.search);
      const value = params.get("lang");

      if (value === "en" || value === "es") {
        selectedLang = value;
      }

      setLang(selectedLang);

      const savedSecret =
        sessionStorage.getItem(
          "bookkeeping_checkout_client_secret"
        ) || "";

      const savedPlan =
        sessionStorage.getItem(
          "bookkeeping_checkout_plan"
        );

      if (
        savedPlan === "tax" ||
        savedPlan === "credits_25" ||
        savedPlan === "credits_50" ||
        savedPlan === "credits_100"
      ) {
        setCheckoutItem(savedPlan);
      } else {
        setCheckoutItem("essential");
      }

      if (!savedSecret) {
        setError("missing_checkout");
        setLoading(false);
        return;
      }

      setClientSecret(savedSecret);
    } catch {
      setError("missing_checkout");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!clientSecret || !checkoutRef.current) return;

    let cancelled = false;

    async function mountCheckout() {
      try {
        setLoading(true);

        const stripe = await stripePromise;

        if (!stripe) {
          throw new Error("Stripe initialization failed");
        }

        if (cancelled || !checkoutRef.current) {
          return;
        }

        const checkout = await stripe.initEmbeddedCheckout({
          clientSecret,
        });

        if (cancelled || !checkoutRef.current) {
          checkout.destroy();
          return;
        }

        embeddedCheckoutRef.current = checkout;
        checkout.mount(checkoutRef.current);

        setLoading(false);
      } catch (err: unknown) {
        console.error(err);
        setError("stripe_error");
        setLoading(false);
      }
    }

    void mountCheckout();

    return () => {
      cancelled = true;

      if (embeddedCheckoutRef.current) {
        embeddedCheckoutRef.current.destroy();
        embeddedCheckoutRef.current = null;
      }
    };
  }, [clientSecret]);

  const isCredits = checkoutItem.startsWith("credits_");

  const creditAmount =
    checkoutItem === "credits_25"
      ? 25
      : checkoutItem === "credits_50"
        ? 50
        : checkoutItem === "credits_100"
          ? 100
          : 0;

  const copy = {
    fr: {
      back: isCredits ? "Retour à la tenue de livres" : "Retour aux forfaits",
      secure: "Paiement sécurisé",
      title: isCredits
        ? "Achetez des crédits supplémentaires"
        : "Finalisez votre abonnement",
      subtitle:
        "Votre paiement est effectué de façon sécurisée directement dans ComptaNet Québec.",
      order: isCredits ? "Votre achat" : "Votre forfait",
      essential: "Essentiel",
      tax: "TPS / TVQ",
      essentialDesc:
        "Revenus, dépenses, documents et outils de tenue de livres.",
      taxDesc:
        "Tenue de livres avec suivi de la TPS et de la TVQ.",
      creditsDesc:
        "Crédits supplémentaires sans expiration. Ils restent disponibles jusqu’à leur utilisation.",
      perMonth: "par mois",
      essentialPrice: "19,99 $",
      taxPrice: "29,99 $",
      protected: "Paiement protégé par Stripe",
      protectedDesc:
        "Vos informations de carte sont traitées de façon sécurisée par Stripe. ComptaNet Québec ne conserve pas votre numéro de carte.",
      after: isCredits
        ? "Après le paiement, vos crédits supplémentaires seront ajoutés automatiquement à votre compte."
        : "Après le paiement, votre abonnement sera confirmé automatiquement.",
      loading: "Chargement du paiement sécurisé…",
      errorTitle: "Le paiement ne peut pas être chargé",
      missing:
        "Votre session de paiement a expiré ou n'a pas été trouvée. Retournez à la tenue de livres pour recommencer.",
      stripeError:
        "Une erreur est survenue pendant le chargement du paiement sécurisé.",
      retry: "Retourner à la tenue de livres",
      creditsLabel: "crédits supplémentaires",
    },

    en: {
      back: isCredits ? "Back to bookkeeping" : "Back to plans",
      secure: "Secure payment",
      title: isCredits
        ? "Purchase additional credits"
        : "Complete your subscription",
      subtitle:
        "Your payment is securely completed directly within ComptaNet Québec.",
      order: isCredits ? "Your purchase" : "Your plan",
      essential: "Essential",
      tax: "GST / QST",
      essentialDesc:
        "Income, expenses, documents and bookkeeping tools.",
      taxDesc:
        "Bookkeeping with GST and QST tracking.",
      creditsDesc:
        "Additional credits do not expire. They remain available until used.",
      perMonth: "per month",
      essentialPrice: "$19.99",
      taxPrice: "$29.99",
      protected: "Payment protected by Stripe",
      protectedDesc:
        "Your card information is securely processed by Stripe. ComptaNet Québec does not store your card number.",
      after: isCredits
        ? "After payment, your additional credits will automatically be added to your account."
        : "After payment, your subscription will be confirmed automatically.",
      loading: "Loading secure payment…",
      errorTitle: "Payment cannot be loaded",
      missing:
        "Your payment session has expired or could not be found. Return to bookkeeping to start again.",
      stripeError:
        "An error occurred while loading the secure payment form.",
      retry: "Back to bookkeeping",
      creditsLabel: "additional credits",
    },

    es: {
      back: isCredits ? "Volver a contabilidad" : "Volver a los planes",
      secure: "Pago seguro",
      title: isCredits
        ? "Compre créditos adicionales"
        : "Complete su suscripción",
      subtitle:
        "Su pago se realiza de forma segura directamente en ComptaNet Québec.",
      order: isCredits ? "Su compra" : "Su plan",
      essential: "Esencial",
      tax: "GST / QST",
      essentialDesc:
        "Ingresos, gastos, documentos y herramientas de contabilidad.",
      taxDesc:
        "Contabilidad con seguimiento de GST y QST.",
      creditsDesc:
        "Los créditos adicionales no caducan. Permanecen disponibles hasta que se utilicen.",
      perMonth: "por mes",
      essentialPrice: "19,99 $",
      taxPrice: "29,99 $",
      protected: "Pago protegido por Stripe",
      protectedDesc:
        "Los datos de su tarjeta son procesados de forma segura por Stripe. ComptaNet Québec no almacena su número de tarjeta.",
      after: isCredits
        ? "Después del pago, sus créditos adicionales se añadirán automáticamente a su cuenta."
        : "Después del pago, su suscripción se confirmará automáticamente.",
      loading: "Cargando el pago seguro…",
      errorTitle: "No se puede cargar el pago",
      missing:
        "Su sesión de pago ha expirado o no se encontró. Vuelva a contabilidad para comenzar de nuevo.",
      stripeError:
        "Se produjo un error al cargar el formulario de pago seguro.",
      retry: "Volver a contabilidad",
      creditsLabel: "créditos adicionales",
    },
  }[lang];

  const itemName = isCredits
    ? `+${creditAmount} ${copy.creditsLabel}`
    : checkoutItem === "tax"
      ? copy.tax
      : copy.essential;

  const itemPrice = isCredits
    ? checkoutItem === "credits_25"
      ? "4,99 $"
      : checkoutItem === "credits_50"
        ? "7,99 $"
        : "14,99 $"
    : checkoutItem === "tax"
      ? copy.taxPrice
      : copy.essentialPrice;

  const itemDescription = isCredits
    ? copy.creditsDesc
    : checkoutItem === "tax"
      ? copy.taxDesc
      : copy.essentialDesc;

  if (error) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, #f7fbff 0%, #edf6ff 100%)",
          color: "#0f172a",
          fontFamily: "Arial, Helvetica, sans-serif",
          padding: "40px 20px",
        }}
      >
        <section
          style={{
            maxWidth: 620,
            margin: "70px auto",
            background: "#ffffff",
            border: "1px solid #dbe5f1",
            borderRadius: 22,
            padding: 32,
            textAlign: "center",
            boxShadow: "0 14px 40px rgba(15,23,42,.08)",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: "#eef6ff",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 18px",
              fontSize: 28,
            }}
          >
            💳
          </div>

          <h1 style={{ margin: "0 0 12px" }}>
            {copy.errorTitle}
          </h1>

          <p
            style={{
              color: "#64748b",
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            {error === "missing_checkout"
              ? copy.missing
              : copy.stripeError}
          </p>

          <Link
            href={`/tenue-de-livres?lang=${lang}`}
            style={{
              display: "inline-block",
              background: "#004aad",
              color: "#ffffff",
              textDecoration: "none",
              padding: "12px 20px",
              borderRadius: 10,
              fontWeight: 900,
            }}
          >
            {copy.retry}
          </Link>
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
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: "rgba(255,255,255,.96)",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 15,
            flexWrap: "wrap",
          }}
        >
          <Link
            href={`/?lang=${lang}`}
            style={{
              textDecoration: "none",
              color: "#0f172a",
              fontWeight: 900,
              fontSize: 20,
            }}
          >
            ComptaNet Québec
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#15803d",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            <span>🔒</span>
            {copy.secure}
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "32px 20px 70px",
        }}
      >
        <Link
          href={`/tenue-de-livres?lang=${lang}`}
          style={{
            display: "inline-block",
            color: "#004aad",
            textDecoration: "none",
            fontWeight: 800,
            marginBottom: 24,
          }}
        >
          ← {copy.back}
        </Link>

        <section
          style={{
            marginBottom: 28,
          }}
        >
          <div
            style={{
              color: "#004aad",
              fontWeight: 900,
              marginBottom: 7,
            }}
          >
            💼 ComptaNet Québec
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "clamp(30px, 5vw, 44px)",
              letterSpacing: "-.5px",
            }}
          >
            {copy.title}
          </h1>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              lineHeight: 1.6,
              maxWidth: 720,
            }}
          >
            {copy.subtitle}
          </p>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(260px, 340px) minmax(0, 1fr)",
            gap: 24,
            alignItems: "start",
          }}
          className="paymentGrid"
        >
          {/* RÉSUMÉ DU FORFAIT */}
          <aside
            style={{
              background: "#ffffff",
              border: "1px solid #dbe5f1",
              borderRadius: 20,
              padding: 24,
              boxShadow:
                "0 10px 30px rgba(15,23,42,.06)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: ".06em",
                color: "#64748b",
                fontWeight: 900,
                marginBottom: 12,
              }}
            >
              {copy.order}
            </div>

            <div
              style={{
                background: "#f4f9ff",
                border: "1px solid #cfe3ff",
                borderRadius: 15,
                padding: 18,
              }}
            >
              <div
                style={{
                  fontSize: 21,
                  fontWeight: 900,
                  marginBottom: 8,
                }}
              >
                {itemName}
              </div>

              <p
                style={{
                  margin: "0 0 18px",
                  color: "#64748b",
                  lineHeight: 1.5,
                  fontSize: 14,
                }}
              >
                {itemDescription}
              </p>

              <div
                style={{
                  borderTop: "1px solid #dbeafe",
                  paddingTop: 16,
                }}
              >
                <strong
                  style={{
                    color: "#004aad",
                    fontSize: 30,
                  }}
                >
                  {itemPrice}
                </strong>

                {!isCredits && (
                  <span
                    style={{
                      color: "#64748b",
                      marginLeft: 7,
                    }}
                  >
                    {copy.perMonth}
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                display: "flex",
                gap: 11,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  flex: "0 0 34px",
                  borderRadius: 10,
                  background: "#ecfdf5",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                🔒
              </div>

              <div>
                <div
                  style={{
                    fontWeight: 900,
                    marginBottom: 4,
                    fontSize: 14,
                  }}
                >
                  {copy.protected}
                </div>

                <div
                  style={{
                    color: "#64748b",
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {copy.protectedDesc}
                </div>
              </div>
            </div>

            <p
              style={{
                margin: "20px 0 0",
                paddingTop: 18,
                borderTop: "1px solid #e5e7eb",
                color: "#64748b",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              ✓ {copy.after}
            </p>
          </aside>

          {/* STRIPE EMBEDDED */}
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #dbe5f1",
              borderRadius: 20,
              padding: "18px 12px",
              minHeight: 520,
              boxShadow:
                "0 10px 30px rgba(15,23,42,.06)",
              position: "relative",
            }}
          >
            {loading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  background: "#ffffff",
                  borderRadius: 20,
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    padding: 25,
                  }}
                >
                  <div
                    style={{
                      fontSize: 34,
                      marginBottom: 13,
                    }}
                  >
                    🔐
                  </div>

                  <strong>{copy.loading}</strong>
                </div>
              </div>
            )}

            <div
              ref={checkoutRef}
              style={{
                width: "100%",
                minHeight: 480,
              }}
            />
          </section>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 800px) {
          .paymentGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
);
}
