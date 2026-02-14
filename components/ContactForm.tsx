"use client";

import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    company: "", // honeypot
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // ⚠️ remplace 'recaptcha_token_ici' par ton token reCAPTCHA v2 réel
      const token = "recaptcha_token_ici";

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, token }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erreur inconnue");
      }

      setSuccess(true);
      setForm({ name: "", email: "", message: "", company: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">

      {/* Honeypot anti-spam */}
      <input
        type="text"
        name="company"
        value={form.company}
        onChange={(e) => setForm({ ...form, company: e.target.value })}
        style={{ display: "none" }}
        tabIndex={-1}
        autoComplete="off"
      />

      <input
        type="text"
        placeholder="Votre nom"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="border p-2 w-full rounded"
      />

      <input
        type="email"
        placeholder="Votre courriel"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="border p-2 w-full rounded"
      />

      <textarea
        placeholder="Votre message"
        required
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="border p-2 w-full rounded"
        rows={6}
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        {loading ? "Envoi..." : "Envoyer"}
      </button>

      {success && <p className="text-green-600">Message envoyé ✅</p>}
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
