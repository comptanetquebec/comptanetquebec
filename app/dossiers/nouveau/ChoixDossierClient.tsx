"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

/* ---------- i18n ---------- */
const LANGS = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS)[number];

type CardText = {
  title: string;
  desc: string;
  deposit: string;
  balance: string;
  cta: string;
};

type Dict = {
  title: string;
  intro: string;
  t1: CardText;
  auto: CardText;
  t2: CardText;
  legal: string;
  logout: string;
};

const I18N: Record<Lang, Dict> = {
  fr: {
    title: "Commencer un dossier",
    intro: "Choisissez le type d’impôt que vous voulez déposer.",
    t1: {
      title: "Impôt des particuliers (T1)",
      desc: "Salarié, étudiant, retraité, etc.",
      deposit: "Acompte requis : 100 $",
      balance: "Solde payable au moment de la signature",
      cta: "Démarrer T1",
    },
    auto: {
      title: "Travailleur autonome (T1)",
      desc: "Entrepreneur, pigiste, livreur, etc.",
      deposit: "Acompte requis : 150 $",
      balance: "Solde payable au moment de la signature",
      cta: "Démarrer travailleur autonome",
    },
    t2: {
      title: "Société / T2",
      desc: "Déclaration d’entreprise incorporée.",
      deposit: "Acompte requis : 400 $",
      balance: "Solde payable au moment de la signature",
      cta: "Démarrer T2",
    },
    legal:
      "L’acompte est non remboursable et sera appliqué au montant total. Le prix final dépend de la complexité du dossier et sera confirmé avant la signature.",
    logout: "Se déconnecter",
  },
  en: {
    title: "Start a file",
    intro: "Choose the type of tax return you want to submit.",
    t1: {
      title: "Personal tax (T1)",
      desc: "Employee, student, retired, etc.",
      deposit: "Deposit required: $100",
      balance: "Balance due at the time of signature",
      cta: "Start T1",
    },
    auto: {
      title: "Self-employed (T1)",
      desc: "Freelancer, contractor, delivery, etc.",
      deposit: "Deposit required: $150",
      balance: "Balance due at the time of signature",
      cta: "Start self-employed",
    },
    t2: {
      title: "Corporation / T2",
      desc: "Incorporated business return.",
      deposit: "Deposit required: $400",
      balance: "Balance due at the time of signature",
      cta: "Start T2",
    },
    legal:
      "The deposit is non-refundable and will be applied to the total amount. The final price depends on the complexity of the file and will be confirmed before signature.",
    logout: "Log out",
  },
  es: {
    title: "Iniciar un expediente",
    intro: "Elige el tipo de declaración que quieres enviar.",
    t1: {
      title: "Impuestos personales (T1)",
      desc: "Empleado, estudiante, jubilado, etc.",
      deposit: "Depósito requerido: 100 $",
      balance: "Saldo a pagar al momento de la firma",
      cta: "Iniciar T1",
    },
    auto: {
      title: "Autónomo (T1)",
      desc: "Freelancer, contratista, repartidor, etc.",
      deposit: "Depósito requerido: 150 $",
      balance: "Saldo a pagar al momento de la firma",
      cta: "Iniciar autónomo",
    },
    t2: {
      title: "Sociedad / T2",
      desc: "Declaración de empresa incorporada.",
      deposit: "Depósito requerido: 400 $",
      balance: "Saldo a pagar al momento de la firma",
      cta: "Iniciar T2",
    },
    legal:
      "El depósito no es reembolsable y se aplicará al total. El precio final depende de la complejidad del expediente y se confirmará antes de la firma.",
    logout: "Cerrar sesión",
  },
};

function isLang(v: string): v is Lang {
  return (LANGS as readonly string[]).includes(v);
}

function normalizeLang(v?: string | null): Lang {
  const x = (v || "fr").toLowerCase();
  return isLang(x) ? x : "fr";
}

