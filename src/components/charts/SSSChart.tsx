// src/components/charts/SSSChart.tsx
'use client'

import { ReactECharts } from './ChartWrapper'
import type { EChartsOption } from 'echarts'
import { formatCompetenciaCurta } from '@/lib/utils/format'

interface SSSResumo {
  competencia_atual: string
  sss_pct: number
  qtd_lojas_comparaveis: number
}

interface SSSChartProps {
  dados: SSSResumo[]
  altura?: number
}

export function SSSChart({ dados, altura = 300 }: SSSChartProps) {
  // Ordenar por competência (mais antigo primeiro)
  const dadosOrdenados = [...dados].sort((a, b) => {
    const [mesA, anoA] = a.competencia_atual.split('/')
    const [mesB, anoB] = b.competencia_atual.split('/')
    const dateA = new Date(parseInt(anoA), parseInt(mesA) - 1)
    const dateB = new Date(parseInt(anoB), parseInt(mesB) - 1)
    return dateA.getTime() - dateB.getTime()
  }).slice(-12)

  const categorias = dadosOrdenados.map(d => formatCompetenciaCurta(d.competencia_atual))
  const valores = dadosOrdenados.map(d => d.sss_pct)

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const idx = params[0].dataIndex
        const item = dadosOrdenados[idx]
        const cor = item.sss_pct >= 0 ? '#22c55e' : '#ef4444'
        const sinal = item.sss_pct >= 0 ? '+' : ''
        return `
          <strong>${item.competencia_atual}</strong><br/>
          SSS: <span style="color:${cor};font-weight:bold">${sinal}${item.sss_pct.toFixed(2)}%</span><br/>
          Lojas comparáveis: ${item.qtd_lojas_comparaveis}
        `
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categorias,
      axisLabel: {
        color: '#888'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%',
        color: '#888'
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    series: [
      {
        name: 'SSS',
        type: 'bar',
        data: valores.map(v => ({
          value: v,
          itemStyle: {
            color: v >= 0 ? '#22c55e' : '#ef4444',
            borderRadius: v >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4]
          }
        })),
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => {
            const val = params.value
            const sinal = val >= 0 ? '+' : ''
            return `${sinal}${val.toFixed(1)}%`
          },
          color: '#666',
          fontSize: 11
        },
        markLine: {
          silent: true,
          data: [
            {
              yAxis: 0,
              lineStyle: {
                color: '#999',
                type: 'dashed'
              }
            }
          ]
        }
      }
    ]
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