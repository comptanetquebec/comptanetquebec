import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ComptaNet Québec",
  description: "Votre partenaire de confiance pour la fiscalité et la comptabilité au Québec.",
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
