// src/components/charts/SegmentosChart.tsx
'use client'

import { ReactECharts } from './ChartWrapper'
import type { EChartsOption } from 'echarts'
import { formatCurrencyCompact } from '@/lib/utils/format'

interface SegmentoData {
  segmento: string
  qtd_lojas: number
  total_vendas: number
  total_m2?: number
  vendas_por_m2?: number
}

interface SegmentosChartProps {
  dados: SegmentoData[]
  altura?: number
  tipo?: 'vendas' | 'lojas'
}

// 7 segmentos principais — tudo que não estiver aqui vira "Demais Segmentos"
const SEGMENTOS_PRINCIPAIS = [
  'Alimentação e Bebidas',
  'Conveniência / Serviços',
  'Lazer e Entretenimento',
  'Artigos Eletrônicos / Tecnologia da Informação (TI)',
  'Perfumaria, Maquiagem e Cosméticos',
  'Telefonia e Acessórios',
  'Vestuário',
]

const CORES: Record<string, string> = {
  'Alimentação e Bebidas': '#22c55e',
  'Conveniência / Serviços': '#3b82f6',
  'Lazer e Entretenimento': '#f59e0b',
  'Artigos Eletrônicos / Tecnologia da Informação (TI)': '#8b5cf6',
  'Perfumaria, Maquiagem e Cosméticos': '#ec4899',
  'Telefonia e Acessórios': '#06b6d4',
  'Vestuário': '#f97316',
  'Demais Segmentos': '#94a3b8',
}

function agruparSegmentos(dados: SegmentoData[]): SegmentoData[] {
  const principais: SegmentoData[] = []
  let demais: SegmentoData = {
    segmento: 'Demais Segmentos',
    qtd_lojas: 0,
    total_vendas: 0,
    total_m2: 0,
    vendas_por_m2: 0,
  }

  dados.forEach((d) => {
    if (SEGMENTOS_PRINCIPAIS.includes(d.segmento)) {
      principais.push(d)
    } else {
      demais.qtd_lojas += d.qtd_lojas
      demais.total_vendas += d.total_vendas
      demais.total_m2! += d.total_m2 || 0
    }
  })

  if (demais.total_m2! > 0) {
    demais.vendas_por_m2 = demais.total_vendas / demais.total_m2!
  }

  const resultado = [...principais]
  if (demais.qtd_lojas > 0) {
    resultado.push(demais)
  }

  return resultado
}

export function SegmentosChart({ dados, altura = 400, tipo = 'vendas' }: SegmentosChartProps) {
  if (!dados || dados.length === 0) {
    return (
      <div style={{ height: altura }} className="flex items-center justify-center text-gray-500">
        Sem dados de segmentos disponíveis
      </div>
    )
  }

  const agrupados = agruparSegmentos(dados)

  // Ordenar CRESCENTE para que o maior fique no topo (ECharts horizontal renderiza de baixo pra cima)
  const ordenados = [...agrupados].sort((a, b) =>
    tipo === 'vendas' ? a.total_vendas - b.total_vendas : a.qtd_lojas - b.qtd_lojas
  )

  const categorias = ordenados.map((d) => d.segmento)
  const valores = ordenados.map((d) => (tipo === 'vendas' ? d.total_vendas : d.qtd_lojas))
  const cores = ordenados.map((d) => CORES[d.segmento] || '#94a3b8')

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        const item = ordenados[p.dataIndex]
        return `
          <div style="min-width:200px">
            <strong>${item.segmento}</strong><br/>
            <span style="color:#888">Operações:</span> <b>${item.qtd_lojas}</b><br/>
            <span style="color:#888">Vendas:</span> <b>${formatCurrencyCompact(item.total_vendas)}</b><br/>
            ${item.vendas_por_m2
            ? `<span style="color:#888">Vendas/m²:</span> <b>R$ ${Math.round(item.vendas_por_m2)}</b>`
            : ''}
          </div>
        `
      },
    },
    grid: {
      left: 10,
      right: tipo === 'vendas' ? 80 : 50,
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
          if (tipo === 'vendas') return formatCurrencyCompact(value)
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
        fontSize: 11,
        color: '#444',
        width: 160,
        overflow: 'truncate',
        ellipsis: '...',
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
        barMaxWidth: 32,
        barMinWidth: 16,
        label: {
          show: true,
          position: 'right',
          fontSize: 11,
          color: '#555',
          fontWeight: 500,
          formatter: (params: any) => {
            if (tipo === 'vendas') return formatCurrencyCompact(params.value)
            return `${params.value} lojas`
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