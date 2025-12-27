import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 🔴 REQUÊTE RÉELLE (c’est ça qui empêche la pause)
    const { error } = await supabase
      .from("clients")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Supabase keep-alive error:", error.message);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("Keep-alive crash:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
