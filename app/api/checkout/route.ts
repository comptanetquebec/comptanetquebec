// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

type Lang = "fr" | "en" | "es";
type TaxType = "t1" | "ta" | "t2";
type PayMode = "acompte" | "solde";

function normalizeLang(v: unknown): Lang {
  const x = String(v ?? "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}
function normalizeTaxType(v: unknown): TaxType | null {
  const x = String(v ?? "").toLowerCase();
  return x === "t1" || x === "ta" || x === "t2" ? (x as TaxType) : null;
}
function normalizePayMode(v: unknown): PayMode | null {
  const x = String(v ?? "").toLowerCase();
  return x === "acompte" || x === "solde" ? (x as PayMode) : null;
}

function safeOrigin(req: Request) {
  const o = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "";
  return o.replace(/\/+$/, "");
}

function priceIdFor(type: TaxType, mode: PayMode): string {
  // ✅ pour l’instant: acompte seulement
  if (mode !== "acompte") {
    throw new Error("Le solde est facturé après le traitement du dossier (montant variable).");
  }

  const map: Record<TaxType, string | undefined> = {
    t1: process.env.STRIPE_PRICE_T1_ACOMPTE,
    ta: process.env.STRIPE_PRICE_TA_ACOMPTE,
    t2: process.env.STRIPE_PRICE_T2_ACOMPTE,
  };

  const pid = map[type];
  if (!pid) throw new Error(`Missing Stripe Price ID for ${type}:${mode}`);
  return pid;
}

export async function POST(req: Request) {
  try {
    const sk = process.env.STRIPE_SECRET_KEY;
    if (!sk) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const stripe = new Stripe(sk);

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const taxType = normalizeTaxType(body["type"]);
    const payMode = normalizePayMode(body["mode"]);
    const lang = normalizeLang(body["lang"]);

    const fid =
      typeof body["fid"] === "string" && body["fid"].trim().length >= 10
        ? body["fid"].trim()
        : null;

    const cqId =
      typeof body["cqId"] === "string" && body["cqId"].trim().startsWith("CQ-")
        ? body["cqId"].trim()
        : null;

    if (!taxType || !payMode) {
      return NextResponse.json({ error: "Invalid type/mode" }, { status: 400 });
    }
    if (!fid) {
      return NextResponse.json({ error: "Missing fid" }, { status: 400 });
    }

    // ✅ si tu veux EXIGER cqId avant paiement, décommente ceci :
    // if (!cqId) {
    //   return NextResponse.json({ error: "Missing cqId" }, { status: 400 });
    // }

    const origin = safeOrigin(req);
    if (!origin) {
      return NextResponse.json({ error: "Missing site origin" }, { status: 500 });
    }

    const successUrl = new URL("/paiement/succes", origin);
    successUrl.searchParams.set("lang", lang);
    successUrl.searchParams.set("fid", fid);
    successUrl.searchParams.set("type", taxType);
    successUrl.searchParams.set("mode", payMode);

    const cancelUrl = new URL("/paiement/annule", origin);
    cancelUrl.searchParams.set("lang", lang);
    cancelUrl.searchParams.set("fid", fid);
    cancelUrl.searchParams.set("type", taxType);
    cancelUrl.searchParams.set("mode", payMode);

    const idempotencyKey = `${fid}:${taxType}:${payMode}`;

    const priceId = priceIdFor(taxType, payMode);

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",

        // ✅ plus facile à retrouver dans Stripe
        client_reference_id: cqId || fid,

        // ✅ Price ID venant de Vercel env
        line_items: [{ price: priceId, quantity: 1 }],

        success_url: successUrl.toString(),
        cancel_url: cancelUrl.toString(),

        metadata: {
          fid,
          cq_id: cqId || "",
          type: taxType,
          mode: payMode,
          lang,
        },
      },
      { idempotencyKey }
    );

    if (!session.url) {
      return NextResponse.json({ error: "Stripe session missing url" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e: unknown) {
    const message =
      e instanceof Stripe.errors.StripeError
        ? e.message
        : e instanceof Error
          ? e.message
          : "Checkout error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
