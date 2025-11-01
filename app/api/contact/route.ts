// app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";

type Body = {
  name?: string;
  email?: string;
  message?: string;
  token?: string; // reCAPTCHA v2 response
};

export async function POST(req: NextRequest) {
  try {
    const { name, email, message, token } = (await req.json()) as Body;

    // 1) validations basiques
    if (!name || !email || !message) {
      return NextResponse.json({ ok: false, error: "Champs manquants." }, { status: 400 });
    }
    if (!token) {
      return NextResponse.json({ ok: false, error: "reCAPTCHA manquant." }, { status: 400 });
    }

    // 2) vérification reCAPTCHA v2
    const secret = process.env.RECAPTCHA_SECRET!;
    const ip = req.headers.get("x-forwarded-for") ?? "";
    const verify = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: Array.isArray(ip) ? ip[0] : ip,
      }),
      // pas de cache
    });
    const recaptcha = (await verify.json()) as { success: boolean; "error-codes"?: string[] };
    if (!recaptcha.success) {
      return NextResponse.json(
        { ok: false, error: "Échec reCAPTCHA.", details: recaptcha["error-codes"] ?? [] },
        { status: 400 }
      );
    }

    // 3) envoi e-mail via Resend
    const apiKey = process.env.RESEND_API_KEY!;
    const to = process.env.CONTACT_TO!;
    const from = process.env.CONTACT_FROM!;

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
        text: [
          `Nom: ${name}`,
          `Email: ${email}`,
          "",
          "Message:",
          message,
        ].join("\n"),
        // simple version HTML
        html: `<p><strong>Nom:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<p><strong>Message:</strong><br/>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ ok: false, error: "Échec d’envoi email.", details: txt }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erreur inconnue." }, { status: 500 });
  }
}

// petite fonction pour éviter l'injection HTML
function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
