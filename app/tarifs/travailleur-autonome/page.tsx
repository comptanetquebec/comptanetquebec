'use client';

import Link from 'next/link';
import React from 'react';

export default function PageAutonome() {
  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 16, fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Travailleurs autonomes — Tarifs détaillés</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Les prix finaux sont confirmés après revue de vos pièces et de la complexité.
      </p>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, background: 'white' }}>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
          <li>Revenus **compilés** : <strong>150&nbsp;$ à 300&nbsp;$</strong></li>
          <li>Plusieurs sources / planification plus complexe : <strong>300&nbsp;$ à 800&nbsp;$</strong></li>
          <li>Données non compilées (ajout manuel) : <strong>+90&nbsp;$</strong></li>
          <li>Déclaration de taxes (TPS/TVQ) : <strong>95&nbsp;$</strong></li>
          <li>Optimisation des dépenses admissibles, P&L, etc.</li>
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
