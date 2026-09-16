import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type Plan = "essential" | "tax";

type ChangePlanBody = {
  plan?: unknown;
};

function normalizePlan(value: unknown): Plan | null {
  const plan = String(value ?? "")
    .trim()
    .toLowerCase();

  if (plan === "essential" || plan === "tax") {
    return plan;
  }

  return null;
}

function getPriceId(plan: Plan): string {
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

function getSubscriptionPeriod(
  subscription: Stripe.Subscription
): {
  start: number;
  end: number;
} {
  const item = subscription.items.data[0];

  if (!item) {
    throw new Error(
      "Stripe subscription has no subscription item"
    );
  }

  const itemWithPeriod = item as Stripe.SubscriptionItem & {
    current_period_start?: number;
    current_period_end?: number;
  };

  const start = itemWithPeriod.current_period_start;
  const end = itemWithPeriod.current_period_end;

  if (
    typeof start !== "number" ||
    typeof end !== "number"
  ) {
    throw new Error(
      "Stripe subscription period is unavailable"
    );
  }

  return { start, end };
}

async function releaseExistingSchedule(
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  const scheduleId =
    typeof subscription.schedule === "string"
      ? subscription.schedule
      : subscription.schedule?.id;

  if (!scheduleId) {
    return;
  }

  /*
   * Si un ancien downgrade est déjà programmé,
   * on libère d'abord le schedule.
   *
   * L'abonnement Stripe continue d'exister.
   */
  await stripe.subscriptionSchedules.release(
    scheduleId,
    {
      preserve_cancel_date: true,
    }
  );
}

async function upgradeToTax(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  userId: string
) {
  /*
   * Un éventuel downgrade futur est annulé avant
   * d'effectuer l'upgrade.
   */
  await releaseExistingSchedule(
    stripe,
    subscription
  );

  /*
   * On recharge l'abonnement après la libération
   * du schedule afin d'avoir son état Stripe actuel.
   */
  const freshSubscription =
    await stripe.subscriptions.retrieve(
      subscription.id
    );

  const item = freshSubscription.items.data[0];

  if (!item) {
    throw new Error(
      "Stripe subscription has no subscription item"
    );
  }

  const taxPriceId = getPriceId("tax");

  /*
   * UPGRADE IMMÉDIAT :
   *
   * - on conserve le même abonnement;
   * - on remplace le prix Essential par Taxes;
   * - always_invoice demande à Stripe de calculer
   *   le prorata et de facturer immédiatement;
   * - metadata.plan devient tax pour que le webhook
   *   enregistre correctement le forfait dans Supabase.
   */
  const updated =
    await stripe.subscriptions.update(
      freshSubscription.id,
      {
        items: [
          {
            id: item.id,
            price: taxPriceId,
            quantity: item.quantity ?? 1,
          },
        ],

        proration_behavior: "always_invoice",

        metadata: {
          ...freshSubscription.metadata,
          service: "bookkeeping",
          plan: "tax",
          user_id: userId,
        },
      }
    );

  return {
    action: "upgraded" as const,
    plan: "tax" as const,
    effective: "immediate" as const,
    subscriptionId: updated.id,
    status: updated.status,
  };
}

async function downgradeToEssential(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  userId: string
) {
  const essentialPriceId =
    getPriceId("essential");

  /*
   * Si l'abonnement est déjà géré par un schedule,
   * on le libère pour reconstruire un schedule propre.
   */
  await releaseExistingSchedule(
    stripe,
    subscription
  );

  const freshSubscription =
    await stripe.subscriptions.retrieve(
      subscription.id
    );

  const currentItem =
    freshSubscription.items.data[0];

  if (!currentItem) {
    throw new Error(
      "Stripe subscription has no subscription item"
    );
  }

  const currentPriceId =
    currentItem.price.id;

  const period =
    getSubscriptionPeriod(freshSubscription);

  /*
   * Stripe demande deux appels lorsqu'on transforme
   * un abonnement existant en Subscription Schedule :
   *
   * 1. créer le schedule depuis l'abonnement;
   * 2. modifier les phases.
   */
  const schedule =
    await stripe.subscriptionSchedules.create({
      from_subscription: freshSubscription.id,
    });

  /*
   * Phase 1 :
   * conserver le forfait Taxes jusqu'à la fin
   * de la période déjà payée.
   *
   * Phase 2 :
   * passer à Essential à la date de renouvellement.
   *
   * end_behavior: release signifie qu'après la phase
   * Essential, l'abonnement continue normalement
   * au prix Essential.
   */
  const updatedSchedule =
    await stripe.subscriptionSchedules.update(
      schedule.id,
      {
        end_behavior: "release",

        phases: [
          {
            start_date: period.start,
            end_date: period.end,

            items: [
              {
                price: currentPriceId,
                quantity: currentItem.quantity ?? 1,
              },
            ],

            metadata: {
              ...freshSubscription.metadata,
              service: "bookkeeping",
              plan: "tax",
              user_id: userId,
            },

            proration_behavior: "none",
          },

          {
            start_date: period.end,

            items: [
              {
                price: essentialPriceId,
                quantity: currentItem.quantity ?? 1,
              },
            ],

            metadata: {
              ...freshSubscription.metadata,
              service: "bookkeeping",
              plan: "essential",
              user_id: userId,
            },

            /*
             * Une seule période Essential est nécessaire
             * dans le schedule. À la fin, Stripe libère
             * l'abonnement qui continue alors au prix
             * Essential grâce à end_behavior: release.
             */
            iterations: 1,

            proration_behavior: "none",
          },
        ],
      }
    );

  return {
    action: "downgrade_scheduled" as const,
    plan: "tax" as const,
    nextPlan: "essential" as const,
    effective: "period_end" as const,
    effectiveAt: new Date(
      period.end * 1000
    ).toISOString(),
    subscriptionId: freshSubscription.id,
    scheduleId: updatedSchedule.id,
  };
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
        { status: 500 }
      );
    }

    const supabase =
      await supabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = (await req
      .json()
      .catch(() => ({}))) as ChangePlanBody;

    const targetPlan =
      normalizePlan(body.plan);

    if (!targetPlan) {
      return NextResponse.json(
        {
          error: "Invalid bookkeeping plan",
        },
        { status: 400 }
      );
    }

    /*
     * On ne fait confiance qu'à l'abonnement
     * enregistré pour l'utilisateur connecté.
     */
    const {
      data: subscriptionRow,
      error: subscriptionError,
    } = await supabase
      .from("bookkeeping_subscriptions")
      .select(
        `
          plan,
          status,
          stripe_subscription_id
        `
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      throw new Error(
        subscriptionError.message
      );
    }

    if (
      !subscriptionRow ||
      !subscriptionRow.stripe_subscription_id
    ) {
      return NextResponse.json(
        {
          error:
            "No bookkeeping subscription found",
        },
        { status: 404 }
      );
    }

    const currentPlan =
      normalizePlan(subscriptionRow.plan);

    if (!currentPlan) {
      return NextResponse.json(
        {
          error:
            "Invalid current bookkeeping plan",
        },
        { status: 409 }
      );
    }

    if (
      subscriptionRow.status !== "active" &&
      subscriptionRow.status !== "trialing"
    ) {
      return NextResponse.json(
        {
          error:
            "Bookkeeping subscription is not active",
        },
        { status: 409 }
      );
    }

    if (currentPlan === targetPlan) {
      return NextResponse.json(
        {
          ok: true,
          action: "unchanged",
          plan: currentPlan,
        },
        { status: 200 }
      );
    }

    const stripe =
      new Stripe(stripeSecretKey);

    const subscription =
      await stripe.subscriptions.retrieve(
        subscriptionRow.stripe_subscription_id
      );

    /*
     * Sécurité :
     * cette route ne doit jamais modifier un abonnement
     * appartenant à un autre service ou utilisateur.
     */
    if (
      subscription.metadata?.service !==
        "bookkeeping" ||
      subscription.metadata?.user_id !== user.id
    ) {
      return NextResponse.json(
        {
          error:
            "Stripe subscription does not match the authenticated user",
        },
        { status: 403 }
      );
    }

    /*
     * ESSENTIAL -> TAX
     * Upgrade immédiat avec prorata facturé.
     */
    if (
      currentPlan === "essential" &&
      targetPlan === "tax"
    ) {
      const result =
        await upgradeToTax(
          stripe,
          subscription,
          user.id
        );

      return NextResponse.json(
        {
          ok: true,
          ...result,
        },
        { status: 200 }
      );
    }

    /*
     * TAX -> ESSENTIAL
     * Downgrade programmé à la fin de la période.
     */
    if (
      currentPlan === "tax" &&
      targetPlan === "essential"
    ) {
      const result =
        await downgradeToEssential(
          stripe,
          subscription,
          user.id
        );

      return NextResponse.json(
        {
          ok: true,
          ...result,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Unsupported bookkeeping plan change",
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Bookkeeping plan change error";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
