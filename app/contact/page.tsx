import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <main className="p-8 min-h-screen bg-gray-50 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-6 text-center">Contactez-nous</h1>
      
      <p className="mb-6 text-center max-w-lg">
        Vous avez des questions sur nos services de déclaration d'impôt au Québec ? 
        Envoyez-nous un message via le formulaire ci-dessous et nous vous répondrons rapidement.
      </p>

      {/* Formulaire */}
      <ContactForm />
    </main>
  );
}
