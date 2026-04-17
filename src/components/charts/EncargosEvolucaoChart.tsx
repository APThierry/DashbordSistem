// src/components/charts/EncargosEvolucaoChart.tsx
'use client'

import { ReactECharts } from './ChartWrapper'
import type { EChartsOption } from 'echarts'
import { formatCurrencyCompact, formatCompetenciaCurta } from '@/lib/utils/format'

interface EvolucaoData {
  competencia: string
  tipo_encargo: string
  valor: number
}

interface EncargosEvolucaoChartProps {
  dados: EvolucaoData[]
  altura?: number
}

const CORES: Record<string, string> = {
  'Aluguel': '#22c55e',
  'Condomínio': '#3b82f6',
  'Energia': '#f59e0b',
  'Fundo Promocional': '#8b5cf6',
  'Água': '#06b6d4',
  'IPTU': '#ec4899',
  'Taxa Adm': '#84cc16',
  'FRT': '#f97316',
  'Outros': '#6b7280',
}

export function EncargosEvolucaoChart({ dados, altura = 350 }: EncargosEvolucaoChartProps) {
  // Filtrar dados válidos e agrupar por competência e tipo
  const dadosValidos = dados.filter(d => d.competencia != null && d.competencia !== '')
  
  const competencias = [...new Set(dadosValidos.map(d => d.competencia))]
    .filter(c => c != null && c !== '')
    .sort((a, b) => {
      const [mesA, anoA] = (a || '01/2000').split('/')
      const [mesB, anoB] = (b || '01/2000').split('/')
      return new Date(parseInt(anoA), parseInt(mesA) - 1).getTime() - 
             new Date(parseInt(anoB), parseInt(mesB) - 1).getTime()
    })
    .slice(-12)

  const tipos = [...new Set(dadosValidos.map(d => d.tipo_encargo))]
    .filter(t => t != null && t !== '')

  // Se não houver dados válidos, mostrar mensagem
  if (competencias.length === 0 || tipos.length === 0) {
    return (
      <div style={{ height: altura }} className="flex items-center justify-center text-gray-500">
        Sem dados de evolução disponíveis
      </div>
    )
  }

  const series = tipos.map(tipo => {
    const dadosTipo = competencias.map(comp => {
      const item = dadosValidos.find(d => d.competencia === comp && d.tipo_encargo === tipo)
      return item?.valor || 0
    })

    return {
      name: tipo,
      type: 'bar' as const,
      stack: 'total',
      emphasis: {
        focus: 'series' as const
      },
      data: dadosTipo,
      itemStyle: {
        color: CORES[tipo] || '#999'
      }
    }
  })

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        let total = 0
        let html = `<strong>${params[0]?.axisValue || ''}</strong><br/>`
        params.forEach((p: any) => {
          total += p.value || 0
          html += `${p.marker} ${p.seriesName}: <strong>${formatCurrencyCompact(p.value || 0)}</strong><br/>`
        })
        html += `<br/><strong>Total: ${formatCurrencyCompact(total)}</strong>`
        return html
      }
    },
    legend: {
      data: tipos,
      bottom: 0,
      textStyle: {
        color: '#888',
        fontSize: 11
      },
      type: 'scroll'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '18%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: competencias.map(c => formatCompetenciaCurta(c)),
      axisLabel: {
        color: '#888',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => formatCurrencyCompact(value),
        color: '#888'
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    series
  }

  return (
    <div style={{ height: altura }}>
      <ReactECharts 
        option={option} 
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  )
}