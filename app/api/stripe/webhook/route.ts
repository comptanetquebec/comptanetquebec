// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendAdminNotifyEmail } from "@/lib/emails/adminNotify";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Supabase admin client (bypass RLS) — SERVEUR SEULEMENT
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

export async function POST(req: NextRequest) {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) return jsonErr("Missing stripe-signature", 400);

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return jsonErr("Missing STRIPE_WEBHOOK_SECRET", 500);

    // ⚠️ req.text() obligatoire pour la signature
    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, secret);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid signature";
      return jsonErr(msg, 400);
    }

    // ✅ Idempotence: on ignore si déjà traité (optionnel mais recommandé)
    const sb = supabaseAdmin();
    const eventId = event.id;

    // Si tu n'as pas encore la table stripe_events, commente ce bloc temporairement
    {
      const { data: already } = await sb
        .from("stripe_events")
        .select("id")
        .eq("id", eventId)
        .maybeSingle();

      if (already?.id) return jsonOk();

      const { error: insErr } = await sb
        .from("stripe_events")
        .insert({ id: eventId });

      if (insErr) {
        // Si collision (déjà inséré en parallèle), on sort OK
        return jsonOk();
      }
    }

    // ✅ On traite seulement checkout.session.completed (acompte)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const fid = getStr(session.metadata?.fid);
      const cqId = getStr(session.metadata?.cq_id);
      const type = getStr(session.metadata?.type); // t1/ta/t2
      const mode = getStr(session.metadata?.mode); // acompte
      const lang = getStr(session.metadata?.lang);

      // Extra utile
      const amountTotal =
        typeof session.amount_total === "number" ? session.amount_total : null; // cents
      const currency = getStr(session.currency);
      const stripeSessionId = getStr(session.id);
      const paymentStatus = getStr(session.payment_status); // "paid"

      if (!fid) {
        // rien à lier, mais on répond OK pour ne pas faire retry infini Stripe
        return jsonOk();
      }

      // 1) Update du dossier (formulaires_fiscaux)
      // NOTE: ton CHECK constraint accepte 'paid' => parfait
      const { error: upErr } = await sb
        .from("formulaires_fiscaux")
        .update({
          status: "paid",
          cq_id: cqId || undefined, // garde si déjà là
          updated_at: new Date().toISOString(),
        })
        .eq("id", fid);

      // Si l’update échoue, on lance pour que Stripe retry (important)
      if (upErr) throw new Error(upErr.message);

      // 2) Email admin (best-effort: si email fail, on ne casse pas le webhook)
      try {
        await sendAdminNotifyEmail({
          subject: `Paiement reçu — ${cqId || fid}`,
          text:
            `Paiement confirmé (Stripe)\n\n` +
            `CQ: ${cqId || "—"}\n` +
            `fid: ${fid}\n` +
            `Type: ${type || "—"}\n` +
            `Mode: ${mode || "—"}\n` +
            `Lang: ${lang || "—"}\n` +
            `Stripe session: ${stripeSessionId || "—"}\n` +
            `Payment status: ${paymentStatus || "—"}\n` +
            `Montant: ${amountTotal != null ? amountTotal / 100 : "—"} ${currency || ""}\n`,
        });
      } catch {
        // ignore: le paiement est déjà enregistré
      }
    }

    return jsonOk();
  } catch (e: unknown) {
    // Ici on retourne 500 pour que Stripe retry (important)
    const msg = e instanceof Error ? e.message : "Webhook error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
