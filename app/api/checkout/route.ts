// app/api/checkout/route.ts

import { createHash } from "crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type Lang = "fr" | "en" | "es";
type TaxType = "t1" | "t2";
type PayMode = "acompte" | "solde";

type CheckoutBody = {
  fid?: unknown;
  factureId?: unknown;
  token?: unknown;
  type?: unknown;
  mode?: unknown;
  lang?: unknown;
};

type FactureRow = {
  id: string;
  formulaire_id: string | null;
  cq_id: string | null;
  numero_facture: string | null;
  client_courriel: string | null;
  total: number | string | null;
  montant_paye: number | string | null;
  statut: string | null;
};

type SignatureRequestRow = {
  id: string;
  formulaire_id: string | null;
  status: string;
  expires_at: string | null;
};

function normalizeLang(v: unknown): Lang {
  const x = String(v ?? "").toLowerCase();

  return x === "fr" || x === "en" || x === "es"
    ? (x as Lang)
    : "fr";
}

function normalizeTaxType(
  v: unknown
): TaxType | null {
  const x = String(v ?? "").toLowerCase();

  return x === "t1" || x === "t2"
    ? (x as TaxType)
    : null;
}

function normalizePayMode(
  v: unknown
): PayMode | null {
  const x = String(v ?? "").toLowerCase();

  return x === "acompte" || x === "solde"
    ? (x as PayMode)
    : null;
}

function parseId(v: unknown): string | null {
  const s =
    typeof v === "string"
      ? v.trim()
      : "";

  return s.length >= 10 ? s : null;
}

function safeOrigin(req: Request): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL;

  const fromHeader =
    req.headers.get("origin");

  const origin = (
    fromEnv ||
    fromHeader ||
    ""
  ).trim();

  return origin.replace(/\/+$/, "");
}

function parseToken(v: unknown): string {
  return typeof v === "string"
    ? v.trim()
    : "";
}

function toMoneyNumber(
  value: number | string | null | undefined
) {
  const n =
    typeof value === "number"
      ? value
      : Number(value ?? 0);

  return Number.isFinite(n) ? n : 0;
}

/*
 * Prix fixe utilisé seulement pour
 * l'acompte initial.
 */
function priceIdForAcompte(
  type: TaxType
): string {
  const map: Record<
    TaxType,
    string | undefined
  > = {
    t1:
      process.env.STRIPE_PRICE_ACOMPTE_T1,

    t2:
      process.env.STRIPE_PRICE_ACOMPTE_T2,
  };

  const pid = map[type];

  if (!pid) {
    throw new Error(
      `Missing Stripe Price ID for ${type}:acompte`
    );
  }

  return pid;
}

/**
 * Utilise la fonction DB existante :
 * public.ensure_cq_id(p_fid uuid) returns text
 */
async function ensureCqId(
  fid: string
): Promise<string> {
  const supabase =
    await supabaseServer();

  const { data, error } =
    await supabase.rpc(
      "ensure_cq_id",
      {
        p_fid: fid,
      }
    );

  if (error) {
    throw new Error(
      error.message
    );
  }

  const cqId =
    String(data ?? "").trim();

  if (!cqId.startsWith("CQ-")) {
    throw new Error(
      "ensure_cq_id returned an invalid cq_id"
    );
  }

  return cqId;
}

/*
 * Pour le paiement du solde envoyé par courriel,
 * le client ne sera pas nécessairement connecté.
 *
 * On lit donc la facture côté serveur avec
 * la clé service role.
 */
function makeAdminSupabase() {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  ).trim();

  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase server configuration"
    );
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

async function loadFacture(
  factureId: string
): Promise<FactureRow> {
  const supabase =
    makeAdminSupabase();

  const { data, error } =
    await supabase
      .from("factures")
      .select(
        `
          id,
          formulaire_id,
          cq_id,
          numero_facture,
          client_courriel,
          total,
          montant_paye,
          statut
        `
      )
      .eq("id", factureId)
      .maybeSingle<FactureRow>();

  if (error) {
    throw new Error(
      error.message
    );
  }

  if (!data) {
    throw new Error(
      "Facture introuvable."
    );
  }

  return data;
}

