"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // ✅ redirection après connexion
    window.location.href = "/espace-client";
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/espace-client`,
      },
    });

    setLoading(false);

    if (error) setError(error.message);
  }

  async function handleResetPassword() {
    setError(null);

    if (!email) {
      setError("Entre ton courriel d’abord, puis clique « Mot de passe oublié ».");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/espace-client/reset`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setError("✅ Un courriel de réinitialisation a été envoyé (vérifie tes indésirables).");
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2">Espace client</h1>
      <p className="text-sm text-gray-600 mb-6">
        Connecte-toi avec ton courriel et ton mot de passe.
      </p>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="w-full border rounded p-3 font-medium disabled:opacity-50"
      >
        Continuer avec Google
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-gray-500">OU</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      {/* Email + password */}
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Courriel"
          required
          className="w-full border rounded p-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <input
          type="password"
          placeholder="Mot de passe"
          required
          className="w-full border rounded p-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white p-3 rounded font-medium disabled:opacity-50"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      {/* Mot de passe oublié */}
      <button
        type="button"
        onClick={handleResetPassword}
        disabled={loading}
        className="mt-4 text-sm underline text-gray-700 disabled:opacity-50"
      >
        Mot de passe oublié ?
      </button>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