function safeNext(v?: string | null): string {
  const raw = (v || "").trim();
  if (!raw) return "/dossiers/nouveau";

  const lower = raw.toLowerCase();
  if (lower.startsWith("http:") || lower.startsWith("https:")) return "/dossiers/nouveau";
  if (lower.startsWith("javascript:")) return "/dossiers/nouveau";

  if (!raw.startsWith("/")) return "/dossiers/nouveau";
  if (raw.startsWith("//")) return "/dossiers/nouveau";

  return raw;
}

/** Ajoute/écrase ?lang= dans un lien interne (garde les autres query) */
function withLang(href: string, lang: Lang): string {
  try {
    const u = new URL(href, "http://dummy.local");
    u.searchParams.set("lang", lang);
    return u.pathname + u.search;
  } catch {
    const sep = href.includes("?") ? "&" : "?";
    return `${href}${sep}lang=${lang}`;
  }
}

export default function ChoixDossierClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const lang = useMemo(() => normalizeLang(sp.get("lang")), [sp]);
  const t = I18N[lang];

  const [email, setEmail] = useState<string | null>(null);
  const checked = useRef(false);

  // ✅ Protection: si pas connecté -> /espace-client?lang=...&next=/dossiers/nouveau
  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;

      if (!u) {
        const next = safeNext("/dossiers/nouveau");
        const nextWithLang = withLang(next, lang);
        router.replace(`/espace-client?lang=${lang}&next=${encodeURIComponent(nextWithLang)}`);
        return;
      }

      setEmail(u.email ?? null);
    })();
  }, [router, lang]);

  const go = (href: string) => {
    const safe = safeNext(href);
    router.push(withLang(safe, lang));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace(`/espace-client?lang=${lang}`);
  };

  return (
    <main className="hero">
      <div className="container">
        <header className="brand" style={{ justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Image
              src="/logo-cq.png"
              alt="ComptaNet Québec"
              width={120}
              height={40}
              priority
              style={{ height: 40, width: "auto" }}
            />
            <span className="brand-text">ComptaNet Québec</span>
          </div>

          <button className="btn btn-outline" onClick={logout} type="button">
            {t.logout}
            {email ? ` (${email})` : ""}
          </button>
        </header>

        <h1 style={{ margin: "8px 0 4px", fontSize: "clamp(24px,3.5vw,34px)" }}>{t.title}</h1>
        <p className="lead">{t.intro}</p>

        <section
          className="cards"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            marginTop: 16,
          }}
        >
          <Card
            title={t.t1.title}
            desc={t.t1.desc}
            deposit={t.t1.deposit}
            balance={t.t1.balance}
            cta={t.t1.cta}
            onClick={() => go("/formulaire-fiscal")}
          />
          <Card
            title={t.auto.title}
            desc={t.auto.desc}
            deposit={t.auto.deposit}
            balance={t.auto.balance}
            cta={t.auto.cta}
            onClick={() => go("/formulaire-fiscal?type=autonome")}
          />
          <Card
            title={t.t2.title}
            desc={t.t2.desc}
            deposit={t.t2.deposit}
            balance={t.t2.balance}
            cta={t.t2.cta}
            onClick={() => go("/T2")}
          />
        </section>

        <p className="note" style={{ marginTop: 14, opacity: 0.85, maxWidth: 980 }}>
          {t.legal}
        </p>
      </div>
    </main>
  );
}

/* ---------- Card ---------- */
type CardProps = {
  title: string;
  desc: string;
  deposit: string;
  balance: string;
  cta: string;
  onClick: () => void;
};

function Card({ title, desc, deposit, balance, cta, onClick }: CardProps) {
  return (
    <div
      className="card"
      style={{
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 200,
      }}
    >
      <h3 style={{ margin: 0 }}>{title}</h3>

      <p className="note" style={{ margin: 0 }}>
        {desc}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{deposit}</p>
        <p className="note" style={{ margin: 0, opacity: 0.85 }}>
          {balance}
        </p>
      </div>

      <div style={{ marginTop: "auto" }}>
        <button className="btn btn-primary" onClick={onClick} type="button">
          {cta}
        </button>
      </div>
    </div>
  );
}
