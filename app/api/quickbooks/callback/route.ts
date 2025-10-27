import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const realmId = searchParams.get("realmId");

  if (!code || !realmId) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  // Ici tu pourrais sauvegarder les tokens QuickBooks dans Supabase ou QuickBooks API
  // Pour l’instant on redirige simplement vers l’espace client
  return NextResponse.redirect("/espace-client?quickbooks=connected");
}
