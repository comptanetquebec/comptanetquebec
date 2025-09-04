import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

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
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

