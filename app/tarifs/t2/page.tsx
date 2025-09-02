'use client';

import { useState } from 'react';

export default function Page() {
  const bleu = '#004aad';
  type Lang = 'fr' | 'en' | 'es';
  const [lang, setLang] = useState<Lang>('fr');

  const T = {
    fr: {
      title: 'Sociétés incorporées (T2 / PME) – Tarifs détaillés',
      back: '← Retour à l’accueil',
      blocks: [
        {
          h: 'T2 complet',
          items: [
            'À partir de 850 $',
            '450 $ si compagnie sans revenus',
            'États financiers et bilan complet',
            'Annexes & transmission incluse',
            'Tarif ajusté selon la taille et la complexité du dossier',
          ],
        },
        {
          h: 'Services connexes (sur demande)',
          items: [
            'Aide à l’organisation des pièces justificatives',
            'Conseils fiscaux de base pour dirigeants',
          ],
        },
      ],
    },
    en: {
      title: 'Incorporated (T2 / SMB) – Detailed pricing',
      back: '← Back to home',
      blocks: [
        {
          h: 'Full T2 return',
          items: [
            'From $850',
            '$450 if the company has no revenue',
            'Financial statements & full balance sheet',
            'Schedules & e-file included',
            'Price adjusted to size/complexity of the file',
          ],
        },
        { h: 'Related services (on request)', items: ['Help organizing supporting docs', 'Basic tax guidance for owners'] },
      ],
    },
    es: {
      title: 'Sociedades (T2 / PyME) – Tarifas detalladas',
      back: '← Volver al inicio',
      blocks: [
        {
          h: 'Declaración T2 completa',
          items: [
            'Desde $850',
            '$450 si la compañía no tiene ingresos',
            'Estados financieros y balance completo',
            'Anexos y envío incluido',
            'Precio ajustado según tamaño/complejidad',
          ],
        },
        { h: 'Servicios relacionados (a pedido)', items: ['Ayuda para organizar documentos', 'Consejos fiscales básicos'] },
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
