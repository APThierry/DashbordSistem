// src/services/cobranca.service.ts
'use client'

import { createClient } from '@/lib/supabase/client'

// ============================================
// TIPOS
// ============================================
export interface CobrancaResumo {
  competencia: string
  qtd_lojas: number
  total_vendas: number
  total_cobranca: number
  total_alug_pct: number
  total_alug_min: number
  total_aluguel: number
  total_condominio: number
  total_energia: number
  total_agua: number
  total_fundo_promo: number
  total_iptu: number
  total_taxa_adm: number
  total_frt: number
  total_outras: number
  total_especificos: number
  pct_cobranca_vendas: number
  pct_aluguel: number
  pct_condominio: number
  pct_energia: number
  pct_fpp: number
  pct_especificos: number
}

export interface CobrancaPorLoja {
  loja_nome: string
  competencia: string
  tipo_loja: string
  m2: number
  vendas: number
  cobranca_total: number
  alug_pct: number
  alug_min: number
  total_aluguel: number
  condominio: number
  energia: number
  agua: number
  fundo_promo: number
  iptu: number
  taxa_adm: number
  frt: number
  outras: number
  especificos: number
  pct_cobranca_vendas: number
  cobranca_por_m2: number
}

export interface CobrancaPorTipo {
  competencia: string
  tipo_loja: string
  qtd_lojas: number
  total_vendas: number
  total_cobranca: number
  total_aluguel: number
  total_condominio: number
  total_energia: number
  pct_cobranca_vendas: number
}

export interface CobrancaEvolucao {
  competencia: string
  tipo_encargo: string
  valor: number
}

export interface CobrancaData {
  resumo: CobrancaResumo | null
  resumoAnterior: CobrancaResumo | null
  historico: CobrancaResumo[]
  porLoja: CobrancaPorLoja[]
  porTipo: CobrancaPorTipo[]
  evolucao: CobrancaEvolucao[]
  competenciaAtual: string
}

// ============================================
// SERVICE
// ============================================
class CobrancaService {
  private supabase = createClient()

  private getCompetenciaAnterior(comp: string): string {
    const [mes, ano] = comp.split('/')
    const m = parseInt(mes)
    const a = parseInt(ano)
    if (m === 1) return `12/${a - 1}`
    return `${String(m - 1).padStart(2, '0')}/${a}`
  }

  async getData(competencia?: string): Promise<CobrancaData> {
    try {
      // 1. Buscar histórico
      const { data: historico, error: histError } = await this.supabase
        .from('vw_cobranca_resumo')
        .select('*')
        .order('competencia', { ascending: false })
        .limit(12)

      if (histError) throw histError

      const compAtual = competencia || historico?.[0]?.competencia || ''

      // Resumo atual
      const resumoRow = historico?.find(h => h.competencia === compAtual) || null
      const resumo = resumoRow ? this.mapResumo(resumoRow) : null

      // Resumo anterior
      const compAnterior = compAtual ? this.getCompetenciaAnterior(compAtual) : ''
      const resumoAnteriorRow = historico?.find(h => h.competencia === compAnterior) || null
      const resumoAnterior = resumoAnteriorRow ? this.mapResumo(resumoAnteriorRow) : null

      // 2. Por loja
      const { data: porLoja, error: lojaError } = await this.supabase
        .from('vw_cobranca_por_loja')
        .select('*')
        .eq('competencia', compAtual)
        .order('cobranca_total', { ascending: false })
        .limit(50)

      if (lojaError) throw lojaError

      // 3. Por tipo
      const { data: porTipo, error: tipoError } = await this.supabase
        .from('vw_cobranca_por_tipo')
        .select('*')
        .eq('competencia', compAtual)
        .order('total_cobranca', { ascending: false })

      if (tipoError) throw tipoError

      // 4. Evolução
      const { data: evolucao, error: evolError } = await this.supabase
        .from('vw_cobranca_evolucao')
        .select('*')
        .order('competencia', { ascending: true })

      if (evolError) throw evolError

      return {
        resumo,
        resumoAnterior,
        historico: (historico || []).map(h => this.mapResumo(h)),
        porLoja: (porLoja || []).map(l => this.mapLoja(l)),
        porTipo: (porTipo || []).map(t => this.mapTipo(t)),
        evolucao: (evolucao || []).map(e => ({
          competencia: e.competencia,
          tipo_encargo: e.tipo_encargo,
          valor: Number(e.valor) || 0,
        })),
        competenciaAtual: compAtual,
      }
    } catch (error) {
      console.error('Erro ao buscar dados de cobrança:', error)
      return {
        resumo: null,
        resumoAnterior: null,
        historico: [],
        porLoja: [],
        porTipo: [],
        evolucao: [],
        competenciaAtual: '',
      }
    }
  }

