// app/layout.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import "./globals.css";

import CookieBanner from "@/components/CookieBanner";
import Header from "@/components/Header";

export const metadata: Metadata = {
  metadataBase: new URL("https://comptanetquebec.com"),

  title: {
    default:
      "Service d’impôt au Québec | Déclaration en ligne T1, Travailleur autonome, T2",
    template: "%s | ComptaNet Québec",
  },

  description:
    "Service de déclaration d’impôt en ligne au Québec. Particuliers (T1), travailleurs autonomes et compagnies incorporées (T2). Portail sécurisé, paiement Stripe et transmission électronique (TED) lorsque applicable.",

  applicationName: "ComptaNet Québec",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    siteName: "ComptaNet Québec",
    title:
      "Service d’impôt au Québec | Déclaration en ligne sécurisée",
    description:
      "Ouvrez votre dossier sécurisé, téléversez vos documents, et votre déclaration est préparée à partir des informations fournies. Transmission électronique (TED) lorsque applicable.",
    url: "/",
    locale: "fr_CA",
    images: [
      {
        url: "/banniere.png",
        width: 1200,
        height: 630,
        alt: "ComptaNet Québec – Service d’impôt en ligne",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Service d’impôt au Québec | Déclaration en ligne",
    description:
      "Particuliers, travailleurs autonomes et compagnies incorporées. Portail sécurisé, paiement Stripe et TED lorsque applicable.",
    images: ["/banniere.png"],
  },

  alternates: {
    canonical: "/",
  },

    icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  other: {
    "format-detection": "telephone=no",
  },
};

async function getPathnameFromHeaders(): Promise<string> {
  const h = await headers();

  const fromUrl = h.get("x-url");
  if (fromUrl) {
    try {
      return new URL(fromUrl).pathname;
    } catch {
      // ignore
    }
  }

  const fromNextUrl = h.get("next-url");
  if (fromNextUrl) return fromNextUrl;

  return "/";
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = await getPathnameFromHeaders();

  const showHeader = pathname !== "/";

  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        {showHeader ? <Header /> : null}

        <Suspense fallback={null}>{children}</Suspense>

        <CookieBanner />
      </body>
    </html>
  );
}
