// src/app/api/ingest/run-all/route.ts
import { NextResponse } from 'next/server'
import { ingestOrchestrator } from '@/lib/ingestion/orchestrator'

export const maxDuration = 60 // Timeout de 60 segundos

export async function POST() {
  try {
    console.log('========================================')
    console.log('INICIANDO INGESTÃO VIA API')
    console.log('========================================')
    
    const results = await ingestOrchestrator.runAll()
    
    const summary = results.map(r => ({
      arquivo: r.fileName,
      sucesso: r.success,
      linhasProcessadas: r.totalRows,
      linhasInseridas: r.totalInserted,
      duracao: `${(r.duration || 0) / 1000}s`,
      abas: r.sheets.map(s => `${s.name}: ${s.rowsInserted}/${s.rowsProcessed}`),
      erros: r.errors.slice(0, 5)
    }))

    console.log('Resultado:', JSON.stringify(summary, null, 2))
    
    return NextResponse.json({
      success: results.every(r => r.success),
      timestamp: new Date().toISOString(),
      results: summary
    })
  } catch (error: any) {
    console.error('ERRO NA INGESTÃO:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST para executar a ingestão completa',
    endpoints: {
      'POST /api/ingest/run-all': 'Executa ingestão de todos os arquivos',
    }
  })
}