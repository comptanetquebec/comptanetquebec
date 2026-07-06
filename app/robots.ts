// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/_admin/",
        "/compte/",
        "/connexion/",
        "/dossiers/",
        "/depot-documents/",
        "/documents/",
        "/espace-client/",
        "/paiement/",
        "/merci/",
      ],
    },
    sitemap: "https://comptanetquebec.com/sitemap.xml",
  };
}
