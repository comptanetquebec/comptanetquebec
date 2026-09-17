import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type Plan = "essential" | "tax";
type CreditPack = "25" | "50" | "100";
type Lang = "fr" | "en" | "es";

type CheckoutBody = {
  plan?: unknown;
  credits?: unknown;
  lang?: unknown;
};

function normalizePlan(v: unknown): Plan | null {
  const value = String(v ?? "").trim().toLowerCase();

  if (value === "essential" || value === "tax") {
    return value;
  }

  return null;
}

function normalizeCredits(v: unknown): CreditPack | null {
  const value = String(v ?? "").trim();

  if (
    value === "25" ||
    value === "50" ||
    value === "100"
  ) {
    return value;
  }

  return null;
}

function normalizeLang(v: unknown): Lang {
  const value = String(v ?? "").trim().toLowerCase();

  if (
    value === "fr" ||
    value === "en" ||
    value === "es"
  ) {
    return value;
  }

  return "fr";
}

function safeOrigin(req: Request): string {
  const fromHeader = req.headers.get("origin");
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;

  return (fromHeader || fromEnv || "")
    .trim()
    .replace(/\/+$/, "");
}

function getPlanPriceId(plan: Plan): string {
  const priceId =
    plan === "essential"
      ? process.env.STRIPE_PRICE_BOOKKEEPING_ESSENTIAL
      : process.env.STRIPE_PRICE_BOOKKEEPING_TAX;

  if (!priceId) {
    throw new Error(
      `Missing Stripe Price ID for bookkeeping:${plan}`
    );
  }

  return priceId;
}

function getCreditsPriceId(
  credits: CreditPack
): string {
  let priceId: string | undefined;

  if (credits === "25") {
    priceId =
      process.env.STRIPE_PRICE_BOOKKEEPING_CREDITS_25;
  }

  if (credits === "50") {
    priceId =
      process.env.STRIPE_PRICE_BOOKKEEPING_CREDITS_50;
  }

  if (credits === "100") {
    priceId =
      process.env.STRIPE_PRICE_BOOKKEEPING_CREDITS_100;
  }

  if (!priceId) {
    throw new Error(
      `Missing Stripe Price ID for bookkeeping credits:${credits}`
    );
  }

  return priceId;
}

export async function POST(req: Request) {
  try {
    const stripeSecretKey =
      process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        {
          error: "Missing STRIPE_SECRET_KEY",
        },
        {
          status: 500,
        }
      );
    }

    const origin = safeOrigin(req);

    if (!origin) {
      return NextResponse.json(
        {
          error: "Missing site origin",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * L'utilisateur doit être connecté.
     */
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body = (await req
      .json()
      .catch(() => ({}))) as CheckoutBody;

    const plan = normalizePlan(body.plan);
    const credits = normalizeCredits(body.credits);
    const lang = normalizeLang(body.lang);

    /*
     * On doit recevoir soit :
     *
     * plan: "essential" | "tax"
     *
     * OU
     *
     * credits: "25" | "50" | "100"
     */
    if (!plan && !credits) {
      return NextResponse.json(
        {
          error: "Invalid bookkeeping checkout",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * On ne permet pas d'acheter un abonnement
     * et un bloc de transactions en même temps.
     */
    if (plan && credits) {
      return NextResponse.json(
        {
          error:
            "Choose either a bookkeeping plan or a credit pack",
        },
        {
          status: 400,
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    /*
     * =====================================================
     * BLOCS DE TRANSACTIONS
     * =====================================================
     *
     * +25
     * +50
     * +100
     *
     * Paiement ponctuel.
     */
    if (credits) {
      const priceId =
        getCreditsPriceId(credits);

      const returnUrl = new URL(
        "/tenue-de-livres",
        origin
      );

      returnUrl.searchParams.set(
        "lang",
        lang
      );

      returnUrl.searchParams.set(
        "credits_checkout",
        "success"
      );

      const session =
        await stripe.checkout.sessions.create({
          /*
           * Checkout intégré.
           */
          ui_mode: "embedded",

          /*
           * Achat unique.
           */
          mode: "payment",

          /*
           * Carte seulement.
           * Klarna est désactivé.
           * Stripe Link peut continuer à fonctionner
           * avec les paiements par carte.
           */
          payment_method_types: ["card"],

          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],

          /*
           * Stripe Tax.
           */
          automatic_tax: {
            enabled: true,
          },

          billing_address_collection:
            "required",

          customer_email:
            user.email || undefined,

          client_reference_id:
            user.id,

          metadata: {
            service: "bookkeeping",
            purchase_type: "credits",
            credits,
            user_id: user.id,
            lang,
          },

          return_url:
            returnUrl.toString(),
        });

      if (!session.client_secret) {
        return NextResponse.json(
          {
            error:
              "Stripe session missing client secret",
          },
          {
            status: 500,
          }
        );
      }

      return NextResponse.json(
        {
          clientSecret:
            session.client_secret,

          checkoutType: "credits",

          credits:
            Number(credits),
        },
        {
          status: 200,
        }
      );
    }

    /*
     * =====================================================
     * ABONNEMENT MENSUEL
     * =====================================================
     *
     * Essentiel : 19,99 $ / mois
     * TPS/TVQ   : 29,99 $ / mois
     *
     * AUCUN ESSAI GRATUIT.
     */
    if (!plan) {
      return NextResponse.json(
        {
          error:
            "Invalid bookkeeping plan",
        },
        {
          status: 400,
        }
      );
    }

    const priceId =
      getPlanPriceId(plan);

    const returnUrl = new URL(
      "/tenue-de-livres",
      origin
    );

    returnUrl.searchParams.set(
      "lang",
      lang
    );

    returnUrl.searchParams.set(
      "checkout",
      "success"
    );

    const session =
      await stripe.checkout.sessions.create({
        /*
         * Checkout intégré.
         */
        ui_mode: "embedded",

        /*
         * Abonnement mensuel.
         */
        mode: "subscription",

        /*
         * Carte seulement.
         * Klarna est désactivé.
         * Stripe Link peut continuer à fonctionner
         * avec les paiements par carte.
         */
        payment_method_types: ["card"],

        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],

        /*
         * Stripe Tax.
         */
        automatic_tax: {
          enabled: true,
        },

        billing_address_collection:
          "required",

        customer_email:
          user.email || undefined,

        client_reference_id:
          user.id,

        metadata: {
          service: "bookkeeping",
          purchase_type:
            "subscription",
          plan,
          user_id: user.id,
          lang,
        },

        /*
         * IMPORTANT :
         *
         * Aucun trial_period_days ici.
         * Le client paie immédiatement.
         */
        subscription_data: {
          metadata: {
            service: "bookkeeping",
            purchase_type:
              "subscription",
            plan,
            user_id: user.id,
          },
        },

        return_url:
          returnUrl.toString(),
      });

    if (!session.client_secret) {
      return NextResponse.json(
        {
          error:
            "Stripe session missing client secret",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        clientSecret:
          session.client_secret,

        checkoutType:
          "subscription",
      },
      {
        status: 200,
      }
    );
  } catch (e: unknown) {
    const message =
      e instanceof Error
        ? e.message
        : "Bookkeeping checkout error";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}
