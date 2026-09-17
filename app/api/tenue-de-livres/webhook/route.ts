import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || ""
);

type Plan = "essential" | "tax";

function jsonOk() {
  return NextResponse.json(
    { received: true },
    { status: 200 }
  );
}

function jsonErr(
  message: string,
  status = 400
) {
  return NextResponse.json(
    { error: message },
    { status }
  );
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

function getString(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const clean = value.trim();

  return clean ? clean : null;
}

function normalizePlan(
  value: unknown
): Plan | null {
  const plan = String(value ?? "")
    .trim()
    .toLowerCase();

  if (
    plan === "essential" ||
    plan === "tax"
  ) {
    return plan;
  }

  return null;
}

function monthlyLimit(
  plan: Plan
): number {
  /*
   * Essentiel :
   * 100 analyses incluses par mois.
   *
   * TPS/TVQ :
   * 200 analyses incluses par mois.
   */
  return plan === "tax" ? 200 : 100;
}

function normalizeCredits(
  value: unknown
): number | null {
  const credits = Number(value);

  if (
    credits === 25 ||
    credits === 50 ||
    credits === 100
  ) {
    return credits;
  }

  return null;
}

function unixToIso(
  value: number | null | undefined
): string | null {
  if (typeof value !== "number") {
    return null;
  }

  return new Date(
    value * 1000
  ).toISOString();
}

/*
 * =========================================================
 * SAUVEGARDE / MISE À JOUR DE L'ABONNEMENT
 * =========================================================
 */
async function saveSubscription(
  sb: SupabaseClient,
  subscription: Stripe.Subscription
) {
  const userId = getString(
    subscription.metadata?.user_id
  );

  const plan = normalizePlan(
    subscription.metadata?.plan
  );

  /*
   * On traite uniquement
   * la Tenue de livres.
   */
  if (
    subscription.metadata?.service !==
      "bookkeeping" ||
    !userId ||
    !plan
  ) {
    return;
  }

  const item =
    subscription.items.data[0];

  const priceId =
    item?.price?.id || null;

  const currentPeriodStart =
    item &&
    "current_period_start" in item
      ? unixToIso(
          (
            item as Stripe.SubscriptionItem & {
              current_period_start?: number;
            }
          ).current_period_start
        )
      : null;

  const currentPeriodEnd =
    item &&
    "current_period_end" in item
      ? unixToIso(
          (
            item as Stripe.SubscriptionItem & {
              current_period_end?: number;
            }
          ).current_period_end
        )
      : null;

  const customerId =
    typeof subscription.customer ===
    "string"
      ? subscription.customer
      : subscription.customer?.id ||
        null;

  /*
   * On vérifie si une ligne existe déjà.
   *
   * Important :
   * on ne veut surtout pas écraser
   * bonus_credits.
   */
  const {
    data: existing,
    error: existingError,
  } = await sb
    .from("bookkeeping_subscriptions")
    .select(
      "user_id, monthly_used, bonus_credits, current_period_start"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      existingError.message
    );
  }

  /*
   * monthly_used :
   *
   * Si Stripe nous indique une nouvelle
   * période mensuelle, on remet le compteur
   * mensuel à zéro.
   *
   * Les bonus, eux, ne bougent jamais ici.
   */
  let monthlyUsed =
    Number(existing?.monthly_used ?? 0);

  const oldPeriodStart =
    existing?.current_period_start
      ? new Date(
          existing.current_period_start
        ).getTime()
      : null;

  const newPeriodStart =
    currentPeriodStart
      ? new Date(
          currentPeriodStart
        ).getTime()
      : null;

  if (
    existing &&
    oldPeriodStart !== null &&
    newPeriodStart !== null &&
    oldPeriodStart !== newPeriodStart
  ) {
    monthlyUsed = 0;
  }

  const bonusCredits =
    Number(
      existing?.bonus_credits ?? 0
    );

  const values = {
    user_id: userId,

    plan,

    status:
      subscription.status,

    monthly_limit:
      monthlyLimit(plan),

    monthly_used:
      monthlyUsed,

    /*
     * IMPORTANT :
     * Les crédits supplémentaires
     * sont conservés.
     */
    bonus_credits:
      bonusCredits,

    stripe_customer_id:
      customerId,

    stripe_subscription_id:
      subscription.id,

    stripe_price_id:
      priceId,

    current_period_start:
      currentPeriodStart,

    current_period_end:
      currentPeriodEnd,

    cancel_at_period_end:
      subscription.cancel_at_period_end,

    updated_at:
      new Date().toISOString(),
  };

  const { error } = await sb
    .from("bookkeeping_subscriptions")
    .upsert(values, {
      onConflict: "user_id",
    });

  if (error) {
    throw new Error(
      error.message
    );
  }
}

/*
 * =========================================================
 * RÉCUPÉRER UN ABONNEMENT STRIPE
 * =========================================================
 */
async function retrieveAndSaveSubscription(
  sb: SupabaseClient,
  subscriptionId: string
) {
  const subscription =
    await stripe.subscriptions.retrieve(
      subscriptionId
    );

  await saveSubscription(
    sb,
    subscription
  );
}

/*
 * =========================================================
 * AJOUTER UN ACHAT DE CRÉDITS
 * =========================================================
 */
