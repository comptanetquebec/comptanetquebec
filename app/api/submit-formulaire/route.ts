import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL) {
    return NextResponse.json({ success: false, error: "Missing SUPABASE_URL" }, { status: 500 });
  }

  if (!SERVICE_ROLE) {
    return NextResponse.json({ success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const payload = (await req.json()) as Record<string, string>;

    const asBool = (v?: string) => v === "true";

    const normalized = {
      ...payload,
      treat_spouse: asBool(payload.treat_spouse),
      status_changed: asBool(payload.status_changed),
      spouse_same_address: asBool(payload.spouse_same_address),
      lived_alone: asBool(payload.lived_alone),
      foreign_assets_over_100k: asBool(payload.foreign_assets_over_100k),
      non_resident: asBool(payload.non_resident),
      first_home_purchase: asBool(payload.first_home_purchase),
      sold_residence: asBool(payload.sold_residence),
      call_back: asBool(payload.call_back),
    };

    const { data: insertedForm, error: formError } = await supabase
      .from("formulaires_fiscaux")
      .insert([
        {
          data: normalized,
          updated_at: new Date().toISOString(),
        },
      ])
      .select("id")
      .single();

    if (formError || !insertedForm) {
      console.error("Supabase insert formulaire error:", formError);
      return NextResponse.json(
        { success: false, error: formError?.message ?? "Erreur création formulaire" },
        { status: 400 }
      );
    }

    const { error: statusError } = await supabase.from("dossier_statuses").insert([
      {
        formulaire_id: insertedForm.id,
        status: "recu",
        updated_at: new Date().toISOString(),
      },
    ]);

    if (statusError) {
      console.error("Supabase insert status error:", statusError);
      return NextResponse.json({ success: false, error: statusError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      formulaire_id: insertedForm.id,
    });
  } catch (err) {
    console.error("Request error:", err);
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
