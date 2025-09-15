// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// On récupère les variables définies dans Vercel (ou dans .env.local en dev)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined

// Vérifications avec erreurs claires
if (!supabaseUrl) {
  throw new Error('❌ Erreur: NEXT_PUBLIC_SUPABASE_URL est manquant. Vérifie tes variables d’environnement.')
}

if (!supabaseAnonKey) {
  throw new Error('❌ Erreur: NEXT_PUBLIC_SUPABASE_ANON_KEY est manquant. Vérifie tes variables d’environnement.')
}

// Création du client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
