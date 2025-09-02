'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function T2() {
  const bleu = '#004aad' as const;
  type Lang = 'fr' | 'en' | 'es';
  const [lang, setLang] = useState<Lang>('fr');

  const T = {
    fr: {
      title: "Sociétés incorporées (T2 / PME) — Tarifs détaillés",
      intro: "Le tarif dépend de la taille et de la complexité du dossier.",
      items: [
        "À partir de 850 $ pour un T2 complet (états financiers, bilan, transmission incluse)",
        "450 $ si la compagnie n’a « aucun revenu » (année inactive)",
        "Services spécifiques: revenus locatifs, vente d’immeuble locatif (110 $), T5008 (20 $/formulaire), cryptomonnaie (70 $), etc.",
      ],
      back: "Retour à l’accueil",
      langLabel: "Langue",
    },
    en: {
      title: "Incorporated Companies (T2 / SMB) — Detailed Pricing",
      intro: "Pricing depends on the size and complexity of the file.",
      items: [
        "From $850 for a full T2 (financial statements, balance sheet, e-file included)",
        "$450 if the corporation has “no revenue” (inactive year)",
        "Specific items: rental income, sale of rental property ($110), T5008 ($20/form), crypto ($70), etc.",
      ],
      back: "Back to Home",
      langLabel: "Language",
    },
    es: {
      title: "Sociedades (T2 / PyME) — Tarifas detalladas",
      intro: "El precio depende del tamaño y la complejidad del expediente.",
      items: [
        "Desde $850 para un T2 completo (estados financieros, balance, envío incluido)",
        "$450 si la compañía no tiene « ingresos » (año inactivo)",
        "Servicios específicos: ingresos de alquiler, venta de inmueble de renta (110 $), T5008 (20 $/formulario), cripto (70 $), etc.",
      ],
      back: "Volver al inicio",
      langLabel: "Idioma",
    },
  }[lang];

  return (
    <main style={{ maxWidth: 920, margin: '40px auto', padding: '0 16px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>{T.langLabel}</span>
        {(['fr','en','es'] as Lang[]).map(l => (
          <button key={l} onClick={() => setLang(l)}
            style={{ border: `1px solid ${l===lang?bleu:'#e5e7eb'}`, background: l===lang?bleu:'white',
              color: l===lang?'white':'#374151', padding: '6px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
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
