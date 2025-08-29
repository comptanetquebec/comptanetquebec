export default function Home() {
  const bleu = "#004aad";

  return (
    <main style={{ fontFamily: "Arial, sans-serif", color: "#1f2937" }}>
      {/* -------- NAVBAR -------- */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "white",
          borderBottom: "1px solid #eee",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="/logo-cq.png"
              alt="Logo ComptaNet Québec"
              width={36}
              height={36}
              style={{ borderRadius: 6 }}
            />
            <strong style={{ color: bleu }}>ComptaNet Québec</strong>
          </div>

          <nav style={{ display: "flex", gap: 16, fontSize: 14 }}>
            <a href="#services" style={{ textDecoration: "none", color: "#374151" }}>Services</a>
            <a href="#etapes" style={{ textDecoration: "none", color: "#374151" }}>Étapes</a>
            <a href="#tarifs" style={{ textDecoration: "none", color: "#374151" }}>Tarifs</a>
            <a href="#contact" style={{ textDecoration: "none", color: "#374151" }}>Contact</a>
          </nav>
        </div>
      </header>

      {/* -------- HERO / BANNIÈRE -------- */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: 520,
          overflow: "hidden",
        }}
      >
        <img
          src="/banniere.png"
          alt="Famille souriante - ComptaNet Québec"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "38px 30px",
              borderRadius: 16,
              maxWidth: 760,
              width: "100%",
              boxShadow: "0 10px 30px rgba(0,0,0,.18)",
              textAlign: "center",
            }}
          >
            <h1 style={{ fontSize: 28, lineHeight: 1.2, margin: 0 }}>
              Déclarez vos revenus en ligne facilement et rapidement avec{" "}
              <span style={{ color: bleu, fontWeight: 800 }}>ComptaNet Québec</span>
            </h1>
            <p style={{ marginTop: 14, color: "#4b5563" }}>
              Votre solution complète pour faire vos impôts en ligne sans stress, gérée par des
              experts. Maximisez vos remboursements d’impôt tout en simplifiant votre fiscalité grâce à notre expertise.
            </p>
            <div style={{ marginTop: 18 }}>
              <a
                href="#tarifs"
                style={{
                  display: "inline-block",
                  background: bleu,
                  color: "white",
                  padding: "12px 22px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Commencez dès aujourd’hui
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* -------- SERVICES -------- */}
      <section id="services" style={{ maxWidth: 1100, margin: "60px auto", padding: "0 16px" }}>
        <h2 style={{ color: bleu, marginBottom: 12 }}>Services</h2>
        <p style={{ color: "#4b5563", marginBottom: 22 }}>
          On s’occupe de l’essentiel pour que vous soyez en règle, sans casse-tête.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {[
            {
              t: "Déclarations de revenus",
              d: "Particuliers & travailleurs autonomes — fédéral et provincial.",
            },
            {
              t: "Organisation de documents",
              d: "Liste claire des pièces à fournir et dépôt sécurisé en ligne.",
            },
            {
              t: "Support & révision",
              d: "Réponses rapides à vos questions et vérification finale.",
            },
            {
              t: "Optimisation",
              d: "Crédits et déductions pour maximiser vos remboursements.",
            },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 18,
                background: "white",
              }}
            >
              <h3 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: 18 }}>{c.t}</h3>
              <p style={{ margin: 0, color: "#6b7280" }}>{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------- ÉTAPES -------- */}
      <section
        id="etapes"
        style={{
          background: "#f8fafc",
          borderTop: "1px solid #eef2f7",
          borderBottom: "1px solid #eef2f7",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "50px 16px" }}>
          <h2 style={{ color: bleu, marginBottom: 20 }}>Comment ça marche (4 étapes)</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {[
              { n: "1", t: "Créer votre compte", d: "On vous ouvre un espace sécurisé." },
              {
                n: "2",
                t: "Téléverser vos documents",
                d: "Photos ou PDF, tout passe par votre espace.",
              },
              {
                n: "3",
                t: "Révision & signature",
                d: "On prépare, vous vérifiez et signez en ligne.",
              },
              {
                n: "4",
                t: "Transmission",
                d: "On transmet aux autorités fiscales et on vous confirme.",
              },
            ].map((e, i) => (
              <div
                key={i}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 18,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: bleu,
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  {e.n}
                </div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: 18 }}>{e.t}</h3>
                <p style={{ margin: 0, color: "#6b7280" }}>{e.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------- TARIFS -------- */}
      <section id="tarifs" style={{ maxWidth: 1100, margin: "60px auto", padding: "0 16px" }}>
        <h2 style={{ color: bleu, marginBottom: 12 }}>Tarifs</h2>
        <p style={{ color: "#4b5563", marginBottom: 20 }}>
          Exemple de base — on confirme le prix selon votre situation.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {[
            {
              t: "Revenu simple",
              p: "à partir de 79 $",
              pts: ["T4/Relevé 1", "Crédits de base", "Transmission incluse"],
            },
            {
              t: "Travail autonome",
              p: "à partir de 189 $",
              pts: ["État des résultats", "Dépenses admissibles", "Optimisation"],
            },
            {
              t: "Famille",
              p: "sur mesure",
              pts: ["Conjoints & enfants", "Crédits familles", "Planification simple"],
            },
          ].map((x, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 20,
                background: "white",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18 }}>{x.t}</h3>
              <div style={{ color: bleu, fontWeight: 800, fontSize: 20, margin: "8px 0 12px" }}>
                {x.p}
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#6b7280" }}>
                {x.pts.map((p, j) => (
                  <li key={j}>{p}</li>
                ))}
              </ul>
              <div style={{ marginTop: 14 }}>
                <a
                  href="#contact"
                  style={{
                    display: "inline-block",
                    background: bleu,
                    color: "white",
                    padding: "10px 16px",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  Obtenir un prix
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------- CONTACT -------- */}
      <section
        id="contact"
        style={{
          maxWidth: 1100,
          margin: "60px auto",
          padding: "0 16px 60px",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 20,
        }}
      >
        <h2 style={{ color: bleu }}>Contact</h2>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 18,
            background: "white",
            maxWidth: 700,
          }}
        >
          {/* Formulaire sans backend (mailto) */}
          <form action="mailto:info@comptanetquebec.com" method="post" encType="text/plain">
            <div style={{ display: "grid", gap: 12 }}>
              <input
                name="Nom"
                placeholder="Votre nom"
                required
                style={inputStyle}
              />
              <input
                name="Courriel"
                placeholder="Votre courriel"
                type="email"
                required
                style={inputStyle}
              />
              <textarea
                name="Message"
                placeholder="Comment pouvons-nous aider?"
                rows={5}
                style={inputStyle}
              />
              <button
                type="submit"
                style={{
                  background: bleu,
                  color: "white",
                  border: 0,
                  padding: "12px 18px",
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Envoyer
              </button>
            </div>
          </form>

          <p style={{ color: "#6b7280", marginTop: 12 }}>
            ou écrivez-nous à <a href="mailto:info@comptanetquebec.com">info@comptanetquebec.com</a>
          </p>
        </div>
      </section>

      {/* -------- FOOTER -------- */}
      <footer style={{ background: "#0f172a", color: "#cbd5e1", padding: "24px 16px" }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo-cq.png" alt="" width={28} height={28} />
            <span>© {new Date().getFullYear()} ComptaNet Québec</span>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <a href="#services" style={{ color: "#cbd5e1", textDecoration: "none" }}>Services</a>
            <a href="#tarifs" style={{ color: "#cbd5e1", textDecoration: "none" }}>Tarifs</a>
            <a href="#contact" style={{ color: "#cbd5e1", textDecoration: "none" }}>Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* petit style réutilisable pour les inputs */
const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "12px 14px",
  outline: "none",
  fontSize: 14,
};
