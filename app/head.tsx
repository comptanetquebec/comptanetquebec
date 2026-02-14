export default function Head() {
  const base = "https://www.comptanetquebec.com";

  return (
    <>
      <title>Déclaration d’impôt au Québec en ligne | ComptaNet Québec</title>
      <meta
        name="description"
        content="Service de déclaration d’impôt au Québec. Particulier, travailleur autonome et compagnie incorporée. Portail sécurisé, paiement Stripe, accréditation TED."
      />
      <meta name="robots" content="index,follow,max-image-preview:large" />

      {/* Canonical unique */}
      <link rel="canonical" href={`${base}/`} />

      {/* hreflang */}
      <link rel="alternate" hrefLang="fr-CA" href={`${base}/?lang=fr`} />
      <link rel="alternate" hrefLang="en-CA" href={`${base}/?lang=en`} />
      <link rel="alternate" hrefLang="es" href={`${base}/?lang=es`} />
      <link rel="alternate" hrefLang="x-default" href={`${base}/?lang=fr`} />

      {/* OpenGraph default */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${base}/`} />
      <meta
        property="og:title"
        content="Déclaration d’impôt au Québec en ligne | ComptaNet Québec"
      />
      <meta
        property="og:description"
        content="Ouvrez votre dossier, téléversez vos documents, et votre déclaration est préparée de façon simple et sécurisée."
      />
      <meta property="og:site_name" content="ComptaNet Québec" />
      <meta property="og:locale" content="fr_CA" />

      <meta property="og:image" content={`${base}/og.jpg`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="Déclaration d’impôt au Québec en ligne | ComptaNet Québec"
      />
      <meta
        name="twitter:description"
        content="Ouvrez votre dossier, téléversez vos documents, et votre déclaration est préparée de façon simple et sécurisée."
      />
      <meta name="twitter:image" content={`${base}/og.jpg`} />
    </>
  );
}

