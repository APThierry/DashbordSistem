// src/lib/ingestion/orchestrator.ts
import { graphClient } from '@/lib/microsoft/graph-client'
import { excelParser, SHEET_MAPPINGS } from './excel-parser'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase com service role (server-side)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey)
}

// ============================================
// CONFIGURAÇÃO DOS ARQUIVOS
// ============================================

const FILE_CONFIG = {
  // Arquivo principal de cobrança (dentro da pasta PLANILHA TRATADA)
  COB_TRATADA: {
    folder: 'PLANILHA TRATADA',
    fileName: 'COB_TRATADA_CONSOLIDADA.xlsx',
    sheets: ['BASE_TRATADA', 'BASE_M2_MENSAL', 'M2_MENSAL'],
    priority: 1
  },

  // Arquivo consolidado de lojas (na raiz da pasta SISTEMA)
  ARQUIVO_FINAL: {
    folder: '',
    fileName: 'ARQUIVO_FINAL_CONSOLIDADO.xlsx',
    excludeSheets: ['LOG_ATUALIZACAO'],
    priority: 2
  }
}

// ============================================
// TIPOS
// ============================================

export interface IngestResult {
  success: boolean
  runId: string
  fileName: string
  startTime: Date
  endTime?: Date
  duration?: number
  sheets: {
    name: string
    rowsProcessed: number
    rowsInserted: number
    errors: string[]
  }[]
  totalRows: number
  totalInserted: number
  errors: string[]
}

export interface IngestOptions {
  fileName?: string
  fileId?: string
  folder?: string
  sheets?: string[]
  dryRun?: boolean
}

// ============================================
// ORQUESTRADOR
// ============================================

class IngestOrchestrator {

  /**
   * Encontra o arquivo pelo nome na pasta especificada
   */
  async findFile(folder: string, fileName: string): Promise<{ id: string; name: string } | null> {
    try {
      // Se folder vazio, lista na raiz do drive
      const files = folder
        ? await graphClient.listFilesInFolder(folder)
        : await graphClient.listFiles()

      // Buscar arquivo com nome exato (case-insensitive)
      const file = files.find(f =>
        f.name.toLowerCase() === fileName.toLowerCase() &&
        f.file?.mimeType?.includes('spreadsheet')
      )

      if (!file) {
        // Tenta buscar com pattern parcial
        const patternFile = files.find(f =>
          f.name.toLowerCase().includes(fileName.replace('.xlsx', '').toLowerCase()) &&
          f.name.toLowerCase().endsWith('.xlsx') &&
          f.file?.mimeType?.includes('spreadsheet')
        )

        if (patternFile) {
          console.log(`Arquivo encontrado por pattern: ${patternFile.name}`)
          return { id: patternFile.id, name: patternFile.name }
        }

        return null
      }

      console.log(`Arquivo encontrado: ${file.name} (modificado em ${file.lastModifiedDateTime})`)
      return { id: file.id, name: file.name }
    } catch (error) {
      console.error('Erro ao buscar arquivo:', error)
      return null
    }
  }

