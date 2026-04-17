// src/components/charts/VendasMensalChart.tsx
'use client'

import { ReactECharts } from './ChartWrapper'
import type { EChartsOption } from 'echarts'
import { formatCurrencyCompact, formatCompetenciaCurta } from '@/lib/utils/format'

interface DadoMensal {
  competencia: string
  total_vendas: number
  total_cobranca: number
}

interface VendasMensalChartProps {
  dados: DadoMensal[]
  altura?: number
}

export function VendasMensalChart({ dados, altura = 350 }: VendasMensalChartProps) {
  // Ordenar por competência (mais antigo primeiro)
  const dadosOrdenados = [...dados]
    .filter(d => d.competencia != null && d.competencia !== '')  // Filtra nulls
    .sort((a, b) => {
      const [mesA, anoA] = (a.competencia || '01/2000').split('/')
      const [mesB, anoB] = (b.competencia || '01/2000').split('/')
      const dateA = new Date(parseInt(anoA), parseInt(mesA) - 1)
      const dateB = new Date(parseInt(anoB), parseInt(mesB) - 1)
      return dateA.getTime() - dateB.getTime()
    }).slice(-12) // Últimos 12 meses

  const categorias = dadosOrdenados.map(d => formatCompetenciaCurta(d.competencia))
  const vendas = dadosOrdenados.map(d => d.total_vendas)
  const cobranca = dadosOrdenados.map(d => d.total_cobranca)

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      formatter: (params: any) => {
        const idx = params[0].dataIndex
        const comp = dadosOrdenados[idx].competencia
        let html = `<strong>${comp}</strong><br/>`
        params.forEach((p: any) => {
          const valor = formatCurrencyCompact(p.value)
          html += `${p.marker} ${p.seriesName}: <strong>${valor}</strong><br/>`
        })
        return html
      }
    },
    legend: {
      data: ['Vendas', 'Cobrança'],
      bottom: 0,
      textStyle: {
        color: '#888'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categorias,
      axisPointer: {
        type: 'shadow'
      },
      axisLabel: {
        color: '#888'
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Vendas',
        position: 'left',
        axisLabel: {
          formatter: (value: number) => formatCurrencyCompact(value),
          color: '#888'
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#22c55e'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0'
          }
        }
      },
      {
        type: 'value',
        name: 'Cobrança',
        position: 'right',
        axisLabel: {
          formatter: (value: number) => formatCurrencyCompact(value),
          color: '#888'
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#3b82f6'
          }
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: 'Vendas',
        type: 'bar',
        data: vendas,
        itemStyle: {
          color: '#22c55e',
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '40%'
      },
      {
        name: 'Cobrança',
        type: 'line',
        yAxisIndex: 1,
        data: cobranca,
        smooth: true,
        lineStyle: {
          color: '#3b82f6',
          width: 3
        },
        itemStyle: {
          color: '#3b82f6'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ]
          }
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