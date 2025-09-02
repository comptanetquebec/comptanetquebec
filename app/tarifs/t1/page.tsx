'use client';

import React, { useState } from 'react';

export default function T1Page() {
  const bleu = '#004aad' as const;
  type Lang = 'fr' | 'en' | 'es';
  const [lang, setLang] = useState<Lang>('fr');

  const T = {
    fr: {
      title: 'Impôt des particuliers (T1)',
      intro: 'Exemples de prix — le tarif final est confirmé selon votre situation.',
      blocks: [
        {
          h: 'Forfaits principaux',
          items: [
            ['Personne seule (avec ou sans revenus/enfants)', '100 $'],
            ['Étudiant', '90 $'],
            ['Personne mineure (si aucune déduction)', '60 $'],
            ['Couple sans enfants', '175 $'],
            ['Couple avec enfants', '200 $'],
          ],
        },
        {
          h: "Déclaration d'une année précédente",
          items: [
            ['Personne seule', '110 $'],
            ['Couple', '170 $'],
          ],
        },
        {
          h: 'Services fiscaux spécifiques',
          items: [
            ['Vente d’une maison (résidence principale)', '60 $'],
            ['Vente d’un immeuble à revenus', '110 $'],
            ['Relevé T5008 (par formulaire)', '20 $'],
            ['T5008 en devises américaines', '30 $'],
            ['Déclaration de cryptomonnaie', '70 $'],
            ["Crédit pour l’achat d’une première habitation", '45 $'],
          ],
        },
        {
          h: 'Revenus locatifs',
          items: [
            ['1 immeuble (par propriétaire)', '150 $'],
            ['Par immeuble supplémentaire', '+90 $'],
            ['Vente d’un immeuble locatif', '110 $'],
          ],
        },
        {
          h: 'Autres services utiles',
          items: [
            ['Déménagement (calcul admissible)', '90 $'],
            ['Frais médicaux (division/tri)', '45 $'],
            ['Simulation d’impôt ou REER', '80 $'],
            ['Impression & envoi postal de la déclaration', '20 $'],
            ["Redressement d’une déclaration déjà produite", '120 $'],
            ['Surplus de documents (traitement manuel)', '+10 $'],
          ],
        },
      ],
      back: '← Retour aux tarifs',
      cta: 'Nous écrire',
    },
    en: {
      title: 'Personal income tax (T1)',
      intro: 'Sample pricing — final quote confirmed after review.',
      blocks: [
        {
          h: 'Main packages',
          items: [
            ['Single person (with/without income/children)', '$100'],
            ['Student', '$90'],
            ['Minor (if no deductions)', '$60'],
            ['Couple without children', '$175'],
            ['Couple with children', '$200'],
          ],
        },
        {
          h: 'Previous year return',
          items: [
            ['Single person', '$110'],
            ['Couple', '$170'],
          ],
        },
        {
          h: 'Specific tax services',
          items: [
            ['Principal residence sale', '$60'],
            ['Rental property sale', '$110'],
            ['T5008 slip (per form)', '$20'],
            ['T5008 in USD', '$30'],
            ['Crypto reporting', '$70'],
            ['First-time home buyer credit', '$45'],
          ],
        },
        {
          h: 'Rental income',
          items: [
            ['1 property (per owner)', '$150'],
            ['Each additional property', '+$90'],
            ['Sale of a rental property', '$110'],
          ],
        },
        {
          h: 'Other useful services',
          items: [
            ['Moving (eligible calculation)', '$90'],
            ['Medical expenses (sorting/split)', '$45'],
            ['Tax/ RRSP simulation', '$80'],
            ['Print & postal mailing', '$20'],
            ['Adjustment of a filed return', '$120'],
            ['Extra documents (manual handling)', '+$10'],
          ],
        },
      ],
      back: '← Back to pricing',
      cta: 'Contact us',
    },
    es: {
      title: 'Impuesto personal (T1)',
      intro: 'Precios de referencia — el valor final se confirma según su caso.',
      blocks: [
        {
          h: 'Paquetes principales',
          items: [
            ['Persona sola (con/sin ingresos/hijos)', '$100'],
            ['Estudiante', '$90'],
            ['Menor (si no hay deducciones)', '$60'],
            ['Pareja sin hijos', '$175'],
            ['Pareja con hijos', '$200'],
          ],
        },
        {
          h: 'Declaración de un año anterior',
          items: [
            ['Persona sola', '$110'],
            ['Pareja', '$170'],
          ],
        },
        {
          h: 'Servicios fiscales específicos',
          items: [
            ['Venta de residencia principal', '$60'],
            ['Venta de inmueble de renta', '$110'],
            ['T5008 (por formulario)', '$20'],
            ['T5008 en USD', '$30'],
            ['Cripto (declaración)', '$70'],
            ['Crédito primer comprador de vivienda', '$45'],
          ],
        },
        {
          h: 'Ingresos de alquiler',
          items: [
            ['1 inmueble (por propietario)', '$150'],
            ['Inmueble adicional', '+$90'],
            ['Venta de inmueble de alquiler', '$110'],
          ],
        },
        {
          h: 'Otros servicios',
          items: [
            ['Mudanza (cálculo elegible)', '$90'],
            ['Gastos médicos (división/orden)', '$45'],
            ['Simulación de impuestos o RRSP', '$80'],
            ['Impresión y envío postal', '$20'],
            ['Ajuste de una declaración ya presentada', '$120'],
            ['Exceso de documentos (manejo manual)', '+$10'],
          ],
        },
      ],
      back: '← Volver a tarifas',
      cta: 'Escríbenos',
    },
  }[lang];

  return (
    <Wrapper bleu={bleu} lang={lang} setLang={setLang} title={T.title} intro={T.intro} backHref="/#tarifs" backLabel={T.back}>
      {T.blocks.map((b, i) => (
        <Card key={i} title={b.h}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {b.items.map(([label, price], j) => (
              <li key={j} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0' }}>
                <span>{label}</span>
                <strong>{price}</strong>
              </li>
            ))}
          </ul>
        </Card>
      ))}
      <CTA bleu={bleu} label={T.cta} />
    </Wrapper>
  );
}

