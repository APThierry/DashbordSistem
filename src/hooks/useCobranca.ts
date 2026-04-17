// src/hooks/useCobranca.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { cobrancaService, type CobrancaData } from '@/services/cobranca.service'

export function useCobranca(competenciaInicial?: string) {
  const [competencia, setCompetencia] = useState<string>(competenciaInicial || '')
  const [data, setData] = useState<CobrancaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (comp?: string) => {
    try {
      setLoading(true)
      setError(null)
      const targetComp = comp || competencia
      const result = await cobrancaService.getData(targetComp || undefined)
      setData(result)

      if (result.competenciaAtual && !targetComp) {
        setCompetencia(result.competenciaAtual)
      }
    } catch (err) {
      console.error('Erro no useCobranca:', err)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [competencia])

  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const changeCompetencia = useCallback(
    (novaCompetencia: string) => {
      setCompetencia(novaCompetencia)
      fetchData(novaCompetencia)
    },
    [fetchData]
  )

  return {
    data,
    loading,
    error,
    refresh: () => fetchData(competencia),
    competencia,
    setCompetencia: changeCompetencia,
  }
}