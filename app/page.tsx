'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const bleu = '#004aad' as const;

  type Lang = 'fr' | 'en' | 'es';
  const [lang, setLang] = useState<Lang>('fr');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const T = {
    fr: {
      brand: 'ComptaNet Québec',
      nav: { services: 'Services', steps: 'Étapes', pricing: 'Tarifs', faq: 'FAQ', contact: 'Contact', form: 'Formulaire' },
      cta: 'Commencez dès aujourd’hui',
      heroTitle: (
        <>
          Déclarez vos revenus en ligne facilement et rapidement avec{' '}
          <span style={{ color: bleu, fontWeight: 800 }}>ComptaNet Québec</span>
        </>
      ),
      heroSub:
        "Votre solution complète pour faire vos impôts en ligne sans stress, gérée par des experts. Maximisez vos remboursements d’impôt tout en simplifiant votre fiscalité grâce à notre expertise.",
      servicesTitle: 'Services',
      servicesSub: "On s’occupe de l’essentiel pour que vous soyez en règle, sans casse-tête.",
      services: [
        { t: 'Déclarations de revenus', d: 'Particuliers, travailleurs autonomes & PME — fédéral et provincial.' },
        { t: 'Organisation de documents', d: 'Liste claire des pièces à fournir et dépôt sécurisé en ligne.' },
        { t: 'Support & révision', d: 'Réponses rapides à vos questions et vérification finale.' },
        { t: 'Optimisation', d: 'Crédits et déductions pour maximiser vos remboursements.' },
      ],
      stepsTitle: 'Comment ça marche (4 étapes)',
      steps: [
        { n: '1', t: 'Créer votre compte', d: 'On vous ouvre un espace sécurisé.' },
        { n: '2', t: 'Téléverser vos documents', d: 'Photos ou PDF, tout passe par votre espace.' },
        { n: '3', t: 'Révision & signature', d: 'On prépare, vous vérifiez et signez en ligne.' },
        { n: '4', t: 'Transmission', d: 'On transmet aux autorités fiscales et on vous confirme.' },
      ],
      pricingTitle: 'Tarifs 2025',
      pricingSub: 'Exemples de base — on confirme le prix selon votre situation.',
      plans: [
        { t: 'Impôt des particuliers (T1)', p: 'à partir de 100 $', pts: ['T4/Relevé 1', 'Crédits de base', 'Transmission incluse'], href: '/tarifs/t1' },
        { t: 'Travailleurs autonomes', p: 'à partir de 150 $', pts: ['État des résultats', 'Dépenses admissibles', 'Optimisation'], href: '/tarifs/travailleur-autonome' },
        { t: 'Sociétés incorporées (T2 / PME)', p: 'à partir de 850 $ (450 $ si compagnie sans revenus)', pts: ['États financiers', 'Bilan complet', 'Transmission incluse'], href: '/tarifs/t2' },
      ],
      getPrice: 'Voir les tarifs',
      faqTitle: 'FAQ',
      faq: [
        { q: 'Comment vous envoyer mes documents?', a: "Après l’ouverture de votre compte, vous aurez un espace sécurisé pour téléverser des photos ou des PDF." },
        { q: 'Quels documents avez-vous besoin?', a: "T4/Relevé 1, feuillets de revenus (REER, CÉLI, intérêts, etc.), reçus de dépenses admissibles et toute correspondance de l’ARC/Revenu Québec." },
        { q: 'Combien de temps ça prend?', a: "Généralement 24 à 72 heures après réception des documents complets. Les périodes de pointe peuvent allonger le délai." },
        { q: 'Comment paye-t-on?', a: "Par virement Interac ou carte (lien de paiement). La transmission est incluse." },
      ],
      contactTitle: 'Contact',
      contactHint: 'ou écrivez-nous à',
      send: 'Envoyer',
      langLabel: 'Langue',
    },
    en: {
      brand: 'ComptaNet Québec',
      nav: { services: 'Services', steps: 'Steps', pricing: 'Pricing', faq: 'FAQ', contact: 'Contact', form: 'Form' },
      cta: 'Get started today',
      heroTitle: (
        <>
          File your taxes online quickly and easily with{' '}
          <span style={{ color: bleu, fontWeight: 800 }}>ComptaNet Québec</span>
        </>
      ),
      heroSub: 'A complete, stress-free online tax solution handled by experts. Maximize your refund while simplifying your taxes.',
      servicesTitle: 'Services',
      servicesSub: 'We handle the essentials so you stay compliant, hassle-free.',
      services: [
        { t: 'Tax returns', d: 'Individuals, self-employed & SMB — federal and provincial.' },
        { t: 'Document organization', d: 'Clear checklist and secure online upload.' },
        { t: 'Support & review', d: 'Fast answers and final verification.' },
        { t: 'Optimization', d: 'Credits and deductions to maximize refunds.' },
      ],
      stepsTitle: 'How it works (4 steps)',
      steps: [
        { n: '1', t: 'Create your account', d: 'We open a secure portal for you.' },
        { n: '2', t: 'Upload your documents', d: 'Photos or PDFs through your portal.' },
        { n: '3', t: 'Review & sign', d: 'We prepare, you review and e-sign.' },
        { n: '4', t: 'Transmission', d: 'We e-file to tax authorities and confirm.' },
      ],
      pricingTitle: 'Pricing 2025',
      pricingSub: 'Base examples — final price confirmed after review.',
      plans: [
        { t: 'Personal income tax (T1)', p: 'from $100', pts: ['T4/Relevé 1', 'Basic credits', 'E-file included'], href: '/tarifs/t1' },
        { t: 'Self-employed', p: 'from $150', pts: ['P&L statement', 'Eligible expenses', 'Optimization'], href: '/tarifs/travailleur-autonome' },
        { t: 'Incorporated (T2 / SMB)', p: 'from $850 ($450 if no revenue)', pts: ['Financial statements', 'Full balance sheet', 'E-file included'], href: '/tarifs/t2' },
      ],
      getPrice: 'See pricing',
      faqTitle: 'FAQ',
      faq: [
        { q: 'How do I send my documents?', a: 'Once your account is created, you get a secure portal to upload photos or PDFs.' },
        { q: 'What documents are needed?', a: 'T4/Relevé 1, income slips, receipts for eligible expenses, and CRA/Revenu Québec letters.' },
        { q: 'How long does it take?', a: 'Usually 24–72 hours after receiving complete files.' },
        { q: 'How do I pay?', a: 'Interac e-Transfer or card (payment link). E-file included.' },
      ],
      contactTitle: 'Contact',
      contactHint: 'or email us at',
      send: 'Send',
      langLabel: 'Language',
    },
    es: {
      brand: 'ComptaNet Québec',
      nav: { services: 'Servicios', steps: 'Pasos', pricing: 'Tarifas', faq: 'FAQ', contact: 'Contacto', form: 'Formulario' },
      cta: 'Empieza hoy',
      heroTitle: (
        <>
          Declare sus impuestos en línea de forma rápida y sencilla con{' '}
          <span style={{ color: bleu, fontWeight: 800 }}>ComptaNet Québec</span>
        </>
      ),
      heroSub: 'Solución completa y sin estrés gestionada por expertos. Maximice su reembolso simplificando su fiscalidad.',
      servicesTitle: 'Servicios',
      servicesSub: 'Nos ocupamos de lo esencial para que esté en regla, sin complicaciones.',
      services: [
        { t: 'Declaraciones de impuestos', d: 'Particulares, autónomos y PyME — federal y provincial.' },
        { t: 'Organización de documentos', d: 'Lista clara y carga segura en línea.' },
        { t: 'Soporte y revisión', d: 'Respuestas rápidas y verificación final.' },
        { t: 'Optimización', d: 'Créditos y deducciones para maximizar reembolsos.' },
      ],
      stepsTitle: 'Cómo funciona (4 pasos)',
      steps: [
        { n: '1', t: 'Cree su cuenta', d: 'Espacio seguro para usted.' },
        { n: '2', t: 'Suba sus documentos', d: 'Fotos o PDF en su portal.' },
        { n: '3', t: 'Revisión y firma', d: 'Preparamos, usted revisa y firma.' },
        { n: '4', t: 'Envío', d: 'Transmitimos a las autoridades y confirmamos.' },
      ],
      pricingTitle: 'Tarifas 2025',
      pricingSub: 'Ejemplos base — el precio final se confirma según su caso.',
      plans: [
        { t: 'Impuesto personal (T1)', p: 'desde $100', pts: ['T4/Relevé 1', 'Créditos básicos', 'Envío incluido'], href: '/tarifs/t1' },
        { t: 'Autónomos', p: 'desde $150', pts: ['Estado de resultados', 'Gastos deducibles', 'Optimización'], href: '/tarifs/travailleur-autonome' },
        { t: 'Sociedades (T2 / PyME)', p: 'desde $850 ($450 si sin ingresos)', pts: ['Estados financieros', 'Balance completo', 'Envío incluido'], href: '/tarifs/t2' },
      ],
      getPrice: 'Ver tarifas',
      faqTitle: 'FAQ',
      faq: [
        { q: '¿Cómo envío mis documentos?', a: 'Con su cuenta obtendrá un portal seguro para subir fotos o PDF.' },
        { q: '¿Qué documentos necesito?', a: 'T4/Relevé 1, comprobantes de ingresos, recibos de gastos y cartas de CRA/Revenu Québec.' },
        { q: '¿Cuánto demora?', a: 'Normalmente 24–72 h tras recibir todo completo.' },
        { q: '¿Cómo pago?', a: 'Interac o tarjeta (enlace de pago). Envío incluido.' },
      ],
      contactTitle: 'Contacto',
      contactHint: 'o escríbanos a',
      send: 'Enviar',
      langLabel: 'Idioma',
    },
  }[lang];

  const LangSwitcher = () => {
    if (isMobile) {
      return (
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          style={{ border: '1px solid #e5e7eb', padding: '6px 10px', borderRadius: 8, fontSize: 12 }}
          aria-label={T.langLabel}
        >
          <option value="fr">FR</option>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
      );
    }
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>{T.langLabel}</span>
        {(['fr','en','es'] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              border: `1px solid ${l === lang ? bleu : '#e5e7eb'}`,
              background: l === lang ? bleu : 'white',
              color: l === lang ? 'white' : '#374151',
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            aria-pressed={l === lang}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    );
  };

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', color: '#1f2937' }}>
      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { width: 100%; max-width: 100%; overflow-x: hidden; }
        img, video { max-width: 100%; height: auto; display: block; }
      `}</style>

      {/* NAVBAR */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'white', borderBottom: '1px solid #eee' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
            {/* Logo avec next/image */}
            <Image src="/logo-cq.png" alt="Logo ComptaNet Québec" width={36} height={36} style={{ borderRadius: 6 }} priority />
            <strong style={{ color: bleu, whiteSpace: 'nowrap' }}>{T.brand}</strong>
          </div>

          <nav style={{
            display: 'flex', gap: 12, fontSize: 14, alignItems: 'center',
            overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexWrap: 'wrap', maxWidth: '100%'
          }}>
            <a href="#services" style={{ textDecoration: 'none', color: '#374151', whiteSpace: 'nowrap' }}>{T.nav.services}</a>
            <a href="#etapes" style={{ textDecoration: 'none', color: '#374151', whiteSpace: 'nowrap' }}>{T.nav.steps}</a>
            <a href="#tarifs" style={{ textDecoration: 'none', color: '#374151', whiteSpace: 'nowrap' }}>{T.nav.pricing}</a>
            <a href="#faq" style={{ textDecoration: 'none', color: '#374151', whiteSpace: 'nowrap' }}>{T.nav.faq}</a>
            <a href="#contact" style={{ textDecoration: 'none', color: '#374151', whiteSpace: 'nowrap' }}>{T.nav.contact}</a>
            <Link href="/formulaire" style={{ textDecoration: 'none', color: '#374151', whiteSpace: 'nowrap' }}>
              {T.nav.form}
            </Link>
            <div style={{ marginLeft: 8 }}>
              <LangSwitcher />
            </div>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section style={{ position: 'relative', width: '100%', minHeight: isMobile ? 420 : 520, overflow: 'hidden' }}>
        {/* Bannière avec next/image (fill) */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <Image
            src="/banniere.png"
            alt="Bannière"
            fill
            style={{ objectFit: 'cover' }}
            priority
            sizes="100vw"
          />
        </div>

        <div style={{ position: 'relative', inset: 0, display: 'grid', placeItems: 'center', padding: 16, minHeight: isMobile ? 420 : 520 }}>
          <div style={{
            background: 'white',
            padding: isMobile ? '24px 18px' : '38px 30px',
            borderRadius: 16,
            maxWidth: 720,
            width: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,.18)',
            textAlign: 'center'
          }}>
            <h1 style={{ fontSize: 'clamp(22px, 6vw, 36px)', lineHeight: 1.2, margin: 0 }}>
              {T.heroTitle}
            </h1>
            <p style={{ marginTop: 14, color: '#4b5563', fontSize: 'clamp(14px, 3.6vw, 18px)' }}>{T.heroSub}</p>
            <div style={{ marginTop: 18, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="#tarifs" style={{
                display: 'inline-block', background: bleu, color: 'white',
                padding: '12px 22px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap'
              }}>
                {T.cta}
              </a>
              <Link href="/formulaire" style={{
                display: 'inline-block', border: `2px solid ${bleu}`, color: bleu,
                padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap'
              }}>
                {T.nav.form}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ maxWidth: 1100, margin: '60px auto', padding: '0 16px' }}>
        <h2 style={{ color: bleu, marginBottom: 12 }}>{T.servicesTitle}</h2>
        <p style={{ color: '#4b5563', marginBottom: 22 }}>{T.servicesSub}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {T.services.map((c, i) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, background: 'white' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: 18 }}>{c.t}</h3>
              <p style={{ margin: 0, color: '#6b7280' }}>{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ÉTAPES */}
      <section id="etapes" style={{ background: '#f8fafc', borderTop: '1px solid #eef2f7', borderBottom: '1px solid #eef2f7' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '50px 16px' }}>
          <h2 style={{ color: bleu, marginBottom: 20 }}>{T.stepsTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {T.steps.map((e, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: bleu, color: 'white',
                  display: 'grid', placeItems: 'center', fontWeight: 700, marginBottom: 10
                }}>
                  {e.n}
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: 18 }}>{e.t}</h3>
                <p style={{ margin: 0, color: '#6b7280' }}>{e.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" style={{ maxWidth: 1100, margin: '60px auto', padding: '0 16px' }}>
        <h2 style={{ color: bleu, marginBottom: 12 }}>{T.pricingTitle}</h2>
        <p style={{ color: '#4b5563', marginBottom: 20 }}>{T.pricingSub}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {T.plans.map((x, i) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, background: 'white' }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>{x.t}</h3>
              <div style={{ color: bleu, fontWeight: 800, fontSize: 20, margin: '8px 0 12px' }}>{x.p}</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#6b7280' }}>
                {x.pts.map((p, j) => <li key={j}>{p}</li>)}
              </ul>
              <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link
                  href={x.href}
                  style={{
                    display: 'inline-block', background: bleu, color: 'white',
                    padding: '10px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap'
                  }}
                >
                  {T.getPrice}
                </Link>
                <Link
                  href="/formulaire"
                  style={{
                    display: 'inline-block', border: `2px solid ${bleu}`, color: bleu,
                    padding: '9px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap'
                  }}
                >
                  {T.nav.form}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ maxWidth: 1100, margin: '60px auto', padding: '0 16px' }}>
        <h2 style={{ color: bleu, marginBottom: 16 }}>{T.faqTitle}</h2>
        <FAQ items={T.faq} />
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ maxWidth: 1100, margin: '60px auto', padding: '0 16px 60px', display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <h2 style={{ color: bleu }}>{T.contactTitle}</h2>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, background: 'white', maxWidth: 700 }}>
          <form action="mailto:comptanetquebec@gmail.com" method="post" encType="text/plain">
            <div style={{ display: 'grid', gap: 12 }}>
              <input name="Nom" placeholder="Votre nom" required style={inputStyle} />
              <input name="Courriel" placeholder="Votre courriel" type="email" required style={inputStyle} />
              <textarea name="Message" placeholder="Comment pouvons-nous aider?" rows={5} style={inputStyle} />
              <button type="submit" style={{ background: bleu, color: 'white', border: 0, padding: '12px 18px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                {T.send}
              </button>
            </div>
          </form>
          <p style={{ color: '#6b7280', marginTop: 12 }}>
            {T.contactHint} <a href="mailto:comptanetquebec@gmail.com">comptanetquebec@gmail.com</a>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0f172a', color: '#cbd5e1', padding: '24px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/logo-cq.png" alt="" width={28} height={28} />
            <span>© {new Date().getFullYear()} ComptaNet Québec</span>
          </div>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
            <a href="#services" style={{ color: '#cbd5e1', textDecoration: 'none', whiteSpace: 'nowrap' }}>Services</a>
            <a href="#tarifs" style={{ color: '#cbd5e1', textDecoration: 'none', whiteSpace: 'nowrap' }}>Tarifs</a>
            <a href="#contact" style={{ color: '#cbd5e1', textDecoration: 'none', whiteSpace: 'nowrap' }}>Contact</a>
            <Link href="/formulaire" style={{ color: '#cbd5e1', textDecoration: 'none', whiteSpace: 'nowrap' }}>{T.nav.form}</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ---- FAQ component ---- */
function FAQ({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: 'white' }}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              style={{
                width: '100%', textAlign: 'left', padding: '14px 16px',
                background: 'white', border: 'none', cursor: 'pointer',
                fontWeight: 700, color: '#111827', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
              }}
              aria-expanded={isOpen}
            >
              <span>{it.q}</span>
              <span style={{ fontSize: 18, color: '#6b7280' }}>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && <div style={{ padding: '0 16px 16px', color: '#4b5563' }}>{it.a}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ---- style réutilisable pour les inputs ---- */
const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '12px 14px',
  outline: 'none',
  fontSize: 14,
};
