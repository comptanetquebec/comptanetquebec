'use client';

import React, { useState } from 'react';
// idem remarque _shared que ci-dessus

export default function T2Page() {
  const bleu = '#004aad' as const;
  type Lang = 'fr' | 'en' | 'es';
  const [lang, setLang] = useState<Lang>('fr');

  const T = {
    fr: {
      title: 'Sociétés incorporées (T2 / PME)',
      intro:
        'Exemples de prix — variables selon la taille et la complexité du dossier. (Tenue de livres & remises TPS/TVQ non incluses.)',
      blocks: [
        {
          h: 'T2 complet',
          items: [
            ['États financiers + Bilan, notes sommaires', 'à partir de 850 $'],
            ['Transmission incluse (ARC)', 'inclus'],
            ['Ajustement selon complexité', 'sur devis'],
          ],
        },
        {
          h: 'Cas particuliers',
          items: [
            ['Compagnie sans revenus (exercice sans activité)', '450 $'],
            ['Année courte / première année / changement fin d’année', 'sur devis'],
          ],
        },
        {
          h: 'Options utiles',
          items: [
            ['Révision d’avis de cotisation', 'inclus'],
            ['Conseils fiscaux rapides', 'inclus'],
          ],
        },
      ],
      back: '← Retour aux tarifs',
      cta: 'Nous écrire',
    },
    en: {
      title: 'Incorporated companies (T2 / SMB)',
      intro:
        'Sample pricing — depends on size and complexity. (Bookkeeping & GST/QST remittances excluded.)',
      blocks: [
        {
          h: 'Full T2',
          items: [
            ['Financial statements + Balance sheet, short notes', 'from $850'],
            ['E-file (CRA) included', 'included'],
            ['Complexity adjustment', 'on quote'],
          ],
        },
        {
          h: 'Special cases',
          items: [
            ['No-revenue company (inactive fiscal year)', '$450'],
            ['Short year / first year / year-end change', 'on quote'],
          ],
        },
        { h: 'Useful options', items: [['Notice of assessment review', 'included'], ['Quick tax advice', 'included']] },
      ],
      back: '← Back to pricing',
      cta: 'Contact us',
    },
    es: {
      title: 'Sociedades (T2 / PyME)',
      intro:
        'Precios de referencia — según tamaño y complejidad. (Sin contabilidad ni remesas de impuestos).',
      blocks: [
        {
          h: 'T2 completo',
          items: [
            ['Estados financieros + Balance, notas breves', 'desde $850'],
            ['Envío electrónico (CRA) incluido', 'incluido'],
            ['Ajuste por complejidad', 'a cotizar'],
          ],
        },
        { h: 'Casos especiales', items: [['Compañía sin ingresos (año inactivo)', '$450'], ['Año corto / primer año / cambio de cierre', 'a cotizar']] },
        { h: 'Opciones útiles', items: [['Revisión de notificación de evaluación', 'incluido'], ['Consejo fiscal rápido', 'incluido']] },
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
