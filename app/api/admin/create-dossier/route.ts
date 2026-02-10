import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

type Flow = "t1" | "ta" | "t2";
type Lang = "fr" | "en" | "es";

function normalizeEmail(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}
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
  if (authErr || !auth?.user) return bad("Non connecté", 401);

  // 2) Admin check
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.is_admin) return bad("Accès refusé", 403);

  // 3) Payload
  const body = await req.json().catch(() => null);
  if (!body) return bad("Body invalide");

  const email = normalizeEmail(body.email);
  const flow = normalizeFlow(body.flow);
  const lang = normalizeLang(body.lang);

  if (!email.includes("@")) return bad("Email invalide");
  if (!flow) return bad("Flow invalide");

  // 4) Create dossier (présentiel)
  const { data: created, error } = await supabase
    .from("formulaires_fiscaux")
    .insert({
      email,
      flow,
      lang,
      paiement_mode: "apres",
      acompte_paye: true, // ✅ pas de blocage Stripe
      status: "recu", // si tu as cette colonne; sinon enlève
    })
    .select("id")
    .single();

  if (error) return bad(error.message, 500);

  return NextResponse.json({ ok: true, fid: created.id });
}
