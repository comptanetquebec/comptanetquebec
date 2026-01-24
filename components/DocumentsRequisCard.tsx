import React from "react";

export function DocumentsRequisCard() {
  return (
    <section className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <h2 className="m-0 text-xl font-extrabold">📄 Liste des documents requis</h2>

      <p className="mt-2 text-base text-black/80">
        Télécharge la liste complète des documents à fournir.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <a
          href="/docs/liste-documents-requis.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 font-extrabold text-white sm:w-auto"
        >
          Ouvrir le PDF →
        </a>

        <a
          href="/docs/liste-documents-requis.pdf"
          download
          className="inline-flex w-full items-center justify-center rounded-xl border border-black/15 bg-white px-4 py-3 font-extrabold sm:w-auto"
        >
          Télécharger
        </a>
      </div>

      <p className="mt-3 text-xs text-black/60">
        *Le PDF est dans <code>public/docs</code> donc le lien est <code>/docs/...</code>
      </p>
    </section>
  );
}
