import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Espace client - ComptaNet Québec",
  description:
    "Accédez à votre espace client sécurisé pour déposer vos documents fiscaux.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        {/* <= Important pour useSearchParams partout dans l'app */}
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  );
}
