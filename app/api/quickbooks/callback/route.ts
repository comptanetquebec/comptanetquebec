import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const realmId = req.nextUrl.searchParams.get("realmId");

  if (!code || !realmId) {
    return NextResponse.json(
      { error: "Code ou realmId manquant dans le callback QuickBooks" },
      { status: 400 }
    );
  }

  // Étape suivante : échanger le "code" contre un access_token (à faire après test)
  return NextResponse.json({
    ok: true,
    message: "Callback QuickBooks reçu avec succès",
    code,
    realmId,
  });
}
