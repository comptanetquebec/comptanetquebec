import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

type Plan = "essential" | "tax";

function jsonOk() {
  return NextResponse.json({ received: true }, { status: 200 });
}

function jsonErr(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function mustEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function supabaseAdmin(): SupabaseClient {
  return createClient(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

function getString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const clean = value.trim();

  return clean ? clean : null;
}

function normalizePlan(value: unknown): Plan | null {
  const plan = String(value ?? "")
    .trim()
    .toLowerCase();

  if (plan === "essential" || plan === "tax") {
    return plan;
  }

  return null;
}

function monthlyLimit(plan: Plan): number {
  /*
   * Les forfaits mensuels donnent accès au logiciel.
   * Les analyses supplémentaires sont comptabilisées
   * séparément avec bonus_credits.
   *
   * On pourra ajuster ces limites selon les règles
   * exactes de tes deux forfaits.
   */
  return plan === "tax" ? 0 : 0;
}

function unixToIso(value: number | null | undefined): string | null {
  if (typeof value !== "number") return null;

  return new Date(value * 1000).toISOString();
}

async function saveSubscription(
  sb: SupabaseClient,
  subscription: Stripe.Subscription
) {
  const userId = getString(subscription.metadata?.user_id);
  const plan = normalizePlan(subscription.metadata?.plan);

  /*
   * On ne traite QUE les abonnements créés
   * par la section Tenue de livres.
   */
  if (
    subscription.metadata?.service !== "bookkeeping" ||
    !userId ||
    !plan
  ) {
    return;
  }

  const item = subscription.items.data[0];

  const priceId = item?.price?.id || null;

  /*
   * Stripe récent expose les périodes sur les
   * subscription items.
   */
  const currentPeriodStart =
    item && "current_period_start" in item
      ? unixToIso(
          (item as Stripe.SubscriptionItem & {
            current_period_start?: number;
          }).current_period_start
        )
      : null;

  const currentPeriodEnd =
    item && "current_period_end" in item
      ? unixToIso(
          (item as Stripe.SubscriptionItem & {
            current_period_end?: number;
          }).current_period_end
        )
      : null;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id || null;

  const values = {
    user_id: userId,
    plan,
    status: subscription.status,
    monthly_limit: monthlyLimit(plan),

    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,

    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,

    cancel_at_period_end:
      subscription.cancel_at_period_end,

    updated_at: new Date().toISOString(),
  };

  const { error } = await sb
    .from("bookkeeping_subscriptions")
    .upsert(values, {
      onConflict: "user_id",
    });

  if (error) {
    throw new Error(error.message);
  }
}

async function retrieveAndSaveSubscription(
  sb: SupabaseClient,
  subscriptionId: string
) {
  const subscription =
    await stripe.subscriptions.retrieve(subscriptionId);

  await saveSubscription(sb, subscription);
}

export async function POST(req: NextRequest) {
  try {
    const signature =
      req.headers.get("stripe-signature");

    if (!signature) {
      return jsonErr(
        "Missing stripe-signature",
        400
      );
    }

    /*
     * IMPORTANT :
     * ce webhook utilise son PROPRE secret.
     * Il ne partage pas le secret du webhook impôts.
     */
    const webhookSecret =
      process.env.STRIPE_BOOKKEEPING_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return jsonErr(
        "Missing STRIPE_BOOKKEEPING_WEBHOOK_SECRET",
        500
      );
    }

    const body = await req.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Invalid Stripe signature";

      return jsonErr(message, 400);
    }

    const sb = supabaseAdmin();

    switch (event.type) {
      /*
       * Premier paiement / création de l'abonnement.
       */
      case "checkout.session.completed": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        if (
          session.metadata?.service !== "bookkeeping"
        ) {
          break;
        }

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (subscriptionId) {
          await retrieveAndSaveSubscription(
            sb,
            subscriptionId
          );
        }

        break;
      }

      /*
       * Changement de forfait, renouvellement,
       * annulation programmée, etc.
       */
      case "customer.subscription.updated":
      case "customer.subscription.created":
      case "customer.subscription.deleted": {
        const subscription =
          event.data.object as Stripe.Subscription;

        await saveSubscription(
          sb,
          subscription
        );

        break;
      }

      default:
        break;
    }

    return jsonOk();
  } catch (error: unknown) {
    /*
     * 500 permet à Stripe de réessayer
     * si une opération échoue temporairement.
     */
    const message =
      error instanceof Error
        ? error.message
        : "Bookkeeping webhook error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