  /**
   * =========================================
   * MÉTODO PRINCIPAL: Executa ingestão de TODOS os arquivos
   * =========================================
   */
  async runAll(): Promise<IngestResult[]> {
    const results: IngestResult[] = []

    console.log('========================================')
    console.log('INICIANDO INGESTÃO COMPLETA')
    console.log('========================================')

    // 1. Processar COB_TRATADA_CONSOLIDADA
    console.log('\n=== [1/2] Processando COB_TRATADA_CONSOLIDADA ===')
    try {
      const cobResult = await this.run({
        fileName: FILE_CONFIG.COB_TRATADA.fileName,
        folder: FILE_CONFIG.COB_TRATADA.folder,
        sheets: FILE_CONFIG.COB_TRATADA.sheets
      })
      results.push(cobResult)
      console.log(`COB_TRATADA: ${cobResult.success ? '✓ Sucesso' : '✗ Erro'} - ${cobResult.totalInserted} linhas`)
    } catch (error: any) {
      console.error('Erro ao processar COB_TRATADA:', error.message)
    }

    // 2. Processar ARQUIVO_FINAL_CONSOLIDADO
    console.log('\n=== [2/2] Processando ARQUIVO_FINAL_CONSOLIDADO ===')
    try {
      const finalResult = await this.runArquivoFinal()
      results.push(finalResult)
      console.log(`ARQUIVO_FINAL: ${finalResult.success ? '✓ Sucesso' : '✗ Erro'} - ${finalResult.totalInserted} linhas`)
    } catch (error: any) {
      console.error('Erro ao processar ARQUIVO_FINAL:', error.message)
    }

    console.log('\n========================================')
    console.log('INGESTÃO COMPLETA FINALIZADA')
    console.log(`Total de arquivos: ${results.length}`)
    console.log(`Sucessos: ${results.filter(r => r.success).length}`)
    console.log('========================================')

    return results
  }

