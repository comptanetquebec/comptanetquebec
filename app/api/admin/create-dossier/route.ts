import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

type Flow = "t1" | "ta" | "t2";
type Lang = "fr" | "en" | "es";

function normalizeFlow(v: unknown): Flow | null {
  const x = String(v ?? "").toLowerCase();
  return x === "t1" || x === "ta" || x === "t2" ? (x as Flow) : null;
}
function normalizeLang(v: unknown): Lang {
  const x = String(v ?? "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();

  // 1) Auth
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return bad("Non autorisé", 401);

  // 2) Admin check
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profErr) return bad(profErr.message, 500);
  if (!profile?.is_admin) return bad("Accès refusé", 403);

  // 3) Payload
  const body = await req.json().catch(() => null);
  if (!body) return bad("Body invalide");

  const flow = normalizeFlow(body.flow);
  const lang = normalizeLang(body.lang);

  if (!flow) return bad("Flow invalide");

  // 4) Create dossier (présentiel) — ✅ sans colonne email
  const { data, error } = await supabase
    .from("formulaires_fiscaux")
    .insert({
      form_type: flow, // ✅ c’est ton champ réel
      lang,
      user_id: auth.user.id,
      // si tu as d’autres colonnes obligatoires (NOT NULL sans default),
      // il faudra les ajouter ici
    })
    .select("id")
    .single();

  if (error) {
    console.error("CREATE DOSSIER ERROR", error);
    return bad(error.message, 500);
  }

  return NextResponse.json({ ok: true, fid: data.id });
}
