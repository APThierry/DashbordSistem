// src/app/(dashboard)/dashboards/lojas/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { lojasService, type LojasData } from '@/services/lojas.service'
import { SegmentosChart } from '@/components/charts/SegmentosChart'
import {
  formatCurrency,
  formatNumber,
  formatCompetencia,
} from '@/lib/utils/format'
import {
  Building2,
  DollarSign,
  Percent,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
} from 'lucide-react'

// ============================================
// CONSTANTES
// ============================================

const PAGE_SIZE = 50

type SortField = 'loja_nome' | 'vendas' | 'cobranca_total' | 'pct_cobranca_vendas' | 'm2' | 'vendas_por_m2'
type SortDir = 'asc' | 'desc'

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function LojasPage() {
  // State
  const [data, setData] = useState<LojasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [competencia, setCompetencia] = useState<string>('')
  const [busca, setBusca] = useState('')
  const [filtroSegmento, setFiltroSegmento] = useState<string>('')
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [sortField, setSortField] = useState<SortField>('vendas')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // ============================================
  // DATA FETCHING
  // ============================================

  const carregarDados = async (comp?: string) => {
    setLoading(true)
    try {
      const resultado = await lojasService.getData(comp)
      setData(resultado)
      if (!comp && resultado.competenciaAtual) {
        setCompetencia(resultado.competenciaAtual)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const handleCompetenciaChange = (novaComp: string) => {
    setCompetencia(novaComp)
    setPaginaAtual(1)
    carregarDados(novaComp)
  }

  // ============================================
  // FILTROS, ORDENAÇÃO E PAGINAÇÃO
  // ============================================

  const lojasFiltradas = useMemo(() => {
    if (!data?.lojas) return []

    let resultado = data.lojas.filter((loja) => {
      const matchBusca =
        busca === '' ||
        loja.loja_nome.toLowerCase().includes(busca.toLowerCase())
      const matchSegmento =
        filtroSegmento === '' || loja.segmento_abrasce === filtroSegmento
      const matchTipo =
        filtroTipo === '' || loja.tipo_loja === filtroTipo
      return matchBusca && matchSegmento && matchTipo
    })

    // Ordenação
    resultado.sort((a, b) => {
      let valA: number | string = a[sortField] ?? 0
      let valB: number | string = b[sortField] ?? 0

      if (typeof valA === 'string') {
        return sortDir === 'asc'
          ? valA.localeCompare(valB as string)
          : (valB as string).localeCompare(valA)
      }

      return sortDir === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number)
    })

    return resultado
  }, [data?.lojas, busca, filtroSegmento, filtroTipo, sortField, sortDir])

  const lojasVisiveis = useMemo(() => {
    return lojasFiltradas.slice(0, paginaAtual * PAGE_SIZE)
  }, [lojasFiltradas, paginaAtual])

  const temMais = lojasVisiveis.length < lojasFiltradas.length

  // Segmentos e tipos únicos para filtros
  const segmentosUnicos = useMemo(
    () =>
      [...new Set(data?.lojas.map((l) => l.segmento_abrasce) || [])]
        .filter((s) => s && s !== '-' && s !== 'Não classificado')
        .sort(),
    [data?.lojas]
  )

  const tiposUnicos = useMemo(
    () =>
      [...new Set(data?.lojas.map((l) => l.tipo_loja) || [])]
        .filter((t) => t && t !== '-')
        .sort(),
    [data?.lojas]
  )

  // ============================================
  // SORT HANDLER
  // ============================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
    setPaginaAtual(1)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 text-gray-400" />
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-blue-600" />
    ) : (
      <ChevronDown className="w-3 h-3 text-blue-600" />
    )
  }

  // ============================================
  // CÁLCULOS
  // ============================================

  const resumo = data?.resumo
  const totalVendas = resumo?.vendas_total || 0
  const totalCobranca = resumo?.cobranca_total || 0
  const pctCobrancaVendas = totalVendas > 0 ? (totalCobranca / totalVendas) * 100 : 0

  // ============================================
  // LOADING
  // ============================================

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lojas por Segmento</h1>
          <p className="text-gray-500">Performance das operações por segmento ABRASCE</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de Competência */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={competencia}
              onChange={(e) => handleCompetenciaChange(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg bg-white text-sm 
                         appearance-none cursor-pointer hover:border-gray-300 focus:outline-none 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
            >
              {data?.competencias.map((comp) => (
                <option key={comp} value={comp}>
                  {formatCompetencia(comp)}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          {/* Botão Atualizar */}
          <button
            onClick={() => carregarDados(competencia)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       disabled:opacity-50 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* KPIs (4 cards) */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Operações Totais (antes: "Total de Lojas") */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Operações Totais</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {resumo?.total_lojas || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {resumo?.qtd_segmentos || 0} segmentos
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* 2. Vendas Total de Lojas (antes: "Vendas Totais") */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vendas Total de Lojas</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {formatCurrency(totalVendas)}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* 3. % Cobrança / Vendas (antes: "ABL Total") */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">% Cobrança / Vendas</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {pctCobrancaVendas.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Cob: {formatCurrency(totalCobranca)}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <Percent className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        {/* 4. Vendas por M² */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vendas por m²</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {formatCurrency(resumo?.vendas_por_m2 || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ABL: {formatNumber(resumo?.abl_total || 0)} m²
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* GRÁFICOS — Barras verticais (7 segmentos + Demais) */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Segmento */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Vendas por Segmento
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Top 7 segmentos + demais — {formatCompetencia(competencia)}
          </p>
          <SegmentosChart
            dados={data?.porSegmento || []}
            tipo="vendas"
            altura={380}
          />
        </div>

        {/* Lojas por Segmento */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Operações por Segmento
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Quantidade de operações por segmento
          </p>
          <SegmentosChart
            dados={data?.porSegmento || []}
            tipo="lojas"
            altura={380}
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* TABELA DE LOJAS */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* Header da tabela */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Lista de Operações
              </h3>
              <p className="text-sm text-gray-500">
                {lojasFiltradas.length} de {data?.lojas.length || 0} operações
                {competencia && ` • ${formatCompetencia(competencia)}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar loja..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value)
                    setPaginaAtual(1)
                  }}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-52 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filtro Segmento */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filtroSegmento}
                  onChange={(e) => {
                    setFiltroSegmento(e.target.value)
                    setPaginaAtual(1)
                  }}
                  className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none 
                             bg-white cursor-pointer hover:border-gray-300 focus:outline-none 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[180px]"
                >
                  <option value="">Todos os segmentos</option>
                  {segmentosUnicos.map((seg) => (
                    <option key={seg} value={seg}>
                      {seg}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>

              {/* Filtro Tipo */}
              <select
                value={filtroTipo}
                onChange={(e) => {
                  setFiltroTipo(e.target.value)
                  setPaginaAtual(1)
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm appearance-none 
                           bg-white cursor-pointer hover:border-gray-300 focus:outline-none 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
              >
                <option value="">Todos os tipos</option>
                {tiposUnicos.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                  #
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('loja_nome')}
                >
                  <div className="flex items-center gap-1">
                    Loja
                    <SortIcon field="loja_nome" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Segmento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('m2')}
                >
                  <div className="flex items-center justify-end gap-1">
                    M²
                    <SortIcon field="m2" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('vendas')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Vendas
                    <SortIcon field="vendas" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('cobranca_total')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Cobrança
                    <SortIcon field="cobranca_total" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('vendas_por_m2')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Vnd/m²
                    <SortIcon field="vendas_por_m2" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('pct_cobranca_vendas')}
                >
                  <div className="flex items-center justify-end gap-1">
                    % Cob/Vnd
                    <SortIcon field="pct_cobranca_vendas" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lojasVisiveis.map((loja, index) => {
                const pct = loja.pct_cobranca_vendas
                const corPct =
                  pct > 15
                    ? 'text-red-600 font-semibold'
                    : pct > 10
                      ? 'text-amber-600'
                      : 'text-gray-600'

                return (
                  <tr
                    key={`${loja.loja_nome}-${index}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {loja.loja_nome}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500 line-clamp-1">
                        {loja.segmento_abrasce}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {loja.tipo_loja && loja.tipo_loja !== '-' && (
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full
                          ${loja.tipo_loja === 'Loja'
                              ? 'bg-blue-50 text-blue-700'
                              : loja.tipo_loja === 'Quiosque'
                                ? 'bg-pink-50 text-pink-700'
                                : loja.tipo_loja === 'Eventos'
                                  ? 'bg-amber-50 text-amber-700'
                                  : loja.tipo_loja === 'Depósito'
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-purple-50 text-purple-700'
                            }`}
                        >
                          {loja.tipo_loja}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                      {loja.m2 > 0 ? formatNumber(loja.m2) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-emerald-600">
                      {loja.vendas > 0 ? formatCurrency(loja.vendas) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-blue-600">
                      {loja.cobranca_total > 0
                        ? formatCurrency(loja.cobranca_total)
                        : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                      {loja.vendas_por_m2 > 0
                        ? formatCurrency(loja.vendas_por_m2)
                        : '-'}
                    </td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap text-right text-sm ${corPct}`}
                    >
                      {loja.vendas > 0 ? `${pct.toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Botão "Ver mais" */}
          {temMais && (
            <div className="px-6 py-4 border-t border-gray-100 text-center">
              <button
                onClick={() => setPaginaAtual((prev) => prev + 1)}
                className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg 
                           text-sm font-medium transition-colors border border-gray-200
                           hover:border-gray-300"
              >
                Ver mais {Math.min(PAGE_SIZE, lojasFiltradas.length - lojasVisiveis.length)} operações
                <span className="text-gray-400 ml-2">
                  ({lojasVisiveis.length} de {lojasFiltradas.length})
                </span>
              </button>
            </div>
          )}

          {/* Estado vazio */}
          {lojasFiltradas.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Nenhuma operação encontrada</p>
              <p className="text-sm mt-1">Ajuste os filtros para ver resultados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}