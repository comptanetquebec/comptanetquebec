'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Merci() {
  const bleu = '#004aad' as const;
  type Lang = 'fr' | 'en' | 'es';
  const [lang, setLang] = useState<Lang>('fr');
  const [isMobile, setIsMobile] = useState(false);
  const [seconds, setSeconds] = useState(6);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Redirection auto vers l’accueil après 6s (facultatif)
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    const r = setTimeout(() => { window.location.href = '/'; }, 6000);
    return () => { clearInterval(t); clearTimeout(r); };
  }, []);

  const T = {
    fr: {
      title: 'Merci !',
      subtitle: "Votre formulaire a été envoyé avec succès.",
      text: "Nous vous répondrons rapidement par courriel avec les prochaines étapes pour déposer vos documents.",
      hint: "Vous pouvez revenir à l’accueil ou ouvrir un autre formulaire.",
      back: '← Retour à l’accueil',
      form: 'Remplir un autre formulaire',
      seconds: (s:number) => `Redirection automatique dans ${s} seconde${s>1?'s':''}…`,
      lang: 'Langue',
    },
    en: {
      title: 'Thank you!',
      subtitle: 'Your form was sent successfully.',
      text: 'We will reply by email shortly with the next steps to upload your documents.',
      hint: 'You can go back home or open another form.',
      back: '← Back to home',
      form: 'Fill another form',
      seconds: (s:number) => `Auto-redirect in ${s} second${s>1?'s':''}…`,
      lang: 'Language',
    },
    es: {
      title: '¡Gracias!',
      subtitle: 'Su formulario se envió correctamente.',
      text: 'Le responderemos por correo con los próximos pasos para subir sus documentos.',
      hint: 'Puede volver al inicio o abrir otro formulario.',
      back: '← Volver al inicio',
      form: 'Completar otro formulario',
      seconds: (s:number) => `Redirección automática en ${s} segundo${s>1?'s':''}…`,
      lang: 'Idioma',
    },
  }[lang];

  const LangSwitcher = () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: '#6b7280' }}>{T.lang}</span>
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

  return (
    <main style={{ maxWidth: 900, margin: '30px auto', padding: '0 16px', fontFamily: 'Arial, sans-serif' }}>
      {/* anti-débordement global */}
      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { width: 100%; max-width: 100%; overflow-x: hidden; }
        img, video { max-width: 100%; height: auto; display: block; }
      `}</style>

      {/* Header minimal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#374151', whiteSpace: 'nowrap' }}>
          {T.back}
        </Link>
        <LangSwitcher />
      </div>

      {/* Carte */}
      <section style={{ display: 'grid', placeItems: 'center' }}>
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 16,
            boxShadow: '0 10px 30px rgba(0,0,0,.08)',
            padding: isMobile ? 18 : 28,
            maxWidth: 720,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <h1 style={{ color: bleu, margin: 0, fontSize: 'clamp(24px,6vw,36px)' }}>{T.title}</h1>
          <p style={{ color: '#111827', marginTop: 10, fontWeight: 700 }}>{T.subtitle}</p>
          <p style={{ color: '#4b5563', marginTop: 6 }}>{T.text}</p>
          <p style={{ color: '#6b7280', marginTop: 6 }}>{T.hint}</p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <Link
              href="/"
              style={{ background: bleu, color: 'white', padding: '10px 16px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              {T.back}
            </Link>
            <Link
              href="/formulaire"
              style={{ border: `2px solid ${bleu}`, color: bleu, padding: '8px 14px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              {T.form}
            </Link>
          </div>

          <p style={{ color: '#9ca3af', marginTop: 14 }}>{T.seconds(seconds)}</p>
        </div>
      </section>
    </main>
  );
}
