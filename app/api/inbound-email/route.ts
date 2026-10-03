import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

const FORWARD_TO = "comptanetquebec@gmail.com";

const ALLOWED_RECIPIENTS = [
  "info@comptanetquebec.com",
  "contact@comptanetquebec.com",
];

type ResendEvent = {
  type: string;
  data: {
    email_id: string;
    from?: string;
    to?: string[];
    subject?: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    const apiKey = process.env.RESEND_ADMIN_API_KEY;

    if (!webhookSecret || !apiKey) {
      console.error("Variables Resend manquantes");
      return new NextResponse("Configuration manquante", {
        status: 500,
      });
    }

    const rawBody = await req.text();

    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new NextResponse("Webhook invalide", {
        status: 400,
      });
    }

    const valid = verifyWebhookSignature({
      rawBody,
      id: svixId,
      timestamp: svixTimestamp,
      signatureHeader: svixSignature,
      secret: webhookSecret,
    });

    if (!valid) {
      return new NextResponse("Signature invalide", {
        status: 400,
      });
    }

    const event = JSON.parse(rawBody) as ResendEvent;

    if (event.type !== "email.received") {
      return NextResponse.json({ ok: true });
    }

    const recipients = (event.data.to ?? []).map((email) =>
      email.toLowerCase().trim()
    );

    const destination = recipients.find((email) =>
      ALLOWED_RECIPIENTS.includes(email)
    );

    if (!destination) {
      return NextResponse.json({
        ok: true,
        ignored: true,
      });
    }

    const emailResponse = await fetch(
      `https://api.resend.com/emails/receiving/${event.data.email_id}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        cache: "no-store",
      }
    );

    if (!emailResponse.ok) {
      console.error(
        "Erreur récupération courriel :",
        await emailResponse.text()
      );

      return new NextResponse(
        "Impossible de récupérer le courriel",
        { status: 500 }
      );
    }

    const email = await emailResponse.json();

    const sender =
      email.reply_to?.[0] ||
      email.from ||
      event.data.from ||
      "";

    const subject =
      email.subject ||
      event.data.subject ||
      "(Sans objet)";

    const sendResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "ComptaNet Québec <contact@comptanetquebec.com>",
          to: [FORWARD_TO],
          reply_to: sender,
          subject,
          html:
            email.html ||
            `<pre>${escapeHtml(email.text || "")}</pre>`,
          text: email.text || "",
        }),
      }
    );

    const sendResult = await sendResponse.json();

    if (!sendResponse.ok) {
      console.error("Erreur transfert Gmail :", sendResult);

      return NextResponse.json(
        {
          ok: false,
          error: sendResult,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      forwarded: true,
      originalRecipient: destination,
      id: sendResult.id,
    });
  } catch (error) {
    console.error("Erreur inbound email :", error);

    return new NextResponse("Erreur webhook", {
      status: 400,
    });
  }
}

function verifyWebhookSignature({
  rawBody,
  id,
  timestamp,
  signatureHeader,
  secret,
}: {
  rawBody: string;
  id: string;
  timestamp: string;
  signatureHeader: string;
  secret: string;
}) {
  const timestampNumber = Number(timestamp);

  if (!Number.isFinite(timestampNumber)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);

  if (Math.abs(now - timestampNumber) > 300) {
    return false;
  }

  const secretValue = secret.startsWith("whsec_")
    ? secret.slice(6)
    : secret;

  const secretBytes = Buffer.from(secretValue, "base64");

  const expectedSignature = createHmac(
    "sha256",
    secretBytes
  )
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest("base64");

  const signatures = signatureHeader
    .split(" ")
    .map((value) => value.trim())
    .filter((value) => value.startsWith("v1,"))
    .map((value) => value.slice(3));

  return signatures.some((signature) => {
    try {
      const received = Buffer.from(signature, "base64");
      const expected = Buffer.from(
        expectedSignature,
        "base64"
      );

      return (
        received.length === expected.length &&
        timingSafeEqual(received, expected)
      );
    } catch {
      return false;
    }
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