  /**
   * =========================================
   * Processa COB_TRATADA_CONSOLIDADA (arquivo principal)
   * =========================================
   */
  async run(options: IngestOptions = {}): Promise<IngestResult> {
    const runId = crypto.randomUUID()
    const startTime = new Date()

    const result: IngestResult = {
      success: false,
      runId,
      fileName: '',
      startTime,
      sheets: [],
      totalRows: 0,
      totalInserted: 0,
      errors: []
    }

    try {
      console.log(`[${runId.slice(0, 8)}] Iniciando ingestão...`)

      // 1. Determinar arquivo e pasta
      const folder = options.folder ?? FILE_CONFIG.COB_TRATADA.folder
      const fileName = options.fileName ?? FILE_CONFIG.COB_TRATADA.fileName

      // 2. Encontrar o arquivo
      let fileId = options.fileId
      if (!fileId) {
        console.log(`[${runId.slice(0, 8)}] Buscando "${fileName}" em "${folder || 'raiz'}"...`)

        const found = await this.findFile(folder, fileName)
        if (!found) {
          result.errors.push(`Arquivo "${fileName}" não encontrado`)
          return result
        }

        fileId = found.id
        result.fileName = found.name
      }

      console.log(`[${runId.slice(0, 8)}] Arquivo: ${result.fileName}`)

      // 3. Baixar arquivo
      console.log(`[${runId.slice(0, 8)}] Baixando arquivo...`)
      const buffer = await graphClient.downloadFileById(fileId)
      console.log(`[${runId.slice(0, 8)}] Arquivo baixado: ${buffer.length} bytes`)

      // 4. Listar abas disponíveis
      const availableSheets = excelParser.listSheets(buffer)
      console.log(`[${runId.slice(0, 8)}] Abas encontradas: ${availableSheets.join(', ')}`)

      // 5. Determinar quais abas processar
      const sheetsToProcess = options.sheets?.length
        ? options.sheets
        : FILE_CONFIG.COB_TRATADA.sheets

      // 6. Processar cada aba
      const supabase = getSupabaseAdmin()

      for (const sheetName of sheetsToProcess) {
        const mapping = SHEET_MAPPINGS[sheetName as keyof typeof SHEET_MAPPINGS]

        if (!mapping) {
          console.log(`[${runId.slice(0, 8)}] Aba "${sheetName}" sem mapeamento, pulando`)
          continue
        }

        if (!availableSheets.includes(sheetName)) {
          console.log(`[${runId.slice(0, 8)}] Aba "${sheetName}" não encontrada no arquivo, pulando`)
          continue
        }

        console.log(`[${runId.slice(0, 8)}] Processando aba: ${sheetName}`)

        const { data, errors } = excelParser.parseSheet(buffer, sheetName, mapping)

        const sheetResult = {
          name: sheetName,
          rowsProcessed: data.length,
          rowsInserted: 0,
          errors: errors
        }

        console.log(`[${runId.slice(0, 8)}] ${sheetName}: ${data.length} linhas parseadas`)

        // 7. Inserir no banco
        if (!options.dryRun && data.length > 0) {
          try {
            // Limpar tabela staging antes
            const { error: deleteError } = await supabase
              .from(mapping.targetTable)
              .delete()
              .gte('id', 0)

            if (deleteError) {
              console.warn(`[${runId.slice(0, 8)}] Aviso ao limpar ${mapping.targetTable}:`, deleteError.message)
            }

            // Adicionar run_id e created_at
            const dataWithMeta = data.map(row => ({
              ...row,
              run_id: runId,
              created_at: new Date().toISOString()
            }))

            // Inserir em lotes de 500
            const batchSize = 500
            for (let i = 0; i < dataWithMeta.length; i += batchSize) {
              const batch = dataWithMeta.slice(i, i + batchSize)
              const { error } = await supabase.from(mapping.targetTable).insert(batch)

              if (error) {
                sheetResult.errors.push(`Erro lote ${Math.floor(i / batchSize) + 1}: ${error.message}`)
                console.error(`[${runId.slice(0, 8)}] Erro:`, error.message)
              } else {
                sheetResult.rowsInserted += batch.length
              }
            }

            console.log(`[${runId.slice(0, 8)}] ${sheetName}: ${sheetResult.rowsInserted}/${data.length} inseridas`)
          } catch (err: any) {
            sheetResult.errors.push(`Erro de banco: ${err.message}`)
            console.error(`[${runId.slice(0, 8)}] Erro de banco:`, err)
          }
        } else if (options.dryRun) {
          sheetResult.rowsInserted = data.length
          console.log(`[${runId.slice(0, 8)}] ${sheetName}: ${data.length} linhas (dry run)`)
        }

        result.sheets.push(sheetResult)
        result.totalRows += sheetResult.rowsProcessed
        result.totalInserted += sheetResult.rowsInserted
        result.errors.push(...sheetResult.errors)
      }

      // 8. Definir resultado ANTES de salvar auditoria
      result.success = result.errors.length === 0
      result.endTime = new Date()
      result.duration = result.endTime.getTime() - startTime.getTime()

      // 9. Registrar auditoria (depois de definir success)
      if (!options.dryRun) {
        await this.logRun(result)
      }

      result.success = result.errors.length === 0
      result.endTime = new Date()
      result.duration = result.endTime.getTime() - startTime.getTime()

      console.log(`[${runId.slice(0, 8)}] Concluído em ${result.duration}ms`)
      return result

    } catch (error: any) {
      result.errors.push(error.message || 'Erro desconhecido')
      result.endTime = new Date()
      result.duration = result.endTime.getTime() - startTime.getTime()
      console.error(`[${runId.slice(0, 8)}] Erro:`, error)
      return result
    }
  }

