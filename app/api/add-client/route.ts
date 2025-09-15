import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ⚡ Important pour éviter les problèmes avec service_role
export const runtime = "nodejs";

export async function POST(req: Request) {
  // Récupère les variables d'environnement
  const url = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing env SUPABASE_URL");
  if (!serviceRole) throw new Error("Missing env SUPABASE_SERVICE_ROLE_KEY");

  // Initialise Supabase client
  const supabase = createClient(url, serviceRole);

  try {
    const body = await req.json();

    const { error } = await supabase.from("clients").insert([
      {
        prenom: body.prenom,
        nom: body.nom,
        email: body.email,
        telephone: body.telephone,
        client_type: body.client_type,
        message: body.message,
        consent: body.consent,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("Request error:", err);
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
