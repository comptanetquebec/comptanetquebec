// app/api/signatures/send/route.ts

import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LINK_VALID_DAYS = 7;

type RequestRow = {
  id: string;
  formulaire_id: string;
  signer_name: string;
  signer_email: string;
  status: string;
};

type FactureRow = {
  id: string;
  numero_facture: string | null;
  formulaire_id: string | null;
  cq_id: string | null;
  total: number | string | null;
  montant_paye: number | string | null;
  statut: string | null;
};

type ProfileRow = {
  is_admin: boolean | null;
};

type DocumentRow = {
  tax_year: number;
  document_type: string;
};

function json(
  status: number,
  payload: Record<string, unknown>
) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(
  value: number
) {
  return new Intl.NumberFormat(
    "fr-CA",
    {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(value);
}

function toNumber(
  value: number | string | null | undefined
) {
  const n =
    typeof value === "number"
      ? value
      : Number(value ?? 0);

  return Number.isFinite(n)
    ? n
    : 0;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const requestId =
      typeof body?.requestId === "string"
        ? body.requestId.trim()
        : "";

    if (!requestId) {
      return json(400, {
        ok: false,
        error: "Demande de signature manquante.",
      });
    }

    const supabase = await supabaseServer();

    const { data: auth, error: authError } =
      await supabase.auth.getUser();

    if (authError || !auth?.user) {
      return json(401, {
        ok: false,
        error: "Non connecté.",
      });
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", auth.user.id)
        .maybeSingle<ProfileRow>();

    if (
      profileError ||
      !profile?.is_admin
    ) {
      return json(403, {
        ok: false,
        error: "Accès refusé.",
      });
    }

    const { data: signatureRequest, error: requestError } =
      await supabase
        .from("signature_requests")
        .select(
          "id, formulaire_id, signer_name, signer_email, status"
        )
        .eq("id", requestId)
        .maybeSingle<RequestRow>();

    if (
      requestError ||
      !signatureRequest
    ) {
      return json(404, {
        ok: false,
        error: "Demande de signature introuvable.",
      });
    }

    if (signatureRequest.status !== "draft") {
      return json(400, {
        ok: false,
        error:
          "Cette demande n’est plus en brouillon.",
      });
    }

    const email =
      signatureRequest.signer_email
        .trim()
        .toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return json(400, {
        ok: false,
        error: "Courriel du signataire invalide.",
      });
    }

    const { data: documents, error: docsError } =
      await supabase
        .from("signature_documents")
        .select("tax_year, document_type")
        .eq("signature_request_id", requestId)
        .returns<DocumentRow[]>();

    if (docsError) {
      return json(400, {
        ok: false,
        error: docsError.message,
      });
    }

    if (!documents || documents.length === 0) {
      return json(400, {
        ok: false,
        error:
          "Aucun document à signer dans cette demande.",
      });
    }

    /*
     * Facture liée au même dossier.
     * Si aucune facture n'existe, on envoie
     * quand même la demande de signature.
     */
    const { data: facture } =
      await supabase
        .from("factures")
        .select(
          "id, numero_facture, formulaire_id, cq_id, total, montant_paye, statut"
        )
        .eq(
          "formulaire_id",
          signatureRequest.formulaire_id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle<FactureRow>();

    const totalFacture =
      toNumber(
        facture?.total
      );

    const montantPaye =
      toNumber(
        facture?.montant_paye
      );

    const solde =
      Math.max(
        0,
        Math.round(
          (
            totalFacture -
            montantPaye
          ) * 100
        ) / 100
      );

    const paiementRequis =
      Boolean(facture) &&
      facture?.statut !== "paid" &&
      solde > 0;

    const resendApiKey =
      process.env.RESEND_API_KEY?.trim();

    if (!resendApiKey) {
      return json(500, {
        ok: false,
        error:
          "RESEND_API_KEY est manquante dans Vercel.",
      });
    }

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "https://comptanetquebec.com"
    ).replace(/\/$/, "");

    const fromEmail =
      process.env.FROM_EMAIL?.trim() ||
      "ComptaNet Québec <info@comptanetquebec.com>";

    const replyTo =
      process.env.RESEND_REPLY_TO?.trim() ||
      undefined;

    const rawToken =
      randomBytes(32).toString("base64url");

    const tokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() +
        LINK_VALID_DAYS *
          24 *
          60 *
          60 *
          1000
    ).toISOString();

    const { error: tokenError } =
      await supabase
        .from("signature_requests")
        .update({
          token_hash: tokenHash,
          expires_at: expiresAt,
        })
        .eq("id", requestId);

    if (tokenError) {
      return json(400, {
        ok: false,
        error: tokenError.message,
      });
    }

    const years = [
      ...new Set(
        documents
          .map((document) => Number(document.tax_year))
          .filter(Number.isFinite)
      ),
    ].sort((a, b) => a - b);

    const yearsText =
      years.length > 0
        ? years.join(", ")
        : "";

    const signingUrl =
      `${siteUrl}/signature/${rawToken}`;

    const paymentUrl =
      `${siteUrl}/paiement/solde?token=${encodeURIComponent(
        rawToken
      )}&lang=fr`;

    const safeName = escapeHtml(
      signatureRequest.signer_name || "Client"
    );

    const cqId =
      facture?.cq_id ||
      "votre numéro de dossier";

    const invoiceNo =
      facture?.numero_facture ||
      "";

    const paymentHtml =
      paiementRequis
        ? `
          <div
            style="
              margin-top:28px;
              padding:20px;
              background:#f8fafc;
              border:1px solid #e2e8f0;
              border-radius:12px;
            "
          >
            <h3
              style="
                margin:0 0 12px 0;
                color:#0f172a;
              "
            >
              Solde à payer : ${escapeHtml(
                money(solde)
              )}
            </h3>

            ${
              invoiceNo
                ? `<p style="margin:0 0 14px 0;color:#475569">
                    Facture ${escapeHtml(invoiceNo)}
                  </p>`
                : ""
            }

            <div
              style="
                padding:14px;
                background:#eff6ff;
                border-radius:10px;
                margin-bottom:14px;
              "
            >
              <strong>
                Virement Interac — recommandé
              </strong>
              <br>
              Montant :
              <strong>${escapeHtml(
                money(solde)
              )}</strong>
              <br>
              Envoyer à :
              <strong>
                comptanetquebec@gmail.com
              </strong>
              <br>
              Dépôt automatique activé —
              aucune question de sécurité.
              <br>
              Message :
              <strong>${escapeHtml(
                cqId
              )}</strong>
            </div>

            <p style="margin:0">
              <a
                href="${paymentUrl}"
                style="
                  display:inline-block;
                  padding:12px 18px;
                  background:#1d4ed8;
                  color:#ffffff;
                  border-radius:10px;
                  text-decoration:none;
                  font-weight:700;
                "
              >
                Payer par carte
              </a>
            </p>
          </div>
        `
        : "";

    const html = `
      <div
        style="
          font-family:Arial,sans-serif;
          max-width:650px;
          margin:auto;
          color:#1e293b;
          line-height:1.6;
        "
      >
        <h2 style="color:#1d4ed8">
          ComptaNet Québec
        </h2>

        <p>Bonjour ${safeName},</p>

        <p>
          Des documents fiscaux sont prêts pour votre
          signature électronique${
            yearsText
              ? ` pour l’année ou les années ${yearsText}`
              : ""
          }.
        </p>

        <p>
          Utilisez le bouton ci-dessous pour consulter
          les documents et poursuivre la signature.
        </p>

        <p style="margin:24px 0">
          <a
            href="${signingUrl}"
            style="
              display:inline-block;
              padding:12px 18px;
              background:#7c3aed;
              color:#ffffff;
              border-radius:10px;
              text-decoration:none;
              font-weight:700;
            "
          >
            Consulter et signer
          </a>
        </p>

        ${paymentHtml}

        <p
          style="
            margin-top:24px;
            font-size:13px;
            color:#64748b;
          "
        >
          Le lien de signature et de paiement est
          personnel et expire dans
          ${LINK_VALID_DAYS} jours.
          Ne le transférez pas.
        </p>

        <p>
          Merci,<br>
          <strong>ComptaNet Québec</strong>
        </p>
      </div>
    `;

    const paymentText =
      paiementRequis
        ? (
            `\n\nSolde à payer : ${money(solde)}` +
            (invoiceNo
              ? `\nFacture : ${invoiceNo}`
              : "") +
            `\n\nVirement Interac — recommandé` +
            `\nMontant : ${money(solde)}` +
            `\nEnvoyer à : comptanetquebec@gmail.com` +
            `\nDépôt automatique activé — aucune question de sécurité.` +
            `\nMessage : ${cqId}` +
            `\n\nPayer par carte : ${paymentUrl}`
          )
        : "";

    const text =
      `Bonjour ${signatureRequest.signer_name},\n\n` +
      `Des documents fiscaux sont prêts pour votre signature` +
      (yearsText
        ? ` pour l’année ou les années ${yearsText}`
        : "") +
      `.\n\nConsulter et signer : ${signingUrl}` +
      paymentText +
      `\n\nCe lien expire dans ${LINK_VALID_DAYS} jours.\n\n` +
      `ComptaNet Québec`;

    const resend = new Resend(resendApiKey);

    const { data: emailData, error: emailError } =
      await resend.emails.send({
        from: fromEmail,
        to: email,
        replyTo,
        subject:
          paiementRequis
            ? "Documents à signer et solde à payer — ComptaNet Québec"
            : "Documents à signer — ComptaNet Québec",
        html,
        text,
        tags: [
          {
            name: "type",
            value: "signature",
          },
        ],
      });

    if (emailError) {
      return json(400, {
        ok: false,
        error:
          emailError.message ||
          "Erreur pendant l’envoi du courriel.",
      });
    }

    const sentAt =
      new Date().toISOString();

    const { error: updateError } =
      await supabase
        .from("signature_requests")
        .update({
          status: "sent",
          sent_at: sentAt,
        })
        .eq("id", requestId);

    if (updateError) {
      return json(400, {
        ok: false,
        error: updateError.message,
      });
    }

    await supabase
      .from("signature_events")
      .insert({
        signature_request_id: requestId,
        signature_document_id: null,
        event_type: "email_sent",
        metadata: {
          email_id: emailData?.id ?? null,
          expires_at: expiresAt,
          tax_years: years,
          facture_id:
            facture?.id ?? null,
          solde:
            paiementRequis
              ? solde
              : 0,
        },
      });

    return json(200, {
      ok: true,
      sentTo: email,
    });
  } catch (error) {
    return json(500, {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur serveur.",
    });
  }
}
