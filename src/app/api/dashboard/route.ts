// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const competencia = searchParams.get('competencia')
  const filtroTipo = searchParams.get('filtroTipo') || 'todos'
  const sortField = searchParams.get('sortField') || 'vendas'
  const sortDirection = searchParams.get('sortDirection') || 'desc'

  if (!competencia) {
    return NextResponse.json({ error: 'Competência obrigatória' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    // Buscar todos os dados da competência
    const { data: resumo } = await supabase
      .from('staging_vendas')
      .select('*')
      .eq('competencia', competencia)

    // Buscar Operações Totais da staging_abl (fonte correta = planilha M2_MENSAL coluna F)
    const { data: ablData } = await supabase
      .from('staging_abl')
      .select('total_unidades')
      .eq('competencia', competencia)
      .single()

    const operacoesTotais = ablData?.total_unidades || (resumo || []).length

    // Calcular totais
    const totais = (resumo || []).reduce((acc, row) => ({
      vendas: acc.vendas + (row.vendas || 0),
      cobranca: acc.cobranca + (row.cobranca_total || 0),
      alug_pct: acc.alug_pct + (row.alug_pct || 0),
      alug_min: acc.alug_min + (row.alug_min || 0),
      condominio: acc.condominio + (row.condominio || 0),
      energia: acc.energia + (row.energia || 0),
      agua: acc.agua + (row.agua || 0),
      iptu: acc.iptu + (row.iptu || 0),
      fundo_promo: acc.fundo_promo + (row.fundo_promo || 0),
      taxa_adm: acc.taxa_adm + (row.taxa_adm || 0),
      frt: acc.frt + (row.frt || 0),
      ar: acc.ar + (row.ar || 0),
      cd: acc.cd + (row.cd || 0),
      cdu: acc.cdu + (row.cdu || 0),
      outras: acc.outras + (row.outras || 0),
    }), {
      vendas: 0, cobranca: 0, alug_pct: 0, alug_min: 0,
      condominio: 0, energia: 0, agua: 0, iptu: 0, fundo_promo: 0,
      taxa_adm: 0, frt: 0, ar: 0, cd: 0, cdu: 0, outras: 0
    })

    // Aluguel = % + Mínimo
    const aluguel = totais.alug_pct + totais.alug_min

    // Específicos
    const especificos = totais.iptu + totais.fundo_promo + totais.taxa_adm +
      totais.frt + totais.ar + totais.cd + totais.cdu + totais.outras

    // ABL do staging_vendas
    const areaLocada = (resumo || [])
      .filter(row => row.entra_no_m2?.toUpperCase() === 'SIM')
      .reduce((sum, row) => sum + (row.m2 || 0), 0)

    // Evolução Mensal
    const { data: todasCompetencias } = await supabase
      .from('staging_vendas')
      .select('competencia')
      .not('competencia', 'is', null)

    const competenciasUnicas = [...new Set((todasCompetencias || []).map(d => d.competencia))].filter(Boolean)

    const evolucaoPromises = competenciasUnicas.map(async (comp) => {
      const { data } = await supabase
        .from('staging_vendas')
        .select('vendas, cobranca_total')
        .eq('competencia', comp)

      const tots = (data || []).reduce((a, r) => ({
        vendas: a.vendas + (r.vendas || 0),
        cobranca: a.cobranca + (r.cobranca_total || 0)
      }), { vendas: 0, cobranca: 0 })

      return { competencia: comp, total_vendas: tots.vendas, total_cobranca: tots.cobranca }
    })

    const evolucaoRaw = await Promise.all(evolucaoPromises)

    const evolucaoMensal = evolucaoRaw
      .sort((a, b) => {
        const [mesA, anoA] = a.competencia.split('/')
        const [mesB, anoB] = b.competencia.split('/')
        const dateA = new Date(parseInt(anoA), parseInt(mesA) - 1)
        const dateB = new Date(parseInt(anoB), parseInt(mesB) - 1)
        return dateA.getTime() - dateB.getTime()
      })
      .slice(-12)

    // Top 10 Lojas
    const orderColumn = sortField === 'cobranca' ? 'cobranca_total' : 'vendas'
    const ascending = sortDirection === 'asc'

    let query = supabase
      .from('staging_vendas')
      .select('loja_nome, tipo_loja, m2, vendas, cobranca_total')
      .eq('competencia', competencia)
      .gt(orderColumn, 0)
      .order(orderColumn, { ascending })
      .limit(10)

    if (filtroTipo && filtroTipo !== 'todos') {
      query = query.eq('tipo_loja', filtroTipo)
    }

    const { data: topLojas } = await query

    return NextResponse.json({
      kpis: {
        vendas: totais.vendas,
        cobranca: totais.cobranca,
        areaLocada,
        operacoesTotais,
      },
      detalheCobranca: {
        aluguel,
        condominio: totais.condominio,
        energia: totais.energia,
        agua: totais.agua,
        especificos,
        _breakdown: {
          alug_pct: totais.alug_pct,
          alug_min: totais.alug_min,
          iptu: totais.iptu,
          fundo_promo: totais.fundo_promo,
          taxa_adm: totais.taxa_adm,
          frt: totais.frt,
          ar: totais.ar,
          cd: totais.cd,
          cdu: totais.cdu,
          outras: totais.outras
        }
      },
      evolucaoMensal,
      topLojas: (topLojas || []).map(l => ({
        loja_nome: l.loja_nome,
        tipo_loja: l.tipo_loja || 'N/A',
        m2: l.m2 || 0,
        vendas: l.vendas || 0,
        cobranca: l.cobranca_total || 0,
        percentual: l.vendas > 0 ? ((l.cobranca_total || 0) / l.vendas) * 100 : 0
      }))
    })
  } catch (error) {
    console.error('Erro no dashboard:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}