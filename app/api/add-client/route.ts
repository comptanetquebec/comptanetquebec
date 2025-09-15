import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ⚠️ Ici on utilise les variables SERVEUR (pas NEXT_PUBLIC)
// 👉 Tu dois les définir dans Vercel :
// SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not defined");
}
if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(req: Request) {
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
      console.error(error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
