// app/formulaire-fiscal-ta/Steps.tsx
import Link from "next/link";
import { COPY, pickCopy, type CopyLang } from "./copy";

type Lang = "fr" | "en" | "es";

export default function Steps({
  step,
  lang,
  fid,
}: {
  step: 1 | 2 | 3 | 4;
  lang: Lang;
  fid?: string | null;
}) {
  const L = COPY[pickCopy(lang) as CopyLang];

  const q = new URLSearchParams();
  q.set("lang", lang);
  if (fid) q.set("fid", fid);

  const base = "/formulaire-fiscal-ta";

  const items = [
    { n: 1, label: L.steps.s1, href: `${base}?${q}` },
    { n: 2, label: L.steps.s2, href: `${base}/revenus-depenses?${q}` },
    { n: 3, label: L.steps.s3, href: `${base}/depot-documents?${q}` },
    { n: 4, label: L.steps.s4, href: `${base}/envoyer-dossier?${q}` },
  ] as const;

  const aria = lang === "fr" ? "Étapes" : lang === "en" ? "Steps" : "Pasos";

  return (
    <div className="ff-stepsbar" role="navigation" aria-label={aria}>
      {items.map((it) => {
        const isActive = step === it.n;
        const isDone = step > it.n;
        return (
          <Link
            key={it.n}
            href={it.href}
            className={`ff-stepitem ${isActive ? "is-active" : ""} ${isDone ? "is-done" : ""}`}
            aria-current={isActive ? "step" : undefined}
          >
            <span className="ff-stepdot">{it.n}</span>
            <span className="ff-steplabel">{it.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
