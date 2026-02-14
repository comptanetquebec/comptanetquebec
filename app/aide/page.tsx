import AssistantChat from "@/components/AssistantChat";

export const metadata = {
  title: "Assistant ComptaNet | Aide"import AssistantChat from "./AssistantChat";

export const metadata = {
  title: "Assistant ComptaNet | Aide",
  description:
    "Posez vos questions générales sur les impôts, les documents à fournir et le fonctionnement du service.",
};

export default function AidePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Assistant ComptaNet</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Posez vos questions générales sur les impôts, les documents à fournir et le
          fonctionnement du service.{" "}
          <span className="font-medium">
            Je ne remplace pas un comptable et je ne donne pas de conseils personnalisés.
          </span>
        </p>

        <div className="mt-4 rounded-xl border bg-neutral-50 p-4 text-sm text-neutral-700">
          <p className="font-medium">Exemples de questions :</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Quels documents dois-je fournir pour un travailleur autonome ?</li>
            <li>Quelle est la différence entre T1, Travailleur autonome et T2 ?</li>
            <li>Comment fonctionne le dépôt de documents et l’envoi du dossier ?</li>
            <li>Quels types de dépenses sont généralement demandés en justificatifs ?</li>
          </ul>
        </div>
      </header>

      <AssistantChat />
    </main>
  );
},
  description:
    "Posez vos questions générales sur les impôts, les documents à fournir et le fonctionnement du service.",
};

export default function AidePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Assistant ComptaNet</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Posez vos questions générales sur les impôts, les documents à fournir et le
          fonctionnement du service.{" "}
          <span className="font-medium">
            Je ne remplace pas un comptable et je ne donne pas de conseils personnalisés.
          </span>
        </p>

        <div className="mt-4 rounded-xl border bg-neutral-50 p-4 text-sm text-neutral-700">
          <p className="font-medium">Exemples de questions :</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Quels documents dois-je fournir pour un travailleur autonome ?</li>
            <li>Quelle est la différence entre T1, Travailleur autonome et T2 ?</li>
            <li>Comment fonctionne le dépôt de documents et l’envoi du dossier ?</li>
            <li>Quels types de dépenses sont généralement demandés en justificatifs ?</li>
          </ul>
        </div>
      </header>

      <AssistantChat />
    </main>
  );
}
