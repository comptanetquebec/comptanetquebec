// app/paiement/annule/page.tsx
import Link from "next/link";

export default function PaiementAnnulePage() {
  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold">Paiement annulé</h1>
      <p className="mt-3">Aucun montant n’a été débité.</p>
      <div className="mt-6">
        <Link className="px-4 py-2 rounded-lg border" href="/espace-client">
          Retour
        </Link>
      </div>
    </main>
  );
}
