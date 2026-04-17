// src/components/charts/OcupacaoChart.tsx
'use client'

import { ReactECharts } from './ChartWrapper'
import type { EChartsOption } from 'echarts'
import { formatNumber } from '@/lib/utils/format'

interface OcupacaoChartProps {
  ocupado: number
  vago: number
  altura?: number
}

export function OcupacaoChart({ ocupado, vago, altura = 250 }: OcupacaoChartProps) {
  const total = ocupado + vago
  const pctOcupado = total > 0 ? (ocupado / total) * 100 : 0

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}<br/>
                <strong>${formatNumber(params.value, 0)} m²</strong><br/>
                ${params.percent.toFixed(1)}%`
      },
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: {
        color: '#888',
      },
    },
    series: [
      {
        name: 'ABL',
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'center',
          formatter: () => {
            return `{a|${pctOcupado.toFixed(1)}%}\n{b|Ocupação}`
          },
          rich: {
            a: {
              fontSize: 28,
              fontWeight: 'bold',
              color: '#22c55e',
            },
            b: {
              fontSize: 14,
              color: '#888',
              padding: [5, 0, 0, 0],
            },
          },
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          {
            value: ocupado,
            name: 'Locada',
            itemStyle: { color: '#22c55e' },
          },
          {
            value: vago,
            name: 'Vago',
            itemStyle: { color: '#e5e7eb' },
          },
        ],
      },
    ],
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