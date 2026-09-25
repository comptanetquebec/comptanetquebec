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

  const showInterac =
    params.get("view") ===
    "interac";

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
          "Vous pouvez aussi choisir le paiement par carte ci-dessous.",
        interacTitle:
          "Payer par virement Interac",
        sendAmount:
          "Montant à envoyer",
        sendTo:
          "Envoyer à l’un des deux",
        email:
          "Courriel",
        phone:
          "Téléphone",
        autodeposit:
          "Dépôt automatique activé — aucune question de sécurité.",
        message:
          "Message du virement",
        copy:
          "Copier",
        copied:
          "Copié !",
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
          "You can also choose card payment below.",
        interacTitle:
          "Pay by Interac e-Transfer",
        sendAmount:
          "Amount to send",
        sendTo:
          "Send to either one",
        email:
          "Email",
        phone:
          "Phone",
        autodeposit:
          "Autodeposit enabled — no security question.",
        message:
          "Transfer message",
        copy:
          "Copy",
        copied:
          "Copied!",
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
          "También puede elegir el pago con tarjeta abajo.",
        interacTitle:
          "Pagar por transferencia Interac",
        sendAmount:
          "Monto a enviar",
        sendTo:
          "Enviar a uno de los dos",
        email:
          "Correo",
        phone:
          "Teléfono",
        autodeposit:
          "Depósito automático activado — sin pregunta de seguridad.",
        message:
          "Mensaje de la transferencia",
        copy:
          "Copiar",
        copied:
          "¡Copiado!",
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
    cqId,
    setCqId,
  ] = useState("");

  const [
    copied,
    setCopied,
  ] = useState<
    "amount" | "email" | "phone" | "cq" | ""
  >("");

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

        setCqId(
          data.cqId ||
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

  async function copyValue(
    value: string,
    field:
      | "amount"
      | "email"
      | "phone"
      | "cq"
  ) {
    try {
      await navigator.clipboard
        .writeText(value);

      setCopied(field);

      window.setTimeout(
        () => {
          setCopied("");
        },
        1800
      );
    } catch {
      setCopied("");
    }
  }

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
            {showInterac
              ? L.interacTitle
              : L.subtitle}
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
            showInterac && (
              <div
                id="interac"
                className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5"
              >
                <h2 className="text-xl font-black text-slate-900">
                  {L.interacTitle}
                </h2>

                <div className="mt-4 space-y-5 text-slate-800">
                  <div>
                    <div className="text-sm font-semibold text-slate-600">
                      {L.sendAmount}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <strong className="text-xl">
                        {money(
                          solde,
                          lang
                        )}
                      </strong>

                      <button
                        type="button"
                        onClick={() =>
                          void copyValue(
                            solde.toFixed(
                              2
                            ),
                            "amount"
                          )
                        }
                        className="rounded-lg border border-amber-400 bg-white px-3 py-2 text-sm font-bold text-slate-800"
                      >
                        {copied ===
                        "amount"
                          ? L.copied
                          : L.copy}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-700">
                      {L.sendTo}
                    </div>

                    <div className="mt-3 rounded-xl bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {L.email}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <strong>
                          comptanetquebec@gmail.com
                        </strong>

                        <button
                          type="button"
                          onClick={() =>
                            void copyValue(
                              "comptanetquebec@gmail.com",
                              "email"
                            )
                          }
                          className="rounded-lg border border-amber-400 bg-white px-3 py-2 text-sm font-bold text-slate-800"
                        >
                          {copied ===
                          "email"
                            ? L.copied
                            : L.copy}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {L.phone}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <strong>
                          581-985-2599
                        </strong>

                        <button
                          type="button"
                          onClick={() =>
                            void copyValue(
                              "5819852599",
                              "phone"
                            )
                          }
                          className="rounded-lg border border-amber-400 bg-white px-3 py-2 text-sm font-bold text-slate-800"
                        >
                          {copied ===
                          "phone"
                            ? L.copied
                            : L.copy}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border-2 border-red-200 bg-white p-4">
                    <div className="text-sm font-bold text-red-700">
                      {L.message}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <strong className="text-xl">
                        {cqId || "—"}
                      </strong>

                      {cqId && (
                        <button
                          type="button"
                          onClick={() =>
                            void copyValue(
                              cqId,
                              "cq"
                            )
                          }
                          className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-bold text-slate-800"
                        >
                          {copied ===
                          "cq"
                            ? L.copied
                            : L.copy}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-700">
                    {L.autodeposit}
                  </p>
                </div>
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
