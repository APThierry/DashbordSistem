// src/services/dashboard.service.ts
import { createClient } from '@/lib/supabase/server'

export interface DashboardKPIs {
  vendas: number
  cobranca: number
  areaLocada: number
  operacoesTotais: number
  taxaOcupacao: number
}

export interface DetalheCobranca {
  aluguelPct: number
  aluguelMin: number
  condominio: number
  iptu: number
  cd: number
  fundoPromo: number
  especificos: number // agua + energia + adm + frt
}

export interface EvolucaoMensal {
  competencia: string
  vendas: number
  cobranca: number
}

export interface TopLoja {
  loja_nome: string
  tipo_loja: string
  m2: number
  vendas: number
  cobranca: number
  percentual: number
}

export async function getDashboardKPIs(competencia: string): Promise<DashboardKPIs> {
  const supabase = await createClient()

  // Buscar resumo mensal
  const { data: resumo } = await supabase
    .from('vw_resumo_mensal')
    .select('*')
    .eq('competencia', competencia)
    .single()

  // Buscar ABL
  const { data: abl } = await supabase
    .from('vw_abl_resumo')
    .select('*')
    .eq('competencia', competencia)
    .single()

  return {
    vendas: resumo?.vendas || 0,
    cobranca: resumo?.cobranca_total || 0,
    areaLocada: abl?.abl_ocupado || 0,
    operacoesTotais: resumo?.total_lojas || 0,
    taxaOcupacao: abl?.taxa_ocupacao || 0
  }
}

export async function getDetalheCobranca(competencia: string): Promise<DetalheCobranca> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('vw_cobranca_resumo')
    .select('*')
    .eq('competencia', competencia)
    .single()

  return {
    aluguelPct: data?.alug_pct || 0,
    aluguelMin: data?.alug_min || 0,
    condominio: data?.condominio || 0,
    iptu: data?.iptu || 0,
    cd: 0, // CD não existe na tabela atual - verificar se tem coluna
    fundoPromo: data?.fundo_promo || 0,
    especificos: data?.especificos || 0
  }
}

export async function getEvolucaoMensal(): Promise<EvolucaoMensal[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('vw_resumo_mensal')
    .select('competencia, vendas, cobranca_total')
    .order('competencia', { ascending: true })
    .limit(12)

  return (data || []).map(d => ({
    competencia: d.competencia,
    vendas: d.vendas || 0,
    cobranca: d.cobranca_total || 0
  }))
}

export async function getTopLojasPorVendas(
  competencia: string,
  limit: number = 10,
  filtroTipo?: string
): Promise<TopLoja[]> {
  const supabase = await createClient()

  let query = supabase
    .from('staging_vendas')
    .select('loja_nome, tipo_loja, m2, vendas, cobranca_total')
    .eq('competencia', competencia)
    .gt('vendas', 0)
    .order('vendas', { ascending: false })
    .limit(limit)

  if (filtroTipo && filtroTipo !== 'todos') {
    query = query.eq('tipo_loja', filtroTipo)
  }

  const { data } = await query

  return (data || []).map(d => ({
    loja_nome: d.loja_nome,
    tipo_loja: d.tipo_loja || 'N/A',
    m2: d.m2 || 0,
    vendas: d.vendas || 0,
    cobranca: d.cobranca_total || 0,
    percentual: d.vendas > 0 ? ((d.cobranca_total || 0) / d.vendas) * 100 : 0
  }))
}

export async function getCompetencias(): Promise<string[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('staging_vendas')
    .select('competencia')
    .not('competencia', 'is', null)
    .order('competencia', { ascending: false })

  const unique = [...new Set((data || []).map(d => d.competencia))]
  return unique.filter(Boolean) as string[]
}

export async function getTiposLoja(): Promise<string[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('staging_vendas')
    .select('tipo_loja')
    .not('tipo_loja', 'is', null)

  const unique = [...new Set((data || []).map(d => d.tipo_loja))]
  return unique.filter(Boolean) as string[]
}