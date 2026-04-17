// src/components/charts/EncargosBreakdownChart.tsx
'use client'

import { ReactECharts } from './ChartWrapper'
import type { EChartsOption } from 'echarts'
import { formatCurrency } from '@/lib/utils/format'

interface BreakdownData {
  aluguel: number
  condominio: number
  energia: number
  fundo_promo: number
  outros: number
}

interface EncargosBreakdownChartProps {
  dados: BreakdownData
  altura?: number
}

export function EncargosBreakdownChart({ dados, altura = 300 }: EncargosBreakdownChartProps) {
  const chartData = [
    { value: dados.aluguel, name: 'Aluguel', color: '#22c55e' },
    { value: dados.condominio, name: 'Condomínio', color: '#3b82f6' },
    { value: dados.energia, name: 'Energia', color: '#f59e0b' },
    { value: dados.fundo_promo, name: 'Fundo Promo', color: '#8b5cf6' },
    { value: dados.outros, name: 'Outros', color: '#6b7280' },
  ].filter(item => item.value > 0)

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const pct = ((params.value / total) * 100).toFixed(1)
        return `${params.marker} ${params.name}<br/>
                <strong>${formatCurrency(params.value)}</strong><br/>
                ${pct}% do total`
      }
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: {
        color: '#888'
      }
    },
    series: [
      {
        name: 'Encargos',
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            formatter: (params: any) => {
              const pct = ((params.value / total) * 100).toFixed(0)
              return `${params.name}\n${pct}%`
            }
          }
        },
        labelLine: {
          show: false
        },
        data: chartData.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color }
        }))
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