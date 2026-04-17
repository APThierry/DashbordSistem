// src/app/api/audit/runs/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar service role para acesso server-side (sem autenticação)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey)
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('audit_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Erro Supabase:', error)
      throw error
    }

    return NextResponse.json({ runs: data || [] })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro ao buscar audit_runs:', errorMessage)
    return NextResponse.json({ runs: [], error: errorMessage }, { status: 500 })
  }
}