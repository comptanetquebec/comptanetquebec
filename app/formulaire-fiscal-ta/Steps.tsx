// app/formulaire-fiscal-ta/Steps.tsx
import Link from "next/link";

type Lang = "fr" | "en" | "es";
type Flow = "t1" | "ta" | "t2";

function basePathFor(flow: Flow) {
  switch (flow) {
    case "ta":
      return "/formulaire-fiscal-ta";
    case "t1":
      return "/formulaire-fiscal";
    case "t2":
      return "/formulaire-fiscal-t2";
  }
}

export default function Steps({
  step,
  lang,
  fid,
  flow,
}: {
  step: number;
  lang: Lang;
  fid?: string | null;
  flow: Flow; // ✅ AJOUT
}) {
  const q = new URLSearchParams();
  if (lang) q.set("lang", lang);
  if (fid) q.set("fid", fid);

  const base = basePathFor(flow);

  const items = [
    { n: 1, label: "Remplir le formulaire", href: `${base}?${q}` },
    { n: 2, label: "Revenus & dépenses", href: `${base}/revenus-depenses?${q}` },
    { n: 3, label: "Déposer les documents", href: `${base}/depot-documents?${q}` },
    { n: 4, label: "Envoyer le dossier", href: `${base}/envoyer-dossier?${q}` },
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