async function loadSignatureRequestFromToken(
  rawToken: string
): Promise<SignatureRequestRow> {
  const supabase =
    makeAdminSupabase();

  const tokenHash =
    createHash("sha256")
      .update(rawToken)
      .digest("hex");

  const { data, error } =
    await supabase
      .from("signature_requests")
      .select(
        "id, formulaire_id, status, expires_at"
      )
      .eq("token_hash", tokenHash)
      .maybeSingle<SignatureRequestRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "Lien de paiement invalide."
    );
  }

  if (
    data.status === "cancelled" ||
    data.status === "expired"
  ) {
    throw new Error(
      "Ce lien de paiement n’est plus actif."
    );
  }

  if (
    data.expires_at &&
    new Date(data.expires_at).getTime() <
      Date.now()
  ) {
    await supabase
      .from("signature_requests")
      .update({
        status: "expired",
      })
      .eq("id", data.id);

    throw new Error(
      "Ce lien de paiement a expiré."
    );
  }

  if (!data.formulaire_id) {
    throw new Error(
      "Cette demande n’est reliée à aucun dossier."
    );
  }

  return data;
}

async function loadLatestFactureForFid(
  fid: string
): Promise<FactureRow> {
  const supabase =
    makeAdminSupabase();

  const { data, error } =
    await supabase
      .from("factures")
      .select(
        `
          id,
          formulaire_id,
          cq_id,
          numero_facture,
          client_courriel,
          total,
          montant_paye,
          statut
        `
      )
      .eq("formulaire_id", fid)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle<FactureRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "Aucune facture reliée à ce dossier."
    );
  }

  return data;
}

