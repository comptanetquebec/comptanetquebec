// app/formulaire-fiscal-ta/Steps.tsx
import Link from "next/link";
import { COPY, pickCopy, type CopyLang } from "../formulaire-fiscal/copy"; // ajuste le chemin si besoin

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
  flow: Flow;
}) {
  const L = COPY[pickCopy(lang) as CopyLang];

  const q = new URLSearchParams();
  q.set("lang", lang);
  if (fid) q.set("fid", fid);

  const base = basePathFor(flow);

  // ✅ Labels localisés via copy.ts
  const items =
    flow === "ta"
      ? [
          { n: 1, label: L.steps.ta.s1, href: `${base}?${q}` },
          { n: 2, label: L.steps.ta.s2, href: `${base}/revenus-depenses?${q}` },
          { n: 3, label: L.steps.ta.s3, href: `${base}/depot-documents?${q}` },
          { n: 4, label: L.steps.ta.s4, href: `${base}/envoyer-dossier?${q}` },
        ]
      : [
          // optionnel: si tu veux réutiliser Steps ailleurs
          { n: 1, label: L.steps.t1t2.s1, href: `${base}?${q}` },
          { n: 2, label: L.steps.t1t2.s2, href: `${base}/depot-documents?${q}` },
          { n: 3, label: L.steps.t1t2.s3, href: `${base}/envoyer-dossier?${q}` },
        ];

  const aria =
    lang === "fr" ? "Étapes" : lang === "en" ? "Steps" : "Pasos";

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
