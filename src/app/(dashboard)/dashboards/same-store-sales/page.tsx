// src/app/(dashboard)/dashboards/same-store-sales/page.tsx
'use client'


import { useSSS } from '@/hooks/useSSS'
import { KPICard } from '@/components/kpi/KPICard'
import { SSSChart } from '@/components/charts'
import { CompetenciaSelect } from '@/components/filters/CompetenciaSelect'
import { formatCompetencia, formatCurrency, formatNumber } from '@/lib/utils/format'
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Store,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

export default function SameStoreSalesPage() {
  const { 
    data, 
    loading, 
    error, 
    refresh,
    competencia,
    setCompetencia
  } = useSSS()

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
  const sss = resumo?.sss_pct || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Same Store Sales</h1>
          <p className="text-muted-foreground">
            Comparativo de vendas das mesmas lojas vs ano anterior
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

      {/* KPI Principal - SSS */}
      {resumo && (
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between flex-wrap gap-6">
            {/* SSS Principal */}
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${
                sss >= 0 
                  ? 'bg-green-100 dark:bg-green-900/30' 
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {sss >= 0 ? (
                  <TrendingUp className={`h-8 w-8 ${sss >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Same Store Sales</p>
                <p className={`text-4xl font-bold ${
                  sss >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {sss >= 0 ? '+' : ''}{sss.toFixed(2)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCompetencia(resumo.competencia_atual)} vs {formatCompetencia(resumo.competencia_anterior)}
                </p>
              </div>
            </div>

            {/* Métricas Secundárias */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Store className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-2xl font-bold">{resumo.qtd_lojas_comparaveis}</p>
                <p className="text-xs text-muted-foreground">Lojas Comparáveis</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Vendas Atual</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(resumo.total_vendas_atual)}
                </p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Vendas Anterior</p>
                <p className="text-lg font-bold text-muted-foreground">
                  {formatCurrency(resumo.total_vendas_anterior)}
                </p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Variação</p>
                <p className={`text-lg font-bold ${resumo.variacao_absoluta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {resumo.variacao_absoluta >= 0 ? '+' : ''}{formatCurrency(resumo.variacao_absoluta)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de Evolução SSS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <h3 className="text-lg font-semibold mb-2">Evolução do SSS</h3>
          <p className="text-sm text-muted-foreground mb-4">Últimos 12 meses</p>
          {data && data.historico.length > 0 ? (
            <SSSChart dados={data.historico} altura={300} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Sem dados históricos
            </div>
          )}
        </div>

        {/* SSS por Tipo de Loja */}
        <div className="bg-card rounded-xl border p-4">
          <h3 className="text-lg font-semibold mb-2">SSS por Tipo de Loja</h3>
          <p className="text-sm text-muted-foreground mb-4">{formatCompetencia(data?.competenciaAtual || '')}</p>
          
          {data && data.porTipo.length > 0 ? (
            <div className="space-y-3">
              {data.porTipo.map((tipo) => (
                <div 
                  key={tipo.tipo_loja} 
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      tipo.tipo_loja === 'Loja' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : tipo.tipo_loja === 'Quiosque'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {tipo.tipo_loja}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {tipo.qtd_lojas} lojas
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tipo.sss_pct >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-lg font-bold ${
                      tipo.sss_pct >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tipo.sss_pct >= 0 ? '+' : ''}{tipo.sss_pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Sem dados por tipo
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Lojas */}
      <div className="bg-card rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Detalhamento por Loja</h2>
          <p className="text-sm text-muted-foreground">
            {resumo?.qtd_lojas_comparaveis || 0} lojas comparáveis - {formatCompetencia(data?.competenciaAtual || '')} vs {formatCompetencia(resumo?.competencia_anterior || '')}
          </p>
        </div>
        
        {data && data.lojas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-sm">Loja</th>
                  <th className="text-right p-3 font-medium text-sm">Vendas Atual</th>
                  <th className="text-right p-3 font-medium text-sm">Vendas Anterior</th>
                  <th className="text-right p-3 font-medium text-sm">Variação</th>
                  <th className="text-right p-3 font-medium text-sm">SSS %</th>
                </tr>
              </thead>
              <tbody>
                {data.lojas.slice(0, 20).map((loja, index) => (
                  <tr key={`${loja.loja_nome}-${index}`} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{loja.loja_nome}</td>
                    <td className="p-3 text-right text-green-600 dark:text-green-400">
                      {formatCurrency(loja.vendas_atual)}
                    </td>
                    <td className="p-3 text-right text-muted-foreground">
                      {formatCurrency(loja.vendas_anterior)}
                    </td>
                    <td className="p-3 text-right">
                      <span className={loja.variacao_absoluta >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {loja.variacao_absoluta >= 0 ? '+' : ''}{formatCurrency(loja.variacao_absoluta)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {loja.variacao_pct > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : loja.variacao_pct < 0 ? (
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        ) : (
                          <Minus className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={`font-bold ${
                          loja.variacao_pct > 0 
                            ? 'text-green-600' 
                            : loja.variacao_pct < 0 
                            ? 'text-red-600' 
                            : 'text-gray-500'
                        }`}>
                          {loja.variacao_pct >= 0 ? '+' : ''}{loja.variacao_pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {data.lojas.length > 20 && (
              <div className="p-3 text-center text-sm text-muted-foreground border-t">
                Mostrando 20 de {data.lojas.length} lojas
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <p>Nenhuma loja comparável encontrada para este período</p>
            <p className="text-sm mt-2">
              O SSS requer que a loja tenha vendas em ambos os períodos
            </p>
          </div>
        )}
      </div>
    </div>
  )
}