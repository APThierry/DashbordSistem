// src/components/charts/EncargosM2Chart.tsx
'use client'

import { ReactECharts } from './ChartWrapper'
import type { EChartsOption } from 'echarts'

interface EncargosM2Item {
    competencia: string
    por_area_locada: number
    por_abl_total: number
}

interface EncargosM2ChartProps {
    dados: EncargosM2Item[]
    titulo: string
    corLocada?: string
    corTotal?: string
    altura?: number
}

function mesLabel(comp: string): string {
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    const [mes] = comp.split('/')
    const idx = parseInt(mes) - 1
    return meses[idx] || comp
}

function ordenarCronologico(dados: EncargosM2Item[]): EncargosM2Item[] {
    return [...dados].sort((a, b) => {
        const [mesA, anoA] = a.competencia.split('/')
        const [mesB, anoB] = b.competencia.split('/')
        const dateA = new Date(parseInt(anoA), parseInt(mesA) - 1)
        const dateB = new Date(parseInt(anoB), parseInt(mesB) - 1)
        return dateA.getTime() - dateB.getTime()
    })
}

export function EncargosM2Chart({
    dados,
    titulo,
    corLocada = '#8b5cf6',
    corTotal = '#22c55e',
    altura = 240,
}: EncargosM2ChartProps) {
    if (!dados || dados.length === 0) {
        return (
            <div style={{ height: altura }} className="flex items-center justify-center text-gray-400 text-sm">
                Sem dados disponíveis
            </div>
        )
    }

    const ordenados = ordenarCronologico(dados)
    const categorias = ordenados.map((d) => mesLabel(d.competencia))
    const valoresLocada = ordenados.map((d) => Math.round(d.por_area_locada * 100) / 100)
    const valoresTotal = ordenados.map((d) => Math.round(d.por_abl_total * 100) / 100)

    const option: EChartsOption = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            textStyle: { color: '#333', fontSize: 12 },
            formatter: function (params: any) {
                var items = Array.isArray(params) ? params : [params]
                var idx = items[0]?.dataIndex
                var comp = ordenados[idx]?.competencia || ''
                var html = '<strong>' + comp + '</strong><br/>'
                for (var i = 0; i < items.length; i++) {
                    var item = items[i]
                    var valor = Number(item.value) || 0
                    html +=
                        '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' +
                        item.color +
                        ';margin-right:6px"></span>' +
                        item.seriesName +
                        ': <b>R$ ' +
                        valor.toFixed(2).replace('.', ',') +
                        '</b><br/>'
                }
                return html
            },
        },
        legend: {
            bottom: 0,
            textStyle: { fontSize: 10, color: '#888' },
            itemWidth: 16,
            itemHeight: 3,
            itemGap: 12,
        },
        grid: {
            left: 12,
            right: 12,
            top: 12,
            bottom: 40,
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: categorias,
            boundaryGap: false,
            axisLabel: { fontSize: 10, color: '#999' },
            axisTick: { show: false },
            axisLine: { lineStyle: { color: '#e5e7eb' } },
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                fontSize: 10,
                color: '#999',
                formatter: function (value: number) {
                    return 'R$' + value.toFixed(0)
                },
            },
            splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
            axisLine: { show: false },
            axisTick: { show: false },
        },
        series: [
            {
                name: 'Área Locada',
                type: 'line',
                data: valoresLocada,
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                showSymbol: true,
                lineStyle: { width: 2.5, color: corLocada },
                itemStyle: { color: corLocada, borderWidth: 2, borderColor: '#fff' },
                emphasis: {
                    itemStyle: { borderWidth: 3, borderColor: corLocada },
                    scale: true,
                },
            },
            {
                name: 'ABL Total',
                type: 'line',
                data: valoresTotal,
                smooth: true,
                symbol: 'triangle',
                symbolSize: 6,
                showSymbol: true,
                lineStyle: { width: 2.5, color: corTotal },
                itemStyle: { color: corTotal, borderWidth: 2, borderColor: '#fff' },
                emphasis: {
                    itemStyle: { borderWidth: 3, borderColor: corTotal },
                    scale: true,
                },
            },
        ],
    }

    return (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">{titulo}</h4>
            <div style={{ height: altura }}>
                <ReactECharts
                    option={option}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'canvas' }}
                />
            </div>
        </div>
    )
}