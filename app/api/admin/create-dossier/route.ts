import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  // Auth
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { email, flow, lang } = body;

  if (!flow) {
    return NextResponse.json(
      { error: "Flow manquant" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("formulaires_fiscaux")
    .insert({
      form_type: flow,      // t1 | ta | t2
      lang: lang ?? "fr",
      user_id: auth.user.id,
      email: email ?? null, // OK même si email vide
      data: {},             // ✅ OBLIGATOIRE (cause de ton bug)
    })
    .select("id")
    .single();

  if (error) {
    console.error("CREATE DOSSIER ERROR", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
