// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sendAdminNotifyEmail } from "@/lib/emails/adminNotify";

export const runtime = "nodejs";

// ✅ Ne pas forcer apiVersion
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

type DossierType = "T1" | "TA" | "T2";

function jsonOk() {
  return NextResponse.json({ received: true }, { status: 200 });
}
function jsonErr(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getStr(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function normalizeType(v: string | null): DossierType | null {
  const x = (v || "").trim().toUpperCase();
  return x === "T1" || x === "TA" || x === "T2" ? (x as DossierType) : null;
}

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function supabaseAdmin(): SupabaseClient {
  const url = mustEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = mustEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/**
 * Idempotence:
 * Table requise:
 *   create table public.stripe_events (
 *     id text primary key,
 *     created_at timestamptz default now()
 *   );
 */
type PostgrestLikeError = { message: string; code?: string };

function getPgErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const rec = err as Record<string, unknown>;
  return typeof rec.code === "string" ? rec.code : undefined;
}

async function ensureNotProcessed(sb: SupabaseClient, eventId: string) {
  const { error } = await sb.from("stripe_events").insert({ id: eventId });

  if (!error) return;

  const code = getPgErrorCode(error);

  // 23505 = unique_violation => déjà traité
  if (code === "23505") {
    const already = Object.assign(new Error("ALREADY_PROCESSED"), {
      code: "ALREADY_PROCESSED" as const,
    });
    throw already;
  }

  const msg = (error as PostgrestLikeError).message || "Supabase insert error";
  throw new Error(msg);
}

export async function POST(req: NextRequest) {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) return jsonErr("Missing stripe-signature", 400);

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return jsonErr("Missing STRIPE_WEBHOOK_SECRET", 500);

    // ⚠️ raw body obligatoire pour vérifier la signature Stripe
    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid signature";
      return jsonErr(msg, 400);
    }

    // ✅ On ne traite que checkout.session.completed
    if (event.type !== "checkout.session.completed") return jsonOk();

    const sb = supabaseAdmin();

    // ✅ Idempotence AVANT toute action
    try {
      await ensureNotProcessed(sb, event.id);
    } catch (e: unknown) {
      if (e && typeof e === "object" && (e as { code?: string }).code === "ALREADY_PROCESSED") {
        return jsonOk();
      }
      throw e;
    }

    const session = event.data.object as Stripe.Checkout.Session;

    // metadata fid = id du dossier (formulaires_fiscaux.id)
    const fid = getStr(session.metadata?.fid);
    if (!fid) return jsonOk(); // rien à lier

    const type: DossierType = normalizeType(getStr(session.metadata?.type)) ?? "T2";
    const mode = getStr(session.metadata?.mode);
    const lang = getStr(session.metadata?.lang);

    const amountTotal = typeof session.amount_total === "number" ? session.amount_total : null;
    const currency = getStr(session.currency);
    const stripeSessionId = getStr(session.id);

    // Stripe payment_status est souvent "paid" quand checkout.session.completed
    const paid = session.payment_status === "paid";
    const paymentStatusText = paid ? "paid" : "unpaid";

    // 1) lire cq_id existant
    const { data: existing, error: readErr } = await sb
      .from("formulaires_fiscaux")
      .select("cq_id")
      .eq("id", fid)
      .maybeSingle<{ cq_id: string | null }>();

    if (readErr) throw new Error(readErr.message);

    let finalCqId = getStr(existing?.cq_id ?? null);

    // 2) générer si absent
    if (!finalCqId) {
      const { data: generated, error: genErr } = await sb.rpc("generate_dossier_number", { p_type: type });
      if (genErr) throw new Error(genErr.message);
      finalCqId = typeof generated === "string" && generated.trim() ? generated.trim() : null;
    }

    // 3) update dossier (✅ status workflow + ✅ payment_status paiement)
    // IMPORTANT:
    // - status doit respecter chk_formulaires_status (ex: 'recu','en_cours','attente_client','termine')
    // - payment_status doit exister en DB et respecter sa contrainte (ex: 'unpaid','paid','refunded')
    const { error: upErr } = await sb
      .from("formulaires_fiscaux")
      .update({
        status: "recu",
        payment_status: paymentStatusText,
        cq_id: finalCqId || undefined,
        updated_at: new Date().toISOString(),
        // stripe_session_id: stripeSessionId || undefined,
        // paid_at: paid ? new Date().toISOString() : undefined,
      })
      .eq("id", fid);

    if (upErr) throw new Error(upErr.message);

    // 4) email admin (best-effort)
    try {
      await sendAdminNotifyEmail({
        subject: `Paiement reçu — ${finalCqId || fid}`,
        text:
          `Paiement confirmé (Stripe)\n\n` +
          `CQ: ${finalCqId || "—"}\n` +
          `fid: ${fid}\n` +
          `Type: ${type}\n` +
          `Mode: ${mode || "—"}\n` +
          `Lang: ${lang || "—"}\n` +
          `Stripe session: ${stripeSessionId || "—"}\n` +
          `Payment status: ${paymentStatusText}\n` +
          `Montant: ${amountTotal != null ? amountTotal / 100 : "—"} ${currency || ""}\n`,
      });
    } catch {
      // ignore
    }

    return jsonOk();
  } catch (e: unknown) {
    // 500 => Stripe retry
    const msg = e instanceof Error ? e.message : "Webhook error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
