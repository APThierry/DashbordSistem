// src/lib/utils/format.ts

// ============================================
// FUNÇÕES EXISTENTES (do chat anterior)
// ============================================

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export function formatCurrencyCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  
  if (Math.abs(value) >= 1_000_000_000) {
    return `R$ ${(value / 1_000_000_000).toFixed(1).replace('.', ',')}B`
  }
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)}K`
  }
  
  return formatCurrency(value)
}

export function formatPercent(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined) return '-'

  const formatted = value.toFixed(decimals).replace('.', ',')
  const sign = value > 0 ? '+' : ''

  return `${sign}${formatted}%`
}

export function formatNumber(
  value: number | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined) return '-'

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(value)
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '-'

  const units = ['B', 'KB', 'MB', 'GB']
  let unitIndex = 0
  let size = bytes

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '-'

  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }

  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)

  if (mins < 60) {
    return `${mins}m ${secs}s`
  }

  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60

  return `${hours}h ${remainingMins}m`
}

// ============================================
// NOVAS FUNÇÕES (para o dashboard)
// ============================================

/**
 * Formata área em m²
 */
export function formatArea(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return `${formatNumber(value, 2)} m²`
}

/**
 * Formata competência (01/2025 → Jan/2025)
 */
export function formatCompetencia(competencia: string | null | undefined): string {
  if (!competencia) return '-'
  
  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ]
  
  // Tenta parse de diferentes formatos
  let mes: number
  let ano: string
  
  if (competencia.includes('/')) {
    // Formato: 01/2025
    const [mesStr, anoStr] = competencia.split('/')
    mes = parseInt(mesStr, 10) - 1
    ano = anoStr
  } else if (competencia.includes('-')) {
    // Formato: 2025-01
    const [anoStr, mesStr] = competencia.split('-')
    mes = parseInt(mesStr, 10) - 1
    ano = anoStr
  } else {
    return competencia
  }
  
  if (mes < 0 || mes > 11) return competencia
  
  return `${meses[mes]}/${ano}`
}

/**
 * Formata competência curta (01/2025 → jan)
 */
export function formatCompetenciaCurta(competencia: string | null | undefined): string {
  if (!competencia) return '-'
  
  const meses = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez'
  ]
  
  let mes: number
  
  if (competencia.includes('/')) {
    const [mesStr] = competencia.split('/')
    mes = parseInt(mesStr, 10) - 1
  } else if (competencia.includes('-')) {
    const [, mesStr] = competencia.split('-')
    mes = parseInt(mesStr, 10) - 1
  } else {
    return competencia
  }
  
  if (mes < 0 || mes > 11) return competencia
  
  return meses[mes]
}

/**
 * Retorna informações de variação (para badges/indicadores)
 */
export function getVariacaoInfo(variacao: number | null | undefined): {
  texto: string
  cor: 'green' | 'red' | 'gray'
  seta: '↑' | '↓' | '→'
} {
  if (variacao === null || variacao === undefined) {
    return {
      texto: '-',
      cor: 'gray',
      seta: '→',
    }
  }
  
  if (variacao > 0) {
    return {
      texto: `+${variacao.toFixed(2).replace('.', ',')}%`,
      cor: 'green',
      seta: '↑',
    }
  } else if (variacao < 0) {
    return {
      texto: `${variacao.toFixed(2).replace('.', ',')}%`,
      cor: 'red',
      seta: '↓',
    }
  }
  
  return {
    texto: '0%',
    cor: 'gray',
    seta: '→',
  }
}

/**
 * Abrevia valor grande (1.000.000 → 1M)
 */
export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1).replace('.', ',')}B`
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace('.', ',')}M`
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace('.', ',')}K`
  }
  
  return value.toString()
}

/**
 * Formata data ISO para exibição
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

/**
 * Formata data e hora
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Formata competência por extenso (01/2025 → Janeiro/2025)
 */
export function formatCompetenciaExtenso(competencia: string | null | undefined): string {
  if (!competencia) return '-'
  
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  
  let mes: number
  let ano: string
  
  if (competencia.includes('/')) {
    // Formato: 01/2025
    const [mesStr, anoStr] = competencia.split('/')
    mes = parseInt(mesStr, 10) - 1
    ano = anoStr
  } else if (competencia.includes('-')) {
    // Formato: 2025-01
    const [anoStr, mesStr] = competencia.split('-')
    mes = parseInt(mesStr, 10) - 1
    ano = anoStr
  } else {
    return competencia
  }
  
  if (mes < 0 || mes > 11) return competencia
  
  return `${meses[mes]}/${ano}`
}