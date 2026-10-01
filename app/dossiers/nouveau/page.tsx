"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

/* =========================================================
   LANGUES
========================================================= */

const LANGS = ["fr", "en", "es"] as const;
type Lang = (typeof LANGS)[number];

type CardText = {
  badge: string;
  title: string;
  desc: string;
  examples: string;
  deposit: string;
  balance: string;
  cta: string;
};

type Dict = {
  title: string;
  intro: string;
  t1: CardText;
  t2: CardText;
  legal: string;
  logout: string;
};

const I18N: Record<Lang, Dict> = {
  fr: {
    title: "Commencer un dossier",
    intro:
      "Choisissez le type de déclaration que vous souhaitez préparer.",

    t1: {
      badge: "PARTICULIERS",
      title: "Déclaration T1",
      desc:
        "Déclaration d’impôt personnelle pour les particuliers.",
      examples:
        "Salarié, étudiant, retraité, travailleur autonome, revenus de location et autres situations personnelles.",
      deposit: "Acompte requis : 100 $",
      balance:
        "Le solde sera payable au moment de la signature.",
      cta: "Démarrer ma déclaration T1",
    },

    t2: {
      badge: "ENTREPRISES",
      title: "Déclaration T2",
      desc:
        "Déclaration d’impôt pour une société incorporée.",
      examples:
        "Pour les entreprises constituées en société qui doivent produire une déclaration de revenus T2.",
      deposit: "Acompte requis : 400 $",
      balance:
        "Le solde sera payable au moment de la signature.",
      cta: "Démarrer ma déclaration T2",
    },

    legal:
      "L’acompte est non remboursable et sera appliqué au montant total de la facture. Le prix final dépend de la complexité du dossier et sera confirmé avant la signature.",

    logout: "Se déconnecter",
  },

  en: {
    title: "Start a file",
    intro:
      "Choose the type of tax return you would like to prepare.",

    t1: {
      badge: "INDIVIDUALS",
      title: "T1 Tax Return",
      desc:
        "Personal income tax return for individuals.",
      examples:
        "Employee, student, retiree, self-employed, rental income and other personal tax situations.",
      deposit: "Deposit required: $100",
      balance:
        "The remaining balance is payable at the time of signature.",
      cta: "Start my T1 return",
    },

    t2: {
      badge: "BUSINESSES",
      title: "T2 Tax Return",
      desc:
        "Corporate income tax return for an incorporated business.",
      examples:
        "For incorporated businesses required to file a T2 corporate income tax return.",
      deposit: "Deposit required: $400",
      balance:
        "The remaining balance is payable at the time of signature.",
      cta: "Start my T2 return",
    },

    legal:
      "The deposit is non-refundable and will be applied to the total invoice. The final price depends on the complexity of the file and will be confirmed before signature.",

    logout: "Log out",
  },

  es: {
    title: "Iniciar un expediente",
    intro:
      "Elige el tipo de declaración que deseas preparar.",

    t1: {
      badge: "PARTICULARES",
      title: "Declaración T1",
      desc:
        "Declaración de impuestos personales para particulares.",
      examples:
        "Empleado, estudiante, jubilado, trabajador autónomo, ingresos de alquiler y otras situaciones personales.",
      deposit: "Depósito requerido: 100 $",
      balance:
        "El saldo restante se pagará al momento de la firma.",
      cta: "Iniciar mi declaración T1",
    },

    t2: {
      badge: "EMPRESAS",
      title: "Declaración T2",
      desc:
        "Declaración de impuestos para una empresa incorporada.",
      examples:
        "Para empresas constituidas en sociedad que deben presentar una declaración de impuestos T2.",
      deposit: "Depósito requerido: 400 $",
      balance:
        "El saldo restante se pagará al momento de la firma.",
      cta: "Iniciar mi declaración T2",
    },

    legal:
      "El depósito no es reembolsable y se aplicará al total de la factura. El precio final depende de la complejidad del expediente y se confirmará antes de la firma.",

    logout: "Cerrar sesión",
  },
};

