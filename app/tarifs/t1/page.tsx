'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function T1() {
  const bleu = '#004aad' as const;
  type Lang = 'fr' | 'en' | 'es';
  const [lang, setLang] = useState<Lang>('fr');

  const T = {
    fr: {
      title: "Impôt des particuliers (T1) — Tarifs détaillés",
      intro: "Les prix finaux sont confirmés selon votre situation et les documents fournis.",
      items: [
        "Personne seule : 100 $",
        "Étudiant : 90 $",
        "Personne mineure : 60 $ (si aucune déduction)",
        "Couple sans enfants : 175 $",
        "Couple avec enfants : 200 $",
        "Déclaration d’une année précédente — personne seule : 110 $",
        "Déclaration d’une année précédente — couple : 170 $",
        "Transmission incluse — T4/Relevé 1, crédits de base, etc.",
      ],
      back: "Retour à l’accueil",
      langLabel: "Langue",
    },
    en: {
      title: "Personal Income Tax (T1) — Detailed Pricing",
      intro: "Final prices are confirmed based on your situation and provided documents.",
      items: [
        "Single person: $100",
        "Student: $90",
        "Minor: $60 (if no deductions)",
        "Couple without children: $175",
        "Couple with children: $200",
        "Previous year return — single: $110",
        "Previous year return — couple: $170",
        "E-file included — T4/Relevé 1, basic credits, etc.",
      ],
      back: "Back to Home",
      langLabel: "Language",
    },
    es: {
      title: "Impuesto personal (T1) — Tarifas detalladas",
      intro: "Los precios finales se confirman según su situación y los documentos entregados.",
      items: [
        "Persona sola: $100",
        "Estudiante: $90",
        "Menor: $60 (si no hay deducciones)",
        "Pareja sin hijos: $175",
        "Pareja con hijos: $200",
        "Declaración de un año anterior — persona sola: $110",
        "Declaración de un año anterior — pareja: $170",
        "Envío incluido — T4/Relevé 1, créditos básicos, etc.",
      ],
      back: "Volver al inicio",
      langLabel: "Idioma",
    },
  }[lang];

  return (
    <main style={{ maxWidth: 920, margin: '40px auto', padding: '0 16px', fontFamily: 'Arial, sans-serif' }}>
      {/* Lang selector */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>{T.langLabel}</span>
        {(['fr','en','es'] as Lang[]).map(l => (
          <button key={l}
            onClick={() => setLang(l)}
            style={{
              border: `1px solid ${l===lang?bleu:'#e5e7eb'}`,
              background: l===lang?bleu:'white',
              color: l===lang?'white':'#374151',
              padding: '6px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer'
            }}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <h1 style={{ color: '#111827', marginBottom: 10 }}>{T.title}</h1>
      <p style={{ color: '#4b5563', marginBottom: 14 }}>{T.intro}</p>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: 'white', padding: 18 }}>
        <ul style={{ margin: 0, paddingLeft: 22, color: '#374151', lineHeight: 1.7 }}>
          {T.items.map((li, i) => <li key={i}>{li}</li>)}
        </ul>
      </div>

      <div style={{ marginTop: 16 }}>
        <Link href="/" style={{ display: 'inline-block', background: bleu, color: 'white',
          padding: '10px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>
          {T.back}
        </Link>
      </div>
    </main>
  );
}
