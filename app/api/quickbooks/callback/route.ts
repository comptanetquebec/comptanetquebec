import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // QuickBooks renvoie ?code=...&realmId=...
  const code = req.nextUrl.searchParams.get("code");
  const realmId = req.nextUrl.searchParams.get("realmId");

  if (!code || !realmId) {
    return NextResponse.json(
      { error: "Code ou realmId manquant dans le callback QuickBooks" },
      { status: 400 }
    );
  }

  // Prochaine étape (quand on sera prêt) :
  // - envoyer ce code + client_id + client_secret à QuickBooks
  //   pour obtenir un access_token et un refresh_token.
  //   -> Ça va nous permettre de créer des factures automatiquement.
  //
  // Pour l’instant on renvoie juste ce qu’on a reçu pour vérifier que le flow marche.
  return NextResponse.json({
    ok: true,
    message: "Callback QuickBooks reçu avec succès",
    code,
    realmId,
  });
}
