// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendAdminNotifyEmail } from "@/lib/emails/adminNotify";

export const runtime = "nodejs";

// ✅ IMPORTANT: ne PAS forcer apiVersion (sinon conflit de types avec ta version Stripe)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

/**
 * Supabase admin client (bypass RLS) — SERVEUR SEULEMENT
 */
function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function jsonOk() {
  return NextResponse.json({ received: true }, { status: 200 });
}

function jsonErr(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getStr(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function normalizeType(v: string | null): "T1" | "TA" | "T2" | null {
  const x = (v || "").trim().toUpperCase();
  return x === "T1" || x === "TA" || x === "T2" ? x : null;
}

export async function POST(req: NextRequest) {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) return jsonErr("Missing stripe-signature", 400);

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return jsonErr("Missing STRIPE_WEBHOOK_SECRET", 500);

    // ⚠️ req.text() obligatoire pour vérifier la signature
    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, secret);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid signature";
      return jsonErr(msg, 400);
    }

    const sb = supabaseAdmin();
    const eventId = event.id;

    /**
     * ✅ Idempotence: ignore si déjà traité
     * Requiert la table:
     *   create table public.stripe_events (id text primary key, created_at timestamptz default now());
     */
    const { data: already, error: chkErr } = await sb
      .from("stripe_events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();

    // si erreur de lecture → on traite quand même (mais Stripe peut retry)
    if (!chkErr && already?.id) return jsonOk();

    // insert event id (si collision → déjà traité en parallèle)
    const { error: insErr } = await sb.from("stripe_events").insert({ id: eventId });
    if (insErr) return jsonOk();

    // ✅ On traite seulement checkout.session.completed
    if (event.type !== "checkout.session.completed") return jsonOk();

    const session = event.data.object as Stripe.Checkout.Session;

    const fid = getStr(session.metadata?.fid);
    const type = normalizeType(getStr(session.metadata?.type)); // "T1" | "TA" | "T2"
    const mode = getStr(session.metadata?.mode); // ex: "acompte"
    const lang = getStr(session.metadata?.lang);

    const amountTotal = typeof session.amount_total === "number" ? session.amount_total : null;
    const currency = getStr(session.currency);
    const stripeSessionId = getStr(session.id);
    const paymentStatus = getStr(session.payment_status);

    if (!fid) return jsonOk();

    /**
     * 1) Lire le cq_id existant (pour éviter toute régénération)
     */
    const { data: existing, error: readErr } = await sb
      .from("formulaires_fiscaux")
      .select("cq_id")
      .eq("id", fid)
      .maybeSingle<{ cq_id: string | null }>();

    if (readErr) throw new Error(readErr.message);

    let finalCqId = getStr(existing?.cq_id ?? null);

    /**
     * 2) Générer cq_id si absent (via RPC Supabase)
     * RPC attendue:
     *   public.generate_dossier_number(p_type text) returns text
     * Ex: "T2-000001"
     */
    if (!finalCqId && type) {
      const { data: generated, error: genErr } = await sb.rpc("generate_dossier_number", {
        p_type: type,
      });

      if (genErr) throw new Error(genErr.message);

      finalCqId = typeof generated === "string" ? generated : null;
    }

    /**
     * 3) Update dossier
     * Tu utilises déjà status "paid" → OK si ton CHECK l’accepte.
     */
    const { error: upErr } = await sb
      .from("formulaires_fiscaux")
      .update({
        status: "paid",
        cq_id: finalCqId || undefined,
        updated_at: new Date().toISOString(),
        // Optionnel: si tu as ces colonnes
        // stripe_session_id: stripeSessionId || undefined,
        // paid_at: new Date().toISOString(),
      })
      .eq("id", fid);

    if (upErr) throw new Error(upErr.message);

    /**
     * 4) Email admin (best-effort)
     */
    try {
      await sendAdminNotifyEmail({
        subject: `Paiement reçu — ${finalCqId || fid}`,
        text:
          `Paiement confirmé (Stripe)\n\n` +
          `CQ: ${finalCqId || "—"}\n` +
          `fid: ${fid}\n` +
          `Type: ${type || "—"}\n` +
          `Mode: ${mode || "—"}\n` +
          `Lang: ${lang || "—"}\n` +
          `Stripe session: ${stripeSessionId || "—"}\n` +
          `Payment status: ${paymentStatus || "—"}\n` +
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
