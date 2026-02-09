// app/paiement/succes/page.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

type Lang = "fr" | "en" | "es";

function normalizeLang(v?: string): Lang {
  const x = (v || "").toLowerCase();
  return x === "fr" || x === "en" || x === "es" ? (x as Lang) : "fr";
}

function t(lang: Lang) {
  return {
    title: lang === "en" ? "Payment confirmed ✅" : lang === "es" ? "Pago confirmado ✅" : "Paiement confirmé ✅",
    thanks:
      lang === "en"
        ? "Thank you! We received your payment."
        : lang === "es"
          ? "¡Gracias! Hemos recibido tu pago."
          : "Merci! Nous avons bien reçu ton paiement.",
    missingFid:
      lang === "en"
        ? "Missing file id."
        : lang === "es"
          ? "Falta el id del expediente."
          : "Identifiant de dossier manquant.",
    notFound:
      lang === "en"
        ? "File not found (or access denied)."
        : lang === "es"
          ? "Expediente no encontrado (o acceso denegado)."
          : "Dossier introuvable (ou accès refusé).",
    fileNumber:
      lang === "en" ? "File number" : lang === "es" ? "Número de expediente" : "Numéro de dossier",
    keep:
      lang === "en"
        ? "Keep this number for any follow-up."
        : lang === "es"
          ? "Guarda este número para cualquier seguimiento."
          : "Conserve ce numéro pour tout suivi.",
    pending:
      lang === "en"
        ? "Your file number will appear shortly."
        : lang === "es"
          ? "Tu número aparecerá en breve."
          : "Ton numéro apparaîtra sous peu.",
    back:
      lang === "en" ? "Back to client area" : lang === "es" ? "Volver" : "Retour à l’espace client",
  };
}

export default async function PaiementSuccesPage({
  searchParams,
}: {
  searchParams: { fid?: string; lang?: string };
}) {
  const fid = (searchParams.fid || "").trim();
  const lang = normalizeLang(searchParams.lang);
  const TXT = t(lang);

  if (!fid) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold">{TXT.title}</h1>
        <p className="mt-3">{TXT.thanks}</p>
        <p className="mt-4 text-sm text-red-600">{TXT.missingFid}</p>
        <div className="mt-6">
          <Link className="px-4 py-2 rounded-lg border" href="/espace-client">
            {TXT.back}
          </Link>
        </div>
      </main>
    );
  }

  const supabase = await supabaseServer();

  const { data: form, error } = await supabase
    .from("formulaires_fiscaux")
    .select("cq_id")
    .eq("id", fid)
    .maybeSingle();

  // Erreur DB (RLS, etc.)
  if (error) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold">{TXT.title}</h1>
        <p className="mt-3">{TXT.thanks}</p>
        <p className="mt-4 text-sm text-red-600">
          {error.message}
        </p>
        <div className="mt-6">
          <Link className="px-4 py-2 rounded-lg border" href="/espace-client">
            {TXT.back}
          </Link>
        </div>

        {process.env.NODE_ENV !== "production" ? (
          <div className="mt-4 text-xs opacity-50 break-all">fid: {fid}</div>
        ) : null}
      </main>
    );
  }

  // Pas trouvé (ou accès refusé sans erreur explicite)
  if (!form) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold">{TXT.title}</h1>
        <p className="mt-3">{TXT.thanks}</p>
        <p className="mt-4 text-sm text-red-600">{TXT.notFound}</p>
        <div className="mt-6">
          <Link className="px-4 py-2 rounded-lg border" href="/espace-client">
            {TXT.back}
          </Link>
        </div>

        {process.env.NODE_ENV !== "production" ? (
          <div className="mt-4 text-xs opacity-50 break-all">fid: {fid}</div>
        ) : null}
      </main>
    );
  }

  const cqId = (form.cq_id ? String(form.cq_id) : "").trim();
  const hasCq = cqId.startsWith("CQ-");

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold">{TXT.title}</h1>
      <p className="mt-3">{TXT.thanks}</p>

      <div className="mt-5 rounded-xl border p-4">
        <div className="text-sm opacity-70">{TXT.fileNumber}</div>

        <div className="text-2xl font-semibold">{hasCq ? cqId : "—"}</div>

        <p className="mt-2 text-sm opacity-70">
          {hasCq ? TXT.keep : TXT.pending}
        </p>

        {process.env.NODE_ENV !== "production" ? (
          <div className="mt-3 text-xs opacity-50 break-all">fid: {fid}</div>
        ) : null}
      </div>

      <div className="mt-6">
        <Link className="px-4 py-2 rounded-lg border" href="/espace-client">
          {TXT.back}
        </Link>
      </div>
    </main>
  );
}
