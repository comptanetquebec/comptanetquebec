// app/api/contact/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  name?: string;
  email?: string;
  message?: string;
  token?: string; // reCAPTCHA v2
};

function s(v: unknown) {
  return (v == null ? "" : String(v)).trim();
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for") || "";
  // format: "client, proxy1, proxy2"
  const ip = xf.split(",")[0]?.trim();
  return ip || "";
}

// petite fonction pour éviter l'injection HTML
function escapeHtml(str: string) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const name = s(body.name);
    const email = s(body.email).toLowerCase();
    const message = s(body.message);
    const token = s(body.token);

    // 1) validations
    if (!name || !email || !message) {
      return NextResponse.json({ ok: false, error: "Champs manquants." }, { status: 400 });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ ok: false, error: "Email invalide." }, { status: 400 });
    }
    if (name.length > 120 || email.length > 200 || message.length > 5000) {
      return NextResponse.json({ ok: false, error: "Message trop long." }, { status: 400 });
    }
    if (!token) {
      return NextResponse.json({ ok: false, error: "reCAPTCHA manquant." }, { status: 400 });
    }

    // 2) vérification reCAPTCHA v2
    const recaptchaSecret = process.env.RECAPTCHA_SECRET ?? "";
    if (!recaptchaSecret) {
      return NextResponse.json({ ok: false, error: "Missing RECAPTCHA_SECRET" }, { status: 500 });
    }

    const ip = getClientIp(req);

    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: recaptchaSecret,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    });

    const recaptcha = (await verifyRes.json()) as { success?: boolean; "error-codes"?: string[] };

    if (!recaptcha?.success) {
      return NextResponse.json(
        { ok: false, error: "Échec reCAPTCHA.", details: recaptcha?.["error-codes"] ?? [] },
        { status: 400 }
      );
    }

    // 3) envoi e-mail via Resend (HTTP API)
    const apiKey = process.env.RESEND_API_KEY ?? "";
    const to = process.env.CONTACT_TO ?? "";
    const from = process.env.CONTACT_FROM ?? "";

    if (!apiKey) return NextResponse.json({ ok: false, error: "Missing RESEND_API_KEY" }, { status: 500 });
    if (!to) return NextResponse.json({ ok: false, error: "Missing CONTACT_TO" }, { status: 500 });
    if (!from) return NextResponse.json({ ok: false, error: "Missing CONTACT_FROM" }, { status: 500 });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `Nouveau message du site — ${name}`,
        reply_to: email, // ✅ tu peux répondre direct au client
        text: [`Nom: ${name}`, `Email: ${email}`, "", "Message:", message].join("\n"),
        html: `<p><strong>Nom:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<p><strong>Message:</strong><br/>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`,
      }),
    });

    if (!res.ok) {
      const details = await res.text();
      return NextResponse.json({ ok: false, error: "Échec d’envoi email.", details }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erreur inconnue." }, { status: 500 });
  }
}
