import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    // On effectue une toute petite requête vers Supabase
    const { error } = await supabase.from("users").select("id").limit(1);

    if (error) {
      console.error("Erreur Supabase Keep-Alive:", error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Ping Supabase réussi ✅" });
  } catch (err: any) {
    console.error("Erreur Keep-Alive:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
