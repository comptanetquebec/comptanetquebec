'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const bleu = '#004aad' as const;

  // Pour plus tard si tu veux réactiver EN / ES
  type Lang = 'fr';
  const [lang] = useState<Lang>('fr');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Texte FR
  const T = {
    brand: 'ComptaNet Québec',
    nav: {
      services: 'Services',
      steps: 'Étapes',
      pricing: 'Tarifs',
      faq: 'FAQ',
      contact: 'Contact',
      client: 'Espace client',
    },
    cta: 'Commencez dès aujourd’hui',
    heroTitle: (
      <>
        Déclarez vos revenus en ligne facilement et rapidement avec{' '}
        <span style={{ color: bleu, fontWeight: 800 }}>ComptaNet Québec</span>
      </>
    ),
    heroSub:
      "Votre solution complète pour faire vos impôts en ligne sans stress, gérée par des experts. Maximisez vos remboursements tout en simplifiant votre fiscalité grâce à notre expertise.",
    faqTitle: 'FAQ',
    faq: [
      {
        q: 'Comment vous envoyer mes documents ?',
        a: "Après l’ouverture de votre compte, vous aurez un espace sécurisé pour téléverser vos documents (photos ou PDF). Vous pouvez aussi nous les envoyer par courriel si c’est plus simple.",
      },
      {
        q: 'Quels documents avez-vous besoin ?',
        a: "Vos feuillets T4 / Relevé 1, vos relevés de revenus (REER, CÉLI, intérêts, etc.), vos reçus de dépenses admissibles, et toute correspondance de l’ARC ou de Revenu Québec (avis de cotisation, soldes à payer, etc.).",
      },
      {
        q: 'Combien de temps ça prend ?',
        a: "En général, vos déclarations sont traitées en 3 à 5 jours ouvrables après réception de tous vos documents. En période de pointe (mars-avril), le délai peut aller jusqu’à une semaine selon la complexité du dossier.",
      },
      {
        q: 'Comment paye-t-on ?',
        a: "Vous recevez une facture officielle via QuickBooks, payable en ligne par carte ou par virement Interac. Un acompte est demandé avant le début du travail : 100 $ pour particuliers / travailleurs autonomes, et 400 $ pour sociétés incorporées. Le reste est facturé à la fin. Vous recevez un reçu officiel automatiquement. La transmission aux autorités fiscales est incluse.",
      },
    ],
    contactTitle: 'Contact',
    contactHint: 'ou écrivez-nous à',
    send: 'Envoyer',
  };

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', color: '#1f2937' }}>
      {/* petit reset responsive minimal */}
      <style jsx global>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }
        html,
        body {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
          background-color: #ffffff;
        }
        img,
        video {
          max-width: 100%;
          height: auto;
          display: block;
        }
        a {
          color: inherit;
          text-decoration: none;
        }
      `}</style>

      {/* ============ NAVBAR ============ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'white',
          borderBottom: '1px solid #eee',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            rowGap: 10,
          }}
        >
          {/* Logo / Marque */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image
              src="/logo-cq.png"
              alt="Logo ComptaNet Québec"
              width={36}
              height={36}
              style={{ borderRadius: 6 }}
              priority
            />
            <strong style={{ color: bleu, whiteSpace: 'nowrap' }}>
              {T.brand}
            </strong>
          </div>

          {/* Liens simples */}
          <nav
            style={{
              display: 'flex',
              gap: 14,
              fontSize: 14,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <a href="#services" style={{ whiteSpace: 'nowrap' }}>
              {T.nav.services}
            </a>
            <a href="#faq" style={{ whiteSpace: 'nowrap' }}>
              {T.nav.faq}
            </a>
            <a href="#contact" style={{ whiteSpace: 'nowrap' }}>
              {T.nav.contact}
            </a>
            <Link
              href="/espace-client"
              style={{ whiteSpace: 'nowrap', fontWeight: 600 }}
            >
              {T.nav.client}
            </Link>
          </nav>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          minHeight: isMobile ? 460 : 520,
          overflow: 'hidden',
        }}
      >
        {/* Background image pleine largeur */}
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

        {/* Carte blanche au centre */}
        <div
          style={{
            position: 'relative',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            minHeight: isMobile ? 460 : 520,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: isMobile ? '24px 18px' : '40px 30px',
              borderRadius: 16,
              maxWidth: 760,
              width: '100%',
              boxShadow: '0 10px 30px rgba(0,0,0,.18)',
              textAlign: 'center',
            }}
          >
            {/* Titre + sous-texte */}
            <h1
              style={{
                fontSize: 'clamp(22px, 6vw, 36px)',
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              {T.heroTitle}
            </h1>

            <p
              style={{
                marginTop: 14,
                color: '#4b5563',
                fontSize: 'clamp(14px, 3.6vw, 18px)',
              }}
            >
              {T.heroSub}
            </p>

            {/* Boutons principaux en haut */}
            <div
              style={{
                marginTop: 18,
                display: 'flex',
                gap: 10,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/espace-client"
                style={{
                  display: 'inline-block',
                  background: bleu,
                  color: 'white',
                  padding: '12px 22px',
                  borderRadius: 10,
                  fontWeight: 700,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {T.cta}
              </Link>

              <Link
                href="/espace-client"
                style={{
                  display: 'inline-block',
                  border: `2px solid ${bleu}`,
                  color: bleu,
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontWeight: 700,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {T.nav.client}
              </Link>
            </div>

            {/* Choix des types d'impôt */}
            <div
              style={{
                marginTop: 28,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 16,
                textAlign: 'left',
              }}
            >
              {/* Particuliers T1 */}
              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '16px 16px 14px',
                  background: '#ffffff',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>
                  Impôt des particuliers (T1)
                </div>
                <div
                  style={{
                    color: '#6b7280',
                    fontSize: 13,
                    lineHeight: 1.4,
                    marginTop: 4,
                    minHeight: 34,
                  }}
                >
                  Salarié, étudiant, retraité, etc.
                </div>

                <Link
                  href="/tarifs/t1"
                  style={{
                    ...btnHero,
                    display: 'block',
                    marginTop: 12,
                    textAlign: 'center',
                  }}
                >
                  Commencer T1
                </Link>
              </div>

              {/* Travailleur autonome */}
              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '16px 16px 14px',
                  background: '#ffffff',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>
                  Travailleur autonome (T1)
                </div>
                <div
                  style={{
                    color: '#6b7280',
                    fontSize: 13,
                    lineHeight: 1.4,
                    marginTop: 4,
                    minHeight: 34,
                  }}
                >
                  Entrepreneur, pigiste, livreur, etc.
                </div>

                <Link
                  href="/tarifs/travailleur-autonome"
                  style={{
                    ...btnHero,
                    display: 'block',
                    marginTop: 12,
                    textAlign: 'center',
                  }}
                >
                  T1 travailleur autonome
                </Link>
              </div>

              {/* Société T2 */}
              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '16px 16px 14px',
                  background: '#ffffff',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>
                  Impôt des sociétés (T2)
                </div>
                <div
                  style={{
                    color: '#6b7280',
                    fontSize: 13,
                    lineHeight: 1.4,
                    marginTop: 4,
                    minHeight: 34,
                  }}
                >
                  Déclaration pour une compagnie incorporée.
                </div>

                <Link
                  href="/tarifs/t2"
                  style={{
                    ...btnHero,
                    display: 'block',
                    marginTop: 12,
                    textAlign: 'center',
                  }}
                >
                  Commencer T2
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section
        id="faq"
        style={{
          maxWidth: 1100,
          margin: '60px auto',
          padding: '0 16px',
        }}
      >
        <h2 style={{ color: bleu, marginBottom: 16 }}>{T.faqTitle}</h2>
        <FAQ items={T.faq} />
      </section>

      {/* ============ CONTACT ============ */}
      <section
        id="contact"
        style={{
          maxWidth: 1100,
          margin: '60px auto',
          padding: '0 16px 60px',
        }}
      >
        <h2 style={{ color: bleu, marginBottom: 16 }}>{T.contactTitle}</h2>

        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 18,
            background: 'white',
            maxWidth: 700,
          }}
        >
          <form
            action="mailto:comptanetquebec@gmail.com"
            method="post"
            encType="text/plain"
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <input
                name="Nom"
                placeholder="Votre nom"
                required
                style={inputStyle}
              />
              <input
                name="Courriel"
                placeholder="Votre courriel"
                type="email"
                required
                style={inputStyle}
              />
              <textarea
                name="Message"
                placeholder="Comment pouvons-nous aider ?"
                rows={5}
                style={inputStyle}
              />
              <button
                type="submit"
                style={{
                  background: bleu,
                  color: 'white',
                  border: 0,
                  padding: '12px 18px',
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {T.send}
              </button>
            </div>
          </form>

        <p style={{ color: '#6b7280', marginTop: 12 }}>
          {T.contactHint}{' '}
          <a href="mailto:comptanetquebec@gmail.com">
            comptanetquebec@gmail.com
          </a>
        </p>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer
        style={{
          background: '#0f172a',
          color: '#cbd5e1',
          padding: '24px 16px',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/logo-cq.png" alt="" width={28} height={28} />
            <span>
              © {new Date().getFullYear()} ComptaNet Québec — Tous droits réservés.
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 16,
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            <a
              href="#faq"
              style={{ color: '#cbd5e1', textDecoration: 'none' }}
            >
              FAQ
            </a>
            <a
              href="#contact"
              style={{ color: '#cbd5e1', textDecoration: 'none' }}
            >
              Contact
            </a>
            <Link
              href="/espace-client"
              style={{ color: '#cbd5e1', textDecoration: 'none' }}
            >
              {T.nav.client}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* =========================
   Composant FAQ
   ========================= */
function FAQ({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              overflow: 'hidden',
              background: 'white',
            }}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '14px 16px',
                background: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                color: '#111827',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              aria-expanded={isOpen}
            >
              <span>{it.q}</span>
              <span style={{ fontSize: 18, color: '#6b7280' }}>
                {isOpen ? '−' : '+'}
              </span>
            </button>

            {isOpen && (
              <div
                style={{
                  padding: '0 16px 16px',
                  color: '#4b5563',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {it.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* =========================
   Styles réutilisables
   ========================= */
const btnHero: React.CSSProperties = {
  background: '#004aad',
  color: 'white',
  padding: '12px 16px',
  borderRadius: 10,
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 14,
  lineHeight: 1.3,
  display: 'inline-block',
  border: `2px solid #004aad`,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '12px 14px',
  outline: 'none',
  fontSize: 14,
  lineHeight: 1.4,
};
