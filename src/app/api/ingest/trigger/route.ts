// src/app/api/ingest/trigger/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ingestOrchestrator } from '@/lib/ingestion/orchestrator'
import { graphClient, DriveItem } from '@/lib/microsoft/graph-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    
    const options = {
      fileName: body.fileName,
      fileId: body.fileId,
      sheets: body.sheets,
      dryRun: body.dryRun || false
    }

    console.log('Iniciando ingestão:', options)
    
    const result = await ingestOrchestrator.run(options)

    return NextResponse.json({
      success: result.success,
      data: result
    })

  } catch (error: any) {
    console.error('Erro na API de ingestão:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'test'
    const folder = searchParams.get('folder') || ''

    if (action === 'list') {
      // Listar arquivos
      const files = folder 
        ? await graphClient.listFilesInFolder(folder)
        : await graphClient.listFiles()
      
      return NextResponse.json({
        success: true,
        folder: folder || '(raiz)',
        message: `${files.length} arquivo(s) encontrado(s)`,
        files: files.map((f: DriveItem) => ({
          id: f.id,
          name: f.name,
          size: f.size,
          webUrl: f.webUrl,
          lastModified: f.lastModifiedDateTime,
          isFolder: !!f.folder,
          mimeType: f.file?.mimeType
        }))
      })
    }

    // Testar conexão (padrão)
    const result = await graphClient.testConnection()
    return NextResponse.json(result)

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}