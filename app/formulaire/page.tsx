'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Formulaire() {
  const bleu = '#004aad' as const;
  type Lang = 'fr' | 'en' | 'es';
  const [lang, setLang] = useState<Lang>('fr');
  const [isMobile, setIsMobile] = useState(false);
  const [status, setStatus] = useState<'idle'|'sending'|'ok'|'err'>('idle');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const T = {
    fr: {
      title: "Formulaire de démarrage — Impôts",
      intro: "Remplissez ce formulaire pour qu’on ouvre votre dossier et vous envoie les instructions pour les documents.",
      step: "Informations de base",
      name: "Nom complet",
      email: "Courriel",
      phone: "Téléphone (optionnel)",
      taxYear: "Année d’imposition",
      province: "Province",
      qc: "Québec", other: "Autre",
      situation: "Situation", single: "Personne seule", couple: "Couple", children: "Enfants à charge",
      income: "Types de revenus (cochez tout ce qui s’applique)",
      t4: "T4 / Relevé 1 (emploi)", r1: "Études / bourses",
      rent: "Revenus de location", self: "Travail autonome",
      capital: "Gains/pertes en capital (T5008)", crypto: "Cryptomonnaie",
      message: "Message (questions, précisions)",
      consent: "J’accepte qu’on me contacte par courriel/téléphone pour compléter mon dossier.",
      send: "Envoyer", sending: "Envoi...",
      ok: "Merci! On vous revient rapidement par courriel.",
      err: "Oups, l’envoi a échoué. Réessayez ou écrivez à comptanetquebec@gmail.com.",
      docsHint: "Après l’envoi, vous recevrez les instructions pour déposer vos pièces (photos/PDF).",
      langLabel: "Langue",
      back: "← Retour à l’accueil",
    },
    en: {
      title: "Start form — Taxes",
      intro: "Fill this form so we can open your file and send upload instructions.",
      step: "Basic information",
      name: "Full name",
      email: "Email",
      phone: "Phone (optional)",
      taxYear: "Tax year",
      province: "Province",
      qc: "Quebec", other: "Other",
      situation: "Situation", single: "Single", couple: "Couple", children: "Children",
      income: "Income types (check all that apply)",
      t4: "T4 / Relevé 1 (employment)", r1: "Study slips / grants",
      rent: "Rental income", self: "Self-employed",
      capital: "Capital gains/losses (T5008)", crypto: "Crypto",
      message: "Message (questions, details)",
      consent: "I agree to be contacted by email/phone to complete my file.",
      send: "Send", sending: "Sending...",
      ok: "Thanks! We’ll get back to you by email.",
      err: "Send failed. Try again or email comptanetquebec@gmail.com.",
      docsHint: "After sending, you'll receive instructions to upload your documents (photos/PDF).",
      langLabel: "Language",
      back: "← Back to home",
    },
    es: {
      title: "Formulario inicial — Impuestos",
      intro: "Complete este formulario para abrir su expediente y recibir instrucciones de carga.",
      step: "Información básica",
      name: "Nombre completo",
      email: "Correo",
      phone: "Teléfono (opcional)",
      taxYear: "Año fiscal",
      province: "Provincia",
      qc: "Quebec", other: "Otra",
      situation: "Situación", single: "Persona sola", couple: "Pareja", children: "Hijos a cargo",
      income: "Tipos de ingresos (marque los que correspondan)",
      t4: "T4 / Relevé 1 (empleo)", r1: "Estudios / becas",
      rent: "Ingresos de alquiler", self: "Autónomo",
      capital: "Ganancias/pérdidas de capital (T5008)", crypto: "Cripto",
      message: "Mensaje (preguntas, detalles)",
      consent: "Acepto ser contactado por correo/teléfono para completar mi expediente.",
      send: "Enviar", sending: "Enviando...",
      ok: "¡Gracias! Le responderemos por correo.",
      err: "Error al enviar. Intente de nuevo o escriba a comptanetquebec@gmail.com.",
      docsHint: "Tras enviar, recibirá instrucciones para subir sus documentos (fotos/PDF).",
      langLabel: "Idioma",
      back: "← Volver al inicio",
    },
  }[lang];

  // 👉 remplace FORM_ID_ICI par ton ID formspree
  const FORMSPREE_ACTION = 'https://formspree.io/f/FORM_ID_ICI';

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

  // --- handler d’envoi via fetch (reste sur la page)
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    try {
      const form = e.currentTarget;
      const data = new FormData(form);
      // champs utiles Formspree
      data.append('_language', lang.toUpperCase());
      // option : redirection après succès
      // data.append('_next', 'https://www.comptanetquebec.com/merci');

      const res = await fetch(FORMSPREE_ACTION, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: data,
      });

      if (res.ok) {
        form.reset();
        setStatus('ok');
      } else {
        setStatus('err');
      }
    } catch {
      setStatus('err');
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '30px auto', padding: '0 16px', fontFamily: 'Arial, sans-serif' }}>
      {/* global anti-débordement */}
      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { width: 100%; max-width: 100%; overflow-x: hidden; }
        img, video { max-width: 100%; height: auto; display: block; }
      `}</style>

      {/* Haut: retour + langues */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#374151', whiteSpace: 'nowrap' }}>
          {T.back}
        </Link>
        <LangSwitcher />
      </div>

      <h1 style={{ color: bleu, marginBottom: 8 }}>{T.title}</h1>
      <p style={{ color: '#4b5563', marginBottom: 18 }}>{T.intro}</p>

      <form
        onSubmit={handleSubmit}
        style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, background: 'white' }}
        aria-describedby="form-hint"
      >
        {/* Formspree need: subject, honeypot */}
        <input type="hidden" name="_subject" value="Nouveau dossier — ComptaNet Québec" />
        <input type="text" name="_gotcha" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

        <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>{T.step}</h2>

        <div style={{ display: 'grid', gap: 12 }}>
          <label style={labelStyle}>
            {T.name}
            <input name="Nom" placeholder={T.name} required style={inputStyle}
                   autoComplete="name" aria-label={T.name}/>
          </label>

          <label style={labelStyle}>
            {T.email}
            <input name="Courriel" placeholder={T.email} type="email" required style={inputStyle}
                   autoComplete="email" aria-label={T.email}/>
          </label>

          <label style={labelStyle}>
            {T.phone}
            <input name="Téléphone" placeholder={T.phone} type="tel" style={inputStyle}
                   autoComplete="tel" aria-label={T.phone}/>
          </label>

          <div style={{ display: 'grid', gap: 8 }}>
            <label style={labelStyle}>{T.taxYear}</label>
            <select name="Année" required style={inputStyle as any} aria-label={T.taxYear}>
              {Array.from({ length: 6 }).map((_, i) => {
                const y = new Date().getFullYear() - i;
                return <option key={y} value={String(y)}>{y}</option>;
              })}
            </select>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <label style={labelStyle}>{T.province}</label>
            <select name="Province" required style={inputStyle as any} aria-label={T.province}>
              <option value="QC">{T.qc}</option>
              <option value="Other">{T.other}</option>
            </select>
          </div>

          <fieldset style={{ border: 0, padding: 0 }}>
            <legend style={labelStyle as any}>{T.situation}</legend>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', color: '#374151' }}>
              <label><input type="radio" name="Situation" value="Seul" required /> {T.single}</label>
              <label><input type="radio" name="Situation" value="Couple" /> {T.couple}</label>
              <label><input type="checkbox" name="Enfants" value="Oui" /> {T.children}</label>
            </div>
          </fieldset>

          <fieldset style={{ border: 0, padding: 0 }}>
            <legend style={labelStyle as any}>{T.income}</legend>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 8, color: '#374151' }}>
              <label><input type="checkbox" name="Revenus_T4" value="Oui" /> {T.t4}</label>
              <label><input type="checkbox" name="Relevés_Etudes" value="Oui" /> {T.r1}</label>
              <label><input type="checkbox" name="Revenus_Locatifs" value="Oui" /> {T.rent}</label>
              <label><input type="checkbox" name="Travail_Autonome" value="Oui" /> {T.self}</label>
              <label><input type="checkbox" name="T5008" value="Oui" /> {T.capital}</label>
              <label><input type="checkbox" name="Crypto" value="Oui" /> {T.crypto}</label>
            </div>
          </fieldset>

          <label style={labelStyle}>
            {T.message}
            <textarea name="Message" placeholder={T.message} rows={5} style={inputStyle}
                      aria-label={T.message}/>
          </label>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: '#374151' }}>
            <input type="checkbox" name="Consentement" value="Oui" required /> {T.consent}
          </label>

          <button
            type="submit"
            disabled={status === 'sending'}
            style={{ background: bleu, color: 'white', border: 0, padding: '12px 18px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
            aria-busy={status === 'sending'}
          >
            {status === 'sending' ? T.sending : T.send}
          </button>
        </div>
      </form>

      <p id="form-hint" style={{ color: '#6b7280', marginTop: 12 }}>{T.docsHint}</p>

      {status === 'ok' && <p style={{ color: 'green', marginTop: 8 }}>{T.ok}</p>}
      {status === 'err' && <p style={{ color: 'crimson', marginTop: 8 }}>{T.err}</p>}
    </main>
  );
}

/* Styles */
const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e5e7eb', borderRadius: 10,
  padding: '12px 14px', outline: 'none', fontSize: 14,
};
const labelStyle: React.CSSProperties = { fontSize: 14, color: '#111827', fontWeight: 700 };
