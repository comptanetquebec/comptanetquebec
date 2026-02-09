// app/paiement/succes/page.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

type Lang = "fr" | "en" | "es";
function normalizeLang(v?: string): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

export default async function PaiementSuccesPage({
  searchParams,
}: {
  searchParams: { fid?: string; lang?: string };
}) {
  const fid = (searchParams.fid || "").trim();
  const lang = normalizeLang(searchParams.lang);

  if (!fid) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold">Paiement confirmé ✅</h1>
        <p className="mt-3">Merci! Paiement reçu.</p>
        <p className="mt-4 text-sm opacity-70">Identifiant de dossier manquant.</p>
      </main>
    );
  }

  const supabase = await supabaseServer();

  const { data: form, error } = await supabase
    .from("formulaires_fiscaux")
    .select("cq_id, courriel, prenom, nom")
    .eq("id", fid)
    .maybeSingle();

  const cqId = form?.cq_id || null;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold">
        {lang === "en"
          ? "Payment confirmed ✅"
          : lang === "es"
            ? "Pago confirmado ✅"
            : "Paiement confirmé ✅"}
      </h1>

      <p className="mt-3">
        {lang === "en"
          ? "Thank you! We received your payment."
          : lang === "es"
            ? "¡Gracias! Hemos recibido tu pago."
            : "Merci! Nous avons bien reçu ton paiement."}
      </p>

      <div className="mt-5 rounded-xl border p-4">
        <div className="text-sm opacity-70">
          {lang === "en"
            ? "File number"
            : lang === "es"
              ? "Número de expediente"
              : "Numéro de dossier"}
        </div>

        <div className="text-2xl font-semibold">
          {cqId ?? "—"}
        </div>

        {!cqId ? (
          <p className="mt-2 text-sm opacity-70">
            {lang === "en"
              ? "Your file number will appear shortly."
              : lang === "es"
                ? "Tu número aparecerá en breve."
                : "Ton numéro apparaîtra sous peu."}
          </p>
        ) : (
          <p className="mt-2 text-sm opacity-70">
            {lang === "en"
              ? "Keep this number for any follow-up."
              : lang === "es"
                ? "Guarda este número para cualquier seguimiento."
                : "Conserve ce numéro pour tout suivi."}
          </p>
        )}

        {/* debug safe: au besoin tu peux aussi afficher fid en petit */}
        <div className="mt-3 text-xs opacity-50 break-all">
          fid: {fid}
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-600">
          Erreur: {error.message}
        </p>
      ) : null}

      <div className="mt-6">
        <Link className="px-4 py-2 rounded-lg border" href="/espace-client">
          {lang === "en" ? "Back to client area" : lang === "es" ? "Volver" : "Retour à l’espace client"}
        </Link>
      </div>
    </main>
  );
}
