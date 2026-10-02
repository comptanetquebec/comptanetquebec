import { NextResponse } from "next/server";

const DOMAIN_ID = "4b7c396a-266a-4097-8e30-d046129b4ddd";

export async function GET() {
  const apiKey = process.env.RESEND_ADMIN_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_ADMIN_API_KEY manquante" },
      { status: 500 }
    );
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  try {
    // Active Sending + Receiving sur le domaine existant
    const updateResponse = await fetch(
      `https://api.resend.com/domains/${DOMAIN_ID}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          capabilities: {
            sending: "enabled",
            receiving: "enabled",
          },
        }),
        cache: "no-store",
      }
    );

    const updateResult = await updateResponse.json().catch(() => null);

    if (!updateResponse.ok) {
      return NextResponse.json(
        {
          step: "enable-receiving",
          status: updateResponse.status,
          result: updateResult,
        },
        { status: updateResponse.status }
      );
    }

    // Relit le domaine après activation
    const domainResponse = await fetch(
      `https://api.resend.com/domains/${DOMAIN_ID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        cache: "no-store",
      }
    );

    const domain = await domainResponse.json().catch(() => null);

    return NextResponse.json(
      {
        success: domainResponse.ok,
        update: updateResult,
        domain,
      },
      { status: domainResponse.status }
    );
  } catch (error) {
    console.error("Erreur activation receiving Resend :", error);

    return NextResponse.json(
      {
        error: "Erreur pendant l’activation de la réception Resend",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const event = await request.json();

    if (event?.type === "email.received") {
      console.log("Courriel reçu :", event.data);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erreur inbound email :", error);

    return NextResponse.json(
      { ok: false },
      { status: 400 }
    );
  }
}
