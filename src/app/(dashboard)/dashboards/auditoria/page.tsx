// src/app/(dashboard)/dashboards/auditoria/page.tsx
'use client'

import { useState, useEffect, Fragment } from 'react'
import {
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  FileSpreadsheet,
  Database,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils/format'

interface AuditRun {
  id: string
  file_name: string
  started_at: string
  finished_at: string | null
  duration_ms: number | null
  status: string
  total_rows: number
  inserted_rows: number
  errors: string[] | null
  sheets_processed: string[] | null
}

export default function AuditoriaPage() {
  const [runs, setRuns] = useState<AuditRun[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [triggering, setTriggering] = useState(false)
  const [expandedRun, setExpandedRun] = useState<string | null>(null)

  const fetchRuns = async () => {
    try {
      const response = await fetch('/api/audit/runs')
      const data = await response.json()
      setRuns(data.runs || [])
    } catch (error) {
      console.error('Erro ao buscar execuções:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRuns()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchRuns()
  }

  const handleTriggerIngestion = async () => {
    if (!confirm('Deseja iniciar uma nova ingestão de dados?')) return

    setTriggering(true)
    try {
      const response = await fetch('/api/ingest/run-all', { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        alert('Ingestão concluída com sucesso!')
        fetchRuns()
      } else {
        alert(`Erro: ${data.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      alert('Erro ao iniciar ingestão')
    } finally {
      setTriggering(false)
    }
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    const seconds = ms / 1000
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins}m ${secs}s`
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sucesso
          </span>
        )
      case 'error':
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Erro
          </span>
        )
      case 'running':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Executando
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status || '-'}
          </span>
        )
    }
  }

  // Estatísticas
  const totalRuns = runs.length
  const successRuns = runs.filter(r => r.status === 'success').length
  const totalRows = runs.reduce((acc, r) => acc + (r.inserted_rows || 0), 0)
  const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auditoria</h1>
          <p className="text-gray-500">Histórico de importações e processamento de dados</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm 
                       hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2
                       transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={handleTriggerIngestion}
            disabled={triggering}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       disabled:opacity-50 flex items-center gap-2 text-sm font-medium
                       transition-colors"
          >
            <Play className={`w-4 h-4 ${triggering ? 'animate-pulse' : ''}`} />
            {triggering ? 'Importando...' : 'Importar Agora'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total de Execuções</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalRuns}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Última Execução</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {runs[0] ? formatDateTime(runs[0].started_at) : 'Nenhuma'}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Linhas Importadas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalRows.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Database className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Taxa de Sucesso</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{successRate}%</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Execuções */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Histórico de Execuções</h3>
          <p className="text-sm text-gray-500">Últimas 50 importações realizadas</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arquivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Linhas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duração
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalhes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                    <p className="text-gray-500">Carregando...</p>
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-2">Nenhuma execução registrada</p>
                    <p className="text-sm text-gray-400">
                      Clique em "Importar Agora" para iniciar a primeira importação
                    </p>
                  </td>
                </tr>
              ) : (
                runs.map(run => (
                  <Fragment key={run.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDateTime(run.started_at)}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {run.id.slice(0, 8)}...
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {run.file_name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(run.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {(run.inserted_rows || 0).toLocaleString('pt-BR')}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          / {(run.total_rows || 0).toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                        {formatDuration(run.duration_ms)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          {expandedRun === run.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Detalhes expandidos */}
                    {expandedRun === run.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Abas processadas */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Abas Processadas
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {(run.sheets_processed || []).length > 0 ? (
                                  (run.sheets_processed || []).map((sheet, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                                    >
                                      {sheet}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-sm text-gray-500">Nenhuma informação</span>
                                )}
                              </div>
                            </div>

                            {/* Erros */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Erros ({(run.errors || []).length})
                              </h4>
                              {(run.errors || []).length > 0 ? (
                                <ul className="space-y-1">
                                  {(run.errors || []).slice(0, 5).map((error, i) => (
                                    <li
                                      key={i}
                                      className="text-xs text-red-600 flex items-start gap-1"
                                    >
                                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                      {error}
                                    </li>
                                  ))}
                                  {(run.errors || []).length > 5 && (
                                    <li className="text-xs text-gray-500">
                                      +{(run.errors || []).length - 5} erros adicionais
                                    </li>
                                  )}
                                </ul>
                              ) : (
                                <span className="text-sm text-green-600 flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  Nenhum erro
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}