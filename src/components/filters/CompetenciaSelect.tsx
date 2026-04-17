// src/components/filters/CompetenciaSelect.tsx
'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Calendar } from 'lucide-react'
import { formatCompetencia } from '@/lib/utils/format'
import { createClient } from '@/lib/supabase/client'

interface CompetenciaSelectProps {
  value: string
  onChange: (competencia: string) => void
  className?: string
}

export function CompetenciaSelect({ value, onChange, className }: CompetenciaSelectProps) {
  const [competencias, setCompetencias] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Buscar competências disponíveis
  useEffect(() => {
    async function fetchCompetencias() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('vw_resumo_mensal')
          .select('competencia')
          .order('competencia', { ascending: false })

        if (error) throw error

        const lista = data?.map(d => d.competencia) || []
        setCompetencias(lista)
        
        // Se não tem valor selecionado, seleciona o primeiro (mais recente)
        if (!value && lista.length > 0) {
          onChange(lista[0])
        }
      } catch (err) {
        console.error('Erro ao buscar competências:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCompetencias()
  }, [])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.competencia-select')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className={`relative competencia-select ${className || ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border hover:bg-accent transition-colors min-w-[140px]"
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium flex-1 text-left">
          {loading ? 'Carregando...' : formatCompetencia(value)}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !loading && (
        <div className="absolute top-full left-0 mt-1 w-full bg-card border rounded-lg shadow-lg z-50 max-h-[300px] overflow-y-auto">
          {competencias.map((comp) => (
            <button
              key={comp}
              onClick={() => {
                onChange(comp)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors ${
                comp === value 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : ''
              }`}
            >
              {formatCompetencia(comp)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}