// src/services/sss.service.ts
'use client'

import { createClient } from '@/lib/supabase/client'

// ============================================
// TIPOS
// ============================================
export interface SSSResumo {
  competencia_atual: string
  competencia_anterior: string
  qtd_lojas_comparaveis: number
  total_vendas_atual: number
  total_vendas_anterior: number
  variacao_absoluta: number
  sss_pct: number
  total_cobranca_atual: number
  total_cobranca_anterior: number
}

export interface SSSLoja {
  competencia_atual: string
  competencia_anterior: string
  loja_nome: string
  vendas_atual: number
  vendas_anterior: number
  variacao_absoluta: number
  variacao_pct: number
  cobranca_atual: number
  cobranca_anterior: number
}

export interface SSSPorTipo {
  competencia_atual: string
  tipo_loja: string
  qtd_lojas: number
  vendas_atual: number
  vendas_anterior: number
  sss_pct: number
}

export interface SSSData {
  resumo: SSSResumo | null
  historico: SSSResumo[]
  lojas: SSSLoja[]
  porTipo: SSSPorTipo[]
  competenciaAtual: string
}

// ============================================
// SERVICE
// ============================================
class SSSService {
  private supabase = createClient()

  async getData(competencia?: string): Promise<SSSData> {
    try {
      // 1. Buscar histórico de SSS
      const { data: historico, error: histError } = await this.supabase
        .from('vw_sss_resumo')
        .select('*')
        .order('competencia_atual', { ascending: false })
        .limit(12)

      if (histError) throw histError

      // Determinar competência atual
      const compAtual = competencia || historico?.[0]?.competencia_atual || ''
      
      // 2. Buscar resumo da competência selecionada
      const resumo = historico?.find(h => h.competencia_atual === compAtual) || null

      // 3. Buscar detalhes por loja
      const { data: lojas, error: lojasError } = await this.supabase
        .from('vw_same_store_sales')
        .select('*')
        .eq('competencia_atual', compAtual)
        .order('variacao_pct', { ascending: false })

      if (lojasError) throw lojasError

      // 4. Buscar por tipo de loja
      const { data: porTipo, error: tipoError } = await this.supabase
        .from('vw_sss_por_tipo')
        .select('*')
        .eq('competencia_atual', compAtual)
        .order('sss_pct', { ascending: false })

      if (tipoError) throw tipoError

      return {
        resumo: resumo ? {
          ...resumo,
          qtd_lojas_comparaveis: Number(resumo.qtd_lojas_comparaveis),
          total_vendas_atual: Number(resumo.total_vendas_atual),
          total_vendas_anterior: Number(resumo.total_vendas_anterior),
          variacao_absoluta: Number(resumo.variacao_absoluta),
          sss_pct: Number(resumo.sss_pct),
          total_cobranca_atual: Number(resumo.total_cobranca_atual),
          total_cobranca_anterior: Number(resumo.total_cobranca_anterior),
        } : null,
        historico: (historico || []).map(h => ({
          ...h,
          qtd_lojas_comparaveis: Number(h.qtd_lojas_comparaveis),
          total_vendas_atual: Number(h.total_vendas_atual),
          total_vendas_anterior: Number(h.total_vendas_anterior),
          variacao_absoluta: Number(h.variacao_absoluta),
          sss_pct: Number(h.sss_pct),
          total_cobranca_atual: Number(h.total_cobranca_atual),
          total_cobranca_anterior: Number(h.total_cobranca_anterior),
        })),
        lojas: (lojas || []).map(l => ({
          ...l,
          vendas_atual: Number(l.vendas_atual),
          vendas_anterior: Number(l.vendas_anterior),
          variacao_absoluta: Number(l.variacao_absoluta),
          variacao_pct: Number(l.variacao_pct),
          cobranca_atual: Number(l.cobranca_atual),
          cobranca_anterior: Number(l.cobranca_anterior),
        })),
        porTipo: (porTipo || []).map(t => ({
          ...t,
          qtd_lojas: Number(t.qtd_lojas),
          vendas_atual: Number(t.vendas_atual),
          vendas_anterior: Number(t.vendas_anterior),
          sss_pct: Number(t.sss_pct),
        })),
        competenciaAtual: compAtual
      }

    } catch (error) {
      console.error('Erro ao buscar dados SSS:', error)
      return {
        resumo: null,
        historico: [],
        lojas: [],
        porTipo: [],
        competenciaAtual: ''
      }
    }
  }
}

export const sssService = new SSSService()