  private mapResumo(r: any): CobrancaResumo {
    const cobranca = Number(r.cobranca_total) || 0
    const vendas = Number(r.vendas) || 0
    const alug_pct = Number(r.alug_pct) || 0
    const alug_min = Number(r.alug_min) || 0
    const aluguel = Number(r.total_aluguel) || 0
    const condominio = Number(r.condominio) || 0
    const energia = Number(r.energia) || 0
    const agua = Number(r.agua) || 0
    const fundo_promo = Number(r.fundo_promo) || 0
    const iptu = Number(r.iptu) || 0
    const taxa_adm = Number(r.taxa_adm) || 0
    const frt = Number(r.frt) || 0
    const outras = Number(r.outras) || 0
    const especificos = Number(r.especificos) || 0

    const divisor = cobranca > 0 ? cobranca : 1

    return {
      competencia: r.competencia || '',
      qtd_lojas: Number(r.total_lojas) || 0,
      total_vendas: vendas,
      total_cobranca: cobranca,
      total_alug_pct: alug_pct,
      total_alug_min: alug_min,
      total_aluguel: aluguel,
      total_condominio: condominio,
      total_energia: energia,
      total_agua: agua,
      total_fundo_promo: fundo_promo,
      total_iptu: iptu,
      total_taxa_adm: taxa_adm,
      total_frt: frt,
      total_outras: outras,
      total_especificos: especificos,
      pct_cobranca_vendas: Number(r.percentual_cobranca_vendas) || (vendas > 0 ? (cobranca / vendas) * 100 : 0),
      pct_aluguel: (aluguel / divisor) * 100,
      pct_condominio: (condominio / divisor) * 100,
      pct_energia: (energia / divisor) * 100,
      pct_fpp: (fundo_promo / divisor) * 100,
      pct_especificos: (especificos / divisor) * 100,
    }
  }

  private mapLoja(l: any): CobrancaPorLoja {
    const iptu = Number(l.iptu) || 0
    const fundo_promo = Number(l.fundo_promo) || 0
    const taxa_adm = Number(l.taxa_adm) || 0
    const frt = Number(l.frt) || 0
    const outras = Number(l.outras) || 0

    return {
      loja_nome: l.loja_nome || '',
      competencia: l.competencia || '',
      tipo_loja: l.tipo_loja || '-',
      m2: Number(l.m2) || 0,
      vendas: Number(l.vendas) || 0,
      cobranca_total: Number(l.cobranca_total) || 0,
      alug_pct: Number(l.alug_pct) || 0,
      alug_min: Number(l.alug_min) || 0,
      total_aluguel: Number(l.total_aluguel) || 0,
      condominio: Number(l.condominio) || 0,
      energia: Number(l.energia) || 0,
      agua: Number(l.agua) || 0,
      fundo_promo,
      iptu,
      taxa_adm,
      frt,
      outras,
      especificos: iptu + fundo_promo + taxa_adm + frt + outras,
      pct_cobranca_vendas: Number(l.pct_cobranca_vendas) || 0,
      cobranca_por_m2: Number(l.cobranca_por_m2) || 0,
    }
  }

  private mapTipo(t: any): CobrancaPorTipo {
    return {
      competencia: t.competencia || '',
      tipo_loja: t.tipo_loja || '-',
      qtd_lojas: Number(t.qtd_lojas) || 0,
      total_vendas: Number(t.total_vendas) || 0,
      total_cobranca: Number(t.total_cobranca) || 0,
      total_aluguel: Number(t.total_aluguel) || 0,
      total_condominio: Number(t.total_condominio) || 0,
      total_energia: Number(t.total_energia) || 0,
      pct_cobranca_vendas: Number(t.pct_cobranca_vendas) || 0,
    }
  }
}

export const cobrancaService = new CobrancaService()