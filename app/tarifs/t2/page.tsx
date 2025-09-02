'use client';

import Link from 'next/link';
import React from 'react';

export default function PageT2() {
  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 16, fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Sociétés incorporées (T2 / PME) — Tarifs détaillés</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Le tarif dépend de la taille et de la complexité du dossier.
      </p>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, background: 'white' }}>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
          <li><strong>À partir de 850&nbsp;$</strong> pour un T2 complet (états financiers, bilan, transmission incluse)</li>
          <li><strong>450&nbsp;$</strong> si la compagnie n’a **aucun revenu** (année inactive)</li>
          <li>Services spécifiques : revenus locatifs, vente d’immeuble locatif (110&nbsp;$), T5008 (20&nbsp;$ / formulaire), cryptomonnaie (70&nbsp;$), etc.</li>
        </ul>
      </div>

      <div style={{ marginTop: 20 }}>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            background: '#004aad',
            color: 'white',
            padding: '10px 16px',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
