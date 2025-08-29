import Image from "next/image";

export default function Home() {
  return (
    <main>
      {/* Barre de haut de page */}
      <header className="container">
        <div className="brand">
          <Image
            src="/logo-cq.png"
            alt="ComptaNet Québec"
            width={44}
            height={44}
            priority
          />
          <span className="brand-text">ComptaNet Québec</span>
        </div>

        <nav className="nav">
          <a href="#services">Services</a>
          <a href="#tarifs">Tarifs</a>
          <a href="#contact" className="btn">Nous joindre</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero">
        <h1>Simplifiez vos impôts et votre comptabilité</h1>
        <p className="lead">
          Partenaire de confiance partout au Québec. Déclarations de revenus,
          organisation des documents et soutien à distance — rapide et clair.
        </p>
        <div className="cta-row">
          <a href="#tarifs" className="btn btn-primary">Voir les tarifs</a>
          <a href="#contact" className="btn btn-outline">Demander une soumission</a>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="container section">
        <h2>Services</h2>
        <div className="cards">
          <article className="card">
            <h3>Déclarations de revenus</h3>
            <p>Particuliers et travailleurs autonomes. Conseils, optimisation et transmission sécurisée.</p>
          </article>
          <article className="card">
            <h3>Organisation de documents</h3>
            <p>Tri, numérisation et checklists pour ne rien oublier. Envoi en ligne simple.</p>
          </article>
          <article className="card">
            <h3>Soutien à distance</h3>
            <p>Accompagnement par courriel ou appel vidéo. Réponses rapides et claires.</p>
          </article>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="container section">
        <h2>Tarifs indicatifs</h2>
        <ul className="prices">
          <li><strong>Revenus simples (T4/RL-1)</strong> — à partir de 79&nbsp;$</li>
          <li><strong>Travail autonome</strong> — à partir de 189&nbsp;$</li>
          <li><strong>Couple</strong> — à partir de 149&nbsp;$</li>
        </ul>
        <p className="note">Les prix exacts dépendent de votre situation. Obtenez une soumission en 2 minutes.</p>
      </section>

      {/* Contact */}
      <section id="contact" className="container section">
        <h2>Nous joindre</h2>
        <p>
          Écrivez-nous à <a href="mailto:contact@comptanetquebec.com">contact@comptanetquebec.com</a>
          {" "}ou envoyez une demande avec les informations ci-dessous.
        </p>

        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            alert("Merci! Votre message a été envoyé."); // remplace plus tard par un vrai traitement
          }}
        >
          <div className="grid">
            <label>
              Nom
              <input type="text" name="name" required />
            </label>
            <label>
              Courriel
              <input type="email" name="email" required />
            </label>
          </div>
          <label>
            Message
            <textarea name="message" rows={5} required />
          </label>
          <button className="btn btn-primary" type="submit">Envoyer</button>
        </form>
      </section>

      {/* Pied de page */}
      <footer className="footer">
        <div className="container footer-inner">
          <span>© {new Date().getFullYear()} ComptaNet Québec</span>
          <a href="#top">Haut de page ↑</a>
        </div>
      </footer>
    </main>
  );
}
