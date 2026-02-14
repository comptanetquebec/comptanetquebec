import Link from "next/link";
import AssistantChat from "@/components/AssistantChat";

export const metadata = {
  title: "Assistant ComptaNet | Aide",
  description:
    "Posez vos questions générales sur les impôts, les documents à fournir et le fonctionnement du service.",
};

export default function AidePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Assistant ComptaNet</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Questions <span className="font-medium">générales</span> sur l’impôt au Québec, les documents
              requis et le fonctionnement du service.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/espace-client"
              className="rounded-xl bg-[#004aad] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
            >
              Ouvrir un dossier
            </Link>
            <Link
              href="/#contact"
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              Nous contacter
            </Link>
          </div>
        </div>

        {/* Bloc unique compact */}
        <div className="mt-3 rounded-xl border bg-neutral-50 p-3 text-sm text-neutral-700">
          <p className="font-medium">Information importante</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Information générale seulement — aucun avis personnalisé.</li>
            <li>
              N’écrivez pas d’infos sensibles (NAS, carte, mots de passe). Pour les documents, utilisez le
              portail sécurisé.
            </li>
          </ul>
        </div>
      </header>

      <AssistantChat lang="fr" />
    </main>
  );
}
