// app/paiement/succes/page.tsx
import Link from "next/link";

export default function PaiementSuccesPage({
  searchParams,
}: {
  searchParams: {
    fid?: string;
    lang?: string;
    type?: string;
    mode?: string;
  };
}) {
  const fid = searchParams.fid || "";

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold">Paiement confirmé ✅</h1>

      <p className="mt-3">
        Merci! Nous avons bien reçu ton paiement.
      </p>

      {/* Pour l’instant on affiche fid.
          Ensuite on affichera cq_id (pro) en le récupérant via DB. */}
      {fid ? (
        <div className="mt-4 rounded-xl border p-4">
          <div className="text-sm opacity-70">Identifiant de dossier</div>
          <div className="text-lg font-mono break-all">{fid}</div>
          <p className="mt-2 text-sm opacity-70">
            Garde ce numéro pour le suivi de ton dossier.
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex gap-3">
        <Link className="px-4 py-2 rounded-lg border" href="/espace-client">
          Retour à l’espace client
        </Link>
      </div>
    </main>
  );
}
