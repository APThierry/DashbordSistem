// src/components/charts/ComparativoYoYChart.tsx
'use client'

import { ReactECharts } from './ChartWrapper'
import type { EChartsOption } from 'echarts'
import { formatCurrencyCompact, formatCompetenciaCurta } from '@/lib/utils/format'

interface DadoMensal {
  competencia: string
  total_vendas: number
}

interface ComparativoYoYChartProps {
  dadosAnoAtual: DadoMensal[]
  dadosAnoAnterior: DadoMensal[]
  anoAtual: number
  altura?: number
}

export function ComparativoYoYChart({ 
  dadosAnoAtual, 
  dadosAnoAnterior, 
  anoAtual,
  altura = 300 
}: ComparativoYoYChartProps) {
  // Organizar por mês (1-12)
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  
  const getVendasPorMes = (dados: DadoMensal[]) => {
    const porMes = new Array(12).fill(0)
    dados.forEach(d => {
      const [mes] = d.competencia.split('/')
      const mesIdx = parseInt(mes) - 1
      if (mesIdx >= 0 && mesIdx < 12) {
        porMes[mesIdx] = d.total_vendas
      }
    })
    return porMes
  }

  const vendasAtual = getVendasPorMes(dadosAnoAtual)
  const vendasAnterior = getVendasPorMes(dadosAnoAnterior)

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        let html = `<strong>${params[0].axisValue}</strong><br/>`
        params.forEach((p: any) => {
          const valor = formatCurrencyCompact(p.value)
          html += `${p.marker} ${p.seriesName}: <strong>${valor}</strong><br/>`
        })
        
        // Calcular variação
        if (params.length === 2 && params[1].value > 0) {
          const variacao = ((params[0].value - params[1].value) / params[1].value * 100).toFixed(1)
          const cor = parseFloat(variacao) >= 0 ? '#22c55e' : '#ef4444'
          const sinal = parseFloat(variacao) >= 0 ? '+' : ''
          html += `<span style="color:${cor}">Variação: <strong>${sinal}${variacao}%</strong></span>`
        }
        
        return html
      }
    },
    legend: {
      data: [`${anoAtual}`, `${anoAtual - 1}`],
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
      data: meses,
      axisLabel: {
        color: '#888'
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
    series: [
      {
        name: `${anoAtual}`,
        type: 'bar',
        data: vendasAtual,
        itemStyle: {
          color: '#3b82f6',
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '35%'
      },
      {
        name: `${anoAtual - 1}`,
        type: 'bar',
        data: vendasAnterior,
        itemStyle: {
          color: '#cbd5e1',
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '35%'
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