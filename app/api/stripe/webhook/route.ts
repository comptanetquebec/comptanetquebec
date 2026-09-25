// app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { sendAdminNotifyEmail } from "@/lib/emails/adminNotify";

export const runtime = "nodejs";

// Ne pas forcer apiVersion
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || ""
);

type DossierType = "T1" | "TA" | "T2";
type PaymentStatus = "unpaid" | "paid";

type FactureRow = {
  id: string;
  formulaire_id: string | null;
  cq_id: string | null;
  total: number | string | null;
  montant_paye: number | string | null;
  statut: string | null;
};

function jsonOk() {
  return NextResponse.json(
    { received: true },
    { status: 200 }
  );
}

function jsonErr(
  message: string,
  status = 400
) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

function getStr(
  v: unknown
): string | null {
  return typeof v === "string" &&
    v.trim()
    ? v.trim()
    : null;
}

function normalizeType(
  v: string | null
): DossierType | null {
  const x = (
    v || ""
  )
    .trim()
    .toUpperCase();

  return x === "T1" ||
    x === "TA" ||
    x === "T2"
    ? (x as DossierType)
    : null;
}

function normalizeMode(
  v: string | null
) {
  return (
    v || ""
  )
    .trim()
    .toLowerCase();
}

function money(
  value:
    | number
    | string
    | null
    | undefined
) {
  const n =
    typeof value === "number"
      ? value
      : Number(value ?? 0);

  return Number.isFinite(n)
    ? n
    : 0;
}

function mustEnv(
  name: string
): string {
  const v =
    process.env[name];

  if (!v) {
    throw new Error(
      `Missing ${name}`
    );
  }

  return v;
}

