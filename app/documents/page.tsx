// app/documents/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import DocumentsPageInner from "./DocumentsPageInner";

// Métadonnées de la page (SEO / onglet navigateur)
export const metadata: Metadata = {
  title: "Mes documents – ComptaNet Québec",
  description:
    "Espace sécurisé pour déposer et gérer vos documents fiscaux (T4, reçus, relevés, etc.).",
};

// Server Component minimal qui enveloppe le composant client
export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <main className="hero">
          <div className="card container">
            <p>Chargement…</p>
          </div>
        </main>
      }
    >
      <DocumentsPageInner />
    </Suspense>
  );
}
