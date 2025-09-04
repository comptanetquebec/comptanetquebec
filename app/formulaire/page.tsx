'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';

type Lang = 'fr' | 'en' | 'es';
type ClientType = 't1' | 'ta' | 't2';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  clientType: ClientType;
  message: string;
  consent: boolean;
}

export default function FormulairePage() {
  const bleu = '#004aad' as const;

  const [lang, setLang] = useState<Lang>('fr');
  const [data, setData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    clientType: 't1',
    message: '',
    consent: false,
  });

  const T = {
    fr: {
      title: 'Créer votre compte / Demande de prise en charge',
      intro:
        "Répondez à ces questions et nous ouvrons votre dossier sécurisé. Vous recevrez un courriel de confirmation.",
      labels: {
        firstName: 'Prénom',
        lastName: 'Nom',
        email: 'Courriel',
        phone: 'Téléphone (optionnel)',
        type: 'Type de client',
        t1: 'Impôt des particuliers (T1)',
        ta: 'Travailleur autonome',
        t2: 'Société incorporée (T2 / PME)',
        message: 'Message / précisions (optionnel)',
        consent: "J’accepte d’être contacté par courriel.",
        submit: 'Envoyer la demande',
        back: 'Retour à l’accueil',
        lang: 'Langue',
      },
      success:
        "Merci! Votre brouillon d’email va s’ouvrir. Vérifiez et envoyez pour finaliser la demande.",
      error: "Veuillez remplir au minimum prénom, nom et courriel.",
    },
    en: {
      title: 'Create your account / Intake form',
      intro:
        'Answer these questions and we will open your secure file. You will receive a confirmation email.',
      labels: {
        firstName: 'First name',
        lastName: 'Last name',
        email: 'Email',
        phone: 'Phone (optional)',
        type: 'Client type',
        t1: 'Personal income tax (T1)',
        ta: 'Self-employed',
        t2: 'Incorporated company (T2 / SMB)',
        message: 'Message / details (optional)',
        consent: 'I agree to be contacted by email.',
        submit: 'Submit request',
        back: 'Back to home',
        lang: 'Language',
      },
      success:
        'Thanks! Your email draft will open. Check it and send to finalize the request.',
      error: 'Please fill at least first name, last name and email.',
    },
    es: {
      title: 'Crear su cuenta / Formulario de inicio',
      intro:
        'Responda estas preguntas y abriremos su expediente seguro. Recibirá un correo de confirmación.',
      labels: {
        firstName: 'Nombre',
        lastName: 'Apellido',
        email: 'Correo',
        phone: 'Teléfono (opcional)',
        type: 'Tipo de cliente',
        t1: 'Impuesto personal (T1)',
        ta: 'Autónomo',
        t2: 'Sociedad (T2 / PyME)',
        message: 'Mensaje / detalles (opcional)',
        consent: 'Acepto ser contactado por correo electrónico.',
        submit: 'Enviar solicitud',
        back: 'Volver al inicio',
        lang: 'Idioma',
      },
      success:
        '¡Gracias! Se abrirá un borrador de correo. Revíselo y envíelo para finalizar.',
      error: 'Complete al menos nombre, apellido y correo.',
    },
  }[lang];

  /** Handler typé par clé — évite les erreurs TS sur [name] */
  const handle =
    <K extends keyof FormData>(key: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const el = e.currentTarget;
      const isCheckbox = (el as HTMLInputElement).type === 'checkbox';
      const raw = isCheckbox ? (el as HTMLInputElement).checked : el.value;
      setData((prev) => ({ ...prev, [key]: raw as FormData[K] }));
    };

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data.firstName || !data.lastName || !data.email) {
      alert(T.error);
      return;
    }

    const subject = encodeURIComponent(
      `[${data.clientType.toUpperCase()}] Nouvelle demande – ${data.firstName} ${data.lastName}`
    );

    const bodyLines = [
      `Prénom/First name: ${data.firstName}`,
      `Nom/Last name: ${data.lastName}`,
      `Courriel/Email: ${data.email}`,
      `Téléphone/Phone: ${data.phone || '-'}`,
      `Type: ${data.clientType}`,
      `Consentement/Consent: ${data.consent ? 'Oui/Yes' : 'Non/No'}`,
      '',
      'Message:',
      data.message || '-',
      '',
      '---',
      'Envoyé depuis comptanetquebec.com',
    ];

    const body = encodeURIComponent(bodyLines.join('\n'));
    window.location.href = `mailto:comptanetquebec@gmail.com?subject=${subject}&body=${body}`;
    alert(T.success);
  }

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', color: '#111827' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'white',
          borderBottom: '1px solid #eee',
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Link href="/" style={{ textDecoration: 'none', color: bleu, fontWeight: 800 }}>
            ComptaNet Québec
          </Link>

          <select
            aria-label={T.labels.lang}
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
              background: 'white',
              color: '#374151',
            }}
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>
        </div>
      </header>

      <section style={{ maxWidth: 900, margin: '32px auto', padding: '0 16px' }}>
        <h1 style={{ fontSize: 26, marginBottom: 8 }}>{T.title}</h1>
        <p style={{ color: '#4b5563', marginBottom: 18 }}>{T.intro}</p>

        <form
          onSubmit={onSubmit}
          style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, background: 'white' }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            <div>
              <label style={lbl}>{T.labels.firstName}</label>
              <input
                name="firstName"
                value={data.firstName}
                onChange={handle('firstName')}
                required
                autoComplete="given-name"
                style={input}
              />
            </div>

            <div>
              <label style={lbl}>{T.labels.lastName}</label>
              <input
                name="lastName"
                value={data.lastName}
                onChange={handle('lastName')}
                required
                autoComplete="family-name"
                style={input}
              />
            </div>

            <div>
              <label style={lbl}>{T.labels.email}</label>
              <input
                type="email"
                name="email"
                value={data.email}
                onChange={handle('email')}
                required
                autoComplete="email"
                style={input}
              />
            </div>

            <div>
              <label style={lbl}>{T.labels.phone}</label>
              <input
                type="tel"
                name="phone"
                value={data.phone}
                onChange={handle('phone')}
                autoComplete="tel"
                style={input}
              />
            </div>

            <div>
              <label style={lbl}>{T.labels.type}</label>
              <select
                name="clientType"
                value={data.clientType}
                onChange={handle('clientType')}
                style={input as React.CSSProperties}
              >
                <option value="t1">{T.labels.t1}</option>
                <option value="ta">{T.labels.ta}</option>
                <option value="t2">{T.labels.t2}</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={lbl}>{T.labels.message}</label>
            <textarea
              name="message"
              rows={5}
              value={data.message}
              onChange={handle('message')}
              style={{ ...input, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              name="consent"
              checked={data.consent}
              onChange={handle('consent')}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontSize: 14, color: '#374151' }}>{T.labels.consent}</span>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
              {T.labels.submit}
            </button>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                background: 'white',
                border: `2px solid ${bleu}`,
                color: bleu,
                padding: '10px 16px',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              {T.labels.back}
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

const input: React.CSSProperties = {
  width: '100%',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '12px 14px',
  outline: 'none',
  fontSize: 14,
};

const lbl: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 13,
  color: '#374151',
};
