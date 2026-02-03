import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

import CookieBanner from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: "Espace client - ComptaNet Québec",
  description: "Accédez à votre espace client sécurisé pour déposer vos documents fiscaux.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        <Suspense fallback={null}>{children}</Suspense>

        {/* ✅ Cookie banner global */}
        <CookieBanner />
      </body>
    </html>
  );
}
