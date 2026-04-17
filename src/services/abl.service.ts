// src/services/abl.service.ts
'use client'

import { createClient } from '@/lib/supabase/client'

// ============================================
// CONSTANTES
// ============================================
const ABL_TOTAL_SHOPPING = 48971.49

// ============================================
// TIPOS
// ============================================
export interface ABLResumo {
  competencia: string
  qtd_lojas: number
  qtd_quiosques: number
  qtd_depositos: number
  qtd_eventos: number
  total_unidades: number
  qtd_lojas_abl: number
  abl_total: number
  abl_ocupado: number
  abl_vago: number
  taxa_ocupacao: number
}

export interface ABLEncargos {
  total_condominio: number
  total_aluguel: number
  total_fpp: number
  condominio_por_m2: number
  aluguel_por_m2: number
  fpp_por_m2: number
}

export interface EncargosHistoricoItem {
  competencia: string
  condominio_por_area_locada: number
  condominio_por_abl_total: number
  aluguel_por_area_locada: number
  aluguel_por_abl_total: number
  fpp_por_area_locada: number
  fpp_por_abl_total: number
}

export interface ABLPorTipo {
  competencia: string
  tipo_loja: string
  qtd_lojas: number
  total_m2: number
  total_vendas: number
  vendas_por_m2: number
}

export interface ABLPorClassificacao {
  classificacao: string
  qtd_lojas: number
  total_m2: number
  percentual_abl: number
}

export interface LojaABL {
  nome_loja: string
  tipo: string
  classificacao: string
  abl_m2: number
  ultima_venda: number
  competencia: string
  vendas_por_m2: number
}

export interface ABLData {
  resumo: ABLResumo | null
  resumoAnterior: ABLResumo | null
  encargos: ABLEncargos | null
  encargosHistorico: EncargosHistoricoItem[]
  historico: ABLResumo[]
  porTipo: ABLPorTipo[]
  porClassificacao: ABLPorClassificacao[]
  lojas: LojaABL[]
  competenciaAtual: string
  ablTotalShopping: number
}

// ============================================
// SERVICE
// ============================================
class ABLService {
  private supabase = createClient()

  private getCompetenciaAnterior(comp: string): string {
    const [mes, ano] = comp.split('/')
    const m = parseInt(mes)
    const a = parseInt(ano)
    if (m === 1) {
      return `12/${a - 1}`
    }
    return `${String(m - 1).padStart(2, '0')}/${a}`
  }

  private async getEncargos(competencia: string, ablOcupado: number): Promise<ABLEncargos> {
    const { data: rows, error } = await this.supabase
      .from('staging_vendas')
      .select('condominio, alug_pct, alug_min, fundo_promo')
      .eq('competencia', competencia)

    if (error) {
      console.error('Erro ao buscar encargos:', error)
      return {
        total_condominio: 0,
        total_aluguel: 0,
        total_fpp: 0,
        condominio_por_m2: 0,
        aluguel_por_m2: 0,
        fpp_por_m2: 0,
      }
    }

    const totais = (rows || []).reduce(
      (acc, row) => ({
        condominio: acc.condominio + (Number(row.condominio) || 0),
        aluguel: acc.aluguel + (Number(row.alug_pct) || 0) + (Number(row.alug_min) || 0),
        fpp: acc.fpp + (Number(row.fundo_promo) || 0),
      }),
      { condominio: 0, aluguel: 0, fpp: 0 }
    )

    const divisor = ablOcupado > 0 ? ablOcupado : 1

    return {
      total_condominio: totais.condominio,
      total_aluguel: totais.aluguel,
      total_fpp: totais.fpp,
      condominio_por_m2: totais.condominio / divisor,
      aluguel_por_m2: totais.aluguel / divisor,
      fpp_por_m2: totais.fpp / divisor,
    }
  }

  /**
   * Busca encargos de TODOS os meses para gerar gráficos de evolução
   */
  /**
   * Busca encargos de TODOS os meses para gerar gráficos de evolução
   * NOTA: usa limit alto para evitar corte do Supabase (default 1000)
   */
  /**
 * Busca encargos de TODOS os meses — consulta MÊS A MÊS para evitar problemas
 */
  private async getEncargosHistorico(
    historico: ABLResumo[]
  ): Promise<EncargosHistoricoItem[]> {
    const resultado: EncargosHistoricoItem[] = []

    for (const h of historico) {
      if (!h.competencia) continue

      const { data: rows, error } = await this.supabase
        .from('staging_vendas')
        .select('condominio, alug_pct, alug_min, fundo_promo')
        .eq('competencia', h.competencia)
        .limit(500)

      if (error) {
        console.error('Erro encargos ' + h.competencia + ':', error)
        continue
      }

      const totais = (rows || []).reduce(
        (acc, row) => ({
          condominio: acc.condominio + (Number(row.condominio) || 0),
          aluguel: acc.aluguel + (Number(row.alug_pct) || 0) + (Number(row.alug_min) || 0),
          fpp: acc.fpp + (Number(row.fundo_promo) || 0),
        }),
        { condominio: 0, aluguel: 0, fpp: 0 }
      )

      const areaLocada = h.abl_ocupado > 0 ? h.abl_ocupado : 1

      resultado.push({
        competencia: h.competencia,
        condominio_por_area_locada: totais.condominio / areaLocada,
        condominio_por_abl_total: totais.condominio / ABL_TOTAL_SHOPPING,
        aluguel_por_area_locada: totais.aluguel / areaLocada,
        aluguel_por_abl_total: totais.aluguel / ABL_TOTAL_SHOPPING,
        fpp_por_area_locada: totais.fpp / areaLocada,
        fpp_por_abl_total: totais.fpp / ABL_TOTAL_SHOPPING,
      })
    }

    return resultado
  }

