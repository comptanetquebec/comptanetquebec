import Link from "next/link";
import AssistantChat from "@/components/AssistantChat";

export const metadata = {
  title: "Assistant ComptaNet | Aide",
  description:
    "Obtenez une réponse rapide à vos questions générales sur l’impôt au Québec, les documents requis et le fonctionnement du service.",
};

export default function AidePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold text-neutral-900">
              Assistant ComptaNet
            </h1>

            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Obtenez une réponse rapide à vos questions générales sur l’impôt au
              Québec, les documents requis et le fonctionnement du service.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/espace-client"
              className="rounded-xl bg-[#004aad] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
            >
              Ouvrir un dossier
            </Link>

            <Link
              href="/espace-client"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Accéder au portail sécurisé
            </Link>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-neutral-700">
          <p className="font-semibold text-neutral-900">Avant de commencer</p>

          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Ce chat fournit de l’information générale seulement.</li>
            <li>Aucun avis fiscal personnalisé n’est donné dans cette section.</li>
            <li>
              N’écrivez pas d’informations sensibles ici (NAS, carte, mots de
              passe, coordonnées bancaires).
            </li>
            <li>
              Pour transmettre vos documents, utilisez toujours le portail
              sécurisé.
            </li>
          </ul>
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-neutral-900">
            Le plus rapide pour commencer
          </p>

          <p className="mt-1 text-sm text-neutral-600">
            Si vous êtes prêt(e) à avancer, ouvrez directement votre dossier en
            ligne et déposez vos documents dans le portail sécurisé.
          </p>

          <div className="mt-3">
            <Link
              href="/espace-client"
              className="inline-flex rounded-xl bg-[#004aad] px-4 py-2 text-sm font-medium text-white transition hover:opacity-95"
            >
              Commencer maintenant
            </Link>
          </div>
        </div>
      </header>

      <section
        aria-label="Assistant fiscal général"
        className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-4"
      >
        <AssistantChat lang="fr" />
      </section>
    </main>
  );
}
