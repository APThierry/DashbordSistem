// src/components/charts/ComposicaoCobrancaChart.tsx
'use client'

import { ReactECharts } from './ChartWrapper'
import type { EChartsOption } from 'echarts'
import { formatCurrency } from '@/lib/utils/format'

interface ComposicaoData {
  aluguel?: number
  condominio?: number
  energia?: number
  agua?: number
  especificos?: number
  [key: string]: any
}

interface ComposicaoCobrancaChartProps {
  dados: ComposicaoData
  altura?: number
}

export function ComposicaoCobrancaChart({ dados, altura = 350 }: ComposicaoCobrancaChartProps) {
  const chartData = [
    { value: dados.aluguel || 0, name: 'Aluguel', color: '#22c55e' },
    { value: dados.condominio || 0, name: 'Condomínio', color: '#3b82f6' },
    { value: dados.energia || 0, name: 'Energia', color: '#f59e0b' },
    { value: dados.agua || 0, name: 'Água', color: '#06b6d4' },
    { value: dados.especificos || 0, name: 'Específicos', color: '#8b5cf6' },
  ].filter(item => item.value > 0)

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#333', fontSize: 13 },
      formatter: function (params: any) {
        var pct = total > 0 ? ((params.value / total) * 100).toFixed(1) : '0'
        var extra = ''
        if (params.name === 'Específicos') {
          extra = '<br/><span style="font-size:11px;color:#888">(IPTU, FPP, Taxas e Outros)</span>'
        } else if (params.name === 'Aluguel') {
          extra = '<br/><span style="font-size:11px;color:#888">(% + Mínimo)</span>'
        }
        return '<strong>' + params.name + '</strong><br/>' +
               '<span style="font-size:16px;font-weight:bold">' + formatCurrency(params.value) + '</span><br/>' +
               '<span style="color:#888">' + pct + '% do total</span>' + extra
      },
    },
    legend: {
      orient: 'vertical',
      right: '2%',
      top: 'middle',
      textStyle: {
        color: '#666',
        fontSize: 12,
      },
      formatter: function (name: string) {
        var item = null
        for (var i = 0; i < chartData.length; i++) {
          if (chartData[i].name === name) { item = chartData[i]; break }
        }
        if (item && total > 0) {
          var pct = ((item.value / total) * 100).toFixed(0)
          return name + ' (' + pct + '%)'
        }
        return name
      },
    },
    series: [
      {
        name: 'Cobrança',
        type: 'pie',
        radius: ['42%', '72%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        // Labels estáticos desligados
        label: {
          show: false,
        },
        labelLine: {
          show: false,
        },
        // No hover: só destaca o slice (sem label que sai da tela)
        emphasis: {
          scale: true,
          scaleSize: 8,
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
          label: {
            show: false,
          },
        },
        data: chartData.map(function (item) {
          return {
            value: item.value,
            name: item.name,
            itemStyle: { color: item.color },
          }
        }),
      },
    ],
  }

  if (total === 0) {
    return (
      <div
        style={{ height: altura }}
        className="flex items-center justify-center text-muted-foreground"
      >
        Sem dados para exibir
      </div>
    )
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