// src/app/(dashboard)/dashboards/importacao/page.tsx
'use client'

import { useState } from 'react'
import { 
  RefreshCw, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileSpreadsheet,
  Database,
  Wifi
} from 'lucide-react'

interface IngestResult {
  success: boolean
  runId: string
  fileName: string
  duration?: number
  totalRows: number
  totalInserted: number
  sheets: {
    name: string
    rowsProcessed: number
    rowsInserted: number
    errors: string[]
  }[]
  errors: string[]
}

export default function ImportacaoPage() {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')
  const [result, setResult] = useState<IngestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Testar conexão com SharePoint
  const testConnection = async () => {
    setTesting(true)
    setConnectionStatus('idle')
    setConnectionMessage('')

    try {
      const response = await fetch('/api/ingest/trigger')
      const data = await response.json()

      if (data.success) {
        setConnectionStatus('success')
        setConnectionMessage(data.message)
      } else {
        setConnectionStatus('error')
        setConnectionMessage(data.error || data.message || 'Erro desconhecido')
      }
    } catch (err: any) {
      setConnectionStatus('error')
      setConnectionMessage(err.message)
    } finally {
      setTesting(false)
    }
  }

  // Executar importação
  const runImport = async (dryRun = false) => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('/api/ingest/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'COB_TRATADA_CONSOLIDADA.xlsx',
          dryRun
        })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || 'Erro na importação')
        if (data.data) {
          setResult(data.data)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Importação de Dados</h1>
        <p className="text-muted-foreground">
          Importar dados das planilhas do SharePoint para o banco de dados
        </p>
      </div>

      {/* Cards de Ação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Testar Conexão */}
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Wifi className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Testar Conexão</h3>
              <p className="text-sm text-muted-foreground">SharePoint</p>
            </div>
          </div>
          
          <button
            onClick={testConnection}
            disabled={testing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {testing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4" />
            )}
            {testing ? 'Testando...' : 'Testar'}
          </button>

          {connectionStatus !== 'idle' && (
            <div className={`mt-3 p-2 rounded-lg text-sm ${
              connectionStatus === 'success' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {connectionStatus === 'success' ? (
                <CheckCircle className="h-4 w-4 inline mr-1" />
              ) : (
                <XCircle className="h-4 w-4 inline mr-1" />
              )}
              {connectionMessage}
            </div>
          )}
        </div>

        {/* Card Simulação */}
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold">Simulação</h3>
              <p className="text-sm text-muted-foreground">Dry Run (não salva)</p>
            </div>
          </div>
          
          <button
            onClick={() => runImport(true)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            {loading ? 'Processando...' : 'Simular'}
          </button>
        </div>

        {/* Card Importar */}
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Database className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Importar</h3>
              <p className="text-sm text-muted-foreground">Salvar no banco</p>
            </div>
          </div>
          
          <button
            onClick={() => runImport(false)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {loading ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Erro</span>
          </div>
          <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Resultado da Importação</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              result.success 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {result.success ? 'Sucesso' : 'Com Erros'}
            </span>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{result.totalRows}</p>
              <p className="text-sm text-muted-foreground">Linhas Lidas</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{result.totalInserted}</p>
              <p className="text-sm text-muted-foreground">Linhas Inseridas</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{result.sheets.length}</p>
              <p className="text-sm text-muted-foreground">Abas Processadas</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{result.duration ? `${(result.duration / 1000).toFixed(1)}s` : '-'}</p>
              <p className="text-sm text-muted-foreground">Duração</p>
            </div>
          </div>

          {/* Detalhes por Aba */}
          <div className="space-y-3">
            <h4 className="font-medium">Detalhes por Aba</h4>
            {result.sheets.map((sheet) => (
              <div 
                key={sheet.name}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{sheet.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>{sheet.rowsProcessed} lidas</span>
                  <span className="text-green-600">{sheet.rowsInserted} inseridas</span>
                  {sheet.errors.length > 0 && (
                    <span className="text-red-600">{sheet.errors.length} erros</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Erros */}
          {result.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-600 mb-2">Erros ({result.errors.length})</h4>
              <div className="max-h-40 overflow-y-auto bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                {result.errors.slice(0, 20).map((err, i) => (
                  <p key={i} className="text-sm text-red-600 dark:text-red-400">
                    • {err}
                  </p>
                ))}
                {result.errors.length > 20 && (
                  <p className="text-sm text-red-500 mt-2">
                    ... e mais {result.errors.length - 20} erros
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Run ID */}
          <p className="mt-4 text-xs text-muted-foreground">
            Run ID: {result.runId}
          </p>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Arquivo esperado: COB_TRATADA_CONSOLIDADA.xlsx</p>
            <p className="mt-1">Abas processadas: BASE_TRATADA, BASE_M2_MENSAL, M2_MENSAL</p>
            <p className="mt-1">Localização: SharePoint → Documentos → SISTEMA</p>
          </div>
        </div>
      </div>
    </div>
  )
}