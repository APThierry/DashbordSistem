// src/components/charts/ABLClassificacaoChart.tsx
'use client'

import { ReactECharts } from './ChartWrapper'
import type { EChartsOption } from 'echarts'
import { formatNumber } from '@/lib/utils/format'

interface TipoData {
  tipo_loja: string
  qtd_lojas: number
  total_m2: number
  total_vendas: number
  vendas_por_m2: number
}

interface ABLClassificacaoChartProps {
  dados: TipoData[]
  altura?: number
  ablTotal?: number
}

const CORES: Record<string, string> = {
  'Loja': '#3b82f6',
  'Quiosque': '#ec4899',
  'Eventos': '#f59e0b',
  'Depósito': '#6b7280',
  'Locação Especial': '#8b5cf6',
}

export function ABLClassificacaoChart({ dados, altura = 300, ablTotal = 48971.49 }: ABLClassificacaoChartProps) {
  if (!dados || dados.length === 0) {
    return (
      <div style={{ height: altura }} className="flex items-center justify-center text-gray-500">
        Sem dados disponíveis
      </div>
    )
  }

  // Ordenar crescente (maior no topo em chart horizontal)
  const ordenados = [...dados].sort((a, b) => a.total_m2 - b.total_m2)

  const categorias = ordenados.map((d) => d.tipo_loja)
  const valores = ordenados.map((d) => d.total_m2)
  const cores = ordenados.map((d) => CORES[d.tipo_loja] || '#94a3b8')

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        const item = ordenados[p.dataIndex]
        const pctAbl = ablTotal > 0 ? ((item.total_m2 / ablTotal) * 100).toFixed(1) : '0'
        return `
          <div style="min-width:180px">
            <strong>${item.tipo_loja}</strong><br/>
            <span style="color:#888">Área:</span> <b>${formatNumber(item.total_m2, 0)} m²</b><br/>
            <span style="color:#888">% do ABL:</span> <b>${pctAbl}%</b><br/>
            <span style="color:#888">Operações:</span> <b>${item.qtd_lojas}</b><br/>
            <span style="color:#888">Vendas/m²:</span> <b>R$ ${Math.round(item.vendas_por_m2)}</b>
          </div>
        `
      },
    },
    grid: {
      left: 10,
      right: 90,
      top: 8,
      bottom: 8,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 11,
        color: '#999',
        formatter: (value: number) => {
          if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
          return String(value)
        },
      },
      splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: categorias,
      axisLabel: {
        fontSize: 12,
        color: '#444',
        fontWeight: 500,
      },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
    },
    series: [
      {
        type: 'bar',
        data: valores.map((v, i) => ({
          value: v,
          itemStyle: {
            color: cores[i],
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barMaxWidth: 36,
        barMinWidth: 18,
        label: {
          show: true,
          position: 'right',
          fontSize: 11,
          color: '#555',
          fontWeight: 500,
          formatter: (params: any) => {
            const item = ordenados[params.dataIndex]
            return `${formatNumber(params.value, 0)} m² (${item.qtd_lojas})`
          },
        },
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