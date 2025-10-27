import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.QB_CLIENT_ID!;
  const redirectUri = process.env.QB_REDIRECT_URI!;
  const env = process.env.QB_ENVIRONMENT === "production" ? "production" : "sandbox";

  const baseAuthorizeUrl =
    env === "production"
      ? "https://appcenter.intuit.com/connect/oauth2"
      : "https://sandbox.appcenter.intuit.com/connect/oauth2";

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
    state: "secureRandomState123",
  });

  const authorizeUrl = `${baseAuthorizeUrl}?${params.toString()}`;
  return NextResponse.redirect(authorizeUrl);
}