/* =========================================================
   OUTILS
========================================================= */

function normalizeLang(value?: string | null): Lang {
  const lang = (value || "fr").toLowerCase();

  return (LANGS as readonly string[]).includes(lang)
    ? (lang as Lang)
    : "fr";
}

function addLang(href: string, lang: Lang) {
  try {
    const url = new URL(href, "https://comptanetquebec.com");

    url.searchParams.set("lang", lang);

    return `${url.pathname}${url.search}`;
  } catch {
    return href;
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function ChoixDossierClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const lang = useMemo(
    () => normalizeLang(searchParams.get("lang")),
    [searchParams]
  );

  const t = I18N[lang];

  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  /* ---------- protection de la page ---------- */

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      const { data } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      if (!data.user) {
        router.replace(
          `/espace-client?lang=${lang}&next=${encodeURIComponent(
            `/dossiers/nouveau?lang=${lang}`
          )}`
        );

        return;
      }

      setEmail(data.user.email ?? null);
      setChecking(false);
    }

    checkUser();

    return () => {
      mounted = false;
    };
  }, [router, lang]);

  function go(href: string) {
    router.push(addLang(href, lang));
  }

  async function logout() {
    await supabase.auth.signOut();

    router.replace(`/espace-client?lang=${lang}`);
  }

  if (checking) {
    return (
      <main style={pageStyle}>
        <div style={loadingStyle}>Chargement…</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>

        {/* =================================================
            EN-TÊTE
        ================================================= */}

        <header style={headerStyle}>
          <div style={brandStyle}>
            <Image
              src="/logo-cq.png"
              alt="ComptaNet Québec"
              width={48}
              height={48}
              priority
              style={{
                width: 48,
                height: 48,
                objectFit: "contain",
              }}
            />

            <div>
              <div style={brandNameStyle}>
                ComptaNet Québec
              </div>

              <div style={portalStyle}>
                Portail sécurisé
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            style={logoutButtonStyle}
          >
            {t.logout}

            {email && (
              <span style={emailStyle}>
                {email}
              </span>
            )}
          </button>
        </header>

        {/* =================================================
            TITRE
        ================================================= */}

        <section style={introSectionStyle}>
          <h1 style={titleStyle}>
            {t.title}
          </h1>

          <p style={introStyle}>
            {t.intro}
          </p>
        </section>

        {/* =================================================
            T1 + T2
        ================================================= */}

        <section style={cardsGridStyle}>
          <TaxCard
            badge={t.t1.badge}
            title={t.t1.title}
            desc={t.t1.desc}
            examples={t.t1.examples}
            deposit={t.t1.deposit}
            balance={t.t1.balance}
            cta={t.t1.cta}
            onClick={() =>
              go("/formulaire-fiscal")
            }
          />

          <TaxCard
            badge={t.t2.badge}
            title={t.t2.title}
            desc={t.t2.desc}
            examples={t.t2.examples}
            deposit={t.t2.deposit}
            balance={t.t2.balance}
            cta={t.t2.cta}
            onClick={() =>
              go("/T2")
            }
          />
        </section>

        {/* =================================================
            NOTE
        ================================================= */}

        <div style={legalBoxStyle}>
          {t.legal}
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   CARTE
========================================================= */

type TaxCardProps = {
  badge: string;
  title: string;
  desc: string;
  examples: string;
  deposit: string;
  balance: string;
  cta: string;
  onClick: () => void;
};

function TaxCard({
  badge,
  title,
  desc,
  examples,
  deposit,
  balance,
  cta,
  onClick,
}: TaxCardProps) {
  return (
    <article style={cardStyle}>
      <div style={badgeStyle}>
        {badge}
      </div>

      <h2 style={cardTitleStyle}>
        {title}
      </h2>

      <p style={cardDescriptionStyle}>
        {desc}
      </p>

      <p style={examplesStyle}>
        {examples}
      </p>

      <div style={priceBoxStyle}>
        <strong style={depositStyle}>
          {deposit}
        </strong>

        <span style={balanceStyle}>
          {balance}
        </span>
      </div>

      <button
        type="button"
        onClick={onClick}
        style={primaryButtonStyle}
      >
        {cta}
        <span aria-hidden="true">
          →
        </span>
      </button>
    </article>
  );
}

/* =========================================================
   STYLES
========================================================= */

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg, #f7f9fc 0%, #eef3f9 100%)",
  padding: "28px 18px 60px",
  fontFamily:
    "Arial, Helvetica, sans-serif",
  color: "#172033",
};

const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1080,
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
  flexWrap: "wrap",
  marginBottom: 54,
};

const brandStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 13,
};

const brandNameStyle: CSSProperties = {
  fontSize: 19,
  fontWeight: 800,
  color: "#12233f",
};

const portalStyle: CSSProperties = {
  marginTop: 3,
  color: "#667085",
  fontSize: 13,
};

const logoutButtonStyle: CSSProperties = {
  border: "1px solid #d0d9e5",
  background: "#ffffff",
  borderRadius: 10,
  minHeight: 42,
  padding: "8px 14px",
  cursor: "pointer",
  color: "#344054",
  fontSize: 13,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  gap: 7,
  flexWrap: "wrap",
};

const emailStyle: CSSProperties = {
  fontWeight: 400,
  color: "#667085",
};

const introSectionStyle: CSSProperties = {
  textAlign: "center",
  maxWidth: 700,
  margin: "0 auto 34px",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#102a56",
  fontSize: "clamp(30px, 5vw, 42px)",
  lineHeight: 1.15,
  fontWeight: 800,
};

const introStyle: CSSProperties = {
  margin: "12px 0 0",
  color: "#667085",
  fontSize: 17,
  lineHeight: 1.6,
};

const cardsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 22,
  alignItems: "stretch",
};

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dfe7f1",
  borderRadius: 18,
  padding: "28px",
  display: "flex",
  flexDirection: "column",
  minHeight: 360,
  boxShadow:
    "0 10px 30px rgba(16, 42, 86, 0.06)",
};

const badgeStyle: CSSProperties = {
  alignSelf: "flex-start",
  background: "#eaf3ff",
  color: "#0057b8",
  fontWeight: 800,
  fontSize: 11,
  letterSpacing: 0.8,
  padding: "6px 10px",
  borderRadius: 999,
  marginBottom: 18,
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 27,
  color: "#102a56",
  lineHeight: 1.2,
};

const cardDescriptionStyle: CSSProperties = {
  margin: "12px 0 0",
  color: "#344054",
  fontSize: 16,
  lineHeight: 1.55,
  fontWeight: 600,
};

const examplesStyle: CSSProperties = {
  margin: "10px 0 22px",
  color: "#667085",
  fontSize: 14,
  lineHeight: 1.6,
};

const priceBoxStyle: CSSProperties = {
  background: "#f7f9fc",
  borderRadius: 12,
  padding: "15px 16px",
  marginTop: "auto",
  marginBottom: 18,
  display: "flex",
  flexDirection: "column",
  gap: 5,
};

const depositStyle: CSSProperties = {
  color: "#172033",
  fontSize: 16,
};

const balanceStyle: CSSProperties = {
  color: "#667085",
  fontSize: 13,
  lineHeight: 1.5,
};

const primaryButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: 50,
  border: 0,
  borderRadius: 11,
  padding: "0 18px",
  background:
    "linear-gradient(135deg, #0065c8 0%, #004f9f 100%)",
  color: "#ffffff",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const legalBoxStyle: CSSProperties = {
  marginTop: 24,
  background: "rgba(255,255,255,0.65)",
  border: "1px solid #dfe7f1",
  borderRadius: 12,
  padding: "14px 18px",
  color: "#667085",
  fontSize: 12,
  lineHeight: 1.6,
};

const loadingStyle: CSSProperties = {
  maxWidth: 1080,
  margin: "100px auto",
  textAlign: "center",
  color: "#667085",
};
