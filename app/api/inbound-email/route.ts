import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

const FORWARD_TO = "comptanetquebec@gmail.com";

const ALLOWED_RECIPIENTS = [
  "info@comptanetquebec.com",
  "contact@comptanetquebec.com",
];

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    const adminApiKey = process.env.RESEND_ADMIN_API_KEY;

    if (!webhookSecret || !adminApiKey) {
      console.error("Variables Resend manquantes");
      return new NextResponse("Configuration manquante", {
        status: 500,
      });
    }

    const payload = await req.text();

    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new NextResponse("Headers webhook manquants", {
        status: 400,
      });
    }

    // Vérification cryptographique du webhook Resend
    const event: any = resend.webhooks.verify({
      payload,
      headers: {
        id: svixId,
        timestamp: svixTimestamp,
        signature: svixSignature,
      },
      webhookSecret,
    });

    if (event.type !== "email.received") {
      return NextResponse.json({ ok: true });
    }

    const emailId = event.data.email_id;

    const recipients = (event.data.to || []).map((email: string) =>
      email.toLowerCase().trim()
    );

    const destination = recipients.find((email: string) =>
      ALLOWED_RECIPIENTS.includes(email)
    );

    // Ignore les autres adresses éventuelles du domaine
    if (!destination) {
      return NextResponse.json({
        ok: true,
        ignored: true,
      });
    }

    // Récupère le contenu complet du courriel reçu
    const emailResponse = await fetch(
      `https://api.resend.com/emails/receiving/${emailId}`,
      {
        headers: {
          Authorization: `Bearer ${adminApiKey}`,
        },
        cache: "no-store",
      }
    );

    if (!emailResponse.ok) {
      const error = await emailResponse.text();

      console.error("Erreur récupération email :", error);

      return new NextResponse("Impossible de récupérer le courriel", {
        status: 500,
      });
    }

    const email: any = await emailResponse.json();

    // Récupère les pièces jointes
    const attachmentResponse = await fetch(
      `https://api.resend.com/emails/receiving/${emailId}/attachments`,
      {
        headers: {
          Authorization: `Bearer ${adminApiKey}`,
        },
        cache: "no-store",
      }
    );

    let attachments: any[] = [];

    if (attachmentResponse.ok) {
      const attachmentResult: any = await attachmentResponse.json();

      const files = attachmentResult?.data || [];

      attachments = await Promise.all(
        files.map(async (file: any) => {
          if (!file.download_url) {
            return null;
          }

          const fileResponse = await fetch(file.download_url);

          if (!fileResponse.ok) {
            console.error(
              "Impossible de télécharger :",
              file.filename
            );
            return null;
          }

          const buffer = Buffer.from(
            await fileResponse.arrayBuffer()
          );

          return {
            filename: file.filename || "piece-jointe",
            content: buffer.toString("base64"),
          };
        })
      );

      attachments = attachments.filter(Boolean);
    }

    const sender =
      email.from ||
      event.data.from ||
      "Expéditeur inconnu";

    const subject =
      email.subject ||
      event.data.subject ||
      "(Sans objet)";

    const headerHtml = `
      <div style="
        font-family:Arial,sans-serif;
        background:#f4f6f8;
        border-left:4px solid #173f8a;
        padding:14px 18px;
        margin-bottom:20px;
        line-height:1.5;
      ">
        <strong>Courriel reçu sur ${escapeHtml(destination)}</strong><br>
        De : ${escapeHtml(sender)}
      </div>
    `;

    const headerText =
      `Courriel reçu sur ${destination}\n` +
      `De : ${sender}\n\n`;

    const { data, error } = await resend.emails.send({
      from: "ComptaNet Québec <contact@comptanetquebec.com>",
      to: [FORWARD_TO],

      // Quand tu fais Répondre dans Gmail,
      // la réponse va directement au client.
      replyTo: sender,

      subject,

      html: email.html
        ? `${headerHtml}${email.html}`
        : undefined,

      text:
        headerText +
        (email.text || ""),

      attachments:
        attachments.length > 0
          ? attachments
          : undefined,
    });

    if (error) {
      console.error("Erreur transfert Gmail :", error);

      return NextResponse.json(
        {
          ok: false,
          error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      forwarded: true,
      to: FORWARD_TO,
      originalRecipient: destination,
      id: data?.id,
    });
  } catch (error) {
    console.error("Erreur inbound email :", error);

    return new NextResponse("Webhook invalide", {
      status: 400,
    });
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
