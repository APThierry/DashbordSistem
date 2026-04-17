// src/app/(dashboard)/dashboards/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  Building2,
  RefreshCw,
  Hash,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { formatCurrency, formatNumber, formatCompetencia } from '@/lib/utils/format'
import { VendasMensalChart } from '@/components/charts/VendasMensalChart'
import { ComposicaoCobrancaChart } from '@/components/charts/ComposicaoCobrancaChart'

interface DashboardData {
  kpis: {
    vendas: number
    cobranca: number
    areaLocada: number
    operacoesTotais: number
  }
  detalheCobranca: {
    aluguel: number
    alug_pct: number
    alug_min: number
    condominio: number
    energia: number
    agua: number
    ar: number
    iptu: number
    fundo_promo: number
    cd: number
    taxa_adm: number
    frt: number
    outras: number
    especificos: number
  }
  evolucaoMensal: Array<{
    competencia: string
    total_vendas: number
    total_cobranca: number
  }>
  topLojas: Array<{
    loja_nome: string
    tipo_loja: string
    m2: number
    vendas: number
    cobranca: number
    percentual: number
  }>
}

type SortField = 'vendas' | 'cobranca'
type SortDirection = 'asc' | 'desc'

export default function DashboardPage() {
  const [competencia, setCompetencia] = useState<string>('')
  const [competencias, setCompetencias] = useState<string[]>([])
  const [tiposLoja, setTiposLoja] = useState<string[]>([])
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('vendas')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const fetchCompetencias = async () => {
      try {
        const res = await fetch('/api/dashboard/competencias')
        const json = await res.json()

        const comps = json.competencias || []
        const tipos = json.tiposLoja || []

        setCompetencias(comps)
        setTiposLoja(tipos)

        if (comps.length > 0) {
          setCompetencia(comps[0])
        }
      } catch (err) {
        console.error('Erro ao buscar competências:', err)
        setError('Erro ao carregar competências')
      }
    }

    fetchCompetencias()
  }, [])

  useEffect(() => {
    if (!competencia) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `/api/dashboard?competencia=${encodeURIComponent(competencia)}&filtroTipo=${filtroTipo}&sortField=${sortField}&sortDirection=${sortDirection}`
        )

        if (!res.ok) throw new Error(`Erro ${res.status}`)

        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Erro ao buscar dados:', err)
        setError('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [competencia, filtroTipo, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleRefresh = () => {
    if (!competencia) return
    window.location.reload()
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    return sortDirection === 'desc'
      ? <ArrowDown className="h-4 w-4 ml-1" />
      : <ArrowUp className="h-4 w-4 ml-1" />
  }

  if (error && competencias.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do Monte Carmo Shopping</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Dados reais
          </Badge>
          <Select value={competencia} onValueChange={setCompetencia}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Competência" />
            </SelectTrigger>
            <SelectContent>
              {competencias.map(c => (
                <SelectItem key={c} value={c}>
                  {formatCompetencia(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Vendas do Mês</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">
                  {formatCurrency(data?.kpis.vendas || 0)}
                </p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Cobrança Total</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">
                  {formatCurrency(data?.kpis.cobranca || 0)}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">ABL (Área Locada)</p>
                <p className="text-2xl font-bold mt-1 text-purple-600">
                  {formatNumber(data?.kpis.areaLocada || 0, 2)} m²
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Operações Totais</p>
                <p className="text-2xl font-bold mt-1 text-orange-600">
                  {data?.kpis.operacoesTotais || 0}
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Hash className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
            <p className="text-sm text-muted-foreground">Vendas x Cobrança - Últimos 12 meses</p>
          </CardHeader>
          <CardContent>
            <VendasMensalChart dados={data?.evolucaoMensal || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Composição da Cobrança</CardTitle>
            <p className="text-sm text-muted-foreground">{competencia ? formatCompetencia(competencia) : '-'}</p>
          </CardHeader>
          <CardContent>
            <ComposicaoCobrancaChart dados={data?.detalheCobranca || {}} />
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento da Cobrança - 5 blocos APENAS */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento da Cobrança</CardTitle>
          <p className="text-sm text-muted-foreground">
            Composição por tipo de encargo - {competencia ? formatCompetencia(competencia) : '-'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Aluguel */}
            <div className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-5 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-emerald-700">Aluguel</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-700">
                {formatCurrency(data?.detalheCobranca.aluguel || 0)}
              </p>
              <p className="text-xs text-emerald-600 mt-2 opacity-75">% + Mínimo</p>
            </div>

            {/* Condomínio */}
            <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-blue-700">Condomínio</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(data?.detalheCobranca.condominio || 0)}
              </p>
            </div>

            {/* Energia */}
            <div className="relative bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-5 border border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-yellow-700">Energia</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-md">
                  <span className="text-white text-lg">⚡</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-yellow-700">
                {formatCurrency(data?.detalheCobranca.energia || 0)}
              </p>
            </div>

            {/* Água */}
            <div className="relative bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-5 border border-cyan-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-cyan-700">Água</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-md">
                  <span className="text-white text-lg">💧</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-cyan-700">
                {formatCurrency(data?.detalheCobranca.agua || 0)}
              </p>
            </div>

            {/* Específicos */}
            <div className="relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-purple-700">Específicos</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-md">
                  <span className="text-white text-lg font-bold">Σ</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-700">
                {formatCurrency(data?.detalheCobranca.especificos || 0)}
              </p>
              <p className="text-xs text-purple-600 mt-2 opacity-75">
                IPTU, FPP, Taxas e Outros
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 10 Lojas */}
      <Card>
        <CardHeader className="pb-4">
          <div>
            <CardTitle>Top 10 Lojas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Competência: {competencia ? formatCompetencia(competencia) : '-'}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground w-10">#</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Loja</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground w-32">
                    <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                      <SelectTrigger className="h-7 text-xs border-dashed bg-transparent focus:ring-0">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os Tipos</SelectItem>
                        {tiposLoja.map(tipo => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </th>
                  <th className="text-right py-3 px-3 text-sm font-medium text-muted-foreground w-20">M²</th>
                  <th
                    className="text-right py-3 px-3 text-sm font-medium cursor-pointer hover:bg-muted transition-colors w-32"
                    onClick={() => handleSort('vendas')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span className={sortField === 'vendas' ? 'text-emerald-600 font-bold' : 'text-muted-foreground'}>
                        Vendas
                      </span>
                      {sortField === 'vendas' ? (
                        sortDirection === 'desc' ?
                          <ArrowDown className="h-4 w-4 text-emerald-600" /> :
                          <ArrowUp className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-right py-3 px-3 text-sm font-medium cursor-pointer hover:bg-muted transition-colors w-32"
                    onClick={() => handleSort('cobranca')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span className={sortField === 'cobranca' ? 'text-blue-600 font-bold' : 'text-muted-foreground'}>
                        Cobrança
                      </span>
                      {sortField === 'cobranca' ? (
                        sortDirection === 'desc' ?
                          <ArrowDown className="h-4 w-4 text-blue-600" /> :
                          <ArrowUp className="h-4 w-4 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
                      )}
                    </div>
                  </th>
                  <th className="text-right py-3 px-3 text-sm font-medium text-muted-foreground w-24">% Cob/Vnd</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topLojas || []).map((loja, index) => (
                  <tr
                    key={`${loja.loja_nome}-${index}`}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <span className={`
                        inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                        ${index === 0 ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${index === 1 ? 'bg-gray-100 text-gray-600' : ''}
                        ${index === 2 ? 'bg-orange-100 text-orange-700' : ''}
                        ${index > 2 ? 'text-muted-foreground' : ''}
                      `}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium">{loja.loja_nome}</span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="outline" className="text-xs font-normal">
                        {loja.tipo_loja}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-muted-foreground">
                      {formatNumber(loja.m2, 0)}
                    </td>
                    <td className={`py-3 px-3 text-right font-semibold ${sortField === 'vendas' ? 'text-emerald-600' : ''
                      }`}>
                      {formatCurrency(loja.vendas)}
                    </td>
                    <td className={`py-3 px-3 text-right ${sortField === 'cobranca' ? 'text-blue-600 font-semibold' : 'text-muted-foreground'
                      }`}>
                      {formatCurrency(loja.cobranca)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`font-semibold ${loja.percentual > 15 ? 'text-red-600' :
                        loja.percentual > 10 ? 'text-orange-500' :
                          loja.percentual > 5 ? 'text-yellow-600' : 'text-emerald-600'
                        }`}>
                        {loja.percentual.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!data?.topLojas || data.topLojas.length === 0) && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma loja encontrada
              </div>
            )}

            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                Carregando...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
