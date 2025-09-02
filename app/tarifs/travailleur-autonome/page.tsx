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
