import { NextResponse } from "next/server";

const CLIENT_ID = process.env.QB_CLIENT_ID!;
const REDIRECT_URI = process.env.QB_REDIRECT_URI!;
const ENVIRONMENT = process.env.QB_ENVIRONMENT || "sandbox";

export async function GET() {
  const baseUrl =
    ENVIRONMENT === "production"
      ? "https://appcenter.intuit.com/connect/oauth2"
      : "https://sandbox.appcenter.intuit.com/connect/oauth2";

  const query = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    scope: "com.intuit.quickbooks.accounting openid profile email phone address",
    redirect_uri: REDIRECT_URI,
    state: "comptanet_quebec",
  });

  const authUrl = `${baseUrl}?${query.toString()}`;
  return NextResponse.redirect(authUrl);
}
