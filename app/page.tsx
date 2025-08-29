import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-cq.png"   // <— le fichier doit être /public/logo-cq.png
              alt="Logo ComptaNet Québec"
              width={44}
              height={44}
              priority
            />
            <span className="text-xl font-semibold text-slate-900">
              ComptaNet Québec
            </span>
          </div>

          <nav className="hidden gap-6 md:flex">
            <a href="#services" className="text-sm text-slate-600 hover:text-slate-900">
              Services
            </a>
            <a href="#tarifs" className="text-sm text-slate-600 hover:text-slate-900">
              Tarifs
            </a>
            <a href="#contact" className="text-sm text-slate-600 hover:text-slate-900">
              Contact
            </a>
          </nav>

          <Link
            href="#soumission"
            className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Obtenir une soumission
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-b from-blue-900 to-blue-800">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 text-white md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-3xl font-bold leading-tight md:text-4xl">
              Votre partenaire de confiance pour la fiscalité et la comptabilité.
            </h1>
            <p className="mt-4 text-blue-100">
              Simple, clair et rapide. Nous vous accompagnons pour vos
              déclarations, l’organisation de vos documents et le soutien
              administratif au Québec.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="#soumission"
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-blue-900 hover:bg-blue-50"
              >
                Demander une soumission
              </Link>
              <a
                href="#services"
                className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Voir les services
              </a>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                Déclarations de revenus (particuliers & travailleurs autonomes)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                Organisation & tri des documents
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                Support à distance — simple et rapide
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold text-slate-900">Services</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">Déclarations de revenus</h3>
            <p className="mt-2 text-sm text-slate-600">
              Préparation et transmission sécurisée de vos déclarations provinciales et fédérales.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">Organisation des documents</h3>
            <p className="mt-2 text-sm text-slate-600">
              Classement numérique, conseils de préparation et checklist personnalisée.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">Support & accompagnement</h3>
            <p className="mt-2 text-sm text-slate-600">
              Assistance par courriel ou visioconférence, selon vos besoins.
            </p>
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-bold text-slate-900">Tarifs</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900">Revenu simple</h3>
              <p className="mt-1 text-sm text-slate-600">Exemple&nbsp;: T4 seulement</p>
              <p className="mt-3 text-2xl font-bold text-blue-900">dès 149&nbsp;$</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900">Travail autonome</h3>
              <p className="mt-1 text-sm text-slate-600">Revenus d’entreprise/TP</p>
              <p className="mt-3 text-2xl font-bold text-blue-900">sur devis</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900">Accompagnement</h3>
              <p className="mt-1 text-sm text-slate-600">Tri, conseils, réponses</p>
              <p className="mt-3 text-2xl font-bold text-blue-900">à l’heure</p>
            </div>
          </div>
          <div id="soumission" className="mt-8">
            <a
              href="#contact"
              className="inline-flex items-center rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Demander une soumission
            </a>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold text-slate-900">Nous joindre</h2>
          <p className="mt-2 text-sm text-slate-600">
            Écrivez-nous à{" "}
            <a href="mailto:info@comptanetquebec.com" className="font-medium text-blue-900 underline">
              info@comptanetquebec.com
            </a>{" "}
            ou envoyez vos questions via le formulaire (bientôt).
          </p>
          <p className="mt-6 text-xs text-slate-500">
            © {new Date().getFullYear()} ComptaNet Québec. Tous droits réservés.
          </p>
        </div>
      </section>
    </main>
  );
}
