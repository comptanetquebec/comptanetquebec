// app/paiement/annule/page.tsx
import Link from "next/link";

type Lang = "fr" | "en" | "es";
function normalizeLang(v?: string): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

function t(lang: Lang) {
  return {
    title:
      lang === "en"
        ? "Payment cancelled"
        : lang === "es"
          ? "Pago cancelado"
          : "Paiement annulé",
    message:
      lang === "en"
        ? "No amount has been charged."
        : lang === "es"
          ? "No se ha realizado ningún cargo."
          : "Aucun montant n’a été débité.",
    back:
      lang === "en" ? "Back to client area" : lang === "es" ? "Volver" : "Retour",
  };
}

export default function PaiementAnnulePage({
  searchParams,
}: {
  searchParams: { lang?: string };
}) {
  const lang = normalizeLang(searchParams?.lang);
  const TXT = t(lang);

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold">{TXT.title}</h1>
      <p className="mt-3">{TXT.message}</p>
      <div className="mt-6">
        <Link className="px-4 py-2 rounded-lg border" href="/espace-client">
          {TXT.back}
        </Link>
      </div>
    </main>
  );
}
