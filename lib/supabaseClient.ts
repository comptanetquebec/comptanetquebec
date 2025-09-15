import { createClient } from '@supabase/supabase-js'

const getEnv = (name: string) => {
  const v = process.env[name]
  if (!v) {
    // On n’arrête pas le build : on logge seulement.
    console.warn(`[supabase] Missing env var: ${name}`)
  }
  return v ?? ''
}

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
