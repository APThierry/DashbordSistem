// src/services/lojas.service.ts
'use client'

import { createClient } from '@/lib/supabase/client'

// ============================================
// TIPOS
// ============================================

export interface LojaCompleta {
  loja_nome: string
  competencia: string
  m2: number
  entra_no_m2: string
  segmento_abrasce: string
  tipo_loja: string
  classificacao_lojas: string
  vendas: number
  cobranca_total: number
  total_aluguel: number
  condominio: number
  energia: number
  vendas_por_m2: number
  pct_cobranca_vendas: number
}

export interface LojaPorSegmento {
  competencia: string
  segmento: string
  qtd_lojas: number
  total_m2: number
  total_vendas: number
  vendas_por_m2: number
}

export interface LojasResumo {
  competencia: string
  total_lojas: number
  lojas_no_abl: number
  abl_total: number
  m2_total: number
  vendas_total: number
  qtd_segmentos: number
  vendas_por_m2: number
  cobranca_total: number
}

export interface LojasData {
  resumo: LojasResumo | null
  lojas: LojaCompleta[]
  porSegmento: LojaPorSegmento[]
  competencias: string[]
  competenciaAtual: string
}

// ============================================
// SERVICE
// ============================================

class LojasService {
  private supabase = createClient()

  async getData(competencia?: string): Promise<LojasData> {
    try {
      // 1. Buscar resumos para ter lista de competências
      const { data: resumos, error: resumoError } = await this.supabase
        .from('vw_lojas_resumo')
        .select('*')
        .order('competencia', { ascending: false })

      if (resumoError) throw resumoError

      // Determinar competência atual
      const competencias = (resumos || []).map(r => r.competencia)
      const compAtual = competencia || competencias[0] || ''

      // Resumo da competência selecionada
      const resumoRaw = resumos?.find(r => r.competencia === compAtual) || null

      // 2. Buscar lojas da competência (sem limite — paginação no frontend)
      const { data: lojas, error: lojasError } = await this.supabase
        .from('vw_lojas_completo')
        .select('*')
        .eq('competencia', compAtual)
        .order('vendas', { ascending: false })

      if (lojasError) throw lojasError

      // 3. Buscar por segmento
      const { data: porSegmento, error: segError } = await this.supabase
        .from('vw_lojas_por_segmento')
        .select('*')
        .eq('competencia', compAtual)
        .order('total_vendas', { ascending: false })

      if (segError) throw segError

      // Calcular cobranca_total e pct_cobranca_vendas do resumo
      const lojasProcessadas = (lojas || []).map(l => ({
        loja_nome: l.loja_nome || '',
        competencia: l.competencia || compAtual,
        m2: Number(l.m2) || 0,
        entra_no_m2: l.entra_no_m2 || '-',
        segmento_abrasce: l.segmento_abrasce || 'Não classificado',
        tipo_loja: l.tipo_loja || '-',
        classificacao_lojas: l.classificacao_lojas || '-',
        vendas: Number(l.vendas) || 0,
        cobranca_total: Number(l.cobranca_total) || 0,
        total_aluguel: Number(l.total_aluguel) || 0,
        condominio: Number(l.condominio) || 0,
        energia: Number(l.energia) || 0,
        vendas_por_m2: Number(l.vendas_por_m2) || 0,
        pct_cobranca_vendas: Number(l.pct_cobranca_vendas) || 0,
      }))

      // Calcular % Cobrança/Vendas geral
      const totalVendas = lojasProcessadas.reduce((s, l) => s + l.vendas, 0)
      const totalCobranca = lojasProcessadas.reduce((s, l) => s + l.cobranca_total, 0)
      const pctGeral = totalVendas > 0 ? (totalCobranca / totalVendas) * 100 : 0

      const resumo: LojasResumo | null = resumoRaw
        ? {
          competencia: resumoRaw.competencia,
          total_lojas: Number(resumoRaw.total_lojas) || 0,
          lojas_no_abl: Number(resumoRaw.lojas_no_abl) || 0,
          abl_total: Number(resumoRaw.abl_total) || 0,
          m2_total: Number(resumoRaw.m2_total) || 0,
          vendas_total: Number(resumoRaw.vendas_total) || 0,
          qtd_segmentos: Number(resumoRaw.qtd_segmentos) || 0,
          vendas_por_m2: Number(resumoRaw.vendas_por_m2) || 0,
          cobranca_total: Number(resumoRaw.cobranca_total) || totalCobranca,
        }
        : null

      return {
        resumo,
        lojas: lojasProcessadas,
        porSegmento: (porSegmento || []).map(s => ({
          competencia: s.competencia,
          segmento: s.segmento || 'Não classificado',
          qtd_lojas: Number(s.qtd_lojas) || 0,
          total_m2: Number(s.total_m2) || 0,
          total_vendas: Number(s.total_vendas) || 0,
          vendas_por_m2: Number(s.vendas_por_m2) || 0,
        })),
        competencias,
        competenciaAtual: compAtual,
      }
    } catch (error) {
      console.error('Erro ao buscar dados de lojas:', error)
      return {
        resumo: null,
        lojas: [],
        porSegmento: [],
        competencias: [],
        competenciaAtual: '',
      }
    }
  }
}

export const lojasService = new LojasService()