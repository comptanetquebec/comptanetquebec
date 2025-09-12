'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function EspaceClient() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Option: si l’utilisateur est déjà connecté
  const [userEmail, setUserEmail] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/espace-client` },
    })
    setSending(false)
    if (error) setMessage(error.message)
    else setMessage('Lien de connexion envoyé. Vérifiez vos courriels.')
  }

  if (userEmail) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-2">Espace client</h1>
        <p className="text-slate-600 mb-6">Connecté en tant que <strong>{userEmail}</strong>.</p>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-slate-700">
            La zone sécurisée (dépôt de documents, suivi du dossier) arrive prochainement.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Espace client</h1>
      <p className="text-slate-600 mb-6">
        Connectez-vous par lien magique pour déposer vos documents et suivre votre dossier.
      </p>
      <form onSubmit={onSubmit} className="rounded-lg border bg-white p-6 grid gap-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Votre courriel"
          className="border rounded-md px-3 py-2"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md px-4 py-2 disabled:opacity-60"
        >
          {sending ? 'Envoi…' : 'Recevoir le lien'}
        </button>
        {message && <p className="text-slate-700">{message}</p>}
      </form>
    </main>
  )
}

