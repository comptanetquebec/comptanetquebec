import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type Plan = "essential" | "tax";
type Lang = "fr" | "en" | "es";

type CheckoutBody = {
  plan?: unknown;
  lang?: unknown;
};

function normalizePlan(v: unknown): Plan | null {
  const value = String(v ?? "").trim().toLowerCase();

  if (value === "essential" || value === "tax") {
    return value;
  }

  return null;
}

function normalizeLang(v: unknown): Lang {
  const value = String(v ?? "").trim().toLowerCase();

  if (value === "fr" || value === "en" || value === "es") {
    return value;
  }

  return "fr";
}

function safeOrigin(req: Request): string {
  const fromHeader = req.headers.get("origin");
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;

  return (fromHeader || fromEnv || "").trim().replace(/\/+$/, "");
}

function getPriceId(plan: Plan): string {
  const priceId =
    plan === "essential"
      ? process.env.STRIPE_PRICE_BOOKKEEPING_ESSENTIAL
      : process.env.STRIPE_PRICE_BOOKKEEPING_TAX;

  if (!priceId) {
    throw new Error(`Missing Stripe Price ID for bookkeeping:${plan}`);
  }

  return priceId;
}

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const origin = safeOrigin(req);

    if (!origin) {
      return NextResponse.json(
        { error: "Missing site origin" },
        { status: 500 }
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
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as CheckoutBody;

    const plan = normalizePlan(body.plan);
    const lang = normalizeLang(body.lang);

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid bookkeeping plan" },
        { status: 400 }
      );
    }

    const priceId = getPriceId(plan);
    const stripe = new Stripe(stripeSecretKey);

    const returnUrl = new URL("/tenue-de-livres", origin);
    returnUrl.searchParams.set("lang", lang);
    returnUrl.searchParams.set("checkout", "success");

    const session = await stripe.checkout.sessions.create({
      /*
       * Paiement intégré dans ComptaNet Québec.
       */
      ui_mode: "embedded",

      /*
       * Abonnement mensuel.
       */
      mode: "subscription",

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      /*
       * STRIPE TAX
       *
       * Stripe calcule automatiquement les taxes applicables
       * selon l'adresse du client et les inscriptions fiscales
       * configurées dans Stripe Tax.
       */
      automatic_tax: {
        enabled: true,
      },

      /*
       * Permet à Stripe de demander l'adresse nécessaire
       * au calcul des taxes.
       */
      billing_address_collection: "required",

      /*
       * On rattache le paiement à l'utilisateur Supabase.
       */
      customer_email: user.email || undefined,

      client_reference_id: user.id,

      metadata: {
        service: "bookkeeping",
        plan,
        user_id: user.id,
        lang,
      },

      /*
       * ABONNEMENT TENUE DE LIVRES
       *
       * TEMPORAIRE POUR NOTRE TEST :
       * 2 jours d'essai gratuit.
       *
       * Après validation, supprimer uniquement :
       *
       * trial_period_days: 2,
       */
      subscription_data: {
        trial_period_days: 2,

        metadata: {
          service: "bookkeeping",
          plan,
          user_id: user.id,
        },
      },

      return_url: returnUrl.toString(),
    });

    if (!session.client_secret) {
      return NextResponse.json(
        { error: "Stripe session missing client secret" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        clientSecret: session.client_secret,
      },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Bookkeeping checkout error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
