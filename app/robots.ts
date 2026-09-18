// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",

      // Pages publiques accessibles à Google
      allow: [
        "/",
        "/tenue-de-livres/info",
      ],

      disallow: [
        // Technique / administration
        "/api/",
        "/admin/",
        "/_admin/",

        // Compte et espace privé
        "/compte/",
        "/connexion/",
        "/espace-client/",
        "/dossiers/",
        "/documents/",
        "/depot-documents/",

        // Tenue de livres privée
        // IMPORTANT : ne pas mettre "/tenue-de-livres/"
        // sinon /tenue-de-livres/info serait aussi bloquée.
        "/tenue-de-livres",

        // Formulaires clients
        "/formulaire/",
        "/formulaire-fiscal/",
        "/formulaire-fiscal-t2/",
        "/formulaire-fiscal-ta/",
        "/formulaire-fiscal-presentiel/",
        "/formulaire-fiscal-presentiel-t1/",
        "/formulaire-fiscal-presentiel-t2/",
        "/formulaire-fiscal-presentiel-ta/",
        "/questionnaire/",
        "/demande-prise-en-charge/",

        // Paiement / confirmation
        "/paiement/",
        "/merci/",
      ],
    },

    sitemap: "https://comptanetquebec.com/sitemap.xml",
  };
}
