import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  // auth
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { email, flow, lang } = body;

  if (!email || !flow) {
    return NextResponse.json(
      { error: "Données manquantes" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("formulaires_fiscaux")
    .insert({
      email,
      form_type: flow,   // T1 / TA / T2
      lang: lang ?? "fr",
      user_id: auth.user.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("CREATE DOSSIER ERROR", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
