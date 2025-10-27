"use client";

export default function LegalPage() {
  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "0 16px 80px",
        fontFamily: "Arial, sans-serif",
        color: "#1f2937",
        lineHeight: 1.6,
      }}
    >
      <h1
        style={{
          fontSize: "30px",
          fontWeight: 700,
          marginBottom: "32px",
          color: "#0f172a",
          textAlign: "center",
        }}
      >
        Politique de confidentialité, Conditions et Avis légal
      </h1>

      {/* --- SECTION 1 : POLITIQUE DE CONFIDENTIALITÉ --- */}
      <section style={{ marginBottom: "50px" }}>
        <h2
          style={{
            fontSize: "22px",
            fontWeight: 700,
            marginBottom: "14px",
            color: "#004aad",
          }}
        >
          Politique de confidentialité
        </h2>
        <p>
          ComptaNet Québec s’engage à protéger la confidentialité des
          renseignements personnels de ses clients, conformément à la Loi 25 du
          Québec et à la Loi fédérale sur la protection des renseignements
          personnels et les documents électroniques (LPRPDE).
        </p>

        <p>
          Les renseignements collectés (ex. feuillets fiscaux, relevés,
          informations d’entreprise) servent uniquement à la préparation et à la
          transmission de vos déclarations de revenus T1, T2 et CO-17.
        </p>

        <p>
          Vos données sont stockées de façon sécurisée sur notre portail
          client. Aucun renseignement personnel n’est vendu ni partagé à des
          tiers à des fins commerciales.
        </p>

        <p>
          Vous pouvez demander en tout temps l’accès, la correction ou la
          suppression de vos renseignements personnels, sauf si la loi exige
          leur conservation (par exemple, les documents fiscaux doivent être
          gardés 6 ans).
        </p>

        <p>
          Pour toute question ou demande relative à la confidentialité, écrivez-nous à{" "}
          <a
            href="mailto:comptanetquebec@gmail.com"
            style={{ color: "#004aad", fontWeight: 600 }}
          >
            comptanetquebec@gmail.com
          </a>
          .
        </p>
      </section>

      {/* --- SECTION 2 : CONDITIONS D’UTILISATION --- */}
      <section style={{ marginBottom: "50px" }}>
        <h2
          style={{
            fontSize: "22px",
            fontWeight: 700,
            marginBottom: "14px",
            color: "#004aad",
          }}
        >
          Conditions d’utilisation
        </h2>

        <p>
          En utilisant nos services, vous acceptez de fournir des informations
          exactes, complètes et à jour. ComptaNet Québec ne peut être tenue
          responsable des erreurs résultant de données manquantes ou erronées.
        </p>

        <p>
          Vous demeurez responsable de la vérification finale des informations
          figurant à vos déclarations avant leur transmission officielle aux
          autorités fiscales (ARC et/ou Revenu Québec).
        </p>

        <p>
          Certains mandats exigent un acompte (100 $ pour T1 et 400 $ pour T2),
          le solde étant payable avant l’envoi officiel. Le prix final est
          toujours confirmé avec vous avant toute transmission.
        </p>

        <p>
          ComptaNet Québec se réserve le droit de refuser ou d’interrompre un
          mandat si les documents nécessaires ne sont pas fournis ou si des
          irrégularités sont constatées.
        </p>
      </section>

      {/* --- SECTION 3 : AVIS LÉGAL / LIMITATION DE RESPONSABILITÉ --- */}
      <section>
        <h2
          style={{
            fontSize: "22px",
            fontWeight: 700,
            marginBottom: "14px",
            color: "#004aad",
          }}
        >
          Avis légal et limitation de responsabilité
        </h2>

        <p>
          ComptaNet Québec n’est pas l’Agence du revenu du Canada (ARC) ni
          Revenu Québec. Nous agissons exclusivement comme préparateurs fiscaux
          indépendants et non comme représentants gouvernementaux.
        </p>

        <p>
          Les informations contenues sur ce site et dans nos communications sont
          fournies à titre informatif général. Elles ne constituent pas un avis
          fiscal ou juridique formel.
        </p>

        <p>
          Notre responsabilité se limite à la préparation et à la transmission
          des déclarations selon les renseignements que vous fournissez. Nous ne
          pouvons être tenus responsables des intérêts, pénalités ou
          redressements en cas de données incomplètes ou inexactes.
        </p>

        <p>
          Si vous recevez une lettre ou un avis de cotisation de l’ARC ou de
          Revenu Québec, il vous appartient de nous en informer sans délai afin
          que nous puissions vous assister.
        </p>

        <p>
          Pour toute question concernant cet avis, contactez-nous à{" "}
          <a
            href="mailto:comptanetquebec@gmail.com"
            style={{ color: "#004aad", fontWeight: 600 }}
          >
            comptanetquebec@gmail.com
          </a>
          .
        </p>

        <p style={{ marginTop: "20px", fontSize: "13px", color: "#6b7280" }}>
          Dernière mise à jour : octobre 2025
        </p>
      </section>
    </main>
  );
}
