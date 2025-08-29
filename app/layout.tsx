import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ComptaNet Québec",
  description:
    "Services simples et rapides pour vos déclarations de revenus et la tenue de livres au Québec.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
