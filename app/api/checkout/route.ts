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

// ✅ Montants fixes (en cents)
const AMOUNT_CENTS: Record<TaxType, number> = {
  t1: 10000, // 100.00
  ta: 15000, // 150.00
  t2: 45000, // 450.00
};

// ✅ Libellés (affichés sur Stripe Checkout)
const LABEL: Record<TaxType, string> = {
  t1: "Déclaration T1",
  ta: "Travailleur autonome (TA)",
  t2: "Déclaration T2",
};

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
      typeof body["fid"] === "string" && body["fid"].trim().length >= 10 ? body["fid"].trim() : null;

    // ✅ CQ ID (optionnel, envoyé par ton UI)
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

    // ✅ Empêche les doubles sessions si double click
    const idempotencyKey = `${fid}:${taxType}:${payMode}`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",

        // ✅ visible/searchable côté Stripe (très utile)
        client_reference_id: cqId || fid,

        line_items: [
          {
            price_data: {
              currency: "cad",
              product_data: {
                name: `${LABEL[taxType]} — ${payMode === "acompte" ? "Acompte" : "Solde"}`,
              },
              unit_amount: AMOUNT_CENTS[taxType],
            },
            quantity: 1,
          },
        ],

        success_url: successUrl.toString(),
        cancel_url: cancelUrl.toString(),

        // ✅ CQ lié au paiement (metadata)
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

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Checkout error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