  private mapResumo(row: any): ABLResumo {
    return {
      competencia: row.competencia || '',
      qtd_lojas: Number(row.qtd_lojas) || 0,
      qtd_quiosques: Number(row.qtd_quiosques) || 0,
      qtd_depositos: Number(row.qtd_depositos) || 0,
      qtd_eventos: Number(row.qtd_eventos) || 0,
      total_unidades: Number(row.total_unidades) || 0,
      qtd_lojas_abl: Number(row.qtd_lojas_abl) || 0,
      abl_total: Number(row.abl_total) || ABL_TOTAL_SHOPPING,
      abl_ocupado: Number(row.abl_ocupado) || 0,
      abl_vago: Number(row.abl_vago) || 0,
      taxa_ocupacao: Number(row.taxa_ocupacao) || 0,
    }
  }

  async getData(competencia?: string): Promise<ABLData> {
    try {
      // 1. Buscar histórico de ABL
      const { data: historico, error: histError } = await this.supabase
        .from('vw_abl_resumo')
        .select('*')
        .order('competencia', { ascending: false })
        .limit(12)

      if (histError) throw histError

      const compAtual = competencia || historico?.[0]?.competencia || ''

      // 2. Resumo atual
      const resumoRow = historico?.find((h) => h.competencia === compAtual) || null
      const resumo = resumoRow ? this.mapResumo(resumoRow) : null

      // 3. Resumo anterior
      const compAnterior = compAtual ? this.getCompetenciaAnterior(compAtual) : ''
      const resumoAnteriorRow = historico?.find((h) => h.competencia === compAnterior) || null
      const resumoAnterior = resumoAnteriorRow ? this.mapResumo(resumoAnteriorRow) : null

      // 4. Encargos do mês selecionado
      const ablOcupado = resumo?.abl_ocupado || 0
      const encargos = compAtual ? await this.getEncargos(compAtual, ablOcupado) : null

      // 5. Histórico de encargos/m² (12 meses)
      const historicoMapeado = (historico || []).map((h) => this.mapResumo(h))
      const encargosHistorico = await this.getEncargosHistorico(historicoMapeado)

      // 6. Por tipo de loja
      const { data: porTipo, error: tipoError } = await this.supabase
        .from('vw_abl_por_tipo')
        .select('*')
        .eq('competencia', compAtual)
        .order('total_m2', { ascending: false })

      if (tipoError) throw tipoError

      // 7. Por classificação
      const { data: porClassificacao, error: classError } = await this.supabase
        .from('vw_abl_por_classificacao')
        .select('*')
        .order('total_m2', { ascending: false })

      if (classError) {
        console.warn('vw_abl_por_classificacao error (non-critical):', classError)
      }

      // 8. Lojas com ABL
      const { data: lojas, error: lojasError } = await this.supabase
        .from('vw_lojas_abl')
        .select('*')
        .order('abl_m2', { ascending: false })
        .limit(50)

      if (lojasError) throw lojasError

      return {
        resumo,
        resumoAnterior,
        encargos,
        encargosHistorico,
        historico: historicoMapeado,
        porTipo: (porTipo || []).map((t) => ({
          competencia: t.competencia,
          tipo_loja: t.tipo_loja || 'Outros',
          qtd_lojas: Number(t.qtd_lojas) || 0,
          total_m2: Number(t.total_m2) || 0,
          total_vendas: Number(t.total_vendas) || 0,
          vendas_por_m2: Number(t.vendas_por_m2) || 0,
        })),
        porClassificacao: (porClassificacao || []).map((c) => ({
          classificacao: c.classificacao || 'Não classificado',
          qtd_lojas: Number(c.qtd_lojas) || 0,
          total_m2: Number(c.total_m2) || 0,
          percentual_abl: Number(c.percentual_abl) || 0,
        })),
        lojas: (lojas || []).map((l) => ({
          nome_loja: l.nome_loja || '',
          tipo: l.tipo || '-',
          classificacao: l.classificacao || '-',
          abl_m2: Number(l.abl_m2) || 0,
          ultima_venda: Number(l.ultima_venda) || 0,
          competencia: l.competencia || '',
          vendas_por_m2: Number(l.vendas_por_m2) || 0,
        })),
        competenciaAtual: compAtual,
        ablTotalShopping: ABL_TOTAL_SHOPPING,
      }
    } catch (error) {
      console.error('Erro ao buscar dados ABL:', error)
      return {
        resumo: null,
        resumoAnterior: null,
        encargos: null,
        encargosHistorico: [],
        historico: [],
        porTipo: [],
        porClassificacao: [],
        lojas: [],
        competenciaAtual: '',
        ablTotalShopping: ABL_TOTAL_SHOPPING,
      }
    }
  }
}

export const ablService = new ABLService()