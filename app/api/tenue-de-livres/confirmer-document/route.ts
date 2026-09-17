import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type ExtractedTransaction = {
  entry_type: "income" | "expense" | "unknown";
  transaction_date: string | null;
  source: string | null;
  description: string | null;
  reference: string | null;
  subtotal: number | null;
  gst: number | null;
  qst: number | null;
  total: number | null;
  payment_method:
    | "transfer"
    | "card"
    | "cash"
    | "cheque"
    | "platform"
    | "other"
    | "unknown";
  confidence: number;
  notes: string[];
};

type Extraction = {
  relevant: boolean;
  transactions: ExtractedTransaction[];
  document_notes: string[];
};

type ConfirmBody = {
  documentId?: unknown;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function cleanId(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const id = value.trim();

  return id || null;
}

function positiveInt(value: unknown): number {
  const n = Number(value);

  if (!Number.isFinite(n)) return 0;

  return Math.max(0, Math.trunc(n));
}

export async function POST(req: Request) {
  try {
    /*
     * 1. Utilisateur connecté
     */
    const authSupabase = await supabaseServer();

    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /*
     * 2. Document demandé
     */
    const body = (await req.json().catch(() => ({}))) as ConfirmBody;
    const documentId = cleanId(body.documentId);

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId" },
        { status: 400 }
      );
    }

    const sb = adminClient();

    /*
     * 3. Charger le document + entreprise.
     *
     * On vérifie ensuite que l'entreprise appartient
     * réellement à l'utilisateur connecté.
     */
    const { data: document, error: documentError } = await sb
      .from("bookkeeping_documents")
      .select(
        `
          id,
          business_id,
          storage_path,
          original_file_name,
          mime_type,
          status,
          extraction
        `
      )
      .eq("id", documentId)
      .maybeSingle();

    if (documentError) {
      throw new Error(documentError.message);
    }

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const { data: business, error: businessError } = await sb
      .from("bookkeeping_businesses")
      .select("id, owner_id")
      .eq("id", document.business_id)
      .maybeSingle();

    if (businessError) {
      throw new Error(businessError.message);
    }

    if (!business || business.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    /*
     * Un document confirmé ne doit jamais être
     * confirmé une deuxième fois.
     */
    if (document.status === "confirmed") {
      return NextResponse.json(
        {
          error: "Document already confirmed",
          code: "ALREADY_CONFIRMED",
        },
        { status: 409 }
      );
    }

    if (document.status !== "ready") {
      return NextResponse.json(
        {
          error: "Document is not ready",
          code: "NOT_READY",
        },
        { status: 400 }
      );
    }

    const extraction = document.extraction as Extraction | null;
    const items = extraction?.transactions ?? [];

    /*
     * 4. Vérifier les transactions.
     */
    const complete =
      Boolean(extraction?.relevant) &&
      items.length > 0 &&
      items.every(
        (item) =>
          item.entry_type !== "unknown" &&
          Boolean(item.transaction_date) &&
          Boolean(item.source) &&
          item.subtotal !== null
      );

    if (!complete) {
      return NextResponse.json(
        {
          error: "Incomplete transactions",
          code: "INCOMPLETE",
        },
        { status: 400 }
      );
    }

    const transactionCount = items.length;

    /*
     * 5. Charger l'abonnement.
     */
    const { data: subscription, error: subscriptionError } = await sb
      .from("bookkeeping_subscriptions")
      .select(
        `
          user_id,
          plan,
          status,
          monthly_limit,
          monthly_used,
          bonus_credits
        `
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      throw new Error(subscriptionError.message);
    }

    if (!subscription) {
      return NextResponse.json(
        {
          error: "No bookkeeping subscription",
          code: "NO_SUBSCRIPTION",
        },
        { status: 403 }
      );
    }

    if (
      subscription.status !== "active" &&
      subscription.status !== "trialing"
    ) {
      return NextResponse.json(
        {
          error: "Bookkeeping subscription inactive",
          code: "SUBSCRIPTION_INACTIVE",
        },
        { status: 403 }
      );
    }

    const monthlyLimit = positiveInt(subscription.monthly_limit);
    const monthlyUsed = positiveInt(subscription.monthly_used);
    const bonusCredits = positiveInt(subscription.bonus_credits);

    const monthlyRemaining = Math.max(
      0,
      monthlyLimit - monthlyUsed
    );

    const totalAvailable =
      monthlyRemaining + bonusCredits;

    /*
     * Il faut avoir assez de crédits pour confirmer
     * TOUTES les transactions du document.
     *
     * On ne confirme jamais seulement une partie.
     */
    if (transactionCount > totalAvailable) {
      return NextResponse.json(
        {
          error: "Not enough credits",
          code: "INSUFFICIENT_CREDITS",
          required: transactionCount,
          available: totalAvailable,
          monthlyRemaining,
          bonusCredits,
        },
        { status: 402 }
      );
    }

    /*
     * 6. Consommer d'abord le forfait mensuel,
     * puis les crédits bonus.
     */
    const monthlyCreditsUsed = Math.min(
      transactionCount,
      monthlyRemaining
    );

    const bonusCreditsUsed =
      transactionCount - monthlyCreditsUsed;

    const newMonthlyUsed =
      monthlyUsed + monthlyCreditsUsed;

    const newBonusCredits =
      bonusCredits - bonusCreditsUsed;

    /*
     * 7. Préparer les transactions.
     */
    const rows = items.map((item) => {
      const gst = item.gst ?? 0;
      const qst = item.qst ?? 0;

      return {
        business_id: business.id,
        entry_type: item.entry_type,
        transaction_date: item.transaction_date,
        source: item.source,
        description: item.description,
        subtotal: item.subtotal,

        tax_mode:
          qst > 0
            ? "gst_qst"
            : gst > 0
              ? "gst"
              : "none",

        gst,
        qst,

        payment_method:
          item.payment_method === "unknown"
            ? "other"
            : item.payment_method,

        status: "confirmed",

        document_path: document.storage_path,
        original_file_name: document.original_file_name,
        document_mime_type: document.mime_type,

        entered_by: "document_ai",
        ai_confidence: item.confidence,
        ai_extraction: item,
      };
    });

    /*
     * 8. Créer les transactions.
     */
    const { data: transactions, error: insertError } = await sb
      .from("bookkeeping_transactions")
      .insert(rows)
      .select("id");

    if (insertError || !transactions?.length) {
      throw new Error(
        insertError?.message ||
          "Unable to create bookkeeping transactions"
      );
    }

    const transactionIds = transactions.map(
      (transaction) => transaction.id
    );

    /*
     * 9. Mettre à jour les crédits.
     */
    const { error: creditError } = await sb
      .from("bookkeeping_subscriptions")
      .update({
        monthly_used: newMonthlyUsed,
        bonus_credits: newBonusCredits,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (creditError) {
      /*
       * Si les crédits ne peuvent pas être débités,
       * on retire les transactions créées.
       */
      await sb
        .from("bookkeeping_transactions")
        .delete()
        .in("id", transactionIds);

      throw new Error(creditError.message);
    }

    /*
     * 10. Enregistrer l'utilisation.
     */
    const { error: usageError } = await sb
      .from("bookkeeping_usage_events")
      .insert({
        user_id: user.id,
        document_id: document.id,
        transaction_count: transactionCount,
        monthly_credits_used: monthlyCreditsUsed,
        bonus_credits_used: bonusCreditsUsed,
      });

    if (usageError) {
      /*
       * Annulation des changements précédents.
       */
      await sb
        .from("bookkeeping_subscriptions")
        .update({
          monthly_used: monthlyUsed,
          bonus_credits: bonusCredits,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      await sb
        .from("bookkeeping_transactions")
        .delete()
        .in("id", transactionIds);

      throw new Error(usageError.message);
    }

    /*
     * 11. Confirmer le document.
     */
    const { error: documentUpdateError } = await sb
      .from("bookkeeping_documents")
      .update({
        status: "confirmed",
        transaction_id: transactionIds[0],
      })
      .eq("id", document.id);

    if (documentUpdateError) {
      /*
       * Annulation complète si le document
       * ne peut pas être confirmé.
       */
      await sb
        .from("bookkeeping_usage_events")
        .delete()
        .eq("user_id", user.id)
        .eq("document_id", document.id);

      await sb
        .from("bookkeeping_subscriptions")
        .update({
          monthly_used: monthlyUsed,
          bonus_credits: bonusCredits,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      await sb
        .from("bookkeeping_transactions")
        .delete()
        .in("id", transactionIds);

      throw new Error(documentUpdateError.message);
    }

    /*
     * 12. Résultat.
     */
    return NextResponse.json(
      {
        ok: true,

        transactionCount,

        credits: {
          monthlyUsed: newMonthlyUsed,
          monthlyLimit,
          monthlyRemaining: Math.max(
            0,
            monthlyLimit - newMonthlyUsed
          ),

          bonusCredits: newBonusCredits,

          usedThisConfirmation: {
            monthly: monthlyCreditsUsed,
            bonus: bonusCreditsUsed,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Document confirmation error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
