// app/api/contact/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  name?: string;
  email?: string;
  message?: string;
  token?: string;      // reCAPTCHA v2
  company?: string;    // honeypot (champ caché)
};

function s(v: unknown) {
  return (v == null ? "" : String(v)).trim();
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for") || "";
  const ip = xf.split(",")[0]?.trim();
  return ip || "";
}

// évite l'injection HTML
function escapeHtml(str: string) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

type RecaptchaVerifyResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Erreur inconnue.";
}

/**
 * Rate limit SIMPLE en mémoire (best effort).
 * Sur Vercel serverless, ça peut reset (mais ça filtre déjà pas mal).
 */
const hits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, limit = 8, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || cur.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (cur.count >= limit) return { ok: false, retryAfterMs: cur.resetAt - now };
  cur.count += 1;
  return { ok: true };
}

export async function POST(req: Request) {
  try {
    // 0) parse JSON proprement
    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return NextResponse.json({ ok: false, error: "JSON invalide." }, { status: 400 });
    }

    const name = s(body.name);
    const email = s(body.email).toLowerCase();
    const message = s(body.message);
    const token = s(body.token);
    const honeypot = s(body.company); // champ caché

    // 1) Honeypot : si rempli => bot
    if (honeypot) {
      return NextResponse.json({ ok: true }); // on répond ok pour ne pas aider les bots
    }

    // 2) validations
    if (!name || !email || !message) {
      return NextResponse.json({ ok: false, error: "Champs manquants." }, { status: 400 });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ ok: false, error: "Email invalide." }, { status: 400 });
    }
    if (name.length > 120 || email.length > 200 || message.length > 5000) {
      return NextResponse.json({ ok: false, error: "Message trop long." }, { status: 400 });
    }

    // 3) rate limit (par IP + email)
    const ip = getClientIp(req);
    const rlKey = `${ip || "noip"}:${email}`;
    const rl = checkRateLimit(rlKey);
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Trop de messages. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } }
      );
    }

    // 4) reCAPTCHA v2
    const recaptchaSecret = process.env.RECAPTCHA_SECRET ?? "";
    if (!recaptchaSecret) {
      return NextResponse.json({ ok: false, error: "Missing RECAPTCHA_SECRET" }, { status: 500 });
    }
    if (!token) {
      return NextResponse.json({ ok: false, error: "reCAPTCHA manquant." }, { status: 400 });
    }

    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: recaptchaSecret,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    });

    const recaptcha = (await verifyRes.json()) as RecaptchaVerifyResponse;

    if (!recaptcha?.success) {
      return NextResponse.json(
        { ok: false, error: "Échec reCAPTCHA.", details: recaptcha?.["error-codes"] ?? [] },
        { status: 400 }
      );
    }

    // 5) Resend
    const apiKey = process.env.RESEND_API_KEY ?? "";
    const to = process.env.CONTACT_TO ?? "";
    const from = process.env.CONTACT_FROM ?? "";

    if (!apiKey) return NextResponse.json({ ok: false, error: "Missing RESEND_API_KEY" }, { status: 500 });
    if (!to) return NextResponse.json({ ok: false, error: "Missing CONTACT_TO" }, { status: 500 });
    if (!from) return NextResponse.json({ ok: false, error: "Missing CONTACT_FROM" }, { status: 500 });

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessageHtml = escapeHtml(message).replace(/\n/g, "<br/>");

    const subject = `ComptaNet Québec — Nouveau message (${name})`;

    const payload = {
      from,
      to,
      subject,
      // Resend accepte "reply_to" (HTTP API). Certaines libs utilisent "replyTo".
      reply_to: email,
      text: [
        "Nouveau message via le formulaire de contact",
        "",
        `Nom: ${name}`,
        `Email: ${email}`,
        ip ? `IP: ${ip}` : "",
        "",
        "Message:",
        message,
      ].filter(Boolean).join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5">
          <h2 style="margin:0 0 12px">Nouveau message</h2>
          <p style="margin:0 0 6px"><strong>Nom :</strong> ${safeName}</p>
          <p style="margin:0 0 6px"><strong>Email :</strong> ${safeEmail}</p>
          ${ip ? `<p style="margin:0 0 12px"><strong>IP :</strong> ${escapeHtml(ip)}</p>` : `<div style="height:12px"></div>`}
          <p style="margin:0 0 6px"><strong>Message :</strong></p>
          <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa">
            ${safeMessageHtml}
          </div>
        </div>
      `.trim(),
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const details = await res.text();
      return NextResponse.json(
        { ok: false, error: "Échec d’envoi email.", details },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: getErrorMessage(e) }, { status: 500 });
  }
}
