// src/lib/ingestion/excel-parser.ts
import * as XLSX from 'xlsx'

// ============================================
// TIPOS
// ============================================

export interface ParsedSheet {
  name: string
  data: Record<string, any>[]
  headers: string[]
  rowCount: number
}

export interface ParsedWorkbook {
  fileName: string
  sheets: ParsedSheet[]
  parseDate: Date
}

export interface ColumnMapping {
  excel: string
  database: string
  type: 'string' | 'number' | 'date' | 'boolean'
  required?: boolean
  transform?: (value: any) => any
}

// ============================================
// MAPEAMENTOS DAS PLANILHAS (CORRIGIDO!)
// ============================================

export const SHEET_MAPPINGS = {
  // =============================================
  // Aba BASE_TRATADA -> staging_vendas
  // =============================================
  BASE_TRATADA: {
    targetTable: 'staging_vendas',
    columns: [
      { excel: 'LOJA_NOME', database: 'loja_nome', type: 'string' as const },
      { excel: 'COMPETENCIA_REAL', database: 'competencia', type: 'string' as const },
      { excel: 'M2', database: 'm2', type: 'number' as const },
      { excel: 'TIPO_LOJA', database: 'tipo_loja', type: 'string' as const },
      { excel: 'CLASSIFICACAO_LOJAS', database: 'classificacao_lojas', type: 'string' as const },
      { excel: 'CLASSIFICACAO_COB', database: 'classificacao_cob', type: 'string' as const },
      { excel: 'TIPO_REGISTRO', database: 'tipo_registro', type: 'string' as const },
      { excel: 'VENDAS', database: 'vendas', type: 'number' as const },
      { excel: 'COB_TOT', database: 'cobranca_total', type: 'number' as const },
      // ===== CORRIGIDO: Nomes iguais à planilha =====
      { excel: 'ALUG_PCT', database: 'alug_pct', type: 'number' as const },
      { excel: 'ALUG_MIN', database: 'alug_min', type: 'number' as const },
      { excel: 'CONDOMINIO', database: 'condominio', type: 'number' as const },
      { excel: 'ENERGIA', database: 'energia', type: 'number' as const },
      { excel: 'AGUA', database: 'agua', type: 'number' as const },
      { excel: 'AR', database: 'ar', type: 'number' as const },
      { excel: 'OUTRAS', database: 'outras', type: 'number' as const },
      { excel: 'IPTU', database: 'iptu', type: 'number' as const },
      { excel: 'FUNDO_PROMO', database: 'fundo_promo', type: 'number' as const },
      { excel: 'CD', database: 'cd', type: 'number' as const },
      { excel: 'CDU', database: 'cdu', type: 'number' as const },
      { excel: 'TAXA_ADM', database: 'taxa_adm', type: 'number' as const },
      { excel: 'FRT', database: 'frt', type: 'number' as const },
      // Colunas extras úteis
      { excel: 'LOJA_INTERNA', database: 'loja_interna', type: 'string' as const },
      { excel: 'ENTRA_NO_M2', database: 'entra_no_m2', type: 'string' as const },
    ] as ColumnMapping[]
  },

  // =============================================
  // Aba BASE_M2_MENSAL -> staging_base_m2
  // =============================================
  BASE_M2_MENSAL: {
    targetTable: 'staging_base_m2',
    columns: [
      { excel: 'COMPETENCIA_REAL', database: 'competencia', type: 'string' as const },
      { excel: 'LOJA_NOME', database: 'loja_nome', type: 'string' as const },
      { excel: 'M2', database: 'm2', type: 'number' as const },
      { excel: 'TIPO_LOJA', database: 'tipo_loja', type: 'string' as const },
      { excel: 'CATEGORIA_M2', database: 'categoria_m2', type: 'string' as const },
      { excel: 'ENTRA_NO_M2', database: 'entra_no_m2', type: 'string' as const },
    ] as ColumnMapping[]
  },

  // =============================================
  // Aba M2_MENSAL -> staging_abl
  // =============================================
  M2_MENSAL: {
    targetTable: 'staging_abl',
    columns: [
      { excel: 'COMPETENCIA_REAL', database: 'competencia', type: 'string' as const },
      { excel: 'LOJAS_QTDE', database: 'qtd_lojas', type: 'number' as const },
      { excel: 'QUIOSQUES_QTDE', database: 'qtd_quiosques', type: 'number' as const },
      { excel: 'DEPOSITOS_QTDE', database: 'qtd_depositos', type: 'number' as const },
      { excel: 'EVENTOS_QTDE', database: 'qtd_eventos', type: 'number' as const },
      { excel: 'TOTAL_UNIDADES', database: 'total_unidades', type: 'number' as const },
      { excel: 'TOTAL_M2_LOJAS', database: 'total_m2_lojas', type: 'number' as const },
    ] as ColumnMapping[]
  },

  // =============================================
  // ARQUIVO_FINAL_CONSOLIDADO - Template
  // =============================================
  ARQUIVO_FINAL_TEMPLATE: {
    targetTable: 'staging_lojas_consolidado',
    columns: [
      { excel: 'COMPETENCIA_REAL', database: 'competencia', type: 'string' as const },
      { excel: 'LOJA_NOME', database: 'loja_nome', type: 'string' as const },
      { excel: 'M2', database: 'm2', type: 'number' as const },
      { excel: 'ENTRA_NO_M2', database: 'entra_no_m2', type: 'string' as const },
      { excel: 'SEGMENTO_ABRASCE', database: 'segmento_abrasce', type: 'string' as const },
      { excel: 'VENDAS', database: 'vendas', type: 'number' as const },
    ] as ColumnMapping[]
  },
}

