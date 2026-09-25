"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useSearchParams,
} from "next/navigation";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
} from "@stripe/stripe-js";

type Lang =
  | "fr"
  | "en"
  | "es";

type CheckoutResponse = {
  clientSecret?: string;
  solde?: number;
  factureId?: string;
  numeroFacture?: string | null;
  cqId?: string | null;
  error?: string;
};

const publishableKey =
  process.env
    .NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  "";

const stripePromise =
  publishableKey
    ? loadStripe(
        publishableKey
      )
    : null;

function normalizeLang(
  value: string | null
): Lang {
  return value === "en" ||
    value === "es"
    ? value
    : "fr";
}

function money(
  value: number,
  lang: Lang
) {
  return new Intl.NumberFormat(
    lang === "fr"
      ? "fr-CA"
      : lang === "es"
        ? "es-CA"
        : "en-CA",
    {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(value);
}

export default function PaiementSoldePage() {
  const params =
    useSearchParams();

  const token =
    params.get("token")?.trim() ||
    "";

  const lang =
    normalizeLang(
      params.get("lang")
    );

  const copy = useMemo(
    () => ({
      fr: {
        title:
          "Paiement du solde",
        subtitle:
          "Vous pouvez régler votre solde par carte de façon sécurisée.",
        amount:
          "Solde à payer",
        invoice:
          "Facture",
        loading:
          "Préparation du paiement…",
        invalid:
          "Le lien de paiement est invalide ou a expiré.",
        config:
          "Le paiement par carte n’est pas disponible pour le moment.",
        back:
          "Vous pouvez aussi utiliser le virement Interac indiqué dans votre courriel.",
      },
      en: {
        title:
          "Balance payment",
        subtitle:
          "You can securely pay your balance by card.",
        amount:
          "Balance due",
        invoice:
          "Invoice",
        loading:
          "Preparing payment…",
        invalid:
          "The payment link is invalid or has expired.",
        config:
          "Card payment is not available right now.",
        back:
          "You can also use the Interac e-Transfer instructions in your email.",
      },
      es: {
        title:
          "Pago del saldo",
        subtitle:
          "Puede pagar de forma segura su saldo con tarjeta.",
        amount:
          "Saldo por pagar",
        invoice:
          "Factura",
        loading:
          "Preparando el pago…",
        invalid:
          "El enlace de pago no es válido o ha vencido.",
        config:
          "El pago con tarjeta no está disponible en este momento.",
        back:
          "También puede usar las instrucciones de transferencia Interac de su correo electrónico.",
      },
    }),
    []
  );

  const L = copy[lang];

  const [
    clientSecret,
    setClientSecret,
  ] = useState("");

  const [
    solde,
    setSolde,
  ] = useState(0);

  const [
    numeroFacture,
    setNumeroFacture,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      if (!token) {
        setError(
          L.invalid
        );
        setLoading(false);
        return;
      }

      if (
        !publishableKey ||
        !stripePromise
      ) {
        setError(
          L.config
        );
        setLoading(false);
        return;
      }

      try {
        const response =
          await fetch(
            "/api/checkout",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  mode:
                    "solde",
                  token,
                  lang,
                }),
            }
          );

        const data =
          (await response
            .json()
            .catch(
              () => ({})
            )) as CheckoutResponse;

        if (
          !response.ok ||
          !data.clientSecret
        ) {
          throw new Error(
            data.error ||
              L.invalid
          );
        }

        if (cancelled) {
          return;
        }

        setClientSecret(
          data.clientSecret
        );

        setSolde(
          Number(
            data.solde ?? 0
          )
        );

        setNumeroFacture(
          data.numeroFacture ||
            ""
        );

        setLoading(false);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : L.invalid
        );

        setLoading(false);
      }
    }

    void prepare();

    return () => {
      cancelled = true;
    };
  }, [
    token,
    lang,
    L.invalid,
    L.config,
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">

        <div className="mb-6 flex justify-center">
          <img
            src="/logo-cq.png"
            alt="ComptaNet Québec"
            className="h-20 w-auto object-contain"
          />
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

          <h1 className="text-2xl font-black text-slate-900">
            {L.title}
          </h1>

          <p className="mt-2 text-slate-600">
            {L.subtitle}
          </p>

          {numeroFacture && (
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <div>
                <strong>
                  {L.invoice} :
                </strong>{" "}
                {numeroFacture}
              </div>

              <div className="mt-1">
                <strong>
                  {L.amount} :
                </strong>{" "}
                {money(
                  solde,
                  lang
                )}
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-6 rounded-xl bg-blue-50 p-4 text-blue-900">
              {L.loading}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            stripePromise &&
            clientSecret && (
              <div className="mt-6">
                <EmbeddedCheckoutProvider
                  stripe={
                    stripePromise
                  }
                  options={{
                    clientSecret,
                  }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            )}

          <p className="mt-6 text-sm text-slate-500">
            {L.back}
          </p>

        </section>
      </div>
    </main>
  );
}
