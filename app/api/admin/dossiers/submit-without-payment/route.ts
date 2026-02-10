import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();

  // Auth
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return bad("Non connecté", 401);

  // Admin check
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profErr) return bad(profErr.message, 500);
  if (!profile?.is_admin) return bad("Accès refusé", 403);

  // Body
  const body = await req.json().catch(() => null);
  const fid = String(body?.fid ?? "").trim();
  if (!fid) return bad("fid manquant");

  // Soumettre (choisis le statut que TU veux)
  const { error } = await supabase
    .from("formulaires_fiscaux")
    .update({ status: "submitted" })
    .eq("id", fid);

  if (error) return bad(error.message, 500);

  return NextResponse.json({ ok: true });
}
