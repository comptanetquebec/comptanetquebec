'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function TravAutonome() {
  const bleu = '#004aad' as const;
  type Lang = 'fr' | 'en' | 'es';
  const [lang, setLang] = useState<Lang>('fr');

  const T = {
    fr: {
      title: "Travailleurs autonomes — Tarifs détaillés",
      intro: "Les prix finaux sont confirmés après revue de vos pièces et de la complexité.",
      items: [
        "Revenus « compilés » : 150 $ à 300 $",
        "Plusieurs sources / planification plus complexe : 300 $ à 800 $",
        "Données non compilées (ajout manuel) : +90 $",
        "Déclaration de taxes (TPS/TVQ) : 95 $",
        "Optimisation des dépenses admissibles, état des résultats, etc.",
      ],
      back: "Retour à l’accueil",
      langLabel: "Langue",
    },
    en: {
      title: "Self-Employed — Detailed Pricing",
      intro: "Final prices are confirmed after reviewing your documents and complexity.",
      items: [
        "“Compiled” income: $150 – $300",
        "Multiple sources / more complex planning: $300 – $800",
        "Uncompiled data (manual entry): +$90",
        "Sales tax return (GST/QST): $95",
        "Expense optimization, P&L, etc.",
      ],
      back: "Back to Home",
      langLabel: "Language",
    },
    es: {
      title: "Autónomos — Tarifas detalladas",
      intro: "Los precios finales se confirman tras revisar sus documentos y la complejidad.",
      items: [
        "Ingresos « compilados »: $150 – $300",
        "Varias fuentes / planificación más compleja: $300 – $800",
        "Datos no compilados (carga manual): +$90",
        "Declaración de impuestos sobre ventas (GST/QST): $95",
        "Optimización de gastos, estado de resultados, etc.",
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
