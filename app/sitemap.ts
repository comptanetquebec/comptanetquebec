// app/sitemap.ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://comptanetquebec.com";
  const lastModified = new Date();

  return [
    // Pages principales
    {
      url: base,
      lastModified,
      priority: 1,
    },
    {
      url: `${base}/declaration-impot-quebec`,
      lastModified,
      priority: 0.9,
    },
    {
      url: `${base}/calculateur-impot-quebec`,
      lastModified,
      priority: 0.9,
    },
    {
      url: `${base}/tarifs`,
      lastModified,
      priority: 0.8,
    },

    // Formulaires publics
    {
      url: `${base}/formulaire-fiscal`,
      lastModified,
      priority: 0.7,
    },
    {
      url: `${base}/formulaire-fiscal-t2`,
      lastModified,
      priority: 0.7,
    },
    {
      url: `${base}/formulaire-fiscal-ta`,
      lastModified,
      priority: 0.7,
    },
    {
      url: `${base}/formulaire`,
      lastModified,
      priority: 0.6,
    },
    {
      url: `${base}/demande-prise-en-charge`,
      lastModified,
      priority: 0.7,
    },
    {
      url: `${base}/questionnaire`,
      lastModified,
      priority: 0.6,
    },

    // Information
    {
      url: `${base}/aide`,
      lastModified,
      priority: 0.5,
    },
    {
      url: `${base}/contact`,
      lastModified,
      priority: 0.5,
    },

    // Pages légales
    {
      url: `${base}/legal`,
      lastModified,
      priority: 0.3,
    },
    {
      url: `${base}/legal/avis-legal`,
      lastModified,
      priority: 0.3,
    },
    {
      url: `${base}/legal/conditions`,
      lastModified,
      priority: 0.3,
    },
    {
      url: `${base}/legal/confidentialite`,
      lastModified,
      priority: 0.3,
    },
  ];
}
