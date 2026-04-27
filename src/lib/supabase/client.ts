// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_DB_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_DB_ANON_KEY

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Supabase client: variáveis de ambiente faltando.\n` +
      `NEXT_PUBLIC_DB_URL: ${supabaseUrl ? '✅' : '❌ MISSING'}\n` +
      `NEXT_PUBLIC_DB_ANON_KEY: ${supabaseAnonKey ? '✅' : '❌ MISSING'}`
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export default createClient