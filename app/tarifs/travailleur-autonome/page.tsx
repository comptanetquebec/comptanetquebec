'use client';

import { useState } from 'react';

export default function Page() {
  const bleu = '#004aad';
  type Lang = 'fr' | 'en' | 'es';
  const [lang, setLang] = useState<Lang>('fr');

  const T = {
    fr: {
      title: 'Travailleurs autonomes – Tarifs détaillés',
      back: '← Retour à l’accueil',
      blocks: [
        {
          h: 'Préparation T1 avec revenu d’entreprise',
          items: [
            'Revenus compilés : 150 $ à 300 $',
            'Plusieurs sources ou planification complexe : 300 $ à 800 $',
            'Données non compilées (ajout manuel) : +90 $',
            'Optimisation des dépenses et crédits',
          ],
        },
        {
          h: 'Options additionnelles',
          items: [
            'Revenus locatifs (voir section T1)',
            'Crypto, T5008, ventes d’immeubles — mêmes tarifs que T1',
          ],
        },
      ],
    },
    en: {
      title: 'Self-employed – Detailed pricing',
      back: '← Back to home',
      blocks: [
        {
          h: 'T1 with business income',
          items: [
            'Compiled income: $150–$300',
            'Multiple sources / complex planning: $300–$800',
            'Uncompiled data (manual entry): +$90',
            'Expense & credit optimization',
          ],
        },
        { h: 'Add-ons', items: ['Rental income (see T1 page)', 'Crypto, T5008, property sales — same rates as T1'] },
      ],
    },
    es: {
      title: 'Autónomos – Tarifas detalladas',
      back: '← Volver al inicio',
      blocks: [
        {
          h: 'T1 con ingresos de negocio',
          items: [
            'Ingresos compilados: $150–$300',
            'Múltiples fuentes / complejo: $300–$800',
            'Datos no compilados (carga manual): +$90',
            'Optimización de gastos y créditos',
          ],
        },
        { h: 'Opciones', items: ['Ingresos de alquiler (ver T1)', 'Cripto, T5008, ventas — mismas tarifas que T1'] },
      ],
    },
  }[lang];

  return (
    <main style={{ maxWidth: 900, margin: '30px auto', padding: '0 16px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <a href="/" style={{ textDecoration: 'none', color: '#374151' }}>{T.back}</a>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['fr','en','es'] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: l===lang ? bleu : 'white', color: l===lang ? 'white' : '#374151', cursor: 'pointer' }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <h1 style={{ color: bleu, marginBottom: 12 }}>{T.title}</h1>

      <div style={{ display: 'grid', gap: 16 }}>
        {T.blocks.map((b, i) => (
          <section key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: 'white' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>{b.h}</h2>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#4b5563' }}>
              {b.items.map((it, j) => <li key={j}>{it}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
