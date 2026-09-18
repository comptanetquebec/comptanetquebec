// app/layout.tsx

import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import "./globals.css";

import CookieBanner from "@/components/CookieBanner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://comptanetquebec.com"),

  title: {
    default:
      "Impôt et tenue de livres au Québec | ComptaNet Québec",
    template: "%s | ComptaNet Québec",
  },

  description:
    "Services d'impôt et de tenue de livres en ligne au Québec. Déclarations T1, travailleurs autonomes, compagnies incorporées (T2), suivi des revenus et dépenses, portail sécurisé et paiement en ligne.",

  applicationName: "ComptaNet Québec",

  verification: {
    google: "OVaZ1-gi1TotpMxE-0tuhBVNGOO7JW_YLV0BWMgY9sM",
  },

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
      "Impôt et tenue de livres au Québec | ComptaNet Québec",

    description:
      "Services d'impôt et de tenue de livres en ligne au Québec. Portail sécurisé pour vos documents, revenus, dépenses et services fiscaux.",

    url: "/",
    locale: "fr_CA",

    images: [
      {
        url: "/banniere.png",
        width: 1200,
        height: 630,
        alt: "ComptaNet Québec – Impôt et tenue de livres en ligne",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title:
      "Impôt et tenue de livres au Québec | ComptaNet Québec",

    description:
      "Services d'impôt et de tenue de livres en ligne pour particuliers, travailleurs autonomes et entreprises au Québec.",

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
      // Ignore une URL invalide
    }
  }

  const fromNextUrl = h.get("next-url");

  if (fromNextUrl) {
    return fromNextUrl;
  }

  return "/";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = await getPathnameFromHeaders();

  // L'accueil possède déjà sa propre présentation.
  const showHeader = pathname !== "/";

  return (
    <html lang="fr" className="h-full">
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 antialiased">
        <Suspense fallback={null}>
          {showHeader ? <Header /> : null}

          <div className="flex-1">{children}</div>

          <Footer />
        </Suspense>

        <CookieBanner />
      </body>
    </html>
  );
}