/* ---------- shared small components (also used by the 2 other pages) ---------- */
function Wrapper({
  bleu, lang, setLang, title, intro, backHref, backLabel, children,
}: any) {
  return (
    <main style={{ fontFamily: 'Arial, sans-serif', color: '#1f2937' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'white', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href={backHref} style={{ textDecoration: 'none', color: '#374151' }}>{backLabel}</a>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['fr','en','es'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                border: `1px solid ${l===lang? bleu:'#e5e7eb'}`, background: l===lang? bleu:'white',
                color: l===lang? 'white':'#374151', padding: '6px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer'
              }}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 1000, margin: '30px auto', padding: '0 16px' }}>
        <h1 style={{ color: bleu, marginBottom: 6 }}>{title}</h1>
        <p style={{ color: '#6b7280', marginBottom: 18 }}>{intro}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {children}
        </div>
      </section>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, background: 'white' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function CTA({ bleu, label }: { bleu: string; label: string }) {
  return (
    <div style={{ marginTop: 18 }}>
      <a href="mailto:comptanetquebec@gmail.com" style={{
        display: 'inline-block', background: bleu, color: 'white', padding: '12px 18px',
        borderRadius: 10, textDecoration: 'none', fontWeight: 700
      }}>{label}</a>
    </div>
  );
}
2) app/tarifs/travailleur-autonome/page.tsx — Travailleurs autonomes
tsx
Copier le code
'use client';

import React, { useState } from 'react';
import { Card, Wrapper, CTA } from '../_shared'; // <-- si tu préfères, tu peux factoriser comme dans le fichier T1 ci-dessus. Sinon, laisse tout local (voir version autonome plus bas).

export default function AutonomePage() {
  const bleu = '#004aad' as const;
  type Lang = 'fr' | 'en' | 'es';
  const [lang, setLang] = useState<Lang>('fr');

  const T = {
    fr: {
      title: 'Travailleurs autonomes',
      intro: 'Exemples de prix — selon le volume et la complexité. (Tenue de livres & remises TPS/TVQ non incluses.)',
      blocks: [
        {
          h: 'Forfaits',
          items: [
            ['Revenus compilés', '150 $ à 300 $'],
            ['Plusieurs sources / planification complexe', '300 $ à 800 $'],
            ['Données non compilées (ajout manuel)', '+90 $'],
            // Exclu: Déclaration de taxes TPS/TVQ
          ],
        },
        {
          h: 'Options utiles',
          items: [
            ['Optimisation des dépenses admissibles', 'inclus'],
            ['Conseil rapide (15 min)', 'gratuit avec le mandat'],
            ['Transmission incluse', 'inclus'],
          ],
        },
      ],
      back: '← Retour aux tarifs',
      cta: 'Nous écrire',
    },
    en: {
      title: 'Self-employed',
      intro: 'Sample pricing — depends on volume and complexity. (Bookkeeping & GST/QST remittances excluded.)',
      blocks: [
        { h: 'Packages', items: [['Compiled income', '$150 – $300'], ['Multiple sources / complex planning', '$300 – $800'], ['Uncompiled data (manual entry)', '+$90']] },
        { h: 'Useful options', items: [['Expense optimization', 'included'], ['Quick consult (15 min)', 'free with engagement'], ['E-file included', 'included']] },
      ],
      back: '← Back to pricing',
      cta: 'Contact us',
    },
    es: {
      title: 'Autónomos',
      intro: 'Precios de referencia — según volumen y complejidad. (Sin contabilidad ni remesas de impuestos).',
      blocks: [
        { h: 'Paquetes', items: [['Ingresos compilados', '$150 – $300'], ['Múltiples fuentes / planificación compleja', '$300 – $800'], ['Datos no compilados (carga manual)', '+$90']] },
        { h: 'Opciones útiles', items: [['Optimización de gastos deducibles', 'incluido'], ['Consulta rápida (15 min)', 'gratis con el servicio'], ['Envío electrónico', 'incluido']] },
      ],
      back: '← Volver a tarifas',
      cta: 'Escríbenos',
    },
  }[lang];

  return (
    <Wrapper bleu={bleu} lang={lang} setLang={setLang} title={T.title} intro={T.intro} backHref="/#tarifs" backLabel={T.back}>
      {T.blocks.map((b, i) => (
        <Card key={i} title={b.h}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {b.items.map(([label, price]: [string, string], j: number) => (
              <li key={j} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0' }}>
                <span>{label}</span>
                <strong>{price}</strong>
              </li>
            ))}
          </ul>
        </Card>
      ))}
      <CTA bleu={bleu} label={T.cta} />
    </Wrapper>
  );
}
