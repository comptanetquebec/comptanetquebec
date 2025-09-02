'use client';

import Link from 'next/link';
import React from 'react';

export default function PageT1() {
  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 16, fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Impôt des particuliers (T1) — Tarifs détaillés</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Les prix finaux sont confirmés selon votre situation et les documents fournis.
      </p>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, background: 'white' }}>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
          <li>Personne seule : <strong>100&nbsp;$</strong></li>
          <li>Étudiant : <strong>90&nbsp;$</strong></li>
          <li>Personne mineure : <strong>60&nbsp;$</strong> (si aucune déduction)</li>
          <li>Couple sans enfants : <strong>175&nbsp;$</strong></li>
          <li>Couple avec enfants : <strong>200&nbsp;$</strong></li>
          <li>Déclaration d’une année précédente — personne seule : <strong>110&nbsp;$</strong></li>
          <li>Déclaration d’une année précédente — couple : <strong>170&nbsp;$</strong></li>
          <li>Transmission incluse – T4/Relevé 1, crédits de base, etc.</li>
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
