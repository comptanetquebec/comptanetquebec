// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type Lang = "fr" | "en" | "es";
type TaxType = "t1" | "ta" | "t2";
type PayMode = "acompte" | "solde";

type CheckoutBody = {
  fid?: unknown;
  type?: unknown;
  mode?: unknown;
  lang?: unknown;
};

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

function parseFid(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  // on valide léger (uuid fait 36, mais on évite de bloquer si tu changes plus tard)
  return s.length >= 10 ? s : null;
}

function safeOrigin(req: Request): string {
  const fromHeader = req.headers.get("origin");
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  const origin = (fromHeader || fromEnv || "").trim();
  return origin.replace(/\/+$/, "");
}

function priceIdFor(type: TaxType, mode: PayMode): string {
  // ✅ acompte seulement pour l’instant
  if (mode !== "acompte") {
    throw new Error(
      "Le solde est facturé après le traitement du dossier (montant variable)."
    );
  }

  const map: Record<TaxType, string | undefined> = {
    t1: process.env.STRIPE_PRICE_ACOMPTE_T1,
    ta: process.env.STRIPE_PRICE_ACOMPTE_TA,
    t2: process.env.STRIPE_PRICE_ACOMPTE_T2,
  };

  const pid = map[type];
  if (!pid) throw new Error(`Missing Stripe Price ID for ${type}:${mode}`);
  return pid;
}

/**
 * ✅ Utilise la fonction DB existante: public.ensure_cq_id(p_fid uuid) returns text
 * - si cq_id existe -> retourne cq_id
 * - sinon -> génère + update -> retourne cq_id
 */
async function ensureCqId(fid: string): Promise<string> {
  const supabase = await supabaseServer();

  const { data, error } = await supabase.rpc("ensure_cq_id", {
    p_fid: fid,
  });

  if (error) throw new Error(error.message);

  const cqId = String(data ?? "").trim();
  if (!cqId.startsWith("CQ-")) {
    throw new Error("ensure_cq_id returned an invalid cq_id");
  }

  return cqId;
}

export async function POST(req: Request) {
  try {
    const sk = process.env.STRIPE_SECRET_KEY;
    if (!sk) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const origin = safeOrigin(req);
    if (!origin) {
      return NextResponse.json({ error: "Missing site origin" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as CheckoutBody;

    const taxType = normalizeTaxType(body.type);
    const payMode = normalizePayMode(body.mode);
    const lang = normalizeLang(body.lang);
    const fid = parseFid(body.fid);

    if (!taxType || !payMode) {
      return NextResponse.json({ error: "Invalid type/mode" }, { status: 400 });
    }
    if (!fid) {
      return NextResponse.json({ error: "Missing fid" }, { status: 400 });
    }

    // ✅ cq_id pro garanti (DB)
    const cqId = await ensureCqId(fid);

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

    const priceId = priceIdFor(taxType, payMode);

    // ✅ idempotency stable (évite doubles sessions)
    const idempotencyKey = `checkout:${fid}:${taxType}:${payMode}`;

    const stripe = new Stripe(sk);

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",

        // ✅ visible dans Stripe en clair
        client_reference_id: cqId,

        line_items: [{ price: priceId, quantity: 1 }],

        success_url: successUrl.toString(),
        cancel_url: cancelUrl.toString(),

        // ✅ lien technique + lien humain
        metadata: {
          fid,
          cq_id: cqId,
          type: taxType,
          mode: payMode,
          lang,
        },
      },
      { idempotencyKey }
    );

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe session missing url" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e: unknown) {
    const message =
      e instanceof Stripe.StripeError
        ? e.message
        : e instanceof Error
          ? e.message
          : "Checkout error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