function supabaseAdmin():
  SupabaseClient {
  const url =
    mustEnv(
      "NEXT_PUBLIC_SUPABASE_URL"
    );

  const serviceKey =
    mustEnv(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

  return createClient(
    url,
    serviceKey,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

/**
 * Idempotence:
 *
 * Table requise :
 *
 * create table public.stripe_events (
 *   id text primary key,
 *   created_at timestamptz default now()
 * );
 */
type PostgrestLikeError = {
  message: string;
  code?: string;
};

function getPgErrorCode(
  err: unknown
): string | undefined {
  if (
    !err ||
    typeof err !== "object"
  ) {
    return undefined;
  }

  const rec =
    err as Record<
      string,
      unknown
    >;

  return typeof rec.code ===
    "string"
    ? rec.code
    : undefined;
}

async function reserveEvent(
  sb: SupabaseClient,
  eventId: string
) {
  const { error } =
    await sb
      .from("stripe_events")
      .insert({
        id: eventId,
      });

  if (!error) {
    return true;
  }

  const code =
    getPgErrorCode(
      error
    );

  // 23505 = déjà traité
  if (code === "23505") {
    return false;
  }

  const msg =
    (
      error as PostgrestLikeError
    ).message ||
    "Supabase insert error";

  throw new Error(msg);
}

async function releaseEvent(
  sb: SupabaseClient,
  eventId: string
) {
  /*
   * Si une erreur survient APRÈS la réservation,
   * on retire l'événement pour permettre à Stripe
   * de le renvoyer et de réessayer.
   */
  await sb
    .from("stripe_events")
    .delete()
    .eq("id", eventId);
}

export async function POST(
  req: NextRequest
) {
  let sb:
    | SupabaseClient
    | null = null;

  let reservedEventId:
    | string
    | null = null;

  try {
    const sig =
      req.headers.get(
        "stripe-signature"
      );

    if (!sig) {
      return jsonErr(
        "Missing stripe-signature",
        400
      );
    }

    const webhookSecret =
      process.env
        .STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return jsonErr(
        "Missing STRIPE_WEBHOOK_SECRET",
        500
      );
    }

    // Raw body obligatoire pour valider Stripe
    const body =
      await req.text();

    let event:
      Stripe.Event;

    try {
      event =
        stripe.webhooks
          .constructEvent(
            body,
            sig,
            webhookSecret
          );
    } catch (
      e: unknown
    ) {
      const msg =
        e instanceof Error
          ? e.message
          : "Invalid signature";

      return jsonErr(
        msg,
        400
      );
    }

    /*
     * On conserve le comportement actuel :
     * seul checkout.session.completed est traité.
     */
    if (
      event.type !==
      "checkout.session.completed"
    ) {
      return jsonOk();
    }

    sb =
      supabaseAdmin();

    /*
     * Réservation idempotente.
     */
    const isNew =
      await reserveEvent(
        sb,
        event.id
      );

    if (!isNew) {
      return jsonOk();
    }

    reservedEventId =
      event.id;

    const session =
      event.data
        .object as Stripe.Checkout.Session;

    const metadata =
      session.metadata ||
      {};

    const mode =
      normalizeMode(
        getStr(
          metadata.mode
        )
      );

    const fid =
      getStr(
        metadata.fid
      );

    const factureId =
      getStr(
        metadata.facture_id
      );

    const type =
      normalizeType(
        getStr(
          metadata.type
        )
      );

    const lang =
      getStr(
        metadata.lang
      );

    const amountTotal =
      typeof session.amount_total ===
      "number"
        ? session.amount_total
        : null;

    const currency =
      getStr(
        session.currency
      );

    const stripeSessionId =
      getStr(
        session.id
      );

    const isPaid =
      session.payment_status ===
      "paid";

    /*
     * ======================================================
     * 1. PAIEMENT DU SOLDE D'UNE FACTURE
     * ======================================================
     */
    if (
      mode === "solde"
    ) {
      if (
        !factureId
      ) {
        throw new Error(
          "Missing facture_id for solde payment"
        );
      }

      const {
        data: facture,
        error: factureReadError,
      } =
        await sb
          .from("factures")
          .select(
            "id, formulaire_id, cq_id, total, montant_paye, statut"
          )
          .eq(
            "id",
            factureId
          )
          .maybeSingle<FactureRow>();

      if (
        factureReadError
      ) {
        throw new Error(
          factureReadError.message
        );
      }

      if (!facture) {
        throw new Error(
          "Facture introuvable"
        );
      }

      /*
       * Vérification supplémentaire :
       * la facture doit appartenir au dossier
       * transmis à Stripe.
       */
      if (
        fid &&
        facture.formulaire_id &&
        facture.formulaire_id !==
          fid
      ) {
        throw new Error(
          "Facture/dossier mismatch"
        );
      }

      const finalFid =
        facture.formulaire_id ||
        fid;

      if (!finalFid) {
        throw new Error(
          "Missing formulaire_id for invoice"
        );
      }

      /*
       * Un checkout complété mais non payé
       * ne doit PAS marquer la facture payée.
       */
      if (!isPaid) {
        try {
          await sendAdminNotifyEmail({
            subject:
              `Paiement par carte non complété — ${facture.cq_id || finalFid}`,

            text:
              `Checkout complété, mais paiement non confirmé.\n\n` +
              `CQ: ${facture.cq_id || "—"}\n` +
              `fid: ${finalFid}\n` +
              `Facture: ${facture.id}\n` +
              `Mode: solde\n` +
              `Lang: ${lang || "—"}\n` +
              `Stripe session: ${stripeSessionId || "—"}\n` +
              `Payment status: ${session.payment_status}\n`,
          });
        } catch {
          // best-effort
        }

        return jsonOk();
      }

      const total =
        money(
          facture.total
        );

      const dejaPaye =
        money(
          facture.montant_paye
        );

      const paiementRecu =
        amountTotal != null
          ? amountTotal / 100
          : 0;

      /*
       * On ajoute le montant réellement confirmé
       * par Stripe, sans jamais dépasser le total.
       */
      const nouveauMontantPaye =
        Math.min(
          total,
          Math.round(
            (
              dejaPaye +
              paiementRecu
            ) * 100
          ) / 100
        );

      const estEntierementPayee =
        total > 0 &&
        nouveauMontantPaye >=
          total - 0.005;

      const now =
        new Date()
          .toISOString();

      const {
        error:
          factureUpdateError,
      } =
        await sb
          .from("factures")
          .update({
            montant_paye:
              nouveauMontantPaye,

            statut:
              estEntierementPayee
                ? "paid"
                : facture.statut,

            mode_paiement:
              "stripe",

            date_paiement:
              estEntierementPayee
                ? now
                : null,

            updated_at:
              now,
          })
          .eq(
            "id",
            facture.id
          );

      if (
        factureUpdateError
      ) {
        throw new Error(
          factureUpdateError.message
        );
      }

      /*
       * Le dossier reste aussi marqué comme payé.
       * On ne touche PAS au champ status du dossier.
       */
      if (
        estEntierementPayee
      ) {
        const {
          error:
            dossierUpdateError,
        } =
          await sb
            .from(
              "formulaires_fiscaux"
            )
            .update({
              payment_status:
                "paid",

              updated_at:
                now,
            })
            .eq(
              "id",
              finalFid
            );

        if (
          dossierUpdateError
        ) {
          throw new Error(
            dossierUpdateError.message
          );
        }
      }

      /*
       * Courriel admin seulement.
       * Le client ne voit pas le mot Stripe.
       */
      try {
        await sendAdminNotifyEmail({
          subject:
            estEntierementPayee
              ? `Solde payé — ${facture.cq_id || finalFid}`
              : `Paiement reçu — ${facture.cq_id || finalFid}`,

          text:
            `Paiement du solde reçu.\n\n` +
            `CQ: ${facture.cq_id || "—"}\n` +
            `fid: ${finalFid}\n` +
            `Facture: ${facture.id}\n` +
            `Mode: carte\n` +
            `Lang: ${lang || "—"}\n` +
            `Stripe session: ${stripeSessionId || "—"}\n` +
            `Montant reçu: ${paiementRecu.toFixed(2)} ${currency || "cad"}\n` +
            `Montant payé total: ${nouveauMontantPaye.toFixed(2)}\n` +
            `Total facture: ${total.toFixed(2)}\n` +
            `Statut facture: ${
              estEntierementPayee
                ? "payée"
                : "partiellement payée"
            }\n`,
        });
      } catch {
        // best-effort
      }

      return jsonOk();
    }

    /*
     * ======================================================
     * 2. ACOMPTE INITIAL
     * ======================================================
     *
     * On conserve ton comportement actuel.
     */
    if (!fid) {
      return jsonOk();
    }

    const dossierType:
      DossierType =
      type ?? "T2";

    const payment_status:
      PaymentStatus =
      isPaid
        ? "paid"
        : "unpaid";

    /*
     * Lire cq_id existant.
     */
    const {
      data: existing,
      error: readErr,
    } =
      await sb
        .from(
          "formulaires_fiscaux"
        )
        .select("cq_id")
        .eq(
          "id",
          fid
        )
        .maybeSingle<{
          cq_id:
            | string
            | null;
        }>();

    if (readErr) {
      throw new Error(
        readErr.message
      );
    }

    let finalCqId =
      getStr(
        existing?.cq_id ??
          null
      );

    /*
     * Générer cq_id si absent.
     */
    if (!finalCqId) {
      const {
        data: generated,
        error: genErr,
      } =
        await sb.rpc(
          "generate_dossier_number",
          {
            p_type:
              dossierType,
          }
        );

      if (genErr) {
        throw new Error(
          genErr.message
        );
      }

      finalCqId =
        typeof generated ===
          "string" &&
        generated.trim()
          ? generated.trim()
          : null;
    }

    /*
     * Update dossier.
     * IMPORTANT : on ne touche PAS à status.
     */
    const {
      error: upErr,
    } =
      await sb
        .from(
          "formulaires_fiscaux"
        )
        .update({
          payment_status,

          cq_id:
            finalCqId ||
            undefined,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          fid
        );

    if (upErr) {
      throw new Error(
        upErr.message
      );
    }

    /*
     * Courriel admin.
     */
    try {
      await sendAdminNotifyEmail({
        subject:
          isPaid
            ? `Paiement reçu — ${finalCqId || fid}`
            : `Checkout complété (non payé) — ${finalCqId || fid}`,

        text:
          `Stripe checkout.session.completed\n\n` +
          `CQ: ${finalCqId || "—"}\n` +
          `fid: ${fid}\n` +
          `Type: ${dossierType}\n` +
          `Mode: ${mode || "acompte"}\n` +
          `Lang: ${lang || "—"}\n` +
          `Stripe session: ${stripeSessionId || "—"}\n` +
          `Payment status: ${payment_status}\n` +
          `Montant: ${
            amountTotal != null
              ? amountTotal / 100
              : "—"
          } ${currency || ""}\n`,
      });
    } catch {
      // best-effort
    }

    return jsonOk();
  } catch (
    e: unknown
  ) {
    /*
     * IMPORTANT :
     * si le traitement a échoué après avoir
     * réservé l'événement, on le libère afin
     * que Stripe puisse refaire une tentative.
     */
    if (
      sb &&
      reservedEventId
    ) {
      try {
        await releaseEvent(
          sb,
          reservedEventId
        );
      } catch {
        // ignore
      }
    }

    const msg =
      e instanceof Error
        ? e.message
        : "Webhook error";

    // 500 => Stripe va réessayer
    return NextResponse.json(
      {
        error: msg,
      },
      {
        status: 500,
      }
    );
  }
}