  /**
   * =========================================
   * Processa ARQUIVO_FINAL_CONSOLIDADO (abas dinâmicas por mês)
   * =========================================
   */
  async runArquivoFinal(): Promise<IngestResult> {
    const runId = crypto.randomUUID()
    const startTime = new Date()
    const config = FILE_CONFIG.ARQUIVO_FINAL

    const result: IngestResult = {
      success: false,
      runId,
      fileName: config.fileName,
      startTime,
      sheets: [],
      totalRows: 0,
      totalInserted: 0,
      errors: []
    }

    try {
      console.log(`[${runId.slice(0, 8)}] Buscando ARQUIVO_FINAL_CONSOLIDADO...`)

      // 1. Encontrar arquivo na raiz
      const found = await this.findFile(config.folder, config.fileName)
      if (!found) {
        result.errors.push(`Arquivo "${config.fileName}" não encontrado`)
        return result
      }

      result.fileName = found.name

      // 2. Baixar
      const buffer = await graphClient.downloadFileById(found.id)
      console.log(`[${runId.slice(0, 8)}] Baixado: ${buffer.length} bytes`)

      // 3. Listar abas e filtrar excluídas
      const allSheets = excelParser.listSheets(buffer)
      const sheetsToProcess = allSheets.filter(
        s => !config.excludeSheets.includes(s)
      )

      console.log(`[${runId.slice(0, 8)}] Abas a processar: ${sheetsToProcess.join(', ')}`)

      // 4. Usar template de mapeamento
      const mapping = SHEET_MAPPINGS.ARQUIVO_FINAL_TEMPLATE
      if (!mapping) {
        result.errors.push('Mapeamento ARQUIVO_FINAL_TEMPLATE não encontrado')
        return result
      }

      // 5. Limpar tabela antes de inserir
      const supabase = getSupabaseAdmin()
      const { error: deleteError } = await supabase
        .from(mapping.targetTable)
        .delete()
        .gte('id', 0)

      if (deleteError) {
        console.warn(`[${runId.slice(0, 8)}] Aviso ao limpar:`, deleteError.message)
      }

      // 6. Processar cada aba
      for (const sheetName of sheetsToProcess) {
        console.log(`[${runId.slice(0, 8)}] Processando aba: ${sheetName}`)

        const { data, errors } = excelParser.parseSheet(buffer, sheetName, mapping)

        const sheetResult = {
          name: sheetName,
          rowsProcessed: data.length,
          rowsInserted: 0,
          errors
        }

        if (data.length > 0) {
          const dataWithMeta = data.map(row => ({
            ...row,
            run_id: runId,
            created_at: new Date().toISOString()
          }))

          // Inserir em lotes
          const batchSize = 500
          for (let i = 0; i < dataWithMeta.length; i += batchSize) {
            const batch = dataWithMeta.slice(i, i + batchSize)
            const { error } = await supabase
              .from(mapping.targetTable)
              .insert(batch)

            if (error) {
              sheetResult.errors.push(`Erro lote: ${error.message}`)
              console.error(`[${runId.slice(0, 8)}] Erro:`, error.message)
            } else {
              sheetResult.rowsInserted += batch.length
            }
          }
        }

        console.log(`[${runId.slice(0, 8)}] ${sheetName}: ${sheetResult.rowsInserted}/${data.length}`)

        result.sheets.push(sheetResult)
        result.totalRows += sheetResult.rowsProcessed
        result.totalInserted += sheetResult.rowsInserted
        result.errors.push(...sheetResult.errors)
      }

      // 7. Definir resultado ANTES de salvar auditoria
      result.success = result.errors.length === 0
      result.endTime = new Date()
      result.duration = result.endTime.getTime() - startTime.getTime()

      // 8. Auditoria (depois de definir success)
      await this.logRun(result)
      return result

    } catch (error: any) {
      result.errors.push(error.message)
      result.endTime = new Date()
      result.duration = result.endTime.getTime() - startTime.getTime()
      console.error(`[${runId.slice(0, 8)}] Erro:`, error)
      return result
    }
  }

  /**
   * Registra execução na tabela de auditoria
   */
  private async logRun(result: IngestResult): Promise<void> {
    try {
      const supabase = getSupabaseAdmin()

      await supabase.from('audit_runs').insert({
        id: result.runId,
        file_name: result.fileName,
        started_at: result.startTime.toISOString(),
        finished_at: result.endTime?.toISOString(),
        duration_ms: result.duration,
        status: result.success ? 'success' : 'error',
        total_rows: result.totalRows,
        inserted_rows: result.totalInserted,
        errors: result.errors,
        sheets_processed: result.sheets.map(s => s.name)
      })
    } catch (err) {
      console.error('Erro ao registrar auditoria:', err)
    }
  }

  /**
   * Testa conexão com SharePoint
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    return graphClient.testConnection()
  }
}

// Singleton
export const ingestOrchestrator = new IngestOrchestrator()