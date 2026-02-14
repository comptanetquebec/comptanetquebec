type Lang = "fr" | "en" | "es";

export default function Head({ lang = "fr" }: { lang?: Lang }) {
  const base = "https://www.comptanetquebec.com";
  const url = `${base}/?lang=${lang}`;

  const titles: Record<Lang, string> = {
    fr: "Déclaration d’impôt au Québec en ligne | ComptaNet Québec",
    en: "Québec online tax return service | ComptaNet Québec",
    es: "Servicio de impuestos en Québec en línea | ComptaNet Québec",
  };

  const descs: Record<Lang, string> = {
    fr: "Service de déclaration d’impôt au Québec. Particulier, travailleur autonome et compagnie incorporée. Portail sécurisé, paiement Stripe, accréditation TED.",
    en: "Québec tax return service. Individuals, self-employed and incorporated businesses. Secure portal, Stripe payments, TED e-filing accreditation.",
    es: "Servicio de impuestos en Québec. Particulares, autónomos y empresas incorporadas. Portal seguro, pagos con Stripe, acreditación TED.",
  };

  const title = titles[lang];
  const description = descs[lang];

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index,follow,max-image-preview:large" />

      {/* ✅ canonical DOIT matcher la langue */}
      <link rel="canonical" href={url} />

      {/* hreflang */}
      <link rel="alternate" hrefLang="fr-CA" href={`${base}/?lang=fr`} />
      <link rel="alternate" hrefLang="en-CA" href={`${base}/?lang=en`} />
      <link rel="alternate" hrefLang="es" href={`${base}/?lang=es`} />
      <link rel="alternate" hrefLang="x-default" href={`${base}/?lang=fr`} />

      {/* OpenGraph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="ComptaNet Québec" />
      <meta property="og:locale" content={lang === "fr" ? "fr_CA" : lang === "en" ? "en_CA" : "es_ES"} />

      {/* ✅ image pour partage */}
      <meta property="og:image" content={`${base}/og.jpg`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${base}/og.jpg`} />
    </>
  );
}
