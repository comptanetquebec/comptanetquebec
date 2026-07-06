import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://comptanetquebec.com";
  return [
    { url: base, lastModified: new Date(), priority: 1 },
    // ajoute ici tes autres pages, ex:
    // { url: `${base}/services`, lastModified: new Date(), priority: 0.8 },
  ];
}
