// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_DB_URL
const supabaseKey = process.env.DB_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_DB_ANON_KEY

export async function createClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Supabase server: variáveis de ambiente faltando.\n` +
      `NEXT_PUBLIC_DB_URL: ${supabaseUrl ? '✅' : '❌ MISSING'}\n` +
      `DB_SERVICE_ROLE_KEY: ${process.env.DB_SERVICE_ROLE_KEY ? '✅' : '❌ MISSING'}\n` +
      `NEXT_PUBLIC_DB_ANON_KEY: ${process.env.NEXT_PUBLIC_DB_ANON_KEY ? '✅' : '❌ MISSING'}`
    )
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Ignorar em Server Components (read-only)
        }
      },
    },
  })
}