// app/sitemap.ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://comptanetquebec.com";

  return [
    { url: base, lastModified: new Date(), priority: 1 },
    { url: `${base}/declaration-impot-quebec`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/calculateur-impot-quebec`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/tarifs`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/formulaire-fiscal`, lastModified: new Date(), priority: 0.7 },
    { url: `${base}/formulaire-fiscal-t2`, lastModified: new Date(), priority: 0.7 },
    { url: `${base}/formulaire-fiscal-ta`, lastModified: new Date(), priority: 0.7 },
    { url: `${base}/formulaire-fiscal-presentiel`, lastModified: new Date(), priority: 0.6 },
    { url: `${base}/formulaire-fiscal-presentiel-t1`, lastModified: new Date(), priority: 0.6 },
    { url: `${base}/formulaire-fiscal-presentiel-t2`, lastModified: new Date(), priority: 0.6 },
    { url: `${base}/formulaire-fiscal-presentiel-ta`, lastModified: new Date(), priority: 0.6 },
    { url: `${base}/formulaire`, lastModified: new Date(), priority: 0.6 },
    { url: `${base}/demande-prise-en-charge`, lastModified: new Date(), priority: 0.7 },
    { url: `${base}/questionnaire`, lastModified: new Date(), priority: 0.6 },
    { url: `${base}/aide`, lastModified: new Date(), priority: 0.5 },
    { url: `${base}/contact`, lastModified: new Date(), priority: 0.5 },
    { url: `${base}/legal`, lastModified: new Date(), priority: 0.3 },
  ];
}
