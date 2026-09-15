import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await supabaseServer();

    // 1. Vérifier l'utilisateur connecté
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          authenticated: false,
          active: false,
          subscription: null,
        },
        { status: 401 }
      );
    }

    // 2. Lire uniquement l'abonnement de cet utilisateur
    const { data, error } = await supabase
      .from("bookkeeping_subscriptions")
      .select(
        `
          plan,
          status,
          monthly_limit,
          monthly_used,
          bonus_credits,
          stripe_customer_id,
          stripe_subscription_id,
          stripe_price_id,
          current_period_start,
          current_period_end,
          cancel_at_period_end
        `
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    // Aucun abonnement
    if (!data) {
      return NextResponse.json(
        {
          authenticated: true,
          active: false,
          subscription: null,
        },
        { status: 200 }
      );
    }

    /*
     * Stripe :
     * active   = abonnement actif
     * trialing = période d'essai active, si utilisée un jour
     */
    const active =
      data.status === "active" ||
      data.status === "trialing";

    return NextResponse.json(
      {
        authenticated: true,
        active,
        subscription: {
          plan: data.plan,
          status: data.status,

          monthlyLimit: data.monthly_limit,
          monthlyUsed: data.monthly_used,
          bonusCredits: data.bonus_credits,

          currentPeriodStart: data.current_period_start,
          currentPeriodEnd: data.current_period_end,

          cancelAtPeriodEnd: data.cancel_at_period_end,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Subscription status error";

    return NextResponse.json(
      {
        error: message,
        authenticated: false,
        active: false,
        subscription: null,
      },
      { status: 500 }
    );
  }
}
