// src/app/(dashboard)/dashboards/abl/page.tsx
'use client'

import { useMemo } from 'react'
import { useABL } from '@/hooks/useABL'
import { OcupacaoChart, ABLClassificacaoChart } from '@/components/charts'
import { EncargosM2Chart } from '@/components/charts/EncargosM2Chart'
import { CompetenciaSelect } from '@/components/filters/CompetenciaSelect'
import { formatCompetencia, formatNumber, formatCurrency } from '@/lib/utils/format'
import {
  RefreshCw,
  Building2,
  Ruler,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Landmark,
  Megaphone,
} from 'lucide-react'

// ============================================
// HELPER
// ============================================
function calcVariacao(atual: number, anterior: number): number | null {
  if (!anterior || anterior === 0) return null
  return ((atual - anterior) / anterior) * 100
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function ABLPage() {
  const { data, loading, error, refresh, competencia, setCompetencia } = useABL()

  // Preparar dados para os 3 gráficos de encargos/m²
  const dadosCondominio = useMemo(
    () =>
      (data?.encargosHistorico || []).map((e) => ({
        competencia: e.competencia,
        por_area_locada: e.condominio_por_area_locada,
        por_abl_total: e.condominio_por_abl_total,
      })),
    [data?.encargosHistorico]
  )

  const dadosAluguel = useMemo(
    () =>
      (data?.encargosHistorico || []).map((e) => ({
        competencia: e.competencia,
        por_area_locada: e.aluguel_por_area_locada,
        por_abl_total: e.aluguel_por_abl_total,
      })),
    [data?.encargosHistorico]
  )

  const dadosFpp = useMemo(
    () =>
      (data?.encargosHistorico || []).map((e) => ({
        competencia: e.competencia,
        por_area_locada: e.fpp_por_area_locada,
        por_abl_total: e.fpp_por_abl_total,
      })),
    [data?.encargosHistorico]
  )

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    )
  }

  const resumo = data?.resumo
  const anterior = data?.resumoAnterior
  const encargos = data?.encargos

  const varOcupacao = anterior
    ? calcVariacao(resumo?.abl_ocupado || 0, anterior.abl_ocupado)
    : null

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">ABL & Ocupação</h1>
          <p className="text-muted-foreground">
            Área Bruta Locável e taxa de ocupação do shopping
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CompetenciaSelect
            value={competencia || data?.competenciaAtual || ''}
            onChange={setCompetencia}
          />
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && data && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-40">
          <div className="bg-card p-4 rounded-lg shadow-lg flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <span>Carregando...</span>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* KPIs LINHA 1 — ABL Principal (4 cards) */}
      {/* ============================================ */}
      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* ABL Total */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ABL Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(resumo.abl_total, 2)} m²
                </p>
                <p className="text-xs text-gray-400 mt-1.5">Área total do shopping</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Ruler className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* ABL Locada */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ABL Locada</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatNumber(resumo.abl_ocupado, 2)} m²
                </p>
                {varOcupacao != null ? (
                  <div className="flex items-center gap-1 mt-1.5">
                    {varOcupacao > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                    ) : varOcupacao < 0 ? (
                      <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    <span
                      className={`text-xs font-medium ${varOcupacao > 0
                          ? 'text-green-600'
                          : varOcupacao < 0
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }`}
                    >
                      {varOcupacao > 0 ? '+' : ''}
                      {varOcupacao.toFixed(1)}% vs mês anterior
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-1.5">
                    {resumo.taxa_ocupacao.toFixed(1)}% de ocupação
                  </p>
                )}
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* ABL Vago */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ABL Vago</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(resumo.abl_vago, 2)} m²
                </p>
                <p className="text-xs text-gray-400 mt-1.5">
                  {(100 - resumo.taxa_ocupacao).toFixed(1)}% disponível
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Ruler className="w-6 h-6 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Operações Ativas */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Operações Ativas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {resumo.total_unidades}
                </p>
                <p className="text-xs text-gray-400 mt-1.5">
                  {resumo.qtd_lojas} lojas · {resumo.qtd_quiosques} quiosques
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* KPIs LINHA 2 — Encargos por m² (3 cards) */}
      {/* ============================================ */}
      {encargos && resumo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Aluguel / m²</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {formatCurrency(encargos.aluguel_por_m2)}
                </p>
                <p className="text-xs text-gray-400 mt-1.5">
                  Total: {formatCurrency(encargos.total_aluguel)}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Condomínio / m²</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {formatCurrency(encargos.condominio_por_m2)}
                </p>
                <p className="text-xs text-gray-400 mt-1.5">
                  Total: {formatCurrency(encargos.total_condominio)}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Landmark className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">FPP / m²</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {formatCurrency(encargos.fpp_por_m2)}
                </p>
                <p className="text-xs text-gray-400 mt-1.5">
                  Total: {formatCurrency(encargos.total_fpp)}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Megaphone className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* GRÁFICOS — Ocupação + ABL por Tipo */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-2">Taxa de Ocupação</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {formatCompetencia(data?.competenciaAtual || '')}
          </p>
          {resumo ? (
            <OcupacaoChart ocupado={resumo.abl_ocupado} vago={resumo.abl_vago} altura={280} />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              Sem dados de ocupação
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-2">ABL por Tipo de Operação</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Distribuição da área por tipo — {formatCompetencia(data?.competenciaAtual || '')}
          </p>
          {data && data.porTipo.length > 0 ? (
            <ABLClassificacaoChart
              dados={data.porTipo}
              altura={280}
              ablTotal={resumo?.abl_total}
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              Sem dados por tipo
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* BLOCO UNIFICADO: Distribuição por Tipo + Evolução Encargos/m² */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {/* Título do bloco */}
        <h2 className="text-lg font-semibold mb-1">Distribuição por Tipo & Encargos por m²</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Detalhamento por tipo de operação e evolução dos encargos por área locada — últimos 12 meses
        </p>

        {/* Cards por tipo de loja */}
        {data && data.porTipo.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {data.porTipo.map((tipo) => {
              const pctAbl =
                resumo && resumo.abl_total > 0
                  ? ((tipo.total_m2 / resumo.abl_total) * 100).toFixed(1)
                  : '0'

              return (
                <div
                  key={tipo.tipo_loja}
                  className="bg-gray-50 rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${tipo.tipo_loja === 'Loja'
                          ? 'bg-blue-100 text-blue-700'
                          : tipo.tipo_loja === 'Quiosque'
                            ? 'bg-pink-100 text-pink-700'
                            : tipo.tipo_loja === 'Eventos'
                              ? 'bg-amber-100 text-amber-700'
                              : tipo.tipo_loja === 'Depósito'
                                ? 'bg-gray-200 text-gray-600'
                                : 'bg-purple-100 text-purple-700'
                        }`}
                    >
                      {tipo.tipo_loja}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {tipo.qtd_lojas} unidades
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Área:</span>
                      <span className="font-medium text-sm">
                        {formatNumber(tipo.total_m2, 0)} m²
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">% ABL:</span>
                      <span className="font-medium text-sm">{pctAbl}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Vendas:</span>
                      <span className="font-medium text-sm text-green-600">
                        {formatCurrency(tipo.total_vendas)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Vendas/m²:</span>
                      <span className="font-medium text-sm">
                        {formatCurrency(tipo.vendas_por_m2)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Separador visual */}
        <div className="border-t border-gray-100 pt-5 mb-2">
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            Evolução dos Encargos por m²
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-purple-500 inline-block rounded"></span>
              Por Área Locada
            </span>
            <span className="mx-3">·</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-green-500 inline-block rounded"></span>
              Por ABL Total (48.971 m²)
            </span>
          </p>
        </div>

        {/* 3 Gráficos de Evolução */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <EncargosM2Chart
            dados={dadosCondominio}
            titulo="Condomínio por Área Locada m²"
            corLocada="#8b5cf6"
            corTotal="#22c55e"
            altura={220}
          />
          <EncargosM2Chart
            dados={dadosAluguel}
            titulo="Aluguéis por Área Locada m²"
            corLocada="#8b5cf6"
            corTotal="#22c55e"
            altura={220}
          />
          <EncargosM2Chart
            dados={dadosFpp}
            titulo="FPP por Área Locada m²"
            corLocada="#8b5cf6"
            corTotal="#22c55e"
            altura={220}
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* TABELA — MAIORES ÁREAS */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Maiores Áreas por Loja</h2>
          <p className="text-sm text-muted-foreground">
            Top 20 operações por ABL (com área &gt; 0)
          </p>
        </div>

        {data && data.lojas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium text-xs text-gray-500 uppercase">#</th>
                  <th className="text-left p-3 font-medium text-xs text-gray-500 uppercase">Loja</th>
                  <th className="text-left p-3 font-medium text-xs text-gray-500 uppercase">Tipo</th>
                  <th className="text-left p-3 font-medium text-xs text-gray-500 uppercase">
                    Classificação
                  </th>
                  <th className="text-right p-3 font-medium text-xs text-gray-500 uppercase">
                    ABL (m²)
                  </th>
                  <th className="text-right p-3 font-medium text-xs text-gray-500 uppercase">
                    % ABL
                  </th>
                  <th className="text-right p-3 font-medium text-xs text-gray-500 uppercase">
                    Última Venda
                  </th>
                  <th className="text-right p-3 font-medium text-xs text-gray-500 uppercase">
                    Vendas/m²
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.lojas
                  .filter((l) => l.abl_m2 > 0)
                  .slice(0, 20)
                  .map((loja, index) => {
                    const pctAbl =
                      resumo && resumo.abl_total > 0
                        ? ((loja.abl_m2 / resumo.abl_total) * 100).toFixed(1)
                        : '0'

                    return (
                      <tr
                        key={`${loja.nome_loja}-${index}`}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3 text-sm text-gray-400">{index + 1}</td>
                        <td className="p-3 font-medium text-sm">{loja.nome_loja}</td>
                        <td className="p-3 text-sm">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${loja.tipo === 'Loja'
                                ? 'bg-blue-50 text-blue-700'
                                : loja.tipo === 'Quiosque'
                                  ? 'bg-pink-50 text-pink-700'
                                  : loja.tipo === 'Eventos'
                                    ? 'bg-amber-50 text-amber-700'
                                    : loja.tipo === 'Depósito'
                                      ? 'bg-gray-100 text-gray-600'
                                      : 'bg-purple-50 text-purple-700'
                              }`}
                          >
                            {loja.tipo}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-600">{loja.classificacao}</td>
                        <td className="p-3 text-right font-medium text-sm">
                          {formatNumber(loja.abl_m2, 0)} m²
                        </td>
                        <td className="p-3 text-right text-sm text-gray-500">{pctAbl}%</td>
                        <td className="p-3 text-right text-sm text-green-600">
                          {loja.ultima_venda > 0 ? formatCurrency(loja.ultima_venda) : '-'}
                        </td>
                        <td className="p-3 text-right text-sm">
                          {loja.vendas_por_m2 > 0 ? formatCurrency(loja.vendas_por_m2) : '-'}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma loja com ABL cadastrado</p>
          </div>
        )}
      </div>
    </div>
  )
}