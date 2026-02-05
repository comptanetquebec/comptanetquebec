// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs"; // Stripe SDK = Node runtime sur Vercel

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

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

// ✅ Mets tes vrais Price IDs Stripe dans Vercel (env vars)
const PRICE: Record<TaxType, Record<PayMode, string>> = {
  t1: {
    acompte: process.env.STRIPE_PRICE_T1_ACOMPTE || "",
    solde: process.env.STRIPE_PRICE_T1_SOLDE || "",
  },
  ta: {
    acompte: process.env.STRIPE_PRICE_TA_ACOMPTE || "",
    solde: process.env.STRIPE_PRICE_TA_SOLDE || "",
  },
  t2: {
    acompte: process.env.STRIPE_PRICE_T2_ACOMPTE || "",
    solde: process.env.STRIPE_PRICE_T2_SOLDE || "",
  },
};

function safeOrigin(req: Request) {
  // origin est fiable côté navigateur; fallback sur NEXT_PUBLIC_SITE_URL si appel serveur
  const o = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "";
  return o.replace(/\/+$/, ""); // enlève les / finaux
}

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const taxType = normalizeTaxType(body["type"]);
    const payMode = normalizePayMode(body["mode"]);
    const lang = normalizeLang(body["lang"]);

    // ✅ IMPORTANT: fid OBLIGATOIRE (paiement = lié au dossier)
    const fid =
      typeof body["fid"] === "string" && body["fid"].trim().length >= 10 ? body["fid"].trim() : null;

    if (!taxType || !payMode) {
      return NextResponse.json({ error: "Invalid type/mode" }, { status: 400 });
    }
    if (!fid) {
      return NextResponse.json({ error: "Missing fid" }, { status: 400 });
    }

    const priceId = PRICE[taxType][payMode];
    if (!priceId) {
      return NextResponse.json({ error: "Missing Price ID for this product" }, { status: 500 });
    }

    const origin = safeOrigin(req);
    if (!origin) {
      return NextResponse.json({ error: "Missing site origin" }, { status: 500 });
    }

    // ✅ Pages de retour (adapte si tes routes diffèrent)
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

    // (Optionnel mais utile) empêcher la création multiple si l’utilisateur clique 3 fois
    const idempotencyKey = `${fid}:${taxType}:${payMode}`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl.toString(),
        cancel_url: cancelUrl.toString(),
        metadata: {
          fid,
          type: taxType,
          mode: payMode,
          lang,
        },
      },
      { idempotencyKey }
    );

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Checkout error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
