// src/hooks/useDashboard.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { dashboardService, type DashboardData } from '@/services/dashboard.service'

export function useDashboard(competenciaInicial?: string) {
  const [competencia, setCompetencia] = useState<string>(competenciaInicial || '')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (comp?: string) => {
    try {
      setLoading(true)
      setError(null)
      const targetComp = comp || competencia
      const result = await dashboardService.getDashboardData(targetComp || undefined)
      setData(result)
      
      // Atualiza competência se veio do servidor
      if (result.competenciaAtual && !targetComp) {
        setCompetencia(result.competenciaAtual)
      }
    } catch (err) {
      console.error('Erro no useDashboard:', err)
      setError('Erro ao carregar dados')
      setData(dashboardService.getMockData())
    } finally {
      setLoading(false)
    }
  }, [competencia])

  // Carregar dados iniciais
  useEffect(() => {
    fetchData()
  }, [])

  // Função para mudar competência
  const changeCompetencia = useCallback((novaCompetencia: string) => {
    setCompetencia(novaCompetencia)
    fetchData(novaCompetencia)
  }, [fetchData])

  return { 
    data, 
    loading, 
    error, 
    refresh: () => fetchData(competencia),
    isUsingMock: data?.usandoMock ?? true,
    competencia,
    setCompetencia: changeCompetencia
  }
}