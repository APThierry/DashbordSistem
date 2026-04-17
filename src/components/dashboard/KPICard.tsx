'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils/format'

interface KPICardProps {
  title: string
  value: number | null
  format?: 'currency' | 'percent' | 'number' | 'integer'
  trend?: number | null
  trendLabel?: string
  trendInverted?: boolean
  loading?: boolean
  className?: string
}

export function KPICard({
  title,
  value,
  format = 'number',
  trend,
  trendLabel,
  trendInverted = false,
  loading = false,
  className = ''
}: KPICardProps) {
  const formatValue = (val: number | null) => {
    if (val === null || val === undefined) return '-'
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percent':
        return formatPercent(val)
      case 'integer':
        return formatNumber(val, 0)
      default:
        return formatNumber(val)
    }
  }

  const getTrendColor = () => {
    if (trend === null || trend === undefined || trend === 0) return 'text-gray-500'
    const isPositive = trend > 0
    const isGood = trendInverted ? !isPositive : isPositive
    return isGood ? 'text-green-600' : 'text-red-600'
  }

  const getTrendIcon = () => {
    if (trend === null || trend === undefined || trend === 0) {
      return <Minus className="h-4 w-4" />
    }
    return trend > 0 
      ? <ArrowUp className="h-4 w-4" /> 
      : <ArrowDown className="h-4 w-4" />
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${className} hover:shadow-md transition-shadow`}>
      <CardContent className="p-6">
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
        
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center mt-2 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="ml-1 text-sm font-medium">
              {formatPercent(Math.abs(trend))}
            </span>
            {trendLabel && (
              <span className="ml-1 text-xs text-gray-500">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}