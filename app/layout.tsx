import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Espace client - ComptaNet Québec",
  description: "Accédez à votre espace client sécurisé pour déposer vos documents fiscaux.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
