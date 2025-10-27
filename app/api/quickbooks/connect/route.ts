import { NextResponse } from "next/server";

export async function GET() {
  // On lit tes variables Vercel
  const clientId = process.env.QB_CLIENT_ID!;
  const redirectUri = process.env.QB_REDIRECT_URI!;
  // sandbox ou production (on ne s’en sert pas pour l’URL maintenant,
  // mais on le garde si tu veux afficher/logguer plus tard)
  const env =
    process.env.QB_ENVIRONMENT === "production" ? "production" : "sandbox";

  // IMPORTANT: même URL pour sandbox et production maintenant
  const baseAuthorizeUrl = "https://appcenter.intuit.com/connect/oauth2";

  // Permissions qu’on demande à QuickBooks
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: [
      "com.intuit.quickbooks.accounting",
      "openid",
      "profile",
      "email",
      "phone",
      "address",
    ].join(" "),
    redirect_uri: redirectUri,
    state: "secureRandomState123", // on pourra le rendre dynamique plus tard
  });

  const authorizeUrl = `${baseAuthorizeUrl}?${params.toString()}`;

  // On redirige le navigateur vers QuickBooks
  return NextResponse.redirect(authorizeUrl);
}
