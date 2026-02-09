// app/layout.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import "./globals.css";

import CookieBanner from "@/components/CookieBanner";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "ComptaNet Québec",
  description:
    "Accédez à votre espace client sécurisé pour déposer vos documents fiscaux.",
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

  // ✅ Landing "/" : pas de Header global
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

