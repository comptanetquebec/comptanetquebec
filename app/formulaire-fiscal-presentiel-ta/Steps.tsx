// comptanetquebec/app/formulaire-fiscal-presentiel-ta/Steps.tsx
import Link from "next/link";

type Lang = "fr" | "en" | "es";

export default function Steps({
  step,
  lang,
  fid,
}: {
  step: 1 | 2;
  lang: Lang;
  fid?: string | null;
}) {
  const q = new URLSearchParams();
  if (lang) q.set("lang", lang);
  if (fid) q.set("fid", fid);

  const base = "/formulaire-fiscal-presentiel-ta";

  const items = [
    {
      n: 1,
      label: "Informations client",
      href: `${base}?${q.toString()}`,
    },
    {
      n: 2,
      label: "Envoyer le dossier",
      href: `${base}/envoyer-dossier?${q.toString()}`,
    },
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
            className={`ff-stepitem ${isActive ? "is-active" : ""} ${
              isDone ? "is-done" : ""
            }`}
          >
            <span className="ff-stepdot">{it.n}</span>
            <span className="ff-steplabel">{it.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
