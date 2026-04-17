// src/lib/utils/format.ts

/**
 * Formata número como moeda brasileira (R$)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata número com separadores de milhar
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formata como percentual
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Formata área (m²)
 */
export function formatArea(value: number): string {
  return `${formatNumber(value, 2)} m²`;
}

/**
 * Formata competência (01/2025 → Jan/2025)
 */
export function formatCompetencia(competencia: string): string {
  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  const [mes, ano] = competencia.split('/');
  const mesIndex = parseInt(mes, 10) - 1;
  return `${meses[mesIndex]}/${ano}`;
}

/**
 * Formata competência curta (01/2025 → Jan)
 */
export function formatCompetenciaCurta(competencia: string): string {
  const meses = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez'
  ];
  const [mes] = competencia.split('/');
  const mesIndex = parseInt(mes, 10) - 1;
  return meses[mesIndex];
}

/**
 * Retorna informações de variação (seta, cor, texto)
 */
export function getVariacaoInfo(variacao: number): {
  texto: string;
  cor: 'green' | 'red' | 'gray';
  seta: '↑' | '↓' | '→';
} {
  if (variacao > 0) {
    return {
      texto: `+${formatNumber(variacao, 2)}%`,
      cor: 'green',
      seta: '↑',
    };
  } else if (variacao < 0) {
    return {
      texto: `${formatNumber(variacao, 2)}%`,
      cor: 'red',
      seta: '↓',
    };
  }
  return {
    texto: '0%',
    cor: 'gray',
    seta: '→',
  };
}

/**
 * Abrevia valor grande (1.000.000 → 1M)
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}

// src/lib/utils/format.ts
// ADICIONAR esta função (não existe no seu arquivo atual)

/**
 * Formata moeda de forma compacta (R$ 1,5M)
 */
export function formatCurrencyCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `R$ ${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)}K`
  }
  return `R$ ${value.toFixed(0)}`
}