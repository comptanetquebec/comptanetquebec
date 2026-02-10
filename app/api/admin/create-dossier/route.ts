import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type Flow = "t1" | "ta" | "t2";
type Lang = "fr" | "en" | "es";

type CreateDossierBody = {
  flow?: unknown;
  lang?: unknown;
  email?: unknown;
};

function normalizeFlow(v: unknown): Flow | null {
  const x = String(v ?? "").toLowerCase();
  return x === "t1" || x === "ta" || x === "t2" ? (x as Flow) : null;
}

function normalizeLang(v: unknown): Lang {
  const x = String(v ?? "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

function normalizeEmail(v: unknown): string | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return null;
  // validation légère (évite les pires cas)
  if (!s.includes("@") || !s.includes(".")) return null;
  return s;
}

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Erreur serveur";
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  // Auth
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: CreateDossierBody;
  try {
    const raw: unknown = await req.json();

    // on accepte seulement un objet JSON
    if (!raw || typeof raw !== "object") {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    body = raw as CreateDossierBody;
  } catch (e: unknown) {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const flow = normalizeFlow(body.flow);
  if (!flow) {
    return NextResponse.json(
      { error: "Flow manquant ou invalide" },
      { status: 400 }
    );
  }

  const lang = normalizeLang(body.lang);
  const email = normalizeEmail(body.email);

  try {
    const { data, error } = await supabase
      .from("formulaires_fiscaux")
      .insert({
        form_type: flow, // 't1' | 'ta' | 't2'
        lang,
        user_id: auth.user.id,
        email, // null si vide ou invalide
        status: "draft", // contrainte chk_formulaires_status
        data: {}, // NOT NULL
      })
      .select("id")
      .single();

    if (error) {
      console.error("CREATE DOSSIER ERROR", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (e: unknown) {
    console.error("CREATE DOSSIER EXCEPTION", e);
    return NextResponse.json({ error: errMessage(e) }, { status: 500 });
  }
}
