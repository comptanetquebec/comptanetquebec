import { NextResponse } from "next/server";

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
