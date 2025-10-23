import type { Metadata } from "next";
import "./globals.css";
import LangProvider from "./providers/LangProvider";

export const metadata: Metadata = {
  title: "Espace client - ComptaNet Québec",
  description:
    "Accédez à votre espace client sécurisé pour déposer vos documents fiscaux.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        {/* ✅ Envelopper tout avec le fournisseur de langue */}
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