export async function POST(
  req: Request
) {
  try {
    const sk =
      process.env.STRIPE_SECRET_KEY;

    if (!sk) {
      return NextResponse.json(
        {
          error:
            "Missing STRIPE_SECRET_KEY",
        },
        {
          status: 500,
        }
      );
    }

    const origin =
      safeOrigin(req);

    if (!origin) {
      return NextResponse.json(
        {
          error:
            "Missing site origin",
        },
        {
          status: 500,
        }
      );
    }

    const body = (await req
      .json()
      .catch(() => ({}))) as CheckoutBody;

    const payMode =
      normalizePayMode(body.mode);

    const lang =
      normalizeLang(body.lang);

    const fid =
      parseId(body.fid);

    const factureId =
      parseId(body.factureId);

    const rawToken =
      parseToken(body.token);

    if (!payMode) {
      return NextResponse.json(
        {
          error:
            "Invalid payment mode",
        },
        {
          status: 400,
        }
      );
    }

    const stripe =
      new Stripe(sk);

    /*
     * ======================================================
     * 1. ACOMPTE INITIAL
     * ======================================================
     *
     * On conserve exactement le fonctionnement actuel :
     * prix Stripe fixe selon T1 ou T2.
     */
    if (payMode === "acompte") {
      const taxType =
        normalizeTaxType(body.type);

      if (!taxType) {
        return NextResponse.json(
          {
            error:
              "Invalid tax type",
          },
          {
            status: 400,
          }
        );
      }

      if (!fid) {
        return NextResponse.json(
          {
            error:
              "Missing fid",
          },
          {
            status: 400,
          }
        );
      }

      const cqId =
        await ensureCqId(fid);

      const priceId =
        priceIdForAcompte(
          taxType
        );

      const returnUrl =
        new URL(
          "/paiement/succes",
          origin
        );

      returnUrl.searchParams.set(
        "lang",
        lang
      );

      returnUrl.searchParams.set(
        "fid",
        fid
      );

      returnUrl.searchParams.set(
        "type",
        taxType
      );

      returnUrl.searchParams.set(
        "mode",
        "acompte"
      );

      const session =
        await stripe.checkout.sessions.create(
          {
            ui_mode:
              "embedded",

            mode:
              "payment",

            payment_method_types: [
              "card",
              "link",
            ],

            automatic_tax: {
              enabled: true,
            },

            client_reference_id:
              cqId,

            line_items: [
              {
                price:
                  priceId,
                quantity: 1,
              },
            ],

            return_url:
              returnUrl.toString(),

            metadata: {
              fid,
              cq_id:
                cqId,
              type:
                taxType,
              mode:
                "acompte",
              lang,
            },
          }
        );

      if (
        !session.client_secret
      ) {
        return NextResponse.json(
          {
            error:
              "Stripe session missing client secret",
          },
          {
            status: 500,
          }
        );
      }

      return NextResponse.json(
        {
          clientSecret:
            session.client_secret,
        },
        {
          status: 200,
        }
      );
    }

    /*
     * ======================================================
     * 2. SOLDE D'UNE FACTURE
     * ======================================================
     *
     * Ici, aucun Price ID fixe.
     * Le montant vient directement de la facture :
     *
     * solde = total - montant_paye
     */
    if (!rawToken) {
      return NextResponse.json(
        {
          error:
            "Lien de paiement manquant.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Le token de signature est aussi la clé
     * temporaire qui autorise le paiement.
     * On ne fait confiance ni au fid ni au
     * montant reçus du navigateur.
     */
    const signatureRequest =
      await loadSignatureRequestFromToken(
        rawToken
      );

    const finalFid =
      signatureRequest.formulaire_id;

    if (!finalFid) {
      return NextResponse.json(
        {
          error:
            "Cette demande n’est reliée à aucun dossier.",
        },
        {
          status: 400,
        }
      );
    }

    const facture =
      factureId
        ? await loadFacture(
            factureId
          )
        : await loadLatestFactureForFid(
            finalFid
          );

    if (
      facture.formulaire_id !==
      finalFid
    ) {
      return NextResponse.json(
        {
          error:
            "Cette facture ne correspond pas à ce dossier.",
        },
        {
          status: 400,
        }
      );
    }

    const cqId =
      facture.cq_id ||
      finalFid;

    const total =
      toMoneyNumber(
        facture.total
      );

    const montantPaye =
      toMoneyNumber(
        facture.montant_paye
      );

    const solde =
      Math.max(
        0,
        Math.round(
          (total -
            montantPaye) *
            100
        ) / 100
      );

    if (solde <= 0) {
      return NextResponse.json(
        {
          error:
            "Cette facture est déjà payée.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Stripe reçoit les montants
     * en cents.
     */
    const soldeEnCents =
      Math.round(
        solde * 100
      );

    if (soldeEnCents < 50) {
      return NextResponse.json(
        {
          error:
            "Le solde est trop petit pour un paiement par carte.",
        },
        {
          status: 400,
        }
      );
    }

    const returnUrl =
      new URL(
        "/paiement/succes",
        origin
      );

    returnUrl.searchParams.set(
      "lang",
      lang
    );

    returnUrl.searchParams.set(
      "fid",
      finalFid
    );

    returnUrl.searchParams.set(
      "mode",
      "solde"
    );

    returnUrl.searchParams.set(
      "facture",
      facture.id
    );

    const invoiceLabel =
      facture.numero_facture
        ? `Solde facture ${facture.numero_facture}`
        : "Solde de facture";

    const session =
      await stripe.checkout.sessions.create(
        {
          ui_mode:
            "embedded",

          mode:
            "payment",

          payment_method_types: [
            "card",
            "link",
          ],

          /*
           * IMPORTANT :
           * le total de la facture contient
           * déjà les TPS/TVQ calculées.
           *
           * On ne demande donc PAS à Stripe
           * d'ajouter une deuxième fois les taxes.
           */
          automatic_tax: {
            enabled: false,
          },

          client_reference_id:
            cqId,

          customer_email:
            facture.client_courriel ||
            undefined,

          line_items: [
            {
              price_data: {
                currency:
                  "cad",

                unit_amount:
                  soldeEnCents,

                product_data: {
                  name:
                    invoiceLabel,
                },
              },

              quantity: 1,
            },
          ],

          return_url:
            returnUrl.toString(),

          metadata: {
            fid:
              finalFid,

            facture_id:
              facture.id,

            cq_id:
              cqId,

            mode:
              "solde",

            lang,

            /*
             * Pratique pour le webhook :
             * le montant réellement demandé.
             */
            solde_cents:
              String(
                soldeEnCents
              ),
          },
        }
      );

    if (
      !session.client_secret
    ) {
      return NextResponse.json(
        {
          error:
            "Stripe session missing client secret",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        clientSecret:
          session.client_secret,

        /*
         * Pas obligatoire pour Stripe,
         * mais pratique pour notre page.
         */
        solde,
        factureId:
          facture.id,
        numeroFacture:
          facture.numero_facture,
        cqId,
      },
      {
        status: 200,
      }
    );
  } catch (e: unknown) {
    const message =
      e instanceof Error
        ? e.message
        : "Checkout error";

    return NextResponse.json(
      {
        error:
          message,
      },
      {
        status: 500,
      }
    );
  }
}
