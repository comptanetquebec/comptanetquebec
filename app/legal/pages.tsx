export default function LegalPage() {
  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "0 16px 80px",
        fontFamily: "Arial, sans-serif",
        color: "#1f2937",
        lineHeight: 1.5,
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          marginBottom: "24px",
          color: "#0f172a",
        }}
      >
        Informations légales
      </h1>

      {/* --- POLITIQUE DE CONFIDENTIALITÉ --- */}
      <section style={{ marginBottom: "40px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            marginBottom: "12px",
            color: "#004aad",
          }}
        >
          Politique de confidentialité
        </h2>

        <p style={{ marginBottom: "12px" }}>
          ComptaNet Québec s’engage à protéger la confidentialité des
          renseignements personnels que vous nous confiez. Nous appliquons les
          exigences de la Loi 25 au Québec ainsi que les exigences fédérales en
          matière de protection des renseignements personnels.
        </p>

        <p style={{ marginBottom: "12px" }}>
          Les renseignements que vous nous fournissez (feuillets fiscaux,
          relevés bancaires, informations d’entreprise, etc.) sont utilisés
          uniquement pour préparer et transmettre vos déclarations de revenus
          personnelles (T1, Québec) et corporatives (T2, CO-17).
        </p>

        <p style={{ marginBottom: "12px" }}>
          Vos documents sont transmis et stockés via un portail client sécurisé.
          Nous ne vendons pas et ne partageons pas vos informations à des tiers
          à des fins commerciales.
        </p>

        <p style={{ marginBottom: "12px" }}>
          Vous pouvez demander l’accès, la correction ou la suppression de vos
          renseignements personnels, sauf si nous avons l’obligation légale de
          les conserver (ex. tenue de dossiers comptables/fiscaux).
        </p>

        <p style={{ marginBottom: "12px" }}>
          Pour toute question liée à la confidentialité de vos données ou pour
          exercer vos droits, écrivez-nous à{" "}
          <a
            href="mailto:comptanetquebec@gmail.com"
            style={{ color: "#004aad", fontWeight: 600 }}
          >
            comptanetquebec@gmail.com
          </a>
          .
        </p>
      </section>

      {/* --- CONDITIONS D’UTILISATION --- */}
      <section style={{ marginBottom: "40px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            marginBottom: "12px",
            color: "#004aad",
          }}
        >
          Conditions d’utilisation
        </h2>

        <p style={{ marginBottom: "12px" }}>
          En utilisant nos services (incluant l’espace client sécurisé,
          l’envoi de documents et la préparation de déclarations), vous acceptez
          de nous fournir des informations exactes, complètes et à jour.
        </p>

        <p style={{ marginBottom: "12px" }}>
          Vous êtes responsable de vérifier l’exactitude finale des
          informations avant la transmission officielle aux autorités
          fiscales. Nous préparons vos déclarations selon les renseignements
          que vous nous remettez.
        </p>

        <p style={{ marginBottom: "12px" }}>
          Certains mandats nécessitent un acompte (par exemple : 100&nbsp;$ pour
          les déclarations T1 personnelles ou 400&nbsp;$ pour les déclarations
          T2 corporatives). Le solde est payable avant l’envoi officiel aux
          autorités fiscales.
        </p>

        <p style={{ marginBottom: "12px" }}>
          Les tarifs peuvent varier selon la complexité du dossier (revenus
          multiples, dossiers en retard, tenue de livres manquante, sociétés
          incorporées multi-provinces, etc.). Le prix final est toujours
          confirmé avec vous avant la production.
        </p>
      </section>

      {/* --- AVIS / LIMITATION DE RESPONSABILITÉ --- */}
      <section>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            marginBottom: "12px",
            color: "#004aad",
          }}
        >
          Avis et limitation de responsabilité
        </h2>

        <p style={{ marginBottom: "12px" }}>
          ComptaNet Québec n’est pas l’Agence du revenu du Canada (ARC) ni
          Revenu Québec. Nous agissons comme préparateurs / déclarants fiscaux,
          et non comme les autorités gouvernementales.
        </p>

        <p style={{ marginBottom: "12px" }}>
          Le contenu présenté sur ce site (textes, exemples, explications) est
          fourni à titre informatif général. Il ne constitue pas un avis fiscal
          personnalisé ou un avis juridique.
        </p>

        <p style={{ marginBottom: "12px" }}>
          Chaque situation fiscale est unique. Nous vous invitons à nous
          transmettre tous les renseignements pertinents à votre situation
          (revenus, dépenses, actifs, statut résidentiel, etc.) afin que nous
          puissions préparer correctement vos déclarations.
        </p>

        <p style={{ marginBottom: "12px" }}>
          En utilisant nos services, vous reconnaissez que la responsabilité de
          ComptaNet Québec se limite à la préparation et à la transmission des
          déclarations selon les informations que vous fournissez. Nous ne
          pouvons pas être tenus responsables des pénalités, intérêts,
          redressements ou vérifications fiscale ultérieures si les données
          communiquées étaient incomplètes, inexactes ou omises.
        </p>

        <p style={{ marginBottom: "12px" }}>
          Si vous recevez une lettre, un avis de cotisation ou une demande
          d’information de l’ARC ou de Revenu Québec, il est de votre
          responsabilité de nous transmettre ces documents rapidement afin que
          nous puissions vous assister.
        </p>

        <p style={{ marginBottom: "12px" }}>
          Pour toute question sur cet avis ou pour obtenir un accompagnement
          personnalisé, contactez-nous à{" "}
          <a
            href="mailto:comptanetquebec@gmail.com"
            style={{ color: "#004aad", fontWeight: 600 }}
          >
            comptanetquebec@gmail.com
          </a>
          .
        </p>
      </section>
    </main>
  );
}

