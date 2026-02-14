import Link from "next/link";
import AssistantChat from "@/components/AssistantChat";

export const metadata = {
  title: "Assistant ComptaNet | Aide",
  description:
    "Posez vos questions générales sur les impôts, les documents à fournir et le fonctionnement du service.",
};

export default function AidePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Assistant ComptaNet</h1>

            <p className="mt-2 text-sm text-neutral-600">
              Posez vos questions <span className="font-medium">générales</span> sur les impôts au Québec,
              les documents à fournir et le fonctionnement du service.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/espace-client"
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
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

        {/* Bloc “info générale / pas un avis pro” */}
        <div className="mt-4 rounded-xl border bg-white p-4 text-sm text-neutral-700">
          <p className="font-medium">Important</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Cet assistant donne de <span className="font-medium">l’information générale</span> seulement.
            </li>
            <li>
              Il ne remplace pas un comptable et ne fournit pas de <span className="font-medium">conseils personnalisés</span>.
            </li>
            <li>
              Pour une réponse adaptée, il faut <span className="font-medium">ouvrir un dossier</span> et analyser vos documents.
            </li>
          </ul>
        </div>

        {/* Bloc “ne pas partager d’infos sensibles” */}
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Sécurité</p>
          <p className="mt-1">
            Ne partagez jamais d’informations sensibles dans le chat (ex. NAS, mots de passe, numéros de carte,
            documents d’identité complets). Pour transmettre des documents, utilisez le portail sécurisé.
          </p>
        </div>

        {/* Exemples */}
        <div className="mt-4 rounded-xl border bg-neutral-50 p-4 text-sm text-neutral-700">
          <p className="font-medium">Exemples de questions</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Quels documents dois-je fournir pour un travailleur autonome ?</li>
            <li>Quelle est la différence entre T1, Travailleur autonome et T2 ?</li>
            <li>Comment fonctionne le dépôt de documents et l’envoi du dossier ?</li>
            <li>Quels types de dépenses sont généralement demandés en justificatifs ?</li>
          </ul>
        </div>
      </header>

      {/* Chat */}
      <AssistantChat lang="fr" />
    </main>
  );
}
