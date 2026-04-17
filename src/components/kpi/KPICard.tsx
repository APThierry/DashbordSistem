// src/components/kpi/KPICard.tsx
'use client'

import { cn } from '@/lib/utils'
import { 
  formatCurrency, 
  formatNumber, 
  formatArea,
  getVariacaoInfo 
} from '@/lib/utils/format'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  Percent,
  SquareStack,
  Hash
} from 'lucide-react'

interface KPICardProps {
  titulo: string
  valor: number
  formato: 'moeda' | 'percentual' | 'numero' | 'area'
  variacao?: number | null  // ← Aceita null também
  periodo?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const formatadores = {
  moeda: formatCurrency,
  percentual: (v: number) => `${v.toFixed(1)}%`,
  numero: (v: number) => formatNumber(v),
  area: formatArea,
}

const icones = {
  moeda: DollarSign,
  percentual: Percent,
  numero: Hash,
  area: SquareStack,
}

export function KPICard({ 
  titulo, 
  valor, 
  formato, 
  variacao, 
  periodo,
  className,
  size = 'md'
}: KPICardProps) {
  const valorFormatado = formatadores[formato](valor)
  // Só mostra variação se não for null/undefined
  const variacaoInfo = variacao != null ? getVariacaoInfo(variacao) : null
  const Icone = icones[formato]

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  const valorSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <div 
      className={cn(
        'bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow',
        sizeClasses[size],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {titulo}
          </p>
          <p className={cn('font-bold tracking-tight', valorSizeClasses[size])}>
            {valorFormatado}
          </p>
        </div>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icone className="h-5 w-5 text-primary" />
        </div>
      </div>

      {variacaoInfo && (
        <div className="mt-3 flex items-center gap-1.5">
          {variacaoInfo.cor === 'green' ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : variacaoInfo.cor === 'red' ? (
            <TrendingDown className="h-4 w-4 text-red-600" />
          ) : (
            <Minus className="h-4 w-4 text-gray-400" />
          )}
          <span 
            className={cn(
              'text-sm font-medium',
              variacaoInfo.cor === 'green' && 'text-green-600',
              variacaoInfo.cor === 'red' && 'text-red-600',
              variacaoInfo.cor === 'gray' && 'text-gray-500'
            )}
          >
            {variacaoInfo.texto}
          </span>
          {periodo && (
            <span className="text-xs text-muted-foreground">
              {periodo}
            </span>
          )}
        </div>
      )}
    </div>
  )
}