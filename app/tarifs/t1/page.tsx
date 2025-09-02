'use client';

import { useState } from 'react';

export default function Page() {
  const bleu = '#004aad';
  type Lang = 'fr' | 'en' | 'es';
  const [lang, setLang] = useState<Lang>('fr');

  const T = {
    fr: {
      title: 'Impôt des particuliers (T1) – Tarifs détaillés',
      back: '← Retour à l’accueil',
      blocks: [
        {
          h: 'Déclarations de revenus – Particuliers',
          items: [
            'Personne seule : 100 $',
            'Étudiant : 90 $',
            'Personne mineure : 60 $ si aucune déduction',
            'Couple sans enfants : 175 $',
            'Couple avec enfants : 200 $',
            'Déclaration d’une année précédente : Personne seule 110 $ • Couple 170 $',
          ],
        },
        {
          h: 'Services fiscaux spécifiques',
          items: [
            'Vente d’une maison (résidence principale) : 60 $',
            'Vente d’un immeuble à revenus : 110 $',
            'Relevé T5008 (par formulaire) : 20 $',
            'T5008 en devises américaines : 30 $',
            'Déclaration de cryptomonnaie : 70 $',
            'Crédit pour l’achat d’une première habitation : 45 $',
          ],
        },
        {
          h: 'Revenus locatifs',
          items: [
            '1 immeuble (par propriétaire) : 150 $',
            'Par immeuble supplémentaire : +90 $',
            'Vente d’un immeuble locatif : 110 $',
          ],
        },
        {
          h: 'Autres services utiles',
          items: [
            'Déménagement (calcul admissible) : 90 $',
            'Frais médicaux (division/tri) : 45 $',
            'Simulation d’impôt ou REER : 80 $',
            'Impression & envoi postal : 20 $',
            'Redressement d’une déclaration déjà produite : 120 $',
            'Surplus de documents (traitement manuel) : +10 $',
          ],
        },
      ],
    },
    en: {
      title: 'Personal income tax (T1) – Detailed pricing',
      back: '← Back to home',
      blocks: [
        {
          h: 'Individuals',
          items: [
            'Single person: $100',
            'Student: $90',
            'Minor: $60 if no deductions',
            'Couple without children: $175',
            'Couple with children: $200',
            'Previous year return: Single $110 • Couple $170',
          ],
        },
        {
          h: 'Specific tax services',
          items: [
            'Sale of principal residence: $60',
            'Sale of a rental property: $110',
            'T5008 (per slip): $20',
            'T5008 in USD: $30',
            'Crypto reporting: $70',
            'First-time home buyers credit: $45',
          ],
        },
        {
          h: 'Rental income',
          items: [
            '1 property (per owner): $150',
            'Each additional property: +$90',
            'Sale of a rental property: $110',
          ],
        },
        {
          h: 'Other useful services',
          items: [
            'Moving (admissible calc.): $90',
            'Medical expenses (split/sort): $45',
            'Tax or RRSP simulation: $80',
            'Print & postal mail: $20',
            'Adjustment of filed return: $120',
            'Document surplus (manual handling): +$10',
          ],
        },
      ],
    },
    es: {
      title: 'Impuesto personal (T1) – Tarifas detalladas',
      back: '← Volver al inicio',
      blocks: [
        {
          h: 'Declaraciones – Personas',
          items: [
            'Persona sola: $100',
            'Estudiante: $90',
            'Menor: $60 si sin deducciones',
            'Pareja sin hijos: $175',
            'Pareja con hijos: $200',
            'Año anterior: Solo $110 • Pareja $170',
          ],
        },
        {
          h: 'Servicios fiscales específicos',
          items: [
            'Venta de residencia principal: $60',
            'Venta de inmueble en renta: $110',
            'T5008 (por comprobante): $20',
            'T5008 en USD: $30',
            'Cripto: $70',
            'Crédito primera vivienda: $45',
          ],
        },
        {
          h: 'Ingresos de alquiler',
          items: [
            '1 inmueble (por propietario): $150',
            'Por inmueble adicional: +$90',
            'Venta de inmueble en renta: $110',
          ],
        },
        {
          h: 'Otros servicios',
          items: [
            'Mudanza (cálculo admisible): $90',
            'Gastos médicos (div./orden): $45',
            'Simulación de impuestos o RRSP: $80',
            'Impresión y envío postal: $20',
            'Ajuste de una declaración ya presentada: $120',
            'Exceso de documentos (manual): +$10',
          ],
        },
      ],
    },
  }[lang];

  return (
    <main style={{ maxWidth: 900, margin: '30px auto', padding: '0 16px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <a href="/" style={{ textDecoration: 'none', color: '#374151' }}>{T.back}</a>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['fr','en','es'] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: l===lang ? '#004aad' : 'white', color: l===lang ? 'white' : '#374151', cursor: 'pointer' }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <h1 style={{ color: '#004aad', marginBottom: 12 }}>{T.title}</h1>

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
