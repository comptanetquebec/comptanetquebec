// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

// ✅ IMPORTANT: ne PAS forcer apiVersion (sinon conflit de types avec ta version Stripe)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Webhook error";
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: unknown) {
    return NextResponse.json({ error: errMessage(err) }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    // ✅ Ici tu peux lire metadata si tu l’as mise dans checkout (fid, type, mode, lang)
    const session = event.data.object as Stripe.Checkout.Session;

    const fid = typeof session.metadata?.fid === "string" ? session.metadata.fid : null;
    const type = typeof session.metadata?.type === "string" ? session.metadata.type : null;
    const mode = typeof session.metadata?.mode === "string" ? session.metadata.mode : null;

    // TODO:
    // - marquer paiement reçu dans Supabase (table paiements)
    // - mettre statut du dossier (ex: acompte_payé / solde_payé)
    // - débloquer étape suivante côté UI
    // (on le fera quand tu me donnes le nom exact de ta table + colonnes)
    void fid;
    void type;
    void mode;
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
