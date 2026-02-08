// app/formulaire-fiscal-ta/Steps.tsx
import Link from "next/link";

type Lang = "fr" | "en" | "es";

export default function Steps({
  step,
  lang,
  fid,
}: {
  step: number;
  lang: Lang;
  fid?: string | null;
}) {
  const q = new URLSearchParams();
  if (lang) q.set("lang", lang);
  if (fid) q.set("fid", fid);

  const items = [
    { n: 1, label: "Remplir le formulaire", href: `/formulaire-fiscal-ta?${q}` },
    { n: 2, label: "Revenus & dépenses", href: `/formulaire-fiscal-ta/revenus-depenses?${q}` },
    { n: 3, label: "Déposer les documents", href: `/formulaire-fiscal-ta/depot-documents?${q}` },
    { n: 4, label: "Envoyer le dossier", href: `/formulaire-fiscal-ta/envoyer-dossier?${q}` },
  ];

  return (
    <div className="ff-stepsbar" role="navigation" aria-label="Étapes">
      {items.map((it) => {
        const isActive = step === it.n;
        const isDone = step > it.n;
        return (
          <Link
            key={it.n}
            href={it.href}
            className={`ff-stepitem ${isActive ? "is-active" : ""} ${isDone ? "is-done" : ""}`}
          >
            <span className="ff-stepdot">{it.n}</span>
            <span className="ff-steplabel">{it.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
