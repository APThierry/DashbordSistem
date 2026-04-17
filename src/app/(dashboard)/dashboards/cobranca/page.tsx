// src/app/(dashboard)/dashboards/cobranca/page.tsx
'use client'

import { useState, useMemo } from 'react'
import { useCobranca } from '@/hooks/useCobranca'
import { EncargosEvolucaoChart, EncargosBreakdownChart } from '@/components/charts'
import { CompetenciaSelect } from '@/components/filters/CompetenciaSelect'
import {
  formatCompetencia,
  formatCurrency,
  formatNumber,
} from '@/lib/utils/format'
import {
  RefreshCw,
  Receipt,
  Building,
  Zap,
  Droplets,
  Megaphone,
  DollarSign,
  Percent,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'

// ============================================
// CONSTANTES
// ============================================
const PAGE_SIZE = 20

type SortField = 'cobranca_total' | 'total_aluguel' | 'condominio' | 'fundo_promo' | 'especificos' | 'pct_cobranca_vendas'
type SortDir = 'asc' | 'desc'

function calcVariacao(atual: number, anterior: number): number | null {
  if (!anterior || anterior === 0) return null
  return ((atual - anterior) / anterior) * 100
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function CobrancaPage() {
  const { data, loading, error, refresh, competencia, setCompetencia } = useCobranca()

  // Filtros da tabela
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [sortField, setSortField] = useState<SortField>('cobranca_total')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Filtrar e ordenar lojas
  const lojasFiltradas = useMemo(() => {
    if (!data?.porLoja) return []

    let resultado = data.porLoja.filter((l) => {
      const matchBusca = busca === '' || l.loja_nome.toLowerCase().includes(busca.toLowerCase())
      const matchTipo = filtroTipo === '' || l.tipo_loja === filtroTipo
      return matchBusca && matchTipo
    })

    resultado.sort((a, b) => {
      const valA = Number(a[sortField]) || 0
      const valB = Number(b[sortField]) || 0
      return sortDir === 'asc' ? valA - valB : valB - valA
    })

    return resultado
  }, [data?.porLoja, busca, filtroTipo, sortField, sortDir])

  const lojasVisiveis = useMemo(
    () => lojasFiltradas.slice(0, paginaAtual * PAGE_SIZE),
    [lojasFiltradas, paginaAtual]
  )
  const temMais = lojasVisiveis.length < lojasFiltradas.length

  const tiposUnicos = useMemo(
    () => [...new Set(data?.porLoja.map((l) => l.tipo_loja) || [])].filter((t) => t && t !== '-').sort(),
    [data?.porLoja]
  )

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

  // Variações
  const varCobranca = anterior ? calcVariacao(resumo?.total_cobranca || 0, anterior.total_cobranca) : null
  const varPct = anterior ? calcVariacao(resumo?.pct_cobranca_vendas || 0, anterior.pct_cobranca_vendas) : null

  // Breakdown para gráfico rosca
  const breakdownData = resumo
    ? {
        aluguel: resumo.total_aluguel,
        condominio: resumo.total_condominio,
        energia: resumo.total_energia,
        fundo_promo: resumo.total_fundo_promo,
        outros:
          resumo.total_agua +
          resumo.total_iptu +
          resumo.total_taxa_adm +
          resumo.total_frt +
          resumo.total_outras,
      }
    : { aluguel: 0, condominio: 0, energia: 0, fundo_promo: 0, outros: 0 }

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cobrança</h1>
          <p className="text-muted-foreground">Análise detalhada de encargos e cobranças</p>
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
      {/* KPIs */}
      {/* ============================================ */}
      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cobrança Total */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cobrança Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(resumo.total_cobranca)}
                </p>
                {varCobranca != null && (
                  <div className="flex items-center gap-1 mt-1.5">
                    {varCobranca > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 text-red-600" />
                    ) : varCobranca < 0 ? (
                      <TrendingDown className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        varCobranca > 0 ? 'text-red-600' : varCobranca < 0 ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {varCobranca > 0 ? '+' : ''}{varCobranca.toFixed(1)}% vs mês anterior
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* % sobre Vendas */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">% Cobrança / Vendas</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {resumo.pct_cobranca_vendas.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400 mt-1.5">
                  Vendas: {formatCurrency(resumo.total_vendas)}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Percent className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Total Aluguel */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Aluguel</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {formatCurrency(resumo.total_aluguel)}
                </p>
                <p className="text-xs text-gray-400 mt-1.5">
                  {resumo.pct_aluguel.toFixed(1)}% da cobrança
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Lojas Cobradas */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Operações Cobradas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{resumo.qtd_lojas}</p>
                <p className="text-xs text-gray-400 mt-1.5">
                  {formatCompetencia(resumo.competencia)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* GRÁFICOS */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-2">Evolução dos Encargos</h3>
          <p className="text-sm text-muted-foreground mb-4">Últimos 12 meses (empilhado)</p>
          {data && data.evolucao.length > 0 ? (
            <EncargosEvolucaoChart dados={data.evolucao} altura={320} />
          ) : (
            <div className="h-[320px] flex items-center justify-center text-muted-foreground">
              Sem dados de evolução
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-2">Composição da Cobrança</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {formatCompetencia(data?.competenciaAtual || '')}
          </p>
          {resumo ? (
            <EncargosBreakdownChart dados={breakdownData} altura={320} />
          ) : (
            <div className="h-[320px] flex items-center justify-center text-muted-foreground">
              Sem dados
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* DETALHAMENTO POR TIPO DE ENCARGO (6 blocos) */}
      {/* ============================================ */}
      {resumo && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Detalhamento por Tipo de Encargo</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Aluguel % */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Receipt className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm font-medium">Aluguel %</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(resumo.total_alug_pct)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {resumo.total_cobranca > 0
                  ? ((resumo.total_alug_pct / resumo.total_cobranca) * 100).toFixed(1)
                  : '0'}
                % do total
              </p>
            </div>

            {/* Aluguel Mín */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Receipt className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm font-medium">Aluguel Mín</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(resumo.total_alug_min)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {resumo.total_cobranca > 0
                  ? ((resumo.total_alug_min / resumo.total_cobranca) * 100).toFixed(1)
                  : '0'}
                % do total
              </p>
            </div>

            {/* Condomínio */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Condomínio</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(resumo.total_condominio)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {resumo.pct_condominio.toFixed(1)}% do total
              </p>
            </div>

            {/* FPP (antes era Energia) */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Megaphone className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium">FPP</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(resumo.total_fundo_promo)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {resumo.pct_fpp.toFixed(1)}% do total
              </p>
            </div>

            {/* Energia */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Zap className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="text-sm font-medium">Energia</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(resumo.total_energia)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {resumo.pct_energia.toFixed(1)}% do total
              </p>
            </div>

            {/* Específicos */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Receipt className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium">Específicos</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(resumo.total_especificos)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {resumo.pct_especificos.toFixed(1)}% do total
                <br />
                <span className="text-[10px]">IPTU + Tx Adm + FRT + Outras</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* TABELA — TOP LOJAS POR COBRANÇA */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Top Lojas por Cobrança</h3>
              <p className="text-sm text-gray-500">
                {lojasFiltradas.length} operações • {formatCompetencia(data?.competenciaAtual || '')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filtroTipo}
                  onChange={(e) => {
                    setFiltroTipo(e.target.value)
                    setPaginaAtual(1)
                  }}
                  className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none bg-white cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loja</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('cobranca_total')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Cobrança <SortIcon field="cobranca_total" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('total_aluguel')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Aluguel <SortIcon field="total_aluguel" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('condominio')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Condomínio <SortIcon field="condominio" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('fundo_promo')}
                >
                  <div className="flex items-center justify-end gap-1">
                    FPP <SortIcon field="fundo_promo" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('especificos')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Específicos <SortIcon field="especificos" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('pct_cobranca_vendas')}
                >
                  <div className="flex items-center justify-end gap-1">
                    % Cob/Vnd <SortIcon field="pct_cobranca_vendas" />
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
                    : pct > 8
                    ? 'text-amber-600'
                    : pct > 0
                    ? 'text-green-600'
                    : 'text-gray-400'

                return (
                  <tr
                    key={`${loja.loja_nome}-${index}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">{loja.loja_nome}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          loja.tipo_loja === 'Loja'
                            ? 'bg-blue-50 text-blue-700'
                            : loja.tipo_loja === 'Quiosque'
                            ? 'bg-pink-50 text-pink-700'
                            : loja.tipo_loja === 'Eventos'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {loja.tipo_loja}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(loja.cobranca_total)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-emerald-600">
                      {formatCurrency(loja.total_aluguel)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-blue-600">
                      {formatCurrency(loja.condominio)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-purple-600">
                      {loja.fundo_promo > 0 ? formatCurrency(loja.fundo_promo) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {loja.especificos > 0 ? formatCurrency(loja.especificos) : '-'}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm ${corPct}`}>
                      {loja.vendas > 0 ? `${pct.toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {temMais && (
            <div className="px-6 py-4 border-t border-gray-100 text-center">
              <button
                onClick={() => setPaginaAtual((prev) => prev + 1)}
                className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-200 hover:border-gray-300"
              >
                Ver mais {Math.min(PAGE_SIZE, lojasFiltradas.length - lojasVisiveis.length)} operações
                <span className="text-gray-400 ml-2">
                  ({lojasVisiveis.length} de {lojasFiltradas.length})
                </span>
              </button>
            </div>
          )}

          {lojasFiltradas.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Nenhuma operação encontrada</p>
              <p className="text-sm mt-1">Ajuste os filtros para ver resultados.</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* RESUMO POR TIPO DE LOJA */}
      {/* ============================================ */}
      {data && data.porTipo.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Resumo por Tipo de Operação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.porTipo.map((tipo) => (
              <div
                key={tipo.tipo_loja}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      tipo.tipo_loja === 'Loja'
                        ? 'bg-blue-100 text-blue-700'
                        : tipo.tipo_loja === 'Quiosque'
                        ? 'bg-pink-100 text-pink-700'
                        : tipo.tipo_loja === 'Eventos'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tipo.tipo_loja}
                  </span>
                  <span className="text-sm text-muted-foreground">{tipo.qtd_lojas} operações</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cobrança:</span>
                    <span className="font-medium">{formatCurrency(tipo.total_cobranca)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Aluguel:</span>
                    <span className="font-medium text-emerald-600">
                      {formatCurrency(tipo.total_aluguel)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">% Cob/Vendas:</span>
                    <span
                      className={`font-medium ${
                        tipo.pct_cobranca_vendas > 15
                          ? 'text-red-600'
                          : tipo.pct_cobranca_vendas > 8
                          ? 'text-amber-600'
                          : 'text-green-600'
                      }`}
                    >
                      {tipo.pct_cobranca_vendas.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}