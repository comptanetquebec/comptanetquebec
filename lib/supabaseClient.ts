import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined')
if (!anon) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined')

export const supabase = createClient(url, anon)
