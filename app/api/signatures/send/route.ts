// app/api/signatures/send/route.ts

import {
  createHash,
  randomBytes,
} from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LINK_VALID_DAYS = 7;

type RequestRow = {
  id: string;
  signer_name: string;
  signer_email: string;
  status: string;
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

export async function POST(
  request: Request
) {
  try {
    const body =
      await request
        .json()
        .catch(() => null);

    const requestId =
      typeof body?.requestId === "string"
        ? body.requestId.trim()
        : "";

    if (!requestId) {
      return json(400, {
        ok: false,
        error:
          "Demande de signature manquante.",
      });
    }

    const supabase =
      await supabaseServer();

    const {
      data: auth,
      error: authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !auth?.user
    ) {
      return json(401, {
        ok: false,
        error: "Non connecté.",
      });
    }

    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from("profiles")
        .select("is_admin")
        .eq(
          "id",
          auth.user.id
        )
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

    const {
      data: signatureRequest,
      error: requestError,
    } =
      await supabase
        .from("signature_requests")
        .select(
          "id, signer_name, signer_email, status"
        )
        .eq(
          "id",
          requestId
        )
        .maybeSingle<RequestRow>();

    if (
      requestError ||
      !signatureRequest
    ) {
      return json(404, {
        ok: false,
        error:
          "Demande de signature introuvable.",
      });
    }

    // Nouvelle demande OU renvoi.
    if (
      signatureRequest.status !==
        "draft" &&
      signatureRequest.status !==
        "sent"
    ) {
      return json(400, {
        ok: false,
        error:
          "Cette demande ne peut pas être envoyée ou renvoyée.",
      });
    }

    const isResend =
      signatureRequest.status ===
      "sent";

    const email =
      signatureRequest.signer_email
        .trim()
        .toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      return json(400, {
        ok: false,
        error:
          "Courriel du signataire invalide.",
      });
    }

    const {
      data: documents,
      error: docsError,
    } =
      await supabase
        .from(
          "signature_documents"
        )
        .select(
          "tax_year, document_type"
        )
        .eq(
          "signature_request_id",
          requestId
        )
        .returns<DocumentRow[]>();

    if (docsError) {
      return json(400, {
        ok: false,
        error: docsError.message,
      });
    }

    if (
      !documents ||
      documents.length === 0
    ) {
      return json(400, {
        ok: false,
        error:
          "Aucun document à signer dans cette demande.",
      });
    }

    const resendApiKey =
      process.env
        .RESEND_API_KEY
        ?.trim();

    if (!resendApiKey) {
      return json(500, {
        ok: false,
        error:
          "RESEND_API_KEY est manquante dans Vercel.",
      });
    }

    const siteUrl = (
      process.env
        .NEXT_PUBLIC_SITE_URL
        ?.trim() ||
      "https://comptanetquebec.com"
    ).replace(/\/$/, "");

    const fromEmail =
      process.env
        .FROM_EMAIL
        ?.trim() ||
      "ComptaNet Québec <info@comptanetquebec.com>";

    const replyTo =
      process.env
        .RESEND_REPLY_TO
        ?.trim() ||
      undefined;

    // Nouveau lien à chaque envoi
    // ou renvoi.
    const rawToken =
      randomBytes(32)
        .toString("base64url");

    const tokenHash =
      createHash("sha256")
        .update(rawToken)
        .digest("hex");

    const expiresAt =
      new Date(
        Date.now() +
          LINK_VALID_DAYS *
            24 *
            60 *
            60 *
            1000
      ).toISOString();

    const {
      error: tokenError,
    } =
      await supabase
        .from(
          "signature_requests"
        )
        .update({
          token_hash: tokenHash,
          expires_at: expiresAt,
        })
        .eq(
          "id",
          requestId
        );

    if (tokenError) {
      return json(400, {
        ok: false,
        error: tokenError.message,
      });
    }

    const years = [
      ...new Set(
        documents
          .map(
            (document) =>
              Number(
                document.tax_year
              )
          )
          .filter(
            Number.isFinite
          )
      ),
    ].sort(
      (a, b) => a - b
    );

    const yearsText =
      years.length > 0
        ? years.join(", ")
        : "";

    const signingUrl =
      `${siteUrl}/signature/${rawToken}`;

    const safeName =
      escapeHtml(
        signatureRequest
          .signer_name ||
          "Client"
      );

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

        <p>
          Bonjour ${safeName},
        </p>

        ${
          isResend
            ? `
              <p>
                Ceci est un rappel concernant vos
                documents fiscaux à signer.
              </p>
            `
            : ""
        }

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

        <p
          style="
            font-size:13px;
            color:#64748b;
          "
        >
          Ce lien est personnel et expire dans
          ${LINK_VALID_DAYS} jours.
          Ne le transférez pas.
        </p>

        <p>
          Merci,<br>
          <strong>
            ComptaNet Québec
          </strong>
        </p>
      </div>
    `;

    const text =
      `Bonjour ${signatureRequest.signer_name},\n\n` +
      (
        isResend
          ? `Ceci est un rappel concernant vos documents fiscaux à signer.\n\n`
          : ""
      ) +
      `Des documents fiscaux sont prêts pour votre signature` +
      (
        yearsText
          ? ` pour l’année ou les années ${yearsText}`
          : ""
      ) +
      `.\n\nOuvrez ce lien : ${signingUrl}\n\n` +
      `Ce lien expire dans ${LINK_VALID_DAYS} jours.\n\n` +
      `ComptaNet Québec`;

    const subjectYears =
      yearsText
        ? ` — ${yearsText}`
        : "";

    const subject =
      isResend
        ? `Rappel — Documents à signer${subjectYears} — ComptaNet Québec`
        : `Documents à signer${subjectYears} — ComptaNet Québec`;

    const resend =
      new Resend(
        resendApiKey
      );

    const {
      data: emailData,
      error: emailError,
    } =
      await resend.emails.send({
        from: fromEmail,
        to: email,
        replyTo,
        subject,
        html,
        text,
        tags: [
          {
            name: "type",
            value:
              isResend
                ? "signature-resend"
                : "signature",
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
      new Date()
        .toISOString();

    const {
      error: updateError,
    } =
      await supabase
        .from(
          "signature_requests"
        )
        .update({
          status: "sent",
          sent_at: sentAt,
        })
        .eq(
          "id",
          requestId
        );

    if (updateError) {
      return json(400, {
        ok: false,
        error:
          updateError.message,
      });
    }

    await supabase
      .from(
        "signature_events"
      )
      .insert({
        signature_request_id:
          requestId,
        signature_document_id:
          null,
        event_type:
          isResend
            ? "email_resent"
            : "email_sent",
        metadata: {
          email_id:
            emailData?.id ??
            null,
          expires_at:
            expiresAt,
          tax_years:
            years,
          resend:
            isResend,
        },
      });

    return json(200, {
      ok: true,
      sentTo: email,
      resent: isResend,
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