async function addCreditPurchase(
  sb: SupabaseClient,
  session: Stripe.Checkout.Session
) {
  /*
   * Seulement les achats de crédits
   * Tenue de livres.
   */
  if (
    session.metadata?.service !==
      "bookkeeping" ||
    session.metadata?.purchase_type !==
      "credits"
  ) {
    return;
  }

  const userId =
    getString(
      session.metadata?.user_id
    ) ||
    getString(
      session.client_reference_id
    );

  const credits =
    normalizeCredits(
      session.metadata?.credits
    );

  if (!userId || !credits) {
    throw new Error(
      "Invalid bookkeeping credit purchase metadata"
    );
  }

  /*
   * Un achat ponctuel doit être payé
   * avant d'ajouter les crédits.
   */
  if (
    session.payment_status !== "paid"
  ) {
    return;
  }

  /*
   * Vérification anti-doublon.
   *
   * Stripe peut envoyer le même webhook
   * plusieurs fois.
   */
  const {
    data: existingPurchase,
    error: purchaseCheckError,
  } = await sb
    .from(
      "bookkeeping_credit_purchases"
    )
    .select("id")
    .eq(
      "stripe_session_id",
      session.id
    )
    .maybeSingle();

  if (purchaseCheckError) {
    throw new Error(
      purchaseCheckError.message
    );
  }

  /*
   * Déjà traité :
   * on ne crédite surtout pas une
   * deuxième fois.
   */
  if (existingPurchase) {
    return;
  }

  /*
   * Récupérer l'abonnement / solde
   * actuel du client.
   */
  const {
    data: subscriptionRow,
    error: subscriptionError,
  } = await sb
    .from(
      "bookkeeping_subscriptions"
    )
    .select(
      "user_id, bonus_credits"
    )
    .eq(
      "user_id",
      userId
    )
    .maybeSingle();

  if (subscriptionError) {
    throw new Error(
      subscriptionError.message
    );
  }

  if (!subscriptionRow) {
    throw new Error(
      "Bookkeeping subscription not found for credit purchase"
    );
  }

  const currentBonus =
    Number(
      subscriptionRow.bonus_credits ??
        0
    );

  const newBonus =
    currentBonus + credits;

  /*
   * Ajouter les crédits au solde.
   */
  const {
    error: bonusUpdateError,
  } = await sb
    .from(
      "bookkeeping_subscriptions"
    )
    .update({
      bonus_credits:
        newBonus,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "user_id",
      userId
    );

  if (bonusUpdateError) {
    throw new Error(
      bonusUpdateError.message
    );
  }

  /*
   * Enregistrer l'achat.
   *
   * Cette table sert aussi de preuve
   * que cette session Stripe a déjà
   * été traitée.
   */
  const {
    error: purchaseInsertError,
  } = await sb
    .from(
      "bookkeeping_credit_purchases"
    )
    .insert({
      user_id:
        userId,

      stripe_session_id:
        session.id,

      credits,

      amount_total:
        session.amount_total ?? 0,

      currency:
        session.currency ?? "cad",
    });

  if (purchaseInsertError) {
    /*
     * Si l'historique ne peut pas être
     * enregistré, on remet le solde
     * précédent pour éviter un crédit
     * sans trace d'achat.
     */
    await sb
      .from(
        "bookkeeping_subscriptions"
      )
      .update({
        bonus_credits:
          currentBonus,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "user_id",
        userId
      );

    throw new Error(
      purchaseInsertError.message
    );
  }
}

/*
 * =========================================================
 * WEBHOOK
 * =========================================================
 */
export async function POST(
  req: NextRequest
) {
  try {
    const signature =
      req.headers.get(
        "stripe-signature"
      );

    if (!signature) {
      return jsonErr(
        "Missing stripe-signature",
        400
      );
    }

    /*
     * Webhook réservé à la
     * Tenue de livres.
     */
    const webhookSecret =
      process.env
        .STRIPE_BOOKKEEPING_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return jsonErr(
        "Missing STRIPE_BOOKKEEPING_WEBHOOK_SECRET",
        500
      );
    }

    const body =
      await req.text();

    let event: Stripe.Event;

    try {
      event =
        stripe.webhooks.constructEvent(
          body,
          signature,
          webhookSecret
        );
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : "Invalid Stripe signature";

      return jsonErr(
        message,
        400
      );
    }

    const sb =
      supabaseAdmin();

    switch (event.type) {
      /*
       * ===================================================
       * CHECKOUT TERMINÉ
       * ===================================================
       */
      case "checkout.session.completed": {
        const session =
          event.data
            .object as Stripe.Checkout.Session;

        if (
          session.metadata?.service !==
          "bookkeeping"
        ) {
          break;
        }

        /*
         * -----------------------------------------------
         * ACHAT +25 / +50 / +100
         * -----------------------------------------------
         */
        if (
          session.metadata
            ?.purchase_type ===
          "credits"
        ) {
          await addCreditPurchase(
            sb,
            session
          );

          break;
        }

        /*
         * -----------------------------------------------
         * ABONNEMENT
         * -----------------------------------------------
         */
        const subscriptionId =
          typeof session.subscription ===
          "string"
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
       * ===================================================
       * ABONNEMENT CRÉÉ / MODIFIÉ / ANNULÉ
       * ===================================================
       */
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription =
          event.data
            .object as Stripe.Subscription;

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
  } catch (
    error: unknown
  ) {
    /*
     * 500 permet à Stripe de réessayer
     * si une opération échoue.
     */
    const message =
      error instanceof Error
        ? error.message
        : "Bookkeeping webhook error";

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
