"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

const LANGS = ["fr", "en", "es"] as const;
type Lang = typeof LANGS[number];

const I18N: Record<Lang, any> = {
  fr: {
    title: "Commencer un dossier",
    intro: "Choisissez le type d’impôt que vous voulez déposer.",
    t1: { title: "Impôt des particuliers (T1)", desc: "Salarié, étudiant, retraité, etc.", cta: "Ouvrir le formulaire T1" },
    auto: { title: "Travailleur autonome (T1)", desc: "Entrepreneur, pigiste, livreur, etc.", cta: "Ouvrir le formulaire autonome" },
    t2: { title: "Société / T2", desc: "Déclaration d’entreprise incorporée (acompte 300 $).", cta: "Démarrer T2" },
    logout: "Se déconnecter",
  },
  en: {
    title: "Start a file",
    intro: "Choose the type of tax return you want to submit.",
    t1: { title: "Personal tax (T1)", desc: "Employee, student, retired, etc.", cta: "Open T1 form" },
    auto: { title: "Self-employed (T1)", desc: "Freelancer, contractor, delivery, etc.", cta: "Open self-employed form" },
    t2: { title: "Corporation / T2", desc: "Incorporated business return ($300 deposit).", cta: "Start T2" },
    logout: "Log out",
  },
  es: {
    title: "Iniciar un expediente",
    intro: "Elige el tipo de declaración que quieres enviar.",
    t1: { title: "Impuestos personales (T1)", desc: "Empleado, estudiante, jubilado, etc.", cta: "Abrir formulario T1" },
    auto: { title: "Autónomo (T1)", desc: "Freelancer, contratista, repartidor, etc.", cta: "Abrir formulario autónomo" },
    t2: { title: "Sociedad / T2", desc: "Empresa incorporada (depósito 300 $).", cta: "Iniciar T2" },
    logout: "Cerrar sesión",
  },
};

export default function ChoixDossierPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const langParam = (sp.get("lang") || "fr").toLowerCase();
  const lang: Lang = LANGS.includes(langParam as Lang) ? (langParam as Lang) : "fr";
  const t = I18N[lang];
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) router.replace(`/espace-client?lang=${lang}&next=/dossiers/nouveau`);
      else setEmail(u.email ?? null);
    });
  }, [router, lang]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace(`/espace-client?lang=${lang}`);
  }

  function go(href: string) {
    router.push(`${href}${href.includes("?") ? "&" : "?"}lang=${lang}`);
  }

  return (
    <main className="hero">
      <div className="card container">
        <header className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Image src="/logo-cq.png" alt="ComptaNet Québec" width={120} height={40} priority />
            <span className="font-semibold">ComptaNet Québec</span>
          </div>
          <button onClick={logout} className="btn btn-outline">
            {t.logout} {email && `(${email})`}
          </button>
        </header>

        <h1 className="text-2xl font-bold mb-2">{t.title}</h1>
        <p className="lead mb-6">{t.intro}</p>

        <div className="grid gap-4 md:grid-cols-3">
          <Card title={t.t1.title} desc={t.t1.desc} cta={t.t1.cta} onClick={() => go("/formulaire-fiscal")} />
          <Card title={t.auto.title} desc={t.auto.desc} cta={t.auto.cta} onClick={() => go("/formulaire-fiscal?type=autonome")} />
          <Card title={t.t2.title} desc={t.t2.desc} cta={t.t2.cta} onClick={() => go("/T2")} />
        </div>
      </div>
    </main>
  );
}

function Card({ title, desc, cta, onClick }: { title: string; desc: string; cta: string; onClick: () => void }) {
  return (
    <div className="card flex flex-col gap-3 p-4">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="note flex-1">{desc}</p>
      <button onClick={onClick} className="btn btn-primary">{cta}</button>
    </div>
  );
}

