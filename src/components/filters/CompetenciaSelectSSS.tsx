// src/components/filters/CompetenciaSelectSSS.tsx
'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Calendar } from 'lucide-react'
import { formatCompetencia } from '@/lib/utils/format'
import { createClient } from '@/lib/supabase/client'

interface CompetenciaSelectSSSProps {
  value: string
  onChange: (competencia: string) => void
  className?: string
}

export function CompetenciaSelectSSS({ value, onChange, className }: CompetenciaSelectSSSProps) {
  const [competencias, setCompetencias] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCompetencias() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('vw_sss_resumo')
          .select('competencia_atual')
          .order('competencia_atual', { ascending: false })

        if (error) throw error

        const lista = data?.map(d => d.competencia_atual) || []
        setCompetencias(lista)
        
        if (!value && lista.length > 0) {
          onChange(lista[0])
        }
      } catch (err) {
        console.error('Erro ao buscar competências SSS:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCompetencias()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.competencia-select-sss')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className={`relative competencia-select-sss ${className || ''}`}>
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
          {competencias.length > 0 ? (
            competencias.map((comp) => (
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
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Nenhuma competência com SSS
            </div>
          )}
        </div>
      )}
    </div>
  )
}