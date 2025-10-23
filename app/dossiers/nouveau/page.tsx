"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

/* ---------- i18n ---------- */
const LANGS = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS)[number];

type CardText = {
  title: string;
  desc: string;
  cta: string;
};

type Dict = {
  title: string;
  intro: string;
  t1: CardText;
  auto: CardText;
  t2: CardText;
  logout: string;
};

const I18N: Record<Lang, Dict> = {
  fr: {
    title: "Commencer un dossier",
    intro: "Choisissez le type d’impôt que vous voulez déposer.",
    t1: {
      title: "Impôt des particuliers (T1)",
      desc: "Salarié, étudiant, retraité, etc.",
      cta: "Ouvrir le formulaire T1",
    },
    auto: {
      title: "Travailleur autonome (T1)",
      desc: "Entrepreneur, pigiste, livreur, etc.",
      cta: "Ouvrir le formulaire autonome",
    },
    t2: {
      title: "Société / T2",
      desc: "Déclaration d’entreprise incorporée (acompte 300 $).",
      cta: "Démarrer T2",
    },
    logout: "Se déconnecter",
  },
  en: {
    title: "Start a file",
    intro: "Choose the type of tax return you want to submit.",
    t1: {
      title: "Personal tax (T1)",
      desc: "Employee, student, retired, etc.",
      cta: "Open T1 form",
    },
    auto: {
      title: "Self-employed (T1)",
      desc: "Freelancer, contractor, delivery, etc.",
      cta: "Open self-employed form",
    },
    t2: {
      title: "Corporation / T2",
      desc: "Incorporated business return (300$ deposit).",
      cta: "Start T2",
    },
    logout: "Log out",
  },
  es: {
    title: "Iniciar un expediente",
    intro: "Elige el tipo de declaración que quieres enviar.",
    t1: {
      title: "Impuestos personales (T1)",
      desc: "Empleado, estudiante, jubilado, etc.",
      cta: "Abrir formulario T1",
    },
    auto: {
      title: "Autónomo (T1)",
      desc: "Freelancer, contratista, repartidor, etc.",
      cta: "Abrir formulario autónomo",
    },
    t2: {
      title: "Sociedad / T2",
      desc: "Empresa incorporada (depósito 300$).",
      cta: "Iniciar T2",
    },
    logout: "Cerrar sesión",
  },
};

/* ---------- Page ---------- */
export default function ChoixDossierPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // langue via ?lang=fr|en|es (fr par défaut)
  const langParam = (sp.get("lang") || "fr").toLowerCase();
  const lang: Lang = (LANGS as readonly string[]).includes(
    langParam as Lang
  )
    ? (langParam as Lang)
    : "fr";
  const t = I18N[lang];

  // email affiché dans le bouton "logout"
  const [email, setEmail] = useState<string | null>(null);

  // Protection: si pas connecté -> /espace-client?next=/dossiers/nouveau
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        // en cas d’erreur inattendue, on renvoie au login
        router.replace(`/espace-client?lang=${lang}&next=/dossiers/nouveau`);
        return;
      }
      const u = data.user;
      if (!u) {
        router.replace(`/espace-client?lang=${lang}&next=/dossiers/nouveau`);
      } else if (mounted) {
        setEmail(u.email ?? null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router, lang]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace(`/espace-client?lang=${lang}`);
  }

  function go(href: string) {
    // on garde la langue dans l’URL
    router.push(`${href}${href.includes("?") ? "&" : "?"}lang=${lang}`);
  }

  return (
    <main className="hero">
      <div className="card container">
        <header
          className="brand"
          style={{ justifyContent: "space-between", width: "100%" }}
        >
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
          <button className="btn btn-outline" onClick={logout}>
            {t.logout}
            {email ? ` (${email})` : ""}
          </button>
        </header>

        <h1>{t.title}</h1>
        <p className="lead">{t.intro}</p>

        <div
          className="grid"
          style={{
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            marginTop: 16,
          }}
        >
          <Card
            title={t.t1.title}
            desc={t.t1.desc}
            cta={t.t1.cta}
            onClick={() => go("/formulaire-fiscal")}
          />
          <Card
            title={t.auto.title}
            desc={t.auto.desc}
            cta={t.auto.cta}
            onClick={() => go("/formulaire-fiscal?type=autonome")}
          />
          <Card
            title={t.t2.title}
            desc={t.t2.desc}
            cta={t.t2.cta}
            onClick={() => go("/T2")}
          />
        </div>
      </div>
    </main>
  );
}

/* ---------- Card ---------- */
type CardProps = {
  title: string;
  desc: string;
  cta: string;
  onClick: () => void;
};

function Card({ title, desc, cta, onClick }: CardProps) {
  return (
    <div
      className="card"
      style={{
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 170,
      }}
    >
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p className="note" style={{ margin: 0 }}>
        {desc}
      </p>
      <div style={{ marginTop: "auto" }}>
        <button className="btn btn-primary" onClick={onClick} type="button">
          {cta}
        </button>
      </div>
    </div>
  );
}