// ============================================
// PARSER
// ============================================

class ExcelParser {
  /**
   * Parse de um arquivo Excel completo
   */
  parseWorkbook(buffer: Buffer, fileName: string): ParsedWorkbook {
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: true,
      cellNF: true,
      cellStyles: true
    })

    const sheets: ParsedSheet[] = []

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: null,
        raw: false
      })

      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      const headers: string[] = []
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: col })]
        headers.push(cell ? String(cell.v) : `Col${col}`)
      }

      sheets.push({
        name: sheetName,
        data: jsonData as Record<string, any>[],
        headers,
        rowCount: jsonData.length
      })
    }

    return {
      fileName,
      sheets,
      parseDate: new Date()
    }
  }

  /**
   * Parse de uma aba específica com mapeamento
   */
  parseSheet(
    buffer: Buffer,
    sheetName: string,
    mapping: typeof SHEET_MAPPINGS[keyof typeof SHEET_MAPPINGS]
  ): { data: Record<string, any>[]; errors: string[] } {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })

    if (!workbook.SheetNames.includes(sheetName)) {
      return { data: [], errors: [`Aba "${sheetName}" não encontrada`] }
    }

    const worksheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null }) as Record<string, any>[]

    const errors: string[] = []
    const mappedData: Record<string, any>[] = []

    rawData.forEach((row, index) => {
      // Ignorar linhas completamente vazias
      const hasAnyValue = Object.values(row).some(v => v !== null && v !== undefined && v !== '')
      if (!hasAnyValue) {
        return
      }

      const mappedRow: Record<string, any> = {}
      let hasRequiredFields = true

      for (const col of mapping.columns) {
        const rawValue = row[col.excel]

        // Verificar campos obrigatórios
        if (col.required && (rawValue === null || rawValue === undefined || rawValue === '')) {
          const rowHasData = mapping.columns.some(c => {
            const v = row[c.excel]
            return v !== null && v !== undefined && v !== ''
          })

          if (rowHasData) {
            errors.push(`Linha ${index + 2}: Campo obrigatório "${col.excel}" vazio`)
          }
          hasRequiredFields = false
          continue
        }

        // Transformar valor
        let value = rawValue
        if (value !== null && value !== undefined) {
          switch (col.type) {
            case 'number':
              value = this.parseNumber(value)
              break
            case 'date':
              value = this.parseDate(value)
              break
            case 'boolean':
              value = Boolean(value)
              break
            case 'string':
            default:
              value = String(value).trim()
          }

          if (col.transform) {
            value = col.transform(value)
          }
        }

        mappedRow[col.database] = value
      }

      if (hasRequiredFields && Object.values(mappedRow).some(v => v !== null && v !== undefined && v !== '')) {
        mappedData.push(mappedRow)
      }
    })

    return { data: mappedData, errors }
  }

  private parseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null
    }

    if (typeof value === 'number') {
      return value
    }

    // Tenta converter string para número
    const str = String(value)
      .replace(/\s/g, '')      // Remove espaços
      .replace(/R\$/g, '')     // Remove R$
      .replace(/\./g, '')      // Remove pontos de milhar
      .replace(',', '.')       // Troca vírgula decimal por ponto

    const num = parseFloat(str)
    return isNaN(num) ? null : num
  }

  private parseDate(value: any): string | null {
    if (!value) return null

    if (value instanceof Date) {
      return value.toISOString().split('T')[0]
    }

    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }

    return null
  }

  listSheets(buffer: Buffer): string[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    return workbook.SheetNames
  }
}

export const excelParser = new ExcelParser()