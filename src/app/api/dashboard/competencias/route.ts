// src/app/api/dashboard/competencias/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()

        // Usar a função SQL que criamos
        const { data: compData, error } = await supabase.rpc('get_competencias_distintas')

        if (error) {
            console.error('Erro ao buscar competências:', error)
            return NextResponse.json({ competencias: [], tiposLoja: [] })
        }

        // Ordenar competências (mais recente primeiro)
        const competencias = (compData || [])
            .map((d: any) => d.competencia)
            .filter(Boolean)
            .sort((a: string, b: string) => {
                const [mesA, anoA] = a.split('/').map(Number)
                const [mesB, anoB] = b.split('/').map(Number)
                if (anoA !== anoB) return anoB - anoA
                return mesB - mesA
            })

        console.log('Competências encontradas:', competencias)

        // Buscar tipos de loja
        const { data: tipoData } = await supabase
            .from('staging_vendas')
            .select('tipo_loja')
            .not('tipo_loja', 'is', null)
            .limit(50000)

        const tiposSet = new Set<string>()
            ; (tipoData || []).forEach(d => {
                if (d.tipo_loja) tiposSet.add(d.tipo_loja)
            })

        return NextResponse.json({
            competencias,
            tiposLoja: Array.from(tiposSet).sort()
        })
    } catch (error) {
        console.error('Erro geral:', error)
        return NextResponse.json({ competencias: [], tiposLoja: [] })
    }
